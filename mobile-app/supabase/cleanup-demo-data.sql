-- mobile-app/supabase/cleanup-demo-data.sql
-- ===========================================================================
-- Remove ALL demo / seed data for the Marketplace, Jobs and Companies modules.
--
-- Projects and Jobs rows were already deleted from Supabase by hand. This
-- script finishes the job: it deletes every row from public.companies and
-- clears every child / FK-referencing table first, in the correct order.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> paste -> Run.
--   The SQL Editor runs as the `postgres` role, which BYPASSES RLS, so the
--   DELETEs succeed even though these tables only expose SELECT policies.
--   Pick ONE variant below and run it whole. Each is a single BEGIN/COMMIT
--   transaction; if anything fails, nothing is committed.
--
-- FOREIGN KEYS INTO public.companies
--   table                      column       on delete   nullable
--   ------------------------    ----------   ---------   --------
--   recruiters                 company_id   SET NULL    yes
--   jobs                       company_id   SET NULL    yes   (already empty)
--   practice_tests             company_id   CASCADE     yes
--   hr_questions               company_id   CASCADE     yes
--   learning_topics            company_id   SET NULL    yes
--   learning_grid_companies    company_id   RESTRICT    NO  <-- cannot be nulled
--
--   learning_grid_companies.company_id is NOT NULL + ON DELETE RESTRICT, so it
--   blocks `DELETE FROM companies` while any row exists. BOTH variants delete
--   every learning_grid_companies row (that Learning "Company" tier is retired
--   by migration 0064_remove_specialised_learning_grids.sql). practice_tests /
--   hr_questions use ON DELETE CASCADE (not SET NULL) -> Variant A nulls
--   company_id first so the cascade never fires; Variant B does the child
--   deletes explicitly.
--
--   Indirect children:
--     test_questions.test_id              -> practice_tests (CASCADE)
--     test_attempts.test_id               -> practice_tests (CASCADE)
--     test_attempt_answers.attempt_id     -> test_attempts  (CASCADE)  [question_id has NO fk]
--     user_favorite_questions.question_id -> hr_questions    (CASCADE)
-- ===========================================================================


-- ###########################################################################
-- ## VARIANT A - KEEP practice/HR content, just unlink it from companies
-- ##   Keeps every row of practice_tests, test_questions, test_attempts,
-- ##   test_attempt_answers, hr_questions, user_favorite_questions.
-- ##   company_id is set to NULL first so the ON DELETE CASCADE never fires.
-- ##   The four child tables have no company_id column - they simply stay
-- ##   attached to their now-companyless parents.
-- ###########################################################################
begin;

  -- 1. Learning "Company" grid tier - NOT NULL + RESTRICT, must be removed.
  delete from public.learning_grid_companies;

  -- 2. Company-scoped learning topics (FK is SET NULL; explicit for clarity).
  update public.learning_topics
     set company_id = null
   where company_id is not null;

  -- 3. Recruiters - Jobs-module demo data (Jobs rows already deleted).
  --    To KEEP recruiters instead, swap the next line for:
  --      update public.recruiters set company_id = null where company_id is not null;
  delete from public.recruiters;

  -- 4. Unlink company-scoped practice tests / HR questions BEFORE the delete
  --    (their FK is ON DELETE CASCADE, not SET NULL).
  update public.practice_tests
     set company_id = null
   where company_id is not null;

  update public.hr_questions
     set company_id = null
   where company_id is not null;

  -- 5. The companies themselves.
  delete from public.companies;

commit;


-- ###########################################################################
-- ## VARIANT B - DELETE the company-scoped practice/HR content as well
-- ##   Removes only rows tied to a company (company_id IS NOT NULL) and
-- ##   everything under them. Generic aptitude/logical/verbal tests, the
-- ##   generic HR bank, and topic-linked practice content (learning_topic_id,
-- ##   company_id NULL) are LEFT INTACT.
-- ##   Run this INSTEAD OF Variant A.
-- ###########################################################################
begin;

  -- 1. Learning "Company" grid tier - NOT NULL + RESTRICT.
  delete from public.learning_grid_companies;

  -- 2. Company-scoped learning topics.
  update public.learning_topics
     set company_id = null
   where company_id is not null;

  -- 3. Recruiters (see note in Variant A to keep them instead).
  delete from public.recruiters;

  -- 4. Company-scoped practice tests + children, child-first.
  delete from public.test_attempt_answers
   where attempt_id in (
     select id from public.test_attempts
      where test_id in (select id from public.practice_tests where company_id is not null)
   );

  delete from public.test_attempts
   where test_id in (select id from public.practice_tests where company_id is not null);

  delete from public.test_questions
   where test_id in (select id from public.practice_tests where company_id is not null);

  delete from public.practice_tests
   where company_id is not null;

  -- 5. Company-scoped HR questions + favourites.
  delete from public.user_favorite_questions
   where question_id in (select id from public.hr_questions where company_id is not null);

  delete from public.hr_questions
   where company_id is not null;

  -- 6. The companies themselves.
  delete from public.companies;

commit;
