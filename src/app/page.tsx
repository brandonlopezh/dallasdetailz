import SiteHeader from "@/components/SiteHeader";
import MobileBookBar from "@/components/MobileBookBar";
import HomeContent from "@/components/HomeContent";
import { getServices } from "@/lib/catalog";
import {
  // TEMPORARILY HIDDEN: feeds "The difference" + "Recent work" sections.
  // getBeforeAfterPairs,
  getGalleryBackgrounds,
  getHeroBackground,
} from "@/lib/media";

const CITIES = ["Duncanville", "Cedar Hill", "DeSoto", "Grand Prairie", "Dallas", "Greater DFW"];

export default async function Home() {
  // Images are operator-managed (admin → Images). These getters return real
  // uploads when present, else night-heavy gradient stand-ins (PRD §7.1).
  // TEMPORARILY HIDDEN: gallery(6) + getBeforeAfterPairs(3) come back when the
  // "Recent work" and "The difference" sections return (see HomeContent.tsx).
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
      <HomeContent
        services={services}
        heroBg={heroBg}
        hasHeroPhoto={hasHeroPhoto}
        hasStoryPhoto={hasStoryPhoto}
        storyBg={storyBg}
      />
      <MobileBookBar />
    </>
  );
}
