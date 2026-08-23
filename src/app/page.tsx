import SiteHeader from "@/components/SiteHeader";
import MobileBookBar from "@/components/MobileBookBar";
import HomeContent from "@/components/HomeContent";
import { getServices } from "@/lib/catalog";

const CITIES = ["Duncanville", "Cedar Hill", "DeSoto", "Grand Prairie", "Dallas", "Greater DFW"];

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
      <HomeContent services={services} />
      <MobileBookBar />
    </>
  );
}
