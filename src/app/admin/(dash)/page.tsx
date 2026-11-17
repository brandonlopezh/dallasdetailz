import { requireBookingsAccess } from "@/lib/admin-guard";
import { getSettings } from "@/lib/catalog";
import { countCustomers, countRequests, listBookings, listCustomers } from "@/lib/admin-bookings";
import { BookingPopupCard } from "@/components/admin/JobList";
import TodayDashboard from "@/components/admin/TodayDashboard";
import DayJobsDialog from "@/components/admin/DayJobsDialog";
import MonthCalendar, { calendarHref, shiftMonth } from "@/components/admin/MonthCalendar";
import { dateKeyInTz, dayRangeUtc, formatInTz } from "@/lib/tz";

export const metadata = { title: "Today" };
export const dynamic = "force-dynamic";

const ACTIVE = ["confirmed", "in_progress", "completed"] as const;
// The dashboard shows a few customers; the Customers page has everyone.
const CUSTOMER_PREVIEW = 6;

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

  const [jobs, stripJobs, upcoming, customers, customerCount, requests, monthJobs] = await Promise.all([
    listBookings({ fromISO: start.toISOString(), toISO: end.toISOString(), statuses: [...ACTIVE] }),
    listBookings({ fromISO: stripStart.toISOString(), toISO: stripEnd.toISOString(), statuses: [...ACTIVE] }),
    listBookings({ fromISO: start.toISOString(), statuses: ["confirmed", "in_progress"], limit: 20 }),
    listCustomers({ limit: CUSTOMER_PREVIEW }),
    countCustomers(),
    countRequests(),
    calendarOpen
      ? listBookings({ fromISO: monthStart.toISOString(), toISO: monthEnd.toISOString(), statuses: [...ACTIVE] })
      : Promise.resolve([]),
  ]);

  const byDay = new Map<string, typeof monthJobs>();
  for (const b of monthJobs) {
    const key = dateKeyInTz(new Date(b.scheduled_start), tz);
    byDay.set(key, [...(byDay.get(key) ?? []), b]);
  }
  const selectedJobs = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <>
      <TodayDashboard
        now={now}
        tz={tz}
        todayKey={todayKey}
        jobs={jobs}
        stripJobs={stripJobs}
        upcoming={upcoming}
        customers={customers}
        customerCount={customerCount}
        requests={requests}
      />

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
    </>
  );
}
