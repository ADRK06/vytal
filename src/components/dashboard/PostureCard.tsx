"use client";

import Link from "next/link";
import { usePostureScore } from "@/hooks/usePostureScore";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/EmptyState";

const RETRY_BUTTON_CLASSES =
  "self-start rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 font-mono text-xs uppercase tracking-wide text-text transition-colors hover:bg-white/[0.12]";

export function PostureCard() {
  const { videoRef, status, score, retry } = usePostureScore();

  return (
    <GlassPanel className="relative p-8">
      {/* Feeds MediaPipe locally; never rendered on screen or sent anywhere. */}
      <video
        ref={videoRef}
        muted
        playsInline
        className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px"
      />

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
          Posture
        </span>
        {status === "live" && (
          <span className="flex items-center gap-2 font-mono text-xs text-text-dim">
            <span className="h-2 w-2 animate-pulse rounded-full bg-posture" />
            Live
          </span>
        )}
      </div>

      <div className="mt-6">
        {status === "requesting" && (
          <EmptyState message="Requesting camera access…" />
        )}

        {status === "no-baseline" && (
          <div className="flex flex-col items-start gap-3">
            <EmptyState message="No posture baseline yet. Calibrate before starting a session." />
            <Link href="/dashboard/calibration" className={RETRY_BUTTON_CLASSES}>
              Calibrate now
            </Link>
          </div>
        )}

        {status === "denied" && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-text-dim">
              Camera access was denied, so posture can&apos;t be scored.
              Allow camera access for this site in your browser settings,
              then retry.
            </p>
            <button onClick={retry} className={RETRY_BUTTON_CLASSES}>
              Retry
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-text-dim">
              Couldn&apos;t start posture detection. Make sure a camera is
              connected and try again.
            </p>
            <button onClick={retry} className={RETRY_BUTTON_CLASSES}>
              Retry
            </button>
          </div>
        )}

        {status === "live" && score !== null && (
          <div>
            <span className="font-mono text-4xl font-medium text-posture">
              {score}
            </span>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-posture transition-[width] duration-500"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
