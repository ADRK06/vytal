import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";

export async function AppHeader() {
  let isLoggedIn = false;

  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    isLoggedIn = Boolean(data.user);
  } catch {
    isLoggedIn = false;
  }

  return (
    <header className="mx-auto flex max-w-4xl items-center justify-between px-6 pt-8 sm:px-10 lg:px-16">
      <Link
        href={isLoggedIn ? "/dashboard" : "/"}
        className="font-mono text-xs uppercase tracking-[0.2em] text-text transition-colors hover:text-text-dim"
      >
        VYTAL
      </Link>

      {isLoggedIn ? (
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
            <Link href="/dashboard" className="transition-colors hover:text-text">
              Dashboard
            </Link>
            <Link href="/sessions" className="transition-colors hover:text-text">
              History
            </Link>
            <Link href="/stats" className="transition-colors hover:text-text">
              Stats
            </Link>
          </nav>
          <SignOutButton />
        </div>
      ) : (
        <Link
          href="/login"
          className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim transition-colors hover:text-text"
        >
          Sign In
        </Link>
      )}
    </header>
  );
}
