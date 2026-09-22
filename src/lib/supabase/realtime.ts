import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { LiveScoreCallbacks, LiveScoreSource } from "@/types";

// If no reading has arrived within this long (whether we've never gotten
// one, or we were live and readings stopped), the source reports
// "disconnected" — an 8-10x buffer over the ~1/sec write cadence both
// posture and hydration use, so ordinary jitter doesn't false-positive.
const DISCONNECT_TIMEOUT_MS = 10000;

// Backs PostureCard, HydrationCard, and StressCard: subscribes to
// Postgres INSERTs on the given table, filtered to the active session,
// and reports readings plus a connecting/live/disconnected status
// derived both from the Realtime channel's own state and from how
// recently a reading arrived.
export function createRealtimeScoreSource(
  table: "posture_readings" | "hydration_readings" | "stress_readings",
  sessionId: string
): LiveScoreSource {
  return {
    subscribe(callbacks: LiveScoreCallbacks) {
      callbacks.onStatusChange?.("connecting");

      // createSupabaseBrowserClient() throws if Supabase isn't configured —
      // that must not crash the component tree from inside a useEffect;
      // report it the same as any other connection failure instead.
      let supabase;
      try {
        supabase = createSupabaseBrowserClient();
      } catch (error) {
        console.error("Couldn't create Supabase client for Realtime:", error);
        callbacks.onStatusChange?.("disconnected");
        return () => {};
      }

      let disconnectTimer: ReturnType<typeof setTimeout> | undefined;

      function armDisconnectTimer() {
        if (disconnectTimer) clearTimeout(disconnectTimer);
        disconnectTimer = setTimeout(() => {
          callbacks.onStatusChange?.("disconnected");
        }, DISCONNECT_TIMEOUT_MS);
      }

      // Multiple independent readers can subscribe to the same table for
      // the same session at once now (e.g. a score card and LiveTrendChart
      // both reading posture_readings) — the Supabase client reuses an
      // existing channel object for a topic it's already seen, so a
      // shared `table:sessionId` topic would hand the second subscriber a
      // channel that's already past `.subscribe()`, and `.on()` throws.
      // A random suffix keeps every subscribe() call on its own channel.
      const channel = supabase
        .channel(`${table}:${sessionId}:${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table,
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const score = (payload.new as { score: number }).score;
            callbacks.onReading(score);
            callbacks.onStatusChange?.("live");
            armDisconnectTimer();
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Connected, but no reading yet — start the "gone quiet" timer
            // now so a session that never gets a first reading eventually
            // reports disconnected instead of hanging on "connecting".
            armDisconnectTimer();
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            callbacks.onStatusChange?.("disconnected");
          }
        });

      return () => {
        if (disconnectTimer) clearTimeout(disconnectTimer);
        supabase.removeChannel(channel);
      };
    },
  };
}
