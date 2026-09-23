import type { Point2D, PostureLandmarks } from "./posture/mediapipe";

export interface PostureBaseline {
  /** Craniovertebral angle (degrees from horizontal), captured while sitting upright. */
  craniovertebralAngle: number;
}

const POSTURE_BASELINE_STORAGE_KEY = "vytal:posture-baseline";

// A CVA deviation at or beyond this many degrees from baseline scores 0.
// The falloff is quadratic (see scorePosture), not linear: a straight-line
// falloff can't fit "barely penalize a few degrees of natural movement" and
// "a ~10° slouch should feel like a real drop" at the same time — no single
// divisor gets both a 3° deviation into the 90s and a 10° deviation down to
// ~40. Squaring the normalized deviation keeps the curve flat near 0 and
// steep in the middle, matching how a slouch actually feels.
//
// This constant carries over unchanged from the old shoulder-perpendicular
// method rather than being picked fresh: verified via synthetic data (see
// the CVA computation below) that for a fixed physical head rotation, the
// raw shoulder->ear vector rotates by the same number of degrees regardless
// of which fixed reference (the shoulder line's perpendicular, or plain
// horizontal) that rotation is measured against — a reference is just an
// additive offset, not a scale factor, as long as the shoulders themselves
// aren't also rotating between baseline and live reads. So "how many
// degrees of raw deviation a given real slouch produces" doesn't change
// with the switch; what changes is that CVA's absolute value (~45-55°
// normal, per the clinical literature) no longer reads near 0° the way the
// old angle did, which only matters for the *display* value, not this
// deviation-based curve.
const MAX_DEVIATION_DEGREES = 13;

function midpoint(a: Point2D, b: Point2D): Point2D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Angle, in degrees, of the vector from `from` to `to`, measured from
// horizontal with "up" as positive. Image coordinates put y=0 at the top
// and increase downward, so dy is flipped here — otherwise a point
// directly above `from` would read as -90° instead of the +90° you'd
// expect looking at this on paper.
function angleFromHorizontal(from: Point2D, to: Point2D): number {
  const dx = to.x - from.x;
  const dy = from.y - to.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

// Keeps an angle difference in (-180, 180] so deviations near the wrap
// boundary don't read as a huge jump.
function normalizeAngleDelta(delta: number): number {
  let normalized = delta % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized <= -180) normalized += 360;
  return normalized;
}

// Craniovertebral angle (CVA): the standard clinical measure of
// forward-head posture — the angle, from horizontal, between the shoulder
// midpoint and the ear midpoint. Normal CVA is roughly 45-55°; a
// meaningfully lower angle indicates a forward-head/slouched position.
// Averaging left+right into a midpoint on both ends (rather than reading
// off one side) cancels out a person turning slightly toward one shoulder.
//
// This replaces the previous neck-torso angle, which referenced the
// shoulder line's own perpendicular instead of fixed horizontal — robust to
// a tilted camera mount, but sensitive to the torso/shoulders rotating even
// when the head/neck posture itself hasn't changed (e.g. leaning toward a
// second monitor). Referencing horizontal removes that shoulder-rotation
// noise. The tradeoff runs the other way: a genuinely tilted camera now
// biases the raw angle. That's fine here, since scoring only ever uses the
// *deviation* from a baseline captured on that same camera (see
// computeAngleDeviation), which cancels a constant tilt out.
//
// Still requires no hip landmarks, consistent with PostureLandmarks: hips
// are essentially never visible at typical laptop/monitor webcam framing
// (they're below desk level), and this formula doesn't need them.
export function computeCraniovertebralAngle(landmarks: PostureLandmarks): number {
  const shoulderMid = midpoint(landmarks.leftShoulder, landmarks.rightShoulder);
  const earMid = midpoint(landmarks.leftEar, landmarks.rightEar);
  return angleFromHorizontal(shoulderMid, earMid);
}

export function capturePostureBaseline(
  landmarks: PostureLandmarks
): PostureBaseline {
  return { craniovertebralAngle: computeCraniovertebralAngle(landmarks) };
}

// The CVA deviation from baseline, normalized into (-180, 180]. Exposed
// separately from scoreFromDeviation so callers that sample repeatedly
// (usePostureScore) can smooth this raw number over several frames before
// ever converting it to a score.
export function computeAngleDeviation(
  landmarks: PostureLandmarks,
  baseline: PostureBaseline
): number {
  return normalizeAngleDelta(
    computeCraniovertebralAngle(landmarks) - baseline.craniovertebralAngle
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
// image coordinates. Unlike the CVA, this is never baselined against a
// per-user "upright" capture — level shoulders are the target
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

// Sustained-slouch debouncing: how far below the calibrated CVA baseline
// (in degrees) counts as "bad", and how many consecutive valid readings at
// or beyond that threshold are required before flagging it as sustained —
// a single noisy or momentarily-occluded frame (reaching for a coffee cup,
// a cough) shouldn't fire a notification. posture_readings gets one write
// per second (see usePostureScore's SAMPLE_INTERVAL_MS), so this default
// works out to roughly 15 seconds of continuous slouching, in the same
// ballpark as the reminder's previous 18-second wall-clock window.
export const SLOUCH_CVA_THRESHOLD_DEGREES = 6;
export const SLOUCH_SUSTAINED_FRAME_COUNT = 15;

// The score a deviation of exactly SLOUCH_CVA_THRESHOLD_DEGREES produces —
// lets a caller that only ever sees the final 0-100 score (e.g. a
// Realtime-subscribed dashboard card, which has no access to raw CVA
// degrees) apply the same degree-based threshold without re-deriving it.
export const SLOUCH_SCORE_THRESHOLD = scoreFromDeviation(SLOUCH_CVA_THRESHOLD_DEGREES);

// True once the most recent SLOUCH_SUSTAINED_FRAME_COUNT readings are all
// present (not null/missing) and all at or below SLOUCH_SCORE_THRESHOLD.
// `recentScores` is expected oldest-first, most-recent-last, matching how
// a caller would push each new reading onto a rolling buffer — only the
// tail is inspected, so it's fine to pass a longer history than the window
// actually needs.
export function isSustainedSlouch(recentScores: Array<number | null>): boolean {
  if (recentScores.length < SLOUCH_SUSTAINED_FRAME_COUNT) return false;
  const window = recentScores.slice(-SLOUCH_SUSTAINED_FRAME_COUNT);
  return window.every(
    (score): score is number => score !== null && score <= SLOUCH_SCORE_THRESHOLD
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
