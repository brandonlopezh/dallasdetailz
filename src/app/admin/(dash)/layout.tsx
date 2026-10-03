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
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <nav className="flex items-center gap-4 overflow-x-auto">
            <Link
              href={user.role === "editor" ? "/admin/website" : "/admin"}
              className="flex shrink-0 items-center gap-2"
            >
              <Image
                src="/logo.jpg"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-full ring-1 ring-border"
              />
              <span className="font-[family-name:var(--font-display)] text-lg font-extrabold uppercase">
                DallasDetailz
              </span>
            </Link>
            {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="relative shrink-0 text-sm text-muted hover:text-ink"
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
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-muted sm:inline">
              {user.email}
            </span>
            <AdminThemePicker initial={theme} />
            <ThemeToggle className="h-9 w-9 !min-h-0 !min-w-0" />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
