import InstagramIcon from "./icons/InstagramIcon";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, SNAPWIDGET_ID } from "@/lib/site-config";

/**
 * Embeds the @dallasdetailz feed via SnapWidget (see site-config.ts for
 * setup). Falls back to a simple "Follow us" card when no widget ID is
 * configured yet, so this section never renders empty or broken.
 */
export default function InstagramFeed() {
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

  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="hover-lift flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface px-6 py-16 text-center transition-colors hover:border-accent"
    >
      <InstagramIcon className="h-9 w-9 text-accent-hi" />
      <p className="font-[family-name:var(--font-display)] text-xl font-bold">
        Follow {INSTAGRAM_HANDLE}
      </p>
      <p className="max-w-sm text-sm text-muted">
        See our latest jobs and behind-the-scenes on Instagram.
      </p>
    </a>
  );
}
