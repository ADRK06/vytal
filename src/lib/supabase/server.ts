import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.local.example to .env.local and fill it in.`
    );
  }
  return value;
}

// For use in Server Components, Route Handlers, and layouts — reads the auth
// session from cookies so gating (dashboard/session-history layouts) and
// RLS-scoped queries (lib/sessions.ts) see the same session the browser
// client set. Cookie writes are wrapped in a try/catch: a plain Server
// Component render can't set cookies (only Server Actions, Route Handlers,
// and middleware can), and middleware.ts is what actually keeps the session
// refreshed — this client just needs to read it correctly.
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore as long as
            // middleware.ts is refreshing the session on this request.
          }
        },
      },
    }
  );
}
