"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { passwordRequirementsErrorMessage } from "@/lib/authValidation";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PasswordRequirementsList } from "@/components/auth/PasswordRequirementsList";

type Status = "idle" | "submitting" | "done";

const INPUT_CLASSES =
  "rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 font-sans text-sm text-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-white/30";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const passwordError = passwordRequirementsErrorMessage(password);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords don't match.");
      return;
    }

    setFormError(null);
    setStatus("submitting");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setStatus("idle");
      return;
    }

    setStatus("done");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  }

  return (
    <GlassPanel className="w-full max-w-sm p-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
        Set new password
      </span>
      <h1 className="mt-2 font-sans text-xl font-semibold text-text">VYTAL</h1>

      {status === "done" ? (
        <p className="mt-6 text-sm text-text-dim">
          Password updated. Taking you to the dashboard…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            className={INPUT_CLASSES}
          />
          <PasswordRequirementsList password={password} />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            className={INPUT_CLASSES}
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text transition-colors hover:bg-white/[0.12] disabled:opacity-50"
          >
            {status === "submitting" ? "Updating…" : "Update password"}
          </button>
          {formError && <p className="text-sm text-posture">{formError}</p>}
        </form>
      )}
    </GlassPanel>
  );
}
