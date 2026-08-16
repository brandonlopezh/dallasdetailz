// Small timezone helpers for the admin (business tz is America/Chicago).

/** Minutes east of UTC for `tz` at instant `date`. Chicago summer = -300. */
export function tzOffsetMinutes(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, number> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  const asUTC = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour,
    map.minute,
    map.second,
  );
  return (asUTC - date.getTime()) / 60000;
}

/** Interpret `YYYY-MM-DD` + `HH:MM` as wall-clock time in `tz` → UTC Date. */
export function zonedTimeToUtc(dateStr: string, time: string, tz: string): Date {
  const naive = new Date(`${dateStr}T${time}:00Z`);
  const offset = tzOffsetMinutes(naive, tz);
  return new Date(naive.getTime() - offset * 60000);
}

/** YYYY-MM-DD for `date` rendered in `tz`. */
export function dateKeyInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** UTC [start, end) covering the calendar day `dayKey` (YYYY-MM-DD) in `tz`. */
export function dayRangeUtc(dayKey: string, tz: string): { start: Date; end: Date } {
  const start = zonedTimeToUtc(dayKey, "00:00", tz);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

export function formatInTz(
  date: Date | string,
  tz: string,
  opts: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opts }).format(d);
}

export const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
};

export const DAY_OPTS: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
};
