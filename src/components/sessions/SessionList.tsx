"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import type { SessionSummary } from "@/lib/sessions";
import { GlassPanel } from "@/components/ui/GlassPanel";

// Local, rather than imported from lib/sessions — that module also
// exports the server-only Supabase client, so a client component
// importing anything else from it (even just these formatters) would
// pull next/headers into the client bundle.
function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSessionDuration(seconds: number | null): string {
  if (seconds === null) return "In progress";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `Completed · ${minutes}m ${remainingSeconds}s`;
}

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const row: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

interface SessionListProps {
  sessions: SessionSummary[];
}

export function SessionList({ sessions }: SessionListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={container}
      className="flex flex-col gap-3"
    >
      {sessions.map((session) => (
        <motion.div
          key={session.id}
          variants={row}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Link href={`/sessions/${session.id}`} className="block">
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
                <div className="text-right">
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
                    Stress
                  </div>
                  <div className="font-mono text-lg text-stress">
                    {session.avgStressScore ?? "—"}
                  </div>
                </div>
              </div>
            </GlassPanel>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
