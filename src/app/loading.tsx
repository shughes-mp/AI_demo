import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f5f4f1] px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <LoadingState message="Preparing your AI_demo workspace…" />
      </div>
    </main>
  );
}
