import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/auth";
import { toContact } from "@/lib/content";
import {
  ALL_FIELDS,
  CONTACT_PHONE_KEY,
  HERO_REEL_KEY,
  INSTAGRAM_POSTS_KEY,
  INSTAGRAM_URL_RE,
  LANGS,
  SECTIONS_KEY,
  SECTION_IDS,
  normalizeInstagramUrl,
  type FieldKind,
} from "@/lib/content-schema";
import { supabaseAdmin } from "@/lib/supabase/server";

const text = z.string().trim().min(1).max(2000);
const VALIDATORS: Record<FieldKind, z.ZodType> = {
  text,
  textarea: text,
  list: z.array(z.string().trim().min(1).max(200)).min(1).max(40),
  faq: z.array(z.object({ q: text, a: text })).min(1).max(40),
};

// Key → validator, built from the editable-field schema so nothing outside it
// can be written to site_content.
const KEY_VALIDATORS = new Map<string, z.ZodType>();
for (const lang of LANGS)
  for (const f of ALL_FIELDS) KEY_VALIDATORS.set(`${lang}.${f.path}`, VALIDATORS[f.kind]);
KEY_VALIDATORS.set(
  CONTACT_PHONE_KEY,
  z.string().refine((v) => toContact(v) !== null, "Enter a 10-digit US phone number"),
);
const igUrl = z
  .string()
  .trim()
  .regex(INSTAGRAM_URL_RE, "Use a link like https://www.instagram.com/p/XXXX/")
  .transform(normalizeInstagramUrl);
KEY_VALIDATORS.set(INSTAGRAM_POSTS_KEY, z.array(igUrl).max(12));
KEY_VALIDATORS.set(HERO_REEL_KEY, igUrl);
const sectionId = z.enum(SECTION_IDS as [string, ...string[]]);
KEY_VALIDATORS.set(
  SECTIONS_KEY,
  z.object({ order: z.array(sectionId).max(20), hidden: z.array(sectionId).max(20) }),
);
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SERVICE_ES_KEY = /^es\.service\.[0-9a-f-]{36}\.(name|description)$/;

const bodySchema = z.object({
  // value = new override; null = remove override (back to the default)
  content: z.record(z.string(), z.unknown().nullable()).default({}),
  services: z
    .array(
      z.object({
        // Not z.uuid(): Zod 4 enforces RFC version/variant bits, which the seeded
        // ids (11111111-1111-…) don't satisfy.
        id: z.string().regex(UUID_SHAPE),
        name: z.string().trim().min(1).max(100).optional(),
        description: z.string().trim().min(1).max(1000).optional(),
        price: z.number().min(0).max(9999).optional(),
      }),
    )
    .default([]),
});

// PUT /api/admin/content — save homepage edits (copy, phone, prices).
export async function PUT(req: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const upserts: { key: string; value: unknown; updated_at: string }[] = [];
  const deletes: string[] = [];
  const now = new Date().toISOString();

  for (const [key, value] of Object.entries(parsed.data.content)) {
    if (value === null) {
      deletes.push(key);
      continue;
    }
    const validator = SERVICE_ES_KEY.test(key) ? text : KEY_VALIDATORS.get(key);
    if (!validator)
      return NextResponse.json({ error: `Not editable: ${key}` }, { status: 400 });
    const ok = validator.safeParse(value);
    if (!ok.success)
      return NextResponse.json(
        { error: `${key}: ${ok.error.issues[0]?.message ?? "invalid"}` },
        { status: 400 },
      );
    upserts.push({ key, value: ok.data, updated_at: now });
  }

  const sb = supabaseAdmin();

  if (upserts.length) {
    const { error } = await sb.from("site_content").upsert(upserts);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (deletes.length) {
    const { error } = await sb.from("site_content").delete().in("key", deletes);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // An update that matches no rows would otherwise "succeed" and change nothing
  // (e.g. the homepage is showing built-in fallback prices because the
  // services tables were never created).
  const notInDb = NextResponse.json(
    { error: "That package isn't in the database yet — run the Supabase migrations first." },
    { status: 409 },
  );

  for (const s of parsed.data.services) {
    const { price, name, description } = s;
    if (name !== undefined || description !== undefined) {
      const { data, error } = await sb
        .from("services")
        .update({
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
        })
        .eq("id", s.id)
        .select("id");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data?.length) return notInDb;
    }
    if (price !== undefined) {
      // One price per package, applied to every vehicle-size tier — matches how
      // the homepage shows a single price per service.
      const { data, error } = await sb
        .from("service_pricing")
        .update({ price })
        .eq("service_id", s.id)
        .select("id");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data?.length) return notInDb;
    }
  }

  return NextResponse.json({ ok: true });
}
