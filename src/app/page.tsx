import SiteHeader from "@/components/SiteHeader";
import MobileBookBar from "@/components/MobileBookBar";
import HomeContent from "@/components/HomeContent";
import { getServices } from "@/lib/catalog";
import { INSTAGRAM_URL } from "@/lib/site-config";
import { SiteContentProvider } from "@/components/LanguageProvider";
import { getSiteContent } from "@/lib/content";

const CITIES = ["Duncanville", "Cedar Hill", "DeSoto", "Grand Prairie", "Dallas", "Greater DFW"];
// Always render fresh so edits made in /admin/website show up on the next load
// (the Workers build has no persistent ISR cache to revalidate).
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dallasdetailz.com";

export default async function Home() {
  const [services, content] = await Promise.all([getServices(), getSiteContent()]);
  const priceFrom = (s: (typeof services)[number]) =>
    Math.min(...s.pricing.map((p) => p.price));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDetailing",
    name: "Dallas Detailz",
    url: SITE_URL,
    description:
      "Mobile auto detailing serving Duncanville, Dallas, Cedar Hill, and greater DFW, including areas near the 75249 zip code.",
    areaServed: [
      ...CITIES.map((c) => ({ "@type": "City", name: c })),
      { "@type": "Place", name: "75249" },
    ],
    priceRange: "$$",
    telephone: "+1-214-991-3908",
    address: { "@type": "PostalAddress", addressLocality: "Dallas", addressRegion: "TX", addressCountry: "US" },
    sameAs: [INSTAGRAM_URL],
    makesOffer: services.map((s) => ({
      "@type": "Offer",
      name: s.name,
      priceCurrency: "USD",
      price: priceFrom(s),
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.translations.en.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <SiteContentProvider content={content}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteHeader />
      <HomeContent services={services} />
      <MobileBookBar />
    </SiteContentProvider>
  );
}
