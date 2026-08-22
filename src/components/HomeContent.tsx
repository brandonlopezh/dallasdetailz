"use client";

import Image from "next/image";
import BookNowLink from "./BookNowLink";
import InstagramNudge from "./InstagramNudge";
import InstagramFeed from "./InstagramFeed";
import Faq from "./Faq";
import { useLanguage } from "./LanguageProvider";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, PHONE_TEL } from "@/lib/site-config";
import { CATEGORY_ES, SERVICE_TRANSLATIONS } from "@/lib/translations";
import type { Service } from "@/lib/types";

function money(n: number) {
  return `$${Math.round(n)}`;
}

interface HomeContentProps {
  services: Service[];
  heroBg: string;
  hasHeroPhoto: boolean;
  hasStoryPhoto: boolean;
  storyBg: string | undefined;
}

export default function HomeContent({
  services,
  heroBg,
  hasHeroPhoto,
  hasStoryPhoto,
  storyBg,
}: HomeContentProps) {
  const { lang, t } = useLanguage();
  const priceFrom = (s: Service) => Math.min(...s.pricing.map((p) => p.price));

  return (
    <>
      <main className="flex-1 pb-24 md:pb-0">
        {/* HERO ------------------------------------------------------------ */}
        <section className="relative isolate overflow-hidden">
          {/* Background art. An operator-uploaded hero photo (admin → Images)
              wins; otherwise the shop illustration carries it. */}
          {hasHeroPhoto ? (
            <div className="absolute inset-0 -z-10" style={{ background: heroBg }} />
          ) : (
            <Image
              src="/brothers.jpg"
              alt=""
              aria-hidden="true"
              fill
              priority
              sizes="100vw"
              className="-z-10 object-cover object-center"
            />
          )}

          {/* Legibility wash: darkens the bottom for the copy, and fades the
              right side less so the artwork still reads on wide screens. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-base via-base/85 to-base/45" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-base/95 via-base/60 to-transparent" />

          <div className="relative mx-auto grid min-h-[640px] max-w-6xl gap-8 px-4 pb-16 pt-28 sm:min-h-[700px] sm:px-6 lg:min-h-[780px] lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-14 lg:pb-20">
            <div>
              <p className="animate-fade-up mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-accent-hi">
                {t.hero.eyebrow}
              </p>
              <h1 className="animate-fade-up font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase leading-[0.95] tracking-[-0.02em] sm:text-6xl">
                {t.hero.headlineLine1}
                <br />
                {t.hero.headlineLine2}
              </h1>
              <p className="animate-fade-up mt-6 max-w-lg text-lg leading-relaxed text-muted">
                {t.hero.summary}
              </p>
              <div className="animate-fade-up mt-9 flex flex-wrap gap-3">
                <BookNowLink className="tap inline-flex items-center rounded-[var(--radius-md)] bg-accent px-8 text-lg font-bold text-white transition-colors hover:bg-accent-hi">
                  {t.common.bookNow}
                </BookNowLink>
                <a
                  href="#services"
                  className="tap inline-flex items-center rounded-[var(--radius-md)] border border-border bg-surface/60 px-8 text-lg font-semibold text-ink backdrop-blur transition-colors hover:border-accent"
                >
                  {t.hero.seePricing}
                </a>
              </div>
              <div className="animate-fade-up mt-6">
                <InstagramNudge />
              </div>
            </div>

            {/* Family/trust card — was its own "Our Story" section, folded in
                here as the hero's second column instead. */}
            <div className="animate-fade-up rounded-[var(--radius-lg)] border border-border bg-surface/70 p-6 backdrop-blur lg:p-7">
              {/* Operator-managed: upload a photo of the brothers in admin →
                  Images and it appears here. */}
              {hasStoryPhoto && (
                <div
                  className="mb-5 h-36 w-full rounded-[var(--radius-md)] border border-border"
                  style={{ background: storyBg }}
                  role="img"
                  aria-label="The Dallas Detailz brothers at work"
                />
              )}
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent-hi">
                {t.familyCard.eyebrow}
              </p>
              <p className="text-lg font-medium leading-relaxed text-ink">{t.familyCard.lead}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted">{t.familyCard.body}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {t.familyCard.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-border bg-base/40 px-3 py-1.5 text-xs font-medium"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* SERVICES -------------------------------------------------------- */}
        <section id="services" className="scroll-mt-20 border-b border-border bg-band-2">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
              {t.services.heading}
            </h2>
            <p className="mt-2 max-w-xl text-muted">{t.services.disclaimer}</p>
            <p className="mt-1 text-xs text-muted sm:hidden">{t.services.swipeHint}</p>
            <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
              {services.map((s) => {
                const es = lang === "es" ? SERVICE_TRANSLATIONS[s.id] : undefined;
                const category = lang === "es" ? (CATEGORY_ES[s.category] ?? s.category) : s.category;
                const name = es?.name ?? s.name;
                const description = es?.description ?? s.description;
                return (
                  <div
                    key={s.id}
                    className="hover-lift flex w-[82%] shrink-0 snap-start flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-colors hover:border-accent sm:w-auto sm:shrink"
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-accent-hi">
                      {category}
                    </p>
                    <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
                      {name}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{description}</p>
                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
                        {money(priceFrom(s))}
                      </span>
                    </div>
                    <BookNowLink
                      serviceId={s.id}
                      className="tap mt-5 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-accent px-5 font-bold text-white transition-colors hover:bg-accent-hi"
                    >
                      {t.services.bookThis}
                    </BookNowLink>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* INSTAGRAM --------------------------------------------------------- */}
        <section className="border-b border-border bg-band-3">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
                {INSTAGRAM_HANDLE}
              </h2>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="link-sweep text-sm font-semibold text-accent-hi"
              >
                {t.instagram.visit}
              </a>
            </div>
            <InstagramFeed />
          </div>
        </section>

        {/* SERVICE AREA ---------------------------------------------------- */}
        <section id="area" className="scroll-mt-20 border-y border-border bg-band-1">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
                {t.area.heading}
              </h2>
              <p className="mt-3 text-muted">{t.area.description}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {t.area.cities.map((c) => (
                  <li
                    key={c}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mx-auto w-full max-w-[260px] overflow-hidden rounded-[var(--radius-lg)] border border-border shadow-2xl shadow-black/50 sm:max-w-[300px]">
              <Image
                src="/service-area-map.png"
                alt="Map of the Dallas Detailz service area around Duncanville and Cedar Hill, showing I-20, Belt Line Rd, Cedar Ridge Preserve, and Cedar Hill State Park"
                width={586}
                height={654}
                sizes="300px"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* FAQ ------------------------------------------------------------- */}
        <section className="bg-band-2">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="mb-8 text-center font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
              {t.faq.heading}
            </h2>
            <Faq />
          </div>
        </section>

        {/* FINAL CTA ------------------------------------------------------- */}
        <section className="border-t border-border bg-band-4">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
              {t.finalCta.heading}
            </h2>
            <BookNowLink className="tap mt-8 inline-flex items-center rounded-[var(--radius-md)] bg-accent px-8 text-lg font-bold text-white transition-colors hover:bg-accent-hi">
              {t.common.bookNow}
            </BookNowLink>
          </div>
        </section>
      </main>

      {/* FOOTER ------------------------------------------------------------ */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="Dallas Detailz logo"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full ring-1 ring-border"
            />
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-extrabold uppercase">
                Dallas Detailz
              </p>
              <p className="text-sm text-muted">{t.footer.tagline}</p>
            </div>
          </div>
          <div className="flex gap-5 text-sm text-muted">
            <a href={PHONE_TEL} className="link-sweep hover:text-ink">
              {t.footer.call}
            </a>
            <a
              href={INSTAGRAM_URL}
              className="link-sweep hover:text-ink"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.footer.instagram}
            </a>
            <BookNowLink className="link-sweep hover:text-ink">{t.footer.book}</BookNowLink>
          </div>
          <p className="text-xs text-muted">© {new Date().getFullYear()} Dallas Detailz</p>
        </div>
      </footer>
    </>
  );
}
