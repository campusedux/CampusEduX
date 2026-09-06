-- mobile-app/supabase/migrations/0046_learning_p6_corrective.sql
-- CANONICAL PAIR — byte-identical body below this line; twin: admin-panel/supabase/migrations/023_learning_p6_corrective.sql
-- Phase 6 corrective: one missing FK index. Additive · idempotent.
--
-- ============================================================================
-- BODY — learning unification, Phase 6 corrective : one missing FK index.
-- (mobile 0046_learning_p6_corrective.sql == admin 023_learning_p6_corrective.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- Phase 6 audit found `dsa_topics.learning_topic_id` (added by 0044/021) has no
-- index, unlike every other Phase-2 link column. Zero impact today (no read
-- path joins on it) — added for consistency + future joins. Nothing else in the
-- Phase 6 audit required a schema / RLS / data change.
-- ----------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.dsa_topics') is not null
     and exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='dsa_topics'
                   and column_name='learning_topic_id') then
    create index if not exists dsa_topics_ltopic_idx
      on public.dsa_topics (learning_topic_id)
      where learning_topic_id is not null;
  end if;
end $$;

notify pgrst, 'reload schema';
