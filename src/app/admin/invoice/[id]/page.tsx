import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBookingsAccess } from "@/lib/admin-guard";
import { getSettings } from "@/lib/catalog";
import { getBooking, vehicleLabel } from "@/lib/admin-bookings";
import { PHONE_DISPLAY, INSTAGRAM_HANDLE } from "@/lib/site-config";
import { formatInTz } from "@/lib/tz";
import PrintButton from "@/components/admin/PrintButton";

export const metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

const usd = (n: number) => `$${Number(n).toFixed(2)}`;

/**
 * Printable invoice for one booking. Print → "Save as PDF" in the browser
 * produces the PDF. Colors are fixed (not theme tokens) so it prints the same
 * from light or dark admin themes.
 */
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireBookingsAccess();
  const { id } = await params;
  const [b, settings] = await Promise.all([getBooking(id), getSettings()]);
  if (!b) notFound();
  const tz = settings.timezone;

  const paid = b.payment_status === "paid";
  const vehicle = vehicleLabel(b.vehicles);
  const serviceDate = formatInTz(b.scheduled_start, tz, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const serviceTime = formatInTz(b.scheduled_start, tz, { hour: "numeric", minute: "2-digit" });
  const issued = formatInTz(new Date(), tz, { month: "long", day: "numeric", year: "numeric" });

  const lines: { label: string; amount: number }[] = [
    { label: b.services?.name ?? "Detailing service", amount: Number(b.subtotal) },
  ];
  if (Number(b.addon_total) > 0) lines.push({ label: "Add-ons", amount: Number(b.addon_total) });
  if (Number(b.travel_fee) > 0) lines.push({ label: "Travel fee", amount: Number(b.travel_fee) });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 print:max-w-none print:p-0">
      <style>{`@media print { body { background: #fff !important; } @page { margin: 14mm; } }`}</style>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/bookings/${b.id}`} className="text-sm text-muted hover:text-ink">
          ← Back to booking
        </Link>
        <PrintButton />
      </div>

      <article className="rounded-lg bg-white p-8 text-black shadow-sm print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-300 pb-6">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl">Dallas Detailz</h1>
            <p className="mt-1 text-sm text-neutral-600">Mobile detailing · We come to you</p>
            <p className="text-sm text-neutral-600">
              {PHONE_DISPLAY} · {INSTAGRAM_HANDLE}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-2xl font-bold tracking-wide">INVOICE</p>
            <p className="mt-1 text-neutral-600">
              No. <span className="font-mono text-black">{b.ref}</span>
            </p>
            <p className="text-neutral-600">Issued {issued}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-neutral-300 py-6 text-sm sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Billed to</h2>
            <p className="mt-1 font-semibold">{b.customers?.name ?? "Customer"}</p>
            {b.customers?.phone && <p>{b.customers.phone}</p>}
            {b.customers?.email && <p>{b.customers.email}</p>}
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Service</h2>
            <p className="mt-1 font-semibold">{serviceDate}</p>
            <p>{serviceTime}</p>
            <p>{b.service_address}</p>
            {vehicle && <p>Vehicle: {vehicle}</p>}
          </div>
        </section>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="pb-2 font-bold">Description</th>
              <th className="pb-2 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.label} className="border-b border-neutral-200">
                <td className="py-3">{l.label}</td>
                <td className="py-3 text-right">{usd(l.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-4 text-right font-bold">Total</td>
              <td className="pt-4 text-right text-lg font-bold">{usd(b.total)}</td>
            </tr>
            <tr>
              <td className="pt-1 text-right font-semibold">{paid ? "Paid" : "Amount due"}</td>
              <td className="pt-1 text-right font-semibold">{usd(b.total)}</td>
            </tr>
          </tfoot>
        </table>

        <p
          className={`mt-6 inline-block rounded border px-3 py-1 text-sm font-bold ${
            paid ? "border-green-700 text-green-800" : "border-neutral-400 text-neutral-700"
          }`}
        >
          {paid ? "PAID IN FULL" : "PAYMENT DUE AT SERVICE"}
        </p>

        <footer className="mt-8 border-t border-neutral-300 pt-4 text-xs text-neutral-600">
          <p>We accept Zelle and cash only.</p>
          <p className="mt-1">Thank you for choosing Dallas Detailz!</p>
        </footer>
      </article>
    </div>
  );
}
