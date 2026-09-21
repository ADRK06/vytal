"use client";

import { useEffect, useState } from "react";
import { useMotionValue, useSpring, useMotionValueEvent } from "framer-motion";

interface UseAnimatedNumberOptions {
  stiffness?: number;
  damping?: number;
  // Starting point for the very first render — omit to have the number
  // simply appear at `value` (no animation on mount, only on later
  // changes, which is what the dashboard's live scores want); pass 0 for
  // a count-up-from-zero intro (what the stats cards want).
  initial?: number;
  // Hard bounds on the displayed value. Live scores retarget the spring
  // roughly once a second — under continuous retargeting (not a single
  // step from rest) even a nominally-overdamped spring can briefly
  // overshoot past the target, which for a 0-100 score reads as a
  // visibly broken number. Clamp the ones that have a known valid range.
  clamp?: [number, number];
}

// Shared by the dashboard's live score readouts (tween smoothly between
// values as new readings arrive) and the stats cards (count up from 0 on
// load) — same underlying mechanic, just a different starting point.
export function useAnimatedNumber(
  value: number,
  { stiffness = 140, damping = 32, initial, clamp }: UseAnimatedNumberOptions = {}
): number {
  const motionValue = useMotionValue(initial ?? value);
  const spring = useSpring(motionValue, { stiffness, damping });
  const [display, setDisplay] = useState(Math.round(initial ?? value));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useMotionValueEvent(spring, "change", (latest) => {
    const bounded = clamp ? Math.min(clamp[1], Math.max(clamp[0], latest)) : latest;
    setDisplay(Math.round(bounded));
  });

  return display;
}
