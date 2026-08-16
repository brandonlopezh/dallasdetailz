import Link from "next/link";
import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <Link href="/" className="mb-6 text-sm text-muted hover:text-ink">
        ← Dallas Detailz
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Operator sign in
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Enter your email and we&apos;ll send a magic link. Only allowlisted
        operators can access the admin.
      </p>
      <LoginForm />
    </main>
  );
}
