import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBookingsUser } from "@/lib/auth";
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
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getBookingsUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { offered, ...fields } = parsed.data;
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

  // TODO: write audit_log entry (actor = admin) and propagate to Google
  // Calendar / notify the customer on reschedule+cancel (Phase 1 follow-ups).
  return NextResponse.json({ booking: data });
}
