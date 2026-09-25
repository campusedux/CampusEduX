-- mobile-app/supabase/migrations/0118_profiles_guard_and_blocked_enforcement.sql
-- CANONICAL PAIR - byte-identical to admin-panel/supabase/migrations/090_profiles_guard_and_blocked_enforcement.sql
-- (apply either; the other is an idempotent no-op).
--
-- ============================================================================
-- DB-03  profiles own-row UPDATE had no column pin (status / blocked_* / admin_notes /
--        email / referral_code writable by the row owner) -> guard trigger.
-- DB-04  `profiles.status = 'blocked'` was enforced nowhere -> is_active_user() ANDed into
--        every user-owned write policy, storage upload policy and user-callable write RPC.
-- DB-32  is_premium pin (M:0037) was BEFORE UPDATE only -> now BEFORE INSERT OR UPDATE.
-- DB-39  (partial) see OWNER DECISIONS below: mobile_number is NOT pinned.
-- ============================================================================
--
-- 1. GUARD TRIGGER  public.protect_profile_columns()  (BEFORE INSERT OR UPDATE on profiles)
--    For callers that are NOT service_role / supabase_admin / postgres and do NOT hold
--    `students:edit` (has_permission), silently (same convention as M:0037) restores:
--      UPDATE: status, blocked_reason, blocked_at, blocked_by, admin_notes, referral_code := OLD;
--              email := OLD unless the new value equals the row's auth.users email
--      INSERT: status='active', blocked_* / admin_notes = NULL, email := auth.users email.
--    (referral_code is accepted on INSERT: it is the code the user signed up WITH and drives the
--     AFTER INSERT link_referral_on_signup trigger.)
--    mobile_number is left writable: EditProfileScreen -> profileService.updateProfile() writes it
--    through a plain profiles UPDATE and there is no verified (OTP) change path yet. See owner decisions.
--
-- 2. STATUS VOCABULARY: profiles.status in ('active','blocked') (A:002 check). admin_users.status is
--    ('active','suspended') and is a different table. is_active_user() treats both 'blocked' and
--    'suspended' as inactive for forward compatibility.
--
-- 3. public.is_active_user(uid default auth.uid())  STABLE SECURITY DEFINER, search_path=public.
--    true iff a profile row exists and status not in ('blocked','suspended'). Self-only: for any other
--    uid it returns false unless the caller is service_role/postgres/supabase_admin (no status oracle).
--    Single PK lookup. Policies use `(select public.is_active_user())` so it is evaluated once per statement.
--
-- 4. POLICY REWRITE (DO block below, by name from pg_policies, idempotent: skips policies that already
--    mention is_active_user): every own-row INSERT / UPDATE / DELETE / ALL policy in schema public and the
--    user-upload storage policies (avatars, resumes, custom-project-uploads) gets
--    `AND (select public.is_active_user())`. ALL policies are split into
--    <name>_select / _insert / _update / _delete so a blocked user keeps READ access but loses writes.
--    profiles is special-cased below (blocked: SELECT own row yes, UPDATE no; INSERT-own kept without
--    the check because the app's first-login fallback inserts the profile row before it can be "active").
--    Admin policies (is_admin / has_permission / current_admin_role) are never touched here (see 0119).
--    DEFERRED (payment integration, left as-is): purchases, premium_subscriptions, refund_requests,
--    withdrawal_requests, wallet_*, referral* policies and RPCs request_withdrawal, admin_adjust_wallet,
--    admin_process_refund, admin_process_withdrawal + all edge functions (service role bypasses RLS: the
--    edge `getUser` helper should also check profiles.status / auth ban).
--
-- 5. RPC guards (guard line only; body otherwise verbatim from the live definition):
--    record_legal_consent, submit_test_attempt, submit_randomized_test_attempt.
--
-- OWNER DECISIONS (see report): (a) mobile_number stays user-editable (EditProfile). Squatting an
-- unregistered number (DB-39) needs an OTP-verified RPC first. (b) Auth-level ban on block is done by the
-- admin server action (service key); this migration is the DB-level half.
-- ----------------------------------------------------------------------------

do $$
begin
  if to_regprocedure('public.has_permission(uuid,text,text)') is null
     or to_regclass('public.profiles') is null then
    raise exception '0118 prerequisite missing: admin 001_admin_core (has_permission) and mobile 0001_profiles must be applied first';
  end if;
end $$;

-- ---- helpers ---------------------------------------------------------------
-- internal: is the caller a trusted DB role (service key / SQL editor / migration)? Uses the `role`
-- GUC (set by PostgREST per request; unchanged inside SECURITY DEFINER bodies).
create or replace function public._is_privileged_caller()
returns boolean language sql stable set search_path = public as $$
  select coalesce(nullif(current_setting('role', true), ''), 'none')
         in ('none', 'postgres', 'supabase_admin', 'service_role');
$$;
revoke all on function public._is_privileged_caller() from public, anon, authenticated;

create or replace function public.is_active_user(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select uid is not null
     and (uid is not distinct from auth.uid() or public._is_privileged_caller())
     and exists (
       select 1 from public.profiles p
        where p.id = uid and p.status not in ('blocked', 'suspended')
     );
$$;
revoke all on function public.is_active_user(uuid) from public;
grant execute on function public.is_active_user(uuid) to anon, authenticated, service_role;

-- email of the auth user, only for the caller's own uid (or privileged callers)
create or replace function public._auth_email_of(uid uuid)
returns text language sql stable security definer set search_path = public, auth as $$
  select u.email::text from auth.users u
   where u.id = uid and (uid is not distinct from auth.uid() or public._is_privileged_caller());
$$;
revoke all on function public._auth_email_of(uuid) from public, anon;
grant execute on function public._auth_email_of(uuid) to authenticated, service_role;

-- ---- guard trigger (DB-03) --------------------------------------------------
create or replace function public.protect_profile_columns()
returns trigger language plpgsql set search_path = public as $$
declare
  v_auth_email text;
begin
  if current_user in ('service_role', 'supabase_admin', 'postgres')
     or coalesce(public.has_permission(auth.uid(), 'students', 'edit'), false) then
    return new;
  end if;

  v_auth_email := public._auth_email_of(new.id);

  if tg_op = 'INSERT' then
    new.status         := 'active';
    new.blocked_reason := null;
    new.blocked_at     := null;
    new.blocked_by     := null;
    new.admin_notes    := null;
    if v_auth_email is not null then new.email := v_auth_email; end if;
  else
    new.status         := old.status;
    new.blocked_reason := old.blocked_reason;
    new.blocked_at     := old.blocked_at;
    new.blocked_by     := old.blocked_by;
    new.admin_notes    := old.admin_notes;
    new.referral_code  := old.referral_code;
    if new.email is distinct from old.email and new.email is distinct from v_auth_email then
      new.email := old.email;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.protect_profile_columns() from public, anon, authenticated;

drop trigger if exists profiles_guard_columns on public.profiles;
create trigger profiles_guard_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---- is_premium pin now also on INSERT (DB-32); UPDATE behaviour identical to M:0037 -----------
create or replace function public.protect_profile_is_premium()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.is_premium
       and current_user not in ('service_role', 'supabase_admin', 'postgres')
       and coalesce(current_setting('app.sync_is_premium', true), 'off') <> 'on' then
      new.is_premium := false;
    end if;
    return new;
  end if;
  if new.is_premium is distinct from old.is_premium
     and coalesce(current_setting('app.sync_is_premium', true), 'off') <> 'on' then
    new.is_premium := old.is_premium;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_is_premium on public.profiles;
create trigger profiles_guard_is_premium
  before insert or update on public.profiles
  for each row execute function public.protect_profile_is_premium();

-- ---- profiles policies: blocked users may read but not update -----------------------------------
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = id and (select public.is_active_user()))
  with check (auth.uid() = id and (select public.is_active_user()));

-- ---- rewrite own-row write policies (DB-04) -----------------------------------------------------
do $$
declare
  r        record;
  v_using  text;
  v_check  text;
  v_roles  text;
  v_perm   text;
  v_n      int := 0;
  c_active constant text := '(select public.is_active_user())';
  -- payment-related tables are deferred to the payment integration
  c_skip   constant text[] := array['profiles', 'purchases', 'premium_subscriptions', 'refund_requests',
                                    'withdrawal_requests', 'wallet_transactions', 'wallet_topup_orders',
                                    'referrals', 'referral_codes', 'referral_earnings'];
begin
  for r in
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      from pg_policies
     where cmd <> 'SELECT'
       and (
         (schemaname = 'public' and tablename <> all (c_skip))
         or (schemaname = 'storage' and tablename = 'objects'
             and coalesce(qual, '') || coalesce(with_check, '') ~ '''(avatars|resumes|custom-project-uploads)''')
       )
       and coalesce(qual, '') || coalesce(with_check, '') like '%auth.uid()%'
       and coalesce(qual, '') || coalesce(with_check, '') !~ '(is_admin|has_permission|current_admin_role|is_active_user)'
     order by schemaname, tablename, policyname
  loop
    v_using := r.qual;
    v_check := r.with_check;
    v_roles := (select string_agg(case when x = 'public' then 'public' else quote_ident(x) end, ', ') from unnest(r.roles) x);
    v_perm  := lower(r.permissive);

    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);

    if r.cmd = 'ALL' then
      -- keep read as-is; every write gets the active check
      execute format('create policy %I on %I.%I as %s for select to %s using (%s)',
                     r.policyname || '_select', r.schemaname, r.tablename, v_perm, v_roles, v_using);
      execute format('create policy %I on %I.%I as %s for insert to %s with check ((%s) and %s)',
                     r.policyname || '_insert', r.schemaname, r.tablename, v_perm, v_roles, coalesce(v_check, v_using), c_active);
      execute format('create policy %I on %I.%I as %s for update to %s using ((%s) and %s) with check ((%s) and %s)',
                     r.policyname || '_update', r.schemaname, r.tablename, v_perm, v_roles, v_using, c_active, coalesce(v_check, v_using), c_active);
      execute format('create policy %I on %I.%I as %s for delete to %s using ((%s) and %s)',
                     r.policyname || '_delete', r.schemaname, r.tablename, v_perm, v_roles, v_using, c_active);
    elsif r.cmd = 'INSERT' then
      execute format('create policy %I on %I.%I as %s for insert to %s with check ((%s) and %s)',
                     r.policyname, r.schemaname, r.tablename, v_perm, v_roles, v_check, c_active);
    elsif r.cmd = 'UPDATE' then
      execute format('create policy %I on %I.%I as %s for update to %s using ((%s) and %s) with check ((%s) and %s)',
                     r.policyname, r.schemaname, r.tablename, v_perm, v_roles, v_using, c_active, coalesce(v_check, v_using), c_active);
    elsif r.cmd = 'DELETE' then
      execute format('create policy %I on %I.%I as %s for delete to %s using ((%s) and %s)',
                     r.policyname, r.schemaname, r.tablename, v_perm, v_roles, v_using, c_active);
    end if;
    v_n := v_n + 1;
  end loop;
  raise notice '0118: rewrote % own-row write policies with is_active_user()', v_n;
