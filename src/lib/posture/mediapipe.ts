import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

export interface Point2D {
  x: number;
  y: number;
}

export interface PostureLandmarks {
  leftShoulder: Point2D;
  rightShoulder: Point2D;
  leftEar: Point2D;
  rightEar: Point2D;
  // Optional: typical laptop/monitor webcam framing sits above desk level
  // and never shows hips at all (confirmed via debug logging — hip
  // visibility sits around 0.01 on a normal laptop setup, vs. 0.99+ for
  // shoulders/ears). Extracted when visible, but nothing in the current
  // scoring math depends on them — see computeNeckTorsoAngle in
  // lib/scoring.ts.
  leftHip?: Point2D;
  rightHip?: Point2D;
}

// Indices into PoseLandmarker's 33-point BlazePose topology.
const LANDMARK_INDEX = {
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftHip: 23,
  rightHip: 24,
} as const;

// Below this, MediaPipe itself isn't confident the landmark is actually
// visible (occluded, out of frame, etc.) — treat the whole sample as
// unreliable rather than scoring off a guessed position.
const MIN_VISIBILITY = 0.5;

const WASM_BASE_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

async function createLandmarker(): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
  const baseOptions = { modelAssetPath: MODEL_ASSET_URL };
  try {
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { ...baseOptions, delegate: "GPU" },
      runningMode: "VIDEO",
      numPoses: 1,
    });
  } catch {
    // Some browsers/devices lack WebGL support for the GPU delegate.
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { ...baseOptions, delegate: "CPU" },
      runningMode: "VIDEO",
      numPoses: 1,
    });
  }
}

export function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarker().catch((error) => {
      landmarkerPromise = null;
      throw error;
    });
  }
  return landmarkerPromise;
}

export function extractPostureLandmarks(
  result: PoseLandmarkerResult
): PostureLandmarks | null {
  const points = result.landmarks[0];
  if (!points) return null;

  const at = (index: number): Point2D | undefined => {
    const point = points[index];
    if (!point || point.visibility < MIN_VISIBILITY) return undefined;
    return { x: point.x, y: point.y };
  };

  const leftShoulder = at(LANDMARK_INDEX.leftShoulder);
  const rightShoulder = at(LANDMARK_INDEX.rightShoulder);
  const leftEar = at(LANDMARK_INDEX.leftEar);
  const rightEar = at(LANDMARK_INDEX.rightEar);

  // Shoulders and ears are required. Hips are opportunistic — see
  // PostureLandmarks — since typical laptop webcam framing never shows
  // them, and gating on them here would mean scoring never runs at all.
  if (!leftShoulder || !rightShoulder || !leftEar || !rightEar) {
    return null;
  }

  const leftHip = at(LANDMARK_INDEX.leftHip);
  const rightHip = at(LANDMARK_INDEX.rightHip);

  return { leftShoulder, rightShoulder, leftEar, rightEar, leftHip, rightHip };
}
