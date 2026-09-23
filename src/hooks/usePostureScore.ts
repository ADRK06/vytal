"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  extractPostureLandmarks,
  getPoseLandmarker,
  type PostureLandmarks,
} from "@/lib/posture/mediapipe";
import {
  computeAngleDeviation,
  computeShoulderAsymmetry,
  getStoredPostureBaseline,
  scoreWithShoulderPenalty,
} from "@/lib/scoring";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type PostureStatus =
  | "requesting"
  | "denied"
  | "no-baseline"
  | "live"
  | "error";

const SAMPLE_INTERVAL_MS = 1000;

// Rolling window of raw angle deviations, averaged before scoring, so one
// jittery frame (or one skipped low-visibility frame) doesn't show up as a
// visible jump in the displayed score.
const SMOOTHING_WINDOW = 4;

// Owns the capture pipeline (webcam + MediaPipe) and writes each computed
// score to posture_readings — it does not expose the score itself, since
// the dashboard now displays posture via usePostureRealtime (a Realtime
// subscription reading the same table back), not local component state.
// This hook's `status` still covers the capture-specific states (camera
// permission, missing baseline) that a generic connecting/live/disconnected
// read-side status can't express. It does expose `landmarks` — the raw
// per-tick detection, for PostureLandmarkOverlay to draw on top of the
// video preview — since that's presentation, not the persisted score.
export function usePostureScore(sessionId: string) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<PostureStatus>("requesting");
  const [attempt, setAttempt] = useState(0);
  // For the landmark overlay (PostureLandmarkOverlay) — kept as the last
  // known-good detection rather than cleared on a skipped frame, same as
  // the score itself doesn't reset on one missed tick.
  const [liveLandmarks, setLiveLandmarks] = useState<PostureLandmarks | null>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const deviationWindow: number[] = [];
    const asymmetryWindow: number[] = [];

    async function start() {
      setStatus("requesting");
      setLiveLandmarks(null);

      const baseline = getStoredPostureBaseline();
      if (!baseline) {
        setStatus("no-baseline");
        return;
      }

      let stream: MediaStream;
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
      streamRef.current = stream;

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

      let supabase;
      try {
        supabase = createSupabaseBrowserClient();
      } catch {
        if (!cancelled) setStatus("error");
        return;
      }

      intervalId = setInterval(() => {
        const currentVideo = videoRef.current;
        if (!currentVideo || currentVideo.readyState < 2) return;

        const result = landmarker.detectForVideo(currentVideo, performance.now());
        const landmarks = extractPostureLandmarks(result);
        // extractPostureLandmarks already drops frames where a required
        // landmark's visibility is too low — skip this tick entirely
        // rather than smoothing in an unreliable reading.
        if (!landmarks) return;

        setLiveLandmarks(landmarks);

        const deviation = computeAngleDeviation(landmarks, baseline);
        deviationWindow.push(deviation);
        if (deviationWindow.length > SMOOTHING_WINDOW) deviationWindow.shift();

        const smoothedDeviation =
          deviationWindow.reduce((sum, value) => sum + value, 0) /
          deviationWindow.length;

        // Same rolling-window smoothing as the angle deviation above, so
        // the secondary shoulder-asymmetry penalty doesn't jitter the
        // score independently of it.
        const asymmetry = computeShoulderAsymmetry(landmarks);
        asymmetryWindow.push(asymmetry);
        if (asymmetryWindow.length > SMOOTHING_WINDOW) asymmetryWindow.shift();

        const smoothedAsymmetry =
          asymmetryWindow.reduce((sum, value) => sum + value, 0) /
          asymmetryWindow.length;

        const nextScore = scoreWithShoulderPenalty(smoothedDeviation, smoothedAsymmetry);
        setStatus("live");

        // Best-effort, fire-and-forget: this runs once a second in a tight
        // loop, so it isn't awaited — a dropped write just means one fewer
        // point in the session's history, not a broken capture pipeline.
        supabase
          .from("posture_readings")
          .insert({
            session_id: sessionId,
            score: nextScore,
            timestamp: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) console.error("Failed to write posture reading:", error);
          });
      }, SAMPLE_INTERVAL_MS);
    }

    start();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [attempt, sessionId]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { videoRef, status, retry, landmarks: liveLandmarks };
}
