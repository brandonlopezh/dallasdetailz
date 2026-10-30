"use client";

import { createContext, useCallback, useContext, useId, useRef, useState } from "react";
import { useDialog } from "@/lib/useDialog";
import BookingFlow, { useBookingText } from "./BookingFlow";

interface BookingModalCtx {
  open: (serviceId?: string) => void;
}

const Ctx = createContext<BookingModalCtx>({ open: () => {} });

export const useBookingModal = () => useContext(Ctx);

/**
 * Every "Book Now" on the public site opens the request form in this popup
 * instead of navigating away. Provider sits above the page so any button can
 * call `open(serviceId?)`.
 */
export function BookingModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ serviceId?: string; n: number } | null>(null);

  const open = useCallback(
    (serviceId?: string) => setState((s) => ({ serviceId, n: (s?.n ?? 0) + 1 })),
    [],
  );
  const dismiss = useCallback(() => setState(null), []);

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {state && <BookingDialog key={state.n} serviceId={state.serviceId} onClose={dismiss} />}
    </Ctx.Provider>
  );
}

function BookingDialog({ serviceId, onClose }: { serviceId?: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const b = useBookingText();
  useDialog(ref, onClose);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="booking-soft relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-base text-ink shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2
            id={titleId}
            className="font-[family-name:var(--font-display)] text-lg font-extrabold uppercase"
          >
            {b.modalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={b.close}
            className="tap grid place-items-center rounded-full border border-[var(--color-control)] text-lg text-muted hover:text-ink"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-5">
          <BookingFlow initialServiceId={serviceId} onDone={onClose} />
        </div>
      </div>
    </div>
  );
}
