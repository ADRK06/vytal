import { getSessionStats, type SessionStats } from "@/lib/sessions";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { SessionTrendChart } from "@/components/charts/SessionTrendChart";
import { StatCard } from "@/components/stats/StatCard";

// Trends change as new sessions complete — never freeze this as static
// HTML at build time.
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  let stats: SessionStats | null = null;
  let loadError = false;

  try {
    stats = await getSessionStats();
  } catch {
    loadError = true;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:px-10 lg:px-16">
      <h1 className="mb-8 font-sans text-2xl font-semibold text-text">
        Stats
      </h1>

      {loadError && (
        <GlassPanel className="p-8">
          <EmptyState message="Couldn't load stats. Check your Supabase configuration." />
        </GlassPanel>
      )}

      {!loadError && stats && stats.completedCount === 0 && (
        <GlassPanel className="p-8">
          <EmptyState message="No completed sessions yet. Finish a session to start seeing trends here." />
        </GlassPanel>
      )}

      {!loadError && stats && stats.completedCount > 0 && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Avg posture"
              value={stats.overallAvgPosture}
              colorClassName="text-posture"
              clamp={[0, 100]}
            />
            <StatCard
              label="Avg hydration"
              value={stats.overallAvgHydration}
              colorClassName="text-hydration"
              clamp={[0, 100]}
            />
            <StatCard
              label="Avg stress"
              value={stats.overallAvgStress}
              colorClassName="text-stress"
              clamp={[0, 100]}
            />
            <StatCard
              label="Completed sessions"
              value={stats.completedCount}
              colorClassName="text-text"
            />
          </div>

          <GlassPanel className="p-8">
            <SessionTrendChart sessions={stats.sessions} />
          </GlassPanel>
        </div>
      )}
    </main>
  );
}
