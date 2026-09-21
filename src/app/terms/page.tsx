import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 sm:px-10 lg:px-16">
      <Link
        href="/"
        className="mb-4 inline-block self-start font-mono text-xs uppercase tracking-[0.2em] text-text-dim transition-colors hover:text-text"
      >
        ← Back to home
      </Link>
      <GlassPanel className="w-full p-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
          Legal
        </span>
        <h1 className="mt-2 font-sans text-xl font-semibold text-text">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-text-dim">
          VYTAL is a student project built for coursework. Formal terms of
          service will go here before any public launch.
        </p>
      </GlassPanel>
    </main>
  );
}
