-- Removes "deodorize" from the Interior Detail description. The full checklist
-- lives in src/lib/translations.ts (SERVICE_DETAILS), shown in an expander.
-- 0003_seed.sql was edited to match for fresh installs; this fixes existing
-- rows (safe to run more than once).

update services
set description = 'Full vacuum, leather/plastic wipe-down, window cleaning.'
where id = '22222222-2222-2222-2222-222222222222';
