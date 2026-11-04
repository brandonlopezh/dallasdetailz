import Link from "next/link";
import type { AdminBooking } from "@/lib/admin-bookings";
import { calendarHref } from "./MonthCalendar";
import { dateKeyInTz } from "@/lib/tz";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** This week + next week as a compact grid. Tapping a day opens the full calendar on that day. */
export default function TwoWeekStrip({
  todayKey,
  bookings,
  tz,
}: {
  todayKey: string;
  bookings: AdminBooking[];
  tz: string;
}) {
  const [y, m, d] = todayKey.split("-").map(Number);
  const today = new Date(Date.UTC(y, m - 1, d));
  const sunday = today.getTime() - today.getUTCDay() * 86_400_000;
  const days = Array.from({ length: 14 }, (_, i) =>
    new Date(sunday + i * 86_400_000).toISOString().slice(0, 10),
  );

  const counts = new Map<string, number>();
  const onlyJob = new Map<string, string>();
  for (const b of bookings) {
    const key = dateKeyInTz(new Date(b.scheduled_start), tz);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    onlyJob.set(key, b.id);
  }

  return (
    <div>
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="pb-1.5">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((key) => {
          const n = counts.get(key) ?? 0;
          const isToday = key === todayKey;
          const past = key < todayKey;
          const first = key.slice(8) === "01";
          return (
            <Link
              key={key}
              href={n === 1 ? `/admin/bookings/${onlyJob.get(key)}` : calendarHref(key.slice(0, 7), key)}
              aria-label={`${key}, ${n} job${n === 1 ? "" : "s"}`}
              className={`relative flex min-h-16 flex-col sm:min-h-20 items-center justify-center rounded-[var(--radius-md)] border text-base font-semibold transition-colors hover:border-accent ${
                isToday
                  ? "border-accent bg-accent text-white"
                  : n > 0
                    ? "border-accent/40 bg-accent/15"
                    : "border-border/60 bg-base/40"
              } ${past && !isToday ? "opacity-50" : ""}`}
            >
              {first && (
                <span className="absolute left-1 top-0.5 text-[9px] font-bold uppercase opacity-70">
                  {new Date(`${key}T12:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" })}
                </span>
              )}
              {Number(key.slice(8))}
              {n > 0 && (
                <span
                  className={`mt-0.5 rounded-full px-1.5 text-[10px] font-extrabold leading-4 ${
                    isToday ? "bg-white text-accent" : "bg-accent text-white"
                  }`}
                >
                  {n}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
