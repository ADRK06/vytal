"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, type MotionValue } from "framer-motion";
import { ScrollEmphasisStep } from "./ScrollEmphasisStep";
import {
  PostureIllustration,
  HydrationIllustration,
  StressIllustration,
  DashboardIllustration,
} from "./Illustrations";

interface Step {
  eyebrow: string;
  title: string;
  body: string;
  illustration: ReactNode;
  // "neutral" for anything that isn't specifically about one signal (the
  // unified dashboard covers all three) — the pillar colors are reserved
  // for content that's actually about that one metric.
  accent: "posture" | "hydration" | "stress" | "neutral";
}

const ACCENT_TEXT_CLASS: Record<Step["accent"], string> = {
  posture: "text-posture",
  hydration: "text-hydration",
  stress: "text-stress",
  neutral: "text-text-dim",
};

// Matches each step's accent, in order — feeds the connecting line's
// gradient so the drawn path visually hands off from one pillar's color to
// the next as it reaches that step.
const ACCENT_HEX: Record<Step["accent"], string> = {
  posture: "#FF7A59",
  hydration: "#5EEAD4",
  stress: "#A78BFA",
  neutral: "#8FA0A3",
};

const STEPS: Step[] = [
  {
    eyebrow: "01 — Posture",
    title: "Your webcam reads posture, on-device.",
    body: "A pose model tracks the angle between your neck and shoulder line in real time, right in the browser. Nothing is ever uploaded — no frame of video leaves your machine.",
    illustration: <PostureIllustration />,
    accent: "posture",
  },
  {
    eyebrow: "02 — Hydration",
    title: "A sensing mouse reads your hydration.",
    body: "Embedded GSR and PPG sensors in the mouse itself stream readings over WiFi as you work, no manual logging, no reminders to drink water you have to act on yourself.",
    illustration: <HydrationIllustration />,
    accent: "hydration",
  },
  {
    eyebrow: "03 — Stress",
    title: "The same sensors also read your stress.",
    body: "Those same GSR and PPG readings get scored a second way — as deviation from your own resting baseline — so stress shows up alongside hydration with no extra hardware.",
    illustration: <StressIllustration />,
    accent: "stress",
  },
  {
    eyebrow: "04 — Dashboard",
    title: "One dashboard, three signals, correlated.",
    body: "Posture, hydration, and stress scores land on the same live timeline, so you can actually see how they move together over a session — not just three disconnected numbers.",
    illustration: <DashboardIllustration />,
    accent: "neutral",
  },
];

// A thin gradient line that draws itself down through the steps as the
// section scrolls (pathLength driven straight off scroll progress, a
// MotionValue Framer updates without a React re-render per tick). Percentage
// viewBox + preserveAspectRatio="none", same technique as
// PostureLandmarkOverlay, so it stretches to the section's real height
// without measuring anything in JS. Desktop-only (lg:block) since it's
// keyed to the two-column zigzag layout that only exists at that width —
// on a single stacked mobile column it wouldn't read as "linking" anything.
function ConnectingLine({ progress }: { progress: MotionValue<number> }) {
  const stops = STEPS.map((step, index) => (
    <stop
      key={step.eyebrow}
      offset={`${(index / (STEPS.length - 1)) * 100}%`}
      stopColor={ACCENT_HEX[step.accent]}
    />
  ));

  return (
    <svg
      aria-hidden
      viewBox="0 0 2 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-y-0 left-1/2 hidden h-full w-[2px] -translate-x-1/2 lg:block"
    >
      <defs>
        <linearGradient id="how-it-works-line" x1="0" y1="0" x2="0" y2="1">
          {stops}
        </linearGradient>
      </defs>
      <path
        d="M1 1 L1 99"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      <motion.path
        d="M1 1 L1 99"
        stroke="url(#how-it-works-line)"
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ pathLength: progress }}
      />
      {STEPS.map((step, index) => (
        <circle
          key={step.eyebrow}
          cx={1}
          cy={4 + (92 / (STEPS.length - 1)) * index}
          r={2.5}
          fill={ACCENT_HEX[step.accent]}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end center"],
  });

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto flex max-w-6xl flex-col gap-24 px-6 py-24 sm:px-10 lg:px-16"
    >
      {!prefersReducedMotion && <ConnectingLine progress={scrollYProgress} />}

      {STEPS.map((step, index) => (
        <ScrollEmphasisStep key={step.title}>
          <div
            className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
              index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div className="flex flex-col gap-4">
              <span
                className={`font-mono text-xs uppercase tracking-[0.2em] ${ACCENT_TEXT_CLASS[step.accent]}`}
              >
                {step.eyebrow}
              </span>
              <h2 className="font-sans text-2xl font-semibold leading-snug text-text sm:text-3xl">
                {step.title}
              </h2>
              <p className="max-w-md font-sans text-base text-text-dim">
                {step.body}
              </p>
            </div>

            <div className="mx-auto aspect-[6/5] w-full max-w-sm">
              {step.illustration}
            </div>
          </div>
        </ScrollEmphasisStep>
      ))}
    </section>
  );
}
