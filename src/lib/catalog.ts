import type { Addon, BusinessSettings, Service } from "./types";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase/server";

/**
 * Static fallback that mirrors supabase/migrations/0003_seed.sql. Lets the
 * marketing site and pricing render before Supabase is connected, and keeps
 * local dev / Vercel preview builds green without secrets. Once Supabase is
 * configured the live DB is the source of truth.
 */
export const FALLBACK_SERVICES: Service[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Exterior Detail",
    description:
      "Foam wash, wheels & tires, bug/tar removal, spotless windows, hand dry, tire shine.",
    category: "exterior",
    base_duration_min: 75,
    sort_order: 1,
    pricing: [
      { tier: "sedan", price: 60, duration_min: 60 },
      { tier: "mid_suv", price: 75, duration_min: 75 },
      { tier: "large_suv", price: 90, duration_min: 90 },
      { tier: "xl", price: 110, duration_min: 105 },
    ],
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Interior Detail",
    description:
      "Full vacuum, steam & shampoo, leather/plastic wipe-down, windows, deodorize.",
    category: "interior",
    base_duration_min: 120,
    sort_order: 2,
    pricing: [
      { tier: "sedan", price: 90, duration_min: 90 },
      { tier: "mid_suv", price: 120, duration_min: 120 },
      { tier: "large_suv", price: 150, duration_min: 150 },
      { tier: "xl", price: 180, duration_min: 180 },
    ],
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Full Detail",
    description:
      "Everything in Exterior + Interior. Our most-booked package for trucks and SUVs.",
    category: "full",
    base_duration_min: 180,
    sort_order: 3,
    pricing: [
      { tier: "sedan", price: 140, duration_min: 150 },
      { tier: "mid_suv", price: 180, duration_min: 180 },
      { tier: "large_suv", price: 220, duration_min: 210 },
      { tier: "xl", price: 260, duration_min: 240 },
    ],
  },
];

export const FALLBACK_ADDONS: Addon[] = [
  { id: "a1", name: "Pet hair removal", description: "Heavy pet hair extraction from seats & carpet.", price: 25, duration_min: 20, sort_order: 1 },
  { id: "a2", name: "Heavy stain treatment", description: "Deep extraction for set-in stains.", price: 30, duration_min: 30, sort_order: 2 },
  { id: "a3", name: "Engine bay cleaning", description: "Degrease and dress the engine bay.", price: 30, duration_min: 20, sort_order: 3 },
  { id: "a4", name: "Headlight restoration", description: "Sand, polish, and seal foggy headlights.", price: 40, duration_min: 30, sort_order: 4 },
  { id: "a5", name: "Wax / sealant", description: "Hand wax or spray sealant for lasting gloss.", price: 50, duration_min: 30, sort_order: 5 },
  { id: "a6", name: "Clay bar treatment", description: "Clay decontamination for glass-smooth paint.", price: 45, duration_min: 40, sort_order: 6 },
];

export const DEFAULT_SETTINGS: BusinessSettings = {
  working_hours: {
    mon: [["09:00", "18:00"]],
    tue: [["09:00", "18:00"]],
    wed: [["09:00", "18:00"]],
    thu: [["09:00", "18:00"]],
    fri: [["09:00", "18:00"]],
    sat: [["08:00", "17:00"]],
    sun: [],
  },
  daily_job_cap: 3,
  job_buffer_min: 45,
  service_radius_mi: 30,
  travel_fee_rules: [
    { up_to_mi: 20, fee: 0 },
    { up_to_mi: 30, fee: 25 },
    { up_to_mi: 45, fee: 50 },
  ],
  booking_lead_time_hr: 12,
  booking_horizon_days: 21,
  reschedule_cutoff_hr: 12,
  timezone: "America/Chicago",
};

/** Services + nested pricing, from DB when configured, else the seed fallback. */
export async function getServices(): Promise<Service[]> {
  if (!isSupabaseConfigured()) return FALLBACK_SERVICES;

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("services")
    .select("id, name, description, category, base_duration_min, sort_order, service_pricing(tier, price, duration_min)")
    .eq("active", true)
    .order("sort_order");

  if (error || !data) return FALLBACK_SERVICES;

  return data.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    category: s.category,
    base_duration_min: s.base_duration_min,
    sort_order: s.sort_order,
    pricing: (s.service_pricing ?? []).map((p: { tier: string; price: number | string; duration_min: number }) => ({
      tier: p.tier as Service["pricing"][number]["tier"],
      price: Number(p.price),
      duration_min: p.duration_min,
    })),
  }));
}

export async function getAddons(): Promise<Addon[]> {
  if (!isSupabaseConfigured()) return FALLBACK_ADDONS;

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("addons")
    .select("id, name, description, price, duration_min, sort_order")
    .eq("active", true)
    .order("sort_order");

  if (error || !data) return FALLBACK_ADDONS;
  return data.map((a) => ({ ...a, price: Number(a.price) }));
}

export async function getSettings(): Promise<BusinessSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("business_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) return DEFAULT_SETTINGS;
  return data as unknown as BusinessSettings;
}
