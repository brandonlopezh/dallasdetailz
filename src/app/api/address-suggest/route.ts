import { NextRequest, NextResponse } from "next/server";
import { HOME } from "@/lib/distance";

const STATES: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", "District of Columbia": "DC",
  Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT",
  Virginia: "VA", Washington: "WA", "West Virginia": "WV", Wisconsin: "WI",
  Wyoming: "WY",
};

interface PhotonProps {
  housenumber?: string;
  street?: string;
  city?: string;
  locality?: string;
  state?: string;
  postcode?: string;
  countrycode?: string;
}

/**
 * GET /api/address-suggest?q= — street-address suggestions for the booking
 * form, biased toward Dallas. Only full street addresses (house number +
 * street) are returned, so picking one always gives something bookable.
 * Never errors: any upstream trouble just yields no suggestions and the
 * customer can keep typing.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 4 || q.length > 200) {
    return NextResponse.json({ suggestions: [] });
  }
  try {
    const qs = new URLSearchParams({
      q,
      limit: "10",
      lang: "en",
      lat: String(HOME.lat),
      lon: String(HOME.lng),
    });
    const res = await fetch(`https://photon.komoot.io/api/?${qs}`, {
      signal: AbortSignal.timeout(3500),
      cache: "no-store",
      headers: { "User-Agent": "dallasdetailz.com address suggestions" },
    });
    if (!res.ok) return NextResponse.json({ suggestions: [] });
    const features: { properties?: PhotonProps }[] = (await res.json())?.features ?? [];
    const seen = new Set<string>();
    const suggestions: string[] = [];
    for (const f of features) {
      const p = f.properties;
      const city = p?.city ?? p?.locality;
      const state = p?.state ? STATES[p.state] : undefined;
      if (p?.countrycode !== "US" || !p.housenumber || !p.street || !city || !state) continue;
      const label = `${p.housenumber} ${p.street}, ${city}, ${state}${p.postcode ? ` ${p.postcode}` : ""}`;
      if (seen.has(label)) continue;
      seen.add(label);
      suggestions.push(label);
      if (suggestions.length === 5) break;
    }
    return NextResponse.json(
      { suggestions },
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
