// "Add to my calendar" helpers — safe for both server and client. Apple
// Calendar (iPhone/Mac) and most others open an .ics file; Google Calendar
// (Android) opens a prefilled event link.

export interface CalendarEvent {
  id: string;
  title: string;
  startISO: string;
  endISO: string;
  location: string;
  description: string;
}

/** 2026-10-26T15:00:00.000Z → 20261026T150000Z */
function stamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsEscape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildIcs(e: CalendarEvent): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dallas Detailz//Admin//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@dallasdetailz.com`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.startISO)}`,
    `DTEND:${stamp(e.endISO)}`,
    `SUMMARY:${icsEscape(e.title)}`,
    `LOCATION:${icsEscape(e.location)}`,
    `DESCRIPTION:${icsEscape(e.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const qs = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(e.startISO)}/${stamp(e.endISO)}`,
    details: e.description,
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${qs}`;
}

/** Event for a booking, from the fields the admin already loads. */
export function bookingEvent(b: {
  id: string;
  ref: string;
  start: string;
  end: string;
  serviceName: string;
  customerName: string;
  phone: string;
  address: string;
  total: number;
  notes: string | null;
}): CalendarEvent {
  return {
    id: b.id,
    title: `${b.serviceName} – ${b.customerName}`,
    startISO: b.start,
    endISO: b.end,
    location: b.address,
    description: [
      `Customer: ${b.customerName}`,
      `Phone: ${b.phone}`,
      `Total: $${Math.round(b.total)}`,
      b.notes ? `Notes: ${b.notes}` : null,
      `Ref: ${b.ref}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
