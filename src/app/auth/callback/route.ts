import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Supabase's magic link points here with a `code` query param. Exchanging
// it for a session writes the auth cookies via the server client, then we
// hand the user off to the dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    try {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    } catch {
      // Falls through to the error redirect below.
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
