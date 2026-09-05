-- Phase 9 of the Advanced Resume & Career Profile System engagement.
--
-- Resume sharing. This is the FIRST place in the whole schema where an
-- anonymous visitor can read any part of a resumes_builder row — get it
-- wrong and it's a direct private-data leak. The design deliberately keeps
-- the blast radius to one narrow, reviewable surface:
--
--   * resumes_builder itself is untouched — still owner-only RLS, no new
--     policy of any kind added to it.
--   * resume_shares is owner-only RLS too (a share row is data about what
--     the owner chose to expose, not the resume content itself).
--   * The ONLY path an anonymous visitor has is get_shared_resume(token) —
--     a SECURITY DEFINER function that validates an active, unexpired
--     token and returns a hand-picked projection (never id/user_id/
--     ats_score) of exactly one resume.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create table if not exists public.resume_shares (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  resume_id  uuid        not null references public.resumes_builder (id) on delete cascade,
  -- 128 bits of randomness — brute-forcing a valid token is not a realistic attack.
  token      text        not null unique default encode(gen_random_bytes(16), 'hex'),
  is_active  boolean     not null default true,
  expires_at timestamptz,
  view_count integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resume_shares_user_id_idx on public.resume_shares (user_id);

alter table public.resume_shares enable row level security;

-- Owner-only CRUD — same shape as resumes_builder's own policies (0014).
drop policy if exists "resume_shares_select_own" on public.resume_shares;
create policy "resume_shares_select_own"
  on public.resume_shares for select
  using (auth.uid() = user_id);

drop policy if exists "resume_shares_insert_own" on public.resume_shares;
create policy "resume_shares_insert_own"
  on public.resume_shares for insert
  with check (auth.uid() = user_id);

drop policy if exists "resume_shares_update_own" on public.resume_shares;
create policy "resume_shares_update_own"
  on public.resume_shares for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "resume_shares_delete_own" on public.resume_shares;
create policy "resume_shares_delete_own"
  on public.resume_shares for delete
  using (auth.uid() = user_id);

drop trigger if exists resume_shares_set_updated_at on public.resume_shares;
create trigger resume_shares_set_updated_at
  before update on public.resume_shares
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- The one anonymous-read path onto resume content. Returns null (not an
-- error) for an invalid/expired/revoked token, so a visitor can't tell the
-- difference between "never existed" and "was revoked."
-- ---------------------------------------------------------------------------
create or replace function public.get_shared_resume(p_token text)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  share_row  public.resume_shares%rowtype;
  resume_row public.resumes_builder%rowtype;
begin
  select * into share_row
  from public.resume_shares
  where token = p_token
    and is_active
    and (expires_at is null or expires_at > now());
  if not found then
    return null;
  end if;

  select * into resume_row from public.resumes_builder where id = share_row.resume_id;
  if not found then
    return null;
  end if;

  update public.resume_shares set view_count = view_count + 1 where id = share_row.id;

  -- Hand-picked projection only — no id, user_id or ats_score ever leaves
  -- this function. personal_details (email/phone) is included deliberately:
  -- that's the whole point of sharing a resume with a recruiter.
  return jsonb_build_object(
    'title', resume_row.title,
    'template', resume_row.template,
    'personalDetails', resume_row.personal_details,
    'education', resume_row.education,
    'skills', resume_row.skills,
    'sections', resume_row.sections,
    'layout', resume_row.layout,
    'updatedAt', resume_row.updated_at
  );
end;
$$;

revoke all on function public.get_shared_resume(text) from public;
grant execute on function public.get_shared_resume(text) to anon, authenticated;

notify pgrst, 'reload schema';
