import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/auth";
import { getServices } from "@/lib/catalog";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { VehicleTier } from "@/lib/types";

const createSchema = z.object({
  serviceId: z.string().min(1),
  tier: z.enum(["sedan", "mid_suv", "large_suv", "xl"]),
  start: z.string().datetime(),
  address: z.string().min(1),
  status: z
    .enum(["requested", "confirmed", "in_progress", "completed", "cancelled", "no_show"])
    .default("confirmed"),
  source: z.enum(["web", "instagram", "phone", "manual", "referral"]).default("manual"),
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(7),
    email: z.string().email().optional().or(z.literal("")),
  }),
  notes: z.string().optional(),
});

// POST /api/admin/bookings — manual booking (phone/walk-up/IG). PRD AD-7.
export async function POST(req: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid booking", details: parsed.error.flatten() },
      { status: 400 },
    );
  const b = parsed.data;

  const services = await getServices();
  const service = services.find((s) => s.id === b.serviceId);
  const pricing = service?.pricing.find((p) => p.tier === (b.tier as VehicleTier));
  if (!service || !pricing)
    return NextResponse.json({ error: "Unknown service/tier" }, { status: 404 });

  const start = new Date(b.start);
  const end = new Date(start.getTime() + pricing.duration_min * 60_000);
  const sb = supabaseAdmin();

  // Find-or-create customer by phone.
  let customerId: string;
  const { data: existing } = await sb
    .from("customers")
    .select("id")
    .eq("phone", b.customer.phone)
    .maybeSingle();
  if (existing) {
    customerId = existing.id;
  } else {
    const { data: created, error } = await sb
      .from("customers")
      .insert({
        name: b.customer.name,
        phone: b.customer.phone,
        email: b.customer.email || null,
        address: b.address,
      })
      .select("id")
      .single();
    if (error || !created)
      return NextResponse.json({ error: "Could not save customer" }, { status: 500 });
    customerId = created.id;
  }

  const { data: booking, error } = await sb
    .from("bookings")
    .insert({
      customer_id: customerId,
      service_id: service.id,
      vehicle_tier: b.tier,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      service_address: b.address,
      status: b.status,
      source: b.source,
      subtotal: pricing.price,
      total: pricing.price,
      internal_notes: b.notes ?? null,
    })
    .select("id, ref")
    .single();

  if (error) {
    if (error.code === "23P01")
      return NextResponse.json(
        { error: "That time overlaps another job.", code: "slot_taken" },
        { status: 409 },
      );
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: booking.id, ref: booking.ref }, { status: 201 });
}
