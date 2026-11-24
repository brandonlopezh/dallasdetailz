// Decorative backdrop: small car-wash line icons scattered across the page,
// sitting on top of the blurred wallpaper. Pure inline SVG (no image requests)
// and fully deterministic, so server and client render the same thing.

const ICONS: Record<string, React.ReactNode> = {
  drop: <path d="M12 3c3 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 3-6.5 6-11z" />,
  sparkle: <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />,
  bubbles: (
    <>
      <circle cx="9" cy="14" r="5.5" />
      <circle cx="18" cy="6.5" r="3" />
      <circle cx="19" cy="17.5" r="1.8" />
      <path d="M6.3 12.3a3 3 0 0 1 2.1-1.6" />
    </>
  ),
  bucket: (
    <>
      <ellipse cx="12" cy="8" rx="7" ry="2" />
      <path d="M5 8l1.6 11a2 2 0 0 0 2 1.7h6.8a2 2 0 0 0 2-1.7L19 8" />
      <path d="M5 8c0-4 2.5-6 7-6s7 2 7 6" />
    </>
  ),
  sponge: (
    <>
      <rect x="3" y="7.5" width="18" height="9.5" rx="2.5" />
      <circle cx="8" cy="12" r="0.9" />
      <circle cx="13" cy="14" r="0.9" />
      <circle cx="16.5" cy="10.8" r="0.9" />
    </>
  ),
  spray: (
    <>
      <path d="M5 22V13l2.5-3h5L15 13v9z" />
      <path d="M8 10V5h6l4 2" />
      <path d="M20.5 8.5l2-.8M20.5 11h2.5M20.5 13.5l2 .8" />
    </>
  ),
  brush: (
    <>
      <rect x="2.5" y="12.5" width="10" height="7" rx="1.5" transform="rotate(-45 7.5 16)" />
      <path d="M12 12l8.5-8.5" />
      <path d="M4.5 14.5l1.5 1.5M6.5 12.5l1.5 1.5M8.5 10.5l1.5 1.5" />
    </>
  ),
  towel: (
    <>
      <path d="M4 7l8-3 8 3v10l-8 3-8-3z" />
      <path d="M4 7l8 3 8-3M12 10v10" />
    </>
  ),
  washer: (
    <>
      <rect x="2.5" y="8.5" width="12" height="5.5" rx="1.5" />
      <path d="M6 14l-1.2 6h3.2L9.2 14" />
      <path d="M14.5 11h3" />
      <path d="M19 8.5l2.5-1.2M19.5 11h3M19 13.5l2.5 1.2" />
    </>
  ),
  car: (
    <>
      <path d="M3 16v-3l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5v3z" />
      <path d="M5.5 12h13" />
      <circle cx="7.5" cy="17" r="1.8" />
      <circle cx="16.5" cy="17" r="1.8" />
    </>
  ),
};

const ORDER = [
  "drop",
  "spray",
  "bucket",
  "sparkle",
  "sponge",
  "bubbles",
  "washer",
  "towel",
  "car",
  "brush",
] as const;

// Small seeded generator so placement looks random but never changes.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Icons live only in the margins either side of the page's 72rem content
// column, so they surround the text instead of sitting behind it. --g is the
// free margin width on one side (the wide-screen gutter, or the 5vw edge on
// phones, minus a little breathing room); each icon is capped at a fraction of
// it, so on narrow screens the icons shrink and finally disappear rather than
// run under the text.
const PER_SIDE = 11;
const rand = rng(20261124);
const PLACED = (["left", "right"] as const).flatMap((side, sideIdx) =>
  Array.from({ length: PER_SIDE }, (_, i) => ({
    side,
    icon: ORDER[(i * 3 + sideIdx * 4) % ORDER.length],
    // Jittered rows: even vertical coverage, never stacked on each other.
    top: ((i + 0.1 + rand() * 0.8) / PER_SIDE) * 100,
    // Where inside the margin (0 = page edge, 1 = against the text column).
    across: 0.05 + rand() * 0.9,
    size: 28 + Math.round(rand() * 18),
    rotate: Math.round(rand() * 60 - 30),
  })),
);

export default function CarWashPattern() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden text-sky-300/80 [--g:calc(max(0px,(100vw-72rem)/2)+0.75rem)] max-sm:[--g:calc(5vw+0.75rem)]"
      // One blue neon glow for the whole layer (cheaper than a filter per icon).
      style={{
        filter:
          "drop-shadow(0 0 3px rgb(56 189 248 / 0.9)) drop-shadow(0 0 9px rgb(59 130 246 / 0.7))",
      }}
    >
      {PLACED.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute"
          style={
            {
              "--w": `min(${p.size}px, calc(var(--g) * 0.7))`,
              width: "var(--w)",
              height: "var(--w)",
              top: `${p.top}%`,
              [p.side]: `calc((var(--g) - var(--w)) * ${p.across.toFixed(3)})`,
              transform: `rotate(${p.rotate}deg)`,
            } as React.CSSProperties
          }
        >
          {ICONS[p.icon]}
        </svg>
      ))}
    </div>
  );
}
