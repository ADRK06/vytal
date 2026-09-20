import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Server-only, service-role client that bypasses Row Level Security. The
// ESP32 mouse calling POST /api/ingest has no Supabase Auth session of its
// own (it's a hardware device hitting the API with no login flow), so once
// RLS is enabled (see supabase/migrations/0002_rls.sql) the regular
// user-scoped clients can't write hydration_readings on its behalf — this
// is the one place that trusts the request itself rather than a user
// session. Never import this from a Client Component: SUPABASE_SERVICE_ROLE_KEY
// must never reach the browser.
export function getSupabaseServiceClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.local.example to .env.local and fill it in."
    );
  }

  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
