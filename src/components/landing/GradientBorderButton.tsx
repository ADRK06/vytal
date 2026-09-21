import Link from "next/link";
import { ReactNode } from "react";

// Soft, top/bottom-heavy glow that fades out toward the sides — VYTAL's
// teal/coral pair standing in for the plain-white gradient border this
// technique usually uses.
const BORDER_GRADIENT = [
  "radial-gradient(120% 100% at 15% 0%, rgba(94,234,212,0.75), transparent 60%)",
  "radial-gradient(120% 100% at 85% 0%, rgba(255,122,89,0.6), transparent 60%)",
  "radial-gradient(120% 100% at 85% 100%, rgba(94,234,212,0.65), transparent 60%)",
  "radial-gradient(120% 100% at 15% 100%, rgba(255,122,89,0.7), transparent 60%)",
].join(", ");

interface GradientBorderButtonProps {
  href: string;
  children: ReactNode;
}

export function GradientBorderButton({ href, children }: GradientBorderButtonProps) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center justify-center overflow-hidden rounded-full px-10 py-4 font-sans text-base font-medium text-text backdrop-blur-[44px] transition-transform duration-300 ease-out hover:scale-[1.03] active:scale-[0.98]"
      style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
    >
      {/* The gradient "ring": a full-box gradient, masked down to just the
          1.5px edge via the two-layer mask-composite trick (content-box
          minus full box = only the border remains visible). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          padding: "1.5px",
          background: BORDER_GRADIENT,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <span className="relative">{children}</span>
    </Link>
  );
}
