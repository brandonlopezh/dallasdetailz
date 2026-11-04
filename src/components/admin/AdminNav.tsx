"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  badge?: boolean;
}

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** "Detailer Dashboard / Hi {name}" — the very top of the Today screen, above the tabs. */
export function DashGreeting({ firstName }: { firstName: string }) {
  const pathname = usePathname();
  // Same greeting on every dashboard tab so switching tabs never feels like a new page;
  // booking detail / new-booking screens keep their own heading.
  if (pathname.startsWith("/admin/bookings")) return null;
  const Heading = pathname === "/admin" ? "h1" : "p";
  return (
    <div className="mx-auto max-w-5xl px-5 pb-5 pt-6 sm:px-6 sm:pb-8 sm:pt-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted sm:text-sm">
        Detailer Dashboard
      </p>
      <Heading className="mt-3 break-words font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[1.05] sm:mt-4 sm:text-7xl">
        Hi {firstName}
      </Heading>
    </div>
  );
}

/** Dashboard tabs sitting directly above the page body: Today · Requests · Settings. */
export function DashTabs({ items, pending }: { items: NavItem[]; pending: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="border-b border-border">
      <ul className="mx-auto flex max-w-5xl px-4">
        {items.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <li key={n.href} className="flex-1 sm:flex-none">
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`relative -mb-px flex min-h-12 items-center justify-center gap-2 border-b-2 px-5 text-sm font-bold transition-colors ${
                  active
                    ? "border-accent-hi text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {n.label}
                {n.badge && pending > 0 && (
                  <span aria-label={`${pending} new`} className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-extrabold text-white">
                    {pending}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Pending requests, visible on screens that aren't a dashboard tab (e.g. a
 * booking's detail page). Today and Requests already show them.
 */
export function PendingBanner({ count }: { count: number }) {
  const pathname = usePathname();
  if (count === 0 || pathname === "/admin" || pathname === "/admin/requests") return null;
  return (
    <Link
      href="/admin/requests"
      className="flex items-center justify-between gap-3 border-b border-accent-hi bg-surface-alt px-4 py-3 text-sm font-extrabold text-link"
    >
      <span>
        {count} request{count === 1 ? "" : "s"} waiting for your answer
      </span>
      <span aria-hidden="true">Review →</span>
    </Link>
  );
}
