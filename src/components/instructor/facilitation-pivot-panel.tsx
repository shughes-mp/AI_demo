"use client";

import { useCallback, useEffect, useState } from "react";
import { INSTRUCTOR_LABELS } from "@/lib/instructor-ux";
import type {
  FacilitationRecommendationRecord,
  EvidenceSignalStatus,
} from "@/types";

const MODE_COPY = {
  observer: {
    label: "Observer",
    action: "Step back",
    className: "border-[var(--teal)] bg-[rgba(17,120,144,0.06)]",
  },
  guide: {
    label: "Guide",
    action: "Offer one focusing prompt",
    className: "border-[#b58a22] bg-[rgba(181,138,34,0.07)]",
  },
  conductor: {
    label: "Conductor",
    action: "Use a brief shared reset",
    className: "border-[var(--signal)] bg-[rgba(223,47,38,0.06)]",
  },
} as const;

function evidenceStatusLabel(status: EvidenceSignalStatus) {
  return status.replaceAll("_", " ");
}

function PivotCard({
  pivot,
  canEdit,
  onUpdated,
}: {
  key?: string | number | null;
  pivot: FacilitationRecommendationRecord;
  canEdit: boolean;
  onUpdated: (pivot: FacilitationRecommendationRecord) => void;
}) {
  const [selectedMode, setSelectedMode] = useState(pivot.effectiveMode);
  const [phrase, setPhrase] = useState(pivot.effectivePhrase ?? "");
  const [actionUsed, setActionUsed] = useState(pivot.actionUsed ?? "");
  const [helpfulness, setHelpfulness] = useState(
    pivot.helpfulness ?? "not_yet_known"
  );
  const [feedback, setFeedback] = useState(pivot.instructorFeedback ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const modeCopy = MODE_COPY[pivot.effectiveMode];

  async function update(body: Record<string, unknown>, successMessage: string) {
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/sessions/${pivot.sessionId}/facilitation-pivots/${pivot.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = (await response.json()) as {
        pivot?: FacilitationRecommendationRecord;
        error?: string;
      };
      if (!response.ok || !data.pivot) {
        throw new Error(data.error || "The facilitation decision could not be saved.");
      }
      onUpdated(data.pivot);
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The decision could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className={`border-l-4 p-5 ${modeCopy.className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--dim-grey)]">
            Recommended pivot · {pivot.scopeType} scope
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--charcoal)]">
            {modeCopy.label} · {modeCopy.action}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--dim-grey)]">
            {pivot.observedCondition}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-[var(--rule)] bg-white px-3 py-1 font-semibold capitalize">
            {pivot.confidenceLevel} confidence
          </span>
          <span className="rounded-full border border-[var(--rule)] bg-white px-3 py-1 font-semibold capitalize">
            {pivot.reviewState.replaceAll("_", " ")}
          </span>
          <span className="rounded-full border border-[var(--rule)] bg-white px-3 py-1">
            Rule-based
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-[var(--rule)] bg-white p-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--teal)]">
            Why this is suggested
          </h4>
          <p className="mt-2 text-sm leading-6 text-[var(--charcoal)]">{pivot.rationale}</p>
          {pivot.diagnosisQuestion ? (
            <p className="mt-3 text-sm leading-6 text-[var(--dim-grey)]">
              <strong>Check first:</strong> {pivot.diagnosisQuestion}
            </p>
          ) : null}
        </section>
        <section className="rounded-md border border-[var(--rule)] bg-white p-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--teal)]">
            One proportionate move
          </h4>
          <p className="mt-2 text-sm leading-6 text-[var(--charcoal)]">
            {pivot.suggestedMove}
          </p>
          {pivot.effectivePhrase ? (
            <blockquote className="mt-3 border-l-2 border-[var(--teal)] pl-3 text-sm italic leading-6 text-[var(--dim-grey)]">
              “{pivot.effectivePhrase}”
            </blockquote>
          ) : null}
        </section>
      </div>

      <details className="mt-4 rounded-md border border-[var(--rule)] bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--charcoal)]">
          Inspect triggering evidence ({pivot.triggeringEvidence.length})
        </summary>
        <div className="mt-3 space-y-3">
          {pivot.triggeringEvidence.length === 0 ? (
            <p className="text-sm text-[var(--dim-grey)]">
              No inspectable trigger is available. Do not act on this recommendation.
            </p>
          ) : (
            pivot.triggeringEvidence.map((evidence) => (
              <div key={evidence.signalId} className="border-l-2 border-[var(--rule)] pl-3">
                <p className="text-sm text-[var(--charcoal)]">{evidence.claim}</p>
                <p className="mt-1 text-xs text-[var(--dim-grey)]">
                  {evidence.learnerName ?? "Class-level evidence"} · {evidenceStatusLabel(evidence.status)}
                </p>
              </div>
            ))
          )}
        </div>
      </details>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <p className="rounded-md bg-white p-3 text-[var(--dim-grey)]">
          <strong className="text-[var(--charcoal)]">Escalate only when:</strong>{" "}
          {pivot.escalationCondition ?? "No automatic escalation is recommended."}
        </p>
        <p className="rounded-md bg-white p-3 text-[var(--dim-grey)]">
          <strong className="text-[var(--charcoal)]">Step back when:</strong>{" "}
          {pivot.releaseCondition}
        </p>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--dim-grey)]">
        <strong>Limit:</strong> {pivot.limitations} Rule {pivot.ruleVersion}.
      </p>

      {canEdit ? (
        <div className="mt-5 border-t border-[var(--rule)] pt-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => update({ reviewState: "accepted" }, "Recommendation accepted.")}
              className="minerva-button"
            >
              Accept recommendation
            </button>
          </div>

          <div className="mt-4 rounded-md border border-[var(--rule)] bg-white p-4">
            <label className="text-sm font-medium text-[var(--charcoal)]">
              If this recommendation is inappropriate, briefly explain why
              <textarea
                value={feedback}
                onChange={(event: any) => setFeedback(event.target.value)}
                rows={2}
                maxLength={2000}
                className="minerva-input mt-2 w-full"
              />
            </label>
            <button
              type="button"
              disabled={isSaving || feedback.trim().length === 0}
              onClick={() => update({ reviewState: "rejected", instructorFeedback: feedback }, "Recommendation marked inappropriate.")}
              className="minerva-button minerva-button-secondary mt-3"
            >
              Mark inappropriate
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-[var(--charcoal)]">
              Choose a different mode
              <select
                value={selectedMode}
                onChange={(event: any) => setSelectedMode(event.target.value as typeof selectedMode)}
                className="minerva-input mt-2 w-full"
              >
                <option value="observer">Observer · step back</option>
                <option value="guide">Guide · focusing prompt</option>
                <option value="conductor">Conductor · brief reset</option>
              </select>
            </label>
            <label className="text-sm font-medium text-[var(--charcoal)]">
              Edit the ready-to-use phrase
              <textarea
                value={phrase}
                onChange={(event: any) => setPhrase(event.target.value)}
                rows={3}
                maxLength={800}
                className="minerva-input mt-2 w-full"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              update(
                { selectedMode, editedPhrase: phrase, reviewState: "modified" },
                "Your facilitation choice was saved."
              )
            }
            className="minerva-button minerva-button-secondary mt-3"
          >
            Save my choice
          </button>

          <details className="mt-4 rounded-md border border-[var(--rule)] bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--charcoal)]">
              Record what happened
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-[var(--charcoal)]">
                Move used
                <textarea
                  value={actionUsed}
                  onChange={(event: any) => setActionUsed(event.target.value)}
                  rows={3}
                  maxLength={1200}
                  className="minerva-input mt-2 w-full"
                />
              </label>
              <label className="text-sm font-medium text-[var(--charcoal)]">
                Did it help?
                <select
                  value={helpfulness}
                  onChange={(event: any) => setHelpfulness(event.target.value as typeof helpfulness)}
                  className="minerva-input mt-2 w-full"
                >
                  <option value="not_yet_known">Not yet known</option>
                  <option value="helped">Yes</option>
                  <option value="partly_helped">Partly</option>
                  <option value="did_not_help">No</option>
                </select>
              </label>
              <label className="text-sm font-medium text-[var(--charcoal)] md:col-span-2">
                Why was this useful or inappropriate?
                <textarea
                  value={feedback}
                  onChange={(event: any) => setFeedback(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="minerva-input mt-2 w-full"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={isSaving || actionUsed.trim().length === 0}
              onClick={() =>
                update(
                  {
                    actionUsed,
                    helpfulness,
                    instructorFeedback: feedback,
                    selectedMode,
                    editedPhrase: phrase,
                    reviewState: "used",
                  },
                  "The move and its result were recorded."
                )
              }
              className="minerva-button mt-3"
            >
              Record move used
            </button>
          </details>
          <p aria-live="polite" className="mt-3 text-sm text-[var(--dim-grey)]">
            {isSaving ? "Saving…" : message}
          </p>
        </div>
      ) : (
        <p className="mt-4 border-t border-[var(--rule)] pt-4 text-sm text-[var(--dim-grey)]">
          Viewer access is read-only. An owner or editor can accept, change, reject, or record a move.
        </p>
      )}
    </article>
  );
}

export function FacilitationPivotPanel({
  sessionId,
  live = false,
}: {
  sessionId: string;
  live?: boolean;
}) {
  const [pivots, setPivots] = useState<FacilitationRecommendationRecord[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/facilitation-pivots`);
      const data = (await response.json()) as {
        pivots?: FacilitationRecommendationRecord[];
        canEdit?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Facilitation pivots could not be loaded.");
      setPivots(data.pivots ?? []);
      setCanEdit(Boolean(data.canEdit));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Facilitation pivots could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!live) return;
    const interval = window.setInterval(load, 15000);
    return () => window.clearInterval(interval);
  }, [live, load]);

  async function refresh() {
    setIsRefreshing(true);
    setMessage("");
    try {
      const response = await fetch(`/api/sessions/${sessionId}/facilitation-pivots`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        pivots?: FacilitationRecommendationRecord[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Recommendations could not be refreshed.");
      setPivots(data.pivots ?? []);
      setMessage("Recommendations refreshed from the current evidence.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Recommendations could not be refreshed.");
    } finally {
      setIsRefreshing(false);
    }
  }

  function replacePivot(updated: FacilitationRecommendationRecord) {
    setPivots((current: any) => current.map((pivot: any) => (pivot.id === updated.id ? updated : pivot)));
  }

  return (
    <section className="minerva-card p-6 md:p-8" aria-labelledby="facilitation-pivots-heading">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="eyebrow eyebrow-teal">{INSTRUCTOR_LABELS.teachingMoves}</p>
          <h2 id="facilitation-pivots-heading" className="mt-2 font-serif text-[30px] leading-tight text-[var(--charcoal)]">
            Recommended pivots
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--dim-grey)]">
            AI_demo suggests how much instructor intervention appears proportionate. It never acts automatically: inspect the evidence, decide what to do, and step back when learners can continue.
          </p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            className="minerva-button minerva-button-secondary"
          >
            {isRefreshing ? "Refreshing…" : "Refresh recommendations"}
          </button>
        ) : null}
      </div>

      <p aria-live="polite" className="mt-3 text-sm text-[var(--dim-grey)]">
        {message}
      </p>
      {isLoading ? (
        <p className="mt-5 text-sm text-[var(--dim-grey)]">Loading recommendations…</p>
      ) : pivots.length === 0 ? (
        <div className="mt-5 border border-[var(--rule)] bg-[rgba(34,34,34,0.02)] p-5">
          <p className="font-medium text-[var(--charcoal)]">No teaching move is recommended yet.</p>
          <p className="mt-2 text-sm leading-6 text-[var(--dim-grey)]">
            Sparse evidence, silence, or delay does not automatically justify intervention. Recommendations will appear after there is inspectable learner evidence.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {pivots.map((pivot: any) => (
            <PivotCard key={pivot.id} pivot={pivot} canEdit={canEdit} onUpdated={replacePivot} />
          ))}
        </div>
      )}
    </section>
  );
}
