"use client";

import { useCallback, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SessionStatus = "idle" | "starting" | "active";

// Manages the active session lifecycle: starting one inserts a row into
// `sessions` tied to the signed-in user's ID (RLS requires this — see
// supabase/migrations/0002_rls.sql), ending one sets ended_at. Nothing
// starts on its own — a session only exists once startSession() is
// explicitly called (from the dashboard's "Start Session" button, after
// calibration), and ending one returns to the same idle state rather than
// auto-starting another.
export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const startedRef = useRef(false);

  const startSession = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus("starting");

    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      startedRef.current = false;
      setStatus("idle");
      return;
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert({ user_id: userData.user.id })
      .select("id")
      .single();

    if (!error && data) {
      setSessionId(data.id);
      setStatus("active");
    } else {
      startedRef.current = false;
      setStatus("idle");
    }
  }, []);

  const endSession = useCallback(async () => {
    if (!sessionId) return;

    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId);

    setSessionId(null);
    setStatus("idle");
    startedRef.current = false;
  }, [sessionId]);

  return { sessionId, status, startSession, endSession };
}
