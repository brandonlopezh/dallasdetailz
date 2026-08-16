import "server-only";
import { supabaseAdmin } from "./supabase/server";
import type { BookingSource, BookingStatus, VehicleTier } from "./types";

export interface AdminBooking {
  id: string;
  ref: string;
  scheduled_start: string;
  scheduled_end: string;
  status: BookingStatus;
  source: BookingSource;
  vehicle_tier: VehicleTier;
  service_address: string;
  total: number;
  water_access: boolean | null;
  outlet_access: boolean | null;
  customer_notes: string | null;
  internal_notes: string | null;
  created_at: string;
  customers: { name: string; phone: string; email: string | null } | null;
  services: { name: string; category: string } | null;
}

const SELECT =
  "id, ref, scheduled_start, scheduled_end, status, source, vehicle_tier, service_address, total, water_access, outlet_access, customer_notes, internal_notes, created_at, customers(name, phone, email), services(name, category)";

/** Bookings in a time window, optionally filtered by status. Chronological. */
export async function listBookings(opts: {
  fromISO?: string;
  toISO?: string;
  statuses?: BookingStatus[];
  order?: "start" | "created";
}): Promise<AdminBooking[]> {
  let q = supabaseAdmin().from("bookings").select(SELECT);
  if (opts.fromISO) q = q.gte("scheduled_start", opts.fromISO);
  if (opts.toISO) q = q.lt("scheduled_start", opts.toISO);
  if (opts.statuses?.length) q = q.in("status", opts.statuses);
  q = q.order(opts.order === "created" ? "created_at" : "scheduled_start", {
    ascending: true,
  });

  const { data, error } = await q;
  if (error || !data) return [];
  return data as unknown as AdminBooking[];
}

export async function getBooking(id: string): Promise<AdminBooking | null> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select(SELECT)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as unknown as AdminBooking;
}

export async function countRequests(): Promise<number> {
  const { count } = await supabaseAdmin()
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "requested");
  return count ?? 0;
}

// Status lifecycle (AD-6): which actions are offered from a given status.
export const STATUS_ACTIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "completed", "cancelled", "no_show"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: ["confirmed"],
  no_show: ["confirmed"],
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export const STATUS_COLOR: Record<BookingStatus, string> = {
  requested: "text-warning border-warning/40 bg-warning/10",
  confirmed: "text-accent-hi border-accent/40 bg-accent/10",
  in_progress: "text-accent-hi border-accent/50 bg-accent/20",
  completed: "text-success border-success/40 bg-success/10",
  cancelled: "text-muted border-border bg-surface-alt",
  no_show: "text-danger border-danger/40 bg-danger/10",
};
