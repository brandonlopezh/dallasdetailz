import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBookingByApprovalToken } from "@/lib/admin-bookings";

export const metadata = {
  title: "Booking request",
  robots: { index: false, follow: false }, // secret-link page, keep out of search
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const booking = isSupabaseConfigured()
    ? await getBookingByApprovalToken(token)
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
      <p className="text-sm font-semibold text-muted">Dallas Detailz · Booking request</p>

      {!booking ? (
        <Card>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-extrabold">
            Link not found
          </h1>
          <p className="mt-2 text-sm text-muted">
            This request link isn&apos;t valid. It may have already been used
            or the link was copied incorrectly.
          </p>
        </Card>
      ) : (
        <Card>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-extrabold">
            {booking.customers?.name ?? "Customer"} · {booking.services?.name ?? "Service"}
          </h1>
          <div className="mt-4 grid gap-1 text-sm">
            <Row label="When" value={fmt(booking.scheduled_start)} />
            <Row label="Where" value={booking.service_address} />
            <Row label="Phone" value={booking.customers?.phone ?? "—"} />
            <Row label="Total" value={`$${Math.round(booking.total)}`} />
            {booking.customer_notes && (
              <Row label="Notes" value={booking.customer_notes} />
            )}
            <Row label="Ref" value={booking.ref} />
          </div>

          {error === "conflict" && (
            <p className="mt-4 rounded-[var(--radius-sm)] border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
              That time overlaps a job that&apos;s already confirmed. Decline
              this request, or text the customer directly to sort out a new
              time.
            </p>
          )}

          {booking.status === "requested" ? (
            <div className="mt-6 flex gap-3">
              <form action={`/api/confirm/${token}`} method="POST" className="flex-1">
                <input type="hidden" name="action" value="decline" />
                <button
                  type="submit"
                  className="tap w-full rounded-[var(--radius-md)] border border-border px-5 font-semibold text-muted hover:text-ink"
                >
                  Decline
                </button>
              </form>
              <form action={`/api/confirm/${token}`} method="POST" className="flex-1">
                <input type="hidden" name="action" value="approve" />
                <button
                  type="submit"
                  className="tap w-full rounded-[var(--radius-md)] bg-accent px-5 font-bold text-white hover:bg-accent-hi"
                >
                  Approve
                </button>
              </form>
            </div>
          ) : (
            <p className="mt-6 rounded-[var(--radius-sm)] border border-border bg-surface p-3 text-sm">
              {booking.status === "confirmed" &&
                "Approved. The customer has been texted."}
              {booking.status === "cancelled" &&
                "Declined. The customer has been texted."}
              {!["confirmed", "cancelled"].includes(booking.status) &&
                `Status: ${booking.status}`}
            </p>
          )}
        </Card>
      )}
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-[var(--radius-md)] border border-border bg-surface p-5">
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  );
}
