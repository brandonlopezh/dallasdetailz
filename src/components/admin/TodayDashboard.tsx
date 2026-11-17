import Link from "next/link";
import type { AdminBooking, AdminCustomer } from "@/lib/admin-bookings";
import { vehicleLabel } from "@/lib/admin-bookings";
import { formatInTz, DAY_OPTS, TIME_OPTS } from "@/lib/tz";
import Carousel from "./Carousel";
import CustomerCard from "./CustomerCard";
import { PaymentBadge, ScheduledCard, money } from "./JobList";
import { calendarHref } from "./MonthCalendar";
import NewCustomer from "./NewCustomer";
import TwoWeekStrip from "./TwoWeekStrip";

const TILE = "min-w-0 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:p-5";
const TILE_TITLE = "font-[family-name:var(--font-display)] text-xl font-extrabold";

/** One number at the top of the dashboard. A link when there is somewhere to go. */
function Stat({
  label,
  value,
  href,
  alert,
}: {
  label: string;
  value: string;
  href?: string;
  /** Draws the eye (orange) when something is waiting on the operator. */
  alert?: boolean;
}) {
  const cls = `block min-w-0 rounded-[var(--radius-lg)] border p-4 ${
    alert ? "border-warning/50 bg-warning/10" : "border-border bg-surface"
  } ${href ? "transition-colors hover:border-accent" : ""}`;
  const inner = (
    <>
      <span className="block truncate text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className="mt-1 block font-[family-name:var(--font-display)] text-3xl font-extrabold leading-none sm:text-4xl">
        {value}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Everything on the Today screen except the calendar popups. Pure display: the page loads the data. */
export default function TodayDashboard({
  now,
  tz,
  todayKey,
  jobs,
  stripJobs,
  upcoming,
  customers,
  customerCount,
  requests,
}: {
  now: Date;
  tz: string;
  todayKey: string;
  jobs: AdminBooking[];
  stripJobs: AdminBooking[];
  upcoming: AdminBooking[];
  customers: AdminCustomer[];
  customerCount: number;
  requests: number;
}) {
  const revenue = jobs.reduce((s, j) => s + Number(j.total), 0);
  const twoWeekJobs = stripJobs.filter((b) => b.status !== "completed").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* At a glance */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Jobs today" value={String(jobs.length)} />
        <Stat label="Booked today" value={money(revenue)} />
        <Stat
          label="Requests waiting"
          value={String(requests)}
          href="/admin/requests"
          alert={requests > 0}
        />
        <Stat label="Next two weeks" value={`${twoWeekJobs} job${twoWeekJobs === 1 ? "" : "s"}`} />
      </div>

      {/* Today · Scheduled */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <section className={TILE} aria-labelledby="today-h">
          <h2 id="today-h" className={TILE_TITLE}>Today</h2>
          <p className="text-sm text-muted">{formatInTz(now, tz, DAY_OPTS)}</p>

          {jobs.length === 0 ? (
            <p className="mt-4 rounded-[var(--radius-md)] border border-dashed border-border p-6 text-center text-muted">
              No jobs scheduled today.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {jobs.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[var(--radius-md)] border border-border bg-base/40 p-3 transition-colors hover:border-accent"
                  >
                    <span className="w-16 text-sm font-extrabold">
                      {formatInTz(b.scheduled_start, tz, TIME_OPTS)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {b.customers?.name ?? "Customer"}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {b.services?.name ?? "Service"} · {vehicleLabel(b.vehicles) ?? b.service_address}
                      </span>
                    </span>
                    <PaymentBadge status={b.payment_status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={TILE} aria-labelledby="sched-h">
          <h2 id="sched-h" className={`${TILE_TITLE} mb-3`}>Coming up</h2>
          {upcoming.length === 0 ? (
            <p className="rounded-[var(--radius-md)] border border-dashed border-border p-6 text-center text-muted">
              Nothing scheduled yet.
            </p>
          ) : (
            <Carousel label="Upcoming appointments">
              {upcoming.map((b) => (
                <ScheduledCard key={b.id} b={b} tz={tz} />
              ))}
            </Carousel>
          )}
        </section>
      </div>

      <section className={TILE} aria-labelledby="cal-h">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
          <h2 id="cal-h" className={TILE_TITLE}>Next two weeks</h2>
          <Link
            href={calendarHref(todayKey.slice(0, 7))}
            className="inline-flex min-h-10 items-center rounded-[var(--radius-sm)] border border-border px-3 text-sm font-semibold text-link transition-colors hover:border-accent"
          >
            Full calendar →
          </Link>
        </div>
        <div className="mt-4">
          <TwoWeekStrip todayKey={todayKey} bookings={stripJobs} tz={tz} />
        </div>
      </section>

      {/* Customers */}
      <section className={TILE} aria-labelledby="cust-h">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
          <div>
            <h2 id="cust-h" className={TILE_TITLE}>Customers</h2>
            <p className="text-sm text-muted">{customerCount} total</p>
          </div>
          <NewCustomer />
        </div>
        {customers.length === 0 ? (
          <p className="mt-4 text-muted">No customers yet.</p>
        ) : (
          <>
            <ul className="mt-4 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {customers.map((c) => (
                <li key={c.id}>
                  <CustomerCard c={c} tz={tz} />
                </li>
              ))}
            </ul>
            {customerCount > customers.length && (
              <Link
                href="/admin/customers"
                className="mt-3 flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border border-border text-sm font-semibold text-link transition-colors hover:border-accent"
              >
                See all {customerCount} customers
              </Link>
            )}
          </>
        )}
      </section>
    </div>
  );
}
