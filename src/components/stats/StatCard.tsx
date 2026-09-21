"use client";

import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface StatCardProps {
  label: string;
  value: number | null;
  colorClassName: string;
  // Score cards (0-100) pass this; the completed-sessions count doesn't
  // have a fixed upper bound, so it's left unclamped.
  clamp?: [number, number];
}

export function StatCard({ label, value, colorClassName, clamp }: StatCardProps) {
  // Counts up from 0 on load, whereas the dashboard's live scores start
  // at their first value and only tween on later changes — same hook,
  // just the count-up-from-zero starting point this one wants.
  const displayValue = useAnimatedNumber(value ?? 0, { initial: 0, clamp });

  return (
    <GlassPanel className="p-6">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
        {label}
      </span>
      <div className={`mt-2 font-mono text-4xl font-medium ${colorClassName}`}>
        {value === null ? "—" : displayValue}
      </div>
    </GlassPanel>
  );
}
