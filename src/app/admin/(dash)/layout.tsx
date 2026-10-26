import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { countRequests } from "@/lib/admin-bookings";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { THEME_COOKIE, parseTheme } from "@/lib/admin-theme";
import AdminShell from "@/components/admin/AdminShell";
import type { NavItem } from "@/components/admin/AdminNav";

type Role = "master" | "manager" | "editor";
const NAV: (NavItem & { roles: Role[] })[] = [
  { href: "/admin", label: "Today", icon: "today", roles: ["master", "manager"] },
  { href: "/admin/requests", label: "Requests", icon: "requests", badge: true, roles: ["master", "manager"] },
  { href: "/admin/users", label: "Users", icon: "users", roles: ["master"] },
  { href: "/admin/website", label: "Settings", icon: "settings", roles: ["master", "manager", "editor"] },
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
  const nav = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <AdminShell user={user} theme={theme} requests={requests} nav={nav}>
      {children}
    </AdminShell>
  );
}
