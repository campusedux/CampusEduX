-- ============================================================================
-- 008_cms_reviews_admin.sql — banners, announcements, FAQs, CMS pages,
--   testimonials, push-notification history, review moderation
-- ============================================================================
-- Apply after 001–007 (SQL Editor). Additive + guarded + re-runnable.
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- --- banners (Module 10 — one row per placement) -----------------------
create table if not exists public.banners (
  id              uuid        primary key default gen_random_uuid(),
  placement       text        not null
                    check (placement in ('home', 'offer', 'referral', 'placement', 'jobs', 'popup')),
  title           text        not null,
  subtitle        text        not null default '',
  image_url       text,
  target_url      text,
  target_audience text        not null default 'all',
  display_on      text[]      not null default '{}',
  status          text        not null default 'active' check (status in ('active', 'inactive', 'scheduled')),
  priority        integer     not null default 0,
  starts_at       timestamptz,
  ends_at         timestamptz,
  created_by      uuid        references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists banners_placement_idx on public.banners (placement, priority);
drop trigger if exists banners_set_updated_at on public.banners;
create trigger banners_set_updated_at before update on public.banners
  for each row execute function public.set_updated_at();

alter table public.banners enable row level security;
drop policy if exists "banners_select_public" on public.banners;
create policy "banners_select_public" on public.banners for select using (true);
drop policy if exists "banners_admin_all" on public.banners;
create policy "banners_admin_all" on public.banners
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- announcements ------------------------------------------------------
create table if not exists public.announcements (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  body            text        not null default '',
  target_audience text        not null default 'all',
  status          text        not null default 'active' check (status in ('active', 'inactive', 'scheduled')),
  starts_at       timestamptz,
  ends_at         timestamptz,
  updated_by      uuid        references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;
drop policy if exists "announcements_select_public" on public.announcements;
create policy "announcements_select_public" on public.announcements for select using (true);
drop policy if exists "announcements_admin_all" on public.announcements;
create policy "announcements_admin_all" on public.announcements
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- faqs ------------------------------------------------------------
create table if not exists public.faqs (
  id         uuid        primary key default gen_random_uuid(),
  question   text        not null,
  answer     text        not null default '',
  category   text        not null default 'General',
  sort_order integer     not null default 0,
  status     text        not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists faqs_set_updated_at on public.faqs;
create trigger faqs_set_updated_at before update on public.faqs
  for each row execute function public.set_updated_at();

alter table public.faqs enable row level security;
drop policy if exists "faqs_select_public" on public.faqs;
create policy "faqs_select_public" on public.faqs for select using (true);
drop policy if exists "faqs_admin_all" on public.faqs;
create policy "faqs_admin_all" on public.faqs
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- cms_pages (Terms & Privacy) -----------------------------------
create table if not exists public.cms_pages (
  key        text        primary key check (key in ('terms', 'privacy', 'about', 'refund_policy')),
  title      text        not null,
  content    text        not null default '',
  updated_by uuid        references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.cms_pages (key, title) values
  ('terms', 'Terms & Conditions'),
  ('privacy', 'Privacy Policy')
on conflict (key) do nothing;
drop trigger if exists cms_pages_set_updated_at on public.cms_pages;
create trigger cms_pages_set_updated_at before update on public.cms_pages
  for each row execute function public.set_updated_at();

alter table public.cms_pages enable row level security;
drop policy if exists "cms_pages_select_public" on public.cms_pages;
create policy "cms_pages_select_public" on public.cms_pages for select using (true);
drop policy if exists "cms_pages_admin_all" on public.cms_pages;
create policy "cms_pages_admin_all" on public.cms_pages
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- testimonials (Module 11) ------------------------------------
create table if not exists public.testimonials (
  id          uuid        primary key default gen_random_uuid(),
  author_name text        not null,
  author_role text        not null default '',
  avatar_url  text,
  rating      integer     not null default 5 check (rating between 1 and 5),
  quote       text        not null,
  display_on  text[]      not null default '{}',
  status      text        not null default 'active' check (status in ('active', 'inactive', 'pending')),
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists testimonials_set_updated_at on public.testimonials;
create trigger testimonials_set_updated_at before update on public.testimonials
  for each row execute function public.set_updated_at();

alter table public.testimonials enable row level security;
drop policy if exists "testimonials_select_public" on public.testimonials;
create policy "testimonials_select_public" on public.testimonials for select using (true);
drop policy if exists "testimonials_admin_all" on public.testimonials;
create policy "testimonials_admin_all" on public.testimonials
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- push_notifications (compose history) ----------------------
create table if not exists public.push_notifications (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  body            text        not null default '',
  category        text        not null default 'updates' check (category in ('offers', 'updates', 'messages')),
  target_audience text        not null default 'all',
  deep_link       text,
  recipient_count integer     not null default 0,
  status          text        not null default 'sent' check (status in ('draft', 'sent', 'scheduled')),
  sent_by         uuid        references auth.users (id) on delete set null,
  sent_by_email   text        not null default '',
  created_at      timestamptz not null default now()
);
create index if not exists push_notifications_created_idx on public.push_notifications (created_at desc);

alter table public.push_notifications enable row level security;
drop policy if exists "push_notifications_admin_select" on public.push_notifications;
create policy "push_notifications_admin_select" on public.push_notifications
  for select using (public.is_admin(auth.uid()));
drop policy if exists "push_notifications_admin_insert" on public.push_notifications;
create policy "push_notifications_admin_insert" on public.push_notifications
  for insert with check (public.is_admin(auth.uid()));

-- --- reviews: moderation status --------------------------------
do $$ begin
  if to_regclass('public.reviews') is not null then
    alter table public.reviews add column if not exists status      text not null default 'published';
    alter table public.reviews add column if not exists entity_type text not null default 'project';
    if not exists (select 1 from pg_constraint where conname = 'reviews_status_check') then
      alter table public.reviews add constraint reviews_status_check
        check (status in ('published', 'pending', 'reported', 'removed'));
    end if;
    create index if not exists reviews_status_idx on public.reviews (status, created_at desc);
  end if;
end $$;

-- --- review_reports -----------------------------------------
create table if not exists public.review_reports (
  id          uuid        primary key default gen_random_uuid(),
  review_id   uuid        not null references public.reviews (id) on delete cascade,
  reported_by uuid        references public.profiles (id) on delete set null,
  reason      text        not null default '',
  category    text        not null default 'other' check (category in ('spam', 'inappropriate', 'offensive', 'other')),
  status      text        not null default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  resolution  text        not null default '',
  resolved_by uuid        references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists review_reports_status_idx on public.review_reports (status, created_at desc);

alter table public.review_reports enable row level security;
drop policy if exists "review_reports_insert_own" on public.review_reports;
create policy "review_reports_insert_own" on public.review_reports
  for insert with check (auth.uid() = reported_by);
drop policy if exists "review_reports_admin_select" on public.review_reports;
create policy "review_reports_admin_select" on public.review_reports
  for select using (public.is_admin(auth.uid()));
drop policy if exists "review_reports_admin_update" on public.review_reports;
create policy "review_reports_admin_update" on public.review_reports
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- storage bucket for banner images -----------------------
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

drop policy if exists "banners_admin_write" on storage.objects;
create policy "banners_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'banners' and public.is_admin(auth.uid()))
  with check (bucket_id = 'banners' and public.is_admin(auth.uid()));

-- --- bulk push fan-out RPC -----------------------------------
create or replace function public.send_bulk_notification(
  p_title    text,
  p_body     text,
  p_category text default 'updates',
  p_audience text default 'all'
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

  insert into public.notifications (user_id, title, body, category)
  select p.id, p_title, coalesce(p_body, ''), v_cat
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
revoke all on function public.send_bulk_notification(text, text, text, text) from public;
grant execute on function public.send_bulk_notification(text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
