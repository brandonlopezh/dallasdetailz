"use client";

import { useState } from "react";
import Link from "next/link";
import { BOOKING_FLOW_LIVE, INSTAGRAM_URL, bookHref } from "@/lib/site-config";

interface BookNowLinkProps {
  serviceId?: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}

/**
 * Every "Book Now" CTA on the public site routes through here so the
 * BOOKING_FLOW_LIVE switch in site-config.ts only has to be flipped once.
 * Live: goes to /book (optionally pre-selecting a service) — a normal fast
 * in-app navigation, no overlay. Not live: goes to Instagram DMs in a new
 * tab, with a brief "leaving the site" transition first so it's clear
 * something just happened, since a same-tab click can otherwise feel like
 * nothing occurred while the new tab opens behind it.
 */
export default function BookNowLink({
  serviceId,
  className,
  children,
  ...rest
}: BookNowLinkProps) {
  const [leaving, setLeaving] = useState(false);

  if (!BOOKING_FLOW_LIVE) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Modified clicks (middle-click, cmd/ctrl-click, etc.) should behave
      // exactly like a normal link — don't intercept those.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();

      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        window.open(INSTAGRAM_URL, "_blank", "noopener,noreferrer");
        return;
      }

      setLeaving(true);
      window.setTimeout(() => {
        window.open(INSTAGRAM_URL, "_blank", "noopener,noreferrer");
        setLeaving(false);
      }, 750);
    };

    return (
      <>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          onClick={handleClick}
          {...rest}
        >
          {children}
        </a>
        {leaving && <LeavingOverlay />}
      </>
    );
  }

  const href = bookHref(serviceId);
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}

function LeavingOverlay() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-base/90 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <span className="animate-bucket-glow text-6xl" aria-hidden="true">
        🪣
      </span>
      <p className="font-[family-name:var(--font-display)] text-lg font-bold">
        Taking you to Instagram…
      </p>
      <p className="text-sm text-muted">Opening in a new tab</p>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="link-sweep mt-2 text-sm font-semibold text-accent-hi"
      >
        Tap here if it doesn&apos;t open
      </a>
    </div>
  );
}
