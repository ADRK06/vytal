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
