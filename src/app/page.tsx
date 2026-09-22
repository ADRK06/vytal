import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureHighlights } from "@/components/landing/FeatureHighlights";
import { ClosingCTA } from "@/components/landing/ClosingCTA";

export default async function HomePage() {
  let isLoggedIn = false;

  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    isLoggedIn = Boolean(data.user);
  } catch {
    isLoggedIn = false;
  }

  return (
    <main className="relative min-h-screen">
      {/* See .grain-overlay in globals.css — fixed so it covers the
          viewport rather than scrolling with content, pointer-events-none
          so it never intercepts clicks. */}
      <div aria-hidden className="grain-overlay pointer-events-none fixed inset-0 z-[999]" />

      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8 sm:px-10 lg:px-16">
        <span className="wordmark-shimmer font-mono text-xs font-semibold uppercase tracking-[0.2em]">
          VYTAL
        </span>
        <Link
          href={isLoggedIn ? "/dashboard" : "/login"}
          className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim transition-colors hover:text-text"
        >
          {isLoggedIn ? "Dashboard" : "Sign In"}
        </Link>
      </div>
      <Hero isLoggedIn={isLoggedIn} />
      <HowItWorks />
      <FeatureHighlights />
      <ClosingCTA isLoggedIn={isLoggedIn} />
    </main>
  );
}
