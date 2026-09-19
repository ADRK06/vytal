// TODO: hook wrapping the MediaPipe posture pipeline into a live score.

export function usePostureScore() {
  return { score: null, status: "no-data" as const };
}
