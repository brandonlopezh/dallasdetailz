import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBookingsAccess } from "@/lib/admin-guard";
import { getSettings } from "@/lib/catalog";
import { getBooking } from "@/lib/admin-bookings";
import { StatusBadge, money } from "@/components/admin/JobList";
import BookingActions from "@/components/admin/BookingActions";
import { formatInTz } from "@/lib/tz";

export const dynamic = "force-dynamic";

const TIER_LABEL: Record<string, string> = {
  sedan: "Sedan / Coupe",
  mid_suv: "Mid SUV / Truck",
  large_suv: "Large SUV / 3-Row",
  xl: "XL / Lifted",
};

export default async function BookingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireBookingsAccess();
  const { id } = await params;
  const [b, settings] = await Promise.all([getBooking(id), getSettings()]);
  if (!b) notFound();
  const tz = settings.timezone;

  const when = `${formatInTz(b.scheduled_start, tz, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })} – ${formatInTz(b.scheduled_end, tz, { hour: "numeric", minute: "2-digit" })}`;

  return (
    <div className="min-w-0">
      <Link href="/admin" className="text-sm text-muted hover:text-ink">
        ← Today
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold sm:text-3xl">
          {b.services?.name}
        </h1>
        <StatusBadge status={b.status} />
      </div>
      <p className="text-sm text-muted">
        Ref {b.ref} · via {b.source}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="min-w-0 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-sm shadow-black/5 sm:p-5">
          <h2 className="text-lg font-bold">Booking</h2>
          <dl className="mt-2 divide-y divide-border/60 text-sm">
            <Field label="When" value={when} />
            <Field label="Vehicle" value={TIER_LABEL[b.vehicle_tier]} />
            <Field label="Address" value={b.service_address} />
            <Field label="Total" value={money(b.total)} />
            <Field
              label="Access"
              value={`Water: ${access(b.water_access)} · Outlet: ${access(b.outlet_access)}`}
            />
          </dl>
        </section>

        <section className="min-w-0 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-sm shadow-black/5 sm:p-5">
          <h2 className="text-lg font-bold">Customer</h2>
          <dl className="mt-2 divide-y divide-border/60 text-sm">
            <Field label="Name" value={b.customers?.name ?? "—"} />
            <Field
              label="Phone"
              value={
                b.customers?.phone ? (
                  <a className="text-link" href={`tel:${b.customers.phone}`}>
                    {b.customers.phone}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Field label="Email" value={b.customers?.email ?? "—"} />
          </dl>
          {b.customer_notes && (
            <p className="mt-3 rounded-[var(--radius-sm)] border border-border bg-base p-2 text-sm text-muted">
              “{b.customer_notes}”
            </p>
          )}
        </section>
      </div>

      <div className="mt-4">
        <BookingActions b={b} tz={tz} />
      </div>
    </div>
  );
}

function access(v: boolean | null) {
  return v === null ? "?" : v ? "yes" : "no";
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words sm:text-right">{value}</dd>
    </div>
  );
}
