import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import SignOutButton from "@/components/admin/SignOutButton";

const NAV = [
  { href: "/admin", label: "Dashboard" },
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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-base/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <nav className="flex items-center gap-5">
            <span className="font-[family-name:var(--font-display)] font-extrabold uppercase">
              Admin
            </span>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-sm text-muted hover:text-ink"
              >
                {n.label}
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
