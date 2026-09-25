"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { InstructorWorkspaceNavigation } from "@/components/instructor/workspace-navigation";
import { LoadingState } from "@/components/ui/loading-state";
import { INSTRUCTOR_LABELS } from "@/lib/instructor-ux";
import type {
  AnticipatedPivotPoint,
  ParticipationPlan,
  PlannedFacilitationMode,
  SessionDesignCheck,
} from "@/lib/session-planning";

interface PlanningResponse {
  sessionId: string;
  planningVersion: string;
  canEdit: boolean;
  plan: {
    openingQuestion: string;
    taskInstructions: string;
    intendedOutput: string;
    participation: ParticipationPlan;
    pivots: AnticipatedPivotPoint[];
  };
  preview: {
    sessionName: string;
    orientation: string;
    openingQuestion: string;
    sessionPurpose: { label: string; cognitiveLevel: string; description: string };
    taskInstructions: string;
    evidenceQuestions: Array<{ id: string; prompt: string; processLevel: string }>;
    helpBehavior: readonly string[];
    sourceGroundingMessage: string;
    protectedAssessmentMessage: string;
    intendedOutput: string;
    summaryAndReflection: string;
  };
  checks: SessionDesignCheck[];
  summary: { ready: number; review: number; needsAttention: number; total: number };
}

const PARTICIPATION_FIELDS: Array<{
  key: keyof ParticipationPlan;
  label: string;
  prompt: string;
  placeholder: string;
}> = [
  {
    key: "individualThinking",
    label: "Individual thinking time",
    prompt: "How will learners form an initial response before hearing others?",
    placeholder: "e.g. Give learners two quiet minutes to identify a claim and passage.",
  },
  {
    key: "peerExchange",
    label: "Pair or group exchange",
    prompt: "How might learners compare or test their reasoning together?",
    placeholder: "e.g. Compare passages in pairs before whole-class discussion.",
  },
  {
    key: "alternativeChannels",
    label: "Alternative response channels",
    prompt: "What options exist beyond speaking in front of the class?",
    placeholder: "e.g. Written response, anonymous poll, chat, or shared document.",
  },
  {
    key: "quieterVoices",
    label: "Plan for quieter voices",
    prompt: "How will participation remain available without forced disclosure?",
    placeholder: "e.g. Invite written contributions before asking for volunteers.",
  },
  {
    key: "concentrationReset",
    label: "Reset concentrated participation",
    prompt: "What will you do if the same few learners continue to dominate?",
    placeholder: "e.g. Pause, return to individual writing, then use a structured round.",
  },
];

const MODE_LABELS: Record<PlannedFacilitationMode, string> = {
  observer: "Observer · preserve learner control",
  guide: "Guide · offer one focusing prompt",
  conductor: "Conductor · use a brief shared reset",
};

