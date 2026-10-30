import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAddons, getServices, getSettings } from "@/lib/catalog";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms";
import { NOTIFY_EMAIL, escapeHtml, sendEmail } from "@/lib/email";
import { NEAR_RADIUS_MI, locateAddress } from "@/lib/distance";
import type { VehicleTier } from "@/lib/types";

const bodySchema = z.object({
  serviceId: z.string().min(1),
  tier: z.enum(["sedan", "mid_suv", "large_suv", "xl"]),
  addonIds: z.array(z.string()).default([]),
  slotStart: z.string().datetime(), // ISO, must be a returned open slot
  address: z.string().min(4),
  lat: z.number().optional(),
  lng: z.number().optional(),
  distanceMi: z.number().optional(), // from Distance Matrix, drives travel fee
  waterAccess: z.boolean().optional(),
  outletAccess: z.boolean().optional(),
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(7),
    email: z.string().email().optional().or(z.literal("")),
  }),
  vehicle: z
    .object({
      year: z.number().int().optional(),
      make: z.string().optional(),
      model: z.string().optional(),
      color: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
  source: z
    .enum(["web", "instagram", "phone", "manual", "referral"])
    .default("web"),
});

function travelFeeFor(
  distanceMi: number | undefined,
  rules: { up_to_mi: number; fee: number }[],
): number {
  if (distanceMi == null) return 0;
  const sorted = [...rules].sort((a, b) => a.up_to_mi - b.up_to_mi);
  for (const r of sorted) if (distanceMi <= r.up_to_mi) return r.fee;
  return sorted.at(-1)?.fee ?? 0;
}

function requestEmailHtml(r: {
  ref: string;
  service: string;
  total: number;
  name: string;
  phone: string;
  email: string | null;
  when: string;
  address: string;
  notes: string | null;
  flag: string | null;
  dashboardUrl: string;
}): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top">${label}</td><td style="padding:6px 0;font-weight:600">${escapeHtml(value)}</td></tr>`;
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:16px;color:#111">
  <h2 style="margin:0 0 4px">New booking request</h2>
  <p style="margin:0 0 16px;color:#555">Accept it, or offer a different time, right from the dashboard.</p>
  <table style="border-collapse:collapse;font-size:15px">
    ${row("Service", `${r.service} ($${r.total})`)}
    ${row("When", r.when)}
    ${row("Where", r.address)}
    ${row("Customer", r.name)}
    ${row("Phone", r.phone)}
    ${r.email ? row("Email", r.email) : ""}
    ${r.flag ? row("Heads up", r.flag) : ""}
    ${r.notes ? row("Notes", r.notes) : ""}
    ${row("Ref", r.ref)}
  </table>
  <p style="margin:24px 0"><a href="${escapeHtml(r.dashboardUrl)}" style="background:#2563eb;color:#fff;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:700;display:inline-block">Review request in dashboard</a></p>
  <p style="color:#888;font-size:12px">Sign in to the dashboard if prompted.</p>
