-- P0-02: prepare rights review without changing any existing publication state.
-- Apply to staging only after the live inventory and seed compatibility checks.
-- The gate is OFF by default; turn it on only after staging exercises all writers.
create table if not exists public.educational_content_provenance (
  resource_type text not null check (resource_type in
    ('learning_contents', 'interview_questions', 'practice_tests', 'test_questions', 'dsa_problems')),
  resource_id text not null,
  creator text,
  creation_method text,
  source_dependencies text,
  rights_basis text,
  license_evidence_ref text,
  rights_status text not null default 'unverified' check (rights_status in
    ('unverified', 'review_required', 'verified_original', 'verified_licensed', 'blocked')),
  quality_status text not null default 'unreviewed' check (quality_status in
    ('unreviewed', 'review_required', 'reviewed')),
  quality_review_date timestamptz,
  quality_reviewer_id uuid references auth.users(id) on delete set null,
  review_date timestamptz,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_content_hash text,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (resource_type, resource_id),
  constraint provenance_verified_evidence check (
    rights_status not in ('verified_original', 'verified_licensed') or
    (nullif(btrim(creator), '') is not null and
     nullif(btrim(creation_method), '') is not null and
     nullif(btrim(rights_basis), '') is not null and
     nullif(btrim(license_evidence_ref), '') is not null and
     review_date is not null and reviewer_id is not null))
);

create table if not exists public.educational_content_provenance_settings (
  singleton boolean primary key default true check (singleton),
  enforcement_enabled boolean not null default false,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null
);
insert into public.educational_content_provenance_settings (singleton, enforcement_enabled)
values (true, false) on conflict (singleton) do nothing;

create or replace function public.content_rights_reviewer()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where a.id = auth.uid() and a.status = 'active' and a.role = 'super_admin'
  );
$$;
revoke all on function public.content_rights_reviewer() from public;
grant execute on function public.content_rights_reviewer() to authenticated;

create or replace function public.educational_content_hash(p_type text, p_id text)
returns text language plpgsql stable security definer set search_path = public
as $$
declare v_content jsonb;
begin
  case p_type
    when 'learning_contents' then
      select jsonb_build_array(body, heading, file_url, video_url, metadata) into v_content
        from public.learning_contents where id::text = p_id;
    when 'interview_questions' then
      select jsonb_build_array(question, answer, example, important_point) into v_content
        from public.interview_questions where id = p_id;
    when 'practice_tests' then
      select jsonb_build_array(title, description, instructions) into v_content
        from public.practice_tests where id = p_id;
    when 'test_questions' then
      select jsonb_build_array(question_text, options, correct_index, explanation) into v_content
        from public.test_questions where id = p_id;
    when 'dsa_problems' then
      select jsonb_build_array(description, examples, solution_approach, solution_code) into v_content
        from public.dsa_problems where id = p_id;
  end case;
  if v_content is null then raise exception 'P0-02: content item %.% does not exist', p_type, p_id; end if;
  return encode(digest(v_content::text, 'sha256'), 'hex');
end;
$$;
revoke all on function public.educational_content_hash(text, text) from public, anon, authenticated;

create or replace function public.guard_content_provenance_review()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.rights_status in ('verified_original', 'verified_licensed') then
    if not public.content_rights_reviewer() then
      raise exception 'Only an active super admin may verify content rights';
    end if;
    new.reviewer_id := auth.uid();
    new.review_date := now();
    new.reviewed_content_hash := public.educational_content_hash(new.resource_type, new.resource_id);
  elsif tg_op = 'UPDATE' and old.rights_status in ('verified_original', 'verified_licensed')
      and not public.content_rights_reviewer() then
    raise exception 'Only an active super admin may change a rights decision';
  end if;
  if new.rights_status not in ('verified_original', 'verified_licensed') then
    new.reviewed_content_hash := null;
    new.reviewer_id := null;
    new.review_date := null;
  end if;
  if tg_op = 'UPDATE' and (old.rights_status is distinct from new.rights_status or
      old.rights_basis is distinct from new.rights_basis or
      old.license_evidence_ref is distinct from new.license_evidence_ref or
      old.source_dependencies is distinct from new.source_dependencies) then
    new.quality_status := 'review_required';
  end if;
  if new.quality_status = 'reviewed' then
    new.quality_reviewer_id := auth.uid();
    new.quality_review_date := now();
  else
    new.quality_reviewer_id := null;
    new.quality_review_date := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists educational_content_review_guard on public.educational_content_provenance;
