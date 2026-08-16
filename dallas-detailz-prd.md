# Product Requirements Document
## Dallas Detailz — Booking & Operations Platform

**Version:** 1.0
**Date:** August 16, 2026
**Owner:** Brandon Lopez
**Status:** Draft for review

---

## 1. Assumptions

These are inferred from the Instagram profile and public sources. Correct any that are wrong before build starts, because several drive core architecture.

| # | Assumption | Basis | Impact if wrong |
|---|---|---|---|
| A1 | Business is **fully mobile** (tech travels to customer) | Vehicles photographed in driveways, residential streets, customer garages | High. Changes booking flow, scheduling math, and address handling |
| A2 | Service area is Duncanville, Dallas, and greater DFW | IG bio: "Dallas \| Duncanville \| DFW" | Medium. Drives radius validation and travel-time logic |
| A3 | **CONFIRMED:** Twins work as a single two-man crew on the same vehicle. One shared calendar. One job at a time | Confirmed by Brandon | Resolved. Capacity model is business-level, not per-operator |
| A4 | Current booking happens entirely through Instagram DM | IG bio leads with "DM"; no booking link present | Low. Confirms the problem statement |
| A5 | Service taxonomy is Exterior / Interior / Full, with a foam wash component | IG highlight reels: Exterior, Interior, Foamy, Prices | Low. Easily adjusted in admin |
| A6 | Customer base skews large vehicles (trucks, 3-row SUVs) | Grid shows Tahoe, Armada, Durango, Tundra, Suburban | Medium. Vehicle tiering must default to larger sizes, not sedans |
| A7 | No payment is currently collected online | No booking or payment link in bio or Linktree | Medium. Deposits are P1, not P0 |

---

## 2. Problem Statement

Dallas Detailz takes bookings through Instagram DMs. That creates four operational failures:

1. **No system of record.** A booking exists as a message thread. If it scrolls, it's gone.
2. **No availability truth.** Confirming a time requires manually recalling what's already booked, which produces double-bookings and back-and-forth.
3. **Conversion loss.** Every DM booking requires a live human reply. Requests that arrive at 11 PM sit until morning, and a portion of those customers book elsewhere.
4. **No visibility.** Neither brother can see the other's day without asking.

The fix is a single booking surface plus a shared admin, with Instagram feeding into it rather than competing with it.

---

## 3. Goals & Non-Goals

### Goals

| ID | Goal | Success metric |
|---|---|---|
| G1 | Customer can book without talking to anyone | ≥60% of bookings self-serve within 90 days of launch |
| G2 | Booking takes under 90 seconds from homepage | Median time-to-complete < 90s |
| G3 | Zero double-bookings | 0 calendar conflicts per month |
| G4 | Jobs appear automatically in Google Calendar | 100% of confirmed bookings sync within 60s |
| G5 | Instagram requests are visible in the same admin as web bookings | ≥90% of IG inquiries logged, not lost in DMs |
| G6 | Either brother can see the full schedule from a phone | Admin is mobile-first, usable one-handed |

### Non-Goals (v1)

- Employee time tracking or payroll
- Inventory or chemical/supply management
- Customer loyalty program or referral engine
- Multi-location or franchise support
- Automated route optimization across a full day (see Risks)
- Full CRM with marketing automation

---

## 4. Users & Roles

| Role | Who | Access |
|---|---|---|
| **Customer** | DFW vehicle owners | Public site, booking flow, self-serve reschedule/cancel via magic link |
| **Operator (Admin)** | The two brothers | Full admin: schedule, bookings, customers, services, pricing, availability, IG inbox |
| **Owner (Super Admin)** | Whichever brother owns the account | Everything above, plus integrations, user management, and billing settings |

Only two operator accounts are needed at launch, but the role model should support adding a third tech without a schema change.

**Crew model:** the twins operate as a single unit. Both accounts see and manage the same schedule with identical permissions. There is no job assignment, no per-operator availability, and no "whose customer is this" concept. Availability is a property of the business, not of an individual.

