"use client";

import Image from "next/image";
import { useBookingModal } from "./BookingModal";
import BookNowLink from "./BookNowLink";
import CarWashPattern from "./CarWashPattern";
import InstagramFeed from "./InstagramFeed";
import Faq from "./Faq";
import HeroReel from "./HeroReel";
import ServiceDetailsDialog from "./ServiceDetailsDialog";
import InstagramIcon from "./icons/InstagramIcon";
import MessageIcon from "./icons/MessageIcon";
import { useLanguage } from "./LanguageProvider";
import { Fragment, useState, type ReactNode } from "react";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site-config";
import type { SectionId } from "@/lib/content-schema";
import type { Service } from "@/lib/types";
import { SERVICE_DETAILS, SERVICE_PITCH } from "@/lib/translations";

// Fixed catalog ids of the two services the Full Detail package combines.
const EXTERIOR_ID = "11111111-1111-1111-1111-111111111111";
const INTERIOR_ID = "22222222-2222-2222-2222-222222222222";

// Typical market price of a full detail, used in the Best Deal card's blurb.
const FULL_DETAIL_VALUE = 120;

function money(n: number) {
  return `$${Math.round(n)}`;
}

interface HomeContentProps {
  services: Service[];
}

// The headline, with a glowing sparkle in place of the dot of the first "i" in
// its last word ("A Showroom Shine" → the i in Shine). That letter is drawn as
// a dotless "ı" (the script font has it) and a zero-width marker right before
// it holds the star, so the star takes the dot's spot. The visual copy is
// hidden from assistive tech; a plain-text copy keeps the real headline.
function TitleWithSparkle({ title }: { title: string }) {
  const at = title.indexOf("i", title.lastIndexOf(" ") + 1);
  if (at === -1) return <>{title}</>;
  return (
    <>
      <span className="sr-only">{title}</span>
      <span aria-hidden="true">
        {title.slice(0, at)}
        <span className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="pointer-events-none absolute left-[0.04em] top-[0.1em] h-[0.34em] w-[0.34em] text-sky-100 [filter:drop-shadow(0_0_3px_rgb(56_189_248))_drop-shadow(0_0_8px_rgb(59_130_246))]"
          >
            <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" />
          </svg>
        </span>
        {"\u0131"}
        {title.slice(at + 1)}
      </span>
    </>
  );
}

