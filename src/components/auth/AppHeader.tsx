import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

export function AppHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8 sm:px-10 lg:px-16">
      <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
        <Link href="/dashboard" className="transition-colors hover:text-text">
          Dashboard
        </Link>
        <Link href="/sessions" className="transition-colors hover:text-text">
          History
        </Link>
      </nav>
      <SignOutButton />
    </header>
  );
}
