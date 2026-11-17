-- Private admin settings (key → JSON value). First use: "notify_emails", the
-- list of addresses that get an email for every new booking request, edited
-- in /admin/website → Request emails.
-- RLS is on with no policies: only the server (service role) can read/write.
-- (site_content is publicly readable, so these addresses must not live there.)
create table if not exists admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table admin_settings enable row level security;
