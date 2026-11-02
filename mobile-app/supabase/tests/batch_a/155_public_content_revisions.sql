\set ON_ERROR_STOP on
begin;
do $$
declare
  item record;
  before_token uuid;
  other_token uuid;
  g uuid := gen_random_uuid(); s uuid := gen_random_uuid(); t uuid := gen_random_uuid();
  c uuid := gen_random_uuid(); b uuid := gen_random_uuid(); cat uuid := gen_random_uuid();
  admin_id uuid := test_make_user('revision-admin155@x.test');
  student_id uuid := test_make_user('revision-student155@x.test');
  outsider_id uuid := test_make_user('revision-outsider155@x.test');
  actor uuid;
  payload jsonb;
  operation text;
begin
  -- Every dependency has all four statement events, including empty writes.
  for item in select * from (values
    ('learning','learning_grids'), ('learning','learning_sections'),
    ('learning','learning_topics'), ('learning','learning_contents'),
    ('learning','practice_tests'), ('learning','dsa_problems'),
    ('blog','blog_posts'), ('blog','blog_categories'),
    ('home','projects'), ('home','testimonials'), ('home','faqs'), ('home','banners')
  ) as deps(scope, relation)
  loop
    if not exists (select 1 from pg_trigger where tgrelid = ('public.' || item.relation)::regclass
      and tgname = 'public_revision_' || item.scope and tgtype = 60 and tgenabled = 'O') then
      raise exception 'Missing statement INSERT/UPDATE/DELETE/TRUNCATE trigger on %', item.relation;
    end if;
    before_token := public.public_content_revision(item.scope);
    execute format('update public.%I set id = id where false', item.relation);
    if public.public_content_revision(item.scope) = before_token then
      raise exception 'Missing update invalidation on %', item.relation;
    end if;
  end loop;

  insert into public.admin_users(id,email,role,status)
    values (admin_id,'revision-admin155@x.test','super_admin','active');
  before_token := public.public_content_revision('learning');
  other_token := public.public_content_revision('blog');
  perform test_as(admin_id);
  insert into public.learning_grids(id,name,slug,status) values(g,'Revision fixture','revision-fixture','published');
  insert into public.learning_sections(id,grid_id,name,slug,status) values(s,g,'Chapter','chapter','published');
  insert into public.learning_topics(id,section_id,grid_id,title,slug,status)
    values(t,s,g,'Lesson','lesson','published');
  insert into public.learning_contents(id,topic_id,body) values(c,t,'Public fixture body');
  perform test_reset();
  if public.public_content_revision('learning') = before_token then raise exception 'Admin inserts missed'; end if;
  if public.public_content_revision('blog') <> other_token then raise exception 'Unrelated domain changed'; end if;

  perform test_as(null,'anon');
  payload := public.learning_topic_content('revision-fixture','lesson','website');
  if payload->>'locked' <> 'false' or jsonb_array_length(payload->'contents') <> 1 then
    raise exception 'Public fixture unavailable';
  end if;
  perform test_reset();
  before_token := public.public_content_revision('learning');
  update public.learning_contents set body = 'Edited child' where id = c;
  if public.public_content_revision('learning') = before_token then raise exception 'Child edit missed'; end if;

  update public.learning_contents set is_premium = true where id = c;
  perform test_as(null,'anon');
  payload := public.learning_topic_content('revision-fixture','lesson','website');
  if jsonb_array_length(payload->'contents') <> 0 then raise exception 'Protected child exposed'; end if;
  perform test_reset();
  update public.learning_topics set is_premium = true where id = t;
  perform test_as(null,'anon');
  payload := public.learning_topic_content('revision-fixture','lesson','website');
  if payload->>'locked' <> 'true' then raise exception 'Protected topic exposed'; end if;
  perform test_reset();
  update public.learning_sections set status = 'draft' where id = s;
  perform test_as(null,'anon');
  if public.learning_topic_content('revision-fixture','lesson','website') is not null then
    raise exception 'Unpublished section exposed';
  end if;
  perform test_reset();
  update public.learning_sections set status = 'published' where id = s;
  update public.learning_grids set show_on_website = false where id = g;
  perform test_as(null,'anon');
  if public.learning_topic_content('revision-fixture','lesson','website') is not null
     or public.learning_tree('revision-fixture','website') is not null then
    raise exception 'Hidden parent exposed';
  end if;
  perform test_reset();
  before_token := public.public_content_revision('learning');
  delete from public.learning_topics where id = t;
  if exists(select 1 from public.learning_contents where id = c)
     or public.public_content_revision('learning') = before_token then raise exception 'Cascade deletion missed'; end if;

  insert into public.blog_categories(id,name,slug) values(cat,'Revision category','revision-category');
  insert into public.blog_posts(id,title,slug,status,category_id,content)
    values(b,'Revision post','revision-post','published',cat,'Fixture article');
  before_token := public.public_content_revision('blog');
  update public.blog_categories set name = 'Renamed' where id = cat;
  if public.public_content_revision('blog') = before_token
     or (select category_name from public.blog_posts where id = b) <> 'Renamed' then
    raise exception 'Category cascade missed';
  end if;
  update public.blog_posts set status = 'draft' where id = b;
  perform test_as(null,'anon');
  if exists(select 1 from public.blog_posts where id = b) then raise exception 'Draft blog exposed'; end if;
  perform test_reset();
  before_token := public.public_content_revision('blog');
  delete from public.blog_posts where id = b;
  if public.public_content_revision('blog') = before_token then raise exception 'Blog deletion missed'; end if;

  -- Scratch-clone-only TRUNCATE: prove bulk import/reset paths also invalidate.
  before_token := public.public_content_revision('blog');
  truncate public.blog_posts;
  if public.public_content_revision('blog') = before_token then raise exception 'Truncate missed'; end if;

  -- Rollback restores both the revision and data, even within one transaction.
  before_token := public.public_content_revision('blog');
  begin
    update public.blog_categories set name = 'Rollback' where id = cat;
    raise check_violation;
  exception when check_violation then null;
  end;
  if public.public_content_revision('blog') <> before_token then raise exception 'Revision did not roll back'; end if;

  -- Only anon can read the opaque token. No caller can read/write the table
  -- or invoke the trigger function, including authenticated admins.
  foreach actor in array array[null::uuid, student_id, outsider_id, admin_id] loop
    perform test_as(actor, case when actor is null then 'anon' else 'authenticated' end);
    if actor is null then
      if public.public_content_revision('blog') is null then raise exception 'Anon token missing'; end if;
      begin
        perform public.public_content_revision('private');
        raise exception 'Invalid scope accepted';
      exception when invalid_parameter_value then null; end;
    else
      begin
        perform public.public_content_revision('blog');
        raise exception 'Authenticated token access accepted';
      exception when insufficient_privilege then null; end;
    end if;
    foreach operation in array array[
      'select * from public.public_content_revisions',
      'update public.public_content_revisions set revision = gen_random_uuid()',
      'delete from public.public_content_revisions',
      'insert into public.public_content_revisions(scope) values (''blog'')',
      'select public.bump_public_content_revision()'
    ] loop
      begin execute operation; raise exception 'Forbidden operation accepted';
      exception when insufficient_privilege then null; end;
    end loop;
    perform test_reset();
  end loop;

  -- A broken invalidation contract aborts the original write, never succeeds stale.
  delete from public.public_content_revisions where scope = 'blog';
  begin
    update public.blog_categories set name = 'Must abort' where id = cat;
    raise exception 'Missing revision allowed write';
  exception when raise_exception then
    if sqlerrm <> 'Public content revision contract is missing' then raise; end if;
  end;
  if (select name from public.blog_categories where id = cat) <> 'Renamed' then
    raise exception 'Failed invalidation committed content';
  end if;
end;
$$;
rollback;
