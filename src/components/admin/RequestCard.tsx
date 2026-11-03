import Link from "next/link";
import type { AdminBooking } from "@/lib/admin-bookings";
import BookingDecision from "./BookingDecision";

const money = (n: number) => `$${Math.round(Number(n))}`;

/** A pending request, impossible to miss, with one-tap Accept/Decline/New time. */
export default function RequestCard({ b, tz }: { b: AdminBooking; tz: string }) {
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(b.scheduled_start));
  const phone = b.customers?.phone;

  return (
    <div className="rounded-[var(--radius-lg)] border-2 border-accent-hi bg-surface-alt p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold leading-tight sm:text-4xl">
          {when}
        </p>
        <Link href={`/admin/bookings/${b.id}`} className="shrink-0 pt-1.5 text-sm font-semibold text-link">
          Details →
        </Link>
      </div>
      <p className="mt-1 font-semibold">
        {b.services?.name ?? "Service"} · {money(b.total)}
      </p>

      <div className="mt-3 text-sm">
        <p className="font-semibold">{b.customers?.name ?? "Customer"}</p>
        {phone && (
          <a href={`tel:${phone}`} className="text-link">
            {phone}
          </a>
        )}
        <p className="text-muted">{b.service_address}</p>
        {b.customer_notes && (
          <p className="mt-2 rounded-[var(--radius-sm)] border border-border bg-base p-2 text-muted">
            “{b.customer_notes}”
          </p>
        )}
      </div>

      <div className="mt-4">
        <BookingDecision b={b} tz={tz} />
      </div>
    </div>
  );
}
