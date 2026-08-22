import "server-only";
import { createDAVClient } from "tsdav";
import type { BusyRange } from "./availability";

/**
 * Pulls busy blocks from an Apple/iCloud calendar via CalDAV so personal
 * events (school, practice, appointments) block booking slots too, not just
 * confirmed jobs. Set up:
 *
 *   1. Generate an app-specific password at appleid.apple.com → Sign-In and
 *      Security → App-Specific Passwords. (Do NOT use the real Apple ID
 *      password — it won't work with 2FA on, and shouldn't be handed to a
 *      third-party app regardless.)
 *   2. Set APPLE_ICLOUD_USERNAME (the Apple ID email) and
 *      APPLE_ICLOUD_APP_PASSWORD in the environment.
 *   3. Optional: set APPLE_ICLOUD_CALENDAR_NAME to the exact calendar name
 *      (as it appears in the Calendar app) to only pull busy times from
 *      that one calendar. Unset = every calendar on the account is treated
 *      as busy time, including things like Birthdays/Holidays — usually not
 *      what you want, so setting this is recommended.
 *
 * Known limitation: recurring events (repeats weekly, etc.) are read as a
 * single occurrence at their original time, not expanded across the whole
 * window. A one-off event blocks correctly; "practice every Tuesday" will
 * only show as busy on its first occurrence until this is revisited.
 * Getting recurrence expansion right (RFC 5545 RRULE) is a project of its
 * own — flagged here rather than silently getting it wrong.
 */

export function isAppleCalendarConfigured(): boolean {
  return Boolean(
    process.env.APPLE_ICLOUD_USERNAME && process.env.APPLE_ICLOUD_APP_PASSWORD,
  );
}

// Very small ICS reader — just enough to pull DTSTART/DTEND/TRANSP out of
// VEVENT blocks. Not a full RFC 5545 parser (no RRULE expansion, see above).
function parseBusyRangesFromIcs(ics: string): BusyRange[] {
  // Unfold RFC 5545 continuation lines (a line starting with a space or tab
  // is a continuation of the previous line).
  const unfolded = ics.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r\n|\n/);

  const ranges: BusyRange[] = [];
  let inEvent = false;
  let dtstart: string | null = null;
  let dtend: string | null = null;
  let transparent = false;

  const parseIcsDate = (raw: string): number | null => {
    // raw looks like "20260825T140000Z", "20260825T140000", or "20260825"
    // (all-day). TZID= form (local time in some other zone) is treated as
    // if it were in the business timezone — an approximation, but the
    // alternative is a full timezone database, which is out of scope here.
    const m = raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
    if (!m) return null;
    const [, y, mo, d, h, mi, s, z] = m;
    if (h === undefined) {
      // All-day: treat as the full day, UTC-anchored (good enough for
      // blocking purposes — see module doc for the timezone caveat).
      return Date.UTC(Number(y), Number(mo) - 1, Number(d));
    }
    const ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
    // Non-"Z" local times aren't converted from their source timezone; see
    // caveat above.
    return z ? ms : ms;
  };

  const isAllDay = (raw: string) => /^\d{8}$/.test(raw);

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      dtstart = null;
      dtend = null;
      transparent = false;
      continue;
    }
    if (line.startsWith("END:VEVENT")) {
      if (inEvent && dtstart && !transparent) {
        const startMs = parseIcsDate(dtstart);
        let endMs = dtend ? parseIcsDate(dtend) : null;
        if (startMs != null) {
          if (endMs == null) {
            // No DTEND: all-day events default to +1 day, timed events to +1hr.
            endMs = isAllDay(dtstart) ? startMs + 86_400_000 : startMs + 3_600_000;
          }
          ranges.push({ start: startMs, end: endMs });
        }
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    if (line.startsWith("DTSTART")) {
      const idx = line.indexOf(":");
      if (idx !== -1) dtstart = line.slice(idx + 1).trim();
    } else if (line.startsWith("DTEND")) {
      const idx = line.indexOf(":");
      if (idx !== -1) dtend = line.slice(idx + 1).trim();
    } else if (line.startsWith("TRANSP:TRANSPARENT")) {
      transparent = true;
    }
  }

  return ranges;
}

/**
 * Returns busy ranges from iCloud calendars in [windowStart, windowEnd].
 * Fails open (returns []) on any error or missing config — a calendar
 * outage should never take down the booking page.
 */
export async function fetchAppleCalendarBusyRanges(
  windowStart: Date,
  windowEnd: Date,
): Promise<BusyRange[]> {
  if (!isAppleCalendarConfigured()) return [];

  try {
    const client = await createDAVClient({
      serverUrl: "https://caldav.icloud.com",
      credentials: {
        username: process.env.APPLE_ICLOUD_USERNAME!,
        password: process.env.APPLE_ICLOUD_APP_PASSWORD!,
      },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });

    const calendars = await client.fetchCalendars();
    const wantName = process.env.APPLE_ICLOUD_CALENDAR_NAME;
    const targets = wantName
      ? calendars.filter((c) => c.displayName === wantName)
      : calendars;

    const all: BusyRange[] = [];
    for (const calendar of targets) {
      const objects = await client.fetchCalendarObjects({
        calendar,
        timeRange: {
          start: windowStart.toISOString(),
          end: windowEnd.toISOString(),
        },
      });
      for (const obj of objects) {
        if (obj.data) all.push(...parseBusyRangesFromIcs(obj.data));
      }
    }
    return all;
  } catch (err) {
    console.error("[calendarSync] Apple Calendar fetch failed", err);
    return [];
  }
}
