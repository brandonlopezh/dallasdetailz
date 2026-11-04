-- Tracks "I offered the customer a different time and I'm waiting to hear
-- back". A request with offered_at set is "waiting on client"; one without is
-- "waiting on me". Only meaningful while status = 'requested'.
alter table bookings add column if not exists offered_at timestamptz;
