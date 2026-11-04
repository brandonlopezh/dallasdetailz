"use client";

import { useState } from "react";

export interface UserRow {
  email: string;
  role: "master" | "manager" | "editor";
  created_at: string;
}

const ROLE_LABEL = {
  master: "Master — everything, including managing users",
  manager: "Manager — everything except Users",
  editor: "Editor — Settings only",
} as const;

const input = "w-full rounded-[var(--radius-sm)] border border-border bg-base px-3 py-2 text-sm";

export default function UsersManager({
  masters,
  me,
  users: initial,
  names: initialNames,
  setupError,
}: {
  masters: string[];
  me: string;
  users: UserRow[];
  names: Record<string, { first: string; last: string }>;
  setupError: string | null;
}) {
  const [users, setUsers] = useState(initial);
  const [names, setNames] = useState(initialNames);
  const [editing, setEditing] = useState<string | null>(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRow["role"]>("manager");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (method: "POST" | "PUT" | "DELETE" | "PATCH", body: object) => {
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
      await call("POST", {
        email: clean,
        role,
        password: password || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setNames((n) => ({ ...n, [clean]: { first: firstName.trim(), last: lastName.trim() } }));
      setUsers((u) => [
        ...u.filter((x) => x.email !== clean),
        { email: clean, role, created_at: new Date().toISOString() },
      ]);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (target: string) => {
    setEditing(target);
    setEditFirst(names[target]?.first ?? "");
    setEditLast(names[target]?.last ?? "");
  };

  const saveName = async (target: string) => {
    setError(null);
    try {
      await call("PATCH", { email: target, firstName: editFirst.trim(), lastName: editLast.trim() });
      setNames((n) => ({ ...n, [target]: { first: editFirst.trim(), last: editLast.trim() } }));
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  const fullName = (target: string) =>
    [names[target]?.first, names[target]?.last].filter(Boolean).join(" ");

  /** Name line + inline editor shown inside a user row. */
  const nameBlock = (target: string, suffix?: React.ReactNode) =>
    editing === target ? (
      <span className="grid w-full gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input className={input} placeholder="First name" aria-label="First name" value={editFirst} onChange={(e) => setEditFirst(e.target.value)} />
        <input className={input} placeholder="Last name" aria-label="Last name" value={editLast} onChange={(e) => setEditLast(e.target.value)} />
        <button type="button" onClick={() => saveName(target)} className="tap rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-bold text-white">
          Save
        </button>
        <button type="button" onClick={() => setEditing(null)} className="tap rounded-[var(--radius-sm)] border border-border px-4 text-sm">
          Cancel
        </button>
      </span>
    ) : (
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">
          {fullName(target) || <span className="font-normal text-muted">No name yet</span>}
          {suffix}
        </span>
        <span className="block break-all text-xs text-muted">{target}</span>
      </span>
    );

  const resetPassword = async (target: string) => {
    const next = prompt(`New password for ${target} (at least 8 characters):`);
    if (!next) return;
    setError(null);
    try {
      await call("PUT", { email: target, password: next });
      alert(`Password updated. ${target} can sign in with it now.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
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
        <form onSubmit={add} className="mt-3 grid grid-cols-1 gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-sm shadow-black/5 sm:p-5 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <input
            type="text"
            required
            autoComplete="off"
            className={input}
            placeholder="First name"
            aria-label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type="text"
            autoComplete="off"
            className={input}
            placeholder="Last name"
            aria-label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          </div>
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
          <input
            type="text"
            autoComplete="off"
            className={input + " sm:col-span-2"}
            placeholder="Password for them (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select className={input + " sm:col-span-2"} value={role} onChange={(e) => setRole(e.target.value as UserRow["role"])}>
            {(Object.keys(ROLE_LABEL) as UserRow["role"][]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </form>
        <p className="mt-2 text-xs text-muted">
          That&apos;s all it takes — they can sign in at /admin/login with their email and this password right away, and
          stay signed in on their device. Leave the password blank to have them use the emailed link instead.
        </p>
        {error && <p className="mt-2 text-sm text-danger-text">{error}</p>}
      </section>

      <section>
        <h2 className="font-bold">Who has access</h2>
        <ul className="mt-3 space-y-2">
          {masters.map((m) => (
            <li key={m} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3">
              {nameBlock(m, m === me.toLowerCase() ? <span className="ml-2 text-xs font-normal text-muted">(you)</span> : undefined)}
              <span className="flex shrink-0 items-center gap-3">
                {editing !== m && (
                  <button type="button" onClick={() => startEdit(m)} className="text-xs text-link underline">
                    Edit name
                  </button>
                )}
                {m === me.toLowerCase() && (
                  <button type="button" onClick={() => resetPassword(m)} className="text-xs text-link underline">
                    Set password
                  </button>
                )}
                <span className="rounded-full border border-accent px-2 py-0.5 text-xs text-link">Master</span>
              </span>
            </li>
          ))}
          {users.map((u) => (
            <li key={u.email} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3">
              {nameBlock(u.email)}
              <span className="flex shrink-0 items-center gap-3">
                {editing !== u.email && (
                  <button type="button" onClick={() => startEdit(u.email)} className="text-xs text-link underline">
                    Edit name
                  </button>
                )}
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                  {u.role === "master" ? "Master" : u.role === "manager" ? "Manager" : "Editor"}
                </span>
                <button type="button" onClick={() => resetPassword(u.email)} className="text-xs text-link underline">
                  Set password
                </button>
                <button type="button" onClick={() => remove(u.email)} className="text-xs text-danger-text underline">
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
