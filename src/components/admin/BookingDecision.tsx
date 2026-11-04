"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminBooking } from "@/lib/admin-bookings";
import CalendarButtons from "./CalendarButtons";
import ContactSheet from "./ContactSheet";
import Sheet, { BigButton } from "./Sheet";
import { DATETIME_INPUT, patchBooking, toLocalInput, whenLabel } from "./patchBooking";

type Outcome =
  | { kind: "booked" }
  | { kind: "declined" }
  | { kind: "offered"; when: string };

/**
 * Accept / decline for a pending request; declining can offer a new time instead. Each outcome
 * opens a popup: booked → add to calendar; declined or new time offered →
 * the customer's number with Call / Text. The list behind refreshes when the
 * popup is closed (not before, or the card — and popup — would vanish).
 */
export default function BookingDecision({ b, tz }: { b: AdminBooking; tz: string }) {
  const router = useRouter();
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [declining, setDeclining] = useState(false);
  const [newStart, setNewStart] = useState(toLocalInput(b.scheduled_start));

  const name = b.customers?.name ?? "Customer";
  const first = name.split(" ")[0];
  const phone = b.customers?.phone ?? "";
  const service = b.services?.name ?? "detail";

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    const err = await patchBooking(b.id, body);
    setBusy(false);
    if (err) setError(err);
    return !err;
  };

  const approve = async () => {
    if (await patch({ status: "confirmed" })) setOutcome({ kind: "booked" });
  };

  const decline = async () => {
    if (await patch({ status: "cancelled" })) setOutcome({ kind: "declined" });
  };

  const offer = async () => {
    const start = new Date(newStart);
    if (Number.isNaN(start.getTime())) return;
    const durationMs = new Date(b.scheduled_end).getTime() - new Date(b.scheduled_start).getTime();
    const ok = await patch({
      scheduled_start: start.toISOString(),
      scheduled_end: new Date(start.getTime() + durationMs).toISOString(),
      offered: true,
    });
    if (ok) {
      setDeclining(false);
      setOutcome({ kind: "offered", when: whenLabel(start.toISOString(), tz) });
    }
  };

  const close = () => {
    setOutcome(null);
    router.refresh();
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <BigButton tone="solid-success" onClick={approve} disabled={busy} className="!min-h-12 !px-3 !text-sm sm:!min-h-14 sm:!text-[16px]">
          <span aria-hidden="true">✓</span> Accept
        </BigButton>
        <BigButton tone="danger" onClick={() => setDeclining((v) => !v)} disabled={busy} className="!min-h-12 !px-3 !text-sm sm:!min-h-14 sm:!text-[16px]">
          <span aria-hidden="true">✕</span> Decline
        </BigButton>
      </div>
      {!declining && <p className="mt-2 text-xs text-muted">Decline lets you offer a different time instead.</p>}

      {declining && (
        <div className="mt-4 grid gap-3 rounded-[var(--radius-md)] border border-border bg-base p-4">
          <label htmlFor={inputId} className="text-sm font-semibold">
            Offer a different time instead
          </label>
          <input
            id={inputId}
            type="datetime-local"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
            className={DATETIME_INPUT}
          />
          <BigButton tone="primary" onClick={offer} disabled={busy}>
            Offer new time
          </BigButton>
          <BigButton tone="danger" onClick={decline} disabled={busy}>
            Decline without a new time
          </BigButton>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-[var(--radius-sm)] border border-danger/50 bg-danger/10 p-3 text-sm font-semibold text-danger-text">
          {error}
        </p>
      )}

      {outcome?.kind === "booked" && (
        <Sheet title="Request officially booked" onClose={close}>
          <p className="mt-1 text-center text-sm text-muted">
            {name} · {service}
            <br />
            {whenLabel(b.scheduled_start, tz)}
          </p>
          <p className="mb-2 mt-5 text-sm font-semibold">Add to my calendar</p>
          <CalendarButtons b={b} />
          <div className="mt-2 grid gap-2">
            <BigButton href={`/admin/invoice/${b.id}`} external>
              <span aria-hidden="true">🧾</span> Print invoice
            </BigButton>
            <BigButton onClick={close}>Done</BigButton>
          </div>
        </Sheet>
      )}

      {(outcome?.kind === "declined" || outcome?.kind === "offered") && (
        <ContactSheet
          title={outcome.kind === "declined" ? "Request declined" : "New time saved"}
          hint={
            outcome.kind === "declined"
              ? "Let them know — they're waiting to hear back."
              : `Text them to offer ${outcome.when}.`
          }
          name={name}
          phone={phone}
          smsBody={
            outcome.kind === "declined"
              ? `Hi ${first}, this is Dallas Detailz. Unfortunately we can't make ${whenLabel(b.scheduled_start, tz)} work for your ${service}. `
              : `Hi ${first}, this is Dallas Detailz. Could we do your ${service} on ${outcome.when} instead? Let me know if that works!`
          }
          onClose={close}
        />
      )}
    </div>
  );
}
