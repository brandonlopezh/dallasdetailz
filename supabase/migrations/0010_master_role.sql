-- Allow "master" as a stored role, so the owner can promote someone from the
-- Users page instead of editing ADMIN_EMAILS. (ADMIN_EMAILS accounts stay
-- masters regardless and can't be removed from the UI.)
alter table admin_users drop constraint if exists admin_users_role_check;
alter table admin_users
  add constraint admin_users_role_check check (role in ('master', 'manager', 'editor'));
