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
 * master  — an ADMIN_EMAILS account (the owner, can't be removed) or a user
 *           promoted to master on the Users page: everything, plus managing users.
 * manager — everything except managing users.
 * editor  — Settings (website edits) only.
 * Promoted masters, managers and editors live in the admin_users table (see 0008_admin_users.sql).
 */
export type AdminRole = "master" | "manager" | "editor";

export interface AdminUser {
  id: string;
  email: string;
  /** Full display name. */
  name: string;
  /** Used for "Hi {firstName}". */
  firstName: string;
  role: AdminRole;
}

function prettyName(email: string): string {
  const local = email.split("@")[0].split(/[._+-]/)[0] || email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/** Name set on the Users page (admin_profiles) → operators table → auth metadata → email. */
async function displayName(
  email: string,
  meta: Record<string, unknown> | undefined,
): Promise<{ name: string; firstName: string }> {
  const e = email.toLowerCase();
  try {
    const { data } = await supabaseAdmin()
      .from("admin_profiles")
      .select("first_name, last_name")
      .eq("email", e)
      .maybeSingle();
    const first = data?.first_name?.trim();
    if (first) return { firstName: first, name: `${first} ${data?.last_name?.trim() ?? ""}`.trim() };
  } catch {
    // table not created yet → fall through
  }
  try {
    const { data } = await supabaseAdmin().from("operators").select("name").eq("email", e).maybeSingle();
    if (data?.name?.trim()) return { name: data.name.trim(), firstName: data.name.trim().split(" ")[0] };
  } catch {
    // fall through
  }
  const fromMeta = meta?.full_name ?? meta?.name;
  if (typeof fromMeta === "string" && fromMeta.trim())
    return { name: fromMeta.trim(), firstName: fromMeta.trim().split(" ")[0] };
  const pretty = prettyName(email);
  return { name: pretty, firstName: pretty };
}

async function roleForEmail(email: string): Promise<AdminRole | null> {
  const e = email.toLowerCase();
  if (isAdminEmail(e)) return "master"; // checked first so a DB problem can't lock the owner out
  const { data } = await supabaseAdmin()
    .from("admin_users")
    .select("role")
    .eq("email", e)
    .maybeSingle();
  return data?.role === "master" || data?.role === "manager" || data?.role === "editor"
    ? data.role
    : null;
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
  if (!role) return null;
  const { name, firstName } = await displayName(user.email, user.user_metadata);
  return { id: user.id, email: user.email, name, firstName, role };
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
