"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminBooking } from "@/lib/admin-bookings";
import ContactSheet from "./ContactSheet";
import Sheet, { BigButton } from "./Sheet";
import { patchBooking, whenLabel } from "./patchBooking";

/**
 * Cancel a booked appointment: asks to confirm (so a stray tap can't cancel
 * a job), then shows the customer's number to call or text.
 */
export default function CancelAppointment({
  b,
  tz,
  className,
}: {
  b: Pick<AdminBooking, "id" | "scheduled_start" | "customers" | "services">;
  tz: string;
  className?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = b.customers?.name ?? "Customer";
  const service = b.services?.name ?? "detail";
  const when = whenLabel(b.scheduled_start, tz);

  const cancel = async () => {
    setBusy(true);
    setError(null);
    const err = await patchBooking(b.id, { status: "cancelled" });
    setBusy(false);
    if (err) setError(err);
    else setStep("done");
  };

  const finish = () => {
    setStep("idle");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setStep("confirm");
        }}
        className={
          className ??
          "tap w-full rounded-[var(--radius-md)] border border-danger/60 bg-surface px-5 text-base font-bold text-danger-text"
        }
        style={{ minHeight: 52 }}
      >
        Cancel appointment
      </button>

      {step === "confirm" && (
        <Sheet title="Cancel this appointment?" onClose={() => setStep("idle")}>
          <p className="mt-2 text-center text-sm text-muted">
            {name} · {service}
            <br />
            {when}
          </p>
          {error && (
            <p role="alert" className="mt-4 rounded-[var(--radius-sm)] border border-danger/50 bg-danger/10 p-3 text-sm font-semibold text-danger-text">
              {error}
            </p>
          )}
          <div className="mt-5 grid gap-2">
            <BigButton tone="danger" onClick={cancel} disabled={busy}>
              {busy ? "Cancelling…" : "Yes, cancel it"}
            </BigButton>
            <BigButton onClick={() => setStep("idle")} disabled={busy}>
              Keep appointment
            </BigButton>
          </div>
        </Sheet>
      )}

      {step === "done" && (
        <ContactSheet
          title="Appointment cancelled"
          hint="Let them know so they aren't expecting you."
          name={name}
          phone={b.customers?.phone ?? ""}
          smsBody={`Hi ${name.split(" ")[0]}, this is Dallas Detailz. We need to cancel your ${service} on ${when}. Sorry about that, we'd be glad to find another time for you.`}
          onClose={finish}
        />
      )}
    </>
  );
}