This is a significant simplification. It removes the scheduling engine's assignment logic, the operator picker in the booking flow, and per-operator capacity math — roughly a week off the Phase 1 estimate.

---

## 5. Core User Flows

### 5.1 Customer Booking Flow (the critical path)

The single most important requirement: **"Book Now" is above the fold on the homepage and the flow is four screens.** No account creation. No login. Progressive disclosure — price updates live as they choose.

```
HOMEPAGE
  └─ [BOOK NOW] (sticky, always visible on mobile)
       │
       ├─ STEP 1: Vehicle
       │    Size tier: Sedan / Coupe · Mid SUV / Truck · Large SUV / 3-Row · XL / Lifted
       │    (Default selection: Mid SUV / Truck — matches actual customer mix)
       │    Optional: Year / Make / Model (free text, not required)
       │
       ├─ STEP 2: Service
       │    Package cards with price + duration, filtered by vehicle tier
       │    Exterior · Interior · Full Detail
       │    Add-ons (multi-select): pet hair, heavy stains, engine bay,
       │      headlight restoration, wax/sealant, clay bar
       │    → Running total displays at bottom of screen
       │
       ├─ STEP 3: Where & When
       │    Service address (Google Places autocomplete)
       │      → Validates against service radius immediately
       │      → If outside radius: show travel surcharge OR "request quote" fallback
       │    Two quick qualifiers: water access? outlet access?
       │    Calendar: next 21 days, only real open slots shown
       │      → Slot length = package duration + travel buffer
       │
       ├─ STEP 4: Contact & Confirm
       │    Name · Mobile · Email
       │    Optional notes field
       │    Summary card: service, price, date/time, address
       │    [CONFIRM BOOKING]
       │
       └─ CONFIRMATION
            On-screen confirmation + booking reference
            SMS + email confirmation sent immediately
            "Add to my calendar" (.ics) link
            Reschedule/cancel magic link
```

**Hard requirements on this flow:**

- **R1:** Works fully on mobile. Assume >85% of traffic arrives from the Instagram bio link on a phone.
- **R2:** No dead ends. If a customer's address is out of range or no slots match, they get a "Request a time" fallback that lands in admin as a pending request rather than a bounce.
- **R3:** Back navigation preserves all prior input.
- **R4:** Booking state persists in local storage, so an interrupted booking can be resumed.
- **R5:** Price is never hidden. If a service genuinely requires inspection, it displays "Starting at $X" and routes to a quote request.

### 5.2 Operator Flow — Morning Check

Operator opens admin on phone → sees Today view: jobs in order, with address, vehicle, service, price, customer phone, and a tap-to-navigate link. One tap marks a job complete.

### 5.3 Operator Flow — Handling an Instagram Request

DM arrives → surfaces in admin Inbox → operator taps "Convert to Booking" → pre-filled booking draft opens with whatever was parsed from the thread → operator fills gaps and confirms, or sends the customer a personal booking link that pre-fills the same data.

---

## 6. Functional Requirements

### 6.1 Public Website — P0

| ID | Requirement |
|---|---|
| PW-1 | Homepage with hero, sticky Book Now CTA, service overview, before/after gallery, service area, FAQ, contact |
| PW-2 | Services page: each package with what's included, duration, and price by vehicle tier |
| PW-3 | Gallery pulling from Instagram (Basic Display API or manually curated — see 6.5) |
| PW-4 | Service area page with map and named cities |
| PW-5 | Mobile-first responsive, Lighthouse performance ≥90 |
| PW-6 | Local SEO: schema.org `AutoDetailing` / `LocalBusiness` markup, city landing pages for Duncanville, Cedar Hill, DeSoto, Grand Prairie, Dallas |
| PW-7 | Click-to-call and click-to-DM buttons as secondary paths |

### 6.2 Booking Engine — P0

