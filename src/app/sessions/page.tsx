import { getSessions, type SessionSummary } from "@/lib/sessions";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { SessionList } from "@/components/sessions/SessionList";

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

      {!loadError && sessions.length > 0 && <SessionList sessions={sessions} />}
    </main>
  );
}
