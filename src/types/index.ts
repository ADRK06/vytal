// TODO: keep in sync with the Supabase schema in supabase/migrations.

export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
}

export interface PostureReading {
  id: string;
  session_id: string;
  timestamp: string;
  score: number;
}

export interface HydrationReading {
  id: string;
  session_id: string;
  timestamp: string;
  score: number;
  raw_gsr: number;
  raw_ppg: number;
}

export type HydrationStatus = "connecting" | "live" | "disconnected";

export interface HydrationSourceCallbacks {
  onReading: (score: number) => void;
  onStatusChange?: (status: HydrationStatus) => void;
}

// Implemented by both the local dev mock (lib/mock/hydrationMock.ts) and,
// eventually, a real Supabase Realtime subscription on hydration_readings.
// Consumers (useHydrationRealtime) only depend on this interface, so
// swapping the mock for the real thing later is a one-line change there.
export interface HydrationSource {
  subscribe(callbacks: HydrationSourceCallbacks): () => void;
}
