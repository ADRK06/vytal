"use client";

import { useEffect, useState } from "react";
import { createRealtimeScoreSource } from "@/lib/supabase/realtime";
import type { LiveScoreStatus } from "@/types";

// Shared by usePostureRealtime, useHydrationRealtime, and
// useStressRealtime — all three read a score + connecting/live/
// disconnected status from a Realtime subscription on their respective
// table, filtered by session_id. See lib/supabase/realtime.ts for the
// actual subscription logic.
export function useLiveScore(
  table: "posture_readings" | "hydration_readings" | "stress_readings",
  sessionId: string
) {
  const [score, setScore] = useState<number | null>(null);
  const [status, setStatus] = useState<LiveScoreStatus>("connecting");

  useEffect(() => {
    setScore(null);
    setStatus("connecting");

    const source = createRealtimeScoreSource(table, sessionId);
    const unsubscribe = source.subscribe({
      onReading: setScore,
      onStatusChange: setStatus,
    });

    return unsubscribe;
  }, [table, sessionId]);

  return { score, status };
}
