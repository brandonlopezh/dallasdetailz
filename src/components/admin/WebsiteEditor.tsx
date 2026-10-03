"use client";

import { useState } from "react";
import {
  CONTACT_PHONE_KEY,
  DEFAULT_PARTS,
  HERO_REEL_KEY,
  INSTAGRAM_POSTS_KEY,
  INSTAGRAM_URL_RE,
  LANGS,
  SECTIONS_KEY,
  SECTION_DEFS,
  TEXT_GROUPS,
  normalizeInstagramUrl,
  sectionsToStored,
  serviceKey,
  type FieldDef,
  type Parts,
} from "@/lib/content-schema";
import MediaManager from "@/components/admin/MediaManager";
import type { Lang } from "@/lib/translations";

interface ServiceRow {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface Props {
  live: Record<string, unknown>;
  defaults: Record<string, unknown>;
  parts: Parts;
  services: ServiceRow[];
  initialView?: string;
}

type Faq = { q: string; a: string }[];

const input =
  "mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-base px-3 py-2 text-sm";
const card = "rounded-[var(--radius-md)] border border-border bg-surface p-4";
const iconBtn =
  "grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-border text-sm hover:border-accent disabled:opacity-30";
const LANG_LABEL: Record<Lang, string> = { en: "English", es: "Español" };
const SECTION_LABEL = Object.fromEntries(SECTION_DEFS.map((s) => [s.id, s.label]));

const MENU = [
  {
    heading: "Content",
    items: [
      { id: "prices", label: "Prices & packages" },
      { id: "phone", label: "Phone number" },
      ...TEXT_GROUPS.map((g, i) => ({ id: `text:${i}`, label: g.title })),
    ],
  },
  {
    heading: "Layout & media",
    items: [
      { id: "sections", label: "Section order" },
      { id: "instagram", label: "Instagram posts" },
      { id: "banner", label: "Top banner video" },
      { id: "images", label: "Images" },
    ],
  },
];
const VIEW_IDS = MENU.flatMap((g) => g.items.map((i) => i.id));

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Drop blank lines / half-empty FAQ rows so they aren't saved. */
function clean(v: unknown): unknown {
  if (Array.isArray(v)) {
    return v
      .map((x) => (typeof x === "string" ? x.trim() : x))
      .filter((x) =>
        typeof x === "string" ? x : (x as { q: string }).q.trim() && (x as { a: string }).a.trim(),
      );
  }
  return typeof v === "string" ? v.trim() : v;
}

export default function WebsiteEditor({ live, defaults, parts: initialParts, services, initialView }: Props) {
  const [view, setView] = useState(VIEW_IDS.includes(initialView ?? "") ? initialView! : "prices");
  const [lang, setLang] = useState<Lang>("en");

  // One shared set of edits across every panel, saved together.
  const [saved, setSaved] = useState({ values: live, services, parts: initialParts });
  const [values, setValues] = useState<Record<string, unknown>>(live);
  const [svc, setSvc] = useState<ServiceRow[]>(services);
  const [parts, setParts] = useState<Parts>(initialParts);

  const [newPost, setNewPost] = useState("");
  const [postError, setPostError] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, v: unknown) => {
    setValues((p) => ({ ...p, [key]: v }));
    setState("idle");
  };
  const setService = (id: string, patch: Partial<ServiceRow>) => {
    setSvc((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setState("idle");
  };
  const updateParts = (patch: Partial<Parts>) => {
    setParts((p) => ({ ...p, ...patch }));
    setState("idle");
  };

  // --- what changed since the last save ---------------------------------
  const changedKeys = Object.keys(values).filter((k) => !same(clean(values[k]), clean(saved.values[k])));
  const changedServices = svc.filter((s) => {
    const o = saved.services.find((x) => x.id === s.id);
    return !o || o.name !== s.name.trim() || o.description !== s.description.trim() || o.price !== s.price;
  });
  const sectionsChanged = !same(parts.sections, saved.parts.sections);
  const postsChanged = !same(parts.instagramPosts, saved.parts.instagramPosts);
  const reelChanged = parts.heroReelUrl !== saved.parts.heroReelUrl;
  const dirty =
    changedKeys.length > 0 || changedServices.length > 0 || sectionsChanged || postsChanged || reelChanged;

  // Dots in the side menu for panels that have unsaved edits.
  const dirtyViews = new Set<string>();
  if (changedServices.length || changedKeys.some((k) => k.startsWith("es.service."))) dirtyViews.add("prices");
  if (changedKeys.includes(CONTACT_PHONE_KEY)) dirtyViews.add("phone");
  TEXT_GROUPS.forEach((g, i) => {
    const paths = new Set(g.fields.map((f) => f.path));
    if (changedKeys.some((k) => paths.has(k.split(".").slice(1).join(".")))) dirtyViews.add(`text:${i}`);
  });
  if (sectionsChanged) dirtyViews.add("sections");
  if (postsChanged) dirtyViews.add("instagram");
  if (reelChanged) dirtyViews.add("banner");

  const save = async () => {
    setState("saving");
    setError(null);
    try {
      // A value equal to what the code ships with is sent as null, which
      // removes the override so the default applies. A blank Spanish service
      // field has no default to fall back on either.
      const content: Record<string, unknown> = {};
      for (const k of changedKeys) {
        const v = clean(values[k]);
        content[k] = same(v, defaults[k]) || v === "" ? null : v;
      }
      if (sectionsChanged) {
        const stored = sectionsToStored(parts.sections);
        content[SECTIONS_KEY] = same(stored, sectionsToStored(DEFAULT_PARTS.sections)) ? null : stored;
      }
      if (postsChanged)
        content[INSTAGRAM_POSTS_KEY] = same(parts.instagramPosts, DEFAULT_PARTS.instagramPosts)
          ? null
          : parts.instagramPosts;
      const reelUrl = normalizeInstagramUrl(parts.heroReelUrl);
      if (reelChanged) content[HERO_REEL_KEY] = reelUrl === DEFAULT_PARTS.heroReelUrl ? null : reelUrl;

      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          services: changedServices.map((s) => ({
            id: s.id,
            name: s.name.trim(),
            description: s.description.trim(),
            price: Number(s.price),
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      const cleaned = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, clean(v)]));
      const nextServices = svc.map((s) => ({ ...s, name: s.name.trim(), description: s.description.trim() }));
      const nextParts = { ...parts, heroReelUrl: reelUrl };
      setValues(cleaned);
      setSvc(nextServices);
      setParts(nextParts);
      setSaved({ values: cleaned, services: nextServices, parts: nextParts });
      setState("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setState("idle");
    }
  };

  // --- panels --------------------------------------------------------------
  const field = (f: FieldDef) => {
    const key = `${lang}.${f.path}`;
    const v = values[key];
    const modified = !same(clean(v), clean(defaults[key]));
    return (
      <div key={key}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted">
            {f.label}
            {f.help && <span className="ml-1 text-xs">({f.help})</span>}
          </span>
          {modified && (
            <button
              type="button"
              onClick={() => set(key, defaults[key])}
              className="text-xs text-muted underline hover:text-ink"
            >
              Reset to original
            </button>
          )}
        </div>
        {f.kind === "text" && (
          <input className={input} value={String(v ?? "")} onChange={(e) => set(key, e.target.value)} />
        )}
        {f.kind === "textarea" && (
          <textarea rows={3} className={input} value={String(v ?? "")} onChange={(e) => set(key, e.target.value)} />
        )}
        {f.kind === "list" && (
          <textarea
            rows={Math.max(3, ((v as string[]) ?? []).length)}
            className={input}
            value={((v as string[]) ?? []).join("\n")}
            onChange={(e) => set(key, e.target.value.split("\n"))}
          />
        )}
        {f.kind === "faq" && (
          <div className="mt-1 space-y-3">
            {((v as Faq) ?? []).map((item, i) => (
              <div key={i} className="rounded-[var(--radius-sm)] border border-border bg-base p-3">
                <input
                  className={input + " !mt-0 font-semibold"}
                  placeholder="Question"
                  value={item.q}
                  onChange={(e) => set(key, (v as Faq).map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
                />
                <textarea
                  rows={3}
                  className={input}
                  placeholder="Answer"
                  value={item.a}
                  onChange={(e) => set(key, (v as Faq).map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
                />
                <button
                  type="button"
                  onClick={() => set(key, (v as Faq).filter((_, j) => j !== i))}
                  className="mt-2 text-xs text-muted underline hover:text-ink"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set(key, [...((v as Faq) ?? []), { q: "", a: "" }])}
              className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm hover:border-accent"
            >
              + Add a question
            </button>
          </div>
        )}
      </div>
    );
  };

  const move = <T,>(list: T[], i: number, d: -1 | 1) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    return next;
  };

  const addPost = () => {
    if (!INSTAGRAM_URL_RE.test(newPost.trim())) {
      setPostError("Paste a post link like https://www.instagram.com/p/XXXX/");
      return;
    }
    const url = normalizeInstagramUrl(newPost);
    if (parts.instagramPosts.includes(url)) return setPostError("That post is already in the list.");
    if (parts.instagramPosts.length >= 12) return setPostError("12 posts max.");
    setPostError(null);
    setNewPost("");
    updateParts({ instagramPosts: [...parts.instagramPosts, url] });
  };

  const textGroupIndex = view.startsWith("text:") ? Number(view.slice(5)) : -1;

  const panel = () => {
    if (view === "prices")
      return (
        <div className="space-y-6">
          <div>
            <h2 className="font-bold">Packages &amp; prices</h2>
            <p className="mt-1 text-xs text-muted">One price per package, used for every vehicle size.</p>
            <div className="mt-3 space-y-3">
              {svc.map((s) => (
                <div key={s.id} className={card}>
                  <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                    <label className="text-sm">
                      <span className="text-muted">Name</span>
                      <input className={input} value={s.name} onChange={(e) => setService(s.id, { name: e.target.value })} />
                    </label>
                    <label className="text-sm">
                      <span className="text-muted">Price ($)</span>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        inputMode="decimal"
                        className={input}
                        value={Number.isFinite(s.price) ? s.price : ""}
                        onChange={(e) => setService(s.id, { price: e.target.valueAsNumber })}
                      />
                    </label>
                  </div>
                  <label className="mt-3 block text-sm">
                    <span className="text-muted">What&apos;s included</span>
                    <textarea
                      rows={3}
                      className={input}
                      value={s.description}
                      onChange={(e) => setService(s.id, { description: e.target.value })}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold">Package names &amp; details in Spanish</h3>
            <p className="mt-1 text-xs text-muted">Shown when a visitor switches the site to Español.</p>
            <div className={card + " mt-3 space-y-4"}>
              {svc.map((s) => (
                <div key={s.id} className="space-y-2">
                  <input
                    className={input + " !mt-0"}
                    placeholder={s.name}
                    value={String(values[serviceKey(s.id, "name")] ?? "")}
                    onChange={(e) => set(serviceKey(s.id, "name"), e.target.value)}
                  />
                  <textarea
                    rows={2}
                    className={input}
                    placeholder={s.description}
                    value={String(values[serviceKey(s.id, "description")] ?? "")}
                    onChange={(e) => set(serviceKey(s.id, "description"), e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    if (view === "phone")
      return (
        <div>
          <h2 className="font-bold">Phone number</h2>
          <div className={card + " mt-3"}>
            <label className="text-sm">
              <span className="text-muted">Used for the Call and Text buttons</span>
              <input
                type="tel"
                className={input}
                value={String(values[CONTACT_PHONE_KEY] ?? "")}
                onChange={(e) => set(CONTACT_PHONE_KEY, e.target.value)}
              />
            </label>
          </div>
        </div>
      );

    if (textGroupIndex >= 0) {
      const g = TEXT_GROUPS[textGroupIndex];
      return (
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">{g.title}</h2>
            <div className="flex gap-1 rounded-full border border-border p-1 text-sm">
              {LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`rounded-full px-3 py-1 ${lang === l ? "bg-accent font-semibold text-white" : "text-muted"}`}
                >
                  {LANG_LABEL[l]}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted">
            Visitors see the language they pick on the site, so edit both to keep them matching.
          </p>
          <div className={card + " mt-3 space-y-4"}>{g.fields.map(field)}</div>
        </div>
      );
    }

    if (view === "sections")
      return (
        <div>
          <h2 className="font-bold">Section order</h2>
          <p className="mt-1 text-xs text-muted">
            The top banner always stays first. Use the arrows to reorder and the button to show or hide a section.
          </p>
          <ul className="mt-3 space-y-2">
            {parts.sections.map((s, i) => (
              <li key={s.id} className={card + " flex items-center gap-3 !py-3"}>
                <span className={`flex-1 text-sm font-semibold ${s.visible ? "" : "text-muted line-through"}`}>
                  {SECTION_LABEL[s.id]}
                </span>
                <button
                  type="button"
                  aria-label="Move up"
                  className={iconBtn}
                  disabled={i === 0}
                  onClick={() => updateParts({ sections: move(parts.sections, i, -1) })}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  className={iconBtn}
                  disabled={i === parts.sections.length - 1}
                  onClick={() => updateParts({ sections: move(parts.sections, i, 1) })}
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-pressed={s.visible}
                  className={`${iconBtn} w-20 ${s.visible ? "!border-accent text-accent-hi" : "text-muted"}`}
                  onClick={() =>
                    updateParts({
                      sections: parts.sections.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x)),
                    })
                  }
                >
                  {s.visible ? "Shown" : "Hidden"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      );

    if (view === "instagram")
      return (
        <div>
          <h2 className="font-bold">Instagram posts</h2>
          <p className="mt-1 text-xs text-muted">
            In Instagram open a post → Share → Copy link, then paste it below. With no posts, the section shows a
            plain &ldquo;Follow us&rdquo; card.
          </p>
          <ul className="mt-3 space-y-2">
            {parts.instagramPosts.map((url, i) => (
              <li key={url} className={card + " flex items-center gap-2 !py-3"}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm text-accent-hi underline"
                >
                  {url.replace("https://www.instagram.com", "instagram.com")}
                </a>
                <button
                  type="button"
                  aria-label="Move up"
                  className={iconBtn}
                  disabled={i === 0}
                  onClick={() => updateParts({ instagramPosts: move(parts.instagramPosts, i, -1) })}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  className={iconBtn}
                  disabled={i === parts.instagramPosts.length - 1}
                  onClick={() => updateParts({ instagramPosts: move(parts.instagramPosts, i, 1) })}
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label="Remove post"
                  className={iconBtn + " text-danger"}
                  onClick={() => updateParts({ instagramPosts: parts.instagramPosts.filter((u) => u !== url) })}
                >
                  ✕
                </button>
              </li>
            ))}
            {parts.instagramPosts.length === 0 && <li className="text-sm text-muted">No posts yet.</li>}
          </ul>
          <div className="mt-3 flex gap-2">
            <input
              className={input + " !mt-0"}
              inputMode="url"
              placeholder="https://www.instagram.com/p/…"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPost();
                }
              }}
            />
            <button
              type="button"
              onClick={addPost}
              className="shrink-0 rounded-[var(--radius-sm)] border border-border px-4 text-sm font-semibold hover:border-accent"
            >
              Add
            </button>
          </div>
          {postError && <p className="mt-2 text-sm text-danger">{postError}</p>}
        </div>
      );

    if (view === "images")
      return (
        <div>
          <h2 className="font-bold">Images</h2>
          <p className="mt-1 text-xs text-muted">
            These show on the homepage. Uploads and changes here apply right away, with no need to hit Save; hidden
            images stay stored but off the site.
          </p>
          <div className="mt-3">
            <MediaManager />
          </div>
        </div>
      );

    // banner
    return (
      <div>
        <h2 className="font-bold">Top banner video</h2>
        <div className={card + " mt-3"}>
          <label className="text-sm">
            <span className="text-muted">Where tapping the phone video goes (an Instagram reel link)</span>
            <input
              className={input}
              inputMode="url"
              value={parts.heroReelUrl}
              onChange={(e) => updateParts({ heroReelUrl: e.target.value })}
            />
          </label>
          <p className="mt-2 text-xs text-muted">
            The video itself is a file on the site; this only changes the link.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-28 md:grid md:grid-cols-[13rem_1fr] md:items-start md:gap-8">
      {/* Side menu (a scrolling row of pills on phones) */}
      <nav aria-label="What to edit" className="md:sticky md:top-20">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-3 md:mx-0 md:flex-col md:gap-5 md:overflow-visible md:px-0 md:pb-0">
          {MENU.map((g) => (
            <div key={g.heading} className="flex shrink-0 gap-2 md:flex-col md:gap-1">
              <p className="hidden px-3 text-xs font-bold uppercase tracking-wide text-muted md:block">
                {g.heading}
              </p>
              {g.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setView(item.id)}
                  aria-current={view === item.id ? "page" : undefined}
                  className={`flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-left text-sm transition-colors md:rounded-[var(--radius-sm)] md:border-transparent md:px-3 ${
                    view === item.id
                      ? "border-accent bg-accent/15 font-semibold text-ink"
                      : "border-border text-muted hover:text-ink md:hover:bg-surface"
                  }`}
                >
                  {item.label}
                  {dirtyViews.has(item.id) && (
                    <span aria-label="unsaved changes" className="h-2 w-2 rounded-full bg-warning" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </nav>

      <div className="min-w-0 pt-2 md:pt-0">{panel()}</div>

      {/* Save bar (Images save on their own, so it stays out of the way there) */}
      <div hidden={view === "images" && !dirty} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-base/90 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-1">
          <p className="min-w-0 text-sm" role="status">
            {error ? (
              <span className="text-danger">{error}</span>
            ) : state === "saved" ? (
              <span className="text-success">
                Saved — live now.{" "}
                <a href="/" target="_blank" rel="noopener noreferrer" className="underline">
                  View site
                </a>
              </span>
            ) : dirty ? (
              <span className="text-muted">Unsaved changes</span>
            ) : (
              <span className="text-muted">No changes</span>
            )}
          </p>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || state === "saving"}
            className="tap rounded-[var(--radius-sm)] bg-accent px-6 font-bold text-white transition-colors hover:bg-accent-hi disabled:opacity-40"
          >
            {state === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
