import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Both the sign-up confirmation email and the "forgot password" reset
// email point here with a `code` query param (PKCE) — exchanging it for a
// session writes the auth cookies via the server client. A `next` param
// says where to send the user afterward: password reset sets it to
// /reset-password (see ForgotPasswordForm), confirmation leaves it unset
// and falls back to /dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Only allow a relative in-app path — guards against `next` being used
  // for an open redirect (e.g. "//evil.com").
  const rawNext = searchParams.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

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

    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    // Covers createSupabaseServerClient() throwing (missing env config) or
    // any other unexpected failure outside the AuthError path above.
    console.error("[auth/callback] Unexpected error during code exchange:", error);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }
}
