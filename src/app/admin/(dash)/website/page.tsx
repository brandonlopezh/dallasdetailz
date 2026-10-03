import WebsiteEditor from "@/components/admin/WebsiteEditor";
import { applyOverrides, getOverrides } from "@/lib/content";
import { getServices } from "@/lib/catalog";
import { ALL_FIELDS, CONTACT_PHONE_KEY, LANGS, serviceKey } from "@/lib/content-schema";
import { PHONE_DISPLAY } from "@/lib/site-config";
import { SERVICE_TRANSLATIONS, TRANSLATIONS } from "@/lib/translations";

export const metadata = { title: "Website Edits" };
export const dynamic = "force-dynamic";

function get(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj);
}

export default async function WebsiteEditsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const [overrides, services] = await Promise.all([getOverrides(), getServices()]);
  const current = applyOverrides(overrides);

  // Flat key → value maps: what's live now, and what the code ships with.
  const live: Record<string, unknown> = {};
  const defaults: Record<string, unknown> = {};
  for (const lang of LANGS)
    for (const f of ALL_FIELDS) {
      live[`${lang}.${f.path}`] = get(current.translations[lang], f.path);
      defaults[`${lang}.${f.path}`] = get(TRANSLATIONS[lang], f.path);
    }
  live[CONTACT_PHONE_KEY] = current.contact.display;
  defaults[CONTACT_PHONE_KEY] = PHONE_DISPLAY;
  for (const s of services)
    for (const f of ["name", "description"] as const) {
      live[serviceKey(s.id, f)] = current.serviceTranslations[s.id]?.[f] ?? "";
      defaults[serviceKey(s.id, f)] = SERVICE_TRANSLATIONS[s.id]?.[f] ?? "";
    }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Website Edits
      </h1>
      <p className="mt-1 text-sm text-muted">
        Pick what you want to change on the left. Hit Save and it&apos;s live on
        the site right away.
      </p>
      <div className="mt-6">
        <WebsiteEditor
          initialView={edit}
          live={live}
          defaults={defaults}
          parts={current.parts}
          services={services.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description ?? "",
            price: Math.min(...s.pricing.map((p) => p.price)),
          }))}
        />
      </div>
    </div>
  );
}
