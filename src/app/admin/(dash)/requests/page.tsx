import { getSettings } from "@/lib/catalog";
import { listBookings } from "@/lib/admin-bookings";
import { BookingRow } from "@/components/admin/JobList";

export const metadata = { title: "Requests" };
export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const settings = await getSettings();
  const tz = settings.timezone;

  // Pending items needing action (PRD AD-4): out-of-range/quote/IG requests.
  const requests = await listBookings({
    statuses: ["requested"],
    order: "created",
  });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Requests
      </h1>
      <p className="text-sm text-muted">
        {requests.length} waiting · open one to confirm a time or cancel
      </p>

      {requests.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-border p-8 text-center text-muted">
          Nothing waiting. 🎉
        </div>
      ) : (
        <div className="mt-6 grid gap-2">
          {requests.map((b) => (
            <BookingRow key={b.id} b={b} tz={tz} />
          ))}
        </div>
      )}
    </div>
  );
}
