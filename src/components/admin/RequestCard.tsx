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
    <div className="rounded-[var(--radius-lg)] border-2 border-warning/60 bg-warning/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-warning px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide text-black">
          Needs your answer
        </span>
        <Link href={`/admin/bookings/${b.id}`} className="text-sm font-semibold text-accent-hi">
          Details →
        </Link>
      </div>

      <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-extrabold leading-tight">
        {when}
      </p>
      <p className="mt-0.5 font-semibold">
        {b.services?.name ?? "Service"} · {money(b.total)}
      </p>

      <div className="mt-3 text-sm">
        <p className="font-semibold">{b.customers?.name ?? "Customer"}</p>
        {phone && (
          <a href={`tel:${phone}`} className="text-accent-hi">
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
