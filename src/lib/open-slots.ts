import "server-only";
import { computeAvailability, type BusyRange, type DaySlots } from "./availability";
import { fetchAppleCalendarBusyRanges } from "./calendarSync";
import { memo } from "./memo";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase/server";
import type { BusinessSettings } from "./types";

/**
 * Open slots for a job of `durationMin`, over the booking horizon. Busy set =
 * confirmed/in-progress bookings, admin-set availability blocks, and (if
 * configured) Apple Calendar events. Used both to list times and to check a
 * requested time when a booking is submitted.
 */
export async function getOpenDays(
  durationMin: number,
  settings: BusinessSettings,
): Promise<DaySlots[]> {
  const busy: BusyRange[] = [];
  const now = new Date();
  const horizon = new Date(now.getTime() + settings.booking_horizon_days * 86_400_000);
  // Skip old history, but keep the last day so jobs finished earlier today
  // still count toward today's job cap.
  const since = new Date(now.getTime() - 86_400_000).toISOString();

  // The calendar lookup is several round trips to iCloud, so its result is
  // reused for a minute. Bookings are always read fresh.
  const calendarBusy = memo(`caldav:${settings.timezone}:${settings.booking_horizon_days}`, 60_000, () =>
    fetchAppleCalendarBusyRanges(now, horizon, settings.timezone),
  );

  if (isSupabaseConfigured()) {
    const sb = supabaseAdmin();
    const [{ data: bookings }, { data: blocks }] = await Promise.all([
      sb
        .from("bookings")
        .select("scheduled_start, scheduled_end")
        .in("status", ["confirmed", "in_progress"])
        .gt("scheduled_end", since)
        .lt("scheduled_start", horizon.toISOString()),
      sb
        .from("availability_blocks")
        .select("starts_at, ends_at")
        .gt("ends_at", since)
        .lt("starts_at", horizon.toISOString()),
    ]);
    for (const b of bookings ?? []) {
      busy.push({
        start: new Date(b.scheduled_start).getTime(),
        end: new Date(b.scheduled_end).getTime(),
      });
    }
    for (const b of blocks ?? []) {
      busy.push({ start: new Date(b.starts_at).getTime(), end: new Date(b.ends_at).getTime() });
    }
  }

  busy.push(...(await calendarBusy));

  return computeAvailability({ serviceDurationMin: durationMin, settings, busy });
}

/** True when `startISO` is one of the open slot starts in `days`. */
export function isOpenSlot(days: DaySlots[], startISO: string): boolean {
  const t = new Date(startISO).getTime();
  return days.some((d) => d.slots.some((s) => new Date(s.start).getTime() === t));
}
