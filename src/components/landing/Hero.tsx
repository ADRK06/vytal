"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, Variants } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LiquidGlassButton } from "./LiquidGlassButton";
import { Magnetic } from "./Magnetic";

// Single orchestrated load-in: the whole hero staggers in once, no
// per-element hover/fade animations layered on top of it.
const container: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

interface HeroProps {
  isLoggedIn: boolean;
}

export function Hero({ isLoggedIn }: HeroProps) {
  const ctaHref = isLoggedIn ? "/dashboard" : "/login";
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Parallax depth: the blobs are a child of the section's own scroll
  // transit (start start -> end start), and get pushed back down by a
  // fraction of that transit — so as the section scrolls up at its normal
  // 1x rate, the blobs net out moving slower, reading as "further back"
  // than the foreground text, which has no counter-transform of its own.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const blobY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, 140]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-6 py-24 sm:px-10 lg:px-16">
      {/* Slow, continuous liquid gradient — pure CSS morph (not Framer
          Motion), sits behind the content at low opacity so the headline
          and panel stay fully readable on top of it. The outer motion.div
          only adds the scroll-linked parallax offset on top of that. */}
      <motion.div
        aria-hidden
        style={{ y: blobY }}
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute -left-[15%] -top-[20%] h-[520px] w-[520px] bg-hydration/20 blur-[120px]"
          style={{ animation: "liquid-morph 26s ease-in-out infinite" }}
        />
        <div
          className="absolute -right-[10%] top-[10%] h-[460px] w-[460px] bg-posture/18 blur-[130px]"
          style={{ animation: "liquid-morph 32s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute bottom-[-25%] left-[20%] h-[480px] w-[480px] bg-stress/12 blur-[140px]"
          style={{ animation: "liquid-morph 38s ease-in-out infinite" }}
        />
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-2"
      >
        <div className="flex flex-col gap-6">
          <motion.span
            variants={item}
            className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim"
          >
            Live desk wellness
          </motion.span>

          <motion.h1
            variants={item}
            className="font-sans text-4xl font-semibold leading-tight text-text sm:text-5xl lg:text-6xl"
          >
            Sense your <span className="text-posture">posture</span>,{" "}
            <span className="text-hydration">hydration</span>, and{" "}
            <span className="text-stress">stress</span> — in real time.
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-md font-sans text-base text-text-dim sm:text-lg"
          >
            VYTAL reads your posture from your webcam, and your hydration and
            stress from a sensing mouse, then scores all three live on one
            dashboard — no video ever leaves your browser.
          </motion.p>

          <motion.div variants={item}>
            <Magnetic className="inline-block">
              <LiquidGlassButton href={ctaHref}>Start a session</LiquidGlassButton>
            </Magnetic>
          </motion.div>
        </div>

        <motion.div
          variants={item}
          className="mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto"
        >
          <GlassPanel className="p-8">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
                Live session
              </span>
              <span className="flex items-center gap-2 font-mono text-xs text-text-dim">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
                Live
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-6">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
                    Posture
                  </span>
                  <span className="font-mono text-3xl font-medium text-posture">
                    87
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[87%] rounded-full bg-posture" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
                    Hydration
                  </span>
                  <span className="font-mono text-3xl font-medium text-hydration">
                    64
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[64%] rounded-full bg-hydration" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
                    Stress
                  </span>
                  <span className="font-mono text-3xl font-medium text-stress">
                    22
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[22%] rounded-full bg-stress" />
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </section>
  );
}
