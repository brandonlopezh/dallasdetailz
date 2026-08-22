"use client";

import { useLanguage } from "./LanguageProvider";
import { INSTAGRAM_URL } from "@/lib/site-config";

/** "Want a quicker response? DM us on Instagram" — the blue linked nudge
 * used wherever we point people at Instagram DMs as the fast path. */
export default function InstagramNudge({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <p className={`text-sm text-muted ${className}`}>
      {t.instagramNudge.question}{" "}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[#3b82f6] underline decoration-[#3b82f6]/40 underline-offset-2 transition-colors hover:text-[#60a5fa] hover:decoration-[#60a5fa]"
      >
        {t.instagramNudge.cta}
      </a>
    </p>
  );
}
