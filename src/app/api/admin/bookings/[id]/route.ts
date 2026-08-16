import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const patchSchema = z
  .object({
    status: z
      .enum(["requested", "confirmed", "in_progress", "completed", "cancelled", "no_show"])
      .optional(),
    scheduled_start: z.string().datetime().optional(),
    scheduled_end: z.string().datetime().optional(),
    internal_notes: z.string().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

/**
 * PATCH /api/admin/bookings/[id] — change status, reschedule, or edit notes.
 * PRD AD-5. Reschedules that collide with another confirmed job are rejected
 * by the DB exclusion constraint (409).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .update(parsed.data)
    .eq("id", id)
    .select("id, status, scheduled_start, scheduled_end")
    .single();

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
