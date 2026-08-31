-- ============================================================================
-- 004_jobs_admin.sql — job featuring + status, application decision fields
-- ============================================================================
-- Apply after 001–003 (SQL Editor). Additive + guarded + re-runnable. The
-- mobile app is unaffected (new columns default to today's behaviour).
-- ----------------------------------------------------------------------------

do $$ begin
  if to_regclass('public.jobs') is not null then
    alter table public.jobs add column if not exists is_featured       boolean not null default false;
    alter table public.jobs add column if not exists featured_priority integer not null default 0;
    alter table public.jobs add column if not exists status            text    not null default 'open';

    if not exists (select 1 from pg_constraint where conname = 'jobs_status_check') then
      alter table public.jobs add constraint jobs_status_check check (status in ('open', 'closed', 'draft'));
    end if;

    create index if not exists jobs_is_featured_idx
      on public.jobs (is_featured, featured_priority) where is_featured;
    create index if not exists jobs_status_idx on public.jobs (status);
  end if;
end $$;

-- Application review outcome — the "Rejected Candidates (with reason)" screen
-- and the Resume Viewer's shortlist/reject buttons write these.
do $$ begin
  if to_regclass('public.applications') is not null then
    alter table public.applications add column if not exists rejection_reason text;
    alter table public.applications add column if not exists decided_by       uuid references auth.users (id) on delete set null;
    alter table public.applications add column if not exists decided_at       timestamptz;
    alter table public.applications add column if not exists admin_notes      text;
  end if;
end $$;

notify pgrst, 'reload schema';
