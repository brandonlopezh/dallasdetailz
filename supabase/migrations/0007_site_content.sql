-- Site content overrides — homepage copy and contact info editable from
-- /admin/content. Each row overrides one default from src/lib/translations.ts
-- (key like "en.hero.title", "es.faq.items", "contact.phone"). No row = the
-- code default is used, so deleting a row "resets to default".

create table site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

-- Public site reads it; writes go through the server (service role).
create policy "public reads site content"
  on site_content for select using (true);