create trigger educational_content_review_guard before insert or update
on public.educational_content_provenance for each row
execute function public.guard_content_provenance_review();

alter table public.educational_content_provenance enable row level security;
alter table public.educational_content_provenance_settings enable row level security;
revoke all on public.educational_content_provenance from anon, authenticated;
revoke all on public.educational_content_provenance_settings from anon, authenticated;
grant select, insert, update on public.educational_content_provenance to authenticated;
grant select, update on public.educational_content_provenance_settings to authenticated;
drop policy if exists provenance_admin_read on public.educational_content_provenance;
create policy provenance_admin_read on public.educational_content_provenance for select to authenticated
  using (public.is_admin(auth.uid()));
drop policy if exists provenance_reviewer_insert on public.educational_content_provenance;
create policy provenance_reviewer_insert on public.educational_content_provenance for insert to authenticated
  with check (public.content_rights_reviewer());
drop policy if exists provenance_reviewer_update on public.educational_content_provenance;
create policy provenance_reviewer_update on public.educational_content_provenance for update to authenticated
  using (public.content_rights_reviewer()) with check (public.content_rights_reviewer());
drop policy if exists provenance_settings_reviewer_read on public.educational_content_provenance_settings;
create policy provenance_settings_reviewer_read on public.educational_content_provenance_settings
  for select to authenticated using (public.content_rights_reviewer());
drop policy if exists provenance_settings_reviewer_update on public.educational_content_provenance_settings;
create policy provenance_settings_reviewer_update on public.educational_content_provenance_settings
  for update to authenticated using (public.content_rights_reviewer())
  with check (public.content_rights_reviewer());
create or replace function public.stamp_provenance_settings()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.changed_at := now(); new.changed_by := auth.uid(); return new; end;
$$;
drop trigger if exists provenance_settings_stamp on public.educational_content_provenance_settings;
create trigger provenance_settings_stamp before update on public.educational_content_provenance_settings
for each row execute function public.stamp_provenance_settings();

-- Absence of a row means unverified. The gate targets only new publication,
-- publication reactivation, or a material change to an already published row.
-- Existing published rows are neither updated nor hidden by this migration.
create or replace function public.require_content_rights_on_publish()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_enabled boolean;
  v_status text;
  v_hash text;
  v_new_hash text;
  v_changed boolean;
