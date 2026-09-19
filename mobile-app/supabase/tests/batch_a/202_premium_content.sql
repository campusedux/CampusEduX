-- DB-10 practice_test_questions premium/answer-key gating; DB-11 prep_notes premium gate.
\set ON_ERROR_STOP on
do $$
declare
  admin_id uuid := test_make_user('adm202@x.io');
  free_u uuid := test_make_user('free202@x.io');
  prem_u uuid := test_make_user('prem202@x.io');
  g uuid; sec uuid; t_free uuid; t_prem uuid; r jsonb; ids text[];
begin
  insert into admin_users(id,email,role,status) values (admin_id,'adm202@x.io','super_admin','active');
  perform set_config('app.sync_is_premium','on',true);
  update profiles set is_premium = true where id = prem_u;
  perform set_config('app.sync_is_premium','off',true);

  insert into learning_grids(name,slug) values ('G2','g-two') returning id into g;
  insert into learning_sections(grid_id,name,slug) values (g,'S','s-one') returning id into sec;
  insert into learning_topics(grid_id,section_id,title,slug) values (g,sec,'Free T','free-t') returning id into t_free;
  insert into learning_topics(grid_id,section_id,title,slug,is_premium) values (g,sec,'Prem T','prem-t',true) returning id into t_prem;

  insert into practice_tests(id,title,learning_topic_id,scope) values ('own-free','F',t_free,'topic');
  insert into practice_tests(id,title,learning_topic_id,scope,is_premium) values ('own-premtest','PT',t_free,'topic',true);
  insert into practice_tests(id,title,learning_topic_id,scope) values ('own-premtopic','PTo',t_prem,'topic');
  insert into test_questions(id,test_id,question_text,options,correct_index,explanation) values
    ('q-free','own-free','QF','["a","b"]',1,'EXPL'),
    ('q-premtest','own-premtest','QPT','["a","b"]',1,'EXPL'),
    ('q-premtopic','own-premtopic','QPTO','["a","b"]',1,'EXPL');
  insert into practice_tests(id,title,scope,learning_section_id,question_limit) values ('chap','Chapter','chapter',sec,50);
  insert into practice_tests(id,title,scope,learning_section_id,is_premium) values ('chap-prem','ChapterP','chapter',sec,true);

  -- anon: only free question, NO answer key
  perform test_as(null,'anon');
  r := practice_test_questions('chap');
  select array_agg(e->>'id') into ids from jsonb_array_elements(r) e;
  if ids <> array['q-free'] then raise exception 'FAIL anon pool %', ids; end if;
  if r->0->'correct_index' <> 'null'::jsonb or r->0->'explanation' <> 'null'::jsonb then raise exception 'FAIL anon key leaked %', r; end if;
  if r->0->>'question_text' <> 'QF' then raise exception 'FAIL shape'; end if;
  if practice_test_questions('chap-prem') <> '[]'::jsonb then raise exception 'FAIL anon premium chapter'; end if;
  perform test_reset();

  -- free signed-in: same pool but WITH answer key
  perform test_as(free_u);
  r := practice_test_questions('chap');
  select array_agg(e->>'id') into ids from jsonb_array_elements(r) e;
  if ids <> array['q-free'] then raise exception 'FAIL free pool %', ids; end if;
  if (r->0->>'correct_index')::int <> 1 then raise exception 'FAIL free key'; end if;
  if practice_test_questions('chap-prem') <> '[]'::jsonb then raise exception 'FAIL free premium chapter'; end if;
  perform test_reset();

  -- premium user & admin: everything
  perform test_as(prem_u);
  select array_agg(e->>'id' order by e->>'id') into ids from jsonb_array_elements(practice_test_questions('chap')) e;
  if ids <> array['q-free','q-premtest','q-premtopic'] then raise exception 'FAIL premium pool %', ids; end if;
  perform test_reset();
  perform test_as(admin_id);
  select array_agg(e->>'id' order by e->>'id') into ids from jsonb_array_elements(practice_test_questions('chap')) e;
  if array_length(ids,1) <> 3 then raise exception 'FAIL admin pool %', ids; end if;
  perform test_reset();

  -- DB-11 prep_notes
  insert into prep_notes(title,is_published,is_premium) values ('pub-free',true,false),('pub-prem',true,true),('draft',false,false);
  perform test_as(null,'anon');
  if (select count(*) from prep_notes) <> 1 or exists (select 1 from prep_notes where is_premium) then raise exception 'FAIL anon notes'; end if;
  perform test_reset();
  perform test_as(free_u);
  if (select count(*) from prep_notes) <> 1 then raise exception 'FAIL free notes %', (select count(*) from prep_notes); end if;
  perform test_reset();
  perform test_as(prem_u);
  if (select count(*) from prep_notes) <> 2 then raise exception 'FAIL prem notes'; end if;
  perform test_reset();
  perform test_as(admin_id);
  if (select count(*) from prep_notes) <> 3 then raise exception 'FAIL admin notes'; end if;
  perform test_reset();
  raise notice 'DB-10/11 OK';
end $$;
