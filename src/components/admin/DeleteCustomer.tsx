"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sheet, { BigButton } from "./Sheet";

/** Delete a customer after an explicit confirmation (it also removes their bookings). */
export default function DeleteCustomer({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't delete. Try again.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label={`Delete ${name}`}
        title="Delete customer"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-danger/40 text-lg leading-none transition-colors hover:bg-danger/10"
      >
        <span aria-hidden="true">🗑️</span>
      </button>

      {open && (
        <Sheet title="Delete this customer?" onClose={() => !busy && setOpen(false)}>
          <p className="mt-2 text-center font-semibold">{name}</p>
          <p className="mt-2 text-center text-sm text-muted">
            This permanently deletes their contact info, vehicles and every booking, past and
            upcoming. This can&apos;t be undone.
          </p>
          {error && (
            <p role="alert" className="mt-4 rounded-[var(--radius-sm)] border border-danger/50 bg-danger/10 p-3 text-sm font-semibold text-danger-text">
              {error}
            </p>
          )}
          <div className="mt-5 grid gap-2">
            <BigButton tone="danger" onClick={remove} disabled={busy}>
              {busy ? "Deleting…" : "Yes, delete everything"}
            </BigButton>
            <BigButton onClick={() => setOpen(false)} disabled={busy}>
              Keep customer
            </BigButton>
          </div>
        </Sheet>
      )}
    </>
  );
}
