import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import MobileBookBar from "@/components/MobileBookBar";
// TEMPORARILY HIDDEN: BeforeAfterSlider powers "The difference" section below.
// import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import Faq from "@/components/Faq";
import { getServices } from "@/lib/catalog";
import {
  // TEMPORARILY HIDDEN: feeds "The difference" + "Recent work" sections below.
  // getBeforeAfterPairs,
  getGalleryBackgrounds,
  getHeroBackground,
} from "@/lib/media";

const CITIES = ["Duncanville", "Cedar Hill", "DeSoto", "Grand Prairie", "Dallas", "Greater DFW"];

function money(n: number) {
  return `$${Math.round(n)}`;
}

export default async function Home() {
  // Images are operator-managed (admin → Images). These getters return real
  // uploads when present, else night-heavy gradient stand-ins (PRD §7.1).
  // TEMPORARILY HIDDEN: gallery(6) + getBeforeAfterPairs(3) come back when the
  // "Recent work" and "The difference" sections below are un-commented.
  const [services, heroBg, [storyBg]] = await Promise.all([
    getServices(),
    getHeroBackground(),
    getGalleryBackgrounds(1),
  ]);
  const priceFrom = (s: (typeof services)[number]) =>
    Math.min(...s.pricing.map((p) => p.price));

  // Media getters fall back to CSS gradients when nothing is uploaded. A real
  // upload comes back as `url(...)`, which is how we know to show the photo.
  const hasStoryPhoto = storyBg?.startsWith("url(") ?? false;
  const hasHeroPhoto = heroBg.startsWith("url(");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDetailing",
    name: "Dallas Detailz",
    description: "Mobile auto detailing serving Duncanville, Dallas, and greater DFW.",
    areaServed: CITIES.map((c) => ({ "@type": "City", name: c })),
    priceRange: "$$",
    telephone: "+1-214-991-3908",
    address: { "@type": "PostalAddress", addressLocality: "Dallas", addressRegion: "TX", addressCountry: "US" },
    makesOffer: services.map((s) => ({
      "@type": "Offer",
      name: s.name,
      priceCurrency: "USD",
      price: priceFrom(s),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

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

          <div className="relative mx-auto flex min-h-[640px] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:min-h-[700px] sm:px-6 lg:min-h-[780px] lg:pb-20">
            <div className="max-w-2xl">
              <p className="animate-fade-up mb-5 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-accent-hi">
                <span className="h-px w-8 bg-accent-hi/60" />
                Mobile detailing DFW
              </p>
              <h1 className="animate-fade-up font-[family-name:var(--font-display)] text-[2.6rem] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] sm:text-6xl">
                Nobody puts in
                <br />
                the work like us{" "}
                <span role="img" aria-label="flexed biceps">
                  💪
                </span>
              </h1>
              <p className="animate-fade-up mt-6 max-w-lg text-lg leading-relaxed text-muted">
                Two brothers, a truckload of gear, and your driveway.
                Providing exterior, interior, and full details across
                Duncanville, Dallas, and Cedar Hill.
              </p>
              <div className="animate-fade-up mt-9 flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="tap inline-flex items-center rounded-[var(--radius-md)] bg-accent px-8 text-lg font-bold text-white transition-colors hover:bg-accent-hi"
                >
                  Book Now
                </Link>
                <a
                  href="#services"
                  className="tap inline-flex items-center rounded-[var(--radius-md)] border border-border bg-surface/60 px-8 text-lg font-semibold text-ink backdrop-blur transition-colors hover:border-accent"
                >
                  See Pricing
                </a>
              </div>
              <p className="animate-fade-up mt-6 text-sm text-muted">
                Booking takes about 90 seconds. No deposit, no account.
              </p>
            </div>
          </div>
        </section>

        {/* OUR STORY ------------------------------------------------------- */}
        <section
          id="story"
          className="scroll-mt-20 border-y border-border bg-band-3"
        >
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <p className="mb-4 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-accent-hi">
              <span className="h-px w-8 bg-accent-hi/60" />
              Our story
            </p>
            <h2 className="max-w-4xl font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-5xl">
              Two brothers, one bucket at a time.
            </h2>

            <div className="mt-4 rule" />

            <p className="mt-8 max-w-4xl text-lg leading-relaxed text-muted">
              We&apos;re fraternal twins, still in high school, and we started
              Dallas Detailz to make our family proud and show them we can
              excel into whatever we put our minds to.
            </p>

            <p className="mt-6 max-w-4xl text-xl font-medium leading-relaxed text-ink">
              When you book us, you&apos;re not hiring a franchise. You&apos;re
              backing two brothers who show up on time, work hard, and make
              your vehicle shine like it should.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-8 gap-y-6">
              <ul className="flex flex-wrap gap-2">
                {[
                  "Family-run",
                  "Raised in Oak Cliff",
                  "Every job done with care",
                ].map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium"
                  >
                    {tag}
                  </li>
                ))}
              </ul>

              {/* Operator-managed: upload a photo of the brothers in admin →
                  Images and it appears here alongside the tags. */}
              {hasStoryPhoto && (
                <div
                  className="h-28 w-40 shrink-0 rounded-[var(--radius-md)] border border-border"
                  style={{ background: storyBg }}
                  role="img"
                  aria-label="The Dallas Detailz brothers at work"
                />
              )}
            </div>
          </div>
        </section>

        {/* TEMPORARILY HIDDEN — "The difference" before/after proof strip.
            To restore: un-comment this block, re-add the BeforeAfterSlider
            import and the getBeforeAfterPairs(3) fetch at the top of this file.

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
              The difference
            </h2>
            <p className="hidden text-sm text-muted sm:block">Drag to reveal →</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {beforeAfter.map((pair, i) => (
              <BeforeAfterSlider key={i} before={pair.before} after={pair.after} />
            ))}
          </div>
        </section>
        */}

        {/* SERVICES -------------------------------------------------------- */}
        <section id="services" className="scroll-mt-20 border-b border-border bg-band-2">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
              Pick your service
            </h2>
            <p className="mt-2 max-w-xl text-muted">
              Prices shown are final, we accept Zelle and Cash only.
            </p>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-colors hover:border-accent"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-accent-hi">
                    {s.category}
                  </p>
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
                    {s.name}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {s.description}
                  </p>
                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
                      {money(priceFrom(s))}
                    </span>
                  </div>
                  <Link
                    href={`/book?service=${s.id}`}
                    className="tap mt-5 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-accent px-5 font-bold text-white transition-colors hover:bg-accent-hi"
                  >
                    Book this
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS ---------------------------------------------------- */}
        <section className="bg-band-1"><div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
            How it works
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              { n: "1", t: "Pick your service", d: "Choose your vehicle and package. Price updates live." },
              { n: "2", t: "Pick your time", d: "See real open slots for the next 3 weeks and lock one in." },
              { n: "3", t: "We show up", d: "We roll to your driveway with everything and get to work." },
            ].map((step) => (
              <div key={step.n} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-accent font-[family-name:var(--font-display)] text-lg font-extrabold text-white">
                  {step.n}
                </span>
                <h3 className="mt-4 text-xl font-bold">{step.t}</h3>
                <p className="mt-2 text-muted">{step.d}</p>
              </div>
            ))}
          </div>
        </div></section>

        {/* TEMPORARILY HIDDEN — "Recent work" gallery.
            To restore: un-comment this block and change the media fetch at the
            top of this file back to getGalleryBackgrounds(6) destructured as
            `gallery`. Also re-add the Gallery link to NAV in SiteHeader.tsx.

        <section id="gallery" className="scroll-mt-20 border-y border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
                Recent work
              </h2>
              <a
                href="https://instagram.com/dallasdetailz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-accent-hi hover:underline"
              >
                @dallasdetailz →
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.map((background, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-[var(--radius-md)] border border-border"
                  style={{ background }}
                />
              ))}
            </div>
          </div>
        </section>
        */}

        {/* SERVICE AREA ---------------------------------------------------- */}
        <section id="area" className="scroll-mt-20 border-y border-border bg-band-3">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
                Where we roll
              </h2>
              <p className="mt-3 text-muted">
                Based in Dallas, serving DFW and areas near 75249.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {CITIES.map((c) => (
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
              Questions
            </h2>
            <Faq />
          </div>
        </section>

        {/* FINAL CTA ------------------------------------------------------- */}
        <section className="border-t border-border bg-band-4">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
              Ready for that new-car feeling?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted">
              Book online in under 90 seconds. No account, no phone tag.
            </p>
            <Link
              href="/book"
              className="tap mt-8 inline-flex items-center rounded-[var(--radius-md)] bg-accent px-8 text-lg font-bold text-white transition-colors hover:bg-accent-hi"
            >
              Book Now
            </Link>
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
              <p className="text-sm text-muted">Mobile detailing DFW</p>
            </div>
          </div>
          <div className="flex gap-5 text-sm text-muted">
            <a href="tel:+12149913908" className="hover:text-ink">Call</a>
            <a href="https://instagram.com/dallasdetailz" className="hover:text-ink" target="_blank" rel="noopener noreferrer">Instagram</a>
            <Link href="/book" className="hover:text-ink">Book</Link>
          </div>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Dallas Detailz
          </p>
        </div>
      </footer>

      <MobileBookBar />
    </>
  );
}
