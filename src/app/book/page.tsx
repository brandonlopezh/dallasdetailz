import Link from "next/link";
import { Suspense } from "react";
import BookingFlow from "@/components/BookingFlow";

export const metadata = {
  title: "Book a Detail",
  description: "Book mobile detailing across DFW in under 90 seconds.",
};

export default function BookPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        ← Dallas Detailz
      </Link>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <BookingFlow />
      </Suspense>
    </main>
  );
}
