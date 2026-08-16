import Link from "next/link";
import { getSettings } from "@/lib/catalog";
import { countRequests, listBookings } from "@/lib/admin-bookings";
import { TodayJob } from "@/components/admin/JobList";
import { dateKeyInTz, dayRangeUtc, formatInTz, DAY_OPTS } from "@/lib/tz";

export const metadata = { title: "Today" };
export const dynamic = "force-dynamic";

export default async function TodayView() {
  const settings = await getSettings();
  const tz = settings.timezone;
  const now = new Date();
  const todayKey = dateKeyInTz(now, tz);
  const { start, end } = dayRangeUtc(todayKey, tz);

  const [jobs, requests] = await Promise.all([
    listBookings({
      fromISO: start.toISOString(),
      toISO: end.toISOString(),
      statuses: ["confirmed", "in_progress", "completed"],
    }),
    countRequests(),
  ]);

  const revenue = jobs.reduce((s, j) => s + Number(j.total), 0);

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
            Today
          </h1>
          <p className="text-sm text-muted">{formatInTz(now, tz, DAY_OPTS)}</p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="tap inline-flex items-center rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-bold text-white"
        >
          + New booking
        </Link>
      </div>

      {/* Quick stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Jobs today" value={String(jobs.length)} />
        <Stat label="Booked revenue" value={`$${Math.round(revenue)}`} />
        <Link href="/admin/requests" className="block">
          <Stat
            label="Requests"
            value={String(requests)}
            highlight={requests > 0}
          />
        </Link>
      </div>

      {/* Jobs */}
      <div className="mt-6 grid gap-3">
        {jobs.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-border p-8 text-center text-muted">
            No jobs scheduled today.
          </div>
        ) : (
          jobs.map((b) => <TodayJob key={b.id} b={b} tz={tz} />)
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border p-3 ${
        highlight ? "border-warning/50 bg-warning/10" : "border-border bg-surface"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        {value}
      </p>
    </div>
  );
}
