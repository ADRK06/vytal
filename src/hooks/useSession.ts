"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SessionStatus = "starting" | "active" | "ended";

// Manages the active session lifecycle: starting one inserts a row into
// `sessions` tied to the signed-in user's ID (RLS requires this — see
// supabase/migrations/0002_rls.sql), ending one sets ended_at.
export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("starting");
  const startedRef = useRef(false);

  const startSession = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus("starting");

    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      startedRef.current = false;
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
    setStatus("ended");
    startedRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  return { sessionId, status, startSession, endSession };
}
