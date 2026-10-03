"use client";

import { useEffect, useRef, useState } from "react";
import {
  PRESETS,
  THEME_COOKIE,
  themeVars,
  type ThemeChoice,
} from "@/lib/admin-theme";

const ROOT_ID = "admin-root";
const VAR_NAMES = Object.keys(themeVars({ preset: PRESETS[0].id }));

/** Paint a choice onto the admin wrapper and remember it in a /admin-only cookie. */
function applyTheme(choice: ThemeChoice | null) {
  const el = document.getElementById(ROOT_ID);
  if (el) {
    for (const name of VAR_NAMES) el.style.removeProperty(name);
    for (const [k, v] of Object.entries(themeVars(choice))) el.style.setProperty(k, v);
  }
  const value = choice ? encodeURIComponent(JSON.stringify(choice)) : "";
  document.cookie = `${THEME_COOKIE}=${value}; path=/admin; max-age=${choice ? 31536000 : 0}; samesite=lax`;
}

export default function AdminThemePicker({ initial }: { initial: ThemeChoice | null }) {
  const [choice, setChoice] = useState<ThemeChoice | null>(initial);
  const [open, setOpen] = useState(false);
  const [accent, setAccent] = useState(initial && "custom" in initial ? initial.custom.accent : "#3f5c7e");
  const [bg, setBg] = useState(initial && "custom" in initial ? initial.custom.bg : "#0b0a09");
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: ThemeChoice | null) => {
    setChoice(next);
    applyTheme(next);
  };
  const custom = (nextAccent: string, nextBg: string) => {
    setAccent(nextAccent);
    setBg(nextBg);
    choose({ custom: { accent: nextAccent, bg: nextBg } });
  };

  const isPreset = (id: string) => choice !== null && "preset" in choice && choice.preset === id;
  const isCustom = choice !== null && "custom" in choice;

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Admin theme"
        title="Admin theme"
        className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60 text-lg transition-colors hover:border-accent"
      >
        🎨
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-[var(--radius-md)] border border-border bg-surface p-3 shadow-2xl shadow-black/40">
          <p className="text-xs text-muted">Only changes the admin, just for this browser.</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => choose(null)}
              className={`flex items-center gap-2 rounded-[var(--radius-sm)] border px-2 py-2 text-left text-sm ${choice === null ? "border-accent bg-accent/15" : "border-border hover:border-accent"}`}
            >
              <span className="text-base">✨</span> Default
            </button>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => choose({ preset: p.id })}
                aria-pressed={isPreset(p.id)}
                className={`flex items-center gap-2 rounded-[var(--radius-sm)] border px-2 py-2 text-left text-sm ${isPreset(p.id) ? "border-accent bg-accent/15" : "border-border hover:border-accent"}`}
              >
                <span
                  aria-hidden="true"
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-black/20 text-xs"
                  style={{ background: `linear-gradient(135deg, ${p.palette.base} 50%, ${p.palette.accent} 50%)` }}
                />
                <span className="truncate">
                  {p.emoji} {p.name}
                </span>
              </button>
            ))}
          </div>

          <div className={`mt-3 rounded-[var(--radius-sm)] border p-3 ${isCustom ? "border-accent bg-accent/15" : "border-border"}`}>
            <p className="text-sm font-semibold">🎛️ Make your own</p>
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-muted">
              <label className="flex flex-col gap-1">
                Background
                <input
                  type="color"
                  value={bg}
                  onChange={(e) => custom(accent, e.target.value)}
                  className="h-9 w-full cursor-pointer rounded border border-border bg-transparent"
                />
              </label>
              <label className="flex flex-col gap-1">
                Accent
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => custom(e.target.value, bg)}
                  className="h-9 w-full cursor-pointer rounded border border-border bg-transparent"
                />
              </label>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Text, cards, and borders adjust automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
