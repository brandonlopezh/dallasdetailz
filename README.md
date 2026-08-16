# Dallas Detailz

Booking & operations platform for a DFW mobile detailing crew. Next.js + Supabase, built to run entirely on free tiers (Vercel + Supabase). See `dallas-detailz-prd.md`… (PRD kept in the repo root) for the full spec.

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
| Hosting | Vercel | ✅ |
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

## Deploy (Vercel)

Import the repo, add the same env vars in Vercel Project Settings, deploy.
The homepage is static; API routes are serverless functions.

## API

| Route | Purpose |
|---|---|
| `GET /api/catalog` | Services + pricing, add-ons, public settings |
| `GET /api/availability?serviceId=&tier=&addons=` | Open slots for the horizon |
| `POST /api/bookings` | Create a confirmed booking (server-priced, DB-guarded) |

## Architecture notes

- **Single-crew model** (PRD §4): no `operator_id` on bookings; availability is
  business-level, computed as working hours minus the union of bookings and
  calendar-busy blocks (`src/lib/availability.ts`).
- **DB is the source of truth.** The overlap constraint means a slot race is
  resolved by Postgres (loser gets a 409), not app-layer checks.
- Prices and slot end-times are always recomputed server-side; client totals
  are display-only.
