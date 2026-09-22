"use client";

import { useEffect, useRef } from "react";
import type { DailyStressPoint } from "@/lib/sessions";

interface StressCalendarProps {
  days: DailyStressPoint[];
}

interface Cell {
  date: string;
  dayOfWeek: number;
  isFuture: boolean;
}

const WEEKS = 53;
const TOTAL_DAYS = WEEKS * 7;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// GitHub-contributions-style grid: full week columns, most recent week on
// the right. Built out to the Saturday of the current week (not just
// today) so the grid always ends on a complete column — the cells past
// today within that final week render as invisible placeholders, not
// "no data" gray, since a future day isn't the same thing as an empty one.
function buildCells(): Cell[] {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const endDate = new Date(today);
  endDate.setUTCDate(endDate.getUTCDate() + (6 - endDate.getUTCDay()));

  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - (TOTAL_DAYS - 1));

  const cells: Cell[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    cells.push({
      date: toDateKey(cursor),
      dayOfWeek: cursor.getUTCDay(),
      isFuture: cursor > today,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return cells;
}

function colorClassFor(point: DailyStressPoint | undefined, isFuture: boolean): string {
  if (isFuture) return "opacity-0";
  if (!point) return "bg-white/[0.06]";
  if (point.avgScore < 25) return "bg-stress/25";
  if (point.avgScore < 50) return "bg-stress/45";
  if (point.avgScore < 75) return "bg-stress/70";
  return "bg-stress";
}

function formatCellDate(dateKey: string): string {
  // Parsed as UTC noon (not midnight) so no local timezone can roll it
  // back to the previous day when formatting for display.
  return new Date(`${dateKey}T12:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StressCalendar({ days }: StressCalendarProps) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const cells = buildCells();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 53 weeks is wider than the panel on most viewports, and a fresh
  // overflow-x-auto container starts scrolled to its left edge — without
  // this, the most recent (rightmost, most useful) week is hidden off
  // screen by default, which defeats the point of showing it at the right.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div ref={scrollRef} className="overflow-x-auto pb-2">
        <div className="flex gap-1">
          <div className="grid grid-rows-7 gap-1 pr-1">
            {DAY_LABELS.map((label, index) => (
              <span
                key={label}
                className="flex h-3 w-7 items-center font-mono text-[9px] uppercase text-text-dim"
              >
                {index % 2 === 1 ? label.slice(0, 1) : ""}
              </span>
            ))}
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {cells.map((cell) => {
              const point = byDate.get(cell.date);
              return (
                <div
                  key={cell.date}
                  title={
                    cell.isFuture
                      ? undefined
                      : point
                        ? `${formatCellDate(cell.date)} — avg stress ${point.avgScore}`
                        : `${formatCellDate(cell.date)} — no sessions`
                  }
                  className={`h-3 w-3 rounded-sm ${colorClassFor(point, cell.isFuture)}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs text-text-dim">
        <span>Less</span>
        <span className="h-3 w-3 rounded-sm bg-white/[0.06]" />
        <span className="h-3 w-3 rounded-sm bg-stress/25" />
        <span className="h-3 w-3 rounded-sm bg-stress/45" />
        <span className="h-3 w-3 rounded-sm bg-stress/70" />
        <span className="h-3 w-3 rounded-sm bg-stress" />
        <span>More</span>
      </div>
    </div>
  );
}
