-- First/last name for every admin account, including the ADMIN_EMAILS owners
-- (who have no row in admin_users). Used for the "Hi {first name}" greeting.
-- RLS is on with no policies: only the server (service role) can read/write.
create table if not exists admin_profiles (
  email text primary key check (email = lower(email)),
  first_name text not null default '',
  last_name text not null default '',
  updated_at timestamptz not null default now()
);

alter table admin_profiles enable row level security;
