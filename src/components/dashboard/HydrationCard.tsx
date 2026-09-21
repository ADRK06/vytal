"use client";

import { useHydrationRealtime } from "@/hooks/useHydrationRealtime";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/EmptyState";

interface HydrationCardProps {
  sessionId: string;
}

export function HydrationCard({ sessionId }: HydrationCardProps) {
  const { score, status } = useHydrationRealtime(sessionId);

  return (
    <GlassPanel className="p-8">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
          Hydration
        </span>
        {status === "live" && (
          <span className="flex items-center gap-2 font-mono text-xs text-text-dim">
            <span className="h-2 w-2 animate-pulse rounded-full bg-hydration" />
            Live
          </span>
        )}
      </div>

      <div className="mt-6">
        {status === "connecting" && (
          <EmptyState message="No data received yet…" />
        )}

        {status === "disconnected" && (
          <EmptyState message="Sensor appears disconnected. Check the mouse's WiFi connection." />
        )}

        {status === "live" && score !== null && (
          <div>
            <span className="font-mono text-4xl font-medium text-hydration">
              {score}
            </span>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-hydration transition-[width] duration-500"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
