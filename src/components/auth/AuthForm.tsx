"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { isValidEmail, isValidPassword, PASSWORD_MIN_LENGTH } from "@/lib/authValidation";
import { GlassPanel } from "@/components/ui/GlassPanel";

type Mode = "sign-in" | "sign-up";
type Status = "idle" | "submitting" | "check-email";

const TAB_BASE =
  "flex-1 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wide transition-colors";
const TAB_ACTIVE = `${TAB_BASE} bg-white/[0.12] text-text`;
const TAB_INACTIVE = `${TAB_BASE} text-text-dim hover:text-text`;

const INPUT_CLASSES =
  "rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 font-sans text-sm text-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-white/30";

function validate(
  mode: Mode,
  email: string,
  password: string,
  confirmPassword: string
): string | null {
  if (!isValidEmail(email)) return "Enter a valid email address.";

  if (mode === "sign-up") {
    if (!isValidPassword(password)) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (password !== confirmPassword) return "Passwords don't match.";
  } else if (password.length === 0) {
    return "Enter your password.";
  }

  return null;
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validationError = validate(mode, email, password, confirmPassword);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setStatus("submitting");
    const supabase = createSupabaseBrowserClient();

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setFormError(getAuthErrorMessage(error));
        setStatus("idle");
        return;
      }
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setStatus("idle");
      return;
    }

    // Supabase returns a "success" response with an empty identities array
    // for a sign-up against an already-registered, already-confirmed email
    // — deliberate anti-enumeration behavior, not a real new account.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setFormError("An account with this email already exists. Try signing in instead.");
      setStatus("idle");
      return;
    }

    // If email confirmation is off for this project, signUp() logs the
    // user in immediately and returns a session.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setStatus("check-email");
  }

  return (
    <GlassPanel className="w-full max-w-sm p-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
        Account
      </span>
      <h1 className="mt-2 font-sans text-xl font-semibold text-text">VYTAL</h1>

      {status === "check-email" ? (
        <p className="mt-6 text-sm text-text-dim">
          Check <span className="text-text">{email}</span> to confirm your
          account, then sign in.
        </p>
      ) : (
        <>
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
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
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
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                className={INPUT_CLASSES}
              />
            )}

            {mode === "sign-in" && (
              <Link
                href="/forgot-password"
                className="self-end font-mono text-xs text-text-dim transition-colors hover:text-text"
              >
                Forgot password?
              </Link>
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
        </>
      )}
    </GlassPanel>
  );
}
