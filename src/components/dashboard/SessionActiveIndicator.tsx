"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";

// Fixed (not inline like SessionTimer) so it stays visible regardless of
// scroll position — the whole point is a reminder the camera's still
// running that survives scrolling away from the top of the dashboard.
// Neutral dot, not posture/hydration/stress-colored, since it represents
// the session as a whole rather than any one signal (same convention
// SessionTimer's own "Live session" dot already uses). The whole badge
// breathes (not just the small dot) — subtle enough to read as "alive"
// rather than distracting, but noticeable at a glance.
export function SessionActiveIndicator() {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      animate={{ opacity: [1, 0.7, 1], scale: [1, 1.03, 1] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <GlassPanel className="flex items-center gap-2 px-4 py-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
          Session active
        </span>
      </GlassPanel>
    </motion.div>
  );
}
