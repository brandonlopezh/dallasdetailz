// Admin-only color themes. Applied as CSS variable overrides on the admin
// wrapper element (see (dash)/layout.tsx), so the public site is untouched.
// The choice lives in a cookie scoped to /admin: the server can render the
// themed wrapper on first paint (no flash) and public pages never receive it.

export const THEME_COOKIE = "dd-admin-theme";

export type ThemeChoice =
  | { preset: string }
  | { custom: { accent: string; bg: string } };

interface Palette {
  base: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  ink: string;
  muted: string;
  accent: string;
  accentHi: string;
  scheme: "light" | "dark";
}

export const PRESETS: { id: string; name: string; emoji: string; palette: Palette }[] = [
  {
    id: "midnight",
    name: "Midnight",
    emoji: "🌌",
    palette: { base: "#0a1020", surface: "#111a30", surfaceAlt: "#1a2644", border: "#26345a", ink: "#e8efff", muted: "#8d9bc0", accent: "#2f6fe0", accentHi: "#5b9bff", scheme: "dark" },
  },
  {
    id: "sunset",
    name: "Sunset",
    emoji: "🌅",
    palette: { base: "#1a0f1f", surface: "#26152d", surfaceAlt: "#351d3d", border: "#4a2a52", ink: "#fff1e6", muted: "#c4a1b5", accent: "#e0592a", accentHi: "#ff8a4c", scheme: "dark" },
  },
  {
    id: "forest",
    name: "Forest",
    emoji: "🌲",
    palette: { base: "#0c1a12", surface: "#12261a", surfaceAlt: "#1a3524", border: "#2a4a34", ink: "#eaf5e6", muted: "#96b59b", accent: "#3f9a4a", accentHi: "#7ed36a", scheme: "dark" },
  },
  {
    id: "terminal",
    name: "Terminal",
    emoji: "💾",
    palette: { base: "#000000", surface: "#07110a", surfaceAlt: "#0d1f12", border: "#14361c", ink: "#b6ffb0", muted: "#5fa066", accent: "#1f9d3a", accentHi: "#39ff6a", scheme: "dark" },
  },
  {
    id: "cowboys",
    name: "Big D",
    emoji: "⭐",
    palette: { base: "#0b1426", surface: "#111d36", surfaceAlt: "#1a2a4d", border: "#2b3d66", ink: "#e9edf5", muted: "#9aa7bf", accent: "#3b5fa8", accentHi: "#b7c3d9", scheme: "dark" },
  },
  {
    id: "bubblegum",
    name: "Bubblegum",
    emoji: "🍬",
    palette: { base: "#fff0f6", surface: "#ffffff", surfaceAlt: "#ffe0ee", border: "#f7c0d8", ink: "#3a1428", muted: "#8a5a73", accent: "#d6336c", accentHi: "#b02558", scheme: "light" },
  },
  {
    id: "ocean",
    name: "Ocean",
    emoji: "🌊",
    palette: { base: "#eef8fb", surface: "#ffffff", surfaceAlt: "#dff0f6", border: "#bfdde8", ink: "#0e2a35", muted: "#4f7585", accent: "#0e8aa8", accentHi: "#0a6a82", scheme: "light" },
  },
  {
    id: "lavender",
    name: "Lavender",
    emoji: "💜",
    palette: { base: "#f5f1fb", surface: "#ffffff", surfaceAlt: "#ebe3f7", border: "#d6c8ee", ink: "#231a38", muted: "#6c5f8a", accent: "#7048c7", accentHi: "#5634a3", scheme: "light" },
  },
];

// --- color math ------------------------------------------------------------

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (v: unknown): v is string => typeof v === "string" && HEX.test(v);

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h =
    max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

function luminance(hex: string): number {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Text color for buttons filled with `accent`: whichever of white/near-black reads better. */
export function onAccent(accent: string): string {
  const l = luminance(accent);
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.056 ? "#ffffff" : "#111111";
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Build a full palette from just a background and an accent color. */
export function paletteFromCustom(bg: string, accent: string): Palette {
  const [bh, bs, bl] = hexToHsl(bg);
  const dark = bl < 0.5;
  const shift = (d: number) => hslToHex(bh, clamp(bs, 0, 0.6), clamp(bl + (dark ? d : -d), 0, 1));
  const [ah, as, al] = hexToHsl(accent);
  // Buttons use white text, so keep the button color from getting too light.
  const btnL = clamp(al, 0.25, 0.55);
  return {
    base: bg,
    surface: dark ? shift(0.05) : hslToHex(bh, clamp(bs, 0, 0.6), clamp(bl + 0.04, 0, 1)),
    surfaceAlt: shift(dark ? 0.1 : 0.07),
    border: shift(dark ? 0.17 : 0.15),
    ink: hslToHex(bh, 0.2, dark ? 0.94 : 0.1),
    muted: hslToHex(bh, 0.12, dark ? 0.65 : 0.4),
    accent: hslToHex(ah, as, btnL),
    accentHi: hslToHex(ah, as, clamp(dark ? btnL + 0.15 : btnL - 0.18, 0.12, 0.8)),
    scheme: dark ? "dark" : "light",
  };
}

export function paletteFor(choice: ThemeChoice | null): Palette | null {
  if (!choice) return null;
  if ("preset" in choice) return PRESETS.find((p) => p.id === choice.preset)?.palette ?? null;
  return paletteFromCustom(choice.custom.bg, choice.custom.accent);
}

/** CSS variable overrides for a choice (empty = site default). */
export function themeVars(choice: ThemeChoice | null): Record<string, string> {
  const p = paletteFor(choice);
  if (!p) return {};
  return {
    "--color-base": p.base,
    "--color-surface": p.surface,
    "--color-surface-alt": p.surfaceAlt,
    "--color-border": p.border,
    "--color-ink": p.ink,
    "--color-muted": p.muted,
    "--color-accent": p.accent,
    "--color-accent-hi": p.accentHi,
    "--admin-on-accent": onAccent(p.accent),
    "color-scheme": p.scheme,
  };
}

/** Safely read the cookie value; anything unexpected means "no theme". */
export function parseTheme(raw: string | undefined): ThemeChoice | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(decodeURIComponent(raw));
    if (typeof v?.preset === "string" && PRESETS.some((p) => p.id === v.preset)) return { preset: v.preset };
    if (isHex(v?.custom?.accent) && isHex(v?.custom?.bg))
      return { custom: { accent: v.custom.accent, bg: v.custom.bg } };
  } catch {
    // fall through
  }
  return null;
}
