"use client";

import { motion, Variants } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LiquidGlassButton } from "./LiquidGlassButton";

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

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:px-10 lg:px-16">
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
            Sense your <span className="text-posture">posture</span> and{" "}
            <span className="text-hydration">hydration</span>, in real time.
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-md font-sans text-base text-text-dim sm:text-lg"
          >
            VYTAL reads your posture from your webcam and your hydration from
            a sensing mouse, then scores both live on one dashboard — no
            video ever leaves your browser.
          </motion.p>

          <motion.div variants={item}>
            <LiquidGlassButton>Start a session</LiquidGlassButton>
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
                <span className="h-2 w-2 animate-pulse rounded-full bg-hydration" />
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
            </div>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </section>
  );
}
