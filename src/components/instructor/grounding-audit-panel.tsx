"use client";

import { useEffect, useState } from "react";
import { formatInstructorStatus } from "@/lib/instructor-ux";

interface AuditData {
  readiness: {
    sourceMaterials: number;
    protectedAssessments: number;
    sourceGroundingReady: boolean;
  };
  counts: Record<string, number>;
  groundings: Array<{
    id: string;
    learnerName: string;
    response: string;
    status: string;
    learnerCitationVisible: boolean;
    unsupportedReason: string | null;
    createdAt: string;
    citations: Array<{
      id: string;
      filename: string;
      passageId: string;
      quotedText: string;
      startOffset: number;
      endOffset: number;
    }>;
  }>;
  protectionEvents: Array<{
    id: string;
    learnerName: string;
    triggerType: string;
    action: string;
    sourceConflict: boolean;
    detail: string;
    policyVersion: string;
    createdAt: string;
  }>;
}

export function GroundingAuditPanel({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<AuditData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/sessions/${sessionId}/grounding-audit`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load the grounding audit.");
        return response.json() as Promise<AuditData>;
      })
      .then(setData)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Could not load the grounding audit.");
      });
    return () => controller.abort();
  }, [sessionId]);

  if (error) return <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>;
  if (!data) return <p className="text-sm text-[var(--dim-grey)]">Loading source-use records…</p>;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Uses the reading" value={data.counts.grounded ?? 0} />
        <Metric label="Uses reading + broader explanation" value={data.counts.mixed_grounded ?? 0} />
        <Metric label="Broader context" value={data.counts.background_context ?? 0} />
        <Metric label="Not supported by the reading" value={data.counts.unsupported ?? 0} />
      </section>

      <section className="minerva-card p-6">
        <h2 className="font-serif text-3xl text-[var(--charcoal)]">Source-use readiness</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--dim-grey)]">
          {data.readiness.sourceGroundingReady
            ? `${data.readiness.sourceMaterials} source material(s) are the tutor's primary reference. Claims about the readings are passage-checked; broader explanations and connections are allowed and identified separately.`
            : "No source material is available. The tutor may offer clearly identified general background, but cannot make claims about an assigned reading."}
          {` ${data.readiness.protectedAssessments} protected assessment file(s) are isolated from the normal tutor prompt.`}
        </p>
      </section>

      <section>
        <h2 className="font-serif text-3xl text-[var(--charcoal)]">Source-use details</h2>
        <div className="mt-4 space-y-4">
          {data.groundings.length === 0 ? <Empty text="No source-use details yet. Tutor responses will appear here after learners interact with the session and AI_demo can inspect whether responses used the reading, broader context, or neither." /> : data.groundings.map((item: any) => (
            <article key={item.id} className="minerva-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--charcoal)]">{item.learnerName}</p>
                <span className="rounded-full bg-[rgba(17,120,144,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">{formatInstructorStatus(item.status)}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--dim-grey)]">{item.response}</p>
              {item.unsupportedReason ? <p className="mt-3 text-xs text-[#906f12]">{item.unsupportedReason}</p> : null}
              {item.citations.map((citation: any) => (
                <blockquote key={citation.id} className="mt-4 border-l-2 border-[var(--teal)] pl-4 text-sm text-[var(--charcoal)]">
                  “{citation.quotedText}”
                  <footer className="mt-2 text-xs text-[var(--dim-grey)]">{citation.filename} · passage {citation.passageId}</footer>
                </blockquote>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-3xl text-[var(--charcoal)]">Protected-material interventions</h2>
        <div className="mt-4 space-y-4">
          {data.protectionEvents.length === 0 ? <Empty text="No protected-answer attempts have influenced coaching. If a learner asks for or repeats protected answer material, the event will appear here for instructor review." /> : data.protectionEvents.map((item: any) => (
            <article key={item.id} className="minerva-card p-6">
              <p className="text-sm font-semibold text-[var(--charcoal)]">{item.learnerName} · {item.triggerType.replace(/_/g, " ")}</p>
              <p className="mt-2 text-sm text-[var(--dim-grey)]">{item.detail}</p>
              <p className="mt-2 text-xs text-[var(--dim-grey)]">Action: {item.action.replace(/_/g, " ")}{item.sourceConflict ? " · Source overlap detected; protection took precedence." : ""}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="minerva-card p-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--dim-grey)]">{label}</p><p className="mt-2 font-serif text-4xl text-[var(--charcoal)]">{value}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="border border-dashed border-[var(--rule)] p-6 text-sm text-[var(--dim-grey)]">{text}</div>;
}
