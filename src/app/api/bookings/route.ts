import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { getAddonsCached, getServicesCached, getSettingsCached } from "@/lib/catalog";
import { findCustomerByPhone } from "@/lib/customers";
import { getOpenDays, isOpenSlot } from "@/lib/open-slots";
import { formatPhone, phoneDigits } from "@/lib/phone";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms";
import { escapeHtml, sendEmail } from "@/lib/email";
import { getNotifyEmails } from "@/lib/notify-emails";
import { NEAR_RADIUS_MI, lookupAddress } from "@/lib/distance";
import { looksLikeStreetAddress } from "@/lib/address";
import type { VehicleTier } from "@/lib/types";
import { verifyTurnstile } from "@/lib/turnstile";

const bodySchema = z.object({
  serviceId: z.string().min(1),
  tier: z.enum(["sedan", "mid_suv", "large_suv", "xl"]),
  addonIds: z.array(z.string()).default([]),
  slotStart: z.string().datetime(), // ISO, must be a returned open slot
  // Must be a real street address (number + street); verified by geocoder below.
  address: z.string().trim().min(4).max(200).refine(looksLikeStreetAddress),
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
  // The customer ticked "you agree to let us contact you". Required so a
  // request can't be created without it; the time is logged in internal_notes.
  contactConsent: z.literal(true),
  // Bot checks: Turnstile token (verified below when keys are set) and a
  // honeypot field real visitors never see or fill in.
  turnstileToken: z.string().max(4096).optional(),
  website: z.string().max(200).optional(),
  source: z
    .enum(["web", "instagram", "phone", "manual", "referral"])
    .default("web"),
});

