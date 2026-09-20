"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassPanel } from "@/components/ui/GlassPanel";
import {
  extractPostureLandmarks,
  getPoseLandmarker,
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

const RETRY_BUTTON_CLASSES =
  "rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 font-mono text-xs uppercase tracking-wide text-text transition-colors hover:bg-white/[0.12]";

type PostureStatus =
  | "requesting"
  | "denied"
  | "error"
  | "get-ready"
  | "hold";

function PostureCalibrationStep({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<PostureStatus>("requesting");
  const [secondsLeft, setSecondsLeft] = useState(GET_READY_SECONDS);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let tickInterval: ReturnType<typeof setInterval> | undefined;

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
      // while we sample the neck-torso angle once per second and average
      // it, so one noisy frame can't skew the whole baseline.
      let phase: "get-ready" | "hold" = "get-ready";
      let remaining = GET_READY_SECONDS;
      const samples: number[] = [];

      setStatus("get-ready");
      setSecondsLeft(remaining);

      tickInterval = setInterval(() => {
        if (phase === "hold") {
          const currentVideo = videoRef.current;
          if (currentVideo && currentVideo.readyState >= 2) {
            const result = landmarker.detectForVideo(currentVideo, performance.now());
            const landmarks = extractPostureLandmarks(result);
            if (landmarks) samples.push(computeNeckTorsoAngle(landmarks));
          }
        }

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

          clearInterval(tickInterval);

          const averaged =
            samples.length > 0
              ? samples.reduce((sum, value) => sum + value, 0) / samples.length
              : null;

          if (averaged === null) {
            if (!cancelled) setStatus("error");
            return;
          }

          storePostureBaseline({ neckTorsoAngle: averaged });
          if (!cancelled) onComplete();
        }
      }, 1000);
    }

    start();

    return () => {
      cancelled = true;
      if (tickInterval) clearInterval(tickInterval);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [attempt, onComplete]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {/* Feeds MediaPipe locally; never rendered on screen or sent anywhere. */}
      <video
        ref={videoRef}
        muted
        playsInline
        className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px"
      />

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
          <p className="text-sm text-text-dim">
            Camera access was denied, so posture can&apos;t be calibrated.
            Allow camera access for this site in your browser settings, then
            retry.
          </p>
          <button onClick={retry} className={RETRY_BUTTON_CLASSES}>
            Retry
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <p className="text-sm text-text-dim">
            Couldn&apos;t calibrate posture. Make sure a camera is connected
            and try again.
          </p>
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
        </>
      )}

      {status === "hold" && (
        <>
          <p className="text-sm text-text-dim">Hold still…</p>
          <span className="font-mono text-5xl font-medium text-posture">
            {secondsLeft}
          </span>
        </>
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
      <span className="h-2 w-2 animate-pulse rounded-full bg-hydration" />
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
    const timeout = setTimeout(() => router.push("/dashboard"), 1200);
    return () => clearTimeout(timeout);
  }, [step, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16">
      <GlassPanel className="relative w-full p-10">
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
