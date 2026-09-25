-- 0123/095: submit_test_attempt() / submit_randomized_test_attempt() refuse a test the student cannot
-- see (hidden on both website and mobile, draft, archived, targeted elsewhere) exactly like a missing
-- test, still accept visible ones, and leave existing attempts untouched.
\ir ../../migrations/0123_submit_attempt_requires_visible_test.sql
do $$
declare u uuid; g uuid; s uuid; t uuid; a public.test_attempts; n int; ok boolean; st text;
  ans  jsonb := '[{"question_id":"tq-v-1","selected_index":1}]';
  qids text[] := array['tq-v-1'];
begin
  u := test_make_user('s@x.test', '{"full_name":"Student S"}');
  insert into public.learning_grids (name, slug, status) values ('G', 'g-visible', 'published') returning id into g;
  insert into public.learning_sections (grid_id, name, slug, status) values (g, 'S', 's-visible', 'published') returning id into s;
  insert into public.learning_topics (section_id, grid_id, title, slug, status) values (s, g, 'T', 't-visible', 'published') returning id into t;
  insert into public.practice_tests (id, title, scope, learning_topic_id) values ('pt-v', 'Topic test', 'topic', t);
  insert into public.test_questions (id, test_id, question_text, options, correct_index, marks)
    values ('tq-v-1', 'pt-v', 'Q?', '["a","b"]', 1, 1);
  insert into public.practice_tests (id, title, scope, learning_section_id) values ('pt-v-ch', 'Chapter test', 'chapter', s);

  -- ===== topic test (submit_test_attempt) =====
  perform test_as(u);
  a := public.submit_test_attempt('pt-v', ans, 30);
  if a.score <> 1 or a.total_marks <> 1 then raise exception 'visible test not scored: %', row_to_json(a); end if;

  -- off on the website only: still visible on mobile, so still accepted
  perform test_reset(); update public.practice_tests set show_on_website = false where id = 'pt-v';
  perform test_as(u); perform public.submit_test_attempt('pt-v', ans, 30);

  -- off on both: refused like a missing test
  perform test_reset(); update public.practice_tests set show_on_mobile = false where id = 'pt-v';
  perform test_as(u);
  ok := false; begin perform public.submit_test_attempt('pt-v', ans, 30); exception when no_data_found then ok := true; end;
  if not ok then raise exception 'test hidden on website and mobile accepted an attempt'; end if;

  -- draft / archived: refused
  foreach st in array array['draft', 'archived'] loop
    perform test_reset();
    update public.practice_tests set show_on_website = true, show_on_mobile = true, status = st where id = 'pt-v';
    perform test_as(u);
    ok := false; begin perform public.submit_test_attempt('pt-v', ans, 30); exception when no_data_found then ok := true; end;
    if not ok then raise exception '% test accepted an attempt', st; end if;
  end loop;

  -- targeted at a branch the student is not in: refused
  perform test_reset();
  update public.practice_tests set status = 'published', target_type = 'branch', target_branch_ids = array['no-such-branch'] where id = 'pt-v';
  perform test_as(u);
  ok := false; begin perform public.submit_test_attempt('pt-v', ans, 30); exception when no_data_found then ok := true; end;
  if not ok then raise exception 'test targeted at another branch accepted an attempt'; end if;

  -- a missing test is still "not found"
  ok := false; begin perform public.submit_test_attempt('nope', ans, 30); exception when no_data_found then ok := true; end;
  if not ok then raise exception 'missing test not rejected with no_data_found'; end if;

  -- ===== chapter test (submit_randomized_test_attempt) =====
  perform test_reset();
  update public.practice_tests set target_type = 'global', target_branch_ids = '{}' where id = 'pt-v';
  perform test_as(u);
  a := public.submit_randomized_test_attempt('pt-v-ch', qids, ans, 30);
  if a.score <> 1 then raise exception 'visible chapter test not scored: %', row_to_json(a); end if;

  perform test_reset(); update public.practice_tests set show_on_website = false, show_on_mobile = false where id = 'pt-v-ch';
  perform test_as(u);
  ok := false; begin perform public.submit_randomized_test_attempt('pt-v-ch', qids, ans, 30); exception when no_data_found then ok := true; end;
  if not ok then raise exception 'hidden chapter test accepted an attempt'; end if;

  perform test_reset(); update public.practice_tests set show_on_website = true, show_on_mobile = true, status = 'archived' where id = 'pt-v-ch';
  perform test_as(u);
  ok := false; begin perform public.submit_randomized_test_attempt('pt-v-ch', qids, ans, 30); exception when no_data_found then ok := true; end;
  if not ok then raise exception 'archived chapter test accepted an attempt'; end if;

  -- ===== existing records untouched; grants unchanged =====
  perform test_reset();
  select count(*) into n from public.test_attempts where user_id = u;
  if n <> 3 then raise exception 'expected the 3 accepted attempts to remain, found %', n; end if;
  select count(*) into n from public.test_attempt_answers x join public.test_attempts ta on ta.id = x.attempt_id where ta.user_id = u;
  if n <> 3 then raise exception 'expected 3 answer rows, found %', n; end if;
  if has_function_privilege('anon', 'public.submit_test_attempt(text,jsonb,integer)', 'execute')
     or has_function_privilege('anon', 'public.submit_randomized_test_attempt(text,text[],jsonb,integer)', 'execute')
     or not has_function_privilege('authenticated', 'public.submit_test_attempt(text,jsonb,integer)', 'execute')
     or not has_function_privilege('authenticated', 'public.submit_randomized_test_attempt(text,text[],jsonb,integer)', 'execute') then
    raise exception 'submit function grants changed';
  end if;
end $$;

-- idempotence: the admin twin re-applies as a no-op
\ir ../../../../admin-panel/supabase/migrations/095_submit_attempt_requires_visible_test.sql
