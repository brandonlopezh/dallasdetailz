import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAddonsCached, getServicesCached, getSettingsCached } from "@/lib/catalog";
import { getOpenDays } from "@/lib/open-slots";
import type { VehicleTier } from "@/lib/types";

const querySchema = z.object({
  serviceId: z.string().min(1),
  tier: z.enum(["sedan", "mid_suv", "large_suv", "xl"]),
  addons: z.string().optional(), // comma-separated addon ids
});

/**
 * GET /api/availability?serviceId=&tier=&addons=
 * Returns open slots for the next `booking_horizon_days`. Slot length =
 * service duration for the tier + any add-on durations. Busy set = confirmed/
 * in-progress bookings ∪ availability blocks (blackouts + calendar sync).
 */
export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { serviceId, tier, addons } = parsed.data;

  const [services, allAddons, settings] = await Promise.all([
    getServicesCached(),
    getAddonsCached(),
    getSettingsCached(),
  ]);

  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return NextResponse.json({ error: "Unknown service" }, { status: 404 });
  }
  const pricing = service.pricing.find((p) => p.tier === (tier as VehicleTier));
  if (!pricing) {
    return NextResponse.json(
      { error: "No pricing for that tier" },
      { status: 404 },
    );
  }

  const addonIds = addons ? addons.split(",").filter(Boolean) : [];
  const addonMinutes = allAddons
    .filter((a) => addonIds.includes(a.id))
    .reduce((sum, a) => sum + a.duration_min, 0);

  const durationMin = pricing.duration_min + addonMinutes;

  const days = await getOpenDays(durationMin, settings);

  return NextResponse.json({ durationMin, days });
}
