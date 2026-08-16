import { isSupabaseConfigured, supabaseAdmin } from "./supabase/server";

export type MediaSlot = "hero" | "gallery" | "before_after";

export interface MediaRow {
  id: string;
  slot: MediaSlot;
  role: "before" | "after" | null;
  group_index: number;
  storage_path: string;
  alt: string | null;
  caption: string | null;
  sort_order: number;
  active: boolean;
}

const BUCKET = "site-media";

// Night-heavy, wet-gloss gradients (PRD §7.1). Used until real photos are
// uploaded through the admin, and as a fallback if Storage is unreachable.
export const FALLBACK_GLOSS =
  "radial-gradient(120% 120% at 70% 20%, #1e6fe8 0%, #0b1b3a 38%, #060608 100%)";
export const FALLBACK_DIRTY =
  "radial-gradient(120% 120% at 30% 30%, #3a352b 0%, #201d17 45%, #0b0a08 100%)";

/** Public URL for a Storage object in the site-media bucket. */
export function publicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

/** A CSS `background` value that covers its box with the image. */
function bg(storagePath: string): string {
  return `url('${publicUrl(storagePath)}') center / cover no-repeat`;
}

async function fetchSlot(slot: MediaSlot): Promise<MediaRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabaseAdmin()
    .from("site_media")
    .select("*")
    .eq("slot", slot)
    .eq("active", true)
    .order("group_index")
    .order("sort_order");
  if (error || !data) return [];
  return data as MediaRow[];
}

/** Hero background — first active hero image, else gloss gradient. */
export async function getHeroBackground(): Promise<string> {
  const rows = await fetchSlot("hero");
  return rows[0] ? bg(rows[0].storage_path) : FALLBACK_GLOSS;
}

/** Gallery backgrounds — active gallery images, else alternating gradients. */
export async function getGalleryBackgrounds(count = 6): Promise<string[]> {
  const rows = await fetchSlot("gallery");
  if (rows.length === 0) {
    return Array.from({ length: count }, (_, i) =>
      i % 2 ? FALLBACK_GLOSS : FALLBACK_DIRTY,
    );
  }
  return rows.slice(0, count).map((r) => bg(r.storage_path));
}

/** Before/after pairs grouped by group_index; falls back to gradient pairs. */
export async function getBeforeAfterPairs(
  count = 3,
): Promise<{ before: string; after: string }[]> {
  const rows = await fetchSlot("before_after");
  if (rows.length === 0) {
    return Array.from({ length: count }, () => ({
      before: FALLBACK_DIRTY,
      after: FALLBACK_GLOSS,
    }));
  }
  const byGroup = new Map<number, { before?: string; after?: string }>();
  for (const r of rows) {
    const g = byGroup.get(r.group_index) ?? {};
    if (r.role === "before") g.before = bg(r.storage_path);
    if (r.role === "after") g.after = bg(r.storage_path);
    byGroup.set(r.group_index, g);
  }
  const pairs: { before: string; after: string }[] = [];
  for (const g of byGroup.values()) {
    pairs.push({
      before: g.before ?? FALLBACK_DIRTY,
      after: g.after ?? FALLBACK_GLOSS,
    });
  }
  return pairs;
}
