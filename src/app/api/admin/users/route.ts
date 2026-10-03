import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMasterUser, isAdminEmail } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(200));

// POST /api/admin/users — add (or change the role of) a user. Master only.
export async function POST(req: NextRequest) {
  const me = await getMasterUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = z
    .object({ email: emailSchema, role: z.enum(["manager", "editor"]) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Enter a valid email and role." }, { status: 400 });

  const { email, role } = parsed.data;
  if (isAdminEmail(email))
    return NextResponse.json({ error: "That account is already a master account." }, { status: 400 });

  const { error } = await supabaseAdmin()
    .from("admin_users")
    .upsert({ email, role, added_by: me.email });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users — remove a user's access. Master only.
export async function DELETE(req: NextRequest) {
  const me = await getMasterUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = z.object({ email: emailSchema }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { error } = await supabaseAdmin().from("admin_users").delete().eq("email", parsed.data.email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