| ID | Requirement |
|---|---|
| BK-1 | **Single availability track.** Real-time availability computed from crew working hours, existing bookings, travel buffers, and the union of both twins' Google Calendar busy blocks |
| BK-2 | Service duration drives slot length; a Full Detail on a large SUV consumes more of the day than an Exterior on a sedan. **Durations reflect two people working, not one** — set them from observed job times, not industry averages |
| BK-3 | Configurable buffer between jobs (default 45 min) to cover drive time and setup |
| BK-4 | Daily job cap (default 3), configurable. Applies to the crew, not per person |
| BK-4a | No slot may overlap another confirmed booking. Because the crew works one vehicle at a time, concurrency is always 1 |
| BK-5 | Blackout dates and one-off time-off blocks |
| BK-6 | Booking confirmation via SMS and email |
| BK-7 | Automated reminders: 24 hours before and 2 hours before |
| BK-8 | Customer self-serve reschedule/cancel via magic link, with a configurable cutoff (default 12 hours prior) |
| BK-9 | Weather-sensitive flagging: bookings show a rain-risk indicator so operators can proactively reschedule |
| BK-10 | Double-booking prevention enforced at the database level, not just the UI |

### 6.3 Admin Dashboard — P0

| ID | Requirement |
|---|---|
| AD-1 | Secure login (email magic link or Google SSO) for the two operator accounts |
| AD-2 | **Today view** — default landing screen. Jobs in chronological order with all field-relevant detail |
| AD-3 | **Calendar view** — day/week/month, color-coded by booking status |
| AD-4 | **Requests queue** — pending items needing action: out-of-range requests, quote requests, and unconverted Instagram inquiries. Badge count visible |
| AD-5 | Booking detail: full record, edit, reschedule, cancel, add internal notes. Either twin can act on any booking |
| AD-5a | Audit trail on every change showing which twin made it. Shared ownership still needs accountability when a price gets edited or a job gets moved |
| AD-6 | Booking status lifecycle: `requested` → `confirmed` → `in_progress` → `completed` → (`cancelled` / `no_show`) |
| AD-7 | Manual booking creation for phone or walk-up customers |
| AD-8 | Customer records with full service history, vehicle(s), and notes |
| AD-9 | Service and pricing management — edit packages, prices, durations, and add-ons without a developer |
| AD-10 | Availability management — crew working hours (one schedule), blackouts, daily cap. Either twin can edit; changes apply to both |
| AD-11 | Simple reporting: bookings and revenue by week/month, service mix, booking source (web vs Instagram vs manual) |
| AD-12 | Mobile-first. This will be used standing in a driveway, not at a desk |

### 6.4 Google Calendar Integration — P0

**Model:** One shared business calendar, written once and visible to both twins, with read-only awareness of each twin's personal calendar.

| ID | Requirement |
|---|---|
| GC-1 | Both twins connect their Google accounts via OAuth 2.0 (scopes: `calendar.events`, `calendar.readonly`) |
| GC-2 | System writes confirmed bookings **once** to a single shared **"Dallas Detailz — Jobs"** calendar, owned by one account and shared to the other with write access. No duplicate events, no per-person copies |
| GC-3 | Event payload: title `[Service] — [Customer] — [Vehicle]`, location = service address, description = price, add-ons, phone, notes, and a deep link back to the admin record |
| GC-4 | Booking edits (reschedule, cancel, service change) propagate to the calendar event within 60 seconds |
| GC-5 | **Inbound blocking uses the union of both personal calendars.** Because the crew works together, a slot is only bookable if *both* twins are free. If either has a personal commitment, the slot disappears from public availability |
| GC-6 | Push notification channels (webhooks) on both connected accounts, with a scheduled reconciliation job as a fallback |
| GC-7 | Token refresh handled automatically; a broken connection raises a visible admin banner naming which twin needs to reconnect |
| GC-8 | Calendar is the mirror, not the source of truth. The application database is authoritative. Conflicts resolve in favor of the database |

