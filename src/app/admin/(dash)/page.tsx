import Link from "next/link";
import { requireBookingsAccess } from "@/lib/admin-guard";
import { getSettings } from "@/lib/catalog";
import { listBookings, listCustomers, vehicleLabel } from "@/lib/admin-bookings";
import { BookingPopupCard, PaymentBadge, ScheduledCard, money } from "@/components/admin/JobList";
import Carousel from "@/components/admin/Carousel";
import CustomerCard from "@/components/admin/CustomerCard";
import TwoWeekStrip from "@/components/admin/TwoWeekStrip";
import DayJobsDialog from "@/components/admin/DayJobsDialog";
import MonthCalendar, { calendarHref, shiftMonth } from "@/components/admin/MonthCalendar";
import { dateKeyInTz, dayRangeUtc, formatInTz, DAY_OPTS, TIME_OPTS } from "@/lib/tz";

export const metadata = { title: "Today" };
export const dynamic = "force-dynamic";

const ACTIVE = ["confirmed", "in_progress", "completed"] as const;
const TILE = "rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-5";
const TILE_TITLE = "font-[family-name:var(--font-display)] text-xl font-extrabold";

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

  // Full-calendar popup is open whenever ?month= is present.
  const calendarOpen = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "");
  const monthKey = calendarOpen ? sp.month! : todayKey.slice(0, 7);
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(sp.day ?? "") ? sp.day : undefined;

  // Two-week strip: Sunday of this week → 14 days.
  const [y, m, d] = todayKey.split("-").map(Number);
  const weekStartKey = new Date(Date.UTC(y, m - 1, d) - new Date(Date.UTC(y, m - 1, d)).getUTCDay() * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const stripStart = dayRangeUtc(weekStartKey, tz).start;
  const stripEnd = new Date(stripStart.getTime() + 14 * 86_400_000);

  const monthStart = dayRangeUtc(`${monthKey}-01`, tz).start;
  const monthEnd = dayRangeUtc(`${shiftMonth(monthKey, 1)}-01`, tz).start;

  const [jobs, stripJobs, upcoming, customers, monthJobs] = await Promise.all([
    listBookings({ fromISO: start.toISOString(), toISO: end.toISOString(), statuses: [...ACTIVE] }),
    listBookings({ fromISO: stripStart.toISOString(), toISO: stripEnd.toISOString(), statuses: [...ACTIVE] }),
    listBookings({ fromISO: start.toISOString(), statuses: ["confirmed", "in_progress"], limit: 20 }),
    listCustomers(),
    calendarOpen
      ? listBookings({ fromISO: monthStart.toISOString(), toISO: monthEnd.toISOString(), statuses: [...ACTIVE] })
      : Promise.resolve([]),
  ]);

  const revenue = jobs.reduce((s, j) => s + Number(j.total), 0);

  const byDay = new Map<string, typeof monthJobs>();
  for (const b of monthJobs) {
    const key = dateKeyInTz(new Date(b.scheduled_start), tz);
    byDay.set(key, [...(byDay.get(key) ?? []), b]);
  }
  const selectedJobs = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-6 pt-2 sm:space-y-8">
      {/* Greeting */}
      {/* Today · Scheduled */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={TILE} aria-labelledby="today-h">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="today-h" className={TILE_TITLE}>Today</h2>
              <p className="text-sm text-muted">{formatInTz(now, tz, DAY_OPTS)}</p>
            </div>
            <p className="text-right text-sm text-muted">
              <span className="block font-[family-name:var(--font-display)] text-2xl font-extrabold text-ink">
                {jobs.length} job{jobs.length === 1 ? "" : "s"}
              </span>
              {jobs.length > 0 && <>{money(revenue)} booked</>}
            </p>
          </div>

          {jobs.length === 0 ? (
            <p className="mt-4 rounded-[var(--radius-md)] border border-dashed border-border p-6 text-center text-muted">
              No jobs scheduled today.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {jobs.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[var(--radius-md)] border border-border bg-base/40 p-3 transition-colors hover:border-accent"
                  >
                    <span className="w-16 text-sm font-extrabold">
                      {formatInTz(b.scheduled_start, tz, TIME_OPTS)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {b.services?.name ?? "Service"} · {b.customers?.name ?? "Customer"}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {vehicleLabel(b.vehicles) ?? b.service_address}
                      </span>
                    </span>
                    <PaymentBadge status={b.payment_status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>


        <section className={TILE} aria-labelledby="sched-h">
          <h2 id="sched-h" className={`${TILE_TITLE} mb-3`}>Scheduled</h2>
          {upcoming.length === 0 ? (
            <p className="text-muted">Nothing scheduled yet.</p>
          ) : (
            <Carousel label="Upcoming appointments">
              {upcoming.map((b) => (
                <ScheduledCard key={b.id} b={b} tz={tz} />
              ))}
            </Carousel>
          )}
        </section>
      </div>

      <section className={TILE} aria-labelledby="cal-h">
        <div className="flex items-center justify-between gap-3">
          <h2 id="cal-h" className={TILE_TITLE}>Next two weeks</h2>
          <Link
            href={calendarHref(todayKey.slice(0, 7))}
            className="tap inline-flex items-center rounded-[var(--radius-sm)] border border-border px-3 text-sm font-semibold text-link hover:border-accent"
          >
            View full calendar
          </Link>
        </div>
        <div className="mt-4">
          <TwoWeekStrip todayKey={todayKey} bookings={stripJobs} tz={tz} />
        </div>
      </section>

      <div className="flex justify-end">
        <Link
          href="/admin/bookings/new"
          className="tap inline-flex items-center rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-bold text-white"
        >
          + New booking
        </Link>
      </div>

      {/* Customers */}
      <section className={TILE} aria-labelledby="cust-h">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="cust-h" className={TILE_TITLE}>Customers</h2>
          <p className="text-sm text-muted">
            {customers.length} total
          </p>
        </div>
        {customers.length === 0 ? (
          <p className="mt-4 text-muted">No customers yet.</p>
        ) : (
          <>
            <ul className="mt-4 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {customers.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <CustomerCard c={c} tz={tz} />
                </li>
              ))}
            </ul>
            {customers.length > 6 && (
              <details className="group mt-3">
                <summary className="tap flex cursor-pointer list-none items-center justify-center rounded-[var(--radius-sm)] border border-border text-sm font-semibold text-link hover:border-accent">
                  <span className="group-open:hidden">Show all {customers.length} customers</span>
                  <span className="hidden group-open:inline">Show fewer</span>
                </summary>
                <ul className="mt-3 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {customers.slice(6).map((c) => (
                    <li key={c.id}>
                      <CustomerCard c={c} tz={tz} />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </section>

      {/* Full month calendar popup */}
      {calendarOpen && (
        <DayJobsDialog key="calendar" title="Calendar" closeHref="/admin" wide>
          <MonthCalendar
            monthKey={monthKey}
            todayKey={todayKey}
            selectedDay={selectedDay}
            bookings={monthJobs}
            tz={tz}
          />
        </DayJobsDialog>
      )}
      {calendarOpen && selectedDay && (
        <DayJobsDialog
          key={selectedDay}
          closeHref={calendarHref(monthKey)}
          title={formatInTz(new Date(`${selectedDay}T12:00:00Z`), "UTC", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        >
          {selectedJobs.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-border p-6 text-center text-sm text-muted">
              Nothing booked this day.
            </div>
          ) : (
            selectedJobs.map((b) => <BookingPopupCard key={b.id} b={b} tz={tz} />)
          )}
        </DayJobsDialog>
      )}
    </div>
  );
}
