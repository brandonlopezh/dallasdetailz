import Link from "next/link";
import { requireBookingsAccess } from "@/lib/admin-guard";
import { getSettings } from "@/lib/catalog";
import { countRequests, listBookings } from "@/lib/admin-bookings";
import { TodayJob } from "@/components/admin/JobList";
import MonthCalendar, { shiftMonth } from "@/components/admin/MonthCalendar";
import { dateKeyInTz, dayRangeUtc, formatInTz, DAY_OPTS } from "@/lib/tz";

export const metadata = { title: "Today" };
export const dynamic = "force-dynamic";

function greeting(now: Date, tz: string) {
  const hour = Number(formatInTz(now, tz, { hour: "numeric", hour12: false }));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

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

  const [jobs, requests, monthJobs] = await Promise.all([
    listBookings({
      fromISO: start.toISOString(),
      toISO: end.toISOString(),
      statuses: ["confirmed", "in_progress", "completed"],
    }),
    countRequests(),
    listBookings({
      fromISO: monthStart.toISOString(),
      toISO: monthEnd.toISOString(),
      statuses: ["confirmed", "in_progress", "completed"],
    }),
  ]);

  const revenue = jobs.reduce((s, j) => s + Number(j.total), 0);

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
          {greeting(now, tz)}, welcome back.
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Here&apos;s what&apos;s on deck. Check today&apos;s jobs, look ahead on the
          calendar, approve any new requests, or jump into{" "}
          <Link href="/admin/website" className="text-accent-hi underline">
            Website Edits
          </Link>{" "}
          to update prices, text, and photos.
          {requests > 0 && (
            <>
              {" "}
              <Link href="/admin/requests" className="font-semibold text-warning underline">
                {requests} request{requests === 1 ? " is" : "s are"} waiting for your approval.
              </Link>
            </>
          )}
        </p>
      </div>

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
