import MediaManager from "@/components/admin/MediaManager";

export const metadata = { title: "Images" };

export default function AdminMediaPage() {
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold">
        Images
      </h1>
      <p className="mt-1 text-sm text-muted">
        These show on the homepage. Uploads appear right away; hidden images
        stay stored but off the site.
      </p>
      <div className="mt-6">
        <MediaManager />
      </div>
    </div>
  );
}
