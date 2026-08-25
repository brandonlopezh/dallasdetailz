"use client";

import InstagramIcon from "./icons/InstagramIcon";
import { useLanguage } from "./LanguageProvider";
import { INSTAGRAM_URL, PHONE_SMS, PHONE_TEL } from "@/lib/site-config";

/**
 * Sticky mobile Book Now bar — PRD §5.1 R1 / §7.4 ("persists throughout").
 * Hidden on md+ where the header CTA is always visible.
 */
export default function MobileBookBar() {
  const { t } = useLanguage();
  const bookNowSmsHref = `${PHONE_SMS}?&body=${encodeURIComponent(t.mobileBar.bookNowSmsBody)}`;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-base/90 p-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <a
          href={PHONE_TEL}
          className="tap grid aspect-square place-items-center rounded-[var(--radius-sm)] border border-border text-lg"
          aria-label={t.mobileBar.callLabel}
          title={t.mobileBar.callLabel}
        >
          📞
        </a>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="tap group relative grid aspect-square place-items-center rounded-[var(--radius-sm)] border border-border"
          aria-label={t.mobileBar.instagramTooltip}
          title={t.mobileBar.instagramTooltip}
        >
          <InstagramIcon className="h-5 w-5" />
          <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-[11rem] -translate-x-1/2 scale-90 rounded-md bg-ink px-2 py-1 text-center text-xs font-medium text-[var(--color-base)] opacity-0 shadow-lg transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
            {t.mobileBar.instagramTooltip}
          </span>
        </a>
        <a
          href={bookNowSmsHref}
          className="tap flex flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-accent px-4 text-base font-bold text-white transition-colors hover:bg-accent-hi"
        >
          {t.common.bookNow}
        </a>
      </div>
    </div>
  );
}
