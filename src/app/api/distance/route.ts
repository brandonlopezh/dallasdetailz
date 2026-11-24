import { NextRequest, NextResponse } from "next/server";
import { looksLikeStreetAddress } from "@/lib/address";
import { NEAR_RADIUS_MI, lookupAddress } from "@/lib/distance";

/**
 * GET /api/distance?address= — checks that an address really exists and how
 * far (straight-line miles) it is from ZIP 75249. The booking form uses it to
 * hold the Continue button until the address is verified, and to show the
 * "outside our usual range" notice (which never blocks).
 *
 * status: "found" | "not_found" | "unverified" (lookup services unreachable;
 * the form lets that through rather than turn customers away).
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim() ?? "";
  if (address.length < 4 || address.length > 200) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  if (!looksLikeStreetAddress(address)) {
    return NextResponse.json({ status: "not_found", distanceMi: null, far: false });
  }
  const r = await lookupAddress(address);
  return NextResponse.json({
    status: r.status,
    distanceMi: r.status === "found" ? Math.round(r.distanceMi * 10) / 10 : null,
    far: r.status === "found" ? r.distanceMi > NEAR_RADIUS_MI : false,
  });
}
