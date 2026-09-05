-- ============================================================================
-- 035_resume_shares_admin.sql — admin visibility onto resume_shares + reports
-- ============================================================================
-- Phase 9 of the Advanced Resume & Career Profile System engagement. Apply
-- after 001–034 AND after mobile migration 0060_resume_shares.sql (which
-- creates resume_shares and get_shared_resume() that this file builds on).
-- ----------------------------------------------------------------------------

-- Admins can see/manage every user's shares (e.g. to revoke one), on top of
-- the owner-only policies 0060 already created — mirrors how 006 extended
-- resume_templates/resumes_builder with admin-side access.
do $$ begin
  if to_regclass('public.resume_shares') is not null then
    drop policy if exists "resume_shares_admin_all" on public.resume_shares;
    create policy "resume_shares_admin_all" on public.resume_shares
      for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
  end if;
end $$;

create table if not exists public.resume_share_reports (
  id            uuid        primary key default gen_random_uuid(),
  share_id      uuid        not null references public.resume_shares (id) on delete cascade,
  reason        text        not null,
  status        text        not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

create index if not exists resume_share_reports_status_idx on public.resume_share_reports (status, created_at desc);

-- Deliberately NO anon/authenticated policy at all — the table is
-- unreadable and uninsertable by anyone except an admin, or through the
-- narrow report_shared_resume() function below (SECURITY DEFINER).
alter table public.resume_share_reports enable row level security;

drop policy if exists "resume_share_reports_admin_all" on public.resume_share_reports;
create policy "resume_share_reports_admin_all" on public.resume_share_reports
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- The only way an anonymous visitor can create a report row — validates the
-- token maps to an active share first, so a report can't be attached to an
-- arbitrary/forged share_id. No service-role key needed on the website for
-- this at all; the website calls this RPC directly with the anon key.
create or replace function public.report_shared_resume(p_token text, p_reason text)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
declare
  share_row public.resume_shares%rowtype;
begin
  select * into share_row from public.resume_shares where token = p_token and is_active;
  if not found then
    return false;
  end if;

  -- Best-effort throttle: an anon caller can retry this freely (no session,
  -- no per-IP tracking available inside a plain SQL function), so silently
  -- no-op a repeat report on the same share within an hour instead of
  -- letting a refresh loop flood the moderation queue with duplicates.
  if exists (
    select 1 from public.resume_share_reports
    where share_id = share_row.id and created_at > now() - interval '1 hour'
  ) then
    return true;
  end if;
  insert into public.resume_share_reports (share_id, reason) values (share_row.id, left(coalesce(p_reason, ''), 500));
  return true;
end;
$$;

revoke all on function public.report_shared_resume(text, text) from public;
grant execute on function public.report_shared_resume(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