end $$;

-- ---- user-callable write RPCs: guard line inserted, bodies otherwise verbatim -----------------
CREATE OR REPLACE FUNCTION public.record_legal_consent(p_legal_version text, p_privacy_version text, p_terms_version text, p_source text DEFAULT 'app'::text)
 RETURNS legal_consents
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_row public.legal_consents;
begin
  if v_uid is null then
    raise exception 'You must be signed in to record consent'
      using errcode = 'insufficient_privilege';
  end if;

  -- DB-04: blocked / suspended accounts cannot write.
  if not public.is_active_user(v_uid) then
    raise exception 'Your account is blocked. Contact support.'
      using errcode = 'insufficient_privilege';
  end if;

  if coalesce(btrim(p_legal_version), '')   = ''
     or coalesce(btrim(p_privacy_version), '') = ''
     or coalesce(btrim(p_terms_version), '')   = '' then
    raise exception 'Policy version strings are required'
      using errcode = 'check_violation';
  end if;

  insert into public.legal_consents
    (user_id, legal_version, privacy_version, terms_version, source, accepted_at)
  values (
    v_uid,
    left(btrim(p_legal_version), 32),
    left(btrim(p_privacy_version), 32),
    left(btrim(p_terms_version), 32),
    left(coalesce(nullif(btrim(p_source), ''), 'app'), 32),
    now()
  )
  returning * into v_row;

  return v_row;
