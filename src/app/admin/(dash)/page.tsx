import Link from "next/link";
import { requireBookingsAccess } from "@/lib/admin-guard";
import { getSettings } from "@/lib/catalog";
import { listBookings } from "@/lib/admin-bookings";
import { TodayJob } from "@/components/admin/JobList";
import RequestCard from "@/components/admin/RequestCard";
import MonthCalendar, { shiftMonth } from "@/components/admin/MonthCalendar";
import { dateKeyInTz, dayRangeUtc, formatInTz, DAY_OPTS } from "@/lib/tz";

export const metadata = { title: "Today" };
export const dynamic = "force-dynamic";

export default async function TodayView({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  await requireBookingsAccess();
  const sp = await searchParams;
  const settings = await getSettings();
  const tz = settings.timezone;
  const now = new Date();
  const todayKey = dateKeyInTz(now, tz);
  const { start, end } = dayRangeUtc(todayKey, tz);

  const monthKey = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "") ? sp.month! : todayKey.slice(0, 7);
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(sp.day ?? "") ? sp.day : undefined;
  const monthStart = dayRangeUtc(`${monthKey}-01`, tz).start;
  const monthEnd = dayRangeUtc(`${shiftMonth(monthKey, 1)}-01`, tz).start;

  const [jobs, pending, monthJobs] = await Promise.all([
    listBookings({
      fromISO: start.toISOString(),
      toISO: end.toISOString(),
      statuses: ["confirmed", "in_progress", "completed"],
    }),
    listBookings({
      statuses: ["requested"],
      order: "created",
    }),
    listBookings({
      fromISO: monthStart.toISOString(),
      toISO: monthEnd.toISOString(),
      statuses: ["confirmed", "in_progress", "completed"],
    }),
  ]);

  const requests = pending.length;
  const revenue = jobs.reduce((s, j) => s + Number(j.total), 0);

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <h1 className="text-center font-[family-name:var(--font-script)] text-5xl font-bold leading-tight sm:text-6xl">
        Aim for Greatness
      </h1>

      {/* Pending requests — first thing seen, with one-tap answers */}
      {pending.length > 0 && (
        <section className="-mt-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-warning-text">
            {pending.length} request{pending.length === 1 ? "" : "s"} waiting
          </h2>
          <div className="mt-3 grid gap-4">
            {pending.map((b) => (
              <RequestCard key={b.id} b={b} tz={tz} />
            ))}
          </div>
        </section>
      )}

      {/* Today */}
      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold">
              Today
            </h2>
            <p className="text-sm text-muted">{formatInTz(now, tz, DAY_OPTS)}</p>
          </div>
          <Link
            href="/admin/bookings/new"
            className="tap inline-flex items-center rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-bold text-white"
          >
            + New booking
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Jobs today" value={String(jobs.length)} />
          <Stat label="Booked revenue" value={`$${Math.round(revenue)}`} />
          <Link href="/admin/requests" className="block">
            <Stat label="Requests" value={String(requests)} highlight={requests > 0} />
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {jobs.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-border p-8 text-center text-muted">
              No jobs scheduled today.
            </div>
          ) : (
            jobs.map((b) => <TodayJob key={b.id} b={b} tz={tz} />)
          )}
        </div>
      </section>

      {/* Schedule */}
      <MonthCalendar
        monthKey={monthKey}
        todayKey={todayKey}
        selectedDay={selectedDay}
        bookings={monthJobs}
        tz={tz}
      />
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
      className={`min-w-0 rounded-[var(--radius-md)] border p-3 ${
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
