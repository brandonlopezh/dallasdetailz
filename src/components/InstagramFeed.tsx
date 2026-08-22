"use client";

import InstagramEmbedGrid from "./InstagramEmbedGrid";
import InstagramIcon from "./icons/InstagramIcon";
import { useLanguage } from "./LanguageProvider";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, SNAPWIDGET_ID } from "@/lib/site-config";
import { INSTAGRAM_POST_URLS } from "@/lib/instagram-posts";

/**
 * Three tiers, in priority order:
 *  1. SnapWidget (see SNAPWIDGET_ID in site-config.ts) — a real live-syncing
 *     feed, once that connection is set up.
 *  2. A manually curated grid of posts (see instagram-posts.ts) — what's
 *     live today. No API keys, but doesn't auto-update; someone has to
 *     paste in new post URLs occasionally.
 *  3. A plain "Follow us" card, only if neither of the above is configured
 *     — so this section never renders empty or broken.
 */
export default function InstagramFeed() {
  const { t } = useLanguage();

  if (SNAPWIDGET_ID) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <iframe
          src={`https://snapwidget.com/embed/${SNAPWIDGET_ID}`}
          className="h-[420px] w-full border-0"
          title={`${INSTAGRAM_HANDLE} Instagram feed`}
          loading="lazy"
        />
      </div>
    );
  }

  if (INSTAGRAM_POST_URLS.length > 0) {
    return <InstagramEmbedGrid />;
  }

  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="hover-lift flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface px-6 py-16 text-center transition-colors hover:border-accent"
    >
      <InstagramIcon className="h-9 w-9 text-accent-hi" />
      <p className="font-[family-name:var(--font-display)] text-xl font-bold">
        {INSTAGRAM_HANDLE}
      </p>
      <p className="max-w-sm text-sm text-muted">{t.instagram.followBody}</p>
    </a>
  );
}
