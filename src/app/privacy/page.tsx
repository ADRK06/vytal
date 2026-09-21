import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-text-dim">
          VYTAL is a student project. A full privacy policy will live here
          before any public launch. For now: posture video is processed
          entirely in your browser and is never uploaded anywhere, and
          hydration readings are tied only to your account.
        </p>
      </GlassPanel>
    </main>
  );
}