end;
$function$;
CREATE OR REPLACE FUNCTION public.submit_test_attempt(p_test_id text, p_answers jsonb, p_time_taken_seconds integer)
 RETURNS test_attempts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid         uuid := auth.uid();
  v_attempt     public.test_attempts;
  v_qcount      integer := 0;
  v_total_marks integer := 0;
  v_score       integer := 0;
  v_correct     integer := 0;
begin
  if v_uid is null then
    raise exception 'You must be signed in to submit a test'
      using errcode = 'insufficient_privilege';
  end if;

  -- DB-04: blocked / suspended accounts cannot write.
  if not public.is_active_user(v_uid) then
    raise exception 'Your account is blocked. Contact support.'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from public.practice_tests where id = p_test_id) then
    raise exception 'Test % not found', p_test_id using errcode = 'no_data_found';
  end if;

  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then
    raise exception 'p_answers must be a JSON array'
      using errcode = 'invalid_parameter_value';
  end if;

  with q as (
    select
      tq.id,
      tq.marks,
      tq.correct_index,
      (
        select (a.value ->> 'selected_index')::int
        from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a
        where a.value ->> 'question_id' = tq.id
        limit 1
      ) as selected_index
    from public.test_questions tq
    where tq.test_id = p_test_id
  )
  select
    count(*),
    coalesce(sum(marks), 0),
    coalesce(sum(marks) filter (where selected_index is not null and selected_index = correct_index), 0),
    count(*) filter (where selected_index is not null and selected_index = correct_index)
  into v_qcount, v_total_marks, v_score, v_correct
  from q;

  insert into public.test_attempts
    (user_id, test_id, score, total_marks, correct_count, incorrect_count, time_taken_seconds)
  values
    (v_uid, p_test_id, v_score, v_total_marks, v_correct,
     greatest(v_qcount - v_correct, 0),
     greatest(coalesce(p_time_taken_seconds, 0), 0))
  returning * into v_attempt;

  insert into public.test_attempt_answers (attempt_id, question_id, selected_index, is_correct)
  select
    v_attempt.id,
    tq.id,
    sel.selected_index,
    coalesce(sel.selected_index is not null and sel.selected_index = tq.correct_index, false)
  from public.test_questions tq
  cross join lateral (
    select (
      select (a.value ->> 'selected_index')::int
      from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a
      where a.value ->> 'question_id' = tq.id
      limit 1
    ) as selected_index
  ) sel
  where tq.test_id = p_test_id
  on conflict (attempt_id, question_id) do nothing;

  return v_attempt;
