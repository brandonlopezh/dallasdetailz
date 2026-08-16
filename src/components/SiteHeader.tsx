"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { href: "#services", label: "Services" },
  { href: "#gallery", label: "Gallery" },
  { href: "#area", label: "Area" },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled
          ? "border-border bg-base/85 backdrop-blur"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent font-[family-name:var(--font-display)] text-sm font-extrabold text-white">
            DD
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-extrabold uppercase tracking-tight">
            Dallas Detailz
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <Link
          href="/book"
          className="tap inline-flex items-center rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-hi"
        >
          Book Now
        </Link>
      </div>
    </header>
  );
}
