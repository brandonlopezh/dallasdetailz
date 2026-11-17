import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { getBookingsUser } from "@/lib/auth";
import { getBooking } from "@/lib/admin-bookings";
import { supabaseAdmin } from "@/lib/supabase/server";

const patchSchema = z
  .object({
    status: z
      .enum(["requested", "confirmed", "in_progress", "completed", "cancelled", "no_show"])
      .optional(),
    scheduled_start: z.string().datetime().optional(),
    scheduled_end: z.string().datetime().optional(),
    internal_notes: z.string().nullable().optional(),
    payment_status: z.enum(["unpaid", "deposit_paid", "paid"]).optional(),
    /** true = a new time was offered to the customer (request is now waiting on them). */
    offered: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

/**
 * PATCH /api/admin/bookings/[id] — change status, reschedule, edit notes, or set payment status.
 * PRD AD-5. Reschedules that collide with another confirmed job are rejected
 * by the DB exclusion constraint (409).
 *
 * After the change is saved it is written to audit_log with who made it.
 * Telling the customer is done by the operator from the dashboard's Call /
 * Text buttons (no paid messaging service is used).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getBookingsUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { offered, ...fields } = parsed.data;
  const before = await getBooking(id);
  if (!before) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const run = (update: Record<string, unknown>) =>
    supabaseAdmin()
      .from("bookings")
      .update(update)
      .eq("id", id)
      .select("id, status, scheduled_start, scheduled_end")
      .single();

  let { data, error } = await run(
    offered ? { ...fields, offered_at: new Date().toISOString() } : fields,
  );
  // 42703 = column missing (migration 0013 not applied yet): still save the change.
  if (error?.code === "42703" && offered) ({ data, error } = await run(fields));

  if (error) {
    if (error.code === "23P01")
      return NextResponse.json(
        { error: "That time overlaps another job.", code: "slot_taken" },
        { status: 409 },
      );
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Logged after the response so the dashboard isn't kept waiting.
  after(async () => {
    await supabaseAdmin()
      .from("audit_log")
      .insert({
        entity: "booking",
        entity_id: id,
        action: offered ? "offer_new_time" : "update",
        before: {
          status: before.status,
          scheduled_start: before.scheduled_start,
          scheduled_end: before.scheduled_end,
          payment_status: before.payment_status,
          internal_notes: before.internal_notes,
        },
        after: { ...fields, by: admin.email },
      })
      .then(({ error: auditErr }) => {
        if (auditErr) console.error("[audit] booking update not logged", auditErr.message);
      });
  });

  return NextResponse.json({ booking: data });
}
