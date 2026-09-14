"use client";

import Image from "next/image";
import BookNowLink from "./BookNowLink";
import InstagramFeed from "./InstagramFeed";
import Faq from "./Faq";
import HeroReel from "./HeroReel";
import InstagramIcon from "./icons/InstagramIcon";
import { useLanguage } from "./LanguageProvider";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, PHONE_SMS, PHONE_TEL } from "@/lib/site-config";
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
  const lowestPrice = Math.min(...services.map(priceFrom));
  const bookSmsHref = (s: Service) => {
    const label = t.services.smsLabels[s.category] ?? s.name;
    const template = s.category === "full" ? t.services.smsBodyFull : t.services.smsBody;
    const body = template.replace("{service}", label);
    return `${PHONE_SMS}?&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      <main className="flex-1">
        {/* WALLPAPER WRAPPER ------------------------------------------------
            Shared blurred backdrop for the entire page above the footer.
            Every section below keeps its band-color wash, just made
            translucent so the wallpaper reads through underneath. */}
        <div className="relative isolate overflow-hidden">
          <div
            aria-hidden="true"
            className="fixed inset-0 -z-20 bg-cover bg-center blur-sm"
            style={{ backgroundImage: "url('/wallpaper.webp')" }}
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-base/35" />

        {/* HERO ------------------------------------------------------------ */}
        <section className="relative isolate overflow-hidden">
          {/* Legibility wash: darkens the bottom for the copy, and fades the
              right side less so the wallpaper still reads on wide screens. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-base via-base/70 to-base/30" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 md:min-h-[600px] md:grid-cols-[1.25fr_0.75fr] lg:pb-20">
            {/* Copy column — left-aligned at every size so the eye runs
                headline → checklist → summary → CTA down one edge. */}
            <div className="flex min-w-0 flex-col items-start text-left">
              {/* Two-line title: white line on top, blue accent line below. */}
              <h1 className="animate-fade-up flex flex-col font-[family-name:var(--font-display)] text-[clamp(2rem,9vw,3.75rem)] uppercase leading-[0.95] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
                <span className="whitespace-nowrap text-ink">{t.hero.title}</span>
                <span className="mt-1 text-accent-hi">{t.hero.titleAccent}</span>
              </h1>

              {/* Trust points — filled checkboxes read as "already ticked off". */}
              <ul className="animate-fade-up mt-6 flex flex-col gap-2.5 text-sm font-semibold uppercase tracking-wide text-ink sm:flex-row sm:flex-wrap sm:gap-x-5 [animation-delay:80ms]">
                {t.hero.trust.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] bg-accent text-white shadow-md shadow-accent/40 ring-1 ring-accent-hi/60"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <p className="animate-fade-up mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg [animation-delay:160ms]">
                {t.hero.summary}
              </p>

              <div className="animate-fade-up mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row [animation-delay:240ms]">
                <div className="flex gap-3">
                  <a
                    href="#services"
                    className="tap inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface/60 px-8 text-lg font-semibold text-ink backdrop-blur transition-colors hover:border-accent"
                  >
                    {t.hero.seePricing}
                    {Number.isFinite(lowestPrice) && (
                      <span className="text-sm font-medium text-muted">
                        {t.hero.from} {money(lowestPrice)}
                      </span>
                    )}
                  </a>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.mobileBar.instagramTooltip}
                    title={t.mobileBar.instagramTooltip}
                    className="tap grid aspect-square place-items-center rounded-[var(--radius-md)] border border-border bg-surface/60 text-ink backdrop-blur transition-colors hover:border-accent hover:text-accent-hi"
                  >
                    <InstagramIcon className="h-6 w-6" />
                  </a>
                </div>
                <a
                  href={PHONE_TEL}
                  className="tap inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent px-8 text-lg font-bold text-white shadow-lg shadow-accent/30 transition-colors hover:bg-accent-hi"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.92Z" />
                  </svg>
                  {t.footer.call}
                </a>
              </div>
            </div>

            {/* Art column — a real reel in a phone frame shows the work where
                customers already watch it. Leads the hero on phones; sits
                right of the copy on wider screens. */}
            <div className="animate-fade-up relative order-first mx-auto md:order-none md:mx-0 md:mt-16 md:justify-self-start lg:-ml-6 lg:mt-24 [animation-delay:200ms]">
              <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-full bg-accent/25 blur-3xl" />
              <HeroReel
                label={t.hero.reelLabel}
                watchLabel={t.hero.reelWatch}
                soundOnLabel={t.hero.soundOn}
                soundOffLabel={t.hero.soundOff}
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
                const isBestDeal = s.category === "full";
                return (
                  <div
                    key={s.id}
                    className={`relative flex w-[82%] shrink-0 snap-start flex-col pt-3 sm:w-auto sm:shrink ${isBestDeal ? "sm:z-10" : ""}`}
                  >
                    {isBestDeal && (
                      <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                        {t.services.bestDeal}
                      </span>
                    )}
                    <div
                      className={`hover-lift flex flex-1 flex-col rounded-[var(--radius-lg)] bg-surface p-6 transition-colors ${
                        isBestDeal
                          ? "border-2 border-border hover:border-accent sm:scale-105"
                          : "border border-border hover:border-accent"
                      }`}
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
                      <a
                        href={bookSmsHref(s)}
                        className="tap mt-5 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-accent px-5 font-bold text-white transition-colors hover:bg-accent-hi sm:hidden"
                      >
                        {t.services.bookThis}
                      </a>
                    </div>
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
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-10 pb-28 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:pb-10">
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
