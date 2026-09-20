import type { Point2D, PostureLandmarks } from "./posture/mediapipe";

export interface PostureBaseline {
  /** Degrees between the shoulder->ear vector and the hip->shoulder vector, captured while sitting upright. */
  neckTorsoAngle: number;
}

const POSTURE_BASELINE_STORAGE_KEY = "vytal:posture-baseline";

// A neck-torso angle this far from baseline (in degrees) scores as 0.
const MAX_DEVIATION_DEGREES = 30;

function midpoint(a: Point2D, b: Point2D): Point2D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function angleBetween(from: Point2D, to: Point2D): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

// Keeps an angle difference in (-180, 180] so deviations near the wrap
// boundary don't read as a huge jump.
function normalizeAngleDelta(delta: number): number {
  let normalized = delta % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized <= -180) normalized += 360;
  return normalized;
}

// The angle between the neck (shoulder midpoint -> ear midpoint) and the
// torso (hip midpoint -> shoulder midpoint). Using the torso as the
// reference axis, rather than assuming the camera's vertical is "up",
// keeps the score stable if the person leans back in their chair or the
// webcam itself is slightly tilted.
export function computeNeckTorsoAngle(landmarks: PostureLandmarks): number {
  const shoulderMid = midpoint(landmarks.leftShoulder, landmarks.rightShoulder);
  const hipMid = midpoint(landmarks.leftHip, landmarks.rightHip);
  const earMid = midpoint(landmarks.leftEar, landmarks.rightEar);

  const torsoAngle = angleBetween(hipMid, shoulderMid);
  const neckAngle = angleBetween(shoulderMid, earMid);

  return normalizeAngleDelta(neckAngle - torsoAngle);
}

export function capturePostureBaseline(
  landmarks: PostureLandmarks
): PostureBaseline {
  return { neckTorsoAngle: computeNeckTorsoAngle(landmarks) };
}

export function scorePosture(
  landmarks: PostureLandmarks,
  baseline: PostureBaseline
): number {
  const deviation = Math.abs(
    normalizeAngleDelta(computeNeckTorsoAngle(landmarks) - baseline.neckTorsoAngle)
  );
  const score = 100 - (deviation / MAX_DEVIATION_DEGREES) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getStoredPostureBaseline(): PostureBaseline | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(POSTURE_BASELINE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PostureBaseline) : null;
  } catch {
    return null;
  }
}

export function storePostureBaseline(baseline: PostureBaseline): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      POSTURE_BASELINE_STORAGE_KEY,
      JSON.stringify(baseline)
    );
  } catch {
    // Ignore storage errors (private browsing, quota, etc.) — the session
    // just won't have a baseline until the user recalibrates.
  }
}

// TODO: hydration scoring math will get recalibrated as real calibration data comes in.
export function scoreHydration(): number {
  return 0;
}
