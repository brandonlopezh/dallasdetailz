import Link from "next/link";
import BookingFlow from "@/components/BookingFlow";
import ThemeScope from "@/components/ThemeScope";
import { getServicesCached } from "@/lib/catalog";

export const metadata = {
  title: "Book a Detail",
  description: "Book mobile detailing across DFW in under 90 seconds.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const [{ service }, services] = await Promise.all([searchParams, getServicesCached()]);
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-6">
      <ThemeScope scope="public" />
      <Link
        href="/"
        className="link-sweep mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        ← Dallas Detailz
      </Link>
      <BookingFlow initialServiceId={service} initialServices={services} />
    </main>
  );
}
