import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatSessionDate,
  formatSessionDuration,
  getSessionDetail,
  type SessionDetail,
} from "@/lib/sessions";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { CorrelationChart } from "@/components/charts/CorrelationChart";

// A session's readings can still be arriving live — never freeze this as
// static HTML at build time.
export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let session: SessionDetail | null = null;
  let loadError = false;

  try {
    session = await getSessionDetail(params.id);
  } catch {
    loadError = true;
  }

  if (!loadError && !session) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 sm:px-10 lg:px-16">
      <Link
        href="/sessions"
        className="inline-block font-mono text-xs uppercase tracking-[0.2em] text-text-dim transition-colors hover:text-text"
      >
        ← Back to sessions
      </Link>

      {loadError && (
        <GlassPanel className="mt-6 p-8">
          <EmptyState message="Couldn't load this session. Check your Supabase configuration." />
        </GlassPanel>
      )}

      {!loadError && session && (
        <>
          <div className="mb-8 mt-6">
            <h1 className="font-sans text-2xl font-semibold text-text">
              {formatSessionDate(session.startedAt)}
            </h1>
            <p className="mt-1 font-mono text-sm text-text-dim">
              {formatSessionDuration(session.durationSeconds)}
            </p>
          </div>

          <GlassPanel className="p-8">
            {session.postureData.length === 0 &&
            session.hydrationData.length === 0 &&
            session.stressData.length === 0 ? (
              <EmptyState message="No readings recorded for this session." />
            ) : (
              <CorrelationChart
                postureData={session.postureData}
                hydrationData={session.hydrationData}
                stressData={session.stressData}
              />
            )}
          </GlassPanel>
        </>
      )}
    </main>
  );
}
