-- Test helpers (loaded into template cx_tpl). Impersonation is session-level (set_config ..., false) so it
-- survives across statements; test_reset() returns to the superuser session role.
create or replace function public.test_as(uid uuid, r text default 'authenticated')
returns void language plpgsql as $$
declare em text;
begin
  select email into em from auth.users where id = uid;
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', uid, 'role', r, 'email', em)::text, false);
  perform set_config('request.jwt.claim.sub', coalesce(uid::text,''), false);
  perform set_config('request.jwt.claim.role', r, false);
  execute format('set role %I', r);
end $$;

create or replace function public.test_reset() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', false);
  perform set_config('request.jwt.claim.sub', '', false);
  perform set_config('request.jwt.claim.role', '', false);
end $$;

create or replace function public.test_make_user(p_email text, p_meta jsonb default '{}')
returns uuid language plpgsql as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at)
  values (uid, p_email, coalesce(p_meta,'{}'::jsonb), now());
  return uid;
end $$;
grant execute on function public.test_as(uuid,text), public.test_reset(), public.test_make_user(text,jsonb) to public;
