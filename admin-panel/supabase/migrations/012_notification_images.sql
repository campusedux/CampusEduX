-- ============================================================================
-- 012_notification_images.sql — image support for push notifications + a
--   shared `admin-media` storage bucket for the reusable <ImageUploader />.
-- ============================================================================
-- Apply after 001–011 (SQL Editor). Additive + guarded + re-runnable.
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- --- shared admin-media bucket ----------------------------------------------
--   Used by the admin panel's ImageUploader for contexts without a dedicated
--   bucket: prep-note thumbnails, testimonial avatars, notification images.
--   Public read (these images are shown in the app); writes are admin-only.
insert into storage.buckets (id, name, public)
values ('admin-media', 'admin-media', true)
on conflict (id) do nothing;

drop policy if exists "admin_media_public_read" on storage.objects;
create policy "admin_media_public_read" on storage.objects
  for select using (bucket_id = 'admin-media');

drop policy if exists "admin_media_admin_write" on storage.objects;
create policy "admin_media_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'admin-media' and public.is_admin(auth.uid()))
  with check (bucket_id = 'admin-media' and public.is_admin(auth.uid()));

-- --- push_notifications: image + failure tracking -------------------------
alter table public.push_notifications add column if not exists image_url     text;
alter table public.push_notifications add column if not exists error_message text;

do $$ begin
  if exists (select 1 from pg_constraint where conname = 'push_notifications_status_check') then
    alter table public.push_notifications drop constraint push_notifications_status_check;
  end if;
  alter table public.push_notifications
    add constraint push_notifications_status_check
    check (status in ('draft', 'sent', 'scheduled', 'failed'));
end $$;

-- --- notifications (student inbox): image_url so the app can render it -----
do $$ begin
  if to_regclass('public.notifications') is not null then
    alter table public.notifications add column if not exists image_url text;
  end if;
end $$;

-- --- send_bulk_notification: accept + fan out an optional image ----------
-- Drop the old 4-arg signature so PostgREST resolves calls unambiguously.
drop function if exists public.send_bulk_notification(text, text, text, text);

create or replace function public.send_bulk_notification(
  p_title     text,
  p_body      text,
  p_category  text default 'updates',
  p_audience  text default 'all',
  p_image_url text default null
)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
  v_cat   text := coalesce(nullif(p_category, ''), 'updates');
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'send_bulk_notification: caller is not an active admin';
  end if;
  if v_cat not in ('offers', 'updates', 'messages') then v_cat := 'updates'; end if;

  insert into public.notifications (user_id, title, body, category, image_url)
  select p.id, p_title, coalesce(p_body, ''), v_cat, nullif(p_image_url, '')
  from public.profiles p
  where case p_audience
          when 'premium' then p.is_premium = true
          when 'free'    then p.is_premium = false
          else true
        end;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.send_bulk_notification(text, text, text, text, text) from public;
grant execute on function public.send_bulk_notification(text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
