import "server-only";
import { supabaseServer } from "./supabase/ssr";
import { isSupabaseConfigured } from "./supabase/server";

/**
 * Admin allowlist. Only the two brothers' emails should be here. Set
 * ADMIN_EMAILS in the environment as a comma-separated list. Empty/unset =
 * nobody has admin access (fail closed).
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export interface AdminUser {
  id: string;
  email: string;
}

/** Returns the signed-in admin, or null if not authenticated / not allowlisted. */
export async function getAdminUser(): Promise<AdminUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return { id: user.id, email: user.email! };
}
