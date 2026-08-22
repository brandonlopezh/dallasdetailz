# Dallas Detailz

Booking & operations platform for a DFW mobile detailing crew. Next.js + Supabase, built to run entirely on free tiers (Cloudflare Workers + Supabase). See `dallas-detailz-prd.md`… (PRD kept in the repo root) for the full spec.

## Status

**Phase 1, in progress.** Shipped so far:

- ✅ Marketing homepage (hero, before/after slider, services + live pricing, how-it-works, gallery, service area, FAQ, sticky mobile Book Now) — PRD §7.4
- ✅ 4-screen booking flow at `/book` (vehicle → service → where/when → confirm), local-storage persistence, live price, real slot picker — PRD §5.1
- ✅ Backend: Supabase schema + RLS + seed, availability engine, catalog/availability/bookings API routes
- ✅ DB-level double-booking prevention (Postgres `tstzrange` exclusion constraint) — PRD BK-10
- ✅ Admin auth (Supabase magic-link, email allowlist) + `/admin` shell — PRD AD-1
- ✅ Image manager: upload/manage hero, gallery, and before/after photos that render on the homepage (Supabase Storage)
- ✅ Operator admin: Today view (AD-2), Schedule (AD-3), Requests queue (AD-4), booking detail with status/reschedule/notes (AD-5/6), manual booking creation (AD-7)
- ⬜ Google Calendar sync, SMS/email (Twilio/Resend), customer records + reporting, audit trail, Instagram — next

## Stack

| Layer | Choice | Free tier |
|---|---|---|
| Framework | Next.js 16 (App Router, TS) | — |
| Hosting | Cloudflare Workers (via OpenNext) | ✅ (100k req/day) |
| Database + Auth | Supabase (Postgres) | ✅ |
| SMS / Email | Twilio / Resend | pay-per-use (later) |

## Local setup

```bash
npm install
cp .env.example .env.local     # fill in Supabase keys (see below)
npm run dev
```

The site renders **without** Supabase configured — the catalog falls back to
`src/lib/catalog.ts` (mirrors the SQL seed), so you can develop the UI offline.
Booking submission needs the database.

## Database (Supabase, free tier)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migrations in order:
   - `supabase/migrations/0001_init.sql` (schema + exclusion constraint)
   - `supabase/migrations/0002_rls.sql` (row-level security)
   - `supabase/migrations/0003_seed.sql` (services, pricing, add-ons)
   - `supabase/migrations/0004_media.sql` (site images + `site-media` Storage bucket)
3. Copy Project Settings → API into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Admin (`/admin`)

Operators sign in with a **magic link** (Supabase Auth) and manage the site.
Access is gated by an email allowlist — set `ADMIN_EMAILS` (comma-separated).

1. Add the operator emails to `ADMIN_EMAILS` in `.env.local`.
2. In Supabase → Authentication → URL Configuration, add the redirect URL
   `http://localhost:3000/admin/auth/callback` (and the production equivalent).
3. Visit `/admin`, enter an allowlisted email, click the emailed link.

**Images** (`/admin/media`): upload photos for the homepage hero, gallery grid,
and before/after sliders. Files go to the public `site-media` Storage bucket;
the homepage shows them immediately and falls back to gradient placeholders for
any slot with no image yet.

> The seed pricing/durations are **placeholders**. PRD §11 Q1 is blocking:
> replace with the real menu and real two-person job times before launch.

## Deploy (Cloudflare Workers)

Hosted on Cloudflare Workers via the [OpenNext](https://opennext.js.org/cloudflare)
adapter (`@opennextjs/cloudflare`) — API routes and server components keep
running server-side, unlike a static export. Free tier covers 100k
requests/day, which is far more than this site needs.

> **No `proxy.ts`.** Next.js 16's `proxy.ts` (formerly middleware) always
> runs on the Node.js runtime, and Cloudflare's OpenNext adapter doesn't
> support Node.js middleware yet (open issue, no ETA:
> [cloudflare/workers-sdk#13755](https://github.com/cloudflare/workers-sdk/issues/13755)).
> It wasn't the auth boundary anyway — `getAdminUser()` is checked
> independently in the `(dash)` layout and every `/api/admin/*` route — but
> it *was* what silently refreshed the Supabase session cookie on every
> `/admin` request. That job now belongs to `GET /api/admin/refresh`, pinged
> every 10 min by `<SessionRefresher>` (rendered in the admin layout) so a
> session doesn't go stale mid-task. If Cloudflare/OpenNext ever ships
> Node.js middleware support, `proxy.ts` (still in `_to_delete/` from the
> migration, restorable) could come back and this workaround could go away.

**One-time setup:**

1. `npx wrangler login` — authorizes the CLI against your (free) Cloudflare
   account in the browser.
2. In the Cloudflare dashboard → Workers & Pages → your Worker → Settings →
   Variables, add the same vars as `.env.example`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_EMAILS`,
   `NEXT_PUBLIC_SITE_URL`) and add `SUPABASE_SERVICE_ROLE_KEY` as an
   **encrypted secret** (`npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY`)
   rather than a plaintext variable.
3. **Deploy command:** set it to `npm run deploy`, not the dashboard's
   default `npx wrangler deploy` — the default triggers Wrangler's
   auto-config/migrate step, which regenerates `wrangler.jsonc` /
   `open-next.config.ts` on every build instead of using the ones committed
   here.
4. In Supabase → Authentication → URL Configuration, add the production
   redirect URL: `https://<your-worker>.workers.dev/admin/auth/callback`
   (or your custom domain, once attached).

**Deploy:**

```bash
npm run deploy      # opennextjs-cloudflare build + wrangler deploy
```

Or connect the GitHub repo in the Cloudflare dashboard (Workers & Pages →
Create → Connect to Git) for automatic deploys on every push to `main`,
same as the old Vercel flow — just make sure the deploy command is
`npm run deploy` (see step 3 above).

**Local preview under the real Workers runtime** (optional, catches
Workers-specific issues `next dev` won't):

```bash
cp .dev.vars.example .dev.vars   # fill in the same values as .env.local
npm run preview
```

A custom domain (e.g. `dallasdetailz.com`) can be attached for free in
Workers & Pages → your Worker → Settings → Domains & Routes — Cloudflare
handles the DNS/SSL at no cost as long as the domain's nameservers point to
Cloudflare.

## API

| Route | Purpose |
|---|---|
| `GET /api/catalog` | Services + pricing, add-ons, public settings |
| `GET /api/availability?serviceId=&tier=&addons=` | Open slots for the horizon |
| `POST /api/bookings` | Create a confirmed booking (server-priced, DB-guarded) |
| `GET /api/admin/refresh` | Refreshes the admin's Supabase session cookie (pinged by `<SessionRefresher>`) |

## Architecture notes

- **Single-crew model** (PRD §4): no `operator_id` on bookings; availability is
  business-level, computed as working hours minus the union of bookings and
  calendar-busy blocks (`src/lib/availability.ts`).
- **DB is the source of truth.** The overlap constraint means a slot race is
  resolved by Postgres (loser gets a 409), not app-layer checks.
- Prices and slot end-times are always recomputed server-side; client totals
  are display-only.
