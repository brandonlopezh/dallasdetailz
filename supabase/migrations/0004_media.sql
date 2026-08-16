-- Site media — operator-managed images shown on the public site.
-- Files live in the Supabase Storage bucket `site-media`; this table records
-- which image fills which slot, ordering, and alt text.

create type media_slot as enum ('hero', 'gallery', 'before_after');

create table site_media (
  id uuid primary key default gen_random_uuid(),
  slot media_slot not null,
  role text check (role in ('before', 'after')), -- only for before_after pairs
  group_index smallint not null default 0,        -- pairs a before with an after
  storage_path text not null,                     -- path within the bucket
  alt text,
  caption text,
  sort_order smallint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index site_media_slot_idx on site_media (slot, sort_order);

alter table site_media enable row level security;

-- Public site reads active media (also served via the public bucket URL).
create policy "public reads active media"
  on site_media for select using (active = true);

-- Writes go through the server (service role), which bypasses RLS. Operators
-- can also read everything (incl. inactive) when signed in.
create policy "operators read all media"
  on site_media for select
  using (exists (select 1 from operators o where o.auth_user_id = auth.uid() and o.active));

-- ---------------------------------------------------------------------------
-- Storage bucket (public read). Uploads are performed with the service role.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- Public read of objects in the bucket (belt-and-suspenders; public buckets
-- are already readable by URL).
create policy "public read site-media objects"
  on storage.objects for select
  using (bucket_id = 'site-media');
