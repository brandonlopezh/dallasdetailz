// Small shared switches for the public site. Centralized here so flipping
// one flag changes every "Book Now" CTA at once, instead of hunting through
// every component that links to /book.

export const INSTAGRAM_URL = "https://www.instagram.com/dallasdetailz";
export const INSTAGRAM_HANDLE = "@dallasdetailz";
export const PHONE_TEL = "tel:+12149913908";
export const PHONE_DISPLAY = "(214) 991-3908";

/**
 * The in-site request flow (/book → operator SMS approval → customer
 * follow-up text, plus Apple Calendar busy-time sync) is fully built — see
 * README "Booking approval (SMS) + calendar sync" — but nothing fires until
 * TEXTBEE_API_KEY, OPERATOR_PHONE, and (optionally) the Apple Calendar env
 * vars are set up. Until then, a request submitted there would just sit
 * quietly in the database with no one notified.
 *
 * So for now this stays `false`: every "Book Now" CTA sends people straight
 * to Instagram DMs instead, which the brothers can already see and reply to.
 * Nothing about the request flow was removed — /book, the approval page,
 * and the SMS/calendar code all still work exactly as built. Flip this to
 * `true` once the env vars above are set, and every CTA switches back to
 * the in-site flow automatically.
 */
export const BOOKING_FLOW_LIVE = false;

/** Where a "Book Now" CTA should point, given the flag above. */
export function bookHref(serviceId?: string): string {
  if (!BOOKING_FLOW_LIVE) return INSTAGRAM_URL;
  return serviceId ? `/book?service=${serviceId}` : "/book";
}
