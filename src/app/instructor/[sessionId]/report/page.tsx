"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ReadinessHeatmap } from "@/components/instructor/readiness-heatmap";
import { InstructorWorkspaceNavigation } from "@/components/instructor/workspace-navigation";
import { LoadingState } from "@/components/ui/loading-state";
import { LOAssessmentCard } from "@/components/LOAssessmentCard";
import { TeachingBriefEvidenceMap } from "@/components/instructor/teaching-brief-evidence-map";
import { TeachingBriefFacilitationPivots } from "@/components/instructor/teaching-brief-facilitation-pivots";
import { getSessionPurposeBadgeClasses, getSessionPurposeOption, getHeatmapTitle } from "@/lib/session-purpose";
import type { LOAssessmentRecord } from "@/types";
import type { TeachingBriefV1 } from "@/lib/teaching-brief";
import { redactInternalIdentifiers } from "@/lib/report-presentation";

interface ReportData {
  id: string;
  sessionId: string;
  content: string;
  stats: string;
  generatedAt: string;
  brief: TeachingBriefV1 | null;
  reviewStateSummary: string;
  promptVersion: string | null;
  modelProvider: string | null;
  modelId: string | null;
  stale: boolean;
  regenerationAllowed: boolean;
  sessionPurpose?: string;
  loAssessments?: Array<
    LOAssessmentRecord & {
      studentSession: {
        id: string;
        studentName: string;
      };
    }
  >;
}

type ReportLOAssessment = NonNullable<ReportData["loAssessments"]>[number];

interface StudentLOAssessmentGroup {
  studentName: string;
  assessments: ReportLOAssessment[];
}

// ─── Section parser ────────────────────────────────────────────────────────────
// Splits report markdown by known section headers and returns them keyed by a
// normalised label. We render them in the new priority order:
// snapshot -> teaching moves -> heatmap -> gaps -> strengths -> per_student -> (rest)

const SECTION_PATTERNS: Array<{ key: string; patterns: string[] }> = [
  { key: "snapshot", patterns: ["SESSION SNAPSHOT"] },
  { key: "how_to_read", patterns: ["HOW TO READ THIS BRIEF"] },
  { key: "what_to_do", patterns: ["SUGGESTED TEACHING MOVES", "WHAT TO DO NEXT"] },
  {
    key: "heatmap",
    patterns: [
      "READINESS EVIDENCE MAP",
      "ACTIVATION EVIDENCE MAP",
      "CONSOLIDATION EVIDENCE MAP",
      "TRANSFER EVIDENCE MAP",
      "READINESS HEATMAP",
      "ACTIVATION HEATMAP",
      "CONSOLIDATION HEATMAP",
      "TRANSFER HEATMAP",
    ],
  },
  {
    key: "gaps",
    patterns: [
      "WHERE YOUR STUDENTS ARE NOT YET READY",
      "WHERE RETRIEVAL WAS WEAK",
      "WHAT REMAINS FRAGILE",
      "WHERE TRANSFER BROKE DOWN",
      "WHERE YOUR STUDENTS NEED HELP",
    ],
  },
  {
    key: "strengths",
    patterns: [
      "WHAT YOUR STUDENTS ARE READY FOR",
      "WHAT YOUR STUDENTS RECALLED WELL",
      "WHAT YOUR STUDENTS CONSOLIDATED",
      "WHERE YOUR STUDENTS SHOWED DEPTH",
      "WHAT YOUR STUDENTS UNDERSTOOD WELL",
    ],
  },
  { key: "per_student", patterns: ["PER-STUDENT NOTES"] },
  { key: "review_status", patterns: ["INSTRUCTOR REVIEW STATUS"] },
  { key: "disclaimer", patterns: ["AI AND FORMATIVE-USE DISCLAIMER"] },
];

interface ParsedSections {
  [key: string]: string;
  snapshot: string;
  how_to_read: string;
  what_to_do: string;
  heatmap: string;
  gaps: string;
  strengths: string;
  per_student: string;
  review_status: string;
  disclaimer: string;
  remainder: string;
}

