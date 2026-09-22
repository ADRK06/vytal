"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostureLandmarkOverlay } from "@/components/posture/PostureLandmarkOverlay";
import { useVideoAspectRatio } from "@/hooks/useVideoAspectRatio";
import {
  extractPostureLandmarks,
  getPoseLandmarker,
  type PostureLandmarks,
} from "@/lib/posture/mediapipe";
import {
  captureHydrationBaseline,
  computeNeckTorsoAngle,
  storeHydrationBaseline,
  storePostureBaseline,
} from "@/lib/scoring";
import { createMockHydrationSource } from "@/lib/mock/hydrationMock";

const GET_READY_SECONDS = 3;
const POSTURE_HOLD_SECONDS = 4;
const HYDRATION_HOLD_SECONDS = 10;
// Sampled independently of the 1s countdown tick so the averaged baseline
// is built from many more readings than just one per displayed second.
const POSTURE_CAPTURE_SAMPLE_INTERVAL_MS = 400;
// How long the post-hold summary stays up before auto-advancing — long
// enough to actually read the numbers, short enough not to feel stuck.
const SUMMARY_DISPLAY_MS = 2200;

const RETRY_BUTTON_CLASSES =
  "rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 font-mono text-xs uppercase tracking-wide text-text transition-colors hover:bg-white/[0.12]";

type PostureStatus =
  | "requesting"
  | "denied"
  | "error"
  | "get-ready"
  | "hold"
  | "summary";

interface CalibrationSummary {
  angle: number;
  sampleCount: number;
}

function PostureCalibrationStep({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<PostureStatus>("requesting");
  const [secondsLeft, setSecondsLeft] = useState(GET_READY_SECONDS);
  const [liveAngle, setLiveAngle] = useState<number | null>(null);
  const [liveLandmarks, setLiveLandmarks] = useState<PostureLandmarks | null>(null);
  const [summary, setSummary] = useState<CalibrationSummary | null>(null);
  const [attempt, setAttempt] = useState(0);
  const aspectRatio = useVideoAspectRatio(videoRef);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let countdownInterval: ReturnType<typeof setInterval> | undefined;
    let sampleInterval: ReturnType<typeof setInterval> | undefined;
    let summaryTimeout: ReturnType<typeof setTimeout> | undefined;

    async function start() {
      setStatus("requesting");

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch {
        if (!cancelled) setStatus("denied");
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const video = videoRef.current;
      if (!video) {
        setStatus("error");
        return;
      }
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        if (!cancelled) setStatus("error");
        return;
      }

      let landmarker;
      try {
        landmarker = await getPoseLandmarker();
      } catch {
        if (!cancelled) setStatus("error");
        return;
      }

      if (cancelled) return;

      // Phase 1: "get ready" countdown, no capture yet. Phase 2: hold still
      // while we sample the neck-torso angle several times a second and
      // average all of it into the baseline — many more readings than a
      // single instant snapshot, so one noisy frame (or a low-visibility
      // frame, which extractPostureLandmarks already skips) can't skew it.
      let phase: "get-ready" | "hold" = "get-ready";
      let remaining = GET_READY_SECONDS;
      const samples: number[] = [];

      setStatus("get-ready");
      setSecondsLeft(remaining);

      function finishCapture() {
        if (countdownInterval) clearInterval(countdownInterval);
        if (sampleInterval) clearInterval(sampleInterval);

        const averaged =
          samples.length > 0
            ? samples.reduce((sum, value) => sum + value, 0) / samples.length
            : null;

        if (averaged === null) {
          if (!cancelled) setStatus("error");
          return;
        }

        storePostureBaseline({ neckTorsoAngle: averaged });
        if (cancelled) return;

        // A brief confirmation of what was actually recorded, rather than
        // jumping straight to the next step — the user gets to see the
        // number their "neutral" position just became.
        setSummary({ angle: averaged, sampleCount: samples.length });
        setStatus("summary");
        summaryTimeout = setTimeout(() => {
          if (!cancelled) onComplete();
        }, SUMMARY_DISPLAY_MS);
      }

      sampleInterval = setInterval(() => {
        const currentVideo = videoRef.current;
        if (!currentVideo || currentVideo.readyState < 2) return;

        const result = landmarker.detectForVideo(currentVideo, performance.now());
        const landmarks = extractPostureLandmarks(result);
        if (!landmarks) return;

        // Live during get-ready too (so the user can already see and
        // adjust before the hold starts), but only banked into the
        // averaged baseline once actually holding.
        const angle = computeNeckTorsoAngle(landmarks);
        setLiveAngle(angle);
        setLiveLandmarks(landmarks);
        if (phase === "hold") samples.push(angle);
      }, POSTURE_CAPTURE_SAMPLE_INTERVAL_MS);

      countdownInterval = setInterval(() => {
        remaining -= 1;
        setSecondsLeft(Math.max(remaining, 0));

        if (remaining <= 0) {
          if (phase === "get-ready") {
            phase = "hold";
            remaining = POSTURE_HOLD_SECONDS;
            setSecondsLeft(remaining);
            setStatus("hold");
            return;
          }

          finishCapture();
        }
      }, 1000);
    }

    start();

    return () => {
      cancelled = true;
      if (countdownInterval) clearInterval(countdownInterval);
      if (sampleInterval) clearInterval(sampleInterval);
      if (summaryTimeout) clearTimeout(summaryTimeout);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [attempt, onComplete]);

  const retry = useCallback(() => {
    setLiveAngle(null);
    setLiveLandmarks(null);
    setSummary(null);
    setAttempt((n) => n + 1);
  }, []);

  // Visible (mirrored, like looking in a mirror) during get-ready/hold so
  // the user can actually see themselves to adjust — hidden once summary
  // begins, since capture is already done by then.
  const showPreview = status === "get-ready" || status === "hold";

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className={
          showPreview
            ? "relative w-full max-w-xs overflow-hidden rounded-2xl border border-white/15"
            : "pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden"
        }
        style={showPreview ? { aspectRatio } : undefined}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-full w-full -scale-x-100 object-cover"
        />
        {showPreview && <PostureLandmarkOverlay landmarks={liveLandmarks} />}
      </div>

      <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
        Step 1 of 2 — Posture
      </span>
      <h1 className="font-sans text-xl font-semibold text-text">
        Calibrate your posture
      </h1>

      {status === "requesting" && (
        <p className="text-sm text-text-dim">Requesting camera access…</p>
      )}

      {status === "denied" && (
        <>
          <EmptyState message="Camera access was denied, so posture can't be calibrated. Allow camera access for this site in your browser settings, then retry." />
          <button onClick={retry} className={RETRY_BUTTON_CLASSES}>
            Retry
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <EmptyState message="Couldn't calibrate posture. Make sure a camera is connected and try again." />
          <button onClick={retry} className={RETRY_BUTTON_CLASSES}>
            Retry
          </button>
        </>
      )}

      {status === "get-ready" && (
        <>
          <p className="text-sm text-text-dim">
            Sit up in your best posture. Capturing starts in…
          </p>
          <span className="font-mono text-5xl font-medium text-posture">
            {secondsLeft}
          </span>
          {liveAngle !== null && (
            <span className="font-mono text-xs text-text-dim">
              Live neck angle: {liveAngle.toFixed(1)}°
            </span>
          )}
        </>
      )}

      {status === "hold" && (
        <>
          <p className="text-sm text-text-dim">Hold still…</p>
          <span className="font-mono text-5xl font-medium text-posture">
            {secondsLeft}
          </span>
          {liveAngle !== null && (
            <span className="font-mono text-xs text-text-dim">
              Live neck angle: {liveAngle.toFixed(1)}°
            </span>
          )}
        </>
      )}

      {status === "summary" && summary && (
        <div className="flex flex-col items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-posture" />
          <p className="text-sm text-text-dim">Baseline captured</p>
          <p className="font-mono text-2xl font-medium text-posture">
            {summary.angle.toFixed(1)}° neck angle
          </p>
          <p className="font-mono text-xs text-text-dim">
            {summary.sampleCount} samples averaged
          </p>
        </div>
      )}
    </div>
  );
}

