"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { usePostureScore } from "@/hooks/usePostureScore";
import { usePostureRealtime } from "@/hooks/usePostureRealtime";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useSlouchReminder } from "@/hooks/useSlouchReminder";
import { useVideoAspectRatio } from "@/hooks/useVideoAspectRatio";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostureLandmarkOverlay } from "@/components/posture/PostureLandmarkOverlay";

const RETRY_BUTTON_CLASSES =
  "self-start rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 font-mono text-xs uppercase tracking-wide text-text transition-colors hover:bg-white/[0.12]";

interface PostureCardProps {
  sessionId: string;
}

export function PostureCard({ sessionId }: PostureCardProps) {
  // Capture (webcam + MediaPipe) and the displayed score are two separate
  // concerns: usePostureScore drives the capture pipeline and writes to
  // posture_readings, while usePostureRealtime reads the score back from
  // Supabase — so what's on screen always reflects the database, the same
  // way HydrationCard already works.
  const { videoRef, status: captureStatus, retry, landmarks } = usePostureScore(sessionId);
  const { score, status: liveStatus } = usePostureRealtime(sessionId);
  const displayScore = useAnimatedNumber(score ?? 0, { clamp: [0, 100] });
  const { toastMessage, dismiss } = useSlouchReminder(score);
  const aspectRatio = useVideoAspectRatio(videoRef);

  const isCapturing = captureStatus === "live";

  return (
    <GlassPanel className="relative p-8">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
          Posture
        </span>
        {isCapturing && liveStatus === "live" && (
          <span className="flex items-center gap-2 font-mono text-xs text-text-dim">
            <span className="h-2 w-2 animate-pulse rounded-full bg-posture" />
            Live
          </span>
        )}
      </div>

      {/* Visible (mirrored, like looking in a mirror) whenever the camera
          is actually running, with the same landmark overlay calibration
          uses — so what's being tracked during a live session is never a
          mystery, not just during the one-time calibration flow. Kept at
          1x1px off-screen (not display:none or 0x0) the rest of the time,
          same as before — some browsers throttle decoding for elements
          that are truly zero-size or hidden, and detection must keep
          running regardless of whether the preview itself is shown. */}
      <div
        className={
          isCapturing
            ? "relative mt-4 w-full overflow-hidden rounded-2xl border border-white/15"
            : "pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden"
        }
        style={isCapturing ? { aspectRatio } : undefined}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-full w-full -scale-x-100 object-cover"
        />
        {isCapturing && <PostureLandmarkOverlay landmarks={landmarks} />}
      </div>

      <div className="mt-6">
        {captureStatus === "requesting" && (
          <EmptyState message="Requesting camera access…" />
        )}

        {captureStatus === "no-baseline" && (
          <div className="flex flex-col items-start gap-3">
            <EmptyState message="No posture baseline yet. Calibrate before starting a session." />
            <Link href="/dashboard/calibration" className={RETRY_BUTTON_CLASSES}>
              Calibrate now
            </Link>
          </div>
        )}

        {captureStatus === "denied" && (
          <div className="flex flex-col items-start gap-3">
            <EmptyState message="Camera access was denied, so posture can't be scored. Allow camera access for this site in your browser settings, then retry." />
            <button onClick={retry} className={RETRY_BUTTON_CLASSES}>
              Retry
            </button>
          </div>
        )}

        {captureStatus === "error" && (
          <div className="flex flex-col items-start gap-3">
            <EmptyState message="Couldn't start posture detection. Make sure a camera is connected and try again." />
            <button onClick={retry} className={RETRY_BUTTON_CLASSES}>
              Retry
            </button>
          </div>
        )}

        {isCapturing && liveStatus === "connecting" && (
          <EmptyState message="No data received yet…" />
        )}

        {isCapturing && liveStatus === "disconnected" && (
          <EmptyState message="Sensor appears disconnected. Readings have stopped arriving." />
        )}

        {isCapturing && liveStatus === "live" && score !== null && (
          <div>
            <span className="font-mono text-4xl font-medium text-posture">
              {displayScore}
            </span>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-posture"
                style={{ width: `${displayScore}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-3rem)] max-w-sm -translate-x-1/2"
          >
            <GlassPanel className="flex items-start justify-between gap-4 p-4">
              <p className="text-sm text-text">{toastMessage}</p>
              <button
                onClick={dismiss}
                className="shrink-0 font-mono text-xs uppercase tracking-[0.2em] text-text-dim transition-colors hover:text-text"
              >
                Dismiss
              </button>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassPanel>
  );
}
