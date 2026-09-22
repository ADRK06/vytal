"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  extractPostureLandmarks,
  getPoseLandmarker,
} from "@/lib/posture/mediapipe";
import {
  computeAngleDeviation,
  computeNeckTorsoAngle,
  computeShoulderAsymmetry,
  getStoredPostureBaseline,
  scorePosture,
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
// read-side status can't express.
export function usePostureScore(sessionId: string) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<PostureStatus>("requesting");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const deviationWindow: number[] = [];
    const asymmetryWindow: number[] = [];

    async function start() {
      setStatus("requesting");

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

        // TEMP DEBUG — remove once the score-stuck-at-85-90 issue is diagnosed.
        console.log("[posture debug] landmarks", {
          leftShoulder: landmarks.leftShoulder,
          rightShoulder: landmarks.rightShoulder,
          leftEar: landmarks.leftEar,
          rightEar: landmarks.rightEar,
        });
        console.log(
          "[posture debug]",
          "neckTorsoAngle:", computeNeckTorsoAngle(landmarks).toFixed(2),
          "baseline:", baseline.neckTorsoAngle.toFixed(2),
          "deviation:", deviation.toFixed(2),
          "windowedAvg:", smoothedDeviation.toFixed(2),
          "windowSize:", deviationWindow.length,
          "shoulderAsymmetry:", asymmetry.toFixed(4),
          "score:", scorePosture(landmarks, baseline)
        );

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

  return { videoRef, status, retry };
}
