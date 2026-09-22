"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Magnetic } from "./Magnetic";

const FEATURES = [
  {
    title: "Real-time detection",
    body: "All three scores update live, once a second, while you work.",
  },
  {
    title: "No manual logging",
    body: "Nothing to type in. The webcam and the mouse do the reading.",
  },
  {
    title: "See the correlation",
    body: "One timeline for all three signals, so patterns actually stand out.",
  },
  {
    title: "Private by design",
    body: "Video is processed on-device and never leaves your browser.",
  },
  {
    title: "Stress, same sensors",
    body: "The mouse's GSR and PPG readings are scored a second way, as deviation from your resting baseline — stress shows up with no extra hardware.",
  },
  {
    title: "A calendar of your stress",
    body: "Every day you've used VYTAL gets a cell on a GitHub-style heatmap on /log, so week-over-week patterns are as visible as within one session.",
  },
];

export function FeatureHighlights() {
  const sectionRef = useRef<HTMLElement | null>(null);

  // Scroll-scrubbed, not a one-time trigger: x tracks scroll progress
  // directly across the section's own transit through the viewport, so
  // the row slides from off-screen right to off-screen left and reverses
  // cleanly if the user scrolls back up.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["60vw", "-60vw"]);

  return (
    <section ref={sectionRef} className="overflow-hidden py-24">
      <motion.div
        style={{ x }}
        className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 sm:grid-cols-2 sm:px-10 lg:grid-cols-3 lg:px-16"
      >
        {FEATURES.map((feature) => (
          <Magnetic key={feature.title}>
            <GlassPanel className="h-full p-6">
              <h3 className="font-sans text-base font-semibold text-text">
                {feature.title}
              </h3>
              <p className="mt-2 font-sans text-sm text-text-dim">
                {feature.body}
              </p>
            </GlassPanel>
          </Magnetic>
        ))}
      </motion.div>
    </section>
  );
}
