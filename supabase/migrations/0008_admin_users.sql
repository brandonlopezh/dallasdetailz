-- Admin users beyond the master accounts in the ADMIN_EMAILS env var.
--   manager: everything in the admin except managing users
--   editor:  Website Edits only (copy, prices, images, page sections)
-- Master accounts (ADMIN_EMAILS) are never stored here and can't be removed.
-- RLS is on with no policies: only the server (service role) can read/write.

create table if not exists admin_users (
  email text primary key check (email = lower(email)),
  role text not null check (role in ('manager', 'editor')),
  added_by text,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;
