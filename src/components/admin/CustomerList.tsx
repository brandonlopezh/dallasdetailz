"use client";

import { useId, useMemo, useState } from "react";
import type { AdminCustomer } from "@/lib/admin-bookings";
import CustomerCard from "./CustomerCard";

const digits = (s: string) => s.replace(/\D/g, "");

/** Searchable customer tiles: filters by name, phone, email or Instagram as you type. */
export default function CustomerList({ customers, tz }: { customers: AdminCustomer[]; tz: string }) {
  const [q, setQ] = useState("");
  const id = useId();

  const shown = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return customers;
    const num = digits(text);
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(text) ||
        (c.email ?? "").toLowerCase().includes(text) ||
        (c.instagram_handle ?? "").toLowerCase().includes(text) ||
        (num.length > 0 && digits(c.phone).includes(num)),
    );
  }, [q, customers]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={id} className="sr-only">
          Search customers
        </label>
        <input
          id={id}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, phone or email"
          autoComplete="off"
          className="w-full max-w-md rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-[16px] text-ink placeholder:text-muted"
        />
        {q.trim() && (
          <p className="mt-2 text-sm text-muted" aria-live="polite">
            {shown.length} of {customers.length} customers
          </p>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-border p-8 text-center text-muted">
          {customers.length === 0 ? "No customers yet." : "No customers match that search."}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <li key={c.id} className="min-w-0">
              <CustomerCard c={c} tz={tz} standalone />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
