"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon: "today" | "requests" | "users" | "settings";
  badge?: boolean;
}

const ICONS: Record<NavItem["icon"], string> = {
  today: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  requests: "M4 13l2.5-7h11L20 13M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5M4 13h4.5l1 2h5l1-2H20",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5M17 4.5a3.2 3.2 0 0 1 0 6M18 14.8c2 .6 3.2 2.3 3.5 5.2",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 13.5l1.6 1.2-1.8 3.1-1.9-.6a7 7 0 0 1-1.6.9L15.3 20H8.7l-.4-1.9a7 7 0 0 1-1.6-.9l-1.9.6L3 14.7l1.6-1.2a7 7 0 0 1 0-1l-1.6-1.2 1.8-3.1 1.9.6a7 7 0 0 1 1.6-.9L8.7 6h6.6l.4 1.9a7 7 0 0 1 1.6.9l1.9-.6L21 10.3l-1.6 1.2a7 7 0 0 1 0 2Z",
};

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** Thumb-reach tab bar — the main way to move around the admin on a phone. */
export function BottomNav({ items, pending }: { items: NavItem[]; pending: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-base/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {items.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <li key={n.href} className="flex-1">
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold ${
                  active ? "text-link" : "text-muted"
                }`}
                style={{ minHeight: 60 }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={ICONS[n.icon]} />
                </svg>
                {n.label}
                {n.badge && pending > 0 && (
                  <span className="absolute right-[22%] top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-[11px] font-extrabold text-black">
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
 * Pending requests, visible on every screen. Hidden on Today and Requests,
 * which already show the requests themselves.
 */
export function PendingBanner({ count }: { count: number }) {
  const pathname = usePathname();
  if (count === 0 || pathname === "/admin" || pathname === "/admin/requests") return null;
  return (
    <Link
      href="/admin/requests"
      className="flex items-center justify-between gap-3 border-b border-warning/50 bg-warning px-4 py-3 text-sm font-extrabold text-black"
    >
      <span>
        {count} request{count === 1 ? "" : "s"} waiting for your answer
      </span>
      <span aria-hidden="true">Review →</span>
    </Link>
  );
}
