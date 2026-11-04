import Link from "next/link";
import { requireBookingsAccess } from "@/lib/admin-guard";
import { getSettings } from "@/lib/catalog";
import { listBookings, listOfferedIds } from "@/lib/admin-bookings";
import RequestCard from "@/components/admin/RequestCard";
import { BookingRow } from "@/components/admin/JobList";
import { dayRangeUtc, dateKeyInTz } from "@/lib/tz";

export const metadata = { title: "Requests" };
export const dynamic = "force-dynamic";

const SECTION_TITLE = "font-[family-name:var(--font-display)] text-xl font-extrabold";

function Summary({
  href,
  label,
  count,
  tone,
}: {
  href: string;
  label: string;
  count: number;
  tone: "warning" | "muted" | "success";
}) {
  const toneClass = {
    warning: count > 0 ? "border-warning/50 bg-warning/10" : "border-border bg-surface",
    muted: "border-border bg-surface",
    success: "border-success/40 bg-success/10",
  }[tone];
  return (
    <a
      href={href}
      className={`min-w-0 rounded-[var(--radius-md)] border p-3 transition-colors hover:border-accent ${toneClass}`}
    >
      <span className="block text-xs font-semibold text-muted">{label}</span>
      <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold">{count}</span>
    </a>
  );
}

export default async function RequestsPage() {
  await requireBookingsAccess();
  const settings = await getSettings();
  const tz = settings.timezone;
  const { start } = dayRangeUtc(dateKeyInTz(new Date(), tz), tz);

  const [pending, offered, approved] = await Promise.all([
    listBookings({ statuses: ["requested"], order: "created" }),
    listOfferedIds(),
    listBookings({ fromISO: start.toISOString(), statuses: ["confirmed", "in_progress"], limit: 50 }),
  ]);
  const onMe = pending.filter((b) => !offered.has(b.id));
  const onClient = pending.filter((b) => offered.has(b.id));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-3">
        <Summary href="#on-me" label="Waiting on me" count={onMe.length} tone="warning" />
        <Summary href="#on-client" label="Waiting on client" count={onClient.length} tone="muted" />
        <Summary href="#approved" label="Approved" count={approved.length} tone="success" />
      </div>

      <section id="on-me" className="scroll-mt-40" aria-labelledby="on-me-h">
        <h2 id="on-me-h" className={SECTION_TITLE}>Waiting on me</h2>
        {onMe.length === 0 ? (
          <p className="mt-3 rounded-[var(--radius-md)] border border-dashed border-border p-6 text-center text-muted">
            Nothing waiting on you. 🎉
          </p>
        ) : (
          <div className="mt-3 grid gap-4">
            {onMe.map((b) => (
              <RequestCard key={b.id} b={b} tz={tz} />
            ))}
          </div>
        )}
      </section>

      <section id="on-client" className="scroll-mt-40" aria-labelledby="on-client-h">
        <h2 id="on-client-h" className={SECTION_TITLE}>Waiting on client</h2>
        <p className="text-sm text-muted">You offered a new time. Accept once they say yes.</p>
        {onClient.length === 0 ? (
          <p className="mt-3 rounded-[var(--radius-md)] border border-dashed border-border p-6 text-center text-muted">
            No one to wait on.
          </p>
        ) : (
          <div className="mt-3 grid gap-4">
            {onClient.map((b) => (
              <RequestCard key={b.id} b={b} tz={tz} waitingOnClient />
            ))}
          </div>
        )}
      </section>

      <section id="approved" className="scroll-mt-40" aria-labelledby="approved-h">
        <div className="flex items-end justify-between gap-3">
          <h2 id="approved-h" className={SECTION_TITLE}>Approved</h2>
          <Link href="/admin" className="text-sm font-semibold text-link">
            View calendar →
          </Link>
        </div>
        <p className="text-sm text-muted">Upcoming jobs you&apos;ve confirmed.</p>
        {approved.length === 0 ? (
          <p className="mt-3 rounded-[var(--radius-md)] border border-dashed border-border p-6 text-center text-muted">
            No approved jobs coming up.
          </p>
        ) : (
          <div className="mt-3 grid gap-2">
            {approved.map((b) => (
              <BookingRow key={b.id} b={b} tz={tz} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
