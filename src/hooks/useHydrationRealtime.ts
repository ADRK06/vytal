// TODO: hook subscribing to Supabase Realtime on hydration_readings for the active session.

export function useHydrationRealtime(sessionId: string) {
  return { score: null, status: "no-data" as const };
}
