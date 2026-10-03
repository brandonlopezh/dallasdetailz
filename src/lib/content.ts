import "server-only";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase/server";
import { SERVICE_TRANSLATIONS, TRANSLATIONS, type Lang, type Translations } from "./translations";
import {
  CONTACT_PHONE_KEY,
  DEFAULT_PARTS,
  HERO_REEL_KEY,
  INSTAGRAM_POSTS_KEY,
  SECTIONS_KEY,
  sectionsFromStored,
  type Parts,
} from "./content-schema";
import { PHONE_DISPLAY, PHONE_TEL } from "./site-config";

export interface Contact {
  display: string;
  tel: string;
  sms: string;
}

/** Everything the homepage renders that operators can change. */
export interface SiteContent {
  translations: Record<Lang, Translations>;
  serviceTranslations: Record<string, { name: string; description: string }>;
  contact: Contact;
  parts: Parts;
}

/** Raw override rows: key → JSON value. Empty when nothing's been edited. */
export async function getOverrides(): Promise<Record<string, unknown>> {
  if (!isSupabaseConfigured()) return {};
  const { data, error } = await supabaseAdmin().from("site_content").select("key, value");
  if (error || !data) return {};
  return Object.fromEntries(data.map((r) => [r.key as string, r.value]));
}

export function digitsOnly(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
}

/** Returns null unless the input is a 10-digit US number. */
export function toContact(phone: string): Contact | null {
  const d = digitsOnly(phone);
  if (d.length !== 10) return null;
  return {
    display: `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`,
    tel: `tel:+1${d}`,
    sms: `sms:+1${d}`,
  };
}

function setPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts.slice(0, -1)) {
    const next = cur[p];
    if (typeof next !== "object" || next === null) return; // unknown path → ignore
    cur = next as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (last in cur) cur[last] = value;
}

export function applyOverrides(overrides: Record<string, unknown>): SiteContent {
  const translations = structuredClone(TRANSLATIONS);
  const serviceTranslations = structuredClone(SERVICE_TRANSLATIONS);
  let contact: Contact = {
    display: PHONE_DISPLAY,
    tel: PHONE_TEL,
    sms: PHONE_TEL.replace("tel:", "sms:"),
  };

  const parts: Parts = structuredClone(DEFAULT_PARTS);

  for (const [key, value] of Object.entries(overrides)) {
    if (key === SECTIONS_KEY) {
      parts.sections = sectionsFromStored(value);
      continue;
    }
    if (key === INSTAGRAM_POSTS_KEY) {
      if (Array.isArray(value)) parts.instagramPosts = value.filter((u) => typeof u === "string");
      continue;
    }
    if (key === HERO_REEL_KEY) {
      if (typeof value === "string" && value) parts.heroReelUrl = value;
      continue;
    }
    if (key === CONTACT_PHONE_KEY) {
      if (typeof value === "string") contact = toContact(value) ?? contact;
      continue;
    }
    const svc = key.match(/^es\.service\.([0-9a-f-]+)\.(name|description)$/);
    if (svc) {
      const [, id, field] = svc;
      if (typeof value === "string" && value.trim()) {
        const cur = serviceTranslations[id] ?? { name: "", description: "" };
        serviceTranslations[id] = { ...cur, [field]: value };
      }
      continue;
    }
    const [lang, ...rest] = key.split(".");
    if (lang === "en" || lang === "es") {
      setPath(translations[lang] as unknown as Record<string, unknown>, rest.join("."), value);
    }
  }

  return { translations, serviceTranslations, contact, parts };
}

export async function getSiteContent(): Promise<SiteContent> {
  return applyOverrides(await getOverrides());
}
