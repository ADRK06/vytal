import { createBrowserClient } from "@supabase/ssr";

// TODO: type the database schema once tables stabilize.

// For use in Client Components. Reads/writes the auth session via cookies
// (through @supabase/ssr) so the server-side client in lib/supabase/server.ts
// sees the same session — needed for the dashboard/session-history gates to
// work without a flash of unauthenticated content.
//
// NEXT_PUBLIC_* vars must be referenced as literal `process.env.NEXT_PUBLIC_X`
// expressions here, not through a helper that does `process.env[name]` —
// Next.js inlines client-bundle env vars via static textual replacement at
// build time, so a dynamic/bracket lookup silently resolves to undefined in
// the browser no matter what .env.local actually has.
export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill it in."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
