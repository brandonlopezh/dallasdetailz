import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBookingsUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * DELETE /api/admin/customers/[id] — permanently removes a customer, their
 * vehicles (cascade) and ALL of their bookings (their add-ons cascade).
 * bookings.customer_id has no cascade, so bookings go first; Instagram
 * threads are kept but unlinked.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getBookingsUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return NextResponse.json({ error: "Invalid customer" }, { status: 400 });

  const sb = supabaseAdmin();

  const unlink = await sb.from("ig_threads").update({ customer_id: null }).eq("customer_id", id);
  if (unlink.error) return NextResponse.json({ error: unlink.error.message }, { status: 500 });

  const bookings = await sb.from("bookings").delete().eq("customer_id", id);
  if (bookings.error) return NextResponse.json({ error: bookings.error.message }, { status: 500 });

  const customer = await sb.from("customers").delete().eq("id", id);
  if (customer.error) return NextResponse.json({ error: customer.error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