**Rationale for GC-5 — this is the key consequence of the crew model.** Availability is an intersection of free time, not a pool of capacity. Two operators working independently would mean more slots; two operators working together means *fewer*, because either one's dentist appointment kills the whole slot. Build it as union-of-busy from day one. Getting this backwards produces double-bookings that look like calendar bugs but are actually a modeling error.

**Rationale for GC-2 and GC-8:** a single shared calendar keeps personal life out of the business record and makes the sync reversible. Treating the database as authoritative avoids the classic failure where an accidental drag in Google Calendar silently moves a customer's appointment without notifying them.

### 6.5 Instagram Integration — Phased

This is the highest-risk and highest-cost item in the request. Verified constraints, per Meta's current developer documentation:

**Confirmed technical constraints:**
- The Instagram Messaging API is part of Meta's Graph API. There is no standalone DM API.
- It requires an Instagram **Professional** account (Business or Creator). Personal accounts are not supported.
- The account must be connected to a **Facebook Page**.
- Reading and sending DMs requires the `instagram_business_manage_messages` permission (formerly `instagram_manage_messages`), which must be approved through **Meta App Review**. Review commonly takes weeks to months.
- Before approval, development mode supports up to roughly 25 test users only.
- Replies to a customer are constrained to a **24-hour messaging window** after their last message. Outside that window, only approved message tags or one-time notifications apply.
- Handling other parties' message data through Meta APIs may require **Meta Tech Provider** status depending on the deployment model.

**Recommendation: do not block launch on this.** Ship in three phases.

#### Phase 1 (Launch) — Zero API dependency — P0

| ID | Requirement |
|---|---|
| IG-1 | Instagram bio link points to the booking page, replacing the current DM-only path |
| IG-2 | Instagram auto-reply configured via an approved partner tool (ManyChat, Linktree, or similar) so a comment or DM keyword returns the booking link automatically |
| IG-3 | Admin has a one-tap **"Log Instagram Booking"** form so a DM-sourced job is entered in under 20 seconds with `source = instagram` |
| IG-4 | Every booking carries a `source` field, so the reporting in AD-11 shows exactly how much volume Instagram still drives |

This delivers most of the operational value — everything lands in one system — at near-zero integration risk.

#### Phase 2 — Real DM Inbox — P1

| ID | Requirement |
|---|---|
| IG-5 | Meta app created, Professional account and Facebook Page linked, webhook endpoint subscribed to `messages` and `messaging_postbacks` |
| IG-6 | `instagram_business_manage_messages` submitted for App Review |
| IG-7 | Unified **Inbox** in admin showing IG threads with customer handle, profile photo, message history, and unread state |
| IG-8 | Reply to DMs directly from admin, with a visible countdown on the 24-hour window |
| IG-9 | Inbound DMs auto-create a card in the Requests queue (AD-4) |

#### Phase 3 — Conversion Intelligence — P2

| ID | Requirement |
|---|---|
| IG-10 | "Convert to Booking" parses the thread for vehicle, service intent, date references, and address, then pre-fills a booking draft for operator confirmation |
| IG-11 | Send a personalized pre-filled booking link into the DM thread in one tap |
| IG-12 | Match returning IG customers to existing customer records by handle |

**Fallback if App Review is denied or stalls:** a third-party unified inbox (ManyChat, SleekFlow, or equivalent) can be linked from admin, with bookings still logged through IG-3. Functionality degrades to two apps instead of one, but nothing breaks.

### 6.6 Notifications — P0

| Trigger | Customer | Operator |
|---|---|---|
| Booking confirmed | SMS + email | Push/SMS |
| 24h before | SMS reminder | Daily digest of tomorrow's jobs |
| 2h before | SMS ("on the way today") | — |
| Rescheduled | SMS + email | Push |
| Cancelled | Email | Push |
| New request needing action | — | Push/SMS |
| Job completed | Email + review request link | — |