export default function HomeContent({ services }: HomeContentProps) {
  const { lang, t, contact, serviceTranslations, parts } = useLanguage();
  const { open: openBooking } = useBookingModal();
  const [detailsId, setDetailsId] = useState<string | null>(null);
  // The Full Detail package is Exterior + Interior, so its popup lists both
  // services' checklists under their own names.
  const fullDetailGroups = (id: string) => {
    if (services.find((x) => x.id === id)?.category !== "full") return undefined;
    return [EXTERIOR_ID, INTERIOR_ID].flatMap((sid) => {
      const items = SERVICE_DETAILS[sid]?.[lang];
      if (!items) return [];
      const name =
        (lang === "es" ? serviceTranslations[sid]?.name : undefined) ??
        services.find((x) => x.id === sid)?.name ??
        "";
      return [{ title: name, items }];
    });
  };
  const priceFrom = (s: Service) => Math.min(...s.pricing.map((p) => p.price));
  const lowestPrice = Math.min(...services.map(priceFrom));
  const textLabel = lang === "es" ? "Envíanos un mensaje" : "Text us";

  const sections: Record<SectionId, ReactNode> = {
    services: (
      <section id="services" className="scroll-mt-20 border-b border-border bg-band-2/70">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
            {t.services.heading}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted">{t.services.disclaimer}</p>
          <p className="mt-1 text-center text-xs text-muted sm:hidden">{t.services.swipeHint}</p>
          <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
            {[...services]
              .sort((a, b) => Number(b.category === "full") - Number(a.category === "full"))
              .map((s) => {
              const es = lang === "es" ? serviceTranslations[s.id] : undefined;
              const name = es?.name ?? s.name;
              const description = es?.description ?? s.description;
              const isBestDeal = s.category === "full";
              const details = SERVICE_DETAILS[s.id]?.[lang];
              const pitch = SERVICE_PITCH[s.id]?.[lang];
              // No pitch: show the description, with everything after its first
              // sentence on its own line (e.g. Full Detail's "Our most-booked…").
              const text = description ?? "";
              const cut = text.indexOf(". ");
              const firstSentence = cut === -1 ? text : text.slice(0, cut + 1);
              const restSentences = cut === -1 ? "" : text.slice(cut + 2);
              // Best Deal card only: frames the price against what a full detail
              // typically costs. Skipped if our price ever reaches that value.
              const valueLine =
                isBestDeal && FULL_DETAIL_VALUE > priceFrom(s)
                  ? lang === "es"
                    ? `¡Un valor de ${money(FULL_DETAIL_VALUE)} por la mitad del precio!`
                    : `A ${money(FULL_DETAIL_VALUE)} value for half the price!`
                  : null;
              return (
                <div
                  key={s.id}
                  className={`relative flex w-[82%] shrink-0 snap-start flex-col pt-11 sm:w-auto sm:shrink ${isBestDeal ? "sm:z-10" : ""}`}
                >
                  {/* The whole card opens the booking popup. Clicks on the real
                      buttons inside are left to them (keyboard + screen readers
                      use those), so the popup never opens twice. */}
                  <div
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button, details")) return;
                      openBooking(s.id);
                    }}
                    className={`hover-lift group relative flex flex-1 cursor-pointer flex-col rounded-[var(--radius-lg)] bg-surface p-6 transition-colors ${
                      isBestDeal
                        ? "border-2 border-link/60 shadow-xl shadow-link/15 hover:border-link motion-safe:sm:hover:scale-[1.06]"
                        : "border border-border hover:border-accent"
                    }`}
                  >
                    {isBestDeal && (
                      <span className="absolute bottom-full right-2 mb-1 font-[family-name:var(--font-script)] text-[2.1rem] font-bold leading-none text-white [text-shadow:0_0_6px_rgb(255_255_255/0.7),0_0_14px_rgb(96_165_250/0.8)]">
                        {t.services.bestDeal}
                      </span>
                    )}
                    <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                      {name}
                    </h3>
                    <div className="mt-3 flex-1">
                      {/* On the Best Deal card the first sentence ("Everything in
                          Exterior + Interior.") becomes the link below the blurb
                          instead of leading it, like "What's included +" elsewhere. */}
                      {(() => {
                        const asLink = isBestDeal && !pitch && !!firstSentence;
                        const lead = asLink ? "" : (pitch ?? firstSentence);
                        const rest = [!pitch && restSentences, valueLine].filter(Boolean).join(" ");
                        return (
                          <>
                            {(lead || rest) && (
                              <p className="text-sm italic leading-relaxed text-ink">
                                {lead}
                                {rest && (
                                  <span className={`block text-ink ${lead ? "mt-2" : ""}`}>{rest}</span>
                                )}
                              </p>
                            )}
                            {asLink && (
                              // Opens a popup listing the Exterior and Interior
                              // services this package combines.
                              <button
                                type="button"
                                onClick={() => setDetailsId(s.id)}
                                className="mt-3 cursor-pointer text-left text-sm font-semibold text-link underline-offset-4 hover:underline"
                              >
                                {firstSentence.replace(/\.$/, "")} <span aria-hidden="true">+</span>
                              </button>
                            )}
                          </>
                        );
                      })()}
                      {details && (
                        <button
                          type="button"
                          onClick={() => setDetailsId(s.id)}
                          className="mt-3 text-sm font-semibold text-link underline-offset-4 hover:underline"
                        >
                          {t.services.included} <span aria-hidden="true">+</span>
                        </button>
                      )}
                    </div>
                    <div className="mt-5 flex flex-col items-start gap-3">
                      <span
                        className={`font-[family-name:var(--font-display)] font-extrabold ${isBestDeal ? "text-5xl" : "text-3xl"}`}
                      >
                        {money(priceFrom(s))}
                      </span>
                      <BookNowLink
                        serviceId={s.id}
                        className="hidden origin-left py-1 text-sm font-semibold italic text-link opacity-0 duration-200 ease-[ease] focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 sm:inline-block motion-safe:transition-[opacity,transform] motion-safe:group-hover:scale-125"
                      >
                        {t.services.wantThis} <span aria-hidden="true">⤴&#xFE0E;</span>
                      </BookNowLink>
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
        <div className="mx-auto w-[90%] max-w-6xl sm:w-auto px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
              {INSTAGRAM_HANDLE}
            </h2>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link-sweep text-sm font-semibold text-link"
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
        <div className="mx-auto grid w-[90%] max-w-6xl sm:w-auto gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase tracking-tight">
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
              src="/service-area-map.webp"
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
      <>
        <section className="bg-band-2/70">
          <div className="mx-auto w-[90%] max-w-6xl sm:w-auto px-4 py-16 sm:px-6">
            <h2 className="mb-8 text-center font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
              {t.faq.heading}
            </h2>
            <Faq />
          </div>
        </section>
      </>
    ),
    finalCta: (
      <section className="border-t border-border bg-band-4/70">
        <div className="mx-auto w-[90%] max-w-6xl sm:w-auto px-4 py-20 text-center sm:px-6">
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
            Shared blurred backdrop for the entire page above the footer, with
            small car-wash icons scattered over it. Every section below keeps
            its band-color wash, just made translucent so the wallpaper and
            icons read through underneath. */}
        <div className="relative isolate overflow-hidden">
          <div
            aria-hidden="true"
            className="fixed inset-0 -z-20 bg-black bg-[length:auto_90%] bg-center bg-no-repeat blur-sm brightness-[0.28] md:bg-cover"
            style={{ backgroundImage: "url('/wallpaper.webp')" }}
          />
          <CarWashPattern />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-base/5" />

        {/* HERO ------------------------------------------------------------ */}
        <section className="relative isolate overflow-hidden">
          {/* Legibility wash: darkens the bottom for the copy, and fades the
              right side less so the wallpaper still reads on wide screens. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-base/60 via-base/25 to-transparent" />

          <div className="relative mx-auto grid w-[90%] max-w-6xl sm:w-auto items-center gap-12 px-4 pb-16 pt-16 sm:px-6 md:min-h-[600px] md:grid-cols-[minmax(0,42rem)_auto] md:justify-center md:gap-10 lg:gap-16 lg:pb-20">
            {/* Copy column — centered on phones (where it leads the page),
                left-aligned from md up so the eye runs headline → checklist
                → summary → CTA down one edge beside the reel. */}
            <div className="relative isolate flex min-w-0 flex-col items-center text-center md:items-start md:text-left">
              {/* Soft dark glow behind the copy so the icons can run behind it
                  without hurting legibility; blurred, so there's no hard box. */}
              <div aria-hidden="true" className="absolute -inset-x-6 -inset-y-8 -z-10 rounded-[2rem] bg-black/65 blur-2xl" />
              {/* Two-line title: white line on top, blue accent line below. */}
              <h1 className="animate-fade-up flex flex-col font-[family-name:var(--font-display)] text-[clamp(2.25rem,11.5vw,3.75rem)] uppercase leading-[0.95] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
                <span className="whitespace-nowrap font-[family-name:var(--font-script)] normal-case tracking-normal text-ink [text-shadow:0_0_6px_rgb(255_255_255/0.7),0_0_14px_rgb(96_165_250/0.8)] max-md:[text-shadow:0_2px_4px_rgb(0_0_0/0.9),0_0_14px_rgb(0_0_0/0.8)]"><TitleWithSparkle title={t.hero.title} /></span>
                {/* Small, wide-spaced tagline. From md up it starts under the first
                    real word of the title ("A Showroom Shine" → under the S): an
                    invisible copy of a leading article ("A ") in the title's own
                    font sets the indent, so it stays aligned if the headline is
                    edited. No indent when the title has no leading article. */}
                <span className="mt-1 flex items-baseline whitespace-nowrap text-link md:-mt-3 lg:-mt-4 max-md:text-left max-md:[text-shadow:0_2px_4px_rgb(0_0_0/0.9),0_0_14px_rgb(0_0_0/0.8)]">
                  {/^\S{1,2}\s/.test(t.hero.title) && (
                    <span
                      aria-hidden="true"
                      className="invisible hidden font-[family-name:var(--font-script)] normal-case tracking-normal md:inline"
                    >
                      {t.hero.title.split(" ")[0]}&nbsp;
                    </span>
                  )}
                  <span className="relative text-[5.4vw] tracking-[0.06em] sm:text-2xl md:text-[0.36em] md:tracking-[0.1em] md:[word-spacing:-0.12em]">
                    {t.hero.titleAccent}
                  </span>
                </span>
              </h1>

              <h2 className="animate-fade-up mx-auto mt-6 max-w-xl text-pretty text-base italic leading-relaxed text-ink sm:text-lg md:mx-0 max-md:[text-shadow:0_2px_4px_rgb(0_0_0/0.9),0_0_14px_rgb(0_0_0/0.8)] [animation-delay:80ms]">
                {t.hero.summary.split("\n").map((line, i) => (
                  <span key={i} className={i > 0 ? "mt-1 block" : undefined}>
                    {line}
                  </span>
                ))}
              </h2>

              {/* Trust points — filled checkboxes read as "already ticked off". */}
              <ul className="animate-fade-up mt-6 flex w-full flex-col items-start gap-2.5 pl-6 text-left sm:pl-0 text-sm font-semibold uppercase tracking-wide text-ink sm:flex-row sm:flex-wrap sm:gap-x-5 [animation-delay:160ms]">
                {t.hero.trust.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-link"
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

              <div className="animate-fade-up mt-9 flex w-full flex-col gap-3 sm:w-auto md:flex-row md:items-stretch [animation-delay:240ms]">
                <div className="flex gap-3">
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.mobileBar.instagramTooltip}
                    title={t.mobileBar.instagramTooltip}
                    className="tap grid aspect-square place-items-center rounded-[var(--radius-md)] border border-border bg-surface/60 text-ink backdrop-blur transition-colors hover:border-accent hover:text-link"
                  >
                    <InstagramIcon className="h-6 w-6" />
                  </a>
                  <a
                    href={contact.sms}
                    aria-label={textLabel}
                    title={textLabel}
                    className="tap grid aspect-square place-items-center rounded-[var(--radius-md)] border border-border bg-surface/60 text-ink backdrop-blur transition-colors hover:border-accent hover:text-link"
                  >
                    <MessageIcon className="h-6 w-6" />
                  </a>
                  <a
                    href="#services"
                    className="tap inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-md)] border border-border bg-surface/60 px-3 text-sm font-semibold sm:gap-2 sm:px-8 sm:text-lg text-ink backdrop-blur transition-colors hover:border-accent"
                  >
                    {t.hero.seePricing}
                    {Number.isFinite(lowestPrice) && (
                      <span className="text-xs font-medium sm:text-sm text-muted">
                        {t.hero.from} {money(lowestPrice)}
                      </span>
                    )}
                  </a>
                </div>
                <BookNowLink className="tap inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-accent px-8 text-lg font-bold text-white shadow-lg shadow-accent/30 transition-colors hover:bg-accent-hi">
                  {t.common.bookNow}
                </BookNowLink>
              </div>
            </div>

            {/* Art column — a real reel in a phone frame shows the work where
                customers already watch it. Sits right of the copy on wider
                screens; hidden on phones, where it only pushed the headline
                and CTAs down. */}
            <div className="animate-fade-up relative order-first mx-auto hidden md:order-none md:mx-0 md:block md:mt-20 md:-ml-8 md:justify-self-start lg:-ml-20 lg:mt-28 [animation-delay:200ms]">
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
        <div className="mx-auto flex w-[90%] max-w-6xl sm:w-auto flex-col gap-4 px-4 pt-10 pb-28 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:pb-10">
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
      {detailsId && (SERVICE_DETAILS[detailsId]?.[lang] || fullDetailGroups(detailsId)) && (
        <ServiceDetailsDialog
          title={
            (lang === "es" ? serviceTranslations[detailsId]?.name : undefined) ??
            services.find((x) => x.id === detailsId)?.name ??
            ""
          }
          heading={t.services.included}
          items={SERVICE_DETAILS[detailsId]?.[lang]}
          groups={fullDetailGroups(detailsId)}
          closeLabel={t.services.close}
          onClose={() => setDetailsId(null)}
        />
      )}
    </>
  );
}
