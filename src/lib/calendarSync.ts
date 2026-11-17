import "server-only";
import { createDAVClient } from "tsdav";
import type { BusyRange } from "./availability";
import { tzOffsetMinutes } from "./tz";

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

/** Wall-clock time in `tz` → epoch ms. Null if `tz` isn't a zone this runtime knows. */
function wallTimeToUtcMs(
  y: number, mo: number, d: number, h: number, mi: number, s: number,
  tz: string,
): number | null {
  try {
    const naive = Date.UTC(y, mo - 1, d, h, mi, s);
    return naive - tzOffsetMinutes(new Date(naive), tz) * 60_000;
  } catch {
    return null;
  }
}

// Very small ICS reader — just enough to pull DTSTART/DTEND/TRANSP out of
// VEVENT blocks. Not a full RFC 5545 parser (no RRULE expansion, see above).
export function parseBusyRangesFromIcs(ics: string, businessTz: string): BusyRange[] {
  // Unfold RFC 5545 continuation lines (a line starting with a space or tab
  // is a continuation of the previous line).
  const unfolded = ics.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r\n|\n/);

  const ranges: BusyRange[] = [];
  let inEvent = false;
  let dtstart: string | null = null;
  let dtend: string | null = null;
  let transparent = false;

  // `line` is a whole property line, e.g.
  //   DTSTART:20260825T140000Z                      (UTC)
  //   DTSTART;TZID=America/Chicago:20260825T140000  (local time in that zone)
  //   DTSTART:20260825T140000                       ("floating": business zone)
  //   DTSTART;VALUE=DATE:20260825                   (all day: business zone)
  const parseIcsDate = (line: string): number | null => {
    const idx = line.indexOf(":");
    if (idx === -1) return null;
    const raw = line.slice(idx + 1).trim();
    const tzid = line.slice(0, idx).match(/;TZID=([^;:]+)/i)?.[1]?.replace(/"/g, "");
    const m = raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
    if (!m) return null;
    const [y, mo, d, h, mi, s] = m.slice(1, 7).map((v) => Number(v ?? 0));
    if (m[7]) return Date.UTC(y, mo - 1, d, h, mi, s);
    return (
      (tzid ? wallTimeToUtcMs(y, mo, d, h, mi, s, tzid) : null) ??
      wallTimeToUtcMs(y, mo, d, h, mi, s, businessTz)
    );
  };

  const isAllDay = (line: string) => /:\d{8}\s*$/.test(line);

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

    if (line.startsWith("DTSTART")) dtstart = line;
    else if (line.startsWith("DTEND")) dtend = line;
    else if (line.startsWith("TRANSP:TRANSPARENT")) transparent = true;
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
  businessTz: string,
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
        if (obj.data) all.push(...parseBusyRangesFromIcs(obj.data, businessTz));
      }
    }
    return all;
  } catch (err) {
    console.error("[calendarSync] Apple Calendar fetch failed", err);
    return [];
  }
}
