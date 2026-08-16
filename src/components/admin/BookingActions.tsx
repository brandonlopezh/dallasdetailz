"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingStatus } from "@/lib/types";

const STATUS_ACTIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "completed", "cancelled", "no_show"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: ["confirmed"],
  no_show: ["confirmed"],
};

const ACTION_LABEL: Record<BookingStatus, string> = {
  requested: "Move to requested",
  confirmed: "Confirm",
  in_progress: "Start job",
  completed: "Mark complete",
  cancelled: "Cancel",
  no_show: "No-show",
};

const ACTION_STYLE: Partial<Record<BookingStatus, string>> = {
  confirmed: "bg-accent text-white",
  in_progress: "bg-accent text-white",
  completed: "bg-success text-black",
  cancelled: "border border-danger/50 text-danger",
  no_show: "border border-danger/50 text-danger",
};

export default function BookingActions({
  id,
  status,
  start,
  end,
  internalNotes,
}: {
  id: string;
  status: BookingStatus;
  start: string;
  end: string;
  internalNotes: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(internalNotes ?? "");
  const [rescheduling, setRescheduling] = useState(false);

  // datetime-local value derived from the stored UTC start (local browser tz).
  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
  };
  const [newStart, setNewStart] = useState(toLocalInput(start));

  const durationMs = new Date(end).getTime() - new Date(start).getTime();

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const doReschedule = async () => {
    const startDate = new Date(newStart);
    const endDate = new Date(startDate.getTime() + durationMs);
    const ok = await patch({
      scheduled_start: startDate.toISOString(),
      scheduled_end: endDate.toISOString(),
    });
    if (ok) setRescheduling(false);
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
      <h2 className="font-bold">Actions</h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {STATUS_ACTIONS[status].map((next) => (
          <button
            key={next}
            disabled={busy}
            onClick={() => patch({ status: next })}
            className={`tap rounded-[var(--radius-sm)] px-4 text-sm font-bold disabled:opacity-50 ${
              ACTION_STYLE[next] ?? "border border-border"
            }`}
          >
            {ACTION_LABEL[next]}
          </button>
        ))}
        <button
          disabled={busy}
          onClick={() => setRescheduling((v) => !v)}
          className="tap rounded-[var(--radius-sm)] border border-border px-4 text-sm font-bold disabled:opacity-50"
        >
          Reschedule
        </button>
      </div>

      {rescheduling && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="datetime-local"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-border bg-base px-3 py-2 text-sm"
          />
          <button
            disabled={busy}
            onClick={doReschedule}
            className="tap rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            Save new time
          </button>
        </div>
      )}

      <div className="mt-4">
        <label className="text-sm text-muted">Internal notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 min-h-20 w-full rounded-[var(--radius-sm)] border border-border bg-base px-3 py-2 text-sm"
        />
        <button
          disabled={busy || notes === (internalNotes ?? "")}
          onClick={() => patch({ internal_notes: notes })}
          className="tap mt-2 rounded-[var(--radius-sm)] border border-border px-4 text-sm font-semibold disabled:opacity-40"
        >
          Save notes
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
