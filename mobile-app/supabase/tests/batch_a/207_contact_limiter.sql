-- DB-20 (website 0002): contact-form limiter hardening.
\set ON_ERROR_STOP on
do $$
declare
  i int; u uuid := test_make_user('c207@x.io'); ok int; k text;
  msg text := 'hello this is a valid message';
begin
  perform test_as(null,'anon');
  -- per-key limit 4/h; other keys unaffected (no shared 'anon' lockout)
  for i in 1..4 loop perform submit_contact_message('Alice','a@x.io',msg,'K1'); end loop;
  begin perform submit_contact_message('Alice','a@x.io',msg,'k1 '); raise exception 'FAIL key not normalised';
  exception when others then if sqlerrm <> 'RATE_LIMITED' then raise; end if; end;
  perform submit_contact_message('Bob','b@x.io',msg,'k2');
  -- keyless callers: not sharing one 4-per-hour bucket any more
  for i in 1..10 loop perform submit_contact_message('Carl','c@x.io',msg,null); end loop;
  perform submit_contact_message('Dan','d@x.io',msg,'k3');
  perform test_reset();

  -- raw key never stored; overlong key capped
  perform test_as(null,'anon');
  perform submit_contact_message('Eve','e@x.io',msg, repeat('Z',500));
  perform test_reset();
  if exists (select 1 from contact_rate_limits where client_key ~* 'k1|zzzz' or length(client_key) > 70) then raise exception 'FAIL raw/long key stored'; end if;

  -- rotating fake keys behind one header IP is capped (40/h)
  perform set_config('request.headers', '{"x-forwarded-for":"9.9.9.9, 10.0.0.1"}', false);
  perform test_as(null,'anon');
  ok := 0;
  for i in 1..60 loop
    begin perform submit_contact_message('Rot','r@x.io',msg,'rot'||i); ok := ok + 1;
    exception when others then if sqlerrm <> 'RATE_LIMITED' then raise; end if; end;
  end loop;
  perform test_reset();
  if ok <> 40 then raise exception 'FAIL header-ip cap ok=%', ok; end if;
  -- a different IP is unaffected
  perform set_config('request.headers', '{"x-forwarded-for":"8.8.8.8"}', false);
  perform test_as(null,'anon');
  perform submit_contact_message('Rot','r@x.io',msg,'fresh');
  perform test_reset();

  -- signed-in: keyed by uid regardless of supplied key
  perform set_config('request.headers', '', false);
  perform test_as(u);
  for i in 1..4 loop perform submit_contact_message('Uma','u@x.io',msg,'rotating'||i); end loop;
  begin perform submit_contact_message('Uma','u@x.io',msg,'another'); raise exception 'FAIL uid limit';
  exception when others then if sqlerrm <> 'RATE_LIMITED' then raise; end if; end;
  perform test_reset();

  -- global cap
  update contact_rate_limits set count = 300, window_start = now() where client_key = 'global';
  perform test_as(null,'anon');
  begin perform submit_contact_message('Glo','g@x.io',msg,'brandnew'); raise exception 'FAIL global cap';
  exception when others then if sqlerrm <> 'RATE_LIMITED' then raise; end if; end;
  perform test_reset();
  update contact_rate_limits set window_start = now() - interval '2 hours' where client_key = 'global';

  -- validation still enforced; purge of stale windows
  perform test_as(null,'anon');
  begin perform submit_contact_message('X','a@x.io',msg,'v'); raise exception 'FAIL name';
  exception when others then if sqlerrm <> 'INVALID_NAME' then raise; end if; end;
  perform test_reset();
  insert into contact_rate_limits values ('stale-key', now() - interval '3 days', 1);
  perform test_as(null,'anon');
  for i in 1..400 loop
    begin perform submit_contact_message('Pur','p@x.io',msg,'purge'||(i % 200)); exception when others then null; end;
  end loop;
  perform test_reset();
  if exists (select 1 from contact_rate_limits where client_key='stale-key') then raise exception 'FAIL purge'; end if;

  -- helper not callable by clients; rows only via the RPC
  perform test_as(null,'anon');
  begin perform _contact_hit('x',1,1); raise exception 'FAIL helper exposed'; exception when insufficient_privilege then null; end;
  if exists (select 1 from contact_rate_limits) then raise exception 'FAIL table exposed'; end if;
  perform test_reset();
  raise notice 'DB-20 OK';
end $$;
