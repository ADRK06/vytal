"use client";

import { useLiveScore } from "@/hooks/useLiveScore";

// Reads live hydration scores from Supabase Realtime, filtered to the
// active session — POST /api/ingest (the ESP32 mouse) is what actually
// writes hydration_readings.
export function useHydrationRealtime(sessionId: string) {
  return useLiveScore("hydration_readings", sessionId);
}
