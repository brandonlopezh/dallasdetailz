import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBookingsUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const createSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120),
  phone: z.string().trim().min(7, "Enter a phone number.").max(30),
  email: z.union([z.literal(""), z.email("That email doesn't look right.")]).optional(),
  instagram: z.string().trim().max(60).optional(),
});

// POST /api/admin/customers — add a customer without making a booking.
export async function POST(req: NextRequest) {
  if (!(await getBookingsUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid customer" },
      { status: 400 },
    );
  const c = parsed.data;
  const sb = supabaseAdmin();

  const { data: existing } = await sb
    .from("customers")
    .select("name")
    .eq("phone", c.phone)
    .maybeSingle();
  if (existing)
    return NextResponse.json(
      { error: `That number already belongs to ${existing.name}.` },
      { status: 409 },
    );

  const { error } = await sb.from("customers").insert({
    name: c.name,
    phone: c.phone,
    email: c.email || null,
    instagram_handle: c.instagram?.replace(/^@/, "") || null,
  });
  if (error) return NextResponse.json({ error: "Couldn't save the customer." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
