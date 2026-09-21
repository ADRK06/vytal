import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/auth/AuthForm";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function LoginPage() {
  let configError = false;
  let alreadySignedIn = false;

  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    alreadySignedIn = Boolean(data.user);
  } catch {
    // Login must stay reachable even when Supabase isn't configured yet —
    // every other gated page redirects here, so this can't also crash.
    configError = true;
  }

  if (alreadySignedIn) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      {configError ? (
        <GlassPanel className="w-full max-w-sm p-8">
          <EmptyState message="Supabase isn't configured. Check your environment variables." />
        </GlassPanel>
      ) : (
        <AuthForm />
      )}
    </main>
  );
}
