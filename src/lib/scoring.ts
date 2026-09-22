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

// Vertical gap between the two shoulders, in MediaPipe's normalized (0-1)
// image coordinates. Unlike the neck-torso angle, this is never baselined
// against a per-user "upright" capture — level shoulders are the target
// regardless of camera framing, so raw 0 is always the ideal. Doesn't
// need hip landmarks either, so it holds up under the same laptop-webcam
// framing constraint as the primary angle (see PostureLandmarks).
export function computeShoulderAsymmetry(landmarks: PostureLandmarks): number {
  return Math.abs(landmarks.leftShoulder.y - landmarks.rightShoulder.y);
}

// A visibly uneven-shoulder lean is roughly this much vertical gap at
// typical laptop-webcam framing distance — approximate, like
// MAX_DEVIATION_DEGREES, and tunable once real posture data comes in.
const MAX_SHOULDER_ASYMMETRY = 0.08;

// Capped well below the primary angle score's full 0-100 range: shoulder
// asymmetry is a secondary contributor, so even a badly uneven-shoulder
// frame should only ever shave points off an otherwise-good angle score,
// never dominate it or zero it out alone.
const SHOULDER_ASYMMETRY_MAX_PENALTY = 20;

function shoulderAsymmetryPenalty(asymmetry: number): number {
  const normalized = Math.min(1, asymmetry / MAX_SHOULDER_ASYMMETRY);
  // Same flat-near-zero, steep-further-out falloff shape as the primary
  // score, for the same reason: a little natural asymmetry (nobody sits
  // perfectly level) shouldn't cost anything.
  return SHOULDER_ASYMMETRY_MAX_PENALTY * normalized ** 2;
}

// The single blend both scoring paths funnel through, so they can never
// drift apart: scorePosture (below) scores directly off fresh landmarks,
// while usePostureScore scores off a smoothed rolling-window deviation
// and a separately-smoothed asymmetry — same formula either way.
export function scoreWithShoulderPenalty(
  deviationDegrees: number,
  shoulderAsymmetry: number
): number {
  const primaryScore = scoreFromDeviation(deviationDegrees);
  const penalty = shoulderAsymmetryPenalty(shoulderAsymmetry);
  return Math.max(0, Math.min(100, Math.round(primaryScore - penalty)));
}

export function scorePosture(
  landmarks: PostureLandmarks,
  baseline: PostureBaseline
): number {
  return scoreWithShoulderPenalty(
    computeAngleDeviation(landmarks, baseline),
    computeShoulderAsymmetry(landmarks)
  );
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

// Placeholder until real calibration data exists from the ESP32 mouse.
// Maps the raw GSR ADC reading linearly onto 0-100, clamped. The range
// (ESP32's 12-bit ADC, 0-4095) and the direction (higher raw value ->
// higher score) are both guesses — this has no physiological basis yet
// and needs recalibrating once real sensor + baseline data comes in from
// teammate testing (see HydrationBaseline above for where that'll plug in).
const RAW_GSR_MIN = 0;
const RAW_GSR_MAX = 4095;

export function scoreHydration(rawGsr: number): number {
  const clamped = Math.max(RAW_GSR_MIN, Math.min(RAW_GSR_MAX, rawGsr));
  const score = ((clamped - RAW_GSR_MIN) / (RAW_GSR_MAX - RAW_GSR_MIN)) * 100;
  return Math.round(score);
}

export interface StressBaseline {
  /** Resting raw_gsr and raw_ppg readings, captured the same way HydrationBaseline is. */
  restingGsr: number;
  restingPpg: number;
}

const STRESS_BASELINE_STORAGE_KEY = "vytal:stress-baseline";

export function getStoredStressBaseline(): StressBaseline | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STRESS_BASELINE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StressBaseline) : null;
  } catch {
    return null;
  }
}

export function storeStressBaseline(baseline: StressBaseline): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STRESS_BASELINE_STORAGE_KEY,
      JSON.stringify(baseline)
    );
  } catch {
    // Ignore storage errors (private browsing, quota, etc.) — the session
    // just won't have a baseline until the user recalibrates.
  }
}

// Placeholder until real calibration data exists, same as scoreHydration
// above — no stress calibration step exists in the UI yet, so this
// always has a usable answer via DEFAULT_STRESS_BASELINE rather than
// requiring one. Physiological direction: skin conductance (GSR) rises
// with sympathetic arousal, so a higher-than-resting raw_gsr reads as
// more stressed. raw_ppg is treated the same way, as a scalar proxy for
// heart-rate elevation — /api/ingest gets one raw_ppg value per tick, not
// a waveform to detect an actual BPM from, so this assumes the firmware
// is already sending something roughly proportional to heart rate rather
// than a raw unprocessed sample.
const STRESS_ADC_MAX = 4095;
const DEFAULT_STRESS_BASELINE: StressBaseline = {
  restingGsr: STRESS_ADC_MAX / 2,
  restingPpg: STRESS_ADC_MAX / 2,
};

// 0-1: how far above resting the raw value is, relative to the distance
// from resting up to whichever ADC bound is farther away — a below-
// resting reading (calmer than baseline) floors at 0 rather than going
// negative, since "calmer than resting" isn't a negative stress score.
function positiveDeviationFraction(raw: number, resting: number): number {
  const range = Math.max(resting, STRESS_ADC_MAX - resting, 1);
  return Math.max(0, Math.min(1, (raw - resting) / range));
}

export function scoreStress(
  rawGsr: number,
  rawPpg: number,
  baseline: StressBaseline = DEFAULT_STRESS_BASELINE
): number {
  const gsrStress = positiveDeviationFraction(rawGsr, baseline.restingGsr);
  const ppgStress = positiveDeviationFraction(rawPpg, baseline.restingPpg);
  const score = ((gsrStress + ppgStress) / 2) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}
