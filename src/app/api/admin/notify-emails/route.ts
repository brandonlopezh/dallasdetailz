import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBookingsUser } from "@/lib/auth";
import { MAX_NOTIFY_EMAILS, NOTIFY_EMAILS_KEY } from "@/lib/notify-emails";
import { supabaseAdmin } from "@/lib/supabase/server";

const bodySchema = z.object({
  emails: z
    .array(z.email("One of those emails doesn't look right.").trim().toLowerCase())
    .min(1, "Keep at least one email, or new requests won't reach anyone.")
    .max(MAX_NOTIFY_EMAILS, `${MAX_NOTIFY_EMAILS} emails max.`),
});

/**
 * PUT /api/admin/notify-emails — who gets emailed when a booking request
 * comes in. Owners and managers only (not website editors).
 */
export async function PUT(req: NextRequest) {
  if (!(await getBookingsUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid emails" },
      { status: 400 },
    );
  const emails = [...new Set(parsed.data.emails)];

  const { error } = await supabaseAdmin()
    .from("admin_settings")
    .upsert({ key: NOTIFY_EMAILS_KEY, value: emails, updated_at: new Date().toISOString() });
  if (error) {
    // 42P01 / PGRST205 = the table hasn't been created yet.
    const missing = error.code === "42P01" || error.code === "PGRST205";
    return NextResponse.json(
      {
        error: missing
          ? "One-time setup needed: run the 0015_admin_settings.sql migration in Supabase, then save again."
          : "Couldn't save the emails. Try again.",
      },
      { status: missing ? 409 : 500 },
    );
  }
  return NextResponse.json({ ok: true, emails });
}
