import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const patchSchema = z.object({
  active: z.boolean().optional(),
  alt: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  group_index: z.number().int().optional(),
});

// PATCH /api/admin/media/[id] — toggle active, edit alt, reorder.
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
    .from("site_media")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ media: data });
}

// DELETE /api/admin/media/[id] — remove the row and its storage object.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sb = supabaseAdmin();

  const { data: row } = await sb
    .from("site_media")
    .select("storage_path")
    .eq("id", id)
    .single();

  const { error } = await sb.from("site_media").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (row?.storage_path) {
    await sb.storage.from("site-media").remove([row.storage_path]);
  }

  return NextResponse.json({ ok: true });
}
