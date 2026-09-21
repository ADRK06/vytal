"use client";

import { useLiveScore } from "@/hooks/useLiveScore";

// Reads live posture scores from Supabase Realtime, filtered to the active
// session — usePostureScore is what actually captures (webcam + MediaPipe)
// and writes posture_readings; this hook only reads them back, so the
// displayed score always reflects the database rather than local component
// state, same as hydration.
export function usePostureRealtime(sessionId: string) {
  return useLiveScore("posture_readings", sessionId);
}
