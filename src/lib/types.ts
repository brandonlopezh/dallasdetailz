// Domain types mirroring the Supabase schema (supabase/migrations).

export type VehicleTier = "sedan" | "mid_suv" | "large_suv" | "xl";
export type ServiceCategory = "exterior" | "interior" | "full";
export type BookingStatus =
  | "requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";
export type BookingSource = "web" | "instagram" | "phone" | "manual" | "referral";

export interface ServicePricing {
  tier: VehicleTier;
  price: number;
  duration_min: number;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  category: ServiceCategory;
  base_duration_min: number;
  sort_order: number;
  pricing: ServicePricing[];
}

export interface Addon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_min: number;
  sort_order: number;
}

export interface BusinessSettings {
  working_hours: Record<string, [string, string][]>;
  daily_job_cap: number;
  job_buffer_min: number;
  service_radius_mi: number;
  travel_fee_rules: { up_to_mi: number; fee: number }[];
  booking_lead_time_hr: number;
  booking_horizon_days: number;
  reschedule_cutoff_hr: number;
  timezone: string;
}

/** UI-facing vehicle tiers, trucks-first (PRD §5.1 / §7.3.6). */
export const VEHICLE_TIERS: {
  id: VehicleTier;
  label: string;
  hint: string;
  isDefault?: boolean;
}[] = [
  { id: "sedan", label: "Sedan / Coupe", hint: "Cars, small crossovers" },
  {
    id: "mid_suv",
    label: "Mid SUV / Truck",
    hint: "RAV4, F-150, mid-size pickups",
    isDefault: true,
  },
  { id: "large_suv", label: "Large SUV / 3-Row", hint: "Tahoe, Suburban, Armada" },
  { id: "xl", label: "XL / Lifted", hint: "Lifted trucks, dually, oversized" },
];
