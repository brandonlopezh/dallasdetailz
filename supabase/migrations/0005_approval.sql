-- Operator approve/decline flow. The customer-facing "manage your booking"
-- link (bookings.manage_token, from 0001_init.sql) is a different secret
-- for a different audience — don't reuse it here, or a customer holding
-- their own manage_token could also approve/decline other people's jobs
-- once a self-serve manage page exists.

alter table bookings
  add column approval_token uuid not null default gen_random_uuid();

create unique index bookings_approval_token_idx on bookings (approval_token);
