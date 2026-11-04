"use client";

import { Children, useRef, useState } from "react";

/**
 * Swipeable card carousel: native scroll-snap (so touch swiping just works)
 * plus ← / → buttons and arrow keys for mouse and keyboard users.
 */
export default function Carousel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const slides = Children.toArray(children);
  const count = slides.length;

  const go = (n: number) => {
    const el = ref.current;
    if (!el) return;
    const target = Math.max(0, Math.min(count - 1, n));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  const btn =
    "tap inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold transition-colors enabled:hover:border-accent disabled:opacity-30";

  return (
    <div role="group" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={ref}
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            go(index + 1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(index - 1);
          }
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            className="min-w-full snap-center"
          >
            {s}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button type="button" aria-label="Previous appointment" onClick={() => go(index - 1)} disabled={index === 0} className={btn}>
            <span aria-hidden="true">←</span> Prev
          </button>
          <p className="text-sm font-semibold text-muted" aria-live="polite">
            {index + 1} of {count}
          </p>
          <button type="button" aria-label="Next appointment" onClick={() => go(index + 1)} disabled={index >= count - 1} className={btn}>
            Next <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
