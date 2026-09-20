"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Manages the active session lifecycle: starting one inserts a row into
// `sessions` tied to the signed-in user's ID (RLS requires this — see
// supabase/migrations/0002_rls.sql), ending one sets ended_at.
export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const startedRef = useRef(false);

  const startSession = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

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
    startedRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  return { sessionId, startSession, endSession };
}
