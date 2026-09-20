import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Use at the top of a Server Component layout that must be behind login —
// redirects to /login if there's no authenticated user, otherwise returns
// them. Fails closed: if Supabase isn't configured or the check itself
// errors, that's treated the same as "not signed in" rather than letting
// the page through or crashing with a raw 500.
export async function requireUser(): Promise<User> {
  let user: User | null = null;

  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Missing env config, network failure, etc. — fall through to redirect.
  }

  if (!user) {
    redirect("/login");
  }

  return user;
}
