-- mobile-app/supabase/checks/spring_boot_publish.sql
-- NOT A MIGRATION and NOT run by anyone yet. The owner runs this ONCE, on purpose, after 0124-0137 are applied,
-- spring_boot_hidden_check.sql is all ok = true, and the lessons have been reviewed.
-- It switches the Spring Boot Tutorial ON: the grid and its mock tests together (the test table's RLS does
-- not follow the grid, so both must change in the same transaction). It touches no other course.
-- To hide the course again, run spring_boot_unpublish at the bottom of this file (also not run).
begin;
do $$
begin
  if (select count(*) from public.learning_topics where source_kind = 'spring_boot_tutorial') <> 95
     or (select count(*) from public.practice_tests where id like 'pt-sb-%') <> 95 then
    raise exception 'publish refused: the course is not fully seeded (need 95 topics and 95 tests)';
  end if;
end $$;
update public.learning_grids set show_on_website = true, show_on_mobile = true
 where slug = 'spring-boot-tutorial' and source_kind = 'seed' and source_ref = 'spring_boot_tutorial';
update public.practice_tests set show_on_website = true, show_on_mobile = true where id like 'pt-sb-%';
do $$
begin
  if not exists (select 1 from public.learning_grids where slug = 'spring-boot-tutorial' and show_on_website and show_on_mobile)
     or exists (select 1 from public.practice_tests where id like 'pt-sb-%' and not (show_on_website and show_on_mobile)) then
    raise exception 'publish did not switch the grid and all tests on';
  end if;
end $$;
commit;

-- ---- UNPUBLISH (run separately, only if the course must be hidden again) ----
-- begin;
-- update public.learning_grids set show_on_website = false, show_on_mobile = false where slug = 'spring-boot-tutorial' and source_kind = 'seed' and source_ref = 'spring_boot_tutorial';
-- update public.practice_tests set show_on_website = false, show_on_mobile = false where id like 'pt-sb-%';
-- commit;
