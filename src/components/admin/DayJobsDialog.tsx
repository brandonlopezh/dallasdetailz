"use client";

import { useId, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/lib/useDialog";

/**
 * Popup for a calendar day's appointments. The jobs are server-rendered and
 * passed in as children; closing (✕, backdrop, Escape) navigates back to the
 * calendar without a day selected, so the URL stays the source of truth.
 */
export default function DayJobsDialog({
  title,
  closeHref,
  children,
}: {
  title: string;
  closeHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = () => router.push(closeHref, { scroll: false });
  useDialog(ref, close);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-base shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id={titleId} className="font-[family-name:var(--font-display)] text-lg font-extrabold">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="tap grid place-items-center rounded-full border border-border text-lg text-muted hover:text-ink"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="grid gap-3 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
