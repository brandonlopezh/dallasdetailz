import { tzOffsetMinutes, zonedTimeToUtc } from "@/lib/tz";

/** PATCH a booking from the admin UI. Returns an error message, or null on success. */
export async function patchBooking(
  id: string,
  body: Record<string, unknown>,
): Promise<string | null> {
  try {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return null;
    if (res.status === 401) return "You've been signed out. Sign in again, then retry.";
    return data.error ?? "Something went wrong. Try again.";
  } catch {
    return "Couldn't reach the server. Check your connection and try again.";
  }
}

export const WHEN_OPTS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

export const whenLabel = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: tz, ...WHEN_OPTS }).format(new Date(iso));

/**
 * datetime-local value ("YYYY-MM-DDTHH:MM") for a UTC instant, shown in the
 * business timezone, so the admin sees shop time even on a device set to
 * another zone.
 */
export const toTzInput = (iso: string, tz: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() + tzOffsetMinutes(d, tz) * 60000).toISOString().slice(0, 16);
};

/** The reverse: a datetime-local value read as business time. Null if it isn't a valid date. */
export const fromTzInput = (value: string, tz: string): Date | null => {
  const m = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!m) return null;
  const d = zonedTimeToUtc(m[1], m[2], tz);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Classes that keep iOS Safari's datetime-local from overflowing its card. */
export const DATETIME_INPUT =
  "block w-full min-w-0 max-w-full appearance-none rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-3 text-[16px] text-ink";
