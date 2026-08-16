-- Dallas Detailz — core schema (PRD §8.3)
-- Single-crew model: no operator_id on bookings, business-level capacity.

-- Needed for the GiST exclusion constraint on tstzrange.
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type vehicle_tier as enum ('sedan', 'mid_suv', 'large_suv', 'xl');
create type service_category as enum ('exterior', 'interior', 'full');
create type booking_status as enum (
  'requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
);
create type booking_source as enum ('web', 'instagram', 'phone', 'manual', 'referral');
create type payment_status as enum ('unpaid', 'deposit_paid', 'paid');
create type availability_block_type as enum ('blackout', 'gcal_sync', 'time_off');
create type ig_thread_status as enum ('new', 'responded', 'converted', 'closed');

-- ---------------------------------------------------------------------------
-- Operators — auth + calendar connection only, NOT capacity
-- ---------------------------------------------------------------------------
create table operators (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,                 -- links to auth.users
  name text not null,
  email text not null unique,
  phone text,
  google_refresh_token text,
  gcal_connected_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Business settings — single row; crew-level scheduling config
-- ---------------------------------------------------------------------------
create table business_settings (
  id smallint primary key default 1,
  working_hours jsonb not null default '{
    "mon": [["09:00","18:00"]],
    "tue": [["09:00","18:00"]],
    "wed": [["09:00","18:00"]],
    "thu": [["09:00","18:00"]],
    "fri": [["09:00","18:00"]],
    "sat": [["08:00","17:00"]],
    "sun": []
  }'::jsonb,
  daily_job_cap smallint not null default 3,
  job_buffer_min smallint not null default 45,
  service_radius_mi smallint not null default 30,
  travel_fee_rules jsonb not null default '[
    {"up_to_mi": 20, "fee": 0},
    {"up_to_mi": 30, "fee": 25},
    {"up_to_mi": 45, "fee": 50}
  ]'::jsonb,
  booking_lead_time_hr smallint not null default 12,
  booking_horizon_days smallint not null default 21,
  reschedule_cutoff_hr smallint not null default 12,
  timezone text not null default 'America/Chicago',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

-- ---------------------------------------------------------------------------
-- Services + pricing
-- ---------------------------------------------------------------------------
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category service_category not null,
  base_duration_min integer not null default 120,
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create table service_pricing (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  tier vehicle_tier not null,
  price numeric(10, 2) not null,
  duration_min integer not null,
  unique (service_id, tier)
);

create table addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10, 2) not null,
  duration_min integer not null default 0,
  active boolean not null default true,
  sort_order smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- Customers + vehicles
-- ---------------------------------------------------------------------------
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  instagram_handle text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  year smallint,
  make text,
  model text,
  tier vehicle_tier not null default 'mid_suv',
  color text
);

-- ---------------------------------------------------------------------------
-- Bookings — no operator_id; the crew takes every job
-- ---------------------------------------------------------------------------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default (
    'DD-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))
  ),
  customer_id uuid not null references customers(id),
  service_id uuid not null references services(id),
  vehicle_id uuid references vehicles(id),
  vehicle_tier vehicle_tier not null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  service_address text not null,
  lat double precision,
  lng double precision,
  water_access boolean,
  outlet_access boolean,
  status booking_status not null default 'requested',
  source booking_source not null default 'web',
  subtotal numeric(10, 2) not null default 0,
  addon_total numeric(10, 2) not null default 0,
  travel_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  deposit_paid boolean not null default false,
  payment_status payment_status not null default 'unpaid',
  gcal_event_id text,
  manage_token uuid not null default gen_random_uuid(),  -- self-serve magic link
  internal_notes text,
  customer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint end_after_start check (scheduled_end > scheduled_start)
);

-- BK-10 / BK-4a: no overlapping active jobs, enforced at the database level.
-- Concurrency is always 1 because the crew works one vehicle at a time.
alter table bookings add constraint no_overlapping_jobs
  exclude using gist (
    tstzrange(scheduled_start, scheduled_end) with &&
  ) where (status in ('confirmed', 'in_progress'));

create index bookings_start_idx on bookings (scheduled_start);
create index bookings_status_idx on bookings (status);

create table booking_addons (
  booking_id uuid not null references bookings(id) on delete cascade,
  addon_id uuid not null references addons(id),
  price_at_booking numeric(10, 2) not null,
  primary key (booking_id, addon_id)
);

-- ---------------------------------------------------------------------------
-- Availability blocks — blackouts (crew-wide) + gcal_sync (unioned busy set)
-- ---------------------------------------------------------------------------
create table availability_blocks (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  type availability_block_type not null default 'blackout',
  source_operator_id uuid references operators(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint block_end_after_start check (ends_at > starts_at)
);

create index availability_blocks_range_idx on availability_blocks (starts_at, ends_at);

-- ---------------------------------------------------------------------------
-- Instagram (Phase 2 tables, created now so schema is stable)
-- ---------------------------------------------------------------------------
create table ig_threads (
  id uuid primary key default gen_random_uuid(),
  ig_thread_id text unique,
  ig_user_id text,
  handle text,
  last_message_at timestamptz,
  customer_id uuid references customers(id),
  status ig_thread_status not null default 'new'
);

create table ig_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references ig_threads(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  body text,
  sent_at timestamptz,
  ig_message_id text
);

-- ---------------------------------------------------------------------------
-- Audit log — AD-5a: accountability for shared ownership
-- ---------------------------------------------------------------------------
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references operators(id),
  entity text not null,
  entity_id uuid,
  action text not null,
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);

-- keep updated_at fresh on bookings
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger bookings_touch before update on bookings
  for each row execute function touch_updated_at();
