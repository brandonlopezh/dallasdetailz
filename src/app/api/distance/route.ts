import { NextRequest, NextResponse } from "next/server";
import { NEAR_RADIUS_MI, locateAddress } from "@/lib/distance";

/**
 * GET /api/distance?address= — how far (straight-line miles) an address is
 * from ZIP 75249. Powers the "outside our usual range" notice in the booking
 * popup; it never blocks. `distanceMi` is null when the address isn't found.
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim() ?? "";
  if (address.length < 4 || address.length > 200) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  const found = await locateAddress(address);
  return NextResponse.json({
    distanceMi: found ? Math.round(found.distanceMi * 10) / 10 : null,
    far: found ? found.distanceMi > NEAR_RADIUS_MI : false,
  });
}