const BAD_ADDRESS_MESSAGE =
  "We couldn't find that address. Please enter the full street address (number, street, city and ZIP), or pick one from the suggestions.";

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
  vehicle: string | null;
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
    ${r.vehicle ? row("Vehicle", r.vehicle) : ""}
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
 * trusted. The requested time must be one of the currently open slots.
 */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    if (parsed.error.flatten().fieldErrors.address) {
      return NextResponse.json(
        { error: BAD_ADDRESS_MESSAGE, code: "bad_address" },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: "Invalid booking", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const b = parsed.data;

  if (b.website) {
    return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
  }
  const human = await verifyTurnstile(b.turnstileToken, req.headers.get("cf-connecting-ip"));
  if (!human) {
    return NextResponse.json(
      { error: "Couldn't verify you're not a bot. Please try again." },
      { status: 403 },
    );
  }

  const digits = phoneDigits(b.customer.phone);
  if (!digits) {
    return NextResponse.json(
      { error: "Please enter a 10-digit mobile number." },
      { status: 400 },
    );
  }
  const phone = formatPhone(digits);

  const [services, allAddons, settings] = await Promise.all([
    getServicesCached(),
    getAddonsCached(),
    getSettingsCached(),
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

  // Three independent lookups, run together: is the time still open, where is
  // the address (never trusted from the browser), and do we know this number.
  const [openDays, lookup, existing] = await Promise.all([
    getOpenDays(durationMin, settings),
    lookupAddress(b.address),
    findCustomerByPhone(sb, phone),
  ]);

  // A request needs an address we can actually drive to. Only a definite
  // "no such address" is refused; if the lookup services are down we let it
  // through (it's flagged for the operator below) rather than lose a customer.
  if (lookup.status === "not_found") {
    return NextResponse.json(
      { error: BAD_ADDRESS_MESSAGE, code: "bad_address" },
      { status: 422 },
    );
  }
  const located = lookup.status === "found" ? lookup : null;

  if (!isOpenSlot(openDays, b.slotStart)) {
    return NextResponse.json(
      { error: "That time is no longer available. Please pick another time.", code: "slot_taken" },
      { status: 409 },
    );
  }

  // Find-or-create the customer by phone. A known customer's saved name is
  // never overwritten from this public form (anyone could type someone
  // else's number); only blanks are filled in, and a different name is noted
  // on the request for the operator.
  let customerId: string;
  let nameFlag: string | null = null;
  if (existing) {
    customerId = existing.id;
    const fill: Record<string, string> = {};
    if (!existing.email && b.customer.email) fill.email = b.customer.email;
    if (!existing.address) fill.address = b.address;
    if (Object.keys(fill).length > 0) {
      await sb.from("customers").update(fill).eq("id", customerId);
    }
    if (existing.name.trim().toLowerCase() !== b.customer.name.trim().toLowerCase()) {
      nameFlag = `Name given on this request: ${b.customer.name.trim()} (number on file for ${existing.name}).`;
    }
  } else {
    const { data: created, error: custErr } = await sb
      .from("customers")
      .insert({
        name: b.customer.name.trim(),
        phone,
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

  // Far or unverifiable addresses are still accepted but flagged for the
  // operator in the internal notes, the email and the text.
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
      internal_notes:
        [distanceFlag, nameFlag, `Consent to be contacted accepted ${new Date().toISOString()}`]
          .filter(Boolean)
          .join("\n"),
    })
    .select("id, ref, scheduled_start, scheduled_end, total")
    .single();

  if (bookErr) {
    // 23P01 = exclusion_violation → slot was taken between availability and submit.
    if (bookErr.code === "23P01") {
      return NextResponse.json(
        { error: "That time was just booked. Please pick another slot.", code: "slot_taken" },
        { status: 409 },
      );
    }
    console.error("[bookings] insert failed", bookErr);
    return NextResponse.json({ error: "Could not create booking" }, { status: 500 });
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

  const vehicleLabel =
    [b.vehicle?.year, b.vehicle?.make, b.vehicle?.model].filter(Boolean).join(" ") || null;

  // Recipients are managed in /admin/website → Request emails.
  const emailJob = async () =>
    sendEmail({
      to: (await getNotifyEmails()).emails,
      subject: `New booking request: ${b.customer.name}, ${when}`,
      html: requestEmailHtml({
        ref: booking.ref,
        service: service.name,
        total: Math.round(total),
        name: b.customer.name,
        phone,
        email: b.customer.email || null,
        vehicle: vehicleLabel,
        when,
        address: b.address,
        notes: b.notes ?? null,
        flag: [distanceFlag, nameFlag].filter(Boolean).join(" ") || null,
        dashboardUrl,
      }),
      text: [
        "New booking request",
        `${service.name} - $${Math.round(total)}`,
        `${b.customer.name}, ${phone}`,
        when,
        b.address,
        vehicleLabel ? `Vehicle: ${vehicleLabel}` : "",
        distanceFlag ?? "",
        nameFlag ?? "",
        b.notes ? `Note: ${b.notes}` : "",
        "",
        `Accept it or offer a new time: ${dashboardUrl}`,
      ]
        .filter((l) => l !== "")
        .join("\n"),
    });

  const operatorPhone = process.env.OPERATOR_PHONE;
  let smsJob: (() => Promise<boolean>) | null = null;
  if (operatorPhone) {
    const lines = [
      `New booking request (${booking.ref})`,
      `${service.name} — $${Math.round(total)}`,
      `${b.customer.name}, ${phone}`,
      when,
      b.address,
    ];
    if (vehicleLabel) lines.push(`Vehicle: ${vehicleLabel}`);
    if (distanceFlag) lines.push(distanceFlag);
    if (nameFlag) lines.push(nameFlag);
    if (b.notes) lines.push(`Note: ${b.notes}`);
    lines.push(dashboardUrl);
    smsJob = () => sendSms(operatorPhone, lines.join("\n"));
  }

  // Sent after the response, so the customer isn't kept waiting on the email
  // and text providers. The request is already saved either way.
  after(async () => {
    await Promise.all([emailJob(), smsJob?.()]);
  });

  return NextResponse.json(
    {
      ref: booking.ref,
      scheduledStart: booking.scheduled_start,
      scheduledEnd: booking.scheduled_end,
      total: Number(booking.total),
    },
    { status: 201 },
  );
}