begin
  select enforcement_enabled into v_enabled
    from public.educational_content_provenance_settings where singleton = true;
  if not coalesce(v_enabled, false) then return new; end if;
  if new.status <> 'published' then return new; end if;
  v_changed := tg_op = 'INSERT';
  if tg_op = 'UPDATE' then
    v_changed := old.status is distinct from new.status;
    if tg_table_name = 'learning_contents' then
      v_changed := v_changed or
        (old.body, old.heading, old.file_url, old.video_url, old.metadata)
        is distinct from
        (new.body, new.heading, new.file_url, new.video_url, new.metadata);
    elsif tg_table_name = 'interview_questions' then
      v_changed := v_changed or
        (old.question, old.answer, old.example, old.important_point)
        is distinct from
        (new.question, new.answer, new.example, new.important_point);
    elsif tg_table_name = 'dsa_problems' then
      v_changed := v_changed or
        (old.description, old.examples, old.solution_approach, old.solution_code)
        is distinct from
        (new.description, new.examples, new.solution_approach, new.solution_code);
    elsif tg_table_name = 'practice_tests' then
      v_changed := v_changed or
        (old.title, old.description, old.instructions)
        is distinct from
        (new.title, new.description, new.instructions);
    end if;
  end if;
  if not v_changed then return new; end if;
  select rights_status, reviewed_content_hash into v_status, v_hash from public.educational_content_provenance
    where resource_type = tg_table_name and resource_id = new.id::text;
  if v_status not in ('verified_original', 'verified_licensed') or v_status is null then
    raise exception 'P0-02: verified rights required before publishing %.%', tg_table_name, new.id;
  end if;
  -- A previous approval cannot authorize changed text, code, or attachments.
  if tg_table_name = 'learning_contents' then
    v_new_hash := encode(digest(jsonb_build_array(new.body, new.heading, new.file_url, new.video_url, new.metadata)::text, 'sha256'), 'hex');
  elsif tg_table_name = 'interview_questions' then
    v_new_hash := encode(digest(jsonb_build_array(new.question, new.answer, new.example, new.important_point)::text, 'sha256'), 'hex');
  elsif tg_table_name = 'dsa_problems' then
    v_new_hash := encode(digest(jsonb_build_array(new.description, new.examples, new.solution_approach, new.solution_code)::text, 'sha256'), 'hex');
  elsif tg_table_name = 'practice_tests' then
    v_new_hash := encode(digest(jsonb_build_array(new.title, new.description, new.instructions)::text, 'sha256'), 'hex');
  end if;
  if v_hash is distinct from v_new_hash then
    raise exception 'P0-02: content changed since rights review';
  end if;
  if tg_table_name = 'practice_tests' and exists (
    select 1 from public.test_questions q
    left join public.educational_content_provenance p
      on p.resource_type = 'test_questions' and p.resource_id = q.id
    where q.test_id = new.id::text and (
      coalesce(p.rights_status, 'unverified') not in ('verified_original', 'verified_licensed')
      or p.reviewed_content_hash is distinct from encode(digest(jsonb_build_array(
        q.question_text, q.options, q.correct_index, q.explanation)::text, 'sha256'), 'hex'))
  ) then
    raise exception 'P0-02: every question requires verified rights before test publication';
  end if;
  return new;
end;
$$;

do $$ declare v_table text; begin
  foreach v_table in array array['learning_contents','interview_questions','practice_tests','dsa_problems'] loop
    execute format('drop trigger if exists require_content_rights_on_publish on public.%I', v_table);
    execute format('create trigger require_content_rights_on_publish before insert or update on public.%I for each row execute function public.require_content_rights_on_publish()', v_table);
  end loop;
end $$;

create or replace function public.require_question_rights_on_publish()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_enabled boolean; v_status text; v_hash text; v_parent_status text;
begin
  select enforcement_enabled into v_enabled from public.educational_content_provenance_settings where singleton = true;
  if not coalesce(v_enabled, false) then return new; end if;
  select status into v_parent_status from public.practice_tests where id = new.test_id;
  if v_parent_status <> 'published' then return new; end if;
  if tg_op = 'UPDATE' and old.test_id is not distinct from new.test_id and
    (old.question_text, old.options, old.correct_index, old.explanation)
    is not distinct from (new.question_text, new.options, new.correct_index, new.explanation)
    then return new; end if;
  select rights_status, reviewed_content_hash into v_status, v_hash from public.educational_content_provenance
    where resource_type = 'test_questions' and resource_id = new.id;
  if v_status not in ('verified_original', 'verified_licensed') or v_status is null then
    raise exception 'P0-02: verified rights required for a published test question';
  end if;
  if v_hash is distinct from encode(digest(jsonb_build_array(
    new.question_text, new.options, new.correct_index, new.explanation)::text, 'sha256'), 'hex') then
    raise exception 'P0-02: test question changed since rights review';
  end if;
  return new;
end;
$$;
drop trigger if exists require_question_rights_on_publish on public.test_questions;
create trigger require_question_rights_on_publish before insert or update
on public.test_questions for each row execute function public.require_question_rights_on_publish();
