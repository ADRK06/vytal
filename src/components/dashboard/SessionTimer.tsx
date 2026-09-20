"use client";

import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

interface SessionTimerProps {
  // Defaults to the moment this component mounts — a stand-in until real
  // session lifecycle (useSession, sessions.started_at) exists.
  startedAt?: number;
}

export function SessionTimer({ startedAt }: SessionTimerProps) {
  const [start] = useState(() => startedAt ?? Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [start]);

  return (
    <GlassPanel className="flex items-center justify-between px-6 py-4">
      <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
        Live session
      </span>
      <span className="font-mono text-lg text-text">
        {formatElapsed(elapsedSeconds)}
      </span>
    </GlassPanel>
  );
}
