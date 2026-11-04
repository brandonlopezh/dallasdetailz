import Link from "next/link";
import type { AdminBooking } from "@/lib/admin-bookings";
import { dateKeyInTz, formatInTz } from "@/lib/tz";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "2026-10" ± n months → "YYYY-MM". */
export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const calendarHref = (month: string, day?: string) =>
  `/admin?month=${month}${day ? `&day=${day}` : ""}`;
const href = calendarHref;

/**
 * Server-rendered month grid, shown inside the "View full calendar" popup.
 * Navigation is plain links (?month=, ?day=), so it needs no client JS. Days
 * with bookings show time chips on wider screens and a count badge on phones;
 * tapping a day opens its jobs (rendered by the Today page).
 */
export default function MonthCalendar({
  monthKey,
  todayKey,
  selectedDay,
  bookings,
  tz,
}: {
  monthKey: string;
  todayKey: string;
  selectedDay?: string;
  bookings: AdminBooking[];
  tz: string;
}) {
  const [y, m] = monthKey.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const currentMonth = todayKey.slice(0, 7);

  const byDay = new Map<string, AdminBooking[]>();
  for (const b of bookings) {
    const key = dateKeyInTz(new Date(b.scheduled_start), tz);
    byDay.set(key, [...(byDay.get(key) ?? []), b]);
  }

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => `${monthKey}-${String(i + 1).padStart(2, "0")}`,
    ),
  ];
  while (cells.length % 7) cells.push(null);

  const title = formatInTz(new Date(Date.UTC(y, m - 1, 15, 12)), "UTC", {
    month: "long",
    year: "numeric",
  });
  const navBtn =
    "tap inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-border px-3 text-sm font-semibold hover:border-accent";

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-extrabold">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {monthKey !== currentMonth && (
            <Link href={href(currentMonth)} className="text-sm text-link underline">
              This month
            </Link>
          )}
          <Link href={href(shiftMonth(monthKey, -1))} aria-label="Previous month" className={navBtn}>
            <span aria-hidden="true">←</span> Prev
          </Link>
          <Link href={href(shiftMonth(monthKey, 1))} aria-label="Next month" className={navBtn}>
            Next <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
        <div className="grid grid-cols-7 border-b border-border text-center text-xs text-muted">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((key, i) => {
            if (!key)
              return <div key={`e${i}`} className="min-h-14 border-b border-r border-border/60 bg-base/30 sm:min-h-24" />;
            const jobs = byDay.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;
            return (
              <Link
                key={key}
                href={jobs.length === 1 ? `/admin/bookings/${jobs[0].id}` : href(monthKey, key)}
                aria-label={`${key}, ${jobs.length} job${jobs.length === 1 ? "" : "s"}`}
                className={`flex min-h-14 flex-col gap-1 border-b border-r border-border/60 p-1 transition-colors hover:bg-surface-alt sm:min-h-24 sm:p-1.5 ${
                  isSelected ? "bg-accent/15 ring-1 ring-inset ring-accent" : ""
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                    isToday ? "bg-accent text-white" : ""
                  }`}
                >
                  {Number(key.slice(8))}
                </span>
                {jobs.length > 0 && (
                  <>
                    <span className="mx-auto rounded-full bg-accent px-1.5 text-[10px] font-bold text-white sm:hidden">
                      {jobs.length}
                    </span>
                    <div className="hidden flex-col gap-0.5 sm:flex">
                      {jobs.slice(0, 2).map((b) => (
                        <span
                          key={b.id}
                          className="truncate rounded bg-accent/20 px-1 text-[11px] leading-tight"
                        >
                          {formatInTz(b.scheduled_start, tz, { hour: "numeric", minute: "2-digit" })}{" "}
                          {b.customers?.name?.split(" ")[0]}
                        </span>
                      ))}
                      {jobs.length > 2 && (
                        <span className="px-1 text-[11px] text-muted">+{jobs.length - 2} more</span>
                      )}
                    </div>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {!selectedDay && <p className="mt-3 text-sm text-muted">Tap a day to open its job. Days with several jobs show a list to pick from.</p>}
    </section>
  );
}
