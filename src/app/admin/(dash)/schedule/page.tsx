import { getSettings } from "@/lib/catalog";
import { listBookings } from "@/lib/admin-bookings";
import { BookingRow } from "@/components/admin/JobList";
import { dateKeyInTz, formatInTz } from "@/lib/tz";

export const metadata = { title: "Schedule" };
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const settings = await getSettings();
  const tz = settings.timezone;
  const now = new Date();
  const horizon = new Date(
    now.getTime() + settings.booking_horizon_days * 86_400_000,
  );

  const bookings = await listBookings({
    fromISO: now.toISOString(),
    toISO: horizon.toISOString(),
    statuses: ["confirmed", "in_progress"],
  });

  // Group by calendar day in the business tz.
  const groups = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const key = dateKeyInTz(new Date(b.scheduled_start), tz);
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(b);
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Schedule
      </h1>
      <p className="text-sm text-muted">
        Next {settings.booking_horizon_days} days · {bookings.length} booked
      </p>

      {groups.size === 0 ? (
        <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-border p-8 text-center text-muted">
          Nothing booked in the window.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {[...groups.entries()].map(([day, items]) => (
            <div key={day}>
              <h2 className="mb-2 text-sm font-semibold text-muted">
                {formatInTz(new Date(day + "T12:00:00Z"), tz, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h2>
              <div className="grid gap-2">
                {items.map((b) => (
                  <BookingRow key={b.id} b={b} tz={tz} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
