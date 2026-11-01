"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { patchBooking } from "./patchBooking";

/** Flips a booking between unpaid and paid (payment is taken in person, Zelle or cash). */
export default function PaymentToggle({ id, paid }: { id: string; paid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    setBusy(true);
    setError(null);
    const err = await patchBooking(id, { payment_status: paid ? "unpaid" : "paid" });
    setBusy(false);
    if (err) setError(err);
    else router.refresh();
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className="tap rounded-[var(--radius-sm)] border border-border px-3 text-sm font-semibold disabled:opacity-50"
      >
        {paid ? "Mark as unpaid" : "Mark as paid"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}
