import Link from "next/link";
import { requireBookingsAccess } from "@/lib/admin-guard";
import ManualBookingForm from "@/components/admin/ManualBookingForm";
import { getServices, getSettings } from "@/lib/catalog";

export const metadata = { title: "New booking" };

export default async function NewBookingPage() {
  await requireBookingsAccess();
  const [services, settings] = await Promise.all([getServices(), getSettings()]);
  return (
    <div className="mx-auto min-w-0 max-w-2xl">
      <Link href="/admin" className="text-sm text-muted hover:text-ink">
        ← Today
      </Link>
      <p className="mb-5 mt-1 text-sm text-muted">
        For phone, walk-up, or Instagram customers.
      </p>
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-8">
        <ManualBookingForm services={services} tz={settings.timezone} />
      </div>
    </div>
  );
}
