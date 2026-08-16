import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/ssr";

/**
 * Magic-link landing. Supabase redirects here with a `code`; we exchange it for
 * a session (cookies are set by the SSR client) and send the operator into the
 * admin. On error, back to login.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const origin = req.nextUrl.origin;

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/admin`);
    }
  }

  return NextResponse.redirect(`${origin}/admin/login?error=auth`);
}
