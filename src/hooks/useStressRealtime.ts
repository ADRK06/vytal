"use client";

import { useLiveScore } from "@/hooks/useLiveScore";

// Reads live stress scores from Supabase Realtime, filtered to the
// active session — POST /api/ingest (the ESP32 mouse) is what actually
// writes stress_readings, alongside hydration_readings, from the same
// raw_gsr/raw_ppg payload.
export function useStressRealtime(sessionId: string) {
  return useLiveScore("stress_readings", sessionId);
}
