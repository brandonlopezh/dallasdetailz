"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

interface Media {
  id: string;
  slot: "hero" | "gallery" | "before_after";
  role: "before" | "after" | null;
  group_index: number;
  storage_path: string;
  alt: string | null;
  sort_order: number;
  active: boolean;
  url: string;
}

const SLOT_LABEL: Record<Media["slot"], string> = {
  hero: "Hero (top of homepage)",
  gallery: "Gallery grid",
  before_after: "Before / After pairs",
};

export default function MediaManager() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload form state
  const [slot, setSlot] = useState<Media["slot"]>("gallery");
  const [role, setRole] = useState<"before" | "after">("before");
  const [group, setGroup] = useState(0);
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMedia(data.media);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("slot", slot);
      fd.set("alt", alt);
      if (slot === "before_after") {
        fd.set("role", role);
        fd.set("group_index", String(group));
      }
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMedia((m) => [...m, data.media]);
      setFile(null);
      setAlt("");
      (document.getElementById("file-input") as HTMLInputElement).value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const patch = async (id: string, body: Partial<Media>) => {
    const res = await fetch(`/api/admin/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) setMedia((m) => m.map((x) => (x.id === id ? data.media : x)));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    if (res.ok) setMedia((m) => m.filter((x) => x.id !== id));
  };

  const bySlot = (s: Media["slot"]) =>
    media.filter((m) => m.slot === s).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      {/* Upload form */}
      <form
        onSubmit={upload}
        className="rounded-[var(--radius-md)] border border-border bg-surface p-4"
      >
        <h2 className="font-bold">Upload an image</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-muted">Where it shows</span>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value as Media["slot"])}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-base px-3 py-2"
            >
              <option value="hero">Hero (top of homepage)</option>
              <option value="gallery">Gallery grid</option>
              <option value="before_after">Before / After pair</option>
            </select>
          </label>

          {slot === "before_after" && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label>
                <span className="text-muted">Role</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "before" | "after")}
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-base px-3 py-2"
                >
                  <option value="before">Before</option>
                  <option value="after">After</option>
                </select>
              </label>
              <label>
                <span className="text-muted">Pair #</span>
                <input
                  type="number"
                  min={0}
                  value={group}
                  onChange={(e) => setGroup(Number(e.target.value))}
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-base px-3 py-2"
                />
              </label>
            </div>
          )}

          <label className="text-sm sm:col-span-2">
            <span className="text-muted">Alt text (accessibility / SEO)</span>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="e.g. Foamy exterior wash on a black Tahoe"
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-base px-3 py-2"
            />
          </label>

          <input
            id="file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm sm:col-span-2"
          />
        </div>

        <button
          type="submit"
          disabled={!file || uploading}
          className="tap mt-3 rounded-[var(--radius-md)] bg-accent px-5 font-bold text-white disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </form>

      {/* Existing media grouped by slot */}
      {loading ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : (
        (["hero", "gallery", "before_after"] as const).map((s) => (
          <section key={s} className="mt-8">
            <h3 className="mb-3 font-[family-name:var(--font-display)] text-lg font-bold uppercase">
              {SLOT_LABEL[s]}
            </h3>
            {bySlot(s).length === 0 ? (
              <p className="text-sm text-muted">
                None yet — the site uses a placeholder here until you upload one.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {bySlot(s).map((m) => (
                  <div
                    key={m.id}
                    className={`overflow-hidden rounded-[var(--radius-md)] border ${
                      m.active ? "border-border" : "border-dashed border-border opacity-50"
                    }`}
                  >
                    <img
                      src={m.url}
                      alt={m.alt ?? ""}
                      className="aspect-square w-full object-cover"
                    />
                    <div className="p-2 text-xs">
                      {m.slot === "before_after" && (
                        <p className="text-muted">
                          Pair {m.group_index} · {m.role}
                        </p>
                      )}
                      <div className="mt-1 flex items-center justify-between">
                        <button
                          onClick={() => patch(m.id, { active: !m.active })}
                          className="text-accent-hi hover:underline"
                        >
                          {m.active ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={() => remove(m.id)}
                          className="text-danger hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
