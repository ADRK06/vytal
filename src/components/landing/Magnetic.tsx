"use client";

import { ReactNode, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const SPRING = { stiffness: 150, damping: 15, mass: 0.5 };
// Fraction of cursor-to-center distance the element actually travels — kept
// low so this reads as a gentle pull, not the element chasing the cursor.
const PULL_STRENGTH = 0.25;

interface MagneticProps {
  children: ReactNode;
  className?: string;
}

// Wraps a button or card so it drifts slightly toward the cursor on hover
// and eases back on leave — spring-driven x/y transforms only (no layout
// reads on move beyond the one boundingClientRect per event), so this stays
// on the compositor and doesn't cause scroll/layout jank.
export function Magnetic({ children, className = "" }: MagneticProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * PULL_STRENGTH);
    y.set((event.clientY - rect.top - rect.height / 2) * PULL_STRENGTH);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={prefersReducedMotion ? undefined : { x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
