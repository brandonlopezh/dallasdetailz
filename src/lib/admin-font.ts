import { Figtree } from "next/font/google";

/**
 * The admin's one typeface: Figtree, a clean, open sans-serif that stays easy
 * to read at small sizes and in long lists. Loaded here (not in the root
 * layout) so only /admin pages download it. The public site keeps its brand
 * fonts. Apply `adminFont.variable` on the element that carries
 * id="admin-root"; globals.css does the rest.
 */
export const adminFont = Figtree({
  variable: "--font-admin",
  subsets: ["latin"],
});