SMS is the primary channel. Detailing customers are phone-first, and email open rates for this segment are unreliable.

### 6.7 Payments — P1

| ID | Requirement |
|---|---|
| PY-1 | Stripe integration for optional deposits at booking (recommended: $25–50 flat, or 20%) |
| PY-2 | Configurable — deposits can be turned off entirely |
| PY-3 | Balance collected in person; admin records payment method and marks paid |
| PY-4 | Automated receipt on completion |

**Why P1 and not P0:** adding a payment step to the booking flow measurably reduces conversion. Launch without it, measure the no-show rate, and turn deposits on only if no-shows exceed roughly 10%. That is a data-driven decision, not a default.

---

## 7. Design Direction

Derived from the actual Instagram profile. Confirm exact values against the real logo file before build.

### 7.1 Visual Identity

**Observed from the profile:**
- Circular badge logo: vehicle silhouette with foam/spray motif, "DALLASDETAILZ" wordmark
- Alternate marks use the Dallas skyline with an electric blue treatment
- Near-black and white dominant, blue as the single accent
- Photography is night-heavy: wet paint under artificial light, interior shots with dome lighting, foam-covered vehicles in daylight
- Voice is casual and emoji-forward, not corporate

### 7.2 Token Set

```
/* Confirm blue hex against the actual logo asset */

--color-base:        #0A0A0C   /* page background */
--color-surface:     #141619   /* cards, panels */
--color-surface-alt: #1E2127   /* elevated / hover */
--color-border:      #2A2E35

--color-accent:      #1E6FE8   /* electric blue — CTA, links, active states */
--color-accent-hi:   #4A8FFF   /* hover */

--color-text:        #FFFFFF
--color-text-muted:  #9BA1A9

--color-success:     #22C55E
--color-warning:     #F59E0B
--color-danger:      #EF4444

--font-display: 'Archivo', 'Barlow Condensed', sans-serif;  /* bold, tight, badge-like */
--font-body:    'Inter', system-ui, sans-serif;

--radius-sm: 6px;
--radius-md: 12px;
--radius-lg: 20px;
```

### 7.3 Design Principles

1. **Dark base, photo-forward.** Their work photographs well against black. Let the images carry the page; keep chrome minimal.
2. **Blue is reserved for action.** Accent color appears on CTAs, selected states, and active nav only. Never decorative.
3. **Before/after is the sales argument.** Build a slider component for paired shots. This is more persuasive than any copy.
4. **Big touch targets.** Minimum 48px. Customers are booking one-handed from Instagram; operators are tapping with wet hands.
5. **Voice stays theirs.** Direct and casual. "Book your detail" not "Schedule your appointment today." No corporate filler.
6. **Trucks first.** Hero imagery and default selections should reflect the actual customer mix — large SUVs and pickups, not sedans.

### 7.4 Homepage Structure

```
[ Sticky header: logo · Services · Gallery · Area · (BOOK NOW) ]

HERO
  Full-bleed night shot, wet gloss
  H1: We come to you. DFW mobile detailing.
  Sub: Duncanville · Dallas · DFW
  [ BOOK NOW ]  [ See Pricing ]

PROOF STRIP
  Before/after slider, 3 pairs

SERVICES
  Three cards: Exterior · Interior · Full Detail
  Price from, duration, [Book this]

HOW IT WORKS
  1. Pick your service  2. Pick your time  3. We show up
  Reinforces low friction

GALLERY
  Instagram grid, 6–9 tiles

SERVICE AREA
  Map + city list

FAQ
  Water/power access, weather policy, how long it takes,
  what's included, payment methods

FOOTER
  Sticky mobile CTA bar persists throughout: [ BOOK NOW ]
```

---

## 8. Technical Architecture

