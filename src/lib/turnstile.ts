import "server-only";

/**
 * Cloudflare Turnstile (free bot check) for the public booking form.
 *
 * Off until both keys exist: with TURNSTILE_SECRET_KEY unset every request
 * passes, so local dev and previews keep working without keys. Set
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY (build time) and TURNSTILE_SECRET_KEY
 * (Worker secret) together to turn it on.
 */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(
  token: string | undefined,
  ip: string | null,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Fail closed: if Cloudflare can't be reached, don't accept unverified requests.
    return false;
  }
}
