import type { ReactNode } from "react";
import { ScrollReveal } from "./ScrollReveal";
import {
  PostureIllustration,
  HydrationIllustration,
  DashboardIllustration,
} from "./Illustrations";

interface Step {
  eyebrow: string;
  title: string;
  body: string;
  illustration: ReactNode;
  // "neutral" for anything that isn't specifically about one signal (the
  // unified dashboard covers both) — posture/hydration's colors are
  // reserved for content that's actually about that one metric.
  accent: "posture" | "hydration" | "neutral";
}

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
    eyebrow: "03 — Dashboard",
    title: "One dashboard, both signals, correlated.",
    body: "Posture and hydration scores land on the same live timeline, so you can actually see how one affects the other over the course of a session — not just two disconnected numbers.",
    illustration: <DashboardIllustration />,
    accent: "neutral",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-24 px-6 py-24 sm:px-10 lg:px-16">
      {STEPS.map((step, index) => (
        <ScrollReveal key={step.title}>
          <div
            className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
              index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div className="flex flex-col gap-4">
              <span
                className={`font-mono text-xs uppercase tracking-[0.2em] ${
                  step.accent === "posture"
                    ? "text-posture"
                    : step.accent === "hydration"
                      ? "text-hydration"
                      : "text-text-dim"
                }`}
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
        </ScrollReveal>
      ))}
    </section>
  );
}
