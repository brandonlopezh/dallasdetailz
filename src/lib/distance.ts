// Straight-line distance from the shop's home base (ZIP 75249 centroid) to a
// customer address. Geocoding uses the free US Census geocoder (no API key),
// with Photon (OpenStreetMap) as a fallback for addresses Census doesn't have
// yet. Photon is also what powers the address suggestions, so an address
// picked from the suggestions always verifies.
export const HOME = { lat: 32.636, lng: -96.9493 };
export const NEAR_RADIUS_MI = 10;

export interface Located {
  lat: number;
  lng: number;
  distanceMi: number;
}

/**
 * found       the address exists (with coordinates and distance)
 * not_found   the geocoders answered and have no such address
 * unverified  the geocoders couldn't be reached, so we can't say either way
 */
export type Lookup =
  | ({ status: "found" } & Located)
  | { status: "not_found" }
  | { status: "unverified" };

function haversineMi(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

type Point = { lat: number; lng: number };

/** null = no match; throws when the service can't be reached. */
async function censusLookup(address: string): Promise<Point | null> {
  const qs = new URLSearchParams({
    address,
    benchmark: "Public_AR_Current",
    format: "json",
  });
  const res = await fetch(
    `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?${qs}`,
    { signal: AbortSignal.timeout(4000), cache: "no-store" },
  );
  if (!res.ok) throw new Error(`census ${res.status}`);
  const match = (await res.json())?.result?.addressMatches?.[0];
  const lng = match?.coordinates?.x;
  const lat = match?.coordinates?.y;
  return typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;
}

/**
 * Photon fallback. Only trusts a top hit that is a real street address in the
 * US whose house number matches what was typed, so a stray street or city
 * match can't make a bad address pass. null = no match; throws when down.
 */
async function photonLookup(address: string): Promise<Point | null> {
  const qs = new URLSearchParams({
    q: address,
    limit: "3",
    lang: "en",
    lat: String(HOME.lat),
    lon: String(HOME.lng),
  });
  const res = await fetch(`https://photon.komoot.io/api/?${qs}`, {
    signal: AbortSignal.timeout(4000),
    cache: "no-store",
    headers: { "User-Agent": "dallasdetailz.com address check" },
  });
  if (!res.ok) throw new Error(`photon ${res.status}`);
  const typed = address.trim().match(/^\d+[a-z]?(?:-\d+)?/i)?.[0]?.toLowerCase();
  const features: unknown[] = (await res.json())?.features ?? [];
  for (const f of features as {
    properties?: { housenumber?: string; street?: string; countrycode?: string };
    geometry?: { coordinates?: number[] };
  }[]) {
    const p = f.properties;
    const [lng, lat] = f.geometry?.coordinates ?? [];
    if (
      p?.countrycode === "US" &&
      p.street &&
      p.housenumber?.toLowerCase() === typed &&
      typeof lat === "number" &&
      typeof lng === "number"
    ) {
      return { lat, lng };
    }
  }
  return null;
}

/** Verifies an address and, when it exists, how far it is from home. */
export async function lookupAddress(address: string): Promise<Lookup> {
  let reachable = false;
  let point: Point | null = null;
  try {
    point = await censusLookup(address);
    reachable = true;
  } catch {
    // fall through to the backup
  }
  if (!point) {
    try {
      point = await photonLookup(address);
      reachable = true;
    } catch {
      // handled below
    }
  }
  if (point) return { status: "found", ...point, distanceMi: haversineMi(HOME, point) };
  return { status: reachable ? "not_found" : "unverified" };
}

/** Null when the address can't be found or the lookup fails/times out. */
export async function locateAddress(address: string): Promise<Located | null> {
  const r = await lookupAddress(address);
  return r.status === "found" ? r : null;
}
