import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/ssr";

/**
 * GET /api/admin/refresh — pings the Supabase session so a near-expiry
 * access token gets refreshed and the new cookies get persisted.
 *
 * Next.js 16's proxy.ts (formerly middleware) used to do this on every
 * /admin request, but it always runs on the Node.js runtime, which
 * Cloudflare's OpenNext adapter doesn't support yet — so proxy.ts was
 * removed. This route + <SessionRefresher> (pinged periodically from the
 * admin dashboard, see src/components/admin/SessionRefresher.tsx) stand in
 * for that. It's *not* the auth boundary either — same as before, that's
 * getAdminUser(), called independently by the (dash) layout and every
 * /api/admin/* route.
 */
export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return NextResponse.json({ ok: Boolean(user) });
}
