import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/EmptyState";

// A valid reset link lands here already carrying a session — the code
// exchange happened in /auth/callback just before this. No session means
// the link was invalid, expired, or already used.
export default async function ResetPasswordPage() {
  let hasSession = false;

  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    hasSession = Boolean(data.user);
  } catch {
    hasSession = false;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      {hasSession ? (
        <ResetPasswordForm />
      ) : (
        <GlassPanel className="w-full max-w-sm p-8">
          <EmptyState message="This reset link is invalid or has expired." />
          <Link
            href="/forgot-password"
            className="mt-4 inline-block font-mono text-xs uppercase tracking-wide text-text-dim transition-colors hover:text-text"
          >
            Request a new link
          </Link>
        </GlassPanel>
      )}
    </main>
  );
}
