-- ============================================================================
-- 005_placement_admin.sql — live tests, question difficulty, mock-test fields,
--                           generated-reports registry
-- ============================================================================
-- Apply after 001–004 (SQL Editor). Additive + guarded + re-runnable.
-- ----------------------------------------------------------------------------

-- --- live_tests (Module 6 "Live Tests") -----------------------------------
create table if not exists public.live_tests (
  id               text        primary key,
  title            text        not null,
  practice_test_id text        references public.practice_tests (id) on delete set null,
  category         text        not null default 'aptitude'
                     check (category in ('aptitude', 'logical', 'verbal', 'hr', 'company', 'dsa')),
  scheduled_start  timestamptz,
  scheduled_end    timestamptz,
  duration_minutes integer     not null default 60,
  total_marks      integer     not null default 0,
  status           text        not null default 'upcoming'
                     check (status in ('upcoming', 'ongoing', 'completed', 'cancelled')),
  instructions     text        not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists live_tests_set_updated_at on public.live_tests;
create trigger live_tests_set_updated_at
  before update on public.live_tests
  for each row execute function public.set_updated_at();

alter table public.live_tests enable row level security;

drop policy if exists "live_tests_select_public" on public.live_tests;
create policy "live_tests_select_public" on public.live_tests for select using (true);

drop policy if exists "live_tests_admin_all" on public.live_tests;
create policy "live_tests_admin_all" on public.live_tests
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- --- question difficulty + mock-test admin fields -----------------------
do $$ begin
  if to_regclass('public.test_questions') is not null then
    alter table public.test_questions add column if not exists difficulty text not null default 'Medium';
    if not exists (select 1 from pg_constraint where conname = 'test_questions_difficulty_check') then
      alter table public.test_questions add constraint test_questions_difficulty_check
        check (difficulty in ('Easy', 'Medium', 'Hard'));
    end if;
  end if;

  if to_regclass('public.practice_tests') is not null then
    alter table public.practice_tests add column if not exists total_marks   integer not null default 0;
    alter table public.practice_tests add column if not exists pass_marks    integer not null default 0;
    alter table public.practice_tests add column if not exists is_published  boolean not null default true;
    alter table public.practice_tests add column if not exists difficulty    text    not null default 'Medium';
  end if;

  if to_regclass('public.hr_questions') is not null then
    alter table public.hr_questions add column if not exists difficulty text not null default 'Medium';
  end if;
end $$;

-- --- generated_reports (Module 6 Reports + Module 13) ------------------
-- A registry of report generations. The CSV itself is regenerated on demand
-- from `params` (no service key / storage needed).
create table if not exists public.generated_reports (
  id              uuid        primary key default gen_random_uuid(),
  kind            text        not null,
  module          text        not null default 'reports',
  params          jsonb       not null default '{}'::jsonb,
  format          text        not null default 'csv',
  row_count       integer     not null default 0,
  status          text        not null default 'ready' check (status in ('ready', 'failed', 'pending')),
  created_by      uuid        references auth.users (id) on delete set null,
  created_by_email text       not null default '',
  created_at      timestamptz not null default now()
);

create index if not exists generated_reports_module_idx on public.generated_reports (module, created_at desc);

alter table public.generated_reports enable row level security;

drop policy if exists "generated_reports_select_admin" on public.generated_reports;
create policy "generated_reports_select_admin" on public.generated_reports
  for select using (public.is_admin(auth.uid()));

drop policy if exists "generated_reports_insert_admin" on public.generated_reports;
create policy "generated_reports_insert_admin" on public.generated_reports
  for insert with check (public.is_admin(auth.uid()) and created_by = auth.uid());

drop policy if exists "generated_reports_delete_admin" on public.generated_reports;
create policy "generated_reports_delete_admin" on public.generated_reports
  for delete using (public.is_admin(auth.uid()));

notify pgrst, 'reload schema';
