"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@/lib/types";
import type { AdminBooking } from "@/lib/admin-bookings";
import BookingDecision from "./BookingDecision";
import CalendarButtons from "./CalendarButtons";
import CancelAppointment from "./CancelAppointment";
import { DATETIME_INPUT, patchBooking, toLocalInput } from "./patchBooking";

// Status moves offered besides Cancel (which has its own confirm + contact flow).
const NEXT: Record<BookingStatus, BookingStatus[]> = {
  requested: [],
  confirmed: ["in_progress", "completed", "no_show"],
  in_progress: ["completed"],
  completed: [],
  cancelled: ["confirmed"],
  no_show: ["confirmed"],
};

const ACTION_LABEL: Partial<Record<BookingStatus, string>> = {
  confirmed: "Re-book this appointment",
  in_progress: "Start job",
  completed: "Mark complete",
  no_show: "No-show",
};

const ACTION_STYLE: Partial<Record<BookingStatus, string>> = {
  confirmed: "bg-accent text-white",
  in_progress: "bg-accent text-white",
  completed: "bg-success text-black",
  no_show: "border border-danger/60 bg-surface text-danger-text",
};

const CANCELLABLE: BookingStatus[] = ["confirmed", "in_progress"];

export default function BookingActions({ b, tz }: { b: AdminBooking; tz: string }) {
  const { id, status, scheduled_start: start, scheduled_end: end, internal_notes: internalNotes } = b;
  const router = useRouter();
  const startId = useId();
  const notesId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(internalNotes ?? "");
  const [rescheduling, setRescheduling] = useState(false);
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
    "tap rounded-[var(--radius-md)] px-4 py-3 text-base font-bold disabled:opacity-50";

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
      <h2 className="font-bold">Actions</h2>

      {status === "requested" && (
        <div className="mt-3">
          <BookingDecision b={b} tz={tz} />
        </div>
      )}

      {status === "confirmed" && (
        <div className="mt-3">
          <p className="mb-2 text-sm font-semibold">Add to my calendar</p>
          <CalendarButtons b={b} />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-[var(--radius-sm)] border border-danger/50 bg-danger/10 p-3 text-sm font-semibold text-danger-text">
          {error}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {NEXT[status].map((next) => (
          <button
            key={next}
            type="button"
            disabled={busy}
            onClick={() => patch({ status: next })}
            className={`${buttonCls} ${ACTION_STYLE[next] ?? "border border-border"}`}
          >
            {ACTION_LABEL[next]}
          </button>
        ))}
        {status !== "requested" && status !== "cancelled" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setRescheduling((v) => !v)}
            aria-expanded={rescheduling}
            className={`${buttonCls} border border-border bg-surface text-ink`}
          >
            Reschedule
          </button>
        )}
      </div>

      {CANCELLABLE.includes(status) && (
        <div className="mt-2">
          <CancelAppointment b={b} tz={tz} />
        </div>
      )}

      {rescheduling && (
        <div className="mt-3 grid gap-2 rounded-[var(--radius-md)] border border-border bg-base p-3">
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

      <div className="mt-4">
        <label htmlFor={notesId} className="text-sm text-muted">
          Internal notes
        </label>
        <textarea
          id={notesId}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block min-h-24 w-full rounded-[var(--radius-sm)] border border-border bg-base px-3 py-2 text-base"
        />
        <button
          type="button"
          disabled={busy || notes === (internalNotes ?? "")}
          onClick={() => patch({ internal_notes: notes })}
          className="tap mt-2 rounded-[var(--radius-md)] border border-border bg-surface px-4 text-base font-semibold text-ink disabled:opacity-40"
        >
          Save notes
        </button>
      </div>
    </div>
  );
}
