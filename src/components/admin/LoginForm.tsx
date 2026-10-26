"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Mode = "password" | "link";

/**
 * Password sign-in is the everyday path: sign in once and the session cookie
 * keeps you in (Supabase refreshes it automatically). The emailed magic link
 * stays as a fallback, but it goes through Supabase's built-in mailer, which
 * only allows a few emails an hour.
 */
export default function LoginForm() {
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const supabase = supabaseBrowser();
      if (mode === "password") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setStatus("error");
          setMessage(error.message);
          return;
        }
        // Full page load on purpose: the server must see the new session cookie.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/admin";
        return;
      }
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

  const input =
    "w-full rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3 text-ink outline-none focus:ring-2 focus:ring-accent";

  return (
    <form onSubmit={submit} className="grid gap-3">
      <input
        type="email"
        required
        autoComplete="username"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={input}
        style={{ minHeight: 48 }}
      />
      {mode === "password" && (
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
          style={{ minHeight: 48 }}
        />
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="tap rounded-[var(--radius-md)] bg-accent px-5 font-bold text-white transition-colors hover:bg-accent-hi disabled:opacity-50"
      >
        {status === "sending"
          ? "Working…"
          : mode === "password"
            ? "Sign in"
            : "Email me a login link"}
      </button>
      {status === "error" && <p className="text-sm text-danger-text">{message}</p>}
      <button
        type="button"
        onClick={() => {
          setMode(mode === "password" ? "link" : "password");
          setStatus("idle");
          setMessage("");
        }}
        className="text-sm text-muted underline"
      >
        {mode === "password" ? "Email me a login link instead" : "Use a password instead"}
      </button>
    </form>
  );
}
