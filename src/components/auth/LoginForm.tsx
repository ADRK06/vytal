"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GlassPanel } from "@/components/ui/GlassPanel";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setStatus(error ? "error" : "sent");
  }

  return (
    <GlassPanel className="w-full max-w-sm p-8">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-dim">
        Sign in
      </span>
      <h1 className="mt-2 font-sans text-xl font-semibold text-text">VYTAL</h1>

      {status === "sent" ? (
        <p className="mt-6 text-sm text-text-dim">
          Check <span className="text-text">{email}</span> for a sign-in link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 font-sans text-sm text-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-white/30"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-text transition-colors hover:bg-white/[0.12] disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
          {status === "error" && (
            <p className="text-sm text-posture">
              Couldn&apos;t send the link. Try again.
            </p>
          )}
        </form>
      )}
    </GlassPanel>
  );
}
