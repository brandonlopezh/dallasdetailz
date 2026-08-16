"use client";

import Link from "next/link";

/**
 * Sticky mobile Book Now bar — PRD §5.1 R1 / §7.4 ("persists throughout").
 * Hidden on md+ where the header CTA is always visible.
 */
export default function MobileBookBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-base/90 p-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <a
          href="tel:+10000000000"
          className="tap grid aspect-square place-items-center rounded-[var(--radius-sm)] border border-border text-lg"
          aria-label="Call Dallas Detailz"
        >
          📞
        </a>
        <Link
          href="/book"
          className="tap flex flex-1 items-center justify-center rounded-[var(--radius-sm)] bg-accent px-4 text-base font-bold text-white"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
