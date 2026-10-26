"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import BookingFlow from "./BookingFlow";

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
  const isOpen = state !== null;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, dismiss]);

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Request a booking"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={dismiss}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[var(--radius-lg)] border border-border bg-base shadow-2xl sm:rounded-[var(--radius-lg)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-[family-name:var(--font-display)] text-lg font-extrabold uppercase">
                Book a detail
              </p>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close"
                className="tap grid place-items-center rounded-full border border-border text-lg text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-5">
              <BookingFlow key={state.n} initialServiceId={state.serviceId} onDone={dismiss} />
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
