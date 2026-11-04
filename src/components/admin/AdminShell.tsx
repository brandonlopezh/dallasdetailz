import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import SignOutButton from "./SignOutButton";
import SessionRefresher from "./SessionRefresher";
import ProfileMenu from "./ProfileMenu";
import { DashGreeting, DashTabs, PendingBanner, type NavItem } from "./AdminNav";

/** Page chrome for every signed-in admin screen: top bar, section tabs, banner. */
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
  return (
    <div id="admin-root" className="min-h-screen bg-base text-ink">
      <SessionRefresher />
      <header className="sticky top-0 z-40 border-b border-[color:var(--topbar-border)] bg-base/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-2 px-4 py-2">
          <Link
            href={user.role === "editor" ? "/admin/website" : "/admin"}
            className="flex shrink-0 items-center gap-2"
            aria-label="Dallas Detailz dashboard"
          >
            <Image
              src="/logo.jpg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full ring-1 ring-border"
            />
            <span className="hidden font-[family-name:var(--font-display)] text-lg font-extrabold uppercase min-[400px]:inline">
              DallasDetailz
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ProfileMenu user={user} />
            <ThemeToggle className="h-11 w-11 !min-h-0 !min-w-0" />
            <SignOutButton />
          </div>
        </div>
      </header>
      <DashGreeting firstName={user.firstName} />
      <DashTabs items={nav} pending={requests} />
      <PendingBanner count={requests} />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-12">{children}</main>
    </div>
  );
}
