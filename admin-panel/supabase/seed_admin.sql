-- ============================================================================
-- seed_admin.sql — promote yourself to super_admin (run once, in SQL Editor)
-- ============================================================================
-- Prereq: the person below already has a Supabase Auth account on this project.
-- Create one first if needed:
--   Dashboard → Authentication → Users → Add user  (set a password, mark
--   "Auto Confirm User"). Use the SAME email you'll sign into the panel with.
--
-- Then edit the email on the next line and run this whole file.
-- ----------------------------------------------------------------------------

insert into public.admin_users (id, email, full_name, role, status)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', 'Super Admin'), 'super_admin', 'active'
from auth.users u
where u.email = 'you@campusedux.app'          -- <<< CHANGE THIS
on conflict (id) do update
  set role = 'super_admin', status = 'active';

-- Verify:
select id, email, role, status from public.admin_users;
