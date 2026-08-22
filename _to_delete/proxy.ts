import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (formerly middleware) — runs on the Node.js runtime.
 * Refreshes the Supabase session cookie and does a convenience redirect for
 * unauthenticated /admin hits (except login + auth-callback). This is NOT the
 * auth boundary — real enforcement is in the admin (dash) layout and every
 * /api/admin route (server-side getAdminUser). If Supabase isn't configured we
 * let requests through so admin pages can render a "configure" notice.
 */
export async function proxy(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const res = NextResponse.next({ request: req });
  if (!url || !anon) return res;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          res.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;
  const isPublicAdminPath =
    pathname.startsWith("/admin/login") || pathname.startsWith("/admin/auth");

  if (!user && pathname.startsWith("/admin") && !isPublicAdminPath) {
    const redirect = req.nextUrl.clone();
    redirect.pathname = "/admin/login";
    return NextResponse.redirect(redirect);
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
