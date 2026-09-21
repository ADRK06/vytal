"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { passwordRequirementsErrorMessage } from "@/lib/authValidation";
import { deriveEmailForUsername, normalizeUsername, usernameFormatErrorMessage } from "@/lib/username";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PasswordRequirementsList } from "@/components/auth/PasswordRequirementsList";

type Mode = "sign-in" | "sign-up";
type Status = "idle" | "submitting";

const TAB_BASE =
  "flex-1 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wide transition-colors";
const TAB_ACTIVE = `${TAB_BASE} bg-white/[0.12] text-text`;
const TAB_INACTIVE = `${TAB_BASE} text-text-dim hover:text-text`;

const INPUT_CLASSES =
  "rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 font-sans text-sm text-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-white/30";

function validate(
  mode: Mode,
  username: string,
  password: string,
  confirmPassword: string
): string | null {
  const usernameError = usernameFormatErrorMessage(username);
  if (usernameError) return usernameError;

  if (mode === "sign-up") {
    const passwordError = passwordRequirementsErrorMessage(password);
    if (passwordError) return passwordError;
    if (password !== confirmPassword) return "Passwords don't match.";
  } else if (password.length === 0) {
    return "Enter your password.";
  }

  return null;
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setFormError(null);
    setStatus("idle");
  }

  async function handleSignIn(supabase: ReturnType<typeof createSupabaseBrowserClient>) {
    // A distinct "Username not found" needs its own check — signInWithPassword
    // alone can't tell a nonexistent username apart from a wrong password
    // (Supabase deliberately returns the same invalid_credentials for both).
    const { data: profile, error: lookupError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username_lower", normalizeUsername(username))
      .maybeSingle();

    if (lookupError) {
      setFormError("Something went wrong. Please try again.");
      setStatus("idle");
      return;
    }
    if (!profile) {
      setFormError("Username not found.");
      setStatus("idle");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: deriveEmailForUsername(username),
      password,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setStatus("idle");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleSignUp(supabase: ReturnType<typeof createSupabaseBrowserClient>) {
    // Fast client-side pre-check — avoids hitting the signup endpoint for
    // the common case. /api/auth/signup re-checks authoritatively (and
    // race-safely, via the DB's unique index) before actually creating
    // anything.
    const { data: existing, error: lookupError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username_lower", normalizeUsername(username))
      .maybeSingle();

    if (lookupError) {
      setFormError("Something went wrong. Please try again.");
      setStatus("idle");
      return;
    }
    if (existing) {
      setFormError("Username already taken.");
      setStatus("idle");
      return;
    }

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      setFormError(data.error ?? "Something went wrong. Please try again.");
      setStatus("idle");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setStatus("idle");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationError = validate(mode, username, password, confirmPassword);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setStatus("submitting");
    const supabase = createSupabaseBrowserClient();

    if (mode === "sign-in") {
      await handleSignIn(supabase);
    } else {
      await handleSignUp(supabase);
    }
  }

  return (
    <GlassPanel className="w-full max-w-sm p-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
        Account
      </span>
      <h1 className="mt-2 font-sans text-xl font-semibold text-text">VYTAL</h1>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => switchMode("sign-in")}
          className={mode === "sign-in" ? TAB_ACTIVE : TAB_INACTIVE}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => switchMode("sign-up")}
          className={mode === "sign-up" ? TAB_ACTIVE : TAB_INACTIVE}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <input
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Username"
          className={INPUT_CLASSES}
        />
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className={INPUT_CLASSES}
        />
        {mode === "sign-up" && (
          <>
            <PasswordRequirementsList password={password} />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              className={INPUT_CLASSES}
            />
          </>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-1 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text transition-colors hover:bg-white/[0.12] disabled:opacity-50"
        >
          {status === "submitting"
            ? "Please wait…"
            : mode === "sign-in"
              ? "Sign in"
              : "Sign up"}
        </button>

        {formError && <p className="text-sm text-posture">{formError}</p>}
      </form>
    </GlassPanel>
  );
}
