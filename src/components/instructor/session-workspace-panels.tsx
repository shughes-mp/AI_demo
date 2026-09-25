"use client";

import React from "react";
import Link from "next/link";
import { InstructorWorkspaceNavigation } from "@/components/instructor/workspace-navigation";
import { LoadingState } from "@/components/ui/loading-state";
import {
  getSessionPurposeBadgeClasses,
  getSessionPurposeOption,
  SESSION_PURPOSE_OPTIONS,
} from "@/lib/session-purpose";
import {
  INSTRUCTOR_LABELS,
  INSTRUCTOR_WORKFLOW_STEPS,
  getInstructorWorkspacePhases,
} from "@/lib/instructor-ux";
import type { CheckpointRecord, FileInfo, SessionDetails } from "@/types";

function looksRecallOnlyQuestion(prompt: string) {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return false;

  const startsLikeRecall = /^(what is|what are|define|list|name|identify|describe)\b/.test(normalized);
  const asksForReasoning = /\b(why|how|compare|contrast|explain|interpret|infer|apply|evidence|support|challenge|complicate|evaluate|connect)\b/.test(normalized);

  return startsLikeRecall && !asksForReasoning;
}

function QuestionQualityHint({ prompt }: { prompt: string }) {
  if (!looksRecallOnlyQuestion(prompt)) return null;

  return (
    <p className="mt-2 rounded-lg border border-[rgba(144,111,18,0.22)] bg-[rgba(144,111,18,0.07)] px-3 py-2 text-xs leading-5 text-[#80620f]">
      This may be recall-only. Stronger evidence questions usually ask learners to explain, compare, apply, or point to evidence.
    </p>
  );
}

function looksRecallOnlyOutcome(outcomes: string) {
  return outcomes
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*#\d.\s]+/, ""))
    .filter(Boolean)
    .some((line) => looksRecallOnlyQuestion(line));
}

function LearningOutcomeQualityHint({ outcomes }: { outcomes: string }) {
  if (!looksRecallOnlyOutcome(outcomes)) return null;

  return (
    <p className="mt-2 rounded-lg border border-[rgba(144,111,18,0.22)] bg-[rgba(144,111,18,0.07)] px-3 py-2 text-xs leading-5 text-[#80620f]">
      This may be recall-only. Stronger learning outcomes usually ask learners to explain, compare, apply, or point to evidence.
    </p>
  );
}

