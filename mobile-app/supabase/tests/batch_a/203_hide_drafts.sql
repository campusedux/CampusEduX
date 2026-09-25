-- DB-13: drafts hidden from anon/non-admin; purchasers/applicants keep their rows; admin sees all.
\set ON_ERROR_STOP on
do $$
declare
  admin_id uuid := test_make_user('adm203@x.io');
  buyer uuid := test_make_user('buyer203@x.io');
  other uuid := test_make_user('other203@x.io');
  n int;
begin
  insert into admin_users(id,email,role,status) values (admin_id,'adm203@x.io','super_admin','active');
  insert into jobs(id,title,status) values ('j-open','o','open'),('j-closed','c','closed'),('j-draft','d','draft'),('j-draft-applied','da','draft');
  insert into applications(user_id,job_id) values (buyer,'j-draft-applied');
  insert into projects(id,title,status) values ('p-pub','pub','published'),('p-draft','dr','draft'),('p-arch','ar','archived'),('p-arch-bought','ab','published');
  insert into purchases(user_id,project_id,status) values (buyer,'p-arch-bought','success');
  update projects set status='archived' where id='p-arch-bought';   -- unpublished AFTER purchase
  insert into projects(id,title,status) values ('p-arch-wish','aw','archived');
  insert into wishlists(user_id,project_id) values (buyer,'p-arch-wish');

  perform test_as(null,'anon');
  if (select count(*) from jobs where id like 'j-%') <> 2 then raise exception 'FAIL anon jobs'; end if;
  if exists (select 1 from jobs where status='draft') then raise exception 'FAIL anon sees draft'; end if;
  if (select count(*) from projects where id like 'p-%') <> 1 then raise exception 'FAIL anon projects %', (select count(*) from projects where id like 'p-%'); end if;
  perform test_reset();

  perform test_as(other);
  if (select count(*) from jobs where id like 'j-%') <> 2 then raise exception 'FAIL other jobs'; end if;
  if (select count(*) from projects where id like 'p-%') <> 1 then raise exception 'FAIL other projects'; end if;
  perform test_reset();

  perform test_as(buyer);
  if (select count(*) from jobs where id like 'j-%') <> 3 then raise exception 'FAIL buyer jobs (applied draft must stay)'; end if;
  if not exists (select 1 from jobs where id='j-closed') then raise exception 'FAIL closed hidden'; end if;
  -- embedded-join style reads used by the apps
  if (select count(*) from purchases pu join projects p on p.id = pu.project_id where pu.user_id = buyer) <> 1 then raise exception 'FAIL purchase->project join'; end if;
  if (select count(*) from applications a join jobs j on j.id = a.job_id where a.user_id = buyer) <> 1 then raise exception 'FAIL application->job join'; end if;
  -- 7c: NO wishlist carve-out on the table any more: a wishlisted unpublished project is not readable
  if (select count(*) from wishlists w join projects p on p.id = w.project_id) <> 0 then raise exception 'FAIL wishlist join leaks unpublished'; end if;
  -- ... even one the user wishlists themselves (wishlists.insert only needs a project id)
  insert into wishlists(user_id,project_id) values (buyer,'p-draft'),(buyer,'p-arch-bought'),(buyer,'p-pub');
  if exists (select 1 from projects where id in ('p-draft','p-arch-wish')) then raise exception 'FAIL draft readable via wishlist'; end if;
  -- my_wishlist(): tombstones carry NO details; published + purchased-but-unpublished are available
  if (select count(*) from my_wishlist()) <> 4 then raise exception 'FAIL my_wishlist rows %', (select count(*) from my_wishlist()); end if;
  if exists (select 1 from my_wishlist() where project_id in ('p-draft','p-arch-wish')
              and (available or title is not null or price is not null or thumbnail_url is not null or category_name is not null))
    then raise exception 'FAIL tombstone leaks details'; end if;
  if not exists (select 1 from my_wishlist() where project_id='p-pub' and available and title='pub') then raise exception 'FAIL published wishlist row'; end if;
  if not exists (select 1 from my_wishlist() where project_id='p-arch-bought' and available and title='ab') then raise exception 'FAIL purchased-unpublished must stay available'; end if;
  begin perform 1 from my_wishlist() where false; exception when others then raise exception 'FAIL my_wishlist call'; end;
  -- removing a tombstone still works (own-row delete policy)
  delete from wishlists where project_id = 'p-draft' and user_id = buyer;
  if exists (select 1 from my_wishlist() where project_id='p-draft') then raise exception 'FAIL tombstone removal'; end if;
  if exists (select 1 from projects where id in ('p-draft','p-arch')) then raise exception 'FAIL buyer sees others'; end if;
  perform test_reset();

  -- other user's wishlist is not visible, anon cannot call my_wishlist
  perform test_as(other); if (select count(*) from my_wishlist()) <> 0 then raise exception 'FAIL my_wishlist scoping'; end if; perform test_reset();
  perform test_as(null,'anon');
  begin perform * from my_wishlist(); raise exception 'FAIL anon my_wishlist'; exception when insufficient_privilege then null; end;
  perform test_reset();

  perform test_as(admin_id);
  if (select count(*) from jobs where id like 'j-%') <> 4 then raise exception 'FAIL admin jobs'; end if;
  if (select count(*) from projects where id like 'p-%') <> 5 then raise exception 'FAIL admin projects'; end if;
  update jobs set status='open' where id='j-draft';      -- admin write still works
  perform test_reset();
  raise notice 'DB-13 OK';
end $$;
