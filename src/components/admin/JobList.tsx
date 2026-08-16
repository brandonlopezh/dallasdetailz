import Link from "next/link";
import type { AdminBooking } from "@/lib/admin-bookings";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/admin-bookings";
import { formatInTz, TIME_OPTS } from "@/lib/tz";
import type { BookingStatus } from "@/lib/types";

const TIER_LABEL: Record<string, string> = {
  sedan: "Sedan",
  mid_suv: "Mid SUV / Truck",
  large_suv: "Large SUV",
  xl: "XL / Lifted",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function money(n: number) {
  return `$${Math.round(Number(n))}`;
}

/** Compact row for schedule / requests lists. */
export function BookingRow({ b, tz }: { b: AdminBooking; tz: string }) {
  return (
    <Link
      href={`/admin/bookings/${b.id}`}
      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3 transition-colors hover:border-accent"
    >
      <div className="w-16 shrink-0 text-sm font-semibold">
        {formatInTz(b.scheduled_start, tz, TIME_OPTS)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {b.services?.name ?? "Service"} · {b.customers?.name ?? "Customer"}
        </p>
        <p className="truncate text-xs text-muted">{b.service_address}</p>
      </div>
      <div className="shrink-0 text-right">
        <StatusBadge status={b.status} />
        <p className="mt-1 text-sm font-bold">{money(b.total)}</p>
      </div>
    </Link>
  );
}

/** Field-ready card for the Today view — call + navigate on big tap targets. */
export function TodayJob({ b, tz }: { b: AdminBooking; tz: string }) {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    b.service_address,
  )}`;
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-display)] text-xl font-extrabold">
            {formatInTz(b.scheduled_start, tz, TIME_OPTS)}
            <span className="text-muted">
              {" "}
              – {formatInTz(b.scheduled_end, tz, TIME_OPTS)}
            </span>
          </p>
          <p className="mt-0.5 font-semibold">
            {b.services?.name} · {TIER_LABEL[b.vehicle_tier]}
          </p>
        </div>
        <StatusBadge status={b.status} />
      </div>

      <p className="mt-3 text-sm">{b.customers?.name}</p>
      <p className="text-sm text-muted">{b.service_address}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {b.customers?.phone && (
          <a
            href={`tel:${b.customers.phone}`}
            className="tap inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-border px-3 text-sm"
          >
            📞 Call
          </a>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tap inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-border px-3 text-sm"
        >
          🧭 Navigate
        </a>
        <Link
          href={`/admin/bookings/${b.id}`}
          className="tap ml-auto inline-flex items-center rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-bold text-white"
        >
          Open
        </Link>
      </div>

      {(b.water_access === false || b.outlet_access === false) && (
        <p className="mt-3 rounded-[var(--radius-sm)] border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs text-warning">
          Heads up:{" "}
          {b.water_access === false && "no water access"}
          {b.water_access === false && b.outlet_access === false && " · "}
          {b.outlet_access === false && "no outlet access"}
        </p>
      )}
    </div>
  );
}
