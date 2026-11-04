import { requireBookingsAccess } from "@/lib/admin-guard";
import { getSettings } from "@/lib/catalog";
import { listCustomers } from "@/lib/admin-bookings";
import CustomerList from "@/components/admin/CustomerList";
import NewCustomer from "@/components/admin/NewCustomer";

export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  await requireBookingsAccess();
  const [settings, customers] = await Promise.all([getSettings(), listCustomers()]);
  const tz = settings.timezone;

  return (
    <div className="space-y-5 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold">Customers</h2>
          <p className="text-sm text-muted">{customers.length} total</p>
        </div>
        <NewCustomer />
      </div>

      <CustomerList customers={customers} tz={tz} />
    </div>
  );
}
