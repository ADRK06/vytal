"use client";

import { PostureCard } from "@/components/dashboard/PostureCard";
import { HydrationCard } from "@/components/dashboard/HydrationCard";
import { SessionTimer } from "@/components/dashboard/SessionTimer";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSession } from "@/hooks/useSession";

const BUTTON_CLASSES =
  "self-start rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 font-mono text-xs uppercase tracking-wide text-text transition-colors hover:bg-white/[0.12]";

// TODO: CorrelationChart.
export default function DashboardPage() {
  const { sessionId, status, startSession, endSession } = useSession();

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-16">
      {status === "active" && sessionId && (
        <>
          <div className="mb-6 flex max-w-3xl items-center gap-4">
            <div className="flex-1">
              <SessionTimer />
            </div>
            <button onClick={endSession} className={BUTTON_CLASSES}>
              End session
            </button>
          </div>

          <div className="grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
            <PostureCard sessionId={sessionId} />
            <HydrationCard sessionId={sessionId} />
          </div>
        </>
      )}

      {status === "starting" && (
        <div className="max-w-3xl">
          <EmptyState message="Starting session…" />
        </div>
      )}

      {status === "ended" && (
        <div className="flex max-w-3xl flex-col items-start gap-3">
          <EmptyState message="Session ended." />
          <button onClick={startSession} className={BUTTON_CLASSES}>
            Start new session
          </button>
        </div>
      )}
    </main>
  );
}
