import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getBookingByApprovalToken } from "@/lib/admin-bookings";
import { sendSms } from "@/lib/sms";

/**
 * POST /api/confirm/[token] — the operator (brother) approves or declines a
 * requested booking by tapping a button on the /confirm/[token] page, which
 * posts here as a plain HTML form (no JS required, so it works from the
 * texted link on any phone). Mirrors the 23P01-conflict handling in
 * /api/admin/bookings/[id] since this does the same status transition.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const back = (suffix = "") =>
    NextResponse.redirect(new URL(`/confirm/${token}${suffix}`, req.url), {
      status: 303,
    });

  const form = await req.formData().catch(() => null);
  const action = form?.get("action");
  if (action !== "approve" && action !== "decline") return back();

  const booking = await getBookingByApprovalToken(token);
  if (!booking) return back();
  // Already handled (or a double tap) — the page shows the current status.
  if (booking.status !== "requested") return back();

  const sb = supabaseAdmin();
  const customerPhone = booking.customers?.phone;
  const customerName = booking.customers?.name ?? "there";
  const when = new Date(booking.scheduled_start).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  if (action === "approve") {
    const { error } = await sb
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", booking.id)
      .eq("status", "requested"); // no-op if it was already handled since we last read it

    if (error) {
      // 23P01 = exclusion_violation — another job already confirmed for an
      // overlapping time. Leave this one as `requested`; the operator picks
      // decline or reaches out directly.
      if (error.code === "23P01") return back("?error=conflict");
      return back();
    }

    if (customerPhone) {
      await sendSms(
        customerPhone,
        `Hi ${customerName}, your Dallas Detailz booking for ${when} was approved. See you soon!`,
      );
    }
    return back();
  }

  // decline
  const { error } = await sb
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", booking.id)
    .eq("status", "requested");
  if (error) return back();

  if (customerPhone) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dallasdetailz.com";
    await sendSms(
      customerPhone,
      `Hi ${customerName}, sorry, that time isn't available after all. Pick another time here: ${siteUrl}/book`,
    );
  }
  return back();
}
