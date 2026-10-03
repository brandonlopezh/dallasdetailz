import "server-only";
import { supabaseServer } from "./supabase/ssr";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase/server";

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

/**
 * master  — an ADMIN_EMAILS account: everything, plus managing users.
 * manager — everything except managing users.
 * editor  — Settings (website edits) only.
 * manager/editor live in the admin_users table (see 0008_admin_users.sql).
 */
export type AdminRole = "master" | "manager" | "editor";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
}

async function roleForEmail(email: string): Promise<AdminRole | null> {
  const e = email.toLowerCase();
  if (isAdminEmail(e)) return "master"; // checked first so a DB problem can't lock the owner out
  const { data } = await supabaseAdmin()
    .from("admin_users")
    .select("role")
    .eq("email", e)
    .maybeSingle();
  return data?.role === "manager" || data?.role === "editor" ? data.role : null;
}

/** Returns the signed-in admin (any role), or null if not authenticated / not allowed. */
export async function getAdminUser(): Promise<AdminUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const role = await roleForEmail(user.email);
  return role ? { id: user.id, email: user.email, role } : null;
}

/** Admin who may touch bookings/customers (not editors). */
export async function getBookingsUser(): Promise<AdminUser | null> {
  const user = await getAdminUser();
  return user && user.role !== "editor" ? user : null;
}

/** Master only — user management. */
export async function getMasterUser(): Promise<AdminUser | null> {
  const user = await getAdminUser();
  return user?.role === "master" ? user : null;
}
