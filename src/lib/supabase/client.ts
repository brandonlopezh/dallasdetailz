import { createBrowserClient } from "@supabase/ssr";

/**
 * Anon browser client. Only sees what RLS allows anon to see: the public
 * catalog (services, pricing, add-ons, settings). Used by client components
 * that need live catalog data; the booking flow itself posts to /api routes.
 */
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createBrowserClient(url, anonKey);
}
