-- 0032_notification_images.sql
--
-- Adds `image_url` to the student notification inbox so an admin-composed push
-- (admin-panel → Banner & CMS → Push Notifications) can carry an image that the
-- app renders in the notification list.
--
-- Mirrors admin-panel migration 012_notification_images.sql, which also updates
-- the `send_bulk_notification` fan-out RPC to write this column. Idempotent —
-- safe to run alongside 012.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

alter table public.notifications add column if not exists image_url text;

notify pgrst, 'reload schema';
