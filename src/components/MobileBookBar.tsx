"use client";

import BookNowLink from "./BookNowLink";
import InstagramIcon from "./icons/InstagramIcon";
import MessageIcon from "./icons/MessageIcon";
import { useLanguage } from "./LanguageProvider";
import { INSTAGRAM_URL } from "@/lib/site-config";

/**
 * Sticky mobile bar — PRD §5.1 R1 / §7.4 ("persists throughout"). Just three
 * things: text us, Instagram, and Book Now (opens the request popup).
 * Hidden on md+ where the header CTA is always visible.
 */
export default function MobileBookBar() {
  const { t, lang, contact } = useLanguage();
  const textLabel = lang === "es" ? "Envíanos un mensaje" : "Text us";
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-base/90 p-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <a
          href={contact.sms}
          className="tap grid aspect-square place-items-center rounded-[var(--radius-sm)] border border-border"
          aria-label={textLabel}
          title={textLabel}
        >
          <MessageIcon className="h-5 w-5" />
        </a>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="tap grid aspect-square place-items-center rounded-[var(--radius-sm)] border border-border"
          aria-label={t.mobileBar.instagramTooltip}
          title={t.mobileBar.instagramTooltip}
        >
          <InstagramIcon className="h-5 w-5" />
        </a>
        <BookNowLink className="tap flex flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-accent px-4 text-base font-bold text-white transition-colors hover:bg-accent-hi">
          {t.common.bookNow}
        </BookNowLink>
      </div>
    </div>
  );
}
