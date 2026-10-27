import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { countRequests } from "@/lib/admin-bookings";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import ThemeToggle from "@/components/ThemeToggle";
import AdminThemePicker from "@/components/admin/AdminThemePicker";
import { THEME_COOKIE, parseTheme, themeVars } from "@/lib/admin-theme";
import SignOutButton from "@/components/admin/SignOutButton";
import SessionRefresher from "@/components/admin/SessionRefresher";

type Role = "master" | "manager" | "editor";
const NAV: { href: string; label: string; badge?: boolean; roles: Role[] }[] = [
  { href: "/admin", label: "Today", roles: ["master", "manager"] },
  { href: "/admin/requests", label: "Requests", badge: true, roles: ["master", "manager"] },
  { href: "/admin/users", label: "Users", roles: ["master"] },
  { href: "/admin/website", label: "Settings", roles: ["master", "manager", "editor"] },
];

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Not configured yet → guide the operator instead of redirect-looping.
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
          Admin not configured
        </h1>
        <p className="mt-2 text-sm text-muted">
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>,{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and{" "}
          <code>ADMIN_EMAILS</code> in your environment, then reload.
        </p>
      </main>
    );
  }

  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const requests = user.role === "editor" ? 0 : await countRequests();

  return (
    <div
      id="admin-root"
      className="min-h-screen bg-base text-ink"
      style={themeVars(theme) as React.CSSProperties}
    >
      <SessionRefresher />
      <header className="sticky top-0 z-40 border-b border-border bg-base/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 px-4 sm:flex-nowrap">
          <Link
            href={user.role === "editor" ? "/admin/website" : "/admin"}
            className="order-1 flex h-14 shrink-0 items-center gap-2"
          >
            <Image
              src="/logo.jpg"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full ring-1 ring-border"
            />
            <span className="font-[family-name:var(--font-display)] text-base font-extrabold uppercase sm:text-lg">
              DallasDetailz
            </span>
          </Link>
          <div className="order-2 flex items-center gap-2 sm:order-3 sm:gap-4">
            <span className="hidden text-xs text-muted md:inline">
              {user.email}
            </span>
            <AdminThemePicker initial={theme} />
            <ThemeToggle className="h-9 w-9 !min-h-0 !min-w-0" />
            <SignOutButton />
          </div>
          <nav className="no-scrollbar order-3 -mx-4 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto border-t border-border/60 px-3 sm:order-2 sm:mx-0 sm:ml-4 sm:w-auto sm:flex-1 sm:border-t-0 sm:px-0">
            {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="relative flex h-11 shrink-0 items-center px-3 text-sm text-muted hover:text-ink sm:h-14"
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
        </div>
      </header>
      <main className="mx-auto min-w-0 max-w-5xl px-4 py-5 sm:py-8">{children}</main>
    </div>
  );
}
