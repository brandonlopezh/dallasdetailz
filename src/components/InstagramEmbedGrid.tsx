"use client";

import { useEffect } from "react";
import Script from "next/script";
import { INSTAGRAM_POST_URLS } from "@/lib/instagram-posts";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

/**
 * Renders Instagram's official oEmbed blockquote for each URL in
 * INSTAGRAM_POST_URLS, then loads instagram.com/embed.js to swap them for
 * the real embedded posts. No API keys, no token to refresh — the tradeoff
 * is it's a manually curated list rather than an auto-updating feed. See
 * src/lib/instagram-posts.ts to add/swap posts.
 */
export default function InstagramEmbedGrid() {
  useEffect(() => {
    // embed.js only auto-processes blockquotes present when IT loads. If
    // it's already cached from an earlier page (client-side nav back here),
    // this component's blockquotes would otherwise sit unprocessed.
    if (window.instgrm) window.instgrm.Embeds.process();
  }, []);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {INSTAGRAM_POST_URLS.map((url) => (
          <div key={url} className="mx-auto w-full max-w-[400px]">
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
