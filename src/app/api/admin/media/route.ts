import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { publicUrl } from "@/lib/media";
import { supabaseAdmin } from "@/lib/supabase/server";

const SLOTS = ["hero", "gallery", "before_after"] as const;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

// GET /api/admin/media — all media (incl. inactive) with preview URLs.
export async function GET() {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin()
    .from("site_media")
    .select("*")
    .order("slot")
    .order("group_index")
    .order("sort_order");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    media: (data ?? []).map((m) => ({ ...m, url: publicUrl(m.storage_path) })),
  });
}

// POST /api/admin/media — multipart upload: file + slot [+ role, group_index, alt].
export async function POST(req: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const slot = String(form?.get("slot") ?? "");

  if (!(file instanceof File))
    return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!SLOTS.includes(slot as (typeof SLOTS)[number]))
    return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "Use JPEG, PNG, WebP, or AVIF" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "Max file size is 8 MB" }, { status: 400 });

  const role = form?.get("role") ? String(form.get("role")) : null;
  const groupIndex = Number(form?.get("group_index") ?? 0) || 0;
  const alt = form?.get("alt") ? String(form.get("alt")) : null;

  if (slot === "before_after" && role !== "before" && role !== "after")
    return NextResponse.json(
      { error: "before_after needs role before|after" },
      { status: 400 },
    );

  const sb = supabaseAdmin();
  const path = `${slot}/${crypto.randomUUID()}-${slugify(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await sb.storage
    .from("site-media")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Append at the end of the slot's ordering.
  const { count } = await sb
    .from("site_media")
    .select("*", { count: "exact", head: true })
    .eq("slot", slot);

  const { data: row, error: insErr } = await sb
    .from("site_media")
    .insert({
      slot,
      role: slot === "before_after" ? role : null,
      group_index: slot === "before_after" ? groupIndex : 0,
      storage_path: path,
      alt,
      sort_order: count ?? 0,
    })
    .select("*")
    .single();

  if (insErr) {
    await sb.storage.from("site-media").remove([path]); // roll back the upload
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json(
    { media: { ...row, url: publicUrl(row.storage_path) } },
    { status: 201 },
  );
}
