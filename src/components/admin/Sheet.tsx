"use client";

import { useId, useRef } from "react";
import { useDialog } from "@/lib/useDialog";

/**
 * Popup used for admin outcomes ("Request officially booked", confirmations,
 * customer contact). Centered with a margin on every screen size. Backdrop
 * taps don't dismiss it — closing also refreshes the list behind it, so the
 * person should answer with a button (Escape works when `onClose` is given).
 */
export default function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialog(ref, onClose);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-base p-6 shadow-2xl"
      >
        <h2
          id={titleId}
          className="text-center font-[family-name:var(--font-display)] text-2xl font-extrabold"
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

export function BigButton({
  children,
  href,
  onClick,
  tone = "default",
  external,
  disabled,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "primary" | "success" | "danger";
  external?: boolean;
  disabled?: boolean;
}) {
  const cls = `tap flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 text-base font-bold disabled:opacity-50 ${
    {
      default: "border border-border bg-surface text-ink",
      primary: "bg-accent text-white",
      success: "bg-success text-black",
      danger: "border border-danger/60 bg-surface text-danger-text",
    }[tone]
  }`;
  const style = { minHeight: 56 };
  if (href) {
    return (
      <a
        href={href}
        className={cls}
        style={style}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls} style={style}>
      {children}
    </button>
  );
}
