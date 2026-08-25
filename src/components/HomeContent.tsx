"use client";

import Image from "next/image";
import BookNowLink from "./BookNowLink";
import InstagramNudge from "./InstagramNudge";
import InstagramFeed from "./InstagramFeed";
import Faq from "./Faq";
import { useLanguage } from "./LanguageProvider";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, PHONE_TEL } from "@/lib/site-config";
import { SERVICE_TRANSLATIONS } from "@/lib/translations";
import type { Service } from "@/lib/types";

function money(n: number) {
  return `$${Math.round(n)}`;
}

interface HomeContentProps {
  services: Service[];
}

export default function HomeContent({ services }: HomeContentProps) {
  const { lang, t } = useLanguage();
  const priceFrom = (s: Service) => Math.min(...s.pricing.map((p) => p.price));

  return (
    <>
      <main className="flex-1 pb-24 md:pb-0">
        {/* WALLPAPER WRAPPER ------------------------------------------------
            Shared blurred backdrop for the entire page above the footer.
            Every section below keeps its band-color wash, just made
            translucent so the wallpaper reads through underneath. */}
        <div className="relative isolate overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-fixed bg-cover bg-center blur-sm"
            style={{ backgroundImage: "url('/wallpaper.jpg')" }}
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-base/35" />

        {/* HERO ------------------------------------------------------------ */}
        <section className="relative isolate overflow-hidden">
          {/* Legibility wash: darkens the bottom for the copy, and fades the
              right side less so the wallpaper still reads on wide screens. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-base via-base/70 to-base/30" />

          <div className="relative mx-auto flex min-h-[420px] max-w-6xl flex-col items-center justify-end gap-8 px-4 pb-16 pt-16 text-center sm:min-h-[560px] sm:px-6 sm:pt-28 lg:pb-20">
            <div className="flex w-full flex-col items-center gap-8 md:flex-row md:items-center md:justify-center">
              <Image
                src="/ad.png"
                alt="Dallas Detailz exterior detailing"
                width={200}
                height={200}
                className="hover-badge hidden h-32 w-32 shrink-0 rounded-full ring-2 ring-border md:block lg:h-40 lg:w-40"
              />

              <div className="flex flex-col items-center">
                <h1 className="animate-fade-up font-[family-name:var(--font-display)] text-5xl uppercase leading-[0.95] tracking-[-0.02em] sm:text-7xl">
                  {t.hero.title}
                </h1>
                <h2 className="animate-fade-up mx-auto mt-6 max-w-lg text-base font-normal leading-relaxed text-muted sm:text-lg">
                  {t.hero.summary}
                </h2>
                <div className="animate-fade-up mt-9 flex flex-wrap justify-center gap-3">
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
                <div className="animate-fade-up mt-8 flex justify-center gap-6 md:hidden">
                  <Image
                    src="/ad.png"
                    alt="Dallas Detailz exterior detailing"
                    width={200}
                    height={200}
                    className="hover-badge h-28 w-28 rounded-full ring-2 ring-border"
                  />
                  <Image
                    src="/iv.png"
                    alt="Dallas Detailz interior detailing"
                    width={200}
                    height={200}
                    className="hover-badge h-28 w-28 rounded-full ring-2 ring-border"
                  />
                </div>
              </div>

              <Image
                src="/iv.png"
                alt="Dallas Detailz interior detailing"
                width={200}
                height={200}
                className="hover-badge hidden h-32 w-32 shrink-0 rounded-full ring-2 ring-border md:block lg:h-40 lg:w-40"
              />
            </div>
          </div>
        </section>

        {/* SERVICES -------------------------------------------------------- */}
        <section id="services" className="scroll-mt-20 border-b border-border bg-band-2/70">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
              {t.services.heading}
            </h2>
            <p className="mt-2 max-w-xl text-muted">{t.services.disclaimer}</p>
            <p className="mt-1 text-xs text-muted sm:hidden">{t.services.swipeHint}</p>
            <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
              {services.map((s) => {
                const es = lang === "es" ? SERVICE_TRANSLATIONS[s.id] : undefined;
                const name = es?.name ?? s.name;
                const description = es?.description ?? s.description;
                return (
                  <div
                    key={s.id}
                    className="hover-lift flex w-[82%] shrink-0 snap-start flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-colors hover:border-accent sm:w-auto sm:shrink"
                  >
                    <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
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
        <section className="border-b border-border bg-band-3/70">
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
        <section id="area" className="scroll-mt-20 border-y border-border bg-band-1/70">
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
        <section className="bg-band-2/70">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="mb-8 text-center font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
              {t.faq.heading}
            </h2>
            <Faq />
          </div>
        </section>

        {/* FINAL CTA ------------------------------------------------------- */}
        <section className="border-t border-border bg-band-4/70">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
              {t.finalCta.heading}
            </h2>
            <BookNowLink className="tap mt-8 inline-flex items-center rounded-[var(--radius-md)] bg-accent px-8 text-lg font-bold text-white transition-colors hover:bg-accent-hi">
              {t.common.bookNow}
            </BookNowLink>
          </div>
        </section>
        </div>
      </main>

      {/* FOOTER ------------------------------------------------------------ */}
      <footer className="border-t border-border bg-base">
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
