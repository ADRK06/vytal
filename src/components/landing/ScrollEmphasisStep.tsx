"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ReactNode, useRef } from "react";

interface ScrollEmphasisStepProps {
  children: ReactNode;
  className?: string;
}

// Continuously scroll-linked, not a one-time whileInView trigger: each
// step's own scale/opacity track its position relative to the viewport
// center via useScroll + useTransform, so it scales up and brightens as
// it becomes the primary focus, then recedes again as the next step
// takes over — reversible on scroll-up, since it's driven directly by
// scroll position rather than a fired-once animation.
export function ScrollEmphasisStep({ children, className = "" }: ScrollEmphasisStepProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.45, 1, 0.45]);

  return (
    <motion.div ref={ref} style={{ scale, opacity }} className={className}>
      {children}
    </motion.div>
  );
}
