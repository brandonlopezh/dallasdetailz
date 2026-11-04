import type { AdminCustomer } from "@/lib/admin-bookings";
import { formatInTz } from "@/lib/tz";
import DeleteCustomer from "./DeleteCustomer";

const BTN =
  "tap inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface-alt px-3 text-sm font-semibold text-ink transition-colors hover:border-accent";

function Emoji({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center text-base leading-none">
      {children}
    </span>
  );
}

/** One customer as a list row: name + summary on the left, actions on the right. */
export default function CustomerRow({ c, tz }: { c: AdminCustomer; tz: string }) {
  const handle = c.instagram_handle?.replace(/^@/, "");
  return (
    <div className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 items-start justify-between gap-3 sm:block">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{c.name}</p>
          <p className="text-xs text-muted">
            Customer since {formatInTz(c.created_at, tz, { month: "short", year: "numeric" })}
            {" · "}
            {c.last_detail
              ? `Last detail ${formatInTz(c.last_detail, tz, { month: "short", day: "numeric", year: "numeric" })}`
              : "No details yet"}
          </p>
        </div>
        <div className="sm:hidden">
          <DeleteCustomer id={c.id} name={c.name} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a href={`tel:${c.phone}`} className={BTN}>
          <Emoji>📞</Emoji> Call
        </a>
        <a href={`sms:${c.phone}`} className={BTN}>
          <Emoji>💬</Emoji> Text
        </a>
        {c.email && (
          <a href={`mailto:${c.email}`} className={BTN}>
            <Emoji>✉️</Emoji> Email
          </a>
        )}
        {handle && (
          <a
            href={`https://instagram.com/${encodeURIComponent(handle)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={BTN}
          >
            <Emoji>📷</Emoji> Instagram
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        <div className="hidden sm:block">
          <DeleteCustomer id={c.id} name={c.name} />
        </div>
      </div>
    </div>
  );
}
