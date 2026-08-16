import type { BusinessSettings } from "./types";

export interface BusyRange {
  start: number; // epoch ms
  end: number; // epoch ms
}

export interface Slot {
  start: string; // ISO
  end: string; // ISO
  label: string; // e.g. "9:00 AM"
}

export interface DaySlots {
  date: string; // YYYY-MM-DD (business tz)
  slots: Slot[];
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const SLOT_GRANULARITY_MIN = 30;

/** Minutes east of UTC for `tz` at instant `date`. Chicago summer = -300. */
function tzOffsetMinutes(date: Date, tz: string): number {
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

/** Interpret `YYYY-MM-DD` + `HH:MM` as a wall-clock time in `tz` → UTC Date. */
function zonedTimeToUtc(dateStr: string, time: string, tz: string): Date {
  const naive = new Date(`${dateStr}T${time}:00Z`); // provisional (as if UTC)
  const offset = tzOffsetMinutes(naive, tz);
  return new Date(naive.getTime() - offset * 60000);
}

/** YYYY-MM-DD for `date` rendered in `tz`. */
function dateKeyInTz(date: Date, tz: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(date); // en-CA => YYYY-MM-DD
}

function labelInTz(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** Day-of-week index (0=Sun) for `date` in `tz`. */
function weekdayInTz(date: Date, tz: string): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

/**
 * Compute open slots.
 *
 * PRD BK-1/2/3/4: availability is working hours minus the union of existing
 * bookings and calendar-busy blocks, with a buffer around every busy range,
 * a per-day job cap, and a booking lead time. Slot length = service duration.
 * Concurrency is always 1 (BK-4a): a candidate must not overlap any busy range.
 */
export function computeAvailability(params: {
  serviceDurationMin: number;
  settings: BusinessSettings;
  busy: BusyRange[];
  now?: Date;
}): DaySlots[] {
  const { serviceDurationMin, settings, busy } = params;
  const now = params.now ?? new Date();
  const tz = settings.timezone;
  const bufferMs = settings.job_buffer_min * 60_000;
  const durationMs = serviceDurationMin * 60_000;
  const earliest = now.getTime() + settings.booking_lead_time_hr * 3_600_000;

  // Expand each busy range by the buffer on both sides so jobs never touch.
  const blocked = busy.map((b) => ({
    start: b.start - bufferMs,
    end: b.end + bufferMs,
  }));

  const overlapsBlocked = (start: number, end: number) =>
    blocked.some((b) => start < b.end && end > b.start);

  const days: DaySlots[] = [];

  for (let d = 0; d < settings.booking_horizon_days; d++) {
    const dayDate = new Date(now.getTime() + d * 86_400_000);
    const dateKey = dateKeyInTz(dayDate, tz);
    const dow = weekdayInTz(dayDate, tz);
    const windows = settings.working_hours[DAY_KEYS[dow]] ?? [];
    if (windows.length === 0) continue;

    // Daily cap (BK-4): count busy ranges that fall on this day already.
    const dayStartMs = zonedTimeToUtc(dateKey, "00:00", tz).getTime();
    const dayEndMs = dayStartMs + 86_400_000;
    const jobsToday = busy.filter(
      (b) => b.start < dayEndMs && b.end > dayStartMs,
    ).length;
    if (jobsToday >= settings.daily_job_cap) continue;

    const slots: Slot[] = [];

    for (const [open, close] of windows) {
      const openMs = zonedTimeToUtc(dateKey, open, tz).getTime();
      const closeMs = zonedTimeToUtc(dateKey, close, tz).getTime();

      // Step candidate starts across the window at fixed granularity.
      for (let t = openMs; t + durationMs <= closeMs; t += SLOT_GRANULARITY_MIN * 60_000) {
        if (t < earliest) continue;
        const end = t + durationMs;
        if (overlapsBlocked(t, end)) continue;
        const startDate = new Date(t);
        slots.push({
          start: startDate.toISOString(),
          end: new Date(end).toISOString(),
          label: labelInTz(startDate, tz),
        });
      }
    }

    if (slots.length > 0) days.push({ date: dateKey, slots });
  }

  return days;
}
