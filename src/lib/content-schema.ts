// Which homepage fields the operators can edit from /admin/website. The code
// defaults live in translations.ts; edits are stored as overrides (see
// content.ts). Keys are "<lang>.<path into translations>" — e.g. "en.hero.title".

import { INSTAGRAM_POST_URLS } from "./instagram-posts";
import { HERO_REEL_URL } from "./site-config";
import type { Lang } from "./translations";

export type FieldKind = "text" | "textarea" | "list" | "faq";

export interface FieldDef {
  /** Dotted path inside the Translations object. */
  path: string;
  label: string;
  kind: FieldKind;
  help?: string;
}

export interface FieldGroup {
  title: string;
  fields: FieldDef[];
}

export const TEXT_GROUPS: FieldGroup[] = [
  {
    title: "Top of page",
    fields: [
      { path: "hero.title", label: "Headline (white line)", kind: "text" },
      { path: "hero.titleAccent", label: "Headline (blue line)", kind: "text" },
      { path: "hero.trust", label: "Checklist items", kind: "list", help: "One per line." },
      { path: "hero.summary", label: "Intro paragraph", kind: "textarea" },
    ],
  },
  {
    title: "Services section",
    fields: [
      { path: "services.heading", label: "Heading", kind: "text" },
      { path: "services.disclaimer", label: "Note under heading", kind: "text" },
    ],
  },
  {
    title: "Service area",
    fields: [
      { path: "area.heading", label: "Heading", kind: "text" },
      { path: "area.description", label: "Description", kind: "textarea" },
      { path: "area.cities", label: "Cities", kind: "list", help: "One per line." },
    ],
  },
  {
    title: "FAQ",
    fields: [{ path: "faq.items", label: "Questions & answers", kind: "faq" }],
  },
  {
    title: "Bottom of page",
    fields: [
      { path: "finalCta.heading", label: "Closing headline", kind: "text" },
      { path: "footer.tagline", label: "Footer tagline", kind: "text" },
    ],
  },
];

export const ALL_FIELDS: FieldDef[] = TEXT_GROUPS.flatMap((g) => g.fields);

export const LANGS: Lang[] = ["en", "es"];

export const CONTACT_PHONE_KEY = "contact.phone";
/** Spanish service name/description overrides: es.service.<id>.name|description */
export const serviceKey = (id: string, f: "name" | "description") => `es.service.${id}.${f}`;

// --- Page parts (/admin/website) ---------------------------------------------

export const SECTIONS_KEY = "site.sections";
export const INSTAGRAM_POSTS_KEY = "site.instagramPosts";
export const HERO_REEL_KEY = "site.heroReelUrl";

/** Reorderable / hideable homepage sections (the hero always stays on top). */
export const SECTION_DEFS = [
  { id: "services", label: "Services & prices" },
  { id: "instagram", label: "Instagram posts" },
  { id: "area", label: "Service area & map" },
  { id: "faq", label: "FAQ" },
  { id: "finalCta", label: "Closing call-to-action" },
] as const;
export type SectionId = (typeof SECTION_DEFS)[number]["id"];
export const SECTION_IDS = SECTION_DEFS.map((s) => s.id) as SectionId[];

export interface SectionState {
  id: SectionId;
  visible: boolean;
}

export interface Parts {
  sections: SectionState[];
  instagramPosts: string[];
  heroReelUrl: string;
}

export const DEFAULT_PARTS: Parts = {
  sections: SECTION_IDS.map((id) => ({ id, visible: true })),
  instagramPosts: INSTAGRAM_POST_URLS,
  heroReelUrl: HERO_REEL_URL,
};

/** Stored shape stays small: display order + the ids that are hidden. */
export interface StoredSections {
  order: SectionId[];
  hidden: SectionId[];
}

export function sectionsFromStored(v: unknown): SectionState[] {
  const stored = v as Partial<StoredSections> | null;
  const order = (stored?.order ?? []).filter((id): id is SectionId => SECTION_IDS.includes(id));
  // Sections added to the code later still appear (at the end) after old saves.
  const full = [...new Set([...order, ...SECTION_IDS])];
  return full.map((id) => ({ id, visible: !stored?.hidden?.includes(id) }));
}

export function sectionsToStored(sections: SectionState[]): StoredSections {
  return {
    order: sections.map((s) => s.id),
    hidden: sections.filter((s) => !s.visible).map((s) => s.id),
  };
}

export const INSTAGRAM_URL_RE = /^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?(\?.*)?$/;
/** Canonical form: https://www.instagram.com/p/XXXX/ (no tracking params). */
export function normalizeInstagramUrl(url: string): string {
  const m = url.trim().match(/^https:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/([\w-]+)/);
  return m ? `https://www.instagram.com/${m[1]}/${m[2]}/` : url.trim();
}
