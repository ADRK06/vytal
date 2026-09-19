import { HTMLAttributes } from "react";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {}

export function GlassPanel({ className = "", children, ...props }: GlassPanelProps) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.055] backdrop-blur-[18px] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
