"use client";

import { PostureCard } from "@/components/dashboard/PostureCard";
import { HydrationCard } from "@/components/dashboard/HydrationCard";
import { SessionTimer } from "@/components/dashboard/SessionTimer";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSession } from "@/hooks/useSession";

// TODO: CorrelationChart.
export default function DashboardPage() {
  const { sessionId } = useSession();

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-16">
      <div className="mb-6 max-w-3xl">
        <SessionTimer />
      </div>

      {sessionId ? (
        <div className="grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          <PostureCard sessionId={sessionId} />
          <HydrationCard sessionId={sessionId} />
        </div>
      ) : (
        <div className="max-w-3xl">
          <EmptyState message="Starting session…" />
        </div>
      )}
    </main>
  );
}
