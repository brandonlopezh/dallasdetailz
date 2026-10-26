"use client";

import { bookingEvent, googleCalendarUrl } from "@/lib/calendar";
import type { AdminBooking } from "@/lib/admin-bookings";
import { BigButton } from "./Sheet";

/** "Add to my calendar" — Apple (.ics file) and Android/Google Calendar. */
export default function CalendarButtons({ b }: { b: AdminBooking }) {
  const event = bookingEvent({
    id: b.id,
    ref: b.ref,
    start: b.scheduled_start,
    end: b.scheduled_end,
    serviceName: b.services?.name ?? "Detail",
    customerName: b.customers?.name ?? "Customer",
    phone: b.customers?.phone ?? "",
    address: b.service_address,
    total: Number(b.total),
    notes: b.customer_notes,
  });
  return (
    <div className="grid gap-2">
      <BigButton href={`/api/admin/bookings/${b.id}/ics`} tone="primary">
        📅 Apple Calendar (iPhone)
      </BigButton>
      <BigButton href={googleCalendarUrl(event)} external tone="primary">
        📅 Google Calendar (Android)
      </BigButton>
    </div>
  );
}
