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
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-6xl justify-end px-6 pt-8 sm:px-10 lg:px-16">
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