function HydrationCalibrationStep({ onComplete }: { onComplete: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(HYDRATION_HOLD_SECONDS);

  useEffect(() => {
    let cancelled = false;
    const samples: number[] = [];
    let remaining = HYDRATION_HOLD_SECONDS;

    const source = createMockHydrationSource("calibration");
    const unsubscribe = source.subscribe({
      onReading: (score) => samples.push(score),
    });

    const tickInterval = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(Math.max(remaining, 0));

      if (remaining <= 0) {
        clearInterval(tickInterval);
        unsubscribe();
        storeHydrationBaseline(captureHydrationBaseline(samples));
        if (!cancelled) onComplete();
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(tickInterval);
      unsubscribe();
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
        Step 2 of 2 — Hydration
      </span>
      <h1 className="font-sans text-xl font-semibold text-text">
        Calibrate your hydration baseline
      </h1>
      <p className="text-sm text-text-dim">
        Hold the mouse still for about {HYDRATION_HOLD_SECONDS} seconds while
        we read your resting baseline.
      </p>
      <span className="font-mono text-5xl font-medium text-hydration">
        {secondsLeft}
      </span>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
      <h1 className="font-sans text-xl font-semibold text-text">
        Calibration complete
      </h1>
      <p className="text-sm text-text-dim">Taking you to the dashboard…</p>
    </div>
  );
}

type Step = "posture" | "hydration" | "complete";

export default function CalibrationPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("posture");

  useEffect(() => {
    if (step !== "complete") return;
    const timeout = setTimeout(() => router.push("/dashboard?calibrated=1"), 1200);
    return () => clearTimeout(timeout);
  }, [step, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 sm:px-10 lg:px-16">
      {step !== "complete" && (
        <Link
          href="/dashboard"
          className="mb-4 inline-block self-start font-mono text-xs uppercase tracking-[0.2em] text-text-dim transition-colors hover:text-text"
        >
          ← Cancel and back to dashboard
        </Link>
      )}
      <GlassPanel className="relative w-full p-8">
        {step === "posture" && (
          <PostureCalibrationStep onComplete={() => setStep("hydration")} />
        )}
        {step === "hydration" && (
          <HydrationCalibrationStep onComplete={() => setStep("complete")} />
        )}
        {step === "complete" && <CompleteStep />}
      </GlassPanel>
    </main>
  );
}
