"use client";

import Image from "next/image";
import BookNowLink from "./BookNowLink";
import InstagramFeed from "./InstagramFeed";
import Faq from "./Faq";
import HeroReel from "./HeroReel";
import InstagramIcon from "./icons/InstagramIcon";
import MessageIcon from "./icons/MessageIcon";
import { useLanguage } from "./LanguageProvider";
import { Fragment, type ReactNode } from "react";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site-config";
import type { SectionId } from "@/lib/content-schema";
import type { Service } from "@/lib/types";

function money(n: number) {
  return `$${Math.round(n)}`;
}

interface HomeContentProps {
  services: Service[];
}

const BLOG_URL =
  "https://brandonjlopezh.blog/2026/09/02/the-next-generation-isnt-waiting-around-they-are-taking-action/";

export default function HomeContent({ services }: HomeContentProps) {
  const { lang, t, contact, serviceTranslations, parts } = useLanguage();
  const priceFrom = (s: Service) => Math.min(...s.pricing.map((p) => p.price));
  const lowestPrice = Math.min(...services.map(priceFrom));
  const textLabel = lang === "es" ? "Envíanos un mensaje" : "Text us";

  const sections: Record<SectionId, ReactNode> = {
    services: (
      <section id="services" className="scroll-mt-20 border-b border-border bg-band-2/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
            {t.services.heading}
          </h2>
          <p className="mt-2 max-w-xl text-muted">{t.services.disclaimer}</p>
          <p className="mt-1 text-xs text-muted sm:hidden">{t.services.swipeHint}</p>
          <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
            {[...services]
              .sort((a, b) => Number(b.category === "full") - Number(a.category === "full"))
              .map((s) => {
              const es = lang === "es" ? serviceTranslations[s.id] : undefined;
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
                    <BookNowLink
                      serviceId={s.id}
                      className="tap mt-5 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-accent px-5 font-bold text-white transition-colors hover:bg-accent-hi sm:hidden"
                    >
                      {t.services.bookThis}
                    </BookNowLink>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),
    instagram: (
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
    ),
    area: (
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
    ),
    faq: (
      <section className="bg-band-2/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-center font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
            {t.faq.heading}
          </h2>
          <Faq />
        </div>
      </section>
    ),
    finalCta: (
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
    ),
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
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-accent-hi"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 12.5 9.5 18 20 6.5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <h2 className="animate-fade-up mt-6 max-w-xl text-pretty text-base italic leading-relaxed text-ink sm:text-lg [animation-delay:160ms]">
                {t.hero.summary.split("\n").map((line, i) => (
                  <span key={i} className={i > 0 ? "mt-1 block" : undefined}>
                    {line}
                  </span>
                ))}
              </h2>

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
                  <a
                    href={contact.sms}
                    aria-label={textLabel}
                    title={textLabel}
                    className="tap grid aspect-square place-items-center rounded-[var(--radius-md)] border border-border bg-surface/60 text-ink backdrop-blur transition-colors hover:border-accent hover:text-accent-hi"
                  >
                    <MessageIcon className="h-6 w-6" />
                  </a>
                </div>
                <BookNowLink className="tap inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent px-8 text-lg font-bold text-white shadow-lg shadow-accent/30 transition-colors hover:bg-accent-hi">
                  {t.common.bookNow}
                </BookNowLink>
              </div>

              <p className="animate-fade-up mt-6 text-sm text-muted [animation-delay:300ms]">
                <span className="font-semibold text-ink">{t.hero.blogText}</span>{" "}
                <span>
                {t.hero.blogMore}{" "}
                <a
                  href={BLOG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent-hi underline underline-offset-2 hover:text-ink"
                >
                  {t.hero.blogLink}
                </a>
                .
                </span>
              </p>
            </div>

            {/* Art column — a real reel in a phone frame shows the work where
                customers already watch it. Leads the hero on phones; sits
                right of the copy on wider screens. */}
            <div className="animate-fade-up relative order-first mx-auto md:order-none md:mx-0 md:mt-16 md:justify-self-start lg:-ml-6 lg:mt-24 [animation-delay:200ms]">
              <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-full bg-accent/25 blur-3xl" />
              <HeroReel
                reelUrl={parts.heroReelUrl}
                label={t.hero.reelLabel}
                watchLabel={t.hero.reelWatch}
                soundOnLabel={t.hero.soundOn}
                soundOffLabel={t.hero.soundOff}
              />
            </div>
          </div>
        </section>

        {parts.sections.map((sec) =>
          sec.visible ? <Fragment key={sec.id}>{sections[sec.id]}</Fragment> : null,
        )}
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
            <a href={contact.sms} className="link-sweep hover:text-ink">
              {textLabel}
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
