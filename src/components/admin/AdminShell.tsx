import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import ThemeScope from "@/components/ThemeScope";
import { adminFont } from "@/lib/admin-font";
import SessionRefresher from "./SessionRefresher";
import ProfileMenu from "./ProfileMenu";
import { BottomTabs, DashTabs, PageTitle, PendingBanner, type NavItem } from "./AdminNav";

/**
 * Page chrome for every signed-in admin screen. A sticky top bar holds the
 * logo, the section tabs and the account buttons; on phones the tabs move to
 * a bar along the bottom of the screen, within thumb reach. Then a compact
 * page title, then the page.
 */
export default function AdminShell({
  user,
  requests,
  nav,
  children,
}: {
  user: { name: string; firstName: string; email: string; role: string };
  requests: number;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const canBook = user.role !== "editor";
  return (
    <div id="admin-root" className={`${adminFont.variable} min-h-screen bg-base text-ink`}>
      <SessionRefresher />
      <ThemeScope scope="admin" />
      <header className="sticky top-0 z-40 border-b border-[color:var(--topbar-border)] bg-base/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-x-6 px-4">
          <Link
            href={canBook ? "/admin" : "/admin/website"}
            className="flex shrink-0 items-center gap-2.5 py-2"
            aria-label="Dallas Detailz dashboard"
          >
            <Image
              src="/logo.jpg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full ring-1 ring-border"
            />
            {/* The one place the admin keeps the brand font (see --font-brand in globals.css). */}
            <span className="hidden font-[family-name:var(--font-brand)] text-lg font-normal uppercase min-[400px]:inline">
              DallasDetailz
            </span>
          </Link>
          <DashTabs items={nav} pending={requests} className="hidden md:block" />
          <div className="ml-auto flex items-center gap-2 py-2">
            {canBook && (
              <Link
                href="/admin/bookings/new"
                className="inline-flex h-10 items-center gap-1 rounded-full bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-accent-hi"
              >
                <span aria-hidden="true">+</span>
                <span>New<span className="hidden sm:inline"> booking</span></span>
              </Link>
            )}
            <ThemeToggle className="h-10 w-10 !min-h-0 !min-w-0" />
            <ProfileMenu user={user} />
          </div>
        </div>
      </header>
      <PendingBanner count={requests} />
      <PageTitle firstName={user.firstName} />
      {/* Extra room at the bottom on phones so the tab bar never covers content. */}
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:pt-6 md:pb-16">{children}</main>
      <BottomTabs items={nav} pending={requests} />
    </div>
  );
}
