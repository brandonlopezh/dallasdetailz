"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@/lib/types";
import type { AdminBooking } from "@/lib/admin-bookings";
import BookingDecision from "./BookingDecision";
import CalendarButtons from "./CalendarButtons";
import CancelAppointment from "./CancelAppointment";
import Sheet, { BigButton } from "./Sheet";
import { DATETIME_INPUT, patchBooking, toLocalInput } from "./patchBooking";

const CANCELLABLE: BookingStatus[] = ["confirmed", "in_progress"];

export default function BookingActions({ b, tz }: { b: AdminBooking; tz: string }) {
  const { id, status, scheduled_start: start, scheduled_end: end } = b;
  const router = useRouter();
  const startId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [newStart, setNewStart] = useState(toLocalInput(start));

  const durationMs = new Date(end).getTime() - new Date(start).getTime();

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    const err = await patchBooking(id, body);
    setBusy(false);
    if (err) {
      setError(err);
      return false;
    }
    router.refresh();
    return true;
  };

  const doReschedule = async () => {
    const startDate = new Date(newStart);
    if (Number.isNaN(startDate.getTime())) return;
    const ok = await patch({
      scheduled_start: startDate.toISOString(),
      scheduled_end: new Date(startDate.getTime() + durationMs).toISOString(),
    });
    if (ok) setRescheduling(false);
  };

  const buttonCls =
    "tap min-h-12 rounded-[var(--radius-md)] px-3 text-sm font-bold disabled:opacity-50 sm:min-h-14 sm:px-5 sm:text-[16px]";

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-xl font-extrabold">
        {status === "requested" ? "Your answer" : "Actions"}
      </h2>

      {!["requested", ...CANCELLABLE].includes(status) && (
        <p className="mt-3 text-muted">
          {status === "completed" ? "This job is complete." : "This appointment is closed."}
        </p>
      )}
      {status === "completed" && (
        <div className="mt-4 grid gap-3">
          <a
            href={`/admin/invoice/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonCls} flex items-center justify-center gap-2 border border-border bg-surface text-ink`}
          >
            <span aria-hidden="true">🧾</span> Print invoice
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      )}

      {status === "requested" && (
        <div className="mt-4">
          <BookingDecision b={b} tz={tz} />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-[var(--radius-sm)] border border-danger/50 bg-danger/10 p-3 text-sm font-semibold text-danger-text">
          {error}
        </p>
      )}

      {CANCELLABLE.includes(status) && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ status: "completed" })}
            className={`${buttonCls} bg-[#4a7a37] text-white`}
          >
            Mark completed
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRescheduling((v) => !v)}
            aria-expanded={rescheduling}
            className={`${buttonCls} border border-border bg-surface text-ink`}
          >
            Reschedule
          </button>
        </div>
      )}

      {rescheduling && (
        <div className="mt-3 grid gap-3 rounded-[var(--radius-md)] border border-border bg-base p-4">
          <label htmlFor={startId} className="text-sm font-semibold">
            New start time
          </label>
          <input
            id={startId}
            type="datetime-local"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
            className={DATETIME_INPUT}
          />
          <button
            type="button"
            disabled={busy}
            onClick={doReschedule}
            className={`${buttonCls} bg-accent text-white`}
          >
            Save new time
          </button>
        </div>
      )}

      {CANCELLABLE.includes(status) && (
        <div className="mt-2 sm:mt-3">
          <CancelAppointment
            b={b}
            tz={tz}
            className="tap min-h-12 w-full rounded-[var(--radius-md)] border border-danger/60 bg-surface px-3 text-sm font-bold text-danger-text sm:min-h-14 sm:text-[16px]"
          />
        </div>
      )}

      {CANCELLABLE.includes(status) && (
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-5 sm:gap-3">
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className={`${buttonCls} border border-border bg-surface text-ink`}
          >
            <span aria-hidden="true">📅</span> Add to calendar
          </button>
          <a
            href={`/admin/invoice/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonCls} flex items-center justify-center gap-2 border border-border bg-surface text-ink`}
          >
            <span aria-hidden="true">🧾</span> Print invoice
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      )}

      {calendarOpen && (
        <Sheet title="Add to calendar" onClose={() => setCalendarOpen(false)}>
          <p className="mb-4 mt-1 text-center text-sm text-muted">Which phone do you use?</p>
          <CalendarButtons b={b} />
          <div className="mt-2">
            <BigButton onClick={() => setCalendarOpen(false)}>Close</BigButton>
          </div>
        </Sheet>
      )}
    </div>
  );
}
