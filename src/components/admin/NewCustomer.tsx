"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sheet, { BigButton } from "./Sheet";

const INPUT = "w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-3 text-[16px] text-ink";

/** "+ New customer" → popup form; saves the customer and refreshes the list. */
export default function NewCustomer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");

  const close = () => {
    if (busy) return;
    setOpen(false);
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, instagram }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't save. Try again.");
      setName("");
      setPhone("");
      setEmail("");
      setInstagram("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap inline-flex items-center rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-bold text-white"
      >
        + New customer
      </button>

      {open && (
        <Sheet title="New customer" onClose={close}>
          <form onSubmit={save} className="mt-4 grid gap-3">
            <input className={INPUT} placeholder="Name" aria-label="Name" required autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={INPUT} placeholder="Mobile" aria-label="Mobile" type="tel" required autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className={INPUT} placeholder="Email (optional)" aria-label="Email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={INPUT} placeholder="Instagram (optional)" aria-label="Instagram" autoComplete="off" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            {error && (
              <p role="alert" className="rounded-[var(--radius-sm)] border border-danger/50 bg-danger/10 p-3 text-sm font-semibold text-danger-text">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="tap min-h-14 rounded-[var(--radius-md)] bg-accent px-5 text-[16px] font-bold text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save customer"}
            </button>
            <BigButton onClick={close} disabled={busy}>
              Cancel
            </BigButton>
          </form>
        </Sheet>
      )}
    </>
  );
}
