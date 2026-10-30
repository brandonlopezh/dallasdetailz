// Straight-line distance from the shop's home base (ZIP 75249 centroid) to a
// customer address. Geocoding uses the free US Census geocoder (no API key).
export const HOME = { lat: 32.636, lng: -96.9493 };
export const NEAR_RADIUS_MI = 10;

export interface Located {
  lat: number;
  lng: number;
  distanceMi: number;
}

function haversineMi(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

/** Null when the address can't be found or the lookup fails/times out. */
export async function locateAddress(address: string): Promise<Located | null> {
  try {
    const qs = new URLSearchParams({
      address,
      benchmark: "Public_AR_Current",
      format: "json",
    });
    const res = await fetch(
      `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?${qs}`,
      { signal: AbortSignal.timeout(4000), cache: "no-store" },
    );
    if (!res.ok) return null;
    const match = (await res.json())?.result?.addressMatches?.[0];
    const lng = match?.coordinates?.x;
    const lat = match?.coordinates?.y;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    return { lat, lng, distanceMi: haversineMi(HOME, { lat, lng }) };
  } catch {
    return null;
  }
}
