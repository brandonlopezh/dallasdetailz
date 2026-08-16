import { NextResponse } from "next/server";
import { getAddons, getServices, getSettings } from "@/lib/catalog";

// Public catalog for the booking flow: services + pricing, add-ons, and the
// customer-relevant slice of business settings.
export async function GET() {
  const [services, addons, settings] = await Promise.all([
    getServices(),
    getAddons(),
    getSettings(),
  ]);

  return NextResponse.json({
    services,
    addons,
    settings: {
      service_radius_mi: settings.service_radius_mi,
      travel_fee_rules: settings.travel_fee_rules,
      booking_horizon_days: settings.booking_horizon_days,
    },
  });
}