function parseReportSections(content: string): ParsedSections {
  const result: ParsedSections = {
    snapshot: "",
    how_to_read: "",
    what_to_do: "",
    heatmap: "",
    gaps: "",
    strengths: "",
    per_student: "",
    review_status: "",
    disclaimer: "",
    remainder: "",
  };

  // Build a list of all section markers with their positions
  const markers: Array<{ index: number; key: string; length: number }> = [];

  for (const { key, patterns } of SECTION_PATTERNS) {
    for (const pattern of patterns) {
      const regex = new RegExp(
        `(^|\\n)(#{1,3}\\s*)?${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "i"
      );
      const match = content.match(regex);
      if (match && match.index !== undefined) {
        const lineStart = match.index + (match[1] === "\n" ? 1 : 0);
        markers.push({ index: lineStart, key, length: match[0].trim().length });
        break; // first pattern that matches wins
      }
    }
  }

  if (markers.length === 0) {
    result.remainder = content;
    return result;
  }

  markers.sort((a, b) => a.index - b.index);

  // Extract each section's content
  for (let i = 0; i < markers.length; i++) {
    const current = markers[i];
    const next = markers[i + 1];
    const sectionStart = content.indexOf("\n", current.index) + 1;
    const sectionEnd = next ? next.index : content.length;
    const sectionContent = content.slice(sectionStart, sectionEnd).trim();
    (result as Record<string, string>)[current.key] = sectionContent;
  }

  // Anything before the first marker is preamble
  if (markers[0].index > 0) {
    result.remainder = content.slice(0, markers[0].index).trim();
  }

  return result;
}

function normalizeOutcomeLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const params = useParams() as { sessionId: string };
  const [report, setReport] = useState<ReportData | null>(null);
  const [sessionPurpose, setSessionPurpose] = useState<string>("pre_class");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (forceRefresh = false) => {
    (forceRefresh ? setIsRefreshing : setIsLoading)(true);
    setError(null);
    try {
      const sessionRes = await fetch(`/api/sessions/${params.sessionId}`);
      let reportRes = await fetch(`/api/sessions/${params.sessionId}/report`, {
        method: forceRefresh ? "POST" : "GET",
      });
      let data = (await reportRes.json()) as ReportData & {
        error?: string;
        code?: string;
        regenerationAllowed?: boolean;
      };

      if (
        !forceRefresh &&
        reportRes.status === 404 &&
        data.code === "REPORT_NOT_FOUND" &&
        data.regenerationAllowed
      ) {
        reportRes = await fetch(`/api/sessions/${params.sessionId}/report`, {
          method: "POST",
        });
        data = await reportRes.json();
      }

      if (!reportRes.ok) {
        throw new Error(data.error || "Failed to generate or fetch report");
      }
      setReport(data);

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        setSessionPurpose(sessionData.sessionPurpose ?? "pre_class");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.sessionId]);

  const handleExport = async () => {
    if (report?.stale) {
      setExportError("Refresh this teaching brief before exporting it.");
      return;
    }

    setIsExporting(true);
    setExportError(null);
    try {
      const response = await fetch(
        "/api/sessions/" + params.sessionId + "/report/export"
      );
      if (!response.ok) {
        let message = "We could not create the PDF. Please try again.";
        try {
          const body = (await response.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // Keep the safe fallback when the server does not return JSON.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename =
        disposition.match(/filename="?([^";]+)"?/i)?.[1] ??
        "ai-demo-teaching-brief.pdf";
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (exportFailure: unknown) {
      setExportError(
        exportFailure instanceof Error
          ? exportFailure.message
          : "We could not create the PDF. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <LoadingState variant="page" message="Building instructor recommendations…" />;
  }

  if (error) {
    return (
      <main className="minerva-page">
        <div className="minerva-shell space-y-6 py-8">
          <div className="border border-[rgba(223,47,38,0.24)] bg-[rgba(223,47,38,0.08)] px-4 py-3 text-sm text-[var(--signal)]">
            {error}
          </div>
          <Link href={`/instructor/${params.sessionId}`} className="minerva-button minerva-button-secondary w-max">
            Back to setup
          </Link>
        </div>
      </main>
    );
  }

  if (!report) return null;

  const purposeOption = getSessionPurposeOption(sessionPurpose);
  const heatmapTitle = getHeatmapTitle(sessionPurpose) ?? "Readiness Heatmap";
  const sections = parseReportSections(redactInternalIdentifiers(report.content));
  const brief = report.brief;

  const loAssessmentsByStudent = (report.loAssessments ?? []).reduce(
    (acc: any, assessment: any) => {
      const studentId = assessment.studentSession.id;
      const studentName = assessment.studentSession.studentName;
      const group = acc[studentId] ?? (acc[studentId] = { studentName, assessments: [] });
      group.assessments.push(assessment);
      return acc;
    },
    {} as Record<string, StudentLOAssessmentGroup>
  );

  return (
    <main className="minerva-page">
      <div className="minerva-shell space-y-6 py-8">
        {/* Header */}
        <div className="minerva-card p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <nav className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dim-grey)]">
                <Link href="/instructor" className="transition-colors hover:text-[var(--teal)]">
                  Sessions
                </Link>
                <span>/</span>
                <Link href={`/instructor/${params.sessionId}`} className="transition-colors hover:text-[var(--teal)]">
                  Setup
                </Link>
                <span>/</span>
                <span className="text-[var(--charcoal)]">Teaching brief</span>
              </nav>
              <h1 className="mt-4 font-serif text-[42px] leading-[0.96] tracking-[-0.03em] text-[var(--charcoal)]">
                Teaching brief
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getSessionPurposeBadgeClasses(sessionPurpose)}`}
                >
                  {purposeOption.shortLabel}
                </span>
                <p className="text-sm text-[var(--dim-grey)]">
                  Generated {new Date(report.generatedAt).toLocaleString()}
                </p>
                <span className="rounded-full border border-[var(--rule)] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--dim-grey)]">
                  {brief?.instructorReview.state === "reviewed"
                    ? "Reviewed evidence"
                    : brief?.instructorReview.state === "partially_reviewed"
                      ? "Partially reviewed"
                      : "Needs instructor review"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/instructor/${params.sessionId}`} className="minerva-button minerva-button-secondary">
                Back to setup
              </Link>
              {report.regenerationAllowed ? (
                <button
                  onClick={() => fetchReport(true)}
                  className="minerva-button minerva-button-secondary"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? "Refreshing..." : "Refresh brief"}
                </button>
              ) : null}
              <button
                onClick={handleExport}
                className="minerva-button"
                disabled={isExporting || report.stale}
                aria-describedby={report.stale ? "stale-brief-message" : undefined}
              >
                {isExporting ? "Preparing PDF..." : "Export PDF"}
              </button>
            </div>
          </div>
          <div className="mt-6">
            <InstructorWorkspaceNavigation sessionId={params.sessionId} />
          </div>
        </div>

        {brief ? (
          <section className="minerva-card border-l-4 border-[var(--signal)] p-6 md:p-8">
            <p className="eyebrow eyebrow-rose">Formative teaching aid</p>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--charcoal)]">
              {brief.formativeUse.statement} {brief.formativeUse.aiGeneratedStatement}
            </p>
            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-[var(--signal)]">
              {brief.formativeUse.gradingBoundary}
            </p>
          </section>
        ) : null}

        {report.stale ? (
          <section
            id="stale-brief-message"
            className="minerva-card border-l-4 border-[#906f12] p-5 text-sm text-[var(--charcoal)]"
            role="status"
          >
            <p className="font-semibold">This brief is older than the current evidence or review state.</p>
            <p className="mt-1 text-[var(--dim-grey)]">
              {report.regenerationAllowed
                ? "Refresh the brief before using it for planning or export."
                : "Ask a session owner or editor to refresh it before consequential use."}
            </p>
          </section>
        ) : null}

        {exportError ? (
          <section
            className="minerva-card border-l-4 border-[var(--signal)] p-5 text-sm text-[var(--charcoal)]"
            role="alert"
          >
            <p className="font-semibold">PDF export was not completed.</p>
            <p className="mt-1 text-[var(--dim-grey)]">{exportError}</p>
          </section>
        ) : null}

        {brief ? (
          <section className="minerva-card p-6 md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="eyebrow eyebrow-teal">How to read this brief</p>
                <h2 className="mt-3 font-serif text-[34px] leading-none text-[var(--charcoal)]">
                  Evidence first, inference second.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[var(--dim-grey)]">
                {brief.instructorReview.summary}
              </p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {brief.howToRead.map((item: any) => (
                <div key={item.title} className="border border-[var(--rule)] p-4">
                  <h3 className="text-sm font-semibold text-[var(--charcoal)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--dim-grey)]">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Session snapshot */}
        {sections.snapshot && (
          <section className="minerva-card p-6 md:p-8">
            <div className="prose prose-slate max-w-none text-sm text-[var(--charcoal)]">
              <ReactMarkdown>{sections.snapshot}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* What to do next — ELEVATED to top */}
        {sections.what_to_do && (
          <section className="minerva-card border-l-4 border-[var(--teal)] p-6 md:p-8">
            <h2 className="font-serif text-[28px] leading-[1] tracking-[-0.03em] text-[var(--charcoal)]">
              Suggested teaching moves
            </h2>
            <div className="prose prose-slate mt-4 max-w-none text-[var(--charcoal)]">
              <ReactMarkdown>{sections.what_to_do}</ReactMarkdown>
            </div>
          </section>
        )}

        {brief ? (
          <TeachingBriefFacilitationPivots
            sessionId={params.sessionId}
            pivots={brief.facilitationPivots}
          />
        ) : null}

        {/* Heatmap */}
        <section className="minerva-card p-6 md:p-8">
          <h2 className="font-serif text-[34px] leading-[1] tracking-[-0.03em] text-[var(--charcoal)]">
            {brief?.evidenceMap.title ?? heatmapTitle}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--dim-grey)]">
            Each item starts with the teaching meaning. Open the details when you want
            learner quotes, source passages, confidence, missing evidence, and review state.
          </p>
          <div className="mt-6">
            {brief ? (
              <TeachingBriefEvidenceMap
                sessionId={params.sessionId}
                evidenceMap={brief.evidenceMap}
              />
            ) : (
              <ReadinessHeatmap reportContent={report.content} sessionPurpose={sessionPurpose} />
            )}
          </div>
        </section>

        {/* Gaps */}
        {sections.gaps && (
          <section className="minerva-card p-6 md:p-8">
            <div className="prose prose-slate max-w-none text-[var(--charcoal)]">
              <ReactMarkdown>{sections.gaps}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Strengths */}
        {sections.strengths && (
          <section className="minerva-card p-6 md:p-8">
            <div className="prose prose-slate max-w-none text-[var(--charcoal)]">
              <ReactMarkdown>{sections.strengths}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Per-student */}
        {sections.per_student && (
          <section className="minerva-card p-6 md:p-8">
            <h2 className="font-serif text-[34px] leading-[1] tracking-[-0.03em] text-[var(--charcoal)]">
              Per-student notes
            </h2>
            <div className="prose prose-slate mt-4 max-w-none text-[var(--charcoal)]">
              <ReactMarkdown>{sections.per_student}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Any remainder not captured by section parser */}
        {sections.remainder && (
          <section className="minerva-card p-8 md:p-12">
            <div className="prose prose-slate max-w-none text-[var(--charcoal)]">
              <ReactMarkdown>{sections.remainder}</ReactMarkdown>
            </div>
          </section>
        )}

        {/* Learning outcome evidence */}
        {Object.keys(loAssessmentsByStudent).length > 0 && (
          <section className="minerva-card p-8 md:p-12">
            <h3 className="font-serif text-[34px] leading-[1] tracking-[-0.03em] text-[var(--charcoal)]">
              Learning outcome evidence
            </h3>
            <p className="mt-3 max-w-[44rem] text-sm text-[var(--dim-grey)]">
              These signals are formative and AI-generated. They reflect evidence observed during the AI_demo
              session and should be reviewed by the instructor before informing any grading decisions.
            </p>
            <div className="mt-8 space-y-8">
              {(Object.entries(loAssessmentsByStudent) as [string, StudentLOAssessmentGroup][]).map(([studentId, group]) => (
                <div key={studentId} className="space-y-3">
                  <h4 className="text-base font-semibold text-[var(--charcoal)]">{group.studentName}</h4>
                  <div className="space-y-3">
                    {(group.assessments ?? []).map((assessment: any) => (
                      <LOAssessmentCard
                        key={assessment.id}
                        assessment={assessment}
                        reviewContext={brief?.learningOutcomeEvidence.find(
                          (item: any) =>
                            normalizeOutcomeLabel(item.label) ===
                            normalizeOutcomeLabel(assessment.learningOutcome)
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {brief ? (
          <section className="minerva-card p-6 text-xs leading-5 text-[var(--dim-grey)] md:p-8">
            <p>
              Brief schema {brief.schemaVersion} · Prompt {brief.promptVersion} · Model {brief.modelProvider}/{brief.modelId}
            </p>
            <p className="mt-1">
              Generated {new Date(brief.generatedAt).toLocaleString()} · Review state: {brief.instructorReview.state.replaceAll("_", " ")}
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
