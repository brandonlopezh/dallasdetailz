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
  subtotal: number;
  addon_total: number;
  travel_fee: number;
  total: number;
  payment_status: "unpaid" | "deposit_paid" | "paid";
  water_access: boolean | null;
  outlet_access: boolean | null;
  customer_notes: string | null;
  internal_notes: string | null;
  created_at: string;
  customers: { name: string; phone: string; email: string | null } | null;
  vehicles: { year: number | null; make: string | null; model: string | null } | null;
  services: { name: string; category: string } | null;
}

const SELECT =
  "id, ref, scheduled_start, scheduled_end, status, source, vehicle_tier, service_address, subtotal, addon_total, travel_fee, total, payment_status, water_access, outlet_access, customer_notes, internal_notes, created_at, customers(name, phone, email), vehicles(year, make, model), services(name, category)";

/** Bookings in a time window, optionally filtered by status. Chronological. */
export async function listBookings(opts: {
  fromISO?: string;
  toISO?: string;
  statuses?: BookingStatus[];
  order?: "start" | "created";
  limit?: number;
}): Promise<AdminBooking[]> {
  let q = supabaseAdmin().from("bookings").select(SELECT);
  if (opts.fromISO) q = q.gte("scheduled_start", opts.fromISO);
  if (opts.toISO) q = q.lt("scheduled_start", opts.toISO);
  if (opts.statuses?.length) q = q.in("status", opts.statuses);
  q = q.order(opts.order === "created" ? "created_at" : "scheduled_start", {
    ascending: true,
  });

  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error || !data) return [];
  return data as unknown as AdminBooking[];
}

/**
 * Ids of requests where a new time was offered and the customer hasn't
 * answered ("waiting on client"). Empty if migration 0013 hasn't been run yet,
 * so everything simply shows as "waiting on me" until it is.
 */
export async function listOfferedIds(): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("id")
    .eq("status", "requested")
    .not("offered_at", "is", null);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.id as string));
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

/** Looks up a booking by its operator approval_token (the /confirm/[token]
 * link). Distinct from the customer-facing manage_token — see
 * supabase/migrations/0005_approval.sql. */
export async function getBookingByApprovalToken(
  token: string,
): Promise<AdminBooking | null> {
  const { data } = await supabaseAdmin()
    .from("bookings")
    .select(SELECT)
    .eq("approval_token", token)
    .maybeSingle();
  return (data as unknown as AdminBooking) ?? null;
}

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  instagram_handle: string | null;
  created_at: string;
  /** Start of their most recent job that has already happened, or null. */
  last_detail: string | null;
}

/** Every customer, A–Z, for the dashboard's Customers section. */
export async function listCustomers(): Promise<AdminCustomer[]> {
  const sb = supabaseAdmin();
  const [{ data, error }, { data: past }] = await Promise.all([
    sb
      .from("customers")
      .select("id, name, phone, email, instagram_handle, created_at")
      .order("name", { ascending: true })
      .limit(500),
    sb
      .from("bookings")
      .select("customer_id, scheduled_start")
      .in("status", ["confirmed", "in_progress", "completed"])
      .lte("scheduled_start", new Date().toISOString())
      .order("scheduled_start", { ascending: false })
      .limit(2000),
  ]);
  if (error || !data) return [];
  // Newest first, so the first booking seen per customer is their latest.
  const last = new Map<string, string>();
  for (const r of past ?? []) {
    const id = r.customer_id as string;
    if (!last.has(id)) last.set(id, r.scheduled_start as string);
  }
  return data.map((c) => ({ ...(c as Omit<AdminCustomer, "last_detail">), last_detail: last.get(c.id) ?? null }));
}

export async function countRequests(): Promise<number> {
  const { count } = await supabaseAdmin()
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "requested");
  return count ?? 0;
}

/** "2020 Toyota Camry", or null when the customer gave no vehicle. */
export function vehicleLabel(v: AdminBooking["vehicles"]): string | null {
  return [v?.year, v?.make, v?.model].filter(Boolean).join(" ") || null;
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
  requested: "text-warning-text border-warning/40 bg-warning/10",
  confirmed: "text-link border-accent/40 bg-accent/10",
  in_progress: "text-link border-accent/50 bg-accent/20",
  completed: "text-success-text border-success/40 bg-success/10",
  cancelled: "text-muted border-border bg-surface-alt",
  no_show: "text-danger-text border-danger/40 bg-danger/10",
};
