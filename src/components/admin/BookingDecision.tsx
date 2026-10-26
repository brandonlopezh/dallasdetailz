"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminBooking } from "@/lib/admin-bookings";
import CalendarButtons from "./CalendarButtons";
import Sheet, { BigButton } from "./Sheet";

type Outcome =
  | { kind: "booked" }
  | { kind: "declined" }
  | { kind: "offered"; when: string };

const WHEN_OPTS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

const whenLabel = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: tz, ...WHEN_OPTS }).format(new Date(iso));

// datetime-local value derived from a UTC instant (browser tz).
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/**
 * Accept / decline / offer-a-new-time for a pending request. Each outcome
 * opens a popup: booked → add to calendar; declined or new time offered →
 * the customer's number with Call / Text. The list behind refreshes when the
 * popup is closed (not before, or the card — and popup — would vanish).
 */
export default function BookingDecision({ b, tz }: { b: AdminBooking; tz: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [offering, setOffering] = useState(false);
  const [newStart, setNewStart] = useState(toLocalInput(b.scheduled_start));

  const name = b.customers?.name ?? "Customer";
  const phone = b.customers?.phone ?? "";
  const service = b.services?.name ?? "detail";

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(false);
    }
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
    });
    if (ok) {
      setOffering(false);
      setOutcome({ kind: "offered", when: whenLabel(start.toISOString(), tz) });
    }
  };

  const close = () => {
    setOutcome(null);
    router.refresh();
  };

  return (
    <div>
      <div className="grid gap-2">
        <BigButton tone="success" onClick={approve} disabled={busy}>
          ✓ Accept
        </BigButton>
        <div className="grid grid-cols-2 gap-2">
          <BigButton onClick={() => setOffering((v) => !v)} disabled={busy}>
            🕒 New time
          </BigButton>
          <BigButton tone="danger" onClick={decline} disabled={busy}>
            ✕ Decline
          </BigButton>
        </div>
      </div>

      {offering && (
        <div className="mt-3 grid gap-2 rounded-[var(--radius-md)] border border-border bg-base p-3">
          <label className="text-sm font-semibold">Offer a different time</label>
          <input
            type="datetime-local"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-3 text-base"
          />
          <BigButton tone="primary" onClick={offer} disabled={busy}>
            Save new time
          </BigButton>
        </div>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-danger">{error}</p>}

      {outcome?.kind === "booked" && (
        <Sheet>
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/20 text-3xl">
              ✓
            </div>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-extrabold">
              Request officially booked
            </h2>
            <p className="mt-1 text-sm text-muted">
              {name} · {service}
              <br />
              {whenLabel(b.scheduled_start, tz)}
            </p>
          </div>
          <p className="mb-2 mt-5 text-sm font-semibold">Add to my calendar</p>
          <CalendarButtons b={b} />
          <div className="mt-2">
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
              ? `Hi ${name.split(" ")[0]}, this is Dallas Detailz. Unfortunately we can't make ${whenLabel(b.scheduled_start, tz)} work for your ${service}. `
              : `Hi ${name.split(" ")[0]}, this is Dallas Detailz. Could we do your ${service} on ${outcome.when} instead? Let me know if that works!`
          }
          onClose={close}
        />
      )}
    </div>
  );
}

function ContactSheet({
  title,
  hint,
  name,
  phone,
  smsBody,
  onClose,
}: {
  title: string;
  hint: string;
  name: string;
  phone: string;
  smsBody: string;
  onClose: () => void;
}) {
  const dial = phone.replace(/[^\d+]/g, "");
  return (
    <Sheet>
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{hint}</p>
        <p className="mt-5 text-sm text-muted">{name}</p>
        <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-wide">
          {phone || "No number on file"}
        </p>
      </div>
      {phone && (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <BigButton href={`tel:${dial}`} tone="primary">
            📞 Call
          </BigButton>
          <BigButton href={`sms:${dial}?&body=${encodeURIComponent(smsBody)}`} tone="primary">
            💬 Text
          </BigButton>
        </div>
      )}
      <div className="mt-2">
        <BigButton onClick={onClose}>Done</BigButton>
      </div>
    </Sheet>
  );
}