end;
$function$;
CREATE OR REPLACE FUNCTION public.submit_randomized_test_attempt(p_test_id text, p_question_ids text[], p_answers jsonb, p_time_taken_seconds integer)
 RETURNS test_attempts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid         uuid := auth.uid();
  v_exists      boolean;
  v_attempt     public.test_attempts;
  v_qcount      integer := 0;
  v_total_marks integer := 0;
  v_score       integer := 0;
  v_correct     integer := 0;
begin
  if v_uid is null then
    raise exception 'You must be signed in to submit a test'
      using errcode = 'insufficient_privilege';
  end if;

  -- DB-04: blocked / suspended accounts cannot write.
  if not public.is_active_user(v_uid) then
    raise exception 'Your account is blocked. Contact support.'
      using errcode = 'insufficient_privilege';
  end if;

  select exists(
    select 1 from public.practice_tests
    where id = p_test_id and coalesce(scope, 'topic') in ('chapter','course')
  ) into v_exists;
  if not v_exists then
    raise exception 'Test % not found', p_test_id using errcode = 'no_data_found';
  end if;

  if jsonb_typeof(coalesce(p_answers, '[]'::jsonb)) <> 'array' then
    raise exception 'p_answers must be a JSON array'
      using errcode = 'invalid_parameter_value';
  end if;
  if p_question_ids is null or array_length(p_question_ids, 1) is null then
    raise exception 'p_question_ids must not be empty'
      using errcode = 'invalid_parameter_value';
  end if;

  with q as (
    select
      pool.id, pool.marks, pool.correct_index,
      (
        select (a.value ->> 'selected_index')::int
        from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a
        where a.value ->> 'question_id' = pool.id
        limit 1
      ) as selected_index
    from public.practice_test_pool(p_test_id) pool
    where pool.id = any (p_question_ids)
  )
  select
    count(*),
    coalesce(sum(marks), 0),
    coalesce(sum(marks) filter (where selected_index is not null and selected_index = correct_index), 0),
    count(*) filter (where selected_index is not null and selected_index = correct_index)
  into v_qcount, v_total_marks, v_score, v_correct
  from q;

  if v_qcount = 0 then
    raise exception 'None of the given questions belong to this test''s pool'
      using errcode = 'invalid_parameter_value';
  end if;

  insert into public.test_attempts
    (user_id, test_id, score, total_marks, correct_count, incorrect_count, time_taken_seconds)
  values
    (v_uid, p_test_id, v_score, v_total_marks, v_correct,
     greatest(v_qcount - v_correct, 0),
     greatest(coalesce(p_time_taken_seconds, 0), 0))
  returning * into v_attempt;

  insert into public.test_attempt_answers (attempt_id, question_id, selected_index, is_correct)
  select
    v_attempt.id, pool.id, sel.selected_index,
    coalesce(sel.selected_index is not null and sel.selected_index = pool.correct_index, false)
  from public.practice_test_pool(p_test_id) pool
  cross join lateral (
    select (
      select (a.value ->> 'selected_index')::int
      from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) a
      where a.value ->> 'question_id' = pool.id
      limit 1
    ) as selected_index
  ) sel
  where pool.id = any (p_question_ids)
  on conflict (attempt_id, question_id) do nothing;

  return v_attempt;
