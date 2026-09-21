"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

// One clean reveal per section — matches Hero's own load-in easing/timing
// so the whole page reads as a single consistent motion language, just
// triggered by scroll position instead of mount. Never re-fires once a
// section has revealed (viewport once: true), and never staggers
// individual elements within a section.
const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
}

export function ScrollReveal({ children, className = "" }: ScrollRevealProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
