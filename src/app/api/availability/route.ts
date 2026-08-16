import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAddons, getServices, getSettings } from "@/lib/catalog";
import { computeAvailability, type BusyRange } from "@/lib/availability";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/server";
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
    getServices(),
    getAddons(),
    getSettings(),
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

  // Gather the busy set.
  const busy: BusyRange[] = [];
  if (isSupabaseConfigured()) {
    const sb = supabaseAdmin();
    const horizonEnd = new Date(
      Date.now() + settings.booking_horizon_days * 86_400_000,
    ).toISOString();

    const [{ data: bookings }, { data: blocks }] = await Promise.all([
      sb
        .from("bookings")
        .select("scheduled_start, scheduled_end")
        .in("status", ["confirmed", "in_progress"])
        .lt("scheduled_start", horizonEnd),
      sb
        .from("availability_blocks")
        .select("starts_at, ends_at")
        .lt("starts_at", horizonEnd),
    ]);

    for (const b of bookings ?? []) {
      busy.push({
        start: new Date(b.scheduled_start).getTime(),
        end: new Date(b.scheduled_end).getTime(),
      });
    }
    for (const b of blocks ?? []) {
      busy.push({
        start: new Date(b.starts_at).getTime(),
        end: new Date(b.ends_at).getTime(),
      });
    }
  }

  const days = computeAvailability({
    serviceDurationMin: durationMin,
    settings,
    busy,
  });

  return NextResponse.json({ durationMin, days });
}
