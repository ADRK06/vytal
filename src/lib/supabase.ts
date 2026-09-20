import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// TODO: type the database schema once tables stabilize.
let client: SupabaseClient | null = null;

// Lazy on purpose: importing this module must never fail just because a page
// happens to reference it (that would crash the build for every page in the
// import chain, whether or not it actually queries anything). The missing-
// env error only surfaces when something tries to actually talk to Supabase.
export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill it in."
    );
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
