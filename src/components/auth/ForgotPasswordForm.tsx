"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { isValidEmail } from "@/lib/authValidation";
import { GlassPanel } from "@/components/ui/GlassPanel";

type Status = "idle" | "submitting" | "sent";

const INPUT_CLASSES =
  "rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 font-sans text-sm text-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-white/30";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    setFormError(null);
    setStatus("submitting");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setStatus("idle");
      return;
    }

    setStatus("sent");
  }

  return (
    <GlassPanel className="w-full max-w-sm p-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
        Reset password
      </span>
      <h1 className="mt-2 font-sans text-xl font-semibold text-text">VYTAL</h1>

      {status === "sent" ? (
        // Deliberately doesn't confirm whether the email is registered —
        // matches Supabase's own privacy-preserving behavior here.
        <p className="mt-6 text-sm text-text-dim">
          If an account exists for <span className="text-text">{email}</span>,
          we&apos;ve sent a link to reset the password.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <p className="text-sm text-text-dim">
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </p>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={INPUT_CLASSES}
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text transition-colors hover:bg-white/[0.12] disabled:opacity-50"
          >
            {status === "submitting" ? "Sending…" : "Send reset link"}
          </button>
          {formError && <p className="text-sm text-posture">{formError}</p>}
        </form>
      )}
    </GlassPanel>
  );
}
