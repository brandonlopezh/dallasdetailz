import { INSTAGRAM_URL } from "@/lib/site-config";

/** "Want a quicker response? DM us on Instagram" — the blue linked nudge
 * used wherever we point people at Instagram DMs as the fast path. */
export default function InstagramNudge({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm text-muted ${className}`}>
      Want a quicker response?{" "}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[#3b82f6] underline decoration-[#3b82f6]/40 underline-offset-2 transition-colors hover:text-[#60a5fa] hover:decoration-[#60a5fa]"
      >
        DM us on Instagram
      </a>
    </p>
  );
}
