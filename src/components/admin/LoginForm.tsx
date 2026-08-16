"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/auth/callback`,
        },
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
      } else {
        setStatus("sent");
      }
    } catch {
      setStatus("error");
      setMessage("Supabase isn't configured yet. Add env vars and try again.");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-[var(--radius-md)] border border-success/40 bg-success/10 p-4 text-sm">
        Check your email — we sent a magic link to <strong>{email}</strong>.
        Open it on this device to sign in.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3 text-ink outline-none focus:ring-2 focus:ring-accent"
        style={{ minHeight: 48 }}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="tap rounded-[var(--radius-md)] bg-accent px-5 font-bold text-white transition-colors hover:bg-accent-hi disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Email me a login link"}
      </button>
      {status === "error" && (
        <p className="text-sm text-danger">{message}</p>
      )}
    </form>
  );
}
