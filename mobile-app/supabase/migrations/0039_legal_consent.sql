-- ============================================================================
-- 0039_legal_consent.sql — record acceptance of the legal policies
-- ============================================================================
-- Phase 17 (Play Store / Legal compliance): keep a minimal, tamper-resistant
-- record that a user accepted the current Terms & Privacy Policy.
--
-- The acceptance gesture is the checkbox on the mobile Register screen, which
-- links to the actual documents. Sign-up can require email confirmation, so the
-- durable row is written on the user's first authenticated app load
-- (src/services/legal.service.ts -> ensureConsentRecorded()).
--
-- Design:
--   * public.legal_consents — one row per acceptance. user_id + accepted_at are
--     set server-side; the client only reports which version strings it showed
--     (not security-sensitive — a user cannot gain anything by misreporting).
--   * RLS: a user may read only their own rows. There is NO client INSERT
--     policy — inserts go exclusively through record_legal_consent(), a
--     SECURITY DEFINER function that pins user_id = auth.uid() and
--     accepted_at = now().
--
-- Additive · guarded · idempotent · re-runnable.
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)
-- ----------------------------------------------------------------------------

create table if not exists public.legal_consents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  legal_version   text not null,
  privacy_version text not null,
  terms_version   text not null,
  source          text not null default 'app',
  accepted_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists legal_consents_user_idx
  on public.legal_consents (user_id, accepted_at desc);

alter table public.legal_consents enable row level security;

drop policy if exists "legal_consents_select_own" on public.legal_consents;
create policy "legal_consents_select_own"
  on public.legal_consents for select
  to authenticated
  using (auth.uid() = user_id);

-- No INSERT / UPDATE / DELETE policy: writes only via the RPC below; rows are
-- immutable once written.

create or replace function public.record_legal_consent(
  p_legal_version   text,
  p_privacy_version text,
  p_terms_version   text,
  p_source          text default 'app'
)
returns public.legal_consents
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.legal_consents;
begin
  if v_uid is null then
    raise exception 'You must be signed in to record consent'
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
$$;

revoke all on function public.record_legal_consent(text, text, text, text) from public, anon;
grant execute on function public.record_legal_consent(text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
