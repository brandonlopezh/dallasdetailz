"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

const ROLE_LABEL: Record<string, string> = {
  master: "Owner",
  manager: "Manager",
  editor: "Editor",
};

/** Person icon in the top bar → popover with who's signed in and a shortcut to Settings. */
export default function ProfileMenu({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-semibold hover:bg-surface-alt";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile"
        aria-expanded={open}
        aria-controls={panelId}
        className="tap grid h-11 w-11 aspect-square place-items-center rounded-full border border-border bg-surface/60 text-ink transition-colors hover:border-accent"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c.8-3.6 3.9-5.5 8-5.5s7.2 1.9 8 5.5" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-[var(--radius-lg)] border border-border bg-surface p-2 shadow-xl shadow-black/30"
        >
          <div className="border-b border-border px-3 pb-3 pt-2">
            <p className="font-[family-name:var(--font-display)] text-lg font-extrabold leading-tight">
              {user.name}
            </p>
            <p className="break-all text-sm text-muted">{user.email}</p>
            <p className="mt-2 inline-flex rounded-full border border-border bg-surface-alt px-2 py-0.5 text-xs font-semibold text-muted">
              {ROLE_LABEL[user.role] ?? user.role}
            </p>
          </div>
          <div className="mt-2 grid">
            <Link href="/admin/website" onClick={() => setOpen(false)} className={item}>
              <span aria-hidden="true">⚙️</span> Settings
            </Link>
            {user.role === "master" && (
              <Link href="/admin/users" onClick={() => setOpen(false)} className={item}>
                <span aria-hidden="true">👥</span> Manage users
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
