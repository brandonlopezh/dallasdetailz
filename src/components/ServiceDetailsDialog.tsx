"use client";

import { useId, useRef } from "react";
import { useDialog } from "@/lib/useDialog";

/** Small popup listing what a service includes. */
export default function ServiceDetailsDialog({
  title,
  heading,
  items,
  closeLabel,
  onClose,
}: {
  title: string;
  heading: string;
  items: string[];
  closeLabel: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialog(ref, onClose);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-base p-6 text-ink shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-display)] text-xl font-bold"
            >
              {title}
            </h2>
            <p className="mt-0.5 text-sm font-semibold text-link">{heading}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="tap grid shrink-0 place-items-center rounded-full border border-[var(--color-control)] text-lg text-muted hover:text-ink"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-link">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
