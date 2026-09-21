import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";
import { GradientBorderButton } from "./GradientBorderButton";

interface ClosingCTAProps {
  isLoggedIn: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();

export function ClosingCTA({ isLoggedIn }: ClosingCTAProps) {
  const ctaHref = isLoggedIn ? "/dashboard" : "/login";

  return (
    <section className="relative overflow-hidden py-32">
      {/* Ambient gradient blobs — no video asset, so the "cinematic"
          background is a slow, purely-CSS drift rather than Framer Motion,
          since it's continuous and never tied to scroll position. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div
          className="absolute left-[10%] top-[-10%] h-[420px] w-[420px] rounded-full bg-hydration/25 blur-[110px]"
          style={{ animation: "blob-drift 22s ease-in-out infinite" }}
        />
        <div
          className="absolute right-[8%] top-[10%] h-[380px] w-[380px] rounded-full bg-posture/20 blur-[110px]"
          style={{ animation: "blob-drift 26s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute bottom-[-15%] left-[35%] h-[460px] w-[460px] rounded-full bg-posture/15 blur-[130px]"
          style={{ animation: "blob-drift 30s ease-in-out infinite" }}
        />
      </div>

      {/* Fade edges so the section blends into whatever sits above/below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-background to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-background to-transparent"
      />

      <ScrollReveal className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 text-center sm:px-10 lg:px-16">
        <h2 className="font-sans text-4xl font-semibold leading-tight text-text sm:text-5xl">
          Sit better. Drink more.{" "}
          <span className="text-posture">See</span> the{" "}
          <span className="text-hydration">difference</span>.
        </h2>
        <p className="max-w-md font-sans text-base text-text-dim sm:text-lg">
          Free to start. All you need is a webcam and a VYTAL sensing mouse.
        </p>
        <GradientBorderButton href={ctaHref}>
          {isLoggedIn ? "Go to dashboard" : "Get started free"}
        </GradientBorderButton>
      </ScrollReveal>

      <footer className="relative mx-auto mt-32 flex max-w-6xl flex-col items-center gap-3 px-6 font-mono text-xs uppercase tracking-[0.2em] text-text-dim sm:flex-row sm:justify-between sm:px-10 lg:px-16">
        <span>© {CURRENT_YEAR} VYTAL</span>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="transition-colors hover:text-text">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-text">
            Terms
          </Link>
        </div>
      </footer>
    </section>
  );
}