function CheckBadge({ status }: { status: SessionDesignCheck["status"] }) {
  const copy = {
    ready: {
      label: "Ready",
      className: "bg-[rgba(17,120,144,0.10)] text-[var(--teal)]",
    },
    review: {
      label: "Review",
      className: "bg-[rgba(144,111,18,0.12)] text-[#80620f]",
    },
    needs_attention: {
      label: "Needs attention",
      className: "bg-[rgba(223,47,38,0.10)] text-[var(--signal)]",
    },
  }[status];

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${copy.className}`}
    >
      {copy.label}
    </span>
  );
}

function PreviewItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-[var(--rule)] py-5 last:border-b-0">
      <p className="eyebrow eyebrow-teal">{label}</p>
      <div className="mt-2 text-sm leading-6 text-[var(--charcoal)]">{children}</div>
    </div>
  );
}

export default function SessionPlanningPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();
  const [data, setData] = useState<PlanningResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<"save" | "generate" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/sessions/${sessionId}/planning`);
      const result = (await response.json()) as PlanningResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || "Planning could not be loaded.");
      setData(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Planning could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function updatePlan(updates: Partial<PlanningResponse["plan"]>) {
    setData((current: any) =>
      current ? { ...current, plan: { ...current.plan, ...updates } } : current
    );
  }

  function updateParticipation(key: keyof ParticipationPlan, value: string) {
    if (!data) return;
    updatePlan({ participation: { ...data.plan.participation, [key]: value } });
  }

  function updatePivot(index: number, updates: Partial<AnticipatedPivotPoint>) {
    if (!data) return;
    const pivots = data.plan.pivots.map((pivot: any, pivotIndex: any) =>
      pivotIndex === index ? { ...pivot, ...updates } : pivot
    );
    updatePlan({ pivots });
  }

  function addPivot() {
    if (!data) return;
    const pivot: AnticipatedPivotPoint = {
      id: `instructor-${Date.now()}`,
      likelyWobblePoint: "",
      watchFor: "",
      diagnosisQuestion: "",
      initialMode: "guide",
      guidePhrase: "",
      conductorPhrase: "",
      escalationCondition: "",
      releaseCondition: "",
      intendedOutput: data.plan.intendedOutput,
      createdBy: "instructor",
    };
    updatePlan({ pivots: [...data.plan.pivots, pivot] });
  }

  async function save(options: { returnToShare?: boolean } = {}) {
    if (!data) return;
    setWorking("save");
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/planning`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.plan),
      });
      const result = (await response.json()) as PlanningResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || "Planning could not be saved.");
      setData(result);
      setNotice(
        options.returnToShare
          ? "Preview saved. Returning to the learner link."
          : "Preview saved and learner experience checked."
      );
      if (options.returnToShare) {
        router.push(`/instructor/${sessionId}#learner-link`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Planning could not be saved.");
    } finally {
      setWorking(null);
    }
  }

  async function generatePivots() {
    setWorking("generate");
    setError(null);
    try {
      if (data) {
        const saveResponse = await fetch(`/api/sessions/${sessionId}/planning`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data.plan),
        });
        if (!saveResponse.ok) {
          const saveError = await saveResponse.json().catch(() => ({}));
          throw new Error(saveError.error || "Save the plan before generating pivots.");
        }
      }
      const response = await fetch(`/api/sessions/${sessionId}/planning`, {
        method: "POST",
      });
      const result = (await response.json()) as PlanningResponse & { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Pivots could not be generated.");
      }
      setData(result);
      setNotice("Likely stuck points generated from the current session design.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pivots could not be generated.");
    } finally {
      setWorking(null);
    }
  }

  if (loading) {
    return (
      <main className="minerva-page">
        <LoadingState message="Preparing the learner preview..." />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="minerva-page">
        <div className="minerva-shell px-4 py-16 md:px-8">
          <p className="eyebrow eyebrow-rose">Planning unavailable</p>
          <h1 className="section-title mt-4">The session plan could not be loaded.</h1>
          <p className="mt-4 text-[var(--dim-grey)]">{error}</p>
          <button type="button" className="minerva-button mt-6" onClick={() => void load()}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="minerva-page">
      <div className="minerva-shell space-y-8 px-4 py-10 md:px-8 md:py-14">
        <header className="minerva-card p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <nav className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dim-grey)]">
                <Link href="/instructor">Sessions</Link>
                <span>/</span>
                <Link href={`/instructor/${sessionId}`}>Setup</Link>
                <span>/</span>
                <span className="text-[var(--charcoal)]">{INSTRUCTOR_LABELS.planning}</span>
              </nav>
              <p className="eyebrow eyebrow-teal mt-6">Before learners begin</p>
              <h1 className="section-title mt-3">
                Preview the learner experience before sharing.
              </h1>
              <p className="body-copy muted-copy mt-5 max-w-3xl">
                Check what learners will encounter, confirm the design is usable,
                and prepare a small number of proportionate moves in case learners
                get stuck.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/instructor/${sessionId}`}
                className="minerva-button minerva-button-secondary"
              >
                Back to setup
              </Link>
              {data.canEdit ? (
                <button
                  type="button"
                  className="minerva-button"
                  disabled={working !== null}
                  onClick={() => void save()}
                >
                  {working === "save" ? (
                    <LoadingState variant="button" message="Saving" />
                  ) : (
                    "Save plan"
                  )}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-7">
            <InstructorWorkspaceNavigation sessionId={sessionId} showItems={false} />
          </div>
        </header>

        {notice ? (
          <div
            role="status"
            className="border border-[rgba(17,120,144,0.25)] bg-[rgba(17,120,144,0.06)] px-5 py-3 text-sm text-[var(--teal)]"
          >
            {notice}
          </div>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="border border-[rgba(223,47,38,0.25)] bg-[rgba(223,47,38,0.06)] px-5 py-3 text-sm text-[var(--signal)]"
          >
            {error}
          </div>
        ) : null}

        <section className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="minerva-card p-6 md:p-8">
            <p className="eyebrow eyebrow-teal">Learner experience preview</p>
            <h2 className="mt-3 font-serif text-4xl text-[var(--charcoal)]">
              What learners will see and do
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--dim-grey)]">
              This preview uses the same session configuration and policy language
              as the live learner flow.
            </p>
            <div className="mt-6">
              <PreviewItem label="Orientation">{data.preview.orientation}</PreviewItem>
              <PreviewItem label="Opening question">
                <blockquote className="border-l-2 border-[var(--teal)] pl-4 italic">
                  “{data.preview.openingQuestion}”
                </blockquote>
              </PreviewItem>
              <PreviewItem label="Purpose">
                <strong>
                  {data.preview.sessionPurpose.label} ·{" "}
                  {data.preview.sessionPurpose.cognitiveLevel}
                </strong>
                <p className="mt-1 text-[var(--dim-grey)]">
                  {data.preview.sessionPurpose.description}
                </p>
              </PreviewItem>
              <PreviewItem label="Task">{data.preview.taskInstructions}</PreviewItem>
              <PreviewItem label="Evidence questions">
                {data.preview.evidenceQuestions.length > 0 ? (
                  <ol className="list-decimal space-y-2 pl-5">
                    {data.preview.evidenceQuestions.map((question: any) => (
                      <li key={question.id}>
                        {question.prompt}{" "}
                        <span className="text-xs text-[var(--dim-grey)]">
                          ({question.processLevel})
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-[var(--signal)]">No evidence questions yet.</p>
                )}
              </PreviewItem>
              <PreviewItem label="Help behavior">
                <p>{data.preview.helpBehavior[0]}</p>
                <p className="mt-1 text-[var(--dim-grey)]">
                  Support increases step by step and ends with learner restatement
                  or application.
                </p>
              </PreviewItem>
              <PreviewItem label="Reading expectation">
                {data.preview.sourceGroundingMessage}
              </PreviewItem>
            </div>
          </div>

          <section
            className="minerva-card p-6 md:p-8"
            aria-labelledby="quality-checks-heading"
          >
            <p className="eyebrow eyebrow-teal">Is this ready?</p>
            <h2
              id="quality-checks-heading"
              className="mt-3 font-serif text-4xl text-[var(--charcoal)]"
            >
              Fix risks before launch
            </h2>
            <div className="mt-6 space-y-3">
              {data.checks.map((check: any) => (
                <article key={check.code} className="border border-[var(--rule)] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-[var(--charcoal)]">
                      {check.title}
                    </h3>
                    <CheckBadge status={check.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--dim-grey)]">
                    {check.detail}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section
          className="minerva-card p-6 md:p-8"
          aria-labelledby="planning-basics-heading"
        >
          <p className="eyebrow eyebrow-teal">Planning basics</p>
          <h2
            id="planning-basics-heading"
            className="mt-3 font-serif text-4xl text-[var(--charcoal)]"
          >
            Make the task explicit
          </h2>
          <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-5">
              <p className="text-sm leading-6 text-[var(--dim-grey)]">
                Tighten the wording learners will encounter only if the readiness
                checks suggest a gap. This is optional planning support, not
                another required setup form.
              </p>
              <PreviewItem label="Protected assessment handling">
                {data.preview.protectedAssessmentMessage}
              </PreviewItem>
              <PreviewItem label="Intended output">
                {data.preview.intendedOutput}
              </PreviewItem>
              <PreviewItem label="Summary and reflection">
                {data.preview.summaryAndReflection}
              </PreviewItem>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="minerva-label">Opening question</span>
                <span className="mt-1 block text-xs text-[var(--dim-grey)]">
                  The first prior-knowledge question AI_demo should ask.
                </span>
                <textarea
                  value={data.plan.openingQuestion}
                  onChange={(event: any) =>
                    updatePlan({ openingQuestion: event.target.value })
                  }
                  disabled={!data.canEdit}
                  rows={3}
                  className="minerva-input mt-2 w-full resize-y"
                  placeholder={data.preview.openingQuestion}
                />
              </label>

              <label className="block">
                <span className="minerva-label">Task instructions</span>
                <span className="mt-1 block text-xs text-[var(--dim-grey)]">
                  Tell learners what cognitive work to do, without giving away the
                  answer.
                </span>
                <textarea
                  value={data.plan.taskInstructions}
                  onChange={(event: any) =>
                    updatePlan({ taskInstructions: event.target.value })
                  }
                  disabled={!data.canEdit}
                  rows={4}
                  className="minerva-input mt-2 w-full resize-y"
                  placeholder="Explain a claim, identify the passage that supports it, and test it against a competing interpretation."
                />
              </label>

              <label className="block">
                <span className="minerva-label">Intended usable output</span>
                <span className="mt-1 block text-xs text-[var(--dim-grey)]">
                  What should be available for debrief or follow-up?
                </span>
                <textarea
                  value={data.plan.intendedOutput}
                  onChange={(event: any) =>
                    updatePlan({ intendedOutput: event.target.value })
                  }
                  disabled={!data.canEdit}
                  rows={3}
                  className="minerva-input mt-2 w-full resize-y"
                  placeholder="A source-supported distinction learners can apply during class."
                />
              </label>
            </div>
          </div>
        </section>

        <section
          className="minerva-card p-6 md:p-8"
          aria-labelledby="anticipated-pivots-heading"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="eyebrow eyebrow-teal">{INSTRUCTOR_LABELS.stuck}</p>
              <h2
                id="anticipated-pivots-heading"
                className="mt-3 font-serif text-4xl text-[var(--charcoal)]"
              >
                Prepare without over-scripting
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--dim-grey)]">
                Each note names what to watch for, one proportionate response,
                what would justify escalation, and when to step back.
              </p>
            </div>
            {data.canEdit ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="minerva-button minerva-button-secondary"
                  onClick={addPivot}
                >
                  Add pivot
                </button>
                <button
                  type="button"
                  className="minerva-button"
                  disabled={working !== null}
                  onClick={() => void generatePivots()}
                >
                  {working === "generate" ? (
                    <LoadingState variant="button" message="Generating" />
                  ) : (
                    "Generate from session"
                  )}
                </button>
              </div>
            ) : null}
          </div>

          {data.plan.pivots.length === 0 ? (
            <div className="mt-6 border border-dashed border-[var(--rule)] p-8 text-center text-sm text-[var(--dim-grey)]">
              No stuck-point plan yet. You can still share the session, or generate
              a starting set if you want to prepare likely teaching moves.
            </div>
          ) : null}

          <div className="mt-6 space-y-6">
            {data.plan.pivots.map((pivot: any, index: any) => (
              <article
                key={pivot.id}
                className="border-l-4 border-[var(--teal)] bg-[rgba(17,120,144,0.04)] p-5 md:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="eyebrow">
                    Pivot {index + 1} · {pivot.createdBy}
                  </p>
                  {data.canEdit ? (
                    <button
                      type="button"
                      className="text-sm font-semibold text-[var(--signal)]"
                      onClick={() =>
                        updatePlan({
                          pivots: data.plan.pivots.filter(
                            (_: any, itemIndex: any) => itemIndex !== index
                          ),
                        })
                      }
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="minerva-label">Likely wobble point</span>
                    <textarea
                      rows={2}
                      disabled={!data.canEdit}
                      value={pivot.likelyWobblePoint}
                      onChange={(event: any) =>
                        updatePivot(index, { likelyWobblePoint: event.target.value })
                      }
                      className="minerva-input mt-2 w-full resize-y"
                    />
                  </label>

                  <label className="block">
                    <span className="minerva-label">What to watch for</span>
                    <textarea
                      rows={3}
                      disabled={!data.canEdit}
                      value={pivot.watchFor}
                      onChange={(event: any) =>
                        updatePivot(index, { watchFor: event.target.value })
                      }
                      className="minerva-input mt-2 w-full resize-y"
                    />
                  </label>

                  <label className="block">
                    <span className="minerva-label">Diagnosis question</span>
                    <textarea
                      rows={3}
                      disabled={!data.canEdit}
                      value={pivot.diagnosisQuestion}
                      onChange={(event: any) =>
                        updatePivot(index, { diagnosisQuestion: event.target.value })
                      }
                      className="minerva-input mt-2 w-full resize-y"
                    />
                  </label>

                  <label className="block">
                    <span className="minerva-label">Initial facilitation mode</span>
                    <select
                      disabled={!data.canEdit}
                      value={pivot.initialMode}
                      onChange={(event: any) =>
                        updatePivot(index, {
                          initialMode: event.target.value as PlannedFacilitationMode,
                        })
                      }
                      className="minerva-input mt-2 w-full"
                    >
                      {Object.entries(MODE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="minerva-label">Intended usable output</span>
                    <textarea
                      rows={3}
                      disabled={!data.canEdit}
                      value={pivot.intendedOutput}
                      onChange={(event: any) =>
                        updatePivot(index, { intendedOutput: event.target.value })
                      }
                      className="minerva-input mt-2 w-full resize-y"
                    />
                  </label>

                  <label className="block">
                    <span className="minerva-label">Guide phrase</span>
                    <textarea
                      rows={3}
                      disabled={!data.canEdit}
                      value={pivot.guidePhrase}
                      onChange={(event: any) =>
                        updatePivot(index, { guidePhrase: event.target.value })
                      }
                      className="minerva-input mt-2 w-full resize-y"
                    />
                  </label>

                  <label className="block">
                    <span className="minerva-label">Conductor phrase</span>
                    <textarea
                      rows={3}
                      disabled={!data.canEdit}
                      value={pivot.conductorPhrase}
                      onChange={(event: any) =>
                        updatePivot(index, { conductorPhrase: event.target.value })
                      }
                      className="minerva-input mt-2 w-full resize-y"
                    />
                  </label>

                  <label className="block">
                    <span className="minerva-label">Escalate only when</span>
                    <textarea
                      rows={3}
                      disabled={!data.canEdit}
                      value={pivot.escalationCondition}
                      onChange={(event: any) =>
                        updatePivot(index, {
                          escalationCondition: event.target.value,
                        })
                      }
                      className="minerva-input mt-2 w-full resize-y"
                    />
                  </label>

                  <label className="block">
                    <span className="minerva-label">Step back when</span>
                    <textarea
                      rows={3}
                      disabled={!data.canEdit}
                      value={pivot.releaseCondition}
                      onChange={(event: any) =>
                        updatePivot(index, { releaseCondition: event.target.value })
                      }
                      className="minerva-input mt-2 w-full resize-y"
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="participation-planning"
          className="minerva-card scroll-mt-24 p-6 md:p-8"
          aria-labelledby="participation-heading"
        >
          <p className="eyebrow eyebrow-teal">Participation planning</p>
          <h2
            id="participation-heading"
            className="mt-3 font-serif text-4xl text-[var(--charcoal)]"
          >
            Keep more learners in the work
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--dim-grey)]">
            These prompts are planning aids, not assumptions about learner
            motivation or ability.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {PARTICIPATION_FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="minerva-label">{field.label}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--dim-grey)]">
                  {field.prompt}
                </span>
                <textarea
                  rows={3}
                  disabled={!data.canEdit}
                  value={data.plan.participation[field.key]}
                  onChange={(event: any) => updateParticipation(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className="minerva-input mt-2 w-full resize-y"
                />
              </label>
            ))}
          </div>
        </section>

        <section
          className="minerva-card p-6 md:p-8"
          aria-labelledby="ready-to-return-heading"
        >
          <p className="eyebrow eyebrow-teal">Ready to return?</p>
          <h2
            id="ready-to-return-heading"
            className="mt-3 font-serif text-4xl text-[var(--charcoal)]"
          >
            What to do next
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--dim-grey)]">
            {data.summary.needsAttention > 0
              ? "Address the items marked Needs attention, save this preview, then return to setup to share the learner link."
              : "Save this preview, return to setup, and copy the learner link when you are ready to launch."}
          </p>
          {data.canEdit ? (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="minerva-button"
                disabled={working !== null}
                onClick={() => void save({ returnToShare: true })}
              >
                {working === "save" ? (
                  <LoadingState variant="button" message="Saving" />
                ) : (
                  "Save and continue to learner link"
                )}
              </button>
            </div>
          ) : (
            <p className="mt-6 border border-[var(--rule)] bg-white p-5 text-sm text-[var(--dim-grey)]">
              Viewer access is read-only. An owner or editor can update this plan.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

