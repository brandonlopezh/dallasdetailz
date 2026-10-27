import Link from "next/link";
import CancelAppointment from "./CancelAppointment";
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
      className="grid min-w-0 grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-[var(--radius-md)] border border-border bg-surface p-3 transition-colors hover:border-accent sm:grid-cols-[4.5rem_1fr_auto] sm:items-center"
    >
      <div className="text-sm font-semibold sm:row-auto">
        {formatInTz(b.scheduled_start, tz, TIME_OPTS)}
      </div>
      <div className="col-start-2 row-start-1 flex flex-col items-end gap-1 sm:col-start-3 sm:row-start-1">
        <StatusBadge status={b.status} />
        <p className="text-sm font-bold">{money(b.total)}</p>
      </div>
      <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
        <p className="font-semibold sm:truncate">
          {b.services?.name ?? "Service"} · {b.customers?.name ?? "Customer"}
        </p>
        <p className="text-xs text-muted sm:truncate">{b.service_address}</p>
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
    <div className="min-w-0 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-sm shadow-black/5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
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
      <p className="break-words text-sm text-muted">{b.service_address}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {b.customers?.phone && (
          <a
            href={`tel:${b.customers.phone}`}
            className="tap inline-flex items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-border px-3 text-sm"
          >
            📞 Call
          </a>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tap inline-flex items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-border px-3 text-sm"
        >
          🧭 Navigate
        </a>
        <Link
          href={`/admin/bookings/${b.id}`}
          className="tap col-span-2 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-bold text-white sm:ml-auto"
        >
          Open
        </Link>
      </div>

      {(b.status === "confirmed" || b.status === "in_progress") && (
        <div className="mt-2">
          <CancelAppointment b={b} tz={tz} />
        </div>
      )}

      {(b.water_access === false || b.outlet_access === false) && (
        <p className="mt-3 rounded-[var(--radius-sm)] border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs text-warning-text">
          Heads up:{" "}
          {b.water_access === false && "no water access"}
          {b.water_access === false && b.outlet_access === false && " · "}
          {b.outlet_access === false && "no outlet access"}
        </p>
      )}
    </div>
  );
}
