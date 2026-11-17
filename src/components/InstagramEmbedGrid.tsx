"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

/**
 * Renders Instagram's official oEmbed blockquote for each URL in
 * `urls`, then loads instagram.com/embed.js to swap them for
 * the real embedded posts. No API keys, no token to refresh — the tradeoff
 * is it's a manually curated list rather than an auto-updating feed. Posts are
 * managed in /admin/website.
 *
 * On phones the posts sit in one swipeable row instead of a tall stack (three
 * posts stacked ran to several screens of scrolling). Instagram's embed is
 * never narrower than 326px, so each slide is sized to fit that and the card
 * padding is trimmed; before, the embed ran past the right edge of its card.
 */
export default function InstagramEmbedGrid({ urls }: { urls: string[] }) {
  const grid = useRef<HTMLDivElement>(null);

  // Instagram's script injects untitled iframes; give each a name for screen readers.
  useEffect(() => {
    const el = grid.current;
    if (!el) return;
    const label = () =>
      el.querySelectorAll("iframe:not([title])").forEach((f, i) => f.setAttribute("title", `Instagram post ${i + 1}`));
    label();
    const mo = new MutationObserver(label);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    // embed.js only auto-processes blockquotes present when IT loads. If
    // it's already cached from an earlier page (client-side nav back here),
    // this component's blockquotes would otherwise sit unprocessed.
    if (window.instgrm) window.instgrm.Embeds.process();
  }, []);

  return (
    <>
      <div
        ref={grid}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
      >
        {urls.map((url) => (
          <div
            key={url}
            className="w-[340px] max-w-[92vw] shrink-0 snap-center overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface p-1.5 shadow-lg sm:mx-auto sm:w-full sm:max-w-[400px] sm:shrink sm:p-4"
          >
            <blockquote
              className="instagram-media"
              data-instgrm-captioned=""
              data-instgrm-permalink={url}
              data-instgrm-version="14"
              style={{
                background: "#FFF",
                border: 0,
                borderRadius: 3,
                boxShadow: "0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)",
                margin: "0 auto",
                maxWidth: 400,
                minHeight: 400,
                minWidth: 280,
                padding: 0,
                width: "100%",
              }}
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 text-center text-sm text-[#3897f0]"
              >
                View this post on Instagram
              </a>
            </blockquote>
          </div>
        ))}
      </div>
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
        onReady={() => window.instgrm?.Embeds.process()}
        onLoad={() => window.instgrm?.Embeds.process()}
      />
    </>
  );
}
