import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cookie-backed Supabase client for server components and route handlers.
 * Uses the anon key + the signed-in user's session, so RLS applies. Used for
 * admin auth (reading the current user); privileged writes use supabaseAdmin().
 */
export async function supabaseServer() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — safe to ignore; middleware refreshes.
        }
      },
    },
  });
}
