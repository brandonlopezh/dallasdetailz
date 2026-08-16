import Link from "next/link";

export const metadata = { title: "Admin" };

export default function AdminHome() {
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-muted">
        Manage the site and (soon) your schedule.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/media"
          className="rounded-[var(--radius-md)] border border-border bg-surface p-5 transition-colors hover:border-accent"
        >
          <h2 className="font-bold">Images</h2>
          <p className="mt-1 text-sm text-muted">
            Upload and manage the hero, gallery, and before/after photos shown
            on the homepage.
          </p>
        </Link>

        <div className="rounded-[var(--radius-md)] border border-dashed border-border p-5 opacity-60">
          <h2 className="font-bold">Bookings & schedule</h2>
          <p className="mt-1 text-sm text-muted">Coming next.</p>
        </div>
      </div>
    </div>
  );
}
