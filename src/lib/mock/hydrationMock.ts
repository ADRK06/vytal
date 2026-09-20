import type { HydrationSource, HydrationSourceCallbacks } from "@/types";

const UPDATE_INTERVAL_MS = 1000;
const BASELINE_SCORE = 68;
const MEAN_REVERSION = 0.05;
const NOISE_RANGE = 2.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// One step of a mean-reverting random walk: drifts by a small random
// amount each tick, gently pulled back toward a resting baseline so it
// wanders realistically instead of drifting to an extreme and sitting
// there, clamped, for the rest of the session.
export function nextHydrationValue(previous: number): number {
  const pull = (BASELINE_SCORE - previous) * MEAN_REVERSION;
  const noise = (Math.random() - 0.5) * 2 * NOISE_RANGE;
  return clamp(Math.round(previous + pull + noise), 0, 100);
}

// Local-dev stand-in for the real Supabase Realtime subscription on
// hydration_readings. Same HydrationSource interface, so a component using
// this can switch to the real source later without changing its own code.
export function createMockHydrationSource(seed = "default"): HydrationSource {
  return {
    subscribe(callbacks: HydrationSourceCallbacks) {
      let value = clamp(BASELINE_SCORE + (hashSeed(seed) % 21) - 10, 0, 100);

      callbacks.onStatusChange?.("connecting");

      // Mimics the brief handshake delay of a real Realtime subscription
      // before the first reading arrives.
      const startTimeout = setTimeout(() => {
        callbacks.onStatusChange?.("live");
        callbacks.onReading(value);
      }, 300);

      const intervalId = setInterval(() => {
        value = nextHydrationValue(value);
        callbacks.onReading(value);
      }, UPDATE_INTERVAL_MS);

      return () => {
        clearTimeout(startTimeout);
        clearInterval(intervalId);
      };
    },
  };
}
