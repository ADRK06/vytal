import type { Point2D, PostureLandmarks } from "./posture/mediapipe";

export interface PostureBaseline {
  /** Degrees between the shoulder->ear vector and the shoulder line's own perpendicular, captured while sitting upright. */
  neckTorsoAngle: number;
}

const POSTURE_BASELINE_STORAGE_KEY = "vytal:posture-baseline";

// A neck-torso angle at or beyond this many degrees from baseline scores 0.
// The falloff is quadratic (see scorePosture), not linear: a straight-line
// falloff can't fit "barely penalize a few degrees of natural movement" and
// "a ~10° slouch should feel like a real drop" at the same time — no single
// divisor gets both a 3° deviation into the 90s and a 10° deviation down to
// ~40. Squaring the normalized deviation keeps the curve flat near 0 and
// steep in the middle, matching how a slouch actually feels.
const MAX_DEVIATION_DEGREES = 13;

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

// The perpendicular to the shoulder line that points "up" (toward the top
// of the frame). There are two perpendiculars to any line; this picks
// whichever one is closer to straight up, so it doesn't matter which
// shoulder lands on which side of the image.
function shoulderUpAngle(leftShoulder: Point2D, rightShoulder: Point2D): number {
  const shoulderLineAngle = angleBetween(leftShoulder, rightShoulder);
  const candidateA = normalizeAngleDelta(shoulderLineAngle + 90);
  const candidateB = normalizeAngleDelta(shoulderLineAngle - 90);
  const distanceFromUp = (angle: number) => Math.abs(normalizeAngleDelta(angle + 90));
  return distanceFromUp(candidateA) <= distanceFromUp(candidateB) ? candidateA : candidateB;
}

// The angle between the neck (shoulder midpoint -> ear midpoint) and the
// shoulder line's own perpendicular. Using the shoulder line as the
// reference axis — rather than assuming the camera's vertical is "up", or
// requiring hips — keeps the score stable if the webcam is slightly tilted,
// and works with typical laptop/monitor webcam framing, where hips are
// essentially never visible (they're below desk level). Hip landmarks are
// still extracted when available (see PostureLandmarks) but intentionally
// don't feed into this formula: mixing a hip-referenced angle into some
// samples and a shoulder-only one into others would make baseline and live
// readings inconsistent depending on which happened to be visible when.
export function computeNeckTorsoAngle(landmarks: PostureLandmarks): number {
  const shoulderMid = midpoint(landmarks.leftShoulder, landmarks.rightShoulder);
  const earMid = midpoint(landmarks.leftEar, landmarks.rightEar);

  const neckAngle = angleBetween(shoulderMid, earMid);
  const torsoAngle = shoulderUpAngle(landmarks.leftShoulder, landmarks.rightShoulder);

  return normalizeAngleDelta(neckAngle - torsoAngle);
}

export function capturePostureBaseline(
  landmarks: PostureLandmarks
): PostureBaseline {
  return { neckTorsoAngle: computeNeckTorsoAngle(landmarks) };
}

// The neck-torso angle deviation from baseline, normalized into (-180, 180].
// Exposed separately from scoreFromDeviation so callers that sample
// repeatedly (usePostureScore) can smooth this raw number over several
// frames before ever converting it to a score.
export function computeAngleDeviation(
  landmarks: PostureLandmarks,
  baseline: PostureBaseline
): number {
  return normalizeAngleDelta(
    computeNeckTorsoAngle(landmarks) - baseline.neckTorsoAngle
  );
}

export function scoreFromDeviation(deviationDegrees: number): number {
  // Squaring (rather than Math.abs) is what makes this symmetric — a
  // positive or negative deviation of the same size scores identically —
  // while also producing the quadratic (flat-then-steep) falloff.
  const score = 100 - 100 * (deviationDegrees / MAX_DEVIATION_DEGREES) ** 2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scorePosture(
  landmarks: PostureLandmarks,
  baseline: PostureBaseline
): number {
  return scoreFromDeviation(computeAngleDeviation(landmarks, baseline));
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

export interface HydrationBaseline {
  /** Average mock reading captured while holding the mouse still during calibration. */
  restingScore: number;
}

const HYDRATION_BASELINE_STORAGE_KEY = "vytal:hydration-baseline";

export function captureHydrationBaseline(samples: number[]): HydrationBaseline {
  const restingScore =
    samples.length === 0
      ? 0
      : Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length);
  return { restingScore };
}

export function getStoredHydrationBaseline(): HydrationBaseline | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HYDRATION_BASELINE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HydrationBaseline) : null;
  } catch {
    return null;
  }
}

export function storeHydrationBaseline(baseline: HydrationBaseline): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      HYDRATION_BASELINE_STORAGE_KEY,
      JSON.stringify(baseline)
    );
  } catch {
    // Ignore storage errors (private browsing, quota, etc.) — the session
    // just won't have a baseline until the user recalibrates.
  }
}

// TODO: hydration scoring math will get recalibrated once this baseline is
// wired into a real GSR/PPG signal from the ESP32 mouse.
export function scoreHydration(): number {
  return 0;
}
