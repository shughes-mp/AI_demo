import Link from "next/link";

import { GroundingAuditPanel } from "@/components/instructor/grounding-audit-panel";
import { InstructorWorkspaceNavigation } from "@/components/instructor/workspace-navigation";
import { INSTRUCTOR_LABELS } from "@/lib/instructor-ux";

export default async function GroundingAuditPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <main className="min-h-screen bg-[var(--paper)] px-5 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <nav className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--dim-grey)]">
          <Link href={`/instructor/${sessionId}`} className="hover:text-[var(--teal)]">Session workspace</Link>
          <span className="px-2">/</span>
          <span className="text-[var(--charcoal)]">{INSTRUCTOR_LABELS.grounding}</span>
        </nav>
        <header className="mb-8 mt-5">
          <h1 className="font-serif text-[44px] leading-none tracking-[-0.03em] text-[var(--charcoal)]">{INSTRUCTOR_LABELS.grounding}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--dim-grey)]">
            Check whether AI_demo used the assigned reading responsibly, where it added broader explanation, and when protected assessment material changed the coaching path.
          </p>
          <div className="mt-6">
            <InstructorWorkspaceNavigation sessionId={sessionId} />
          </div>
        </header>
        <GroundingAuditPanel sessionId={sessionId} />
      </div>
    </main>
  );
}
