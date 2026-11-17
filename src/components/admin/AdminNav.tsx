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

const TITLES: [prefix: string, title: string][] = [
  ["/admin/bookings/new", "New booking"],
  ["/admin/bookings/", "Booking details"],
  ["/admin/requests", "Requests"],
  ["/admin/customers", "Customers"],
  ["/admin/website", "Settings"],
  ["/admin/users", "Users"],
];

/** The page's one heading: a greeting on Today, the section name everywhere else. */
export function PageTitle({ firstName }: { firstName: string }) {
  const pathname = usePathname();
  const title =
    pathname === "/admin"
      ? `Hi ${firstName}`
      : (TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Dashboard");
  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 sm:pt-8">
      <h1 className="break-words font-[family-name:var(--font-display)] text-2xl font-extrabold leading-tight sm:text-3xl">
        {title}
      </h1>
    </div>
  );
}

function Badge({ count, className = "" }: { count: number; className?: string }) {
  return (
    <span
      aria-label={`${count} new`}
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white ${className}`}
    >
      {count}
    </span>
  );
}

/** Section tabs in the top bar (tablet and desktop). Phones use <BottomTabs>. */
export function DashTabs({
  items,
  pending,
  className = "",
}: {
  items: NavItem[];
  pending: number;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className={className}>
      <ul className="flex">
        {items.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`relative -mb-px flex min-h-14 items-center gap-2 whitespace-nowrap border-b-2 px-4 text-sm font-semibold transition-colors ${
                  active
                    ? "border-accent-hi text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {n.label}
                {n.badge && pending > 0 && <Badge count={pending} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  "/admin": (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  "/admin/requests": (
    <>
      <path d="M4 13.5 6.2 5.6A2 2 0 0 1 8.1 4h7.8a2 2 0 0 1 1.9 1.6L20 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4.5Z" />
      <path d="M4 13.5h4.5l1 2.5h5l1-2.5H20" />
    </>
  ),
  "/admin/customers": (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20c.6-3.4 3.2-5 6.5-5s5.9 1.6 6.5 5M16 5.3a3.5 3.5 0 0 1 0 6.4M18.5 15.4c1.7.7 2.7 2.3 3 4.6" />
    </>
  ),
  "/admin/website": (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
};

/**
 * Phone navigation: the same sections as the top-bar tabs, as an icon bar
 * fixed to the bottom of the screen where a thumb reaches it. Hidden from
 * tablet width up, and when there is only one section to show.
 */
export function BottomTabs({ items, pending }: { items: NavItem[]; pending: number }) {
  const pathname = usePathname();
  if (items.length < 2) return null;
  return (
    <nav
      aria-label="Admin sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--topbar-border)] bg-base/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <li key={n.href} className="flex-1">
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  active ? "text-link" : "text-muted"
                }`}
              >
                {active && (
                  <span aria-hidden="true" className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-accent-hi" />
                )}
                <span className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {ICONS[n.href]}
                  </svg>
                  {n.badge && pending > 0 && (
                    <Badge count={pending} className="absolute -right-3 -top-1.5 !h-4 !min-w-4 !px-1 !text-[10px]" />
                  )}
                </span>
                {n.label}
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
