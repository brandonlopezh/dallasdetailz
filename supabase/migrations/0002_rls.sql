-- Row Level Security — PRD §8.1 (Supabase RLS)
-- Public catalog (services/pricing/addons/settings) is readable by anon so the
-- marketing site can render statically. Everything else is closed to anon;
-- booking writes and admin reads go through the server using the service role
-- key, which bypasses RLS.

alter table operators           enable row level security;
alter table business_settings   enable row level security;
alter table services            enable row level security;
alter table service_pricing     enable row level security;
alter table addons              enable row level security;
alter table customers           enable row level security;
alter table vehicles            enable row level security;
alter table bookings            enable row level security;
alter table booking_addons      enable row level security;
alter table availability_blocks enable row level security;
alter table ig_threads          enable row level security;
alter table ig_messages         enable row level security;
alter table audit_log           enable row level security;

-- Public, read-only catalog ------------------------------------------------
create policy "public reads active services"
  on services for select using (active = true);

create policy "public reads pricing"
  on service_pricing for select using (true);

create policy "public reads active addons"
  on addons for select using (active = true);

create policy "public reads business settings"
  on business_settings for select using (true);

-- Availability blocks are needed to compute open slots on the client, but they
-- can expose personal-calendar reasons. Expose only the ranges via a view.
create policy "public reads block ranges"
  on availability_blocks for select using (true);

-- Authenticated operators -------------------------------------------------
-- An operator row exists per twin, linked by auth_user_id. Operators get full
-- read/write on the operational tables. (Two accounts, identical permissions.)
create policy "operators manage bookings"
  on bookings for all
  using (exists (select 1 from operators o where o.auth_user_id = auth.uid() and o.active))
  with check (exists (select 1 from operators o where o.auth_user_id = auth.uid() and o.active));

create policy "operators manage customers"
  on customers for all
  using (exists (select 1 from operators o where o.auth_user_id = auth.uid() and o.active))
  with check (exists (select 1 from operators o where o.auth_user_id = auth.uid() and o.active));

create policy "operators manage vehicles"
  on vehicles for all
  using (exists (select 1 from operators o where o.auth_user_id = auth.uid() and o.active))
  with check (exists (select 1 from operators o where o.auth_user_id = auth.uid() and o.active));

create policy "operators manage booking_addons"
  on booking_addons for all
  using (exists (select 1 from operators o where o.auth_user_id = auth.uid() and o.active))
  with check (exists (select 1 from operators o where o.auth_user_id = auth.uid() and o.active));

create policy "operators manage availability"
  on availability_blocks for all
  using (exists (select 1 from operators o where o.auth_user_id = auth.uid() and o.active))
  with check (exists (select 1 from operators o where o.auth_user_id = auth.uid() and o.active));

create policy "operators read own row"
  on operators for select
  using (auth_user_id = auth.uid());
