-- Updates the Interior Detail description on an already-seeded database.
-- 0003_seed.sql was already edited to match, but that only affects a fresh
-- install — this fixes existing rows (safe to run more than once).

update services
set description = 'Full vacuum, leather/plastic wipe-down, window cleaning, deodorize.'
where id = '22222222-2222-2222-2222-222222222222';
