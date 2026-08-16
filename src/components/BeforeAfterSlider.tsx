"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Paired before/after slider — PRD §7.3.3 ("before/after is the sales
 * argument"). Drag or use the range input; works with touch and keyboard.
 * `before`/`after` are CSS backgrounds (gradients stand in for real photos).
 */
export default function BeforeAfterSlider({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, p)));
  }, []);

  return (
    <div
      ref={ref}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-md)] border border-border select-none touch-none"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && setFromClientX(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
    >
      {/* After (full width, underneath) */}
      <div className="absolute inset-0" style={{ background: after }} />
      <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
        {afterLabel}
      </span>

      {/* Before (clipped to slider position) */}
      <div
        className="absolute inset-0"
        style={{ background: before, clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {beforeLabel}
        </span>
      </div>

      {/* Handle */}
      <div
        className="absolute inset-y-0 flex items-center justify-center"
        style={{ left: `calc(${pos}% - 1px)` }}
      >
        <div className="h-full w-0.5 bg-white/90" />
        <div className="absolute grid h-11 w-11 place-items-center rounded-full bg-white text-base shadow-lg">
          <span className="text-black">⇆</span>
        </div>
      </div>

      <label className="sr-only" htmlFor="ba-range">
        Reveal after photo
      </label>
      <input
        id="ba-range"
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-x-0 bottom-0 h-11 w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
