import type { Point2D, PostureLandmarks } from "@/lib/posture/mediapipe";

interface PostureLandmarkOverlayProps {
  landmarks: PostureLandmarks | null;
}

// Mirrors x the same way the <video> underneath is CSS-mirrored
// (-scale-x-100, for a natural self-view) — MediaPipe's landmarks are
// normalized against the raw, unmirrored camera frame, so without this
// every dot would land on the wrong side of what's actually on screen.
function mirror(point: Point2D): Point2D {
  return { x: 1 - point.x, y: point.y };
}

function midpoint(a: Point2D, b: Point2D): Point2D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// The exact points and lines scorePosture actually uses (see
// lib/scoring.ts): the shoulder line, and the neck line from the
// shoulder midpoint to the ear midpoint whose angle against it is the
// primary score. Deliberately not a generic full-body skeleton — only
// what this app tracks.
export function PostureLandmarkOverlay({ landmarks }: PostureLandmarkOverlayProps) {
  if (!landmarks) return null;

  const leftShoulder = mirror(landmarks.leftShoulder);
  const rightShoulder = mirror(landmarks.rightShoulder);
  const leftEar = mirror(landmarks.leftEar);
  const rightEar = mirror(landmarks.rightEar);
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const earMid = midpoint(leftEar, rightEar);

  const pct = (point: Point2D) => ({ x: point.x * 100, y: point.y * 100 });

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      {/* Shoulder line */}
      <line
        x1={pct(leftShoulder).x}
        y1={pct(leftShoulder).y}
        x2={pct(rightShoulder).x}
        y2={pct(rightShoulder).y}
        stroke="#FF7A59"
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
      />
      {/* Neck line: shoulder midpoint -> ear midpoint, whose angle
          against the shoulder line is the score's primary input. */}
      <line
        x1={pct(shoulderMid).x}
        y1={pct(shoulderMid).y}
        x2={pct(earMid).x}
        y2={pct(earMid).y}
        stroke="#FF7A59"
        strokeWidth={0.6}
        strokeDasharray="2 1.5"
        vectorEffect="non-scaling-stroke"
      />

      {[leftShoulder, rightShoulder, leftEar, rightEar].map((point, index) => (
        <circle key={index} cx={pct(point).x} cy={pct(point).y} r={1.1} fill="#FF7A59" />
      ))}
      <circle cx={pct(shoulderMid).x} cy={pct(shoulderMid).y} r={0.7} fill="#FF7A59" opacity={0.6} />
      <circle cx={pct(earMid).x} cy={pct(earMid).y} r={0.7} fill="#FF7A59" opacity={0.6} />
    </svg>
  );
}
