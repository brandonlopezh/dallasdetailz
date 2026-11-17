import Image from "next/image";
import Link from "next/link";
import { adminFont } from "@/lib/admin-font";
import ThemeScope from "@/components/ThemeScope";
import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Admin sign in" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div id="admin-root" className={`${adminFont.variable} min-h-screen bg-base text-ink`}>
      <ThemeScope scope="admin" />
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 sm:p-8">
          <Image
            src="/logo.jpg"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 rounded-full ring-1 ring-border"
          />
          <h1 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-extrabold">
            Sign in
          </h1>
          <p className="mb-6 mt-1 text-sm text-muted">
            Dallas Detailz dashboard. Sign in once and this device stays signed in.
          </p>
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 p-3 text-sm text-danger-text"
            >
              {error}
            </p>
          )}
          <LoginForm />
        </div>
        <Link href="/" className="mt-6 text-center text-sm text-muted hover:text-ink">
          ← Back to the website
        </Link>
      </main>
    </div>
  );
}
