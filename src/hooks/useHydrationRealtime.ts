"use client";

import { useEffect, useState } from "react";
import { createMockHydrationSource } from "@/lib/mock/hydrationMock";
import type { HydrationSource, HydrationStatus } from "@/types";

// TODO: once the ESP32 hardware + Supabase Realtime pipeline exist, swap
// this for a real subscription on hydration_readings filtered by
// session_id. It only needs to implement the same HydrationSource
// interface (types/index.ts) — nothing below this line has to change.
function createHydrationSource(sessionId: string): HydrationSource {
  return createMockHydrationSource(sessionId);
}

export function useHydrationRealtime(sessionId: string) {
  const [score, setScore] = useState<number | null>(null);
  const [status, setStatus] = useState<HydrationStatus>("connecting");

  useEffect(() => {
    setScore(null);
    setStatus("connecting");

    const source = createHydrationSource(sessionId);
    const unsubscribe = source.subscribe({
      onReading: setScore,
      onStatusChange: setStatus,
    });

    return unsubscribe;
  }, [sessionId]);

  return { score, status };
}
