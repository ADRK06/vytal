"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PostureCard } from "@/components/dashboard/PostureCard";
import { HydrationCard } from "@/components/dashboard/HydrationCard";
import { SessionTimer } from "@/components/dashboard/SessionTimer";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSession } from "@/hooks/useSession";

const BUTTON_CLASSES =
  "self-start rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 font-mono text-xs uppercase tracking-wide text-text transition-colors hover:bg-white/[0.12]";

// TODO: CorrelationChart.
export default function DashboardPage() {
  const router = useRouter();
  const { sessionId, status, startSession, endSession } = useSession();
  const resumedRef = useRef(false);

  // Calibration redirects back here with ?calibrated=1 once a fresh
  // baseline has been captured — that's the only case a session should
  // start automatically, since the user already made an explicit choice
  // by clicking "Start Session" before calibration ran. Read via
  // window.location rather than useSearchParams() so this client
  // component doesn't need a Suspense boundary just for a one-time,
  // post-navigation check.
  useEffect(() => {
    if (resumedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("calibrated") !== "1") return;

    resumedRef.current = true;
    router.replace("/dashboard");
    startSession();
  }, [router, startSession]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-16">
      {status === "idle" && (
        <div className="max-w-3xl">
          <button onClick={() => router.push("/dashboard/calibration")} className={BUTTON_CLASSES}>
            Start Session
          </button>
        </div>
      )}

      {status === "starting" && (
        <div className="max-w-3xl">
          <EmptyState message="Starting session…" />
        </div>
      )}

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
    </main>
  );
}
