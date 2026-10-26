import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import AdminThemePicker from "./AdminThemePicker";
import SignOutButton from "./SignOutButton";
import SessionRefresher from "./SessionRefresher";
import { BottomNav, PendingBanner, type NavItem } from "./AdminNav";
import { themeVars, type ThemeChoice } from "@/lib/admin-theme";

/** Page chrome for every signed-in admin screen: top bar, banner, bottom tabs. */
export default function AdminShell({
  user,
  theme,
  requests,
  nav,
  children,
}: {
  user: { email: string; role: string };
  theme: ThemeChoice | null;
  requests: number;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div
      id="admin-root"
      className="min-h-screen bg-base text-ink"
      style={themeVars(theme) as React.CSSProperties}
    >
      <SessionRefresher />
      <header className="sticky top-0 z-40 border-b border-border bg-base/85 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-2 px-4 py-1">
          <nav className="flex items-center gap-4 md:overflow-x-auto">
            <Link
              href={user.role === "editor" ? "/admin/website" : "/admin"}
              className="flex shrink-0 items-center gap-2"
            >
              <Image
                src="/logo.jpg"
                alt="Dallas Detailz home"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full ring-1 ring-border"
              />
              <span className="hidden font-[family-name:var(--font-display)] text-lg font-extrabold uppercase min-[400px]:inline">
                DallasDetailz
              </span>
            </Link>
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="relative hidden shrink-0 text-sm text-muted hover:text-ink md:block"
              >
                {n.label}
                {n.badge && requests > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-black">
                    {requests}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-xs text-muted sm:inline">
              {user.email}
            </span>
            <AdminThemePicker initial={theme} />
            <ThemeToggle className="h-11 w-11 !min-h-0 !min-w-0" />
            <SignOutButton />
          </div>
        </div>
      </header>
      <PendingBanner count={requests} />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-28 md:pb-6">{children}</main>
      <BottomNav items={nav} pending={requests} />
    </div>
  );
}
