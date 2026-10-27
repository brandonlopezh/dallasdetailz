"use client";

import Image from "next/image";
import Link from "next/link";
import BookNowLink from "./BookNowLink";
import { useLanguage } from "./LanguageProvider";

export default function SiteHeader() {
  const { t, toggleLang } = useLanguage();
  const NAV = [
    { href: "#services", label: t.nav.services },
    // TEMPORARILY HIDDEN: { href: "#gallery", label: "Gallery" },
    { href: "#area", label: t.nav.area },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-base/95 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.jpg"
            alt="Dallas Detailz logo"
            width={40}
            height={40}
            loading="eager"
            className="h-10 w-10 rounded-full ring-1 ring-border"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="link-sweep text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLang}
            className="tap whitespace-nowrap rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs font-semibold text-ink backdrop-blur transition-colors hover:border-accent sm:text-sm"
          >
            {t.languageToggle.label}
          </button>
          <BookNowLink className="tap hidden items-center rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-hi md:inline-flex">
            {t.common.bookNow}
          </BookNowLink>
        </div>
      </div>
    </header>
  );
}
