import { NextRequest, NextResponse } from "next/server";
import { getBookingsUser } from "@/lib/auth";
import { getBooking } from "@/lib/admin-bookings";
import { bookingEvent, buildIcs } from "@/lib/calendar";

/**
 * GET /api/admin/bookings/[id]/ics — the booking as a calendar file. Served
 * as a real URL (not a blob) so iPhone Safari offers "Add to Calendar".
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getBookingsUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const b = await getBooking(id);
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ics = buildIcs(
    bookingEvent({
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
    }),
  );

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="dallas-detailz-${b.ref}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
