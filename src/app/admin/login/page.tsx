import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Admin sign in" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <Link href="/" className="mb-6 text-sm text-muted hover:text-ink">
        ← Dallas Detailz
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Operator sign in
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Sign in once and this device stays signed in. Only allowlisted
        operators can access the admin.
      </p>
      {error && (
        <p className="mb-4 text-sm text-danger-text">Sign-in failed: {error}</p>
      )}
      <LoginForm />
    </main>
  );
}
