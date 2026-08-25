// English/Spanish copy for the public homepage. Everything a visitor reads
// on "/" lives here so the language toggle (see LanguageProvider.tsx) only
// has to swap one object. Scope: the homepage only — /book, /confirm/[token],
// and JSON-LD structured data stay English for now.

export type Lang = "en" | "es";

export const LANGUAGE_STORAGE_KEY = "dd-lang";

interface FaqItem {
  q: string;
  a: string;
}

interface Translations {
  nav: { services: string; area: string };
  common: { bookNow: string };
  hero: {
    title: string;
    summary: string;
    seePricing: string;
  };
  services: {
    heading: string;
    disclaimer: string;
    swipeHint: string;
    bookThis: string;
    bestDeal: string;
  };
  instagram: { visit: string; followBody: string };
  area: { heading: string; description: string; cities: string[] };
  faq: { heading: string; items: FaqItem[] };
  finalCta: { heading: string };
  footer: { tagline: string; call: string; instagram: string; book: string };
  mobileBar: { callLabel: string; textTooltip: string };
  leaving: { title: string; subtitle: string; tapHere: string };
  languageToggle: { label: string };
}

export const TRANSLATIONS: Record<Lang, Translations> = {
  en: {
    nav: { services: "Services", area: "Area" },
    common: { bookNow: "Book Now" },
    hero: {
      title: "Dallas Detailz",
      summary:
        "Two brothers, a truckload of gear, and your driveway. Providing exterior, interior, and full details across Duncanville, Dallas, and Cedar Hill.",
      seePricing: "See Pricing",
    },
    services: {
      heading: "Pick your service",
      disclaimer: "Prices shown are final, we accept Zelle and Cash only.",
      swipeHint: "Swipe to compare →",
      bookThis: "Book this",
      bestDeal: "Best Deal",
    },
    instagram: {
      visit: "Visit →",
      followBody: "See our latest jobs and behind-the-scenes on Instagram.",
    },
    area: {
      heading: "Where we bring the shine ✨",
      description: "Based in Dallas, serving DFW and areas near 75249.",
      cities: ["Duncanville", "Cedar Hill", "DeSoto", "Grand Prairie", "Dallas", "Greater DFW"],
    },
    faq: {
      heading: "Questions",
      items: [
        {
          q: "Do you really come to me?",
          a: "Yes, we're fully mobile. We bring everything to your home or office anywhere in DFW. Just tell us where to park.",
        },
        {
          q: "Do you need water and power access?",
          a: "Yes, this is required. We need an outdoor water spigot and a standard power outlet at the address to detail your vehicle. If you're not sure you have both, let us know before booking.",
        },
        {
          q: "How long does a detail take?",
          a: "Depends on the vehicle and package. An exterior on a mid-size truck runs about 75 minutes; a full detail on a large SUV can take 3-4 hours. Your exact time shows before you confirm.",
        },
        {
          q: "What if it rains?",
          a: "We watch the forecast and flag rain risk on your booking. If the weather won't cooperate, we'll reach out to reschedule. No charge, no hassle.",
        },
        {
          q: "How do I pay?",
          a: "We accept Zelle and Cash only. Prices shown are final, no deposit required to book.",
        },
        {
          q: "What areas do you serve?",
          a: "Duncanville, Cedar Hill, DeSoto, Grand Prairie, Dallas, and the greater DFW metro, including areas near 75249.",
        },
        {
          q: "How fast do we reply?",
          a: "We're still in high school, so we'll ideally reply before 8 AM and after 4 PM. Please bear with us!",
        },
      ],
    },
    finalCta: { heading: "Ready for that new-car feeling?" },
    footer: {
      tagline: "Mobile detailing DFW",
      call: "Call",
      instagram: "Instagram",
      book: "Book",
    },
    mobileBar: {
      callLabel: "Call Dallas Detailz",
      textTooltip: "Text Dallas Detailz",
    },
    leaving: {
      title: "Taking you to Instagram…",
      subtitle: "Opening in a new tab",
      tapHere: "Tap here if it doesn't open",
    },
    languageToggle: { label: "Español" },
  },
  es: {
    nav: { services: "Servicios", area: "Zona" },
    common: { bookNow: "Reservar" },
    hero: {
      title: "Dallas Detailz",
      summary:
        "Dos hermanos, una camioneta llena de equipo y tu entrada. Ofrecemos limpieza exterior, interior y detallado completo en Duncanville, Dallas y Cedar Hill.",
      seePricing: "Ver precios",
    },
    services: {
      heading: "Elige tu servicio",
      disclaimer: "Los precios mostrados son finales, aceptamos solo Zelle y efectivo.",
      swipeHint: "Desliza para comparar →",
      bookThis: "Reservar esto",
      bestDeal: "Mejor oferta",
    },
    instagram: {
      visit: "Visitar →",
      followBody: "Mira nuestros trabajos más recientes y detrás de cámaras en Instagram.",
    },
    area: {
      heading: "Donde llevamos el brillo ✨",
      description: "Con base en Dallas, damos servicio en DFW y zonas cerca del 75249.",
      cities: ["Duncanville", "Cedar Hill", "DeSoto", "Grand Prairie", "Dallas", "DFW y alrededores"],
    },
    faq: {
      heading: "Preguntas",
      items: [
        {
          q: "¿De verdad vienen hasta donde estoy?",
          a: "Sí, somos totalmente móviles. Llevamos todo a tu casa u oficina en cualquier parte de DFW. Solo dinos dónde estacionarnos.",
        },
        {
          q: "¿Necesitan acceso a agua y electricidad?",
          a: "Sí, es necesario. Necesitamos una llave de agua exterior y un enchufe estándar en la dirección para detallar tu vehículo. Si no estás seguro de tener ambos, avísanos antes de reservar.",
        },
        {
          q: "¿Cuánto tiempo toma un detallado?",
          a: "Depende del vehículo y el paquete. Un exterior en una camioneta mediana toma unos 75 minutos; un detallado completo en una SUV grande puede tomar de 3 a 4 horas. Tu tiempo exacto se muestra antes de confirmar.",
        },
        {
          q: "¿Qué pasa si llueve?",
          a: "Estamos al pendiente del pronóstico y avisamos si hay riesgo de lluvia en tu reserva. Si el clima no coopera, te contactaremos para reprogramar. Sin cargo, sin complicaciones.",
        },
        {
          q: "¿Cómo pago?",
          a: "Aceptamos solo Zelle y efectivo. Los precios mostrados son finales, no se requiere depósito para reservar.",
        },
        {
          q: "¿Qué zonas cubren?",
          a: "Duncanville, Cedar Hill, DeSoto, Grand Prairie, Dallas y el área metropolitana de DFW, incluyendo zonas cerca del 75249.",
        },
        {
          q: "¿Qué tan rápido respondemos?",
          a: "Todavía estamos en la prepa (high school), así que lo ideal es responder antes de las 8 AM y después de las 4 PM. ¡Gracias por tu paciencia!",
        },
      ],
    },
    finalCta: { heading: "¿Listo para esa sensación de auto nuevo?" },
    footer: {
      tagline: "Detailing móvil en DFW",
      call: "Llamar",
      instagram: "Instagram",
      book: "Reservar",
    },
    mobileBar: {
      callLabel: "Llamar a Dallas Detailz",
      textTooltip: "Enviar un mensaje de texto a Dallas Detailz",
    },
    leaving: {
      title: "Te llevamos a Instagram…",
      subtitle: "Se abre en una pestaña nueva",
      tapHere: "Toca aquí si no se abre",
    },
    languageToggle: { label: "English" },
  },
};

// The 3 seed services (src/lib/catalog.ts FALLBACK_SERVICES / the Supabase
// seed migration) have fixed UUIDs, so their name/description translate via
// this lookup. A 4th+ service added later through /admin has no entry here
// and simply falls back to its DB-stored (English) name/description in
// Spanish mode until someone adds one.
export const SERVICE_TRANSLATIONS: Record<string, { name: string; description: string }> = {
  "11111111-1111-1111-1111-111111111111": {
    name: "Detallado Exterior",
    description:
      "Lavado a espuma, llantas y rines, remoción de insectos/alquitrán, ventanas impecables, secado a mano, brillo para llantas.",
  },
  "22222222-2222-2222-2222-222222222222": {
    name: "Detallado Interior",
    description: "Aspirado completo, limpieza de piel/plástico, limpieza de ventanas, desodorización.",
  },
  "33333333-3333-3333-3333-333333333333": {
    name: "Detallado Completo",
    description:
      "Todo lo incluido en Exterior + Interior. Nuestro paquete más reservado para camionetas y SUVs.",
  },
};

export const CATEGORY_ES: Record<string, string> = {
  exterior: "exterior",
  interior: "interior",
  full: "completo",
};