</div>`;
}

/**
 * POST /api/bookings — create a *requested* booking from a selected open
 * slot. Nothing is confirmed yet: this is a request the operator (brother)
 * approves or declines, e.g. by replying to the notification text. Only
 * `confirmed`/`in_progress` bookings occupy the Postgres exclusion
 * constraint (no_overlapping_jobs), so two customers can request the same
 * slot; whichever gets approved first wins it, and approving the second
 * would then hit the DB-level conflict.
 *
 * Pricing and end time are computed server-side; client totals are never
 * trusted.
 */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const b = parsed.data;

  const [services, allAddons, settings] = await Promise.all([
    getServices(),
    getAddons(),
    getSettings(),
  ]);

  const service = services.find((s) => s.id === b.serviceId);
  const pricing = service?.pricing.find((p) => p.tier === (b.tier as VehicleTier));
  if (!service || !pricing) {
    return NextResponse.json({ error: "Unknown service/tier" }, { status: 404 });
  }

  const chosenAddons = allAddons.filter((a) => b.addonIds.includes(a.id));
  const addonMinutes = chosenAddons.reduce((s, a) => s + a.duration_min, 0);
  const durationMin = pricing.duration_min + addonMinutes;

  const start = new Date(b.slotStart);
  const end = new Date(start.getTime() + durationMin * 60_000);

  const subtotal = pricing.price;
  const addonTotal = chosenAddons.reduce((s, a) => s + a.price, 0);
  const travelFee = travelFeeFor(b.distanceMi, settings.travel_fee_rules);
  const total = subtotal + addonTotal + travelFee;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Booking backend not configured. Set Supabase env vars to accept live bookings.",
      },
      { status: 503 },
    );
  }

  const sb = supabaseAdmin();

  // Find-or-create the customer by phone.
  let customerId: string;
  const { data: existing } = await sb
    .from("customers")
    .select("id")
    .eq("phone", b.customer.phone)
    .maybeSingle();

  if (existing) {
    customerId = existing.id;
    await sb
      .from("customers")
      .update({
        name: b.customer.name,
        email: b.customer.email || null,
        address: b.address,
      })
      .eq("id", customerId);
  } else {
    const { data: created, error: custErr } = await sb
      .from("customers")
      .insert({
        name: b.customer.name,
        phone: b.customer.phone,
        email: b.customer.email || null,
        address: b.address,
      })
      .select("id")
      .single();
    if (custErr || !created) {
      return NextResponse.json(
        { error: "Could not save customer" },
        { status: 500 },
      );
    }
    customerId = created.id;
  }

  // Optional vehicle record.
  let vehicleId: string | null = null;
  if (b.vehicle && (b.vehicle.make || b.vehicle.model || b.vehicle.year)) {
    const { data: veh } = await sb
      .from("vehicles")
      .insert({
        customer_id: customerId,
        tier: b.tier,
        year: b.vehicle.year ?? null,
        make: b.vehicle.make ?? null,
        model: b.vehicle.model ?? null,
        color: b.vehicle.color ?? null,
      })
      .select("id")
      .single();
    vehicleId = veh?.id ?? null;
  }

  // Distance from 75249, recomputed here (never trusted from the browser).
  // Far or unverifiable addresses are still accepted but flagged for the
  // operator in the internal notes, the email and the text.
  const located = await locateAddress(b.address);
  const distanceFlag = !located
    ? "⚠ Distance unverified: address not found, check it before accepting."
    : located.distanceMi > NEAR_RADIUS_MI
      ? `⚠ ${located.distanceMi.toFixed(1)} mi from 75249 (past the ${NEAR_RADIUS_MI}-mile range).`
      : null;

  const { data: booking, error: bookErr } = await sb
    .from("bookings")
    .insert({
      customer_id: customerId,
      service_id: service.id,
      vehicle_id: vehicleId,
      vehicle_tier: b.tier,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      service_address: b.address,
      lat: b.lat ?? located?.lat ?? null,
      lng: b.lng ?? located?.lng ?? null,
      water_access: b.waterAccess ?? null,
      outlet_access: b.outletAccess ?? null,
      status: "requested",
      source: b.source,
      subtotal,
      addon_total: addonTotal,
      travel_fee: travelFee,
      total,
      customer_notes: b.notes ?? null,
      internal_notes: distanceFlag,
    })
    .select("id, ref, manage_token, approval_token, scheduled_start, scheduled_end, total")
    .single();

  if (bookErr) {
    // 23P01 = exclusion_violation → slot was taken between availability and submit.
    if (bookErr.code === "23P01") {
      return NextResponse.json(
        { error: "That time was just booked. Please pick another slot.", code: "slot_taken" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Could not create booking", details: bookErr.message },
      { status: 500 },
    );
  }

  // Link add-ons at their booked price.
  if (chosenAddons.length > 0) {
    await sb.from("booking_addons").insert(
      chosenAddons.map((a) => ({
        booking_id: booking.id,
        addon_id: a.id,
        price_at_booking: a.price,
      })),
    );
  }

  // Notify the operator. The email (and the text, if SMS is set up) both
  // link into the dashboard, where the request is accepted, declined, or
  // given a new time. Each no-ops quietly when its env vars aren't set.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dallasdetailz.com";
  const dashboardUrl = `${siteUrl}/admin/bookings/${booking.id}`;
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: settings.timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(start);

  await sendEmail({
    to: NOTIFY_EMAIL,
    subject: `New booking request: ${b.customer.name}, ${when}`,
    html: requestEmailHtml({
      ref: booking.ref,
      service: service.name,
      total: Math.round(total),
      name: b.customer.name,
      phone: b.customer.phone,
      email: b.customer.email || null,
      when,
      address: b.address,
      notes: b.notes ?? null,
      flag: distanceFlag,
      dashboardUrl,
    }),
    text: [
      "New booking request",
      `${service.name} - $${Math.round(total)}`,
      `${b.customer.name}, ${b.customer.phone}`,
      when,
      b.address,
      distanceFlag ?? "",
      b.notes ? `Note: ${b.notes}` : "",
      "",
      `Accept it or offer a new time: ${dashboardUrl}`,
    ]
      .filter((l) => l !== "")
      .join("\n"),
  });

  const operatorPhone = process.env.OPERATOR_PHONE;
  if (operatorPhone) {
    const lines = [
      `New booking request (${booking.ref})`,
      `${service.name} — $${Math.round(total)}`,
      `${b.customer.name}, ${b.customer.phone}`,
      when,
      b.address,
    ];
    if (distanceFlag) lines.push(distanceFlag);
    if (b.notes) lines.push(`Note: ${b.notes}`);
    lines.push(dashboardUrl);
    await sendSms(operatorPhone, lines.join("\n"));
  }

  return NextResponse.json(
    {
      ref: booking.ref,
      manageToken: booking.manage_token,
      scheduledStart: booking.scheduled_start,
      scheduledEnd: booking.scheduled_end,
      total: Number(booking.total),
    },
    { status: 201 },
  );
}
