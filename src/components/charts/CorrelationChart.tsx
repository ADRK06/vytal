"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScorePoint } from "@/lib/sessions";

interface CorrelationChartProps {
  postureData: ScorePoint[];
  hydrationData: ScorePoint[];
}

interface MergedPoint {
  t: number;
  posture?: number;
  hydration?: number;
}

const SERIES = {
  posture: { label: "Posture", color: "#FF7A59" },
  hydration: { label: "Hydration", color: "#5EEAD4" },
} as const;

// Both series report on their own independent ~1/sec cadence, so merge them
// into one timeline (rounded to the nearest second) rather than assuming
// they land on identical timestamps — Recharts needs one shared data array
// to drive a synced crosshair/tooltip across both lines.
function mergeSeries(
  postureData: ScorePoint[],
  hydrationData: ScorePoint[]
): MergedPoint[] {
  const bysecond = new Map<number, MergedPoint>();

  for (const point of postureData) {
    const t = Math.round(point.elapsedSeconds);
    const entry = bysecond.get(t) ?? { t };
    entry.posture = point.score;
    bysecond.set(t, entry);
  }

  for (const point of hydrationData) {
    const t = Math.round(point.elapsedSeconds);
    const entry = bysecond.get(t) ?? { t };
    entry.hydration = point.score;
    bysecond.set(t, entry);
  }

  return Array.from(bysecond.values()).sort((a, b) => a.t - b.t);
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: keyof typeof SERIES; value: number }[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/15 bg-background/95 px-3 py-2 font-mono text-xs backdrop-blur-[18px]">
      <div className="mb-1 text-text-dim">{formatElapsed(label ?? 0)}</div>
      {payload.map((entry) => {
        const series = SERIES[entry.dataKey];
        return (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="h-0.5 w-3 rounded-full"
              style={{ backgroundColor: series.color }}
            />
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
          <span
            className="h-0.5 w-3 rounded-full"
            style={{ backgroundColor: series.color }}
          />
          {series.label}
        </span>
      ))}
    </div>
  );
}

export function CorrelationChart({
  postureData,
  hydrationData,
}: CorrelationChartProps) {
  const data = useMemo(
    () => mergeSeries(postureData, hydrationData),
    [postureData, hydrationData]
  );

  return (
    <div className="w-full">
      <ChartLegend />
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatElapsed}
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
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#0A0E12" }}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              dataKey="hydration"
              stroke={SERIES.hydration.color}
              strokeWidth={2}
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#0A0E12" }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
