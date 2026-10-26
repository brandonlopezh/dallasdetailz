import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMasterUser, isAdminEmail } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(200));

const passwordSchema = z.string().min(8, "Password must be at least 8 characters.").max(72);

/** Creates the sign-in account (or resets its password) so no one has to
 * visit the Supabase dashboard. Returns an error message, or null on success. */
async function setLoginPassword(email: string, password: string): Promise<string | null> {
  const admin = supabaseAdmin().auth.admin;
  const created = await admin.createUser({ email, password, email_confirm: true });
  if (!created.error) return null;

  // Already has a sign-in account → find it and change the password.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.listUsers({ page, perPage: 200 });
    if (error) return error.message;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) {
      const { error: upErr } = await admin.updateUserById(found.id, { password });
      return upErr?.message ?? null;
    }
    if (data.users.length < 200) break;
  }
  return created.error.message;
}

// POST /api/admin/users — add (or change the role of) a user. Master only.
export async function POST(req: NextRequest) {
  const me = await getMasterUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = z
    .object({
      email: emailSchema,
      role: z.enum(["master", "manager", "editor"]),
      password: passwordSchema.optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues.find((i) => i.path[0] === "password")?.message ?? "Enter a valid email and role." },
      { status: 400 },
    );

  const { email, role, password } = parsed.data;
  if (isAdminEmail(email))
    return NextResponse.json({ error: "That account is already a master account." }, { status: 400 });

  const { error } = await supabaseAdmin()
    .from("admin_users")
    .upsert({ email, role, added_by: me.email });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (password) {
    const pwError = await setLoginPassword(email, password);
    if (pwError)
      return NextResponse.json({ error: `Added, but couldn't set the password: ${pwError}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// PUT /api/admin/users — set a new password for an existing user. Master only.
export async function PUT(req: NextRequest) {
  const me = await getMasterUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = z
    .object({ email: emailSchema, password: passwordSchema })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );

  const { data } = await supabaseAdmin()
    .from("admin_users")
    .select("email")
    .eq("email", parsed.data.email)
    .maybeSingle();
  // Masters can set their own password too; no one else's.
  if (!data && parsed.data.email !== me.email.toLowerCase())
    return NextResponse.json({ error: "That user isn't on the list." }, { status: 404 });

  const pwError = await setLoginPassword(parsed.data.email, parsed.data.password);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users — remove a user's access. Master only.
export async function DELETE(req: NextRequest) {
  const me = await getMasterUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = z.object({ email: emailSchema }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  if (parsed.data.email === me.email.toLowerCase())
    return NextResponse.json({ error: "You can't remove your own access." }, { status: 400 });

  const { error } = await supabaseAdmin().from("admin_users").delete().eq("email", parsed.data.email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
