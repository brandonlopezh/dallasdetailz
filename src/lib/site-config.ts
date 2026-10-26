// Small shared switches for the public site. Centralized here so flipping
// one flag changes every "Book Now" CTA at once, instead of hunting through
// every component that links to /book.

export const INSTAGRAM_URL = "https://www.instagram.com/dallasdetailz";
export const INSTAGRAM_HANDLE = "@dallasdetailz";
export const PHONE_TEL = "tel:+12149913908";
export const PHONE_SMS = "sms:+12149913908";
export const PHONE_DISPLAY = "(214) 991-3908";

/**
 * Powers the "On Instagram" feed section. SnapWidget (snapwidget.com) is a
 * free, no-code Instagram feed embed — connect the @dallasdetailz account on
 * their site once, and they hand you back a numeric widget ID; no API keys
 * or token refreshing on our end (they maintain that connection on theirs).
 * Set NEXT_PUBLIC_SNAPWIDGET_ID to that ID. Unset = the section falls back
 * to a plain "Follow us on Instagram" card instead of an empty/broken embed.
 */
export const SNAPWIDGET_ID = process.env.NEXT_PUBLIC_SNAPWIDGET_ID;

/** Default target of the hero phone mockup (editable in /admin/website). */
export const HERO_REEL_URL = "https://www.instagram.com/reel/DcosRMvh6GX/";
