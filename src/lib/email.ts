import "server-only";

/**
 * Outbound email via Resend (resend.com — free tier, plain HTTPS so it runs
 * on Workers). Set RESEND_API_KEY to enable. Until you verify a domain in
 * Resend, mail can only go to the address that owns the Resend account
 * (sender defaults to Resend's shared onboarding@resend.dev); once a domain
 * is verified, set EMAIL_FROM, e.g. "Dallas Detailz <bookings@dallasdetailz.com>".
 */

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Dallas Detailz <onboarding@resend.dev>";

/** Where new-booking requests get emailed. */
export const NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "brandolopz@gmail.com";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends one email. Returns true on success. Never throws — a failed email
 * must not break the booking flow (the request is already saved and shows
 * up in the dashboard regardless).
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping send:", opts.subject);
    return false;
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      console.error("[email] resend failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] resend threw", err);
    return false;
  }
}
