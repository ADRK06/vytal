import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Supabase's magic link points here with a `code` query param. Exchanging
// it for a session writes the auth cookies via the server client, then we
// hand the user off to the dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    console.error("[auth/callback] No code param on callback request:", request.url);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // error.toJSON() gives {name, message, status, code} — the actual
      // reason the exchange failed (expired link, already-used code,
      // clock skew, etc.), not just the generic redirect param.
      console.error("[auth/callback] exchangeCodeForSession failed:", error.toJSON());
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }

    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (error) {
    // Covers createSupabaseServerClient() throwing (missing env config) or
    // any other unexpected failure outside the AuthError path above.
    console.error("[auth/callback] Unexpected error during code exchange:", error);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }
}
