-- DB-17: resume_shares ownership check, token/view_count pinned, server-side token, get_shared_resume works.
\set ON_ERROR_STOP on
do $$
declare
  a uuid := test_make_user('a204@x.io');
  b uuid := test_make_user('b204@x.io');
  ra uuid; rb uuid; sid uuid; tok text; tok2 text; r jsonb; vc int;
begin
  insert into resumes_builder(user_id,title) values (a,'A resume') returning id into ra;
  insert into resumes_builder(user_id,title) values (b,'B resume') returning id into rb;

  perform test_as(a);
  -- cannot share someone else's resume
  begin insert into resume_shares(user_id,resume_id) values (a,rb); raise exception 'FAIL shared victim resume';
  exception when insufficient_privilege then null; end;
  -- own resume: client-supplied token / view_count / created_at are ignored
  insert into resume_shares(user_id,resume_id,token,view_count,created_at) values (a,ra,'guessable',999,'2000-01-01') returning id, token into sid, tok;
  if tok = 'guessable' or length(tok) < 32 or tok !~ '^[0-9a-f]+$' then raise exception 'FAIL token %', tok; end if;
  select view_count into vc from resume_shares where id = sid;
  if vc <> 0 then raise exception 'FAIL view_count insert'; end if;
  if (select created_at from resume_shares where id=sid) < now() - interval '1 minute' then raise exception 'FAIL created_at'; end if;
  -- update cannot repoint to other's resume, nor change token / view_count
  begin update resume_shares set resume_id = rb where id = sid; raise exception 'FAIL repoint';
  exception when insufficient_privilege then null; end;
  update resume_shares set token='hijack', view_count=12345, is_active=true where id=sid;
  select token, view_count into tok2, vc from resume_shares where id = sid;
  if tok2 <> tok or vc <> 0 then raise exception 'FAIL pin token=% vc=%', tok2, vc; end if;
  update resume_shares set is_active=false where id=sid;
  if (select is_active from resume_shares where id=sid) then raise exception 'FAIL toggle'; end if;
  update resume_shares set is_active=true where id=sid;
  perform test_reset();

  -- other user cannot see/modify it
  perform test_as(b);
  if exists (select 1 from resume_shares) then raise exception 'FAIL b sees share'; end if;
  update resume_shares set is_active=false where id=sid;
  perform test_reset();
  if not (select is_active from resume_shares where id=sid) then raise exception 'FAIL b modified'; end if;

  -- anon get_shared_resume still works and bumps view_count (definer path not pinned)
  perform test_as(null,'anon');
  r := get_shared_resume(tok);
  if r is null or r->>'title' <> 'A resume' then raise exception 'FAIL get_shared_resume %', r; end if;
  if get_shared_resume('nope') is not null then raise exception 'FAIL bogus token'; end if;
  perform test_reset();
  if (select view_count from resume_shares where id=sid) <> 1 then raise exception 'FAIL view_count bump'; end if;

  -- default token (superuser insert without trigger pin) is random too
  insert into resume_shares(user_id,resume_id) values (b,rb) returning token into tok;
  if length(tok) < 32 then raise exception 'FAIL default token'; end if;
  raise notice 'DB-17 OK';
end $$;
