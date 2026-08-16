import Link from "next/link";
import ManualBookingForm from "@/components/admin/ManualBookingForm";

export const metadata = { title: "New booking" };

export default function NewBookingPage() {
  return (
    <div className="max-w-lg">
      <Link href="/admin" className="text-sm text-muted hover:text-ink">
        ← Today
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-extrabold">
        New booking
      </h1>
      <p className="mb-5 text-sm text-muted">
        For phone, walk-up, or Instagram customers.
      </p>
      <ManualBookingForm />
    </div>
  );
}
