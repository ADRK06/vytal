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
import type { SessionSummary } from "@/lib/sessions";

interface SessionTrendChartProps {
  // Completed sessions, oldest first (most recent on the right).
  sessions: SessionSummary[];
}

interface TrendPoint {
  startedAt: string;
  label: string;
  posture?: number;
  hydration?: number;
  stress?: number;
}

const SERIES = {
  posture: { label: "Posture", color: "#FF7A59" },
  hydration: { label: "Hydration", color: "#5EEAD4" },
  stress: { label: "Stress", color: "#A78BFA" },
} as const;

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toTrendPoints(sessions: SessionSummary[]): TrendPoint[] {
  return sessions.map((session) => ({
    startedAt: session.startedAt,
    label: formatShortDate(session.startedAt),
    posture: session.avgPostureScore ?? undefined,
    hydration: session.avgHydrationScore ?? undefined,
    stress: session.avgStressScore ?? undefined,
  }));
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { dataKey: keyof typeof SERIES; value: number; payload: TrendPoint }[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/15 bg-background/95 px-3 py-2 font-mono text-xs backdrop-blur-[18px]">
      <div className="mb-1 text-text-dim">
        {formatFullDate(payload[0].payload.startedAt)}
      </div>
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

export function SessionTrendChart({ sessions }: SessionTrendChartProps) {
  const data = useMemo(() => toTrendPoints(sessions), [sessions]);

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
              dataKey="label"
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
              dot={{ r: 3, strokeWidth: 0, fill: SERIES.posture.color }}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#0A0E12" }}
              connectNulls
              isAnimationActive
              animationDuration={1100}
              animationEasing="ease-out"
            />
            <Line
              dataKey="hydration"
              stroke={SERIES.hydration.color}
              strokeWidth={2}
              strokeLinecap="round"
              dot={{ r: 3, strokeWidth: 0, fill: SERIES.hydration.color }}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#0A0E12" }}
              connectNulls
              isAnimationActive
              animationDuration={1100}
              animationEasing="ease-out"
            />
            <Line
              dataKey="stress"
              stroke={SERIES.stress.color}
              strokeWidth={2}
              strokeLinecap="round"
              dot={{ r: 3, strokeWidth: 0, fill: SERIES.stress.color }}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#0A0E12" }}
              connectNulls
              isAnimationActive
              animationDuration={1100}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
