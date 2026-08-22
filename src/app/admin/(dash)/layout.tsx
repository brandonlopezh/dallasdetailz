import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { countRequests } from "@/lib/admin-bookings";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import SignOutButton from "@/components/admin/SignOutButton";
import SessionRefresher from "@/components/admin/SessionRefresher";

const NAV = [
  { href: "/admin", label: "Today" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/requests", label: "Requests", badge: true },
  { href: "/admin/media", label: "Images" },
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

  const requests = await countRequests();

  return (
    <div className="min-h-screen">
      <SessionRefresher />
      <header className="sticky top-0 z-40 border-b border-border bg-base/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4">
          <nav className="flex items-center gap-4 overflow-x-auto">
            <span className="font-[family-name:var(--font-display)] font-extrabold uppercase">
              Admin
            </span>
            {NAV.map((n) => (
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
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
