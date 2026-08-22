import "server-only";

/**
 * Outbound SMS via textbee.dev — a free Android-phone SMS gateway (the
 * phone's own carrier plan sends the text; no per-message API fee). Set up:
 *
 *   1. Install the textbee app (https://textbee.dev) on an Android phone
 *      that can stay on and connected — this is the phone that will
 *      actually send every text this app sends.
 *   2. Link the device in the textbee dashboard, note the API key.
 *   3. Set TEXTBEE_API_KEY in the environment.
 *
 * Free tier caps at 50 messages/day, 300/month — far above what a couple
 * bookings a week needs. If that ever changes, swap this file for a paid
 * provider (Twilio etc.) — every caller here goes through `sendSms`, so
 * that's the only place that would need to change.
 */

const TEXTBEE_URL = "https://api.textbee.dev/api/v1/gateway/send-sms";

export function isSmsConfigured(): boolean {
  return Boolean(process.env.TEXTBEE_API_KEY);
}

/**
 * Sends one SMS. Returns true on success. Never throws — a failed text
 * should not break the booking flow; callers should treat `false` as
 * "logged, but the booking itself already succeeded."
 */
export async function sendSms(to: string, message: string): Promise<boolean> {
  const apiKey = process.env.TEXTBEE_API_KEY;
  if (!apiKey) {
    console.warn("[sms] TEXTBEE_API_KEY not set — skipping send:", { to, message });
    return false;
  }

  try {
    const res = await fetch(TEXTBEE_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipients: [to], message }),
    });
    if (!res.ok) {
      console.error("[sms] textbee send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[sms] textbee send threw", err);
    return false;
  }
}
