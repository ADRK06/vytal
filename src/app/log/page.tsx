import { getDailyStress, type DailyStressPoint } from "@/lib/sessions";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { StressCalendar } from "@/components/log/StressCalendar";

// Fills in as new sessions complete — never freeze this as static HTML
// at build time.
export const dynamic = "force-dynamic";

export default async function LogPage() {
  let days: DailyStressPoint[] = [];
  let loadError = false;

  try {
    days = await getDailyStress();
  } catch {
    loadError = true;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:px-10 lg:px-16">
      <h1 className="mb-8 font-sans text-2xl font-semibold text-text">
        Log
      </h1>

      {loadError && (
        <GlassPanel className="p-8">
          <EmptyState message="Couldn't load your stress log. Check your Supabase configuration." />
        </GlassPanel>
      )}

      {!loadError && days.length === 0 && (
        <GlassPanel className="p-8">
          <EmptyState message="No stress data yet. It'll start filling in once you complete a session." />
        </GlassPanel>
      )}

      {!loadError && days.length > 0 && (
        <GlassPanel className="p-8">
          <StressCalendar days={days} />
        </GlassPanel>
      )}
    </main>
  );
}
