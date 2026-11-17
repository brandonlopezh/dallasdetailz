"use client";

import { useState } from "react";

const input =
  "w-full rounded-[var(--radius-sm)] border border-border bg-base px-3 py-2 text-sm";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Settings panel: the email addresses that get a message (with a link to
 * accept or decline) every time a customer sends a booking request. Saves on
 * its own, separate from the website-content Save bar.
 */
export default function NotifyEmails({
  initial,
  saved: initiallySaved,
  needsSetup,
  max,
}: {
  initial: string[];
  /** False while the list is still the built-in fallback (nothing saved yet). */
  saved: boolean;
  needsSetup: boolean;
  max: number;
}) {
  const [emails, setEmails] = useState(initial);
  const [savedList, setSavedList] = useState(initiallySaved ? initial : null);
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(emails) !== JSON.stringify(savedList);

  const add = () => {
    const e = draft.trim().toLowerCase();
    if (!e) return;
    if (!EMAIL_RE.test(e)) return setError("That email doesn't look right.");
    if (emails.includes(e)) return setError("That email is already on the list.");
    if (emails.length >= max) return setError(`${max} emails max.`);
    setError(null);
    setDraft("");
    setEmails([...emails, e]);
    setState("idle");
  };

  const save = async () => {
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/notify-emails", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setEmails(data.emails);
      setSavedList(data.emails);
      setState("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setState("idle");
    }
  };

  return (
    <div>
      <h2 className="font-bold">Request emails</h2>
      <p className="mt-1 text-xs text-muted">
        Everyone on this list gets an email when a customer asks for a booking, with a link to accept
        or decline it. Each person needs their own admin login to open that link.
      </p>

      {needsSetup && (
        <p className="mt-3 rounded-[var(--radius-sm)] border border-warning/40 bg-warning/10 p-3 text-sm text-warning-text">
          One-time setup needed before this can be saved: run the 0015_admin_settings.sql migration in
          Supabase.
        </p>
      )}

      <div className="mt-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-5">
        <ul className="space-y-2">
          {emails.map((e) => (
            <li
              key={e}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-base px-3 py-2"
            >
              <span className="min-w-0 flex-1 break-all text-sm font-semibold">{e}</span>
              <button
                type="button"
                aria-label={`Remove ${e}`}
                disabled={emails.length === 1}
                title={emails.length === 1 ? "Keep at least one email" : undefined}
                onClick={() => {
                  setEmails(emails.filter((x) => x !== e));
                  setState("idle");
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-border text-sm text-danger-text hover:border-accent disabled:opacity-30"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <input
            type="email"
            inputMode="email"
            autoComplete="off"
            aria-label="Add an email"
            placeholder="name@example.com"
            className={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button
            type="button"
            onClick={add}
            className="shrink-0 rounded-[var(--radius-sm)] border border-border px-4 text-sm font-semibold hover:border-accent"
          >
            Add
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="min-w-0 text-sm" role="status">
            {error ? (
              <span className="text-danger-text">{error}</span>
            ) : state === "saved" ? (
              <span className="text-success-text">Saved. New requests go to this list.</span>
            ) : savedList === null ? (
              <span className="text-muted">Not saved yet. This is the starting address; hit Save to confirm.</span>
            ) : dirty ? (
              <span className="text-muted">Unsaved changes</span>
            ) : (
              <span className="text-muted">No changes</span>
            )}
          </p>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || state === "saving" || emails.length === 0}
            className="tap rounded-[var(--radius-sm)] bg-accent px-6 font-bold text-white transition-colors hover:bg-accent-hi disabled:opacity-40"
          >
            {state === "saving" ? "Saving…" : "Save emails"}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        Emails are sent through Resend. Until a sending domain is verified there, Resend only delivers
        to the address that owns the Resend account, so extra addresses may not arrive until that is
        done.
      </p>
    </div>
  );
}
