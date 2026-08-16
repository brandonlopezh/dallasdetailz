import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import MobileBookBar from "@/components/MobileBookBar";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import Faq from "@/components/Faq";
import { getServices } from "@/lib/catalog";

// Photo stand-ins: night-heavy, wet-gloss gradients (PRD §7.1). Swap for real
// Instagram/shoot photography before launch.
const GLOSS =
  "radial-gradient(120% 120% at 70% 20%, #1e6fe8 0%, #0b1b3a 38%, #060608 100%)";
const DIRTY =
  "radial-gradient(120% 120% at 30% 30%, #3a352b 0%, #201d17 45%, #0b0a08 100%)";
const CITIES = ["Duncanville", "Cedar Hill", "DeSoto", "Grand Prairie", "Dallas", "Greater DFW"];

function money(n: number) {
  return `$${Math.round(n)}`;
}

export default async function Home() {
  const services = await getServices();
  const priceFrom = (s: (typeof services)[number]) =>
    Math.min(...s.pricing.map((p) => p.price));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDetailing",
    name: "Dallas Detailz",
    description: "Mobile auto detailing serving Duncanville, Dallas, and greater DFW.",
    areaServed: CITIES.map((c) => ({ "@type": "City", name: c })),
    priceRange: "$$",
    telephone: "+1-000-000-0000",
    address: { "@type": "PostalAddress", addressLocality: "Duncanville", addressRegion: "TX", addressCountry: "US" },
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
        <section className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: GLOSS }} />
          <div className="absolute inset-0 bg-gradient-to-b from-base/30 via-base/40 to-base" />
          <div className="relative mx-auto flex min-h-[82vh] max-w-6xl flex-col justify-center px-4 py-24 sm:px-6">
            <p className="animate-fade-up mb-4 font-semibold uppercase tracking-[0.2em] text-accent-hi">
              Mobile detailing · DFW
            </p>
            <h1 className="animate-fade-up max-w-3xl font-[family-name:var(--font-display)] text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-7xl">
              We come to you.
              <br />
              <span className="text-accent-hi">DFW mobile detailing.</span>
            </h1>
            <p className="animate-fade-up mt-5 max-w-xl text-lg text-muted">
              Duncanville · Dallas · DFW. Trucks, SUVs, and everything in
              between — detailed in your driveway. Book in under 90 seconds.
            </p>
            <div className="animate-fade-up mt-8 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="tap inline-flex items-center rounded-[var(--radius-md)] bg-accent px-7 text-lg font-bold text-white transition-colors hover:bg-accent-hi"
              >
                Book Now
              </Link>
              <a
                href="#services"
                className="tap inline-flex items-center rounded-[var(--radius-md)] border border-border bg-surface/60 px-7 text-lg font-semibold text-ink backdrop-blur transition-colors hover:border-accent"
              >
                See Pricing
              </a>
            </div>
          </div>
        </section>

        {/* PROOF STRIP ----------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
              The difference
            </h2>
            <p className="hidden text-sm text-muted sm:block">Drag to reveal →</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <BeforeAfterSlider key={i} before={DIRTY} after={GLOSS} />
            ))}
          </div>
        </section>

        {/* SERVICES -------------------------------------------------------- */}
        <section id="services" className="scroll-mt-20 border-y border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
              Pick your service
            </h2>
            <p className="mt-2 max-w-xl text-muted">
              Prices shown are starting points. Your exact price and time depend
              on your vehicle — you&apos;ll see it before you confirm.
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
                    <span className="text-sm text-muted">from</span>
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
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
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
        </section>

        {/* GALLERY --------------------------------------------------------- */}
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
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-[var(--radius-md)] border border-border"
                  style={{ background: i % 2 ? GLOSS : DIRTY }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* SERVICE AREA ---------------------------------------------------- */}
        <section id="area" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
                Where we roll
              </h2>
              <p className="mt-3 text-muted">
                Based in Duncanville, serving the greater DFW metro. Outside our
                core radius? You can still book — a small travel fee shows before
                you confirm.
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
            <div
              className="aspect-video rounded-[var(--radius-lg)] border border-border"
              style={{ background: GLOSS }}
              aria-label="Service area map"
            />
          </div>
        </section>

        {/* FAQ ------------------------------------------------------------- */}
        <section className="border-t border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="mb-8 text-center font-[family-name:var(--font-display)] text-3xl font-extrabold uppercase tracking-tight">
              Questions
            </h2>
            <Faq />
          </div>
        </section>

        {/* FINAL CTA ------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
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
        </section>
      </main>

      {/* FOOTER ------------------------------------------------------------ */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-extrabold uppercase">
              Dallas Detailz
            </p>
            <p className="text-sm text-muted">Mobile detailing · DFW</p>
          </div>
          <div className="flex gap-5 text-sm text-muted">
            <a href="tel:+10000000000" className="hover:text-ink">Call</a>
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
