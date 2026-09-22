"use client";

import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePostureRealtime } from "@/hooks/usePostureRealtime";
import { useHydrationRealtime } from "@/hooks/useHydrationRealtime";
import { useStressRealtime } from "@/hooks/useStressRealtime";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface LiveTrendChartProps {
  sessionId: string;
}

interface LivePoint {
  t: number;
  posture?: number;
  hydration?: number;
  stress?: number;
}

const SERIES = {
  posture: { label: "Posture", color: "#FF7A59" },
  hydration: { label: "Hydration", color: "#5EEAD4" },
  stress: { label: "Stress", color: "#A78BFA" },
} as const;

// The visible window — "last ~60 seconds" per the task.
const WINDOW_MS = 60000;
// Re-trims the buffer on a timer too, not just on new readings, so the
// window keeps scrolling (old points still drop off) even if a sensor
// goes quiet rather than freezing on stale data.
const TRIM_INTERVAL_MS = 2000;

function formatSecondsAgo(t: number, now: number): string {
  const secondsAgo = Math.round((now - t) / 1000);
  return secondsAgo <= 0 ? "now" : `-${secondsAgo}s`;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { dataKey: keyof typeof SERIES; value: number }[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/15 bg-background/95 px-3 py-2 font-mono text-xs backdrop-blur-[18px]">
      {payload.map((entry) => {
        const series = SERIES[entry.dataKey];
        return (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: series.color }} />
            <span className="text-text-dim">{series.label}</span>
            <span className="text-text">{Math.round(entry.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

function ChartLegend() {
  return (
    <div className="mb-2 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
      {Object.values(SERIES).map((series) => (
        <span key={series.label} className="flex items-center gap-2">
          <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: series.color }} />
          {series.label}
        </span>
      ))}
    </div>
  );
}

export function LiveTrendChart({ sessionId }: LiveTrendChartProps) {
  const { score: postureScore } = usePostureRealtime(sessionId);
  const { score: hydrationScore } = useHydrationRealtime(sessionId);
  const { score: stressScore } = useStressRealtime(sessionId);

  // A ref (not state) for the working buffer — every incoming reading
  // mutates it directly, then a single setPoints syncs the array actually
  // handed to Recharts. Keyed by second, like CorrelationChart's own
  // mergeSeries: posture/hydration/stress each arrive on their own
  // ~1/sec cadence, not synchronized with each other, so a reading
  // landing in the same second as another reuses that point instead of
  // always creating a new sparse one.
  const bufferRef = useRef<Map<number, LivePoint>>(new Map());
  const [points, setPoints] = useState<LivePoint[]>([]);

  function commit() {
    const cutoff = Date.now() - WINDOW_MS;
    const map = bufferRef.current;
    for (const t of map.keys()) {
      if (t < cutoff) map.delete(t);
    }
    setPoints(Array.from(map.values()).sort((a, b) => a.t - b.t));
  }

  function pushReading(key: "posture" | "hydration" | "stress", value: number) {
    const bucket = Math.floor(Date.now() / 1000) * 1000;
    const existing = bufferRef.current.get(bucket) ?? { t: bucket };
    existing[key] = value;
    bufferRef.current.set(bucket, existing);
    commit();
  }

  useEffect(() => {
    if (postureScore !== null) pushReading("posture", postureScore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postureScore]);

  useEffect(() => {
    if (hydrationScore !== null) pushReading("hydration", hydrationScore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrationScore]);

  useEffect(() => {
    if (stressScore !== null) pushReading("stress", stressScore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stressScore]);

  useEffect(() => {
    const intervalId = setInterval(commit, TRIM_INTERVAL_MS);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset when the session changes, so a new session doesn't open with
  // the previous one's trailing 60 seconds still on screen.
  useEffect(() => {
    bufferRef.current = new Map();
    setPoints([]);
  }, [sessionId]);

  const now = Date.now();

  return (
    <GlassPanel className="p-8">
      <ChartLegend />
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" strokeDasharray="0" />
            <XAxis
              dataKey="t"
              type="number"
              domain={[now - WINDOW_MS, now]}
              tickFormatter={(t: number) => formatSecondsAgo(t, now)}
              tick={{ fill: "#8FA0A3", fontSize: 11, fontFamily: "var(--font-ibm-plex-mono)" }}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#8FA0A3", fontSize: 11, fontFamily: "var(--font-ibm-plex-mono)" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
            <Line
              dataKey="posture"
              stroke={SERIES.posture.color}
              strokeWidth={2}
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 2, stroke: "#0A0E12" }}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              dataKey="hydration"
              stroke={SERIES.hydration.color}
              strokeWidth={2}
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 2, stroke: "#0A0E12" }}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              dataKey="stress"
              stroke={SERIES.stress.color}
              strokeWidth={2}
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 2, stroke: "#0A0E12" }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassPanel>
  );
}
