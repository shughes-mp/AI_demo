import Link from "next/link";
import type {
  TeachingBriefEvidenceMapItem,
  TeachingBriefV1,
} from "@/lib/teaching-brief";
import { stripInlineMarkdown } from "@/lib/report-presentation";

const CLASSIFICATION_STYLES: Record<
  TeachingBriefEvidenceMapItem["classification"],
  string
> = {
  evidence_suggests_ready:
    "border-[rgba(91,127,34,0.3)] bg-[rgba(91,127,34,0.08)] text-[#4e711b]",
  evidence_suggests_gaps:
    "border-[rgba(144,111,18,0.3)] bg-[rgba(144,111,18,0.08)] text-[#7c5f0f]",
  evidence_suggests_review:
    "border-[rgba(223,47,38,0.3)] bg-[rgba(223,47,38,0.07)] text-[var(--signal)]",
};

function ReviewBadge({ state }: { state: TeachingBriefEvidenceMapItem["reviewState"] }) {
  const label =
    state === "reviewed"
      ? "Reviewed"
        : state === "partially_reviewed"
          ? "Partially reviewed"
        : state === "unreviewed"
          ? "Needs instructor review"
          : "No linked signals";

  return (
    <span className="rounded-full border border-[var(--rule)] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--dim-grey)]">
      {label}
    </span>
  );
}

export function TeachingBriefEvidenceMap({
  sessionId,
  evidenceMap,
}: {
  sessionId: string;
  evidenceMap: TeachingBriefV1["evidenceMap"];
}) {
  if (evidenceMap.items.length === 0) {
    return (
      <div className="border border-dashed border-[var(--rule)] p-6 text-sm text-[var(--dim-grey)]">
        No learning-outcome evidence map can be assembled yet. Add learning
        outcomes and collect learner evidence before using this section.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {evidenceMap.items.map((item) => (
        <article key={item.id} className="border border-[var(--rule)] bg-white p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="font-serif text-[25px] leading-tight text-[var(--charcoal)]">
                {item.label}
              </h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${CLASSIFICATION_STYLES[item.classification]}`}
                >
                  {item.classificationLabel}
                </span>
                <ReviewBadge state={item.reviewState} />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:min-w-72">
              <div>
                <dt className="text-xs text-[var(--dim-grey)]">Learners represented</dt>
                <dd className="font-semibold text-[var(--charcoal)]">{item.learnerCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--dim-grey)]">Confidence</dt>
                <dd className="font-semibold capitalize text-[var(--charcoal)]">
                  {item.confidence.level}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-[var(--dim-grey)]">Opportunity coverage</dt>
                <dd className="text-[var(--charcoal)]">{item.opportunityCoverage.summary}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="bg-[rgba(34,34,34,0.025)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--dim-grey)]">
                Why this confidence
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--charcoal)]">
                {item.confidence.rationale}
              </p>
              <p className="mt-3 text-xs leading-5 text-[var(--dim-grey)]">
                {item.reviewSummary}
              </p>
            </div>
            <div className="bg-[rgba(34,34,34,0.025)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--dim-grey)]">
                Qualification
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--charcoal)]">
                {item.contradictoryEvidence[0] ||
                  item.missingEvidence[0] ||
                  "No contradictory or missing evidence was recorded for this item."}
              </p>
            </div>
          </div>

          <details className="mt-5 border-t border-[var(--rule)] pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--teal)]">
              Inspect evidence and review state
            </summary>
            <div className="mt-4 space-y-4">
              {item.evidenceReferences.length > 0 ? (
                item.evidenceReferences.slice(0, 8).map((reference) => (
                  <blockquote
                    key={reference.id}
                    className="border-l-2 border-[var(--teal)] pl-4 text-sm leading-6 text-[var(--charcoal)]"
                  >
                    “{stripInlineMarkdown(reference.quotedText)}”
                    <footer className="mt-1 text-xs text-[var(--dim-grey)]">
                      {reference.learnerName || reference.sourceFilename || reference.citationType}
                      {reference.relevanceRationale
                        ? ` - ${reference.relevanceRationale}`
                        : ""}
                    </footer>
                  </blockquote>
                ))
              ) : (
                <p className="text-sm text-[var(--dim-grey)]">
                  No passage-level references are linked yet. Treat this item as
                  incomplete until evidence is available.
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                {item.signalIds.map((signalId) => (
                  <Link
                    key={signalId}
                    href={`/instructor/${sessionId}/evidence#signal-${signalId}`}
                    className="text-sm font-semibold text-[var(--teal)] hover:underline"
                  >
                    Review signal {signalId.slice(-6)}
                  </Link>
                ))}
                {item.learnerSessionIds.map((studentSessionId) => (
                  <Link
                    key={studentSessionId}
                    href={`/instructor/${sessionId}/monitor?studentSessionId=${studentSessionId}`}
                    className="text-sm font-semibold text-[var(--teal)] hover:underline"
                  >
                    Open learner evidence
                  </Link>
                ))}
              </div>
            </div>
          </details>
        </article>
      ))}
    </div>
  );
}
