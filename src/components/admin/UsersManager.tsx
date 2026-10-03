"use client";

import { useState } from "react";

export interface UserRow {
  email: string;
  role: "manager" | "editor";
  created_at: string;
}

const ROLE_LABEL = {
  manager: "Manager — everything except Users",
  editor: "Editor — Website Edits only",
} as const;

const input = "w-full rounded-[var(--radius-sm)] border border-border bg-base px-3 py-2 text-sm";

export default function UsersManager({
  masters,
  me,
  users: initial,
  setupError,
}: {
  masters: string[];
  me: string;
  users: UserRow[];
  setupError: string | null;
}) {
  const [users, setUsers] = useState(initial);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRow["role"]>("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (method: "POST" | "DELETE", body: object) => {
    const res = await fetch("/api/admin/users", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Something went wrong");
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const clean = email.trim().toLowerCase();
      await call("POST", { email: clean, role });
      setUsers((u) => [
        ...u.filter((x) => x.email !== clean),
        { email: clean, role, created_at: new Date().toISOString() },
      ]);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (target: string) => {
    if (!confirm(`Remove access for ${target}?`)) return;
    setError(null);
    try {
      await call("DELETE", { email: target });
      setUsers((u) => u.filter((x) => x.email !== target));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="space-y-8">
      {setupError && (
        <p className="rounded-[var(--radius-md)] border border-warning/50 bg-warning/10 p-3 text-sm">
          {setupError}
        </p>
      )}

      <section>
        <h2 className="font-bold">Add a user</h2>
        <form onSubmit={add} className="mt-3 grid gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-4 sm:grid-cols-[1fr_auto]">
          <input
            type="email"
            required
            className={input}
            placeholder="their@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy || !!setupError}
            className="tap rounded-[var(--radius-sm)] bg-accent px-6 font-bold text-white hover:bg-accent-hi disabled:opacity-40"
          >
            {busy ? "Adding…" : "Add"}
          </button>
          <select className={input + " sm:col-span-2"} value={role} onChange={(e) => setRole(e.target.value as UserRow["role"])}>
            {(Object.keys(ROLE_LABEL) as UserRow["role"][]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </form>
        <p className="mt-2 text-xs text-muted">
          After you add them, tell them to go to /admin/login and enter that email to get their sign-in link.
        </p>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </section>

      <section>
        <h2 className="font-bold">Who has access</h2>
        <ul className="mt-3 space-y-2">
          {masters.map((m) => (
            <li key={m} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3">
              <span className="min-w-0 truncate text-sm font-semibold">
                {m}
                {m === me.toLowerCase() && <span className="ml-2 text-xs font-normal text-muted">(you)</span>}
              </span>
              <span className="shrink-0 rounded-full border border-accent px-2 py-0.5 text-xs text-accent-hi">Master</span>
            </li>
          ))}
          {users.map((u) => (
            <li key={u.email} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3">
              <span className="min-w-0 truncate text-sm">{u.email}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                  {u.role === "manager" ? "Manager" : "Editor"}
                </span>
                <button type="button" onClick={() => remove(u.email)} className="text-xs text-danger underline">
                  Remove
                </button>
              </span>
            </li>
          ))}
          {users.length === 0 && <li className="text-sm text-muted">No other users yet.</li>}
        </ul>
        <p className="mt-2 text-xs text-muted">
          Master accounts come from the ADMIN_EMAILS setting and can&apos;t be removed here.
        </p>
      </section>
    </div>
  );
}
