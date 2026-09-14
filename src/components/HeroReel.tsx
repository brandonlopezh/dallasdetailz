"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import InstagramIcon from "./icons/InstagramIcon";
import { INSTAGRAM_HANDLE } from "@/lib/site-config";

const REEL_URL = "https://www.instagram.com/reel/DcosRMvh6GX/";

interface HeroReelProps {
  label: string;
  watchLabel: string;
  soundOnLabel: string;
  soundOffLabel: string;
}

/**
 * Phone mockup for the hero's art column, playing the reel's source video
 * styled like Instagram (Instagram's own embed can't autoplay). Tapping the
 * screen opens the real reel.
 *
 * The video is only attached once the phone scrolls on screen, so it never
 * slows the first paint (on phones it sits below the CTAs). Autoplay starts muted (browsers
 * block autoplay with sound); visitors can unmute. Reduced-motion visitors
 * get the poster frame and can press play themselves via the sound button.
 */
export default function HeroReel({ label, watchLabel, soundOnLabel, soundOffLabel }: HeroReelProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string>();
  const [muted, setMuted] = useState(true);
  const inView = useRef(false);

  const shouldAutoplay = () =>
    inView.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      const v = videoRef.current;
      if (!v) return;
      inView.current = entry.isIntersecting;
      if (inView.current) {
        // First time: attaching src triggers onCanPlay, which starts playback.
        setSrc("/hero-reel.mp4");
        if (v.readyState >= 3 && shouldAutoplay()) v.play().catch(() => {});
      } else {
        // Pause off-screen so it isn't burning CPU/battery below the fold.
        v.pause();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (v.paused) v.play().catch(() => {});
  };

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto w-[min(300px,80vw)] rounded-[3rem] md:w-[320px] bg-[#0a0a0a] lg:w-[360px] p-3 shadow-2xl shadow-black/70 ring-1 ring-white/10"
    >
      {/* Side buttons */}
      <span aria-hidden="true" className="absolute -left-[3px] top-28 h-8 w-[3px] rounded-l bg-[#1c1c1c]" />
      <span aria-hidden="true" className="absolute -left-[3px] top-40 h-14 w-[3px] rounded-l bg-[#1c1c1c]" />
      <span aria-hidden="true" className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r bg-[#1c1c1c]" />

      <div className="relative aspect-[9/16] overflow-hidden rounded-[2.25rem] bg-black">
        <video
          ref={videoRef}
          src={src}
          poster="/hero-reel-poster.jpg"
          width={540}
          height={960}
          muted
          loop
          playsInline
          preload="none"
          onCanPlay={(e) => {
            if (shouldAutoplay()) e.currentTarget.play().catch(() => {});
          }}
          aria-label={label}
          className="h-full w-full object-cover"
        />

        {/* Dynamic Island */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-2.5 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black"
        />

        {/* Whole screen opens the real reel; sits under the sound button. */}
        <a
          href={REEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={watchLabel}
          className="group absolute inset-0 z-10 flex flex-col justify-between bg-gradient-to-b from-black/50 via-transparent to-black/70 p-4 pt-12 text-white"
        >
          <span className="flex items-center justify-between text-sm font-bold drop-shadow">
            Reels
            <InstagramIcon className="h-5 w-5" />
          </span>

          <span className="flex items-end justify-between gap-3">
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-semibold drop-shadow">
                <Image
                  src="/logo.jpg"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full ring-1 ring-white/70"
                />
                {INSTAGRAM_HANDLE.replace("@", "")}
              </span>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur transition-colors group-hover:bg-white/30">
                {watchLabel} →
              </span>
            </span>

            {/* Reel action rail — decorative, mirrors Instagram's layout. */}
            <span aria-hidden="true" className="flex flex-col items-center gap-4 pb-1">
              <svg viewBox="0 0 24 24" className="h-6 w-6 drop-shadow" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" strokeLinejoin="round" />
              </svg>
              <svg viewBox="0 0 24 24" className="h-6 w-6 drop-shadow" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3.5 20l1.2-4.2A8.5 8.5 0 1 1 20.5 11.5Z" strokeLinejoin="round" />
              </svg>
              <svg viewBox="0 0 24 24" className="h-6 w-6 drop-shadow" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21.5 3 10.5 13.5M21.5 3l-7 18-4-7.5-7.5-4 18.5-6.5Z" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </a>

        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? soundOnLabel : soundOffLabel}
          className="absolute right-3 top-20 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75"
        >
          {muted ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H3v6h3l5 4V5Z" />
              <path d="m22 9-6 6M16 9l6 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5 6 9H3v6h3l5 4V5Z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
