import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ScorePoint {
  elapsedSeconds: number;
  score: number;
}

export interface SessionSummary {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  avgPostureScore: number | null;
  avgHydrationScore: number | null;
}

export interface SessionDetail {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  postureData: ScorePoint[];
  hydrationData: ScorePoint[];
}

// If a session has no explicit ended_at and no posture/hydration activity
// for this long, treat it as abandoned (tab closed, laptop slept, etc.)
// rather than showing "In progress" forever.
const ABANDONED_AFTER_MS = 5 * 60 * 1000;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function computeDurationSeconds(
  startedAt: string,
  endedAt: string | null
): number | null {
  if (!endedAt) return null;
  const seconds = (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000;
  return Math.max(0, Math.round(seconds));
}

// Computed at read time rather than via a background job — matches how
// duration/averages are already derived on the fly here rather than
// stored. If the session was never explicitly ended and its last known
// activity (or, absent any readings, its start) is older than the
// abandonment window, treat it as having ended then.
function computeEffectiveEndedAt(
  startedAt: string,
  endedAt: string | null,
  lastReadingAt: string | null
): string | null {
  if (endedAt) return endedAt;

  const lastActivity = lastReadingAt ?? startedAt;
  const idleMs = Date.now() - new Date(lastActivity).getTime();

  return idleMs > ABANDONED_AFTER_MS ? lastActivity : null;
}

function groupScoresBySession(
  rows: { session_id: string; score: number }[]
): Map<string, number[]> {
  const bySession = new Map<string, number[]>();
  for (const row of rows) {
    const scores = bySession.get(row.session_id) ?? [];
    scores.push(row.score);
    bySession.set(row.session_id, scores);
  }
  return bySession;
}

function latestTimestamp(rows: { timestamp: string }[]): string | null {
  return rows.reduce<string | null>((latest, row) => {
    if (!latest || new Date(row.timestamp).getTime() > new Date(latest).getTime()) {
      return row.timestamp;
    }
    return latest;
  }, null);
}

function latestTimestampBySession(
  rowSets: { session_id: string; timestamp: string }[][]
): Map<string, string> {
  const latest = new Map<string, string>();
  for (const rows of rowSets) {
    for (const row of rows) {
      const current = latest.get(row.session_id);
      if (!current || new Date(row.timestamp).getTime() > new Date(current).getTime()) {
        latest.set(row.session_id, row.timestamp);
      }
    }
  }
  return latest;
}

// Scoped to the signed-in user: sessions is filtered explicitly by
// user_id here, and posture_readings/hydration_readings are scoped
// implicitly by Row Level Security (supabase/migrations/0002_rls.sql),
// since they only carry session_id, not user_id, directly.
export async function getSessions(): Promise<SessionSummary[]> {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, started_at, ended_at")
    .eq("user_id", userData.user.id)
    .order("started_at", { ascending: false });

  if (error) throw error;
  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((session) => session.id);

  const [{ data: postureReadings, error: postureError }, { data: hydrationReadings, error: hydrationError }] =
    await Promise.all([
      supabase.from("posture_readings").select("session_id, score, timestamp").in("session_id", sessionIds),
      supabase.from("hydration_readings").select("session_id, score, timestamp").in("session_id", sessionIds),
    ]);

  if (postureError) throw postureError;
  if (hydrationError) throw hydrationError;

  const postureBySession = groupScoresBySession(postureReadings ?? []);
  const hydrationBySession = groupScoresBySession(hydrationReadings ?? []);
  const lastReadingBySession = latestTimestampBySession([
    postureReadings ?? [],
    hydrationReadings ?? [],
  ]);

  return sessions.map((session) => {
    const effectiveEndedAt = computeEffectiveEndedAt(
      session.started_at,
      session.ended_at,
      lastReadingBySession.get(session.id) ?? null
    );

    return {
      id: session.id,
      startedAt: session.started_at,
      endedAt: effectiveEndedAt,
      durationSeconds: computeDurationSeconds(session.started_at, effectiveEndedAt),
      avgPostureScore: average(postureBySession.get(session.id) ?? []),
      avgHydrationScore: average(hydrationBySession.get(session.id) ?? []),
    };
  });
}

export async function getSessionDetail(id: string): Promise<SessionDetail | null> {
  const supabase = createSupabaseServerClient();
  // RLS scopes this to the signed-in user's own sessions — a valid id
  // belonging to someone else simply returns no row, same as a bad id.
  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, started_at, ended_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!session) return null;

  const startedAtMs = new Date(session.started_at).getTime();

  const [{ data: postureReadings, error: postureError }, { data: hydrationReadings, error: hydrationError }] =
    await Promise.all([
      supabase
        .from("posture_readings")
        .select("timestamp, score")
        .eq("session_id", id)
        .order("timestamp", { ascending: true }),
      supabase
        .from("hydration_readings")
        .select("timestamp, score")
        .eq("session_id", id)
        .order("timestamp", { ascending: true }),
    ]);

  if (postureError) throw postureError;
  if (hydrationError) throw hydrationError;

  const toScorePoints = (rows: { timestamp: string; score: number }[]): ScorePoint[] =>
    rows.map((row) => ({
      elapsedSeconds: (new Date(row.timestamp).getTime() - startedAtMs) / 1000,
      score: row.score,
    }));

  const lastReadingAt = latestTimestamp([
    ...(postureReadings ?? []),
    ...(hydrationReadings ?? []),
  ]);
  const effectiveEndedAt = computeEffectiveEndedAt(
    session.started_at,
    session.ended_at,
    lastReadingAt
  );

  return {
    id: session.id,
    startedAt: session.started_at,
    endedAt: effectiveEndedAt,
    durationSeconds: computeDurationSeconds(session.started_at, effectiveEndedAt),
    postureData: toScorePoints(postureReadings ?? []),
    hydrationData: toScorePoints(hydrationReadings ?? []),
  };
}

export function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatSessionDuration(seconds: number | null): string {
  if (seconds === null) return "In progress";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `Completed · ${minutes}m ${remainingSeconds}s`;
}
