import "server-only";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase/server";

export const NOTIFY_EMAILS_KEY = "notify_emails";
export const MAX_NOTIFY_EMAILS = 10;

/** Used only until addresses are saved in the admin: ADMIN_NOTIFY_EMAIL (comma-separated), else the original default. */
function fallbackEmails(): string[] {
  const fromEnv = (process.env.ADMIN_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : ["brandolopz@gmail.com"];
}

export interface NotifyEmails {
  emails: string[];
  /** True when the list was saved in the admin; false when it's the fallback. */
  saved: boolean;
  /** True when the admin_settings table doesn't exist yet (migration 0015). */
  needsSetup: boolean;
}

/** Who gets the "new booking request" email. Never throws. */
export async function getNotifyEmails(): Promise<NotifyEmails> {
  if (!isSupabaseConfigured()) return { emails: fallbackEmails(), saved: false, needsSetup: false };
  try {
    const { data, error } = await supabaseAdmin()
      .from("admin_settings")
      .select("value")
      .eq("key", NOTIFY_EMAILS_KEY)
      .maybeSingle();
    if (error) return { emails: fallbackEmails(), saved: false, needsSetup: true };
    const list = Array.isArray(data?.value)
      ? data.value.filter((e): e is string => typeof e === "string" && e.includes("@"))
      : [];
    if (list.length > 0) return { emails: list, saved: true, needsSetup: false };
  } catch {
    // fall through to the fallback
  }
  return { emails: fallbackEmails(), saved: false, needsSetup: false };
}