end;
$function$;

-- ----------------------------------------------------------------------------
-- ROLLBACK (manual):
--   drop trigger if exists profiles_guard_columns on public.profiles;
--   drop function if exists public.protect_profile_columns();
--   -- restore the 0037 behaviour:
--   drop trigger if exists profiles_guard_is_premium on public.profiles;
--   create trigger profiles_guard_is_premium before update on public.profiles
--     for each row execute function public.protect_profile_is_premium();   -- (function tolerates INSERT branch)
--   -- policies: for every policy created above, re-run the original definition from the migration that
--   -- created it (e.g. profiles_update_own = `for update using (auth.uid()=id) with check (auth.uid()=id)`),
--   -- or drop the trailing " AND (select public.is_active_user())" conjunct. ALL policies that were split
--   -- (cpdraft_rw_own, learning_bookmarks_rw_own, prep_note_bookmarks_rw_own, resumes_owner_all,
--   -- cp_uploads_owner_all) are restored with:  drop policy <n>_select/_insert/_update/_delete; create policy <n> for all ...
--   -- functions: re-create record_legal_consent / submit_test_attempt / submit_randomized_test_attempt from
--   -- M:0039 / M:0040 (remove the "DB-04" guard block).
--   -- drop function public.is_active_user(uuid), public._auth_email_of(uuid), public._is_privileged_caller();
--   --   (only after all policies/functions referencing them are restored)
-- ----------------------------------------------------------------------------
