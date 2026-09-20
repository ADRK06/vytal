"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  extractPostureLandmarks,
  getPoseLandmarker,
} from "@/lib/posture/mediapipe";
import {
  computeAngleDeviation,
  getStoredPostureBaseline,
  scoreFromDeviation,
} from "@/lib/scoring";

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

export function usePostureScore() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<PostureStatus>("requesting");
  const [score, setScore] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const deviationWindow: number[] = [];

    async function start() {
      setStatus("requesting");
      setScore(null);

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

      intervalId = setInterval(() => {
        const currentVideo = videoRef.current;
        if (!currentVideo || currentVideo.readyState < 2) return;

        const result = landmarker.detectForVideo(currentVideo, performance.now());
        const landmarks = extractPostureLandmarks(result);
        // extractPostureLandmarks already drops frames where a required
        // landmark's visibility is too low — skip this tick entirely
        // rather than smoothing in an unreliable reading.
        if (!landmarks) return;

        deviationWindow.push(computeAngleDeviation(landmarks, baseline));
        if (deviationWindow.length > SMOOTHING_WINDOW) deviationWindow.shift();

        const smoothedDeviation =
          deviationWindow.reduce((sum, value) => sum + value, 0) /
          deviationWindow.length;

        setScore(scoreFromDeviation(smoothedDeviation));
        setStatus("live");
      }, SAMPLE_INTERVAL_MS);
    }

    start();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { videoRef, status, score, retry };
}