### 8.1 Recommended Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js (App Router) | Server rendering for local SEO, single codebase for site and admin |
| Hosting | Vercel | Zero-config deploys, generous free tier at this scale |
| Database | Supabase (PostgreSQL) | Relational integrity for booking conflicts, row-level security, built-in auth |
| Auth | Supabase Auth (magic link + Google) | Operators sign in with the same Google account used for Calendar |
| Calendar | Google Calendar API v3 | Required integration |
| Instagram | Meta Graph API | Phase 2+ |
| SMS | Twilio | Reliable, pay-per-use |
| Email | Resend | Simple transactional email |
| Payments | Stripe | Phase 2 |
| Maps | Google Places + Distance Matrix | Address autocomplete and travel-time calculation |

### 8.2 Build vs. Buy

Worth stating explicitly, because it's the first question anyone should ask.

**Off-the-shelf options exist** — Urable and Mobile Tech RX are detailing-specific; Squarespace plus Acuity Scheduling is the generic path. Roughly $50–150/month, live in a week.

**Custom is the right call here for three reasons:**
1. The Instagram-as-inbox requirement is not available off the shelf. That's the differentiating ask.
2. Recurring SaaS cost compounds; a custom build has a fixed cost and no per-seat pricing as they add techs.
3. The design needs to match their existing brand, and templated products fight that.

**Counter-consideration:** custom means they own maintenance. If neither brother is technical, budget for ongoing support or use a managed platform for v1 and migrate later. This is a real trade-off, not a formality.

### 8.3 Data Model (core entities)

```
operators                  -- auth + calendar connection only, NOT capacity
  id · name · email · phone
  google_refresh_token · gcal_connected_at · active

business_settings          -- single row; crew-level scheduling config
  id · working_hours (jsonb) · daily_job_cap
  job_buffer_min · service_radius_mi · travel_fee_rules (jsonb)
  booking_lead_time_hr · booking_horizon_days · reschedule_cutoff_hr

services
  id · name · description · category (exterior|interior|full)
  base_duration_min · active · sort_order

service_pricing
  id · service_id · vehicle_tier · price · duration_min
  (composite unique on service_id + vehicle_tier)

addons
  id · name · price · duration_min · active

customers
  id · name · phone · email · instagram_handle
  address · notes · created_at

vehicles
  id · customer_id · year · make · model · tier · color

bookings                   -- no operator_id; the crew takes every job
  id · customer_id · service_id · vehicle_id
  scheduled_start · scheduled_end · service_address · lat · lng
  status (requested|confirmed|in_progress|completed|cancelled|no_show)
  source (web|instagram|phone|manual|referral)
  subtotal · addon_total · travel_fee · total
  deposit_paid · payment_status
  gcal_event_id · internal_notes · customer_notes
  created_at · updated_at

booking_addons
  booking_id · addon_id · price_at_booking

availability_blocks
  id · start · end · reason · type (blackout|gcal_sync)
  source_operator_id (nullable)   -- which twin's calendar produced a gcal_sync block
  -- blackouts are crew-wide; gcal_sync blocks are unioned into one busy set

ig_threads          -- Phase 2
  id · ig_thread_id · ig_user_id · handle · last_message_at
  customer_id (nullable) · status (new|responded|converted|closed)

ig_messages         -- Phase 2
  id · thread_id · direction · body · sent_at · ig_message_id

audit_log
  id · actor_id · entity · entity_id · action · before · after · at
```

**Critical constraint:** enforce non-overlapping confirmed bookings at the database level using a PostgreSQL exclusion constraint on a `tstzrange`. With a single crew this is simpler than the multi-operator case — one global constraint, no partitioning by operator:

```sql
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_jobs
  EXCLUDE USING gist (
    tstzrange(scheduled_start, scheduled_end) WITH &&
  ) WHERE (status IN ('confirmed', 'in_progress'));
```

Application-layer checks alone will eventually fail under concurrent requests — two customers hitting the same slot simultaneously is exactly the scenario this prevents.

