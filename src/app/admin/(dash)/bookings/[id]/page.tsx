import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBookingsAccess } from "@/lib/admin-guard";
import { getSettings } from "@/lib/catalog";
import { getBooking, vehicleLabel } from "@/lib/admin-bookings";
import { StatusBadge, money } from "@/components/admin/JobList";
import BookingActions from "@/components/admin/BookingActions";
import PaymentToggle from "@/components/admin/PaymentToggle";
import { formatInTz, DAY_OPTS, TIME_OPTS } from "@/lib/tz";

export const dynamic = "force-dynamic";

const TIER_LABEL: Record<string, string> = {
  sedan: "Sedan / Coupe",
  mid_suv: "Mid SUV / Truck",
  large_suv: "Large SUV / 3-Row",
  xl: "XL / Lifted",
};

/** Emoji in a fixed box so Call / Text / Navigate icons are the same size and stay in color. */
function Emoji({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center text-base leading-none sm:h-6 sm:w-6 sm:text-xl">
      {children}
    </span>
  );
}

const CARD = "min-w-0 rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-6";
const QUICK =
  "tap inline-flex min-h-12 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-border bg-surface-alt px-2 text-sm font-semibold text-ink sm:min-h-14 sm:gap-3 sm:px-4 sm:text-[16px] transition-colors hover:border-accent";

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

  const phone = b.customers?.phone;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    b.service_address,
  )}`;

  return (
    <div className="min-w-0">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_25rem]">
        {/* Hero */}
        <section className={`${CARD} space-y-5 !p-6 sm:!p-8`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={b.status} />
            <p className="text-sm text-muted">
              Ref {b.ref} · via {b.source}
              {b.status !== "requested" && b.status !== "cancelled" && (
                <>
                  {" · "}
                  <Link href={`/admin/invoice/${b.id}`} className="text-link underline">
                    Invoice
                  </Link>
                </>
              )}
            </p>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight sm:text-5xl">
              {formatInTz(b.scheduled_start, tz, DAY_OPTS)}
            </h2>
            <p className="mt-1 text-xl font-semibold text-link sm:text-2xl">
              {formatInTz(b.scheduled_start, tz, TIME_OPTS)}
              <span className="text-muted"> – {formatInTz(b.scheduled_end, tz, TIME_OPTS)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-5">
            <p className="text-lg font-semibold">{b.services?.name}</p>
            <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
              {money(b.total)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {phone && (
              <a href={`tel:${phone}`} className={QUICK}>
                <Emoji>📞</Emoji> Call
              </a>
            )}
            {phone && (
              <a href={`sms:${phone}`} className={QUICK}>
                <Emoji>💬</Emoji> Text
              </a>
            )}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={QUICK}>
              <Emoji>🧭</Emoji> Navigate
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>

          <dl className="divide-y divide-border/60 border-t border-border pt-1">
            <Field label="Customer" value={b.customers?.name ?? "—"} />
            <Field
              label="Phone"
              value={
                phone ? (
                  <a className="text-link" href={`tel:${phone}`}>
                    {phone}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Field label="Email" value={b.customers?.email ?? "—"} />
            <Field label="Vehicle" value={vehicleLabel(b.vehicles) ?? TIER_LABEL[b.vehicle_tier]} />
            <Field label="Address" value={b.service_address} />
            <Field
              label="Access"
              value={`Water: ${access(b.water_access)} · Outlet: ${access(b.outlet_access)}`}
            />
            <Field
              label="Payment"
              value={
                <span className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span className="font-semibold">{b.payment_status === "paid" ? "Paid" : "Unpaid"}</span>
                  <PaymentToggle id={b.id} paid={b.payment_status === "paid"} />
                </span>
              }
            />
          </dl>

          {b.customer_notes && (
            <div className="rounded-[var(--radius-md)] border border-border bg-base p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Customer note</p>
              <p className="mt-1">“{b.customer_notes}”</p>
            </div>
          )}
        </section>

        {/* Actions — right column on desktop, directly under the hero on phones */}
        <div>
          <BookingActions b={b} tz={tz} />
          <div className="mt-3 flex justify-end">
            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-ink"
            >
              ← Back to dashboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

function access(v: boolean | null) {
  return v === null ? "?" : v ? "yes" : "no";
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words font-medium sm:text-right">{value}</dd>
    </div>
  );
}
