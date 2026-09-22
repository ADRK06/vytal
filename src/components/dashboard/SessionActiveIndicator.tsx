import { GlassPanel } from "@/components/ui/GlassPanel";

// Fixed (not inline like SessionTimer) so it stays visible regardless of
// scroll position — the whole point is a reminder the camera's still
// running that survives scrolling away from the top of the dashboard.
// Neutral dot, not posture/hydration/stress-colored, since it represents
// the session as a whole rather than any one signal (same convention
// SessionTimer's own "Live session" dot already uses).
export function SessionActiveIndicator() {
  return (
    <GlassPanel className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2">
      <span className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
        Session active
      </span>
    </GlassPanel>
  );
}
