-- Phase 10 (final phase) of the Advanced Resume & Career Profile System
-- engagement. Version snapshots — immutable from any client's perspective
-- (no update/delete RLS policy at all); pruning to the most recent 20 per
-- resume happens via a SECURITY DEFINER trigger, not a client-facing DELETE
-- capability nobody should have.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create table if not exists public.resume_versions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  resume_id  uuid        not null references public.resumes_builder (id) on delete cascade,
  label      text        not null default '',
  snapshot   jsonb        not null,
  created_at timestamptz not null default now()
);

create index if not exists resume_versions_resume_id_idx on public.resume_versions (resume_id, created_at desc);

alter table public.resume_versions enable row level security;

-- select/insert only — no update, no delete policy for any client role.
drop policy if exists "resume_versions_select_own" on public.resume_versions;
create policy "resume_versions_select_own"
  on public.resume_versions for select
  using (auth.uid() = user_id);

drop policy if exists "resume_versions_insert_own" on public.resume_versions;
create policy "resume_versions_insert_own"
  on public.resume_versions for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Pruning: after each insert, keep only the 20 most recent versions for that
-- resume. SECURITY DEFINER because there is deliberately no client-facing
-- DELETE policy above — this is the only thing allowed to remove a version
-- row, and it only ever touches rows for the resume_id just inserted into.
-- ---------------------------------------------------------------------------
create or replace function public.prune_resume_versions()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  delete from public.resume_versions
  where resume_id = new.resume_id
    and id not in (
      select id from public.resume_versions
      where resume_id = new.resume_id
      order by created_at desc
      limit 20
    );
  return new;
end;
$$;

drop trigger if exists resume_versions_prune on public.resume_versions;
create trigger resume_versions_prune
  after insert on public.resume_versions
  for each row execute function public.prune_resume_versions();

-- ---------------------------------------------------------------------------
-- Restore: SECURITY INVOKER (the default) — this is deliberately just a
-- convenience wrapper around ordinary owner-scoped reads/writes, so it
-- inherits the caller's own RLS on both resume_versions and resumes_builder
-- rather than needing any elevated privilege. Snapshots the pre-restore
-- state first (labeled "Before restore"), so restoring is itself undoable.
-- ---------------------------------------------------------------------------
create or replace function public.restore_resume_version(p_version_id uuid)
returns void
language plpgsql
as $$
declare
  version_row public.resume_versions%rowtype;
  current_row public.resumes_builder%rowtype;
begin
  select * into version_row from public.resume_versions where id = p_version_id;
  if not found then
    raise exception 'version % not found or not accessible', p_version_id;
  end if;

  select * into current_row from public.resumes_builder where id = version_row.resume_id;
  if not found then
    raise exception 'resume % not found or not accessible', version_row.resume_id;
  end if;

  insert into public.resume_versions (user_id, resume_id, label, snapshot)
  values (
    current_row.user_id, current_row.id, 'Before restore',
    jsonb_build_object(
      'title', current_row.title,
      'template', current_row.template,
      'personal_details', current_row.personal_details,
      'education', current_row.education,
      'skills', current_row.skills,
      'sections', current_row.sections,
      'layout', current_row.layout
    )
  );

  update public.resumes_builder set
    title            = coalesce(version_row.snapshot->>'title', title),
    template         = coalesce(version_row.snapshot->>'template', template),
    personal_details = coalesce(version_row.snapshot->'personal_details', personal_details),
    education        = coalesce(version_row.snapshot->'education', education),
    skills           = coalesce(version_row.snapshot->'skills', skills),
    sections         = coalesce(version_row.snapshot->'sections', sections),
    layout           = coalesce(version_row.snapshot->'layout', layout),
    updated_at       = now()
  where id = version_row.resume_id;
end;
$$;

revoke all on function public.restore_resume_version(uuid) from public;
grant execute on function public.restore_resume_version(uuid) to authenticated;

notify pgrst, 'reload schema';
