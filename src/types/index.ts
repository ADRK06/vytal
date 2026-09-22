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

export interface StressReading {
  id: string;
  session_id: string;
  timestamp: string;
  score: number;
  raw_gsr: number;
  raw_ppg: number;
}

export interface DailyStress {
  date: string;
  user_id: string;
  avg_score: number;
  reading_count: number;
}

// "connecting" == no reading received yet (still waiting on the first
// one); "disconnected" == readings stopped arriving after being live, or
// the Realtime channel itself dropped.
export type LiveScoreStatus = "connecting" | "live" | "disconnected";

export interface LiveScoreCallbacks {
  onReading: (score: number) => void;
  onStatusChange?: (status: LiveScoreStatus) => void;
}

// Implemented by both the local dev mock (lib/mock/hydrationMock.ts, still
// used by the hydration calibration step) and the real Supabase Realtime
// subscription (lib/supabase/realtime.ts) that both PostureCard and
// HydrationCard now read from. Consumers (useLiveScore and its thin
// per-signal wrappers) only depend on this interface.
export interface LiveScoreSource {
  subscribe(callbacks: LiveScoreCallbacks): () => void;
}
