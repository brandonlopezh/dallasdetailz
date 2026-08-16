import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie and guards /admin. Unauthenticated
 * hits to /admin (except the login + auth-callback routes) are redirected to
 * the login page. Admin-email enforcement happens in the admin layout/APIs.
 * If Supabase isn't configured, we let requests through so the admin pages can
 * render a "configure Supabase" notice instead of redirect-looping.
 */
export async function middleware(req: NextRequest) {
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
