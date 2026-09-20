import Link from "next/link";
import {
  formatSessionDate,
  formatSessionDuration,
  getSessions,
  type SessionSummary,
} from "@/lib/sessions";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/EmptyState";

// Session history changes constantly — never freeze it as static HTML at
// build time.
export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  let sessions: SessionSummary[] = [];
  let loadError = false;

  try {
    sessions = await getSessions();
  } catch {
    loadError = true;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:px-10 lg:px-16">
      <h1 className="mb-8 font-sans text-2xl font-semibold text-text">
        Session history
      </h1>

      {loadError && (
        <GlassPanel className="p-8">
          <EmptyState message="Couldn't load sessions. Check your Supabase configuration." />
        </GlassPanel>
      )}

      {!loadError && sessions.length === 0 && (
        <GlassPanel className="p-8">
          <EmptyState message="No sessions yet. Start one from the dashboard." />
        </GlassPanel>
      )}

      {!loadError && sessions.length > 0 && (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`} className="block">
              <GlassPanel className="flex items-center justify-between p-6 transition-colors hover:bg-white/[0.09]">
                <div>
                  <div className="font-sans text-sm text-text">
                    {formatSessionDate(session.startedAt)}
                  </div>
                  <div className="mt-1 font-mono text-xs text-text-dim">
                    {formatSessionDuration(session.durationSeconds)}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
                      Posture
                    </div>
                    <div className="font-mono text-lg text-posture">
                      {session.avgPostureScore ?? "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
                      Hydration
                    </div>
                    <div className="font-mono text-lg text-hydration">
                      {session.avgHydrationScore ?? "—"}
                    </div>
                  </div>
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