---

## 9. Phased Roadmap

| Phase | Scope | Est. duration |
|---|---|---|
| **Phase 1 — MVP** | Public site, booking flow, admin (Today/Calendar/Requests/Bookings), Google Calendar two-way sync, SMS + email notifications, manual IG booking logging | 3–5 weeks |
| **Phase 2 — Revenue & Inbox** | Stripe deposits, Instagram Messaging API inbox, review request automation, expanded reporting | 3–4 weeks (plus Meta App Review lead time, which runs in parallel) |
| **Phase 3 — Intelligence** | DM-to-booking conversion, recurring maintenance plans, route-aware slot suggestions, customer portal | 3–4 weeks |

**Start the Meta App Review submission during Phase 1.** Review time is the long pole; nothing else in the build depends on it, so it should be running in the background from week one.

---

## 10. Success Metrics

| Metric | Baseline | 90-day target |
|---|---|---|
| Self-serve booking share | 0% | ≥60% |
| Median time-to-book | Hours (DM round-trip) | <90 seconds |
| Homepage → confirmed booking conversion | n/a | ≥8% |
| Double-bookings per month | Unknown | 0 |
| Booking abandonment rate | n/a | <35% |
| No-show rate | Unknown | <10% |
| Inquiry response time | Hours | <15 min (auto-reply) |
| Bookings outside business hours | ~0 | ≥25% |

That last metric is the clearest proof of value. Every booking that lands at 11 PM without a human replying is revenue the DM-only workflow was leaving on the table.

---

## 11. Risks & Open Questions

### Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Meta App Review denied or delayed | High | Phase 1 ships without it; third-party inbox as fallback |
| Weather cancellations disrupt schedule | Medium | Rain-risk flags, one-tap bulk reschedule, clear weather policy in FAQ |
| Travel time between jobs is underestimated, causing cascading lateness | Medium | Conservative default buffer; Distance Matrix validation between consecutive bookings |
| Operators don't adopt the admin and revert to DMs | High | Mobile-first design, sub-20-second manual logging, keep it faster than the old way |
| Instagram API terms change | Medium | Isolate integration behind an internal service layer so it can be swapped |
| Google Calendar drag-edit silently moves a customer appointment | Medium | Database is authoritative; reconciliation job flags divergence for operator review |
| **Crew model is a single point of failure.** One twin sick or unavailable means zero capacity, not half | High | Availability correctly reflects this (GC-5). Build one-tap bulk reschedule for a lost day, plus a saved SMS template so affected customers are notified in one action |
| Personal calendar clutter over-restricts availability | Medium | Let each twin designate which of their calendars count toward busy. A "lunch with mom" recurring event shouldn't silently delete Saturday slots |

### Open Questions

~~1. **Capacity model.**~~ **RESOLVED.** Twins work as one crew on the same vehicle. Single shared calendar, concurrency of 1, availability computed as the intersection of both twins' free time.

Remaining, in priority order. The first two are blocking.

1. **Actual service menu and pricing.** The Prices highlight has this. Need the exact packages, prices by vehicle tier, and **real durations with two people working** — not solo estimates. If a Full Detail on a Tahoe takes them 3 hours together, the slot math has to say 3, not 5.
2. **Service radius and travel policy.** How far will they drive, and is there a surcharge past a certain distance?
3. **Realistic daily cap.** Two people on one vehicle means faster turnaround than a solo detailer. Is 3 jobs/day right, or can they do 4? This sets the default in `business_settings`.
4. Do they want deposits at launch, or measure no-shows first?
5. What's the current weekly job volume? Validates the cap and sizes the launch.
6. Is `dallasdetailz` already a Professional account with a linked Facebook Page? If not, that conversion is step one for Phase 2.
7. Who owns the domain, and is one registered yet?
8. Which Google account should own the shared Jobs calendar? Pick the one less likely to change email addresses — migrating calendar ownership later is annoying.