function getPurposeLinks(sessionId: string, purpose: string) {
  const phases = getInstructorWorkspacePhases(sessionId);
  const runPhase = phases.find((phase) => phase.key === "run");
  const reviewPhase = phases.find((phase) => phase.key === "review");

  if (!runPhase || !reviewPhase) return [];

  if (purpose === "during_class_prep" || purpose === "during_class_reflection") {
    return runPhase.items;
  }

  return [
    reviewPhase.items[0],
    reviewPhase.items[1],
    runPhase.items[0],
  ];
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 flex-shrink-0 text-[var(--dim-grey)] transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="h-4 w-4 text-[var(--dim-grey)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// ─── WorkspaceHeader ───────────────────────────────────────────────────────────

interface WorkspaceHeaderProps {
  session: SessionDetails;
  subtitle?: string;
  showWorkspaceItems?: boolean;
}

export function WorkspaceHeader({
  session,
  subtitle,
  showWorkspaceItems = true,
}: WorkspaceHeaderProps) {
  const purposeOption = getSessionPurposeOption(session.sessionPurpose);

  return (
    <div className="minerva-card p-6 md:p-8">
      <div className="flex flex-col gap-7">
        <div>
          <nav className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dim-grey)]">
            <Link href="/instructor" className="transition-colors hover:text-[var(--teal)]">
              Sessions
            </Link>
            <span>/</span>
            <span className="text-[var(--charcoal)]">Setup</span>
          </nav>
          <h1 className="mt-4 font-serif text-[42px] leading-[0.96] tracking-[-0.03em] text-[var(--charcoal)]">
            {session.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getSessionPurposeBadgeClasses(session.sessionPurpose)}`}
            >
              {purposeOption.shortLabel}
            </span>
          </div>
          {subtitle ? (
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--dim-grey)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        <InstructorWorkspaceNavigation sessionId={session.id} showItems={showWorkspaceItems} />
      </div>
    </div>
  );
}

// ─── StatusBar ─────────────────────────────────────────────────────────────────

interface StatusBarProps {
  learnerCount: number;
  readingsCount: number;
  assessmentsCount: number;
}

 export function StatusBar({ learnerCount, readingsCount, assessmentsCount, checkpointsCount, purposeLabel }: StatusBarProps & { checkpointsCount: number, purposeLabel: string }) {
  return (
    <div className="border border-[var(--rule)] bg-[rgba(17,120,144,0.04)] px-6 py-3 text-sm text-[var(--dim-grey)]">
      {INSTRUCTOR_LABELS.sessionSnapshot}: {learnerCount} learner{learnerCount !== 1 ? "s" : ""}, {readingsCount} source material{readingsCount !== 1 ? "s" : ""}, {checkpointsCount} evidence question{checkpointsCount !== 1 ? "s" : ""}, {assessmentsCount} protected assessment{assessmentsCount !== 1 ? "s" : ""}. AI_demo purpose: {purposeLabel}.
    </div>
  );
}

export function GuidedWorkflowHub({
  sessionId,
  hasPurpose,
  hasReadings,
  hasEvidenceQuestion,
  hasPreviewChecked,
  learnerCount,
}: {
  sessionId: string;
  hasPurpose: boolean;
  hasReadings: boolean;
  hasEvidenceQuestion: boolean;
  hasPreviewChecked: boolean;
  learnerCount: number;
}) {
  const readyToShare = hasPurpose && hasReadings && hasEvidenceQuestion && hasPreviewChecked;
  const requiredMissing = !hasPurpose || !hasReadings || !hasEvidenceQuestion || !hasPreviewChecked;
  const status = learnerCount > 0
    ? "Learners active"
    : readyToShare
      ? "Ready to share"
      : requiredMissing
        ? "Needs one required step"
        : "Preview recommended";
  const primary = learnerCount > 0
    ? { href: `/instructor/${sessionId}/monitor`, label: "Watch learner activity" }
    : readyToShare
      ? { href: `#learner-link`, label: INSTRUCTOR_LABELS.share }
      : !hasPurpose
        ? { href: "#learning-purpose", label: "Add learning purpose" }
        : !hasReadings
          ? { href: "#source-materials", label: "Add source material" }
          : !hasEvidenceQuestion
            ? { href: "#evidence-questions", label: "Add evidence question" }
            : { href: `/instructor/${sessionId}/planning`, label: INSTRUCTOR_LABELS.planning };

  const required = [
    { label: "Learning purpose", done: hasPurpose },
    { label: "Source material", done: hasReadings },
    { label: "Evidence question", done: hasEvidenceQuestion },
    { label: "Learner preview checked", done: hasPreviewChecked },
  ];
  const recommended = [
    { label: "Prepare likely teaching moves", href: `/instructor/${sessionId}/planning` },
    { label: "Add participation plan", href: `/instructor/${sessionId}/planning#participation-planning` },
    { label: "Review source-use safeguards", href: `/instructor/${sessionId}/grounding` },
  ];

  return (
    <section className="minerva-card p-6 md:p-8" aria-labelledby="workflow-heading">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div>
          <p className="eyebrow eyebrow-teal">Instructor workflow</p>
          <h2 id="workflow-heading" className="mt-3 font-serif text-4xl leading-none text-[var(--charcoal)]">
            What to do next
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--dim-grey)]">
            Start with the required setup. Everything else is available when you want more control, but you do not need to master the whole workspace before sharing a usable session.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--rule)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--charcoal)]">
              Status: {status}
            </span>
            <Link href={primary.href} className="minerva-button">
              {primary.label}
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {INSTRUCTOR_WORKFLOW_STEPS.map((group) => (
              <div key={group.phase} className="border border-[var(--rule)] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--teal)]">{group.phase}</p>
                <ol className="mt-3 space-y-2 text-sm text-[var(--dim-grey)]">
                  {group.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="border border-[var(--rule)] bg-[rgba(17,120,144,0.04)] p-4">
            <h3 className="text-sm font-semibold text-[var(--charcoal)]">Required before sharing</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {required.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-[var(--dim-grey)]">
                  <span aria-hidden="true" className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${item.done ? "bg-[var(--teal)] text-white" : "border border-[var(--rule)] bg-white text-[var(--dim-grey)]"}`}>
                    {item.done ? "✓" : "○"}
                  </span>
                  <span>{item.done ? "Done: " : "Needed: "}{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-[var(--rule)] bg-white p-4">
            <h3 className="text-sm font-semibold text-[var(--charcoal)]">Recommended, not required</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {recommended.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-[var(--teal)] hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <p className="mt-6 border-t border-[var(--rule)] pt-4 text-sm text-[var(--dim-grey)]">
        <strong className="text-[var(--charcoal)]">Next:</strong>{" "}
        {learnerCount > 0
          ? "watch learner activity, then review evidence before preparing the teaching brief."
          : readyToShare
            ? "copy the learner link and share it when you are ready."
            : "complete the highlighted required step, then preview what learners will see."}
      </p>
    </section>
  );
}

// ─── AccessCodeCard ────────────────────────────────────────────────────────────

interface AccessCodeCardProps {
  session: SessionDetails;
  isActive: boolean;
  copied: boolean;
  onCopyLink: () => void;
  hasReadings: boolean;
  hasEvidenceQuestion: boolean;
  hasPreviewChecked: boolean;
}

export function AccessCodeCard({
  session,
  isActive,
  copied,
  onCopyLink,
  hasReadings,
  hasEvidenceQuestion,
  hasPreviewChecked,
}: AccessCodeCardProps) {
  const learnerUrl = typeof window !== "undefined"
    ? `${window.location.origin}/s/${session.accessCode}`
    : `/s/${session.accessCode}`;

  const hasLearningOutcome = Boolean(session.learningOutcomes?.trim());

  return (
    <div id="learner-link" className={`minerva-card scroll-mt-24 p-6 md:p-8 transition-colors duration-500 ${isActive ? "border-[rgba(17,120,144,0.3)] bg-[rgba(17,120,144,0.02)] shadow-sm" : ""}`}>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="eyebrow eyebrow-teal">Learner link</p>
          <p className="mt-2 font-mono text-base text-[var(--charcoal)]">{learnerUrl}</p>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${hasReadings ? "border-[var(--teal)] bg-[var(--teal)]" : "border-[var(--rule)]"}`}>
                {hasReadings && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className={`text-xs ${hasReadings ? "text-[var(--charcoal)]" : "text-[var(--dim-grey)]"}`}>Upload at least one source material</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${hasLearningOutcome ? "border-[var(--teal)] bg-[var(--teal)]" : "border-[var(--rule)]"}`}>
                {hasLearningOutcome && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className={`text-xs ${hasLearningOutcome ? "text-[var(--charcoal)]" : "text-[var(--dim-grey)]"}`}>Define at least one learning outcome</span>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${hasEvidenceQuestion ? "border-[var(--teal)] bg-[var(--teal)]" : "border-[var(--rule)]"}`}>
                {hasEvidenceQuestion && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className={`text-xs ${hasEvidenceQuestion ? "text-[var(--charcoal)]" : "text-[var(--dim-grey)]"}`}>Add at least one evidence question</span>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${hasPreviewChecked ? "border-[var(--teal)] bg-[var(--teal)]" : "border-[var(--rule)]"}`}>
                {hasPreviewChecked && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className={`text-xs ${hasPreviewChecked ? "text-[var(--charcoal)]" : "text-[var(--dim-grey)]"}`}>Preview the learner experience</span>
            </div>
          </div>
        </div>
        <button
          onClick={onCopyLink}
          disabled={!isActive}
          className={`minerva-button transition-all duration-300 ${!isActive ? "opacity-40 cursor-not-allowed" : "shadow-md hover:shadow-lg"}`}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

// ─── SessionInsightsCard (purpose-aware) ──────────────────────────────────────

interface LiveLearnerStatus {
  id: string;
  studentName: string;
  hasRecentEngagementConcern: boolean;
  latestEngagementFlag: string | null;
  isWaitingForStudentReply: boolean;
  secondsSinceLastMessage: number | null;
  endedAt: string | Date | null;
}

interface SessionInsightsCardProps {
  sessionId: string;
  sessionPurpose: string;
  learnerCount: number;
  liveStatus: LiveLearnerStatus[];
}

function isLiveMode(purpose: string) {
  return purpose === "during_class_prep" || purpose === "during_class_reflection";
}

export function SessionInsightsCard({
  sessionId,
  sessionPurpose,
  learnerCount,
  liveStatus,
}: SessionInsightsCardProps) {
  const live = isLiveMode(sessionPurpose);
  const links = getPurposeLinks(sessionId, sessionPurpose);
  const primary = links[0];

  if (live) {
    const activeLearners = liveStatus.filter((l) => !l.endedAt);
    const completedLearners = liveStatus.filter((l) => l.endedAt);
    const concernCount = activeLearners.filter((l) => l.hasRecentEngagementConcern).length;
    const waitingLong = activeLearners.filter(
      (l) => l.isWaitingForStudentReply && (l.secondsSinceLastMessage ?? 0) > 180
    ).length;
    const hasConcerns = concernCount > 0 || waitingLong > 0;

    return (
      <div className="minerva-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[var(--rule)] px-6 py-4 md:px-8">
          <span
            className={`h-2.5 w-2.5 rounded-full ${hasConcerns ? "bg-[#906f12]" : "bg-[var(--teal)]"}`}
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dim-grey)]">
            Review signals
          </p>
        </div>

        <div className="px-6 py-5 md:px-8">
          {/* Stats row */}
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-[28px] font-bold leading-none text-[var(--charcoal)]">
                {activeLearners.length}
              </p>
              <p className="mt-1 text-xs text-[var(--dim-grey)]">
                active now
              </p>
            </div>
            {completedLearners.length > 0 && (
              <div>
                <p className="text-[28px] font-bold leading-none text-[var(--charcoal)]">
                  {completedLearners.length}
                </p>
                <p className="mt-1 text-xs text-[var(--dim-grey)]">
                  completed
                </p>
              </div>
            )}
            {concernCount > 0 && (
              <div>
                <p className="text-[28px] font-bold leading-none text-[#906f12]">
                  {concernCount}
                </p>
                <p className="mt-1 text-xs text-[var(--dim-grey)]">
                  possible concern{concernCount !== 1 ? "s" : ""}
                </p>
              </div>
            )}
            {waitingLong > 0 && (
              <div>
                <p className="text-[28px] font-bold leading-none text-[var(--dim-grey)]">
                  {waitingLong}
                </p>
                <p className="mt-1 text-xs text-[var(--dim-grey)]">
                  waiting 3+ min
                </p>
              </div>
            )}
          </div>

          {/* Alert banner */}
          {hasConcerns && (
            <div className="mt-4 rounded-lg border border-[rgba(144,111,18,0.2)] bg-[rgba(144,111,18,0.06)] px-4 py-3">
              <p className="text-sm text-[var(--charcoal)]">
                {concernCount > 0 && (
                  <span className="font-medium text-[#906f12]">
                    {concernCount} learner{concernCount !== 1 ? "s" : ""} may need follow-up.{" "}
                  </span>
                )}
                {waitingLong > 0 && (
                  <span className="text-[var(--dim-grey)]">
                    {waitingLong} waiting 3+ minutes for a reply.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Purpose-ordered CTAs */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={primary.href} className="minerva-button">
              {primary.label}
            </Link>
            {links.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="minerva-button minerva-button-secondary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Review mode (pre-class / after-class) ──

  const completed = liveStatus.filter((l) => l.endedAt).length;
  const total = Math.max(learnerCount, liveStatus.length);
  const participationLabel =
    sessionPurpose === "pre_class"
      ? "Learner readiness signals"
      : "Learning outcome evidence";
  const contextLine =
    sessionPurpose === "pre_class"
      ? "Review what learners appear ready to apply and where misconceptions may remain."
      : "Review evidence of how learners translated understanding into application.";

  return (
    <div className="minerva-card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[var(--rule)] px-6 py-4 md:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dim-grey)]">
          {participationLabel}
        </p>
      </div>

      <div className="px-6 py-5 md:px-8">
        {/* Participation health check */}
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-[28px] font-bold leading-none text-[var(--charcoal)]">
              {total}
            </p>
            <p className="mt-1 text-xs text-[var(--dim-grey)]">
              learner{total !== 1 ? "s" : ""} participated
            </p>
          </div>
          <div>
            <p className="text-[28px] font-bold leading-none text-[var(--charcoal)]">
              {completed}
            </p>
            <p className="mt-1 text-xs text-[var(--dim-grey)]">
              completed
            </p>
          </div>
          {total - completed > 0 && (
            <div>
              <p className="text-[28px] font-bold leading-none text-[var(--dim-grey)]">
                {total - completed}
              </p>
              <p className="mt-1 text-xs text-[var(--dim-grey)]">
                still in progress
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-sm text-[var(--dim-grey)]">{contextLine}</p>

        {/* Purpose-ordered CTAs */}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={primary.href} className="minerva-button">
            {primary.label}
          </Link>
          {links.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="minerva-button minerva-button-secondary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ReadingsSection ───────────────────────────────────────────────────────────

interface ReadingsSectionProps {
  open: boolean;
  onToggle: () => void;
  readings: FileInfo[];
  uiState: {
    dragActive: "reading" | "assessment" | null;
    uploadingCategory: "reading" | "assessment" | null;
    recentUploadCategory: "reading" | "assessment" | null;
    recentUploadName: string | null;
  };
  readingInputRef: React.RefObject<HTMLInputElement | null>;
  handlers: {
    onDrop: (e: React.DragEvent, category: "reading" | "assessment") => void;
    onDragOver: (e: React.DragEvent, category: "reading" | "assessment") => void;
    onDragLeave: () => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>, category: "reading" | "assessment") => void;
    onRemoveFile: (fileId: string, category: string) => void;
  };
}

export function ReadingsSection({
  open,
  onToggle,
  readings,
  uiState,
  readingInputRef,
  handlers,
}: ReadingsSectionProps) {
  const { dragActive, uploadingCategory, recentUploadCategory, recentUploadName } = uiState;
  const statusLabel = readings.length > 0 ? "Configured" : "Needs setup";
  const statusClass = readings.length > 0 ? "text-[var(--teal)]" : "text-[#906f12]";

  return (
    <div id="source-materials" className="minerva-card scroll-mt-24 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-6 text-left md:p-8"
      >
        <div>
          <h2 className="font-serif text-[34px] leading-[1] tracking-[-0.03em] text-[var(--charcoal)]">Step 2: Learning materials</h2>
          {!open && readings.length > 0 && (
            <p className="mt-2 text-sm text-[var(--dim-grey)]">
              {readings.length} source file{readings.length !== 1 ? "s" : ""} uploaded
            </p>
          )}
          {!open && readings.length === 0 && (
            <p className="mt-2 text-sm text-[#906f12]">No source materials yet - upload to ground AI_demo</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${statusClass}`}>
            {statusLabel}
          </span>
          <ChevronIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="space-y-4 px-6 pb-6 md:px-8 md:pb-8">
          <p className="text-sm text-[var(--dim-grey)]">
            AI_demo uses these sources as its evidence base for learner dialogue. PDF, DOCX, TXT, or Markdown. Up to 10MB.
          </p>
          <div
            onDrop={(e: any) => handlers.onDrop(e, "reading")}
            onDragOver={(e: any) => handlers.onDragOver(e, "reading")}
            onDragLeave={handlers.onDragLeave}
            className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragActive === "reading"
                ? "border-[var(--teal)] bg-[rgba(17,120,144,0.06)]"
                : "border-[var(--rule)] hover:border-[rgba(17,120,144,0.4)] hover:bg-[rgba(17,120,144,0.02)]"
            }`}
            onClick={() => readingInputRef.current?.click()}
          >
            {uploadingCategory === "reading" ? (
              <LoadingState message="Uploading..." />
            ) : (
              <>
                <svg className="h-7 w-7 text-[var(--dim-grey)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-[var(--dim-grey)]">
                  <span className="font-medium text-[var(--teal)]">Click to upload</span> or drag and drop
                </p>
              </>
            )}
            <input
              ref={readingInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="sr-only"
              onChange={(e: any) => handlers.onFileChange(e, "reading")}
            />
          </div>

          {/* Recent upload banner */}
          {recentUploadCategory === "reading" && recentUploadName && (
            <p className="text-xs text-[var(--teal)]">? {recentUploadName} uploaded</p>
          )}

          {/* File list */}
          {readings.length > 0 && (
            <ul className="space-y-2">
              {readings.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--rule)] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileIcon />
                    <span className="truncate text-sm text-[var(--charcoal)]">{file.filename}</span>
                  </div>
                  <button
                    onClick={() => handlers.onRemoveFile(file.id, "reading")}
                    className="flex-shrink-0 text-xs text-[var(--dim-grey)] hover:text-[var(--signal)]"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── QuestionsSection ──────────────────────────────────────────────────────────

interface Suggestion {
  prompt: string;
  processLevel: string;
  focusArea: string | null;
  rationale: string;
  qualityLabels: string[];
  expectations: string[];
  misconceptions: string[];
}

interface QuestionsSectionProps {
  open: boolean;
  onToggle: () => void;
  session: SessionDetails;
  readingsCount: number;
  checkpoints: CheckpointRecord[];
  uiState: {
    loadingCheckpoints: boolean;
    savingCheckpoint: boolean;
    generatingSuggestions: boolean;
    suggestions: Suggestion[];
    acceptingSuggestionIndex: number | null;
    editingCheckpointId: string | null;
    editingCheckpointPrompt: string;
    draggedCheckpointId: string | null;
    dragTargetCheckpointId: string | null;
    showQuestionSavedState: boolean;
    newCheckpointPrompt: string;
  };
  setEditingCheckpointPrompt: (value: string) => void;
  setNewCheckpointPrompt: (value: string) => void;
  actions: {
    onGenerateSuggestions: () => void;
    onAcceptSuggestion: (index: number) => void;
    onDismissSuggestion: (index: number) => void;
    onCreateCheckpoint: () => void;
    onDragStartCheckpoint: (id: string) => void;
    onDragOverCheckpoint: (e: React.DragEvent, id: string) => void;
    onDropCheckpoint: (id: string) => void;
    onEndDragCheckpoint: () => void;
    onStartEditingCheckpoint: (checkpoint: CheckpointRecord) => void;
    onCancelEditingCheckpoint: () => void;
    onSaveCheckpointEdit: (id: string) => void;
    onRemoveCheckpoint: (id: string) => void;
  };
}

export function QuestionsSection({
  open,
  onToggle,
  session,
  readingsCount,
  checkpoints,
  uiState,
  setEditingCheckpointPrompt,
  setNewCheckpointPrompt,
  actions,
}: QuestionsSectionProps) {
  const {
    loadingCheckpoints,
    savingCheckpoint,
    generatingSuggestions,
    suggestions,
    acceptingSuggestionIndex,
    editingCheckpointId,
    editingCheckpointPrompt,
    draggedCheckpointId,
    dragTargetCheckpointId,
    showQuestionSavedState,
    newCheckpointPrompt,
  } = uiState;

  const recommendedCount = Math.max(2, Math.floor((session.maxExchanges - 4) / 4));
  const tooMany = checkpoints.length > recommendedCount + 2;
  const statusLabel = checkpoints.length > 0 ? "Configured" : "Needs setup";
  const statusClass = checkpoints.length > 0 ? "text-[var(--teal)]" : "text-[#906f12]";

  return (
    <div id="evidence-questions" className="minerva-card scroll-mt-24 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-6 text-left md:p-8"
      >
        <div>
          <h2 className="font-serif text-[34px] leading-[1] tracking-[-0.03em] text-[var(--charcoal)]">Step 3: Core questions</h2>
          {!open && checkpoints.length > 0 && (
            <p className="mt-2 text-sm text-[var(--dim-grey)]">
              {checkpoints.length} question{checkpoints.length !== 1 ? "s" : ""}
            </p>
          )}
          {!open && checkpoints.length === 0 && (
            <p className="mt-2 text-sm text-[#906f12]">No questions yet - add 2-4 to guide AI_demo</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${statusClass}`}>
            {statusLabel}
          </span>
          <ChevronIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="space-y-6 px-6 pb-6 md:px-8 md:pb-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <button
              onClick={actions.onGenerateSuggestions}
              disabled={generatingSuggestions || readingsCount === 0}
              title={readingsCount === 0 ? "Upload source materials first" : undefined}
              className="minerva-button minerva-button-secondary flex-shrink-0 text-sm"
            >
                {generatingSuggestions ? (
                  <LoadingState variant="button" message="Generating" />
                ) : (
                  "Suggest from material"
                )}
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <label className="minerva-label">Choose 1-3 questions that guide what evidence AI_demo listens for. Aim for interpretation, inference, or synthesis - not recall.</label>
          </div>

          {tooMany && (
            <p className="text-xs text-[#906f12]">
              {checkpoints.length} questions for {session.maxExchanges} exchanges may be too many. Consider removing
              lower-priority questions or increasing the exchange limit.
            </p>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--teal)]">
                Suggested questions - review then accept or dismiss
              </p>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`suggestion-${index}`}
                  className="space-y-3 rounded-2xl border-2 border-dashed border-[rgba(17,120,144,0.28)] bg-[rgba(17,120,144,0.04)] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--teal)]">
                          Suggestion {index + 1}
                        </span>
                        {suggestion.focusArea && (
                          <span className="rounded-full bg-[rgba(0,0,0,0.04)] px-2.5 py-1 text-[11px] font-medium text-[var(--dim-grey)]">
                            {suggestion.focusArea}
                          </span>
                        )}
                      </div>
                      <p className="max-w-[48rem] text-[15px] leading-7 text-[var(--charcoal)]">
                        {suggestion.prompt}
                      </p>
                      {suggestion.rationale && (
                        <p className="text-xs text-[var(--dim-grey)]">{suggestion.rationale}</p>
                      )}
                      {suggestion.expectations.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--dim-grey)]">
                            Expected evidence
                          </p>
                          <ul className="mt-1 space-y-0.5 text-xs text-[var(--dim-grey)]">
                            {suggestion.expectations.map((e, i) => (
                              <li key={i}>- {e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {suggestion.misconceptions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--dim-grey)]">
                            Likely misreadings
                          </p>
                          <ul className="mt-1 space-y-0.5 text-xs text-[var(--dim-grey)]">
                            {suggestion.misconceptions.map((m, i) => (
                              <li key={i}>- {m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 gap-2">
                      <button
                        onClick={() => actions.onAcceptSuggestion(index)}
                        disabled={acceptingSuggestionIndex === index}
                        className="minerva-button text-sm"
                      >
                        {acceptingSuggestionIndex === index ? (
                          <LoadingState variant="button" message="Adding" />
                        ) : (
                          "Accept"
                        )}
                      </button>
                      <button
                        onClick={() => actions.onDismissSuggestion(index)}
                        className="minerva-button minerva-button-secondary text-sm"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Existing checkpoints */}
          {loadingCheckpoints ? (
            <LoadingState message="Loading questions…" />
          ) : checkpoints.length > 0 ? (
            <ul className="space-y-2">
              {checkpoints.map((checkpoint, index) => (
                <li
                  key={checkpoint.id}
                  draggable
                  onDragStart={() => actions.onDragStartCheckpoint(checkpoint.id)}
                  onDragOver={(e: any) => actions.onDragOverCheckpoint(e, checkpoint.id)}
                  onDrop={() => actions.onDropCheckpoint(checkpoint.id)}
                  onDragEnd={actions.onEndDragCheckpoint}
                  className={`rounded-xl border px-4 py-3 transition-colors ${
                    draggedCheckpointId === checkpoint.id
                      ? "opacity-40"
                      : dragTargetCheckpointId === checkpoint.id && draggedCheckpointId !== checkpoint.id
                        ? "border-[var(--teal)] bg-[rgba(17,120,144,0.04)]"
                        : "border-[var(--rule)] bg-white"
                  }`}
                >
                  {editingCheckpointId === checkpoint.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingCheckpointPrompt}
                        onChange={(e: any) => setEditingCheckpointPrompt(e.target.value)}
                        rows={3}
                        className="minerva-input w-full resize-none text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => actions.onSaveCheckpointEdit(checkpoint.id)}
                          disabled={savingCheckpoint}
                          className="minerva-button text-sm"
                        >
                          {savingCheckpoint ? (
                            <LoadingState variant="button" message="Saving" />
                          ) : (
                            "Save"
                          )}
                        </button>
                        <button
                          onClick={actions.onCancelEditingCheckpoint}
                          className="minerva-button minerva-button-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex-shrink-0 text-xs font-semibold text-[var(--dim-grey)]">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-6 text-[var(--charcoal)]">{checkpoint.prompt}</p>
                        </div>
                        <QuestionQualityHint prompt={checkpoint.prompt} />
                      </div>
                      <div className="flex flex-shrink-0 gap-2">
                        <button
                          onClick={() => actions.onStartEditingCheckpoint(checkpoint)}
                          className="text-xs text-[var(--dim-grey)] hover:text-[var(--teal)]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => actions.onRemoveCheckpoint(checkpoint.id)}
                          className="text-xs text-[var(--dim-grey)] hover:text-[var(--signal)]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Add new checkpoint */}
          <div className="space-y-3 border-t border-[var(--rule)] pt-5">
            <label className="minerva-label">Design your own question below</label>
            <textarea
              value={newCheckpointPrompt}
              onChange={(e: any) => setNewCheckpointPrompt(e.target.value)}
              placeholder="e.g. What does Meadows mean by 'system behavior is intrinsic'?"
              rows={3}
              className="minerva-input w-full resize-none text-sm"
              onKeyDown={(e: any) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  actions.onCreateCheckpoint();
                }
              }}
            />
            <QuestionQualityHint prompt={newCheckpointPrompt} />
            <div className="flex items-center gap-3">
              <button
                onClick={actions.onCreateCheckpoint}
                disabled={savingCheckpoint || !newCheckpointPrompt.trim()}
                className="minerva-button text-sm"
              >
                {savingCheckpoint ? (
                  <LoadingState variant="button" message="Adding" />
                ) : (
                  "Add question"
                )}
              </button>
              {showQuestionSavedState && (
                <p className="text-xs text-[var(--teal)]">Question added.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GoalsSection ──────────────────────────────────────────────────────────────

interface GoalsSectionProps {
  open: boolean;
  onToggle: () => void;
  session: SessionDetails | null;
  setSession: React.Dispatch<React.SetStateAction<SessionDetails | null>>;
  uiState: {
    savingConfig: boolean;
    showSavedState: boolean;
    configSavedAt: Date | null;
  };
  actions: {
    onSaveConfig: () => void;
  };
  formatSavedTime: (d: Date) => string;
}

export function GoalsSection({
  open,
  onToggle,
  session,
  setSession,
  uiState: { savingConfig, showSavedState, configSavedAt },
  actions,
  formatSavedTime,
}: GoalsSectionProps) {
  if (!session) return null;

  const updateSession = (updates: Partial<SessionDetails>) => {
    setSession((prev: any) => (prev ? { ...prev, ...updates } : prev));
  };

  return (
    <div id="learning-purpose" className="minerva-card scroll-mt-24 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-[rgba(34,34,34,0.02)] md:p-8"
      >
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-[34px] leading-[1] tracking-[-0.03em] text-[var(--charcoal)]">
            Step 1: Task & learning outcomes
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {session.learningOutcomes && session.learningOutcomes.trim().length > 0 ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--teal)]">
              Configured
            </span>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--signal)]">
              Needs setup
            </span>
          )}
          <ChevronIcon open={open} />
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--rule)] bg-white px-6 py-8 md:px-8 md:py-10">
          <div className="space-y-8">
          <div className="space-y-3">
            <label className="minerva-label">Where are you in the learning cycle?</label>
            <p className="text-xs text-[var(--dim-grey)]">
              When in the learning cycle will learners use this session? This shapes how AI_demo questions learners and what the teaching brief treats as evidence.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SESSION_PURPOSE_OPTIONS.map((option) => {
                const isSelected = session.sessionPurpose === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateSession({ sessionPurpose: option.value })}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-[var(--teal)] bg-[rgba(17,120,144,0.06)]"
                        : "border-[var(--rule)] hover:border-[rgba(17,120,144,0.3)] bg-white"
                    }`}
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${getSessionPurposeBadgeClasses(option.value)}`}
                    >
                      {option.shortLabel}
                    </span>
                    <p className="mt-1.5 text-xs font-medium text-[var(--charcoal)]">
                      {option.cognitiveLevel}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-4 text-[var(--dim-grey)]">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="minerva-label" htmlFor="learningOutcomes">
              What learning outcomes do you want to assess?
            </label>
            <p className="text-xs text-[var(--dim-grey)]">
              The specific skills or understandings you want to track. AI_demo will look for evidence in each learner&apos;s reasoning and include reviewable formative signals in the teaching brief.
            </p>
            <textarea
              id="learningOutcomes"
              value={session.learningOutcomes ?? ""}
              onChange={(e: any) => updateSession({ learningOutcomes: e.target.value || null })}
              placeholder={"#system-analysis: Observe and deconstruct systems into constituent parts to explain the characteristics, and relationships among, those parts at multiple levels of analysis"}
              rows={4}
              className="minerva-input w-full resize-none text-sm"
            />
            <LearningOutcomeQualityHint outcomes={session.learningOutcomes ?? ""} />
          </div>

          <div className="flex items-center gap-4 border-t border-[var(--rule)] pt-6">
            <button
              onClick={actions.onSaveConfig}
              disabled={savingConfig || !session.learningOutcomes?.trim()}
              className="minerva-button"
            >
              {savingConfig ? (
                <LoadingState variant="button" message="Saving" />
              ) : (
                "Save settings"
              )}
            </button>
            {showSavedState && configSavedAt && (
              <p className="text-xs text-[var(--teal)]">Saved at {formatSavedTime(configSavedAt)}</p>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TeachingContextSection ────────────────────────────────────────────────────

interface TeachingContextSectionProps {
  open: boolean;
  onToggle: () => void;
  session: SessionDetails;
  setSession: React.Dispatch<React.SetStateAction<SessionDetails | null>>;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  readingsCount: number;
  uiState: {
    showAdvanced: boolean;
    generatingMap: boolean;
    savingConfig: boolean;
    showSavedState: boolean;
    configSavedAt: Date | null;
  };
  actions: {
    onGenerateSuggestedMap: () => void;
    onSaveTeachingContext: () => void;
  };
  recommendedCheckpoints: number;
  formatSavedTime: (date: Date) => string;
}

export function TeachingContextSection({
  open,
  onToggle,
  session,
  setSession,
  setShowAdvanced,
  readingsCount,
  uiState,
  actions,
  formatSavedTime,
}: TeachingContextSectionProps) {
  const { showAdvanced, generatingMap, savingConfig, showSavedState, configSavedAt } = uiState;
  const isConfigured = !!(session.courseContext || session.learningGoal || session.learningOutcomes);

  function updateSession(updates: Partial<SessionDetails>) {
    setSession((prev: any) => (prev ? { ...prev, ...updates } : prev));
  }

  return (
    <div className="minerva-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-6 text-left md:p-8"
      >
        <div>
          <h2 className="font-serif text-[34px] leading-[1] tracking-[-0.03em] text-[var(--charcoal)]">Teaching context & learner message</h2>
          {!open && isConfigured && (
            <p className="mt-2 text-sm text-[var(--dim-grey)]">Configured</p>
          )}
          {!open && !isConfigured && (
            <p className="mt-2 text-sm text-[var(--dim-grey)]">Not yet configured</p>
          )}
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="space-y-8 px-6 pb-8 md:px-8">
          {/* Course context */}
          <div className="space-y-2">
            <label className="minerva-label" htmlFor="courseContext">
              Where this session fits in your course
            </label>
            <p className="text-xs text-[var(--dim-grey)]">
              Optional. Helps AI_demo connect the session to larger course themes and prior learning.
            </p>
            <textarea
              id="courseContext"
              value={session.courseContext ?? ""}
              onChange={(e: any) => updateSession({ courseContext: e.target.value || null })}
              placeholder="e.g. Week 4 of Systems Thinking. Learners have covered feedback loops and delays."
              rows={3}
              className="minerva-input w-full resize-none text-sm"
            />
          </div>

          {/* Session goal */}
          <div className="space-y-2">
            <label className="minerva-label" htmlFor="learningGoal">
              Session goal
            </label>
            <p className="text-xs text-[var(--dim-grey)]">
              The overarching understanding you&apos;re building toward. Shapes how AI_demo opens, questions, and closes the session.
            </p>
            <textarea
              id="learningGoal"
              value={session.learningGoal ?? ""}
              onChange={(e: any) => updateSession({ learningGoal: e.target.value || null })}
              placeholder="e.g. Understand how system structure drives behavior - not external events."
              rows={3}
              className="minerva-input w-full resize-none text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="minerva-label" htmlFor="sessionDescription">
              Opening message for students
            </label>
            <p className="text-xs text-[var(--dim-grey)]">
              Optional. Shown before the conversation begins. Use it to set the stage or clarify what kind of reasoning you want learners to do.
            </p>
            <textarea
              id="sessionDescription"
              value={session.description ?? ""}
              onChange={(e: any) => updateSession({ description: e.target.value || null })}
              placeholder="e.g. Explain how the author's definition of X conflicts with Y. AI_demo will push you on your reasoning."
              rows={3}
              className="minerva-input w-full resize-none text-sm"
            />
          </div>

          {/* Advanced settings */}
          <div className="border-t border-[var(--rule)] pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced((v: any) => !v)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--dim-grey)] hover:text-[var(--charcoal)]"
            >
              <svg
                className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Advanced settings
            </button>

            {showAdvanced && (
              <div className="mt-6 space-y-6">
                {/* Interaction style */}
                <div className="space-y-2">
                  <label className="minerva-label">Interaction style</label>
                  <p className="text-xs text-[var(--dim-grey)]">
                    Directed: guides learners through questions with clear authority. Mentor: uses more collaborative inquiry for experienced or professional learners.
                  </p>
                  <div className="flex gap-3">
                    {(["directed", "mentor"] as const).map((stance) => (
                      <button
                        key={stance}
                        type="button"
                        onClick={() => updateSession({ stance })}
                        className={`rounded-xl border px-4 py-2 text-sm capitalize transition-colors ${
                          session.stance === stance
                            ? "border-[var(--teal)] bg-[rgba(17,120,144,0.06)] text-[var(--teal)]"
                            : "border-[var(--rule)] text-[var(--charcoal)] hover:border-[rgba(17,120,144,0.3)]"
                        }`}
                      >
                        {stance}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max exchanges */}
                <div className="space-y-2">
                  <label className="minerva-label" htmlFor="maxExchanges">
                    Max exchanges
                  </label>
                  <p className="text-xs text-[var(--dim-grey)]">
                    The session ends after this many back-and-forth turns. Default 20 (~15 min).
                  </p>
                  <input
                    id="maxExchanges"
                    type="number"
                    min={4}
                    max={100}
                    value={session.maxExchanges}
                    onChange={(e: any) => updateSession({ maxExchanges: Number(e.target.value) })}
                    className="minerva-input w-32 text-sm"
                  />
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="minerva-label" htmlFor="opensAt">
                      Opens at
                    </label>
                    <input
                      id="opensAt"
                      type="datetime-local"
                      value={session.opensAt ? session.opensAt.slice(0, 16) : ""}
                      onChange={(e: any) => updateSession({ opensAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="minerva-input w-full text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="minerva-label" htmlFor="closesAt">
                      Closes at
                    </label>
                    <input
                      id="closesAt"
                      type="datetime-local"
                      value={session.closesAt ? session.closesAt.slice(0, 16) : ""}
                      onChange={(e: any) => updateSession({ closesAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="minerva-input w-full text-sm"
                    />
                  </div>
                </div>

                {/* Prerequisite map */}
                {readingsCount > 0 && (
                  <div className="space-y-2">
                    <label className="minerva-label">Foundational concept map</label>
                    <p className="text-xs text-[var(--dim-grey)]">
                      Identify the concepts learners need in order to reason well with this material. Helps AI_demo notice confidence that is not yet backed by explanation.
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={actions.onGenerateSuggestedMap}
                        disabled={generatingMap}
                        className="minerva-button minerva-button-secondary text-sm"
                      >
                        {generatingMap ? (
                          <LoadingState variant="button" message="Generating" />
                        ) : (
                          "Generate from material"
                        )}
                      </button>
                    </div>
                    {session.prerequisiteMap && (
                      <textarea
                        value={session.prerequisiteMap}
                        onChange={(e: any) => updateSession({ prerequisiteMap: e.target.value || null })}
                        rows={6}
                        className="minerva-input w-full resize-y font-mono text-xs"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="flex items-center gap-4 border-t border-[var(--rule)] pt-6">
            <button
              onClick={actions.onSaveTeachingContext}
              disabled={savingConfig}
              className="minerva-button"
            >
              {savingConfig ? (
                <LoadingState variant="button" message="Saving" />
              ) : (
                "Save settings"
              )}
            </button>
            {showSavedState && configSavedAt && (
              <p className="text-xs text-[var(--teal)]">Saved at {formatSavedTime(configSavedAt)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AssessmentsSection ────────────────────────────────────────────────────────

interface AssessmentsSectionProps {
  open: boolean;
  onToggle: () => void;
  assessments: FileInfo[];
  uiState: {
    dragActive: "reading" | "assessment" | null;
    uploadingCategory: "reading" | "assessment" | null;
    recentUploadCategory: "reading" | "assessment" | null;
    recentUploadName: string | null;
  };
  assessmentInputRef: React.RefObject<HTMLInputElement | null>;
  handlers: {
    onDrop: (e: React.DragEvent, category: "reading" | "assessment") => void;
    onDragOver: (e: React.DragEvent, category: "reading" | "assessment") => void;
    onDragLeave: () => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>, category: "reading" | "assessment") => void;
    onRemoveFile: (fileId: string, category: string) => void;
  };
}

export function AssessmentsSection({
  open,
  onToggle,
  assessments,
  uiState,
  assessmentInputRef,
  handlers,
}: AssessmentsSectionProps) {
  const { dragActive, uploadingCategory, recentUploadCategory, recentUploadName } = uiState;

  return (
    <div className="minerva-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-6 text-left md:p-8"
      >
        <div>
          <h2 className="font-serif text-[34px] leading-[1] tracking-[-0.03em] text-[var(--charcoal)]">
            Protected assessment materials
          </h2>
          {!open && assessments.length > 0 && (
            <p className="mt-2 text-sm text-[var(--dim-grey)]">
              {assessments.length} assessment{assessments.length !== 1 ? "s" : ""} uploaded
            </p>
          )}
          {!open && assessments.length === 0 && (
            <p className="mt-2 text-sm text-[var(--dim-grey)]">Optional - keeps answer keys out of learner replies</p>
          )}
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="space-y-4 px-6 pb-6 md:px-8 md:pb-8">
          <p className="text-sm text-[var(--dim-grey)]">
            Upload assessment or exam prompts that AI_demo should protect. Learners can be coached toward the reasoning without seeing the answers. Optional.
          </p>

          {/* Drop zone */}
          <div
            onDrop={(e: any) => handlers.onDrop(e, "assessment")}
            onDragOver={(e: any) => handlers.onDragOver(e, "assessment")}
            onDragLeave={handlers.onDragLeave}
            className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragActive === "assessment"
                ? "border-[var(--teal)] bg-[rgba(17,120,144,0.06)]"
                : "border-[var(--rule)] hover:border-[rgba(17,120,144,0.4)] hover:bg-[rgba(17,120,144,0.02)]"
            }`}
            onClick={() => assessmentInputRef.current?.click()}
          >
            {uploadingCategory === "assessment" ? (
              <LoadingState message="Uploading..." />
            ) : (
              <>
                <svg className="h-7 w-7 text-[var(--dim-grey)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-[var(--dim-grey)]">
                  <span className="font-medium text-[var(--teal)]">Click to upload</span> or drag and drop
                </p>
              </>
            )}
            <input
              ref={assessmentInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="sr-only"
              onChange={(e: any) => handlers.onFileChange(e, "assessment")}
            />
          </div>

          {recentUploadCategory === "assessment" && recentUploadName && (
            <p className="text-xs text-[var(--teal)]">? {recentUploadName} uploaded</p>
          )}

          {assessments.length > 0 && (
            <ul className="space-y-2">
              {assessments.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--rule)] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileIcon />
                    <span className="truncate text-sm text-[var(--charcoal)]">{file.filename}</span>
                  </div>
                  <button
                    onClick={() => handlers.onRemoveFile(file.id, "assessment")}
                    className="flex-shrink-0 text-xs text-[var(--dim-grey)] hover:text-[var(--signal)]"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}


