import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { isValidPassword } from "@/lib/authValidation";
import { deriveEmailForUsername, isValidUsernameFormat, normalizeUsername } from "@/lib/username";

// Runs the username-taken check and account creation together, server-side,
// for two reasons a purely client-side signUp() call can't cover:
//
// 1. Atomicity — the availability check and the creation need to happen
//    together to be race-safe (two people signing up with the same
//    username at once); the unique index on profiles.username_lower is
//    the final backstop either way.
// 2. This project's derived emails (username@vytal.local) can never
//    receive a real confirmation email, so accounts are created via the
//    admin API with email_confirm: true — bypassing whatever the Supabase
//    project's "Confirm email" setting is, which we have no control over
//    from application code.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { username, password } = (typeof body === "object" && body !== null ? body : {}) as Record<
    string,
    unknown
  >;

  if (typeof username !== "string" || !isValidUsernameFormat(username)) {
    return NextResponse.json({ error: "Invalid username." }, { status: 400 });
  }
  if (typeof password !== "string" || !isValidPassword(password)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceClient();

    const { data: existing, error: lookupError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username_lower", normalizeUsername(username))
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (existing) {
      return NextResponse.json({ error: "Username already taken." }, { status: 409 });
    }

    const email = deriveEmailForUsername(username);
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      // Supabase's own email-uniqueness constraint, as a last-resort
      // safety net if two signups for the same username raced past the
      // check above.
      if (createError?.code === "email_exists") {
        return NextResponse.json({ error: "Username already taken." }, { status: 409 });
      }
      throw createError ?? new Error("User creation returned no user");
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ user_id: created.user.id, username });

    if (profileError) {
      // Don't leave an orphaned auth user with no profile behind.
      await supabase.auth.admin.deleteUser(created.user.id);
      if (profileError.code === "23505") {
        return NextResponse.json({ error: "Username already taken." }, { status: 409 });
      }
      throw profileError;
    }

    return NextResponse.json({ ok: true, email }, { status: 201 });
  } catch (error) {
    console.error("[api/auth/signup] Failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
