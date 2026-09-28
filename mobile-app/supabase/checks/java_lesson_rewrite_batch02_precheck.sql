-- mobile-app/supabase/checks/java_lesson_rewrite_batch02_precheck.sql
-- READ-ONLY. Run before 0146_java_lesson_rewrite_batch02.sql (or its admin twin 117_java_lesson_rewrite_batch02.sql) to see what it will do.
-- One row per topic. body_state: 'original' = will be rewritten, 'rewritten' = already done,
-- 'EDITED' = an admin changed it, and the migration will refuse to run until that is resolved.
-- has_practice_block / has_test show rows that already exist; ok must be true on every row.
select v.slug,
  case md5(cb.body) when v.old_md5 then 'original' when v.new_md5 then 'rewritten' else 'EDITED' end as body_state,
  t.status, t.show_on_website, t.show_on_mobile,
  exists (select 1 from public.learning_contents p where p.topic_id = t.id and p.metadata ->> 'source' = 'java_practice_seed') as has_practice_block,
  exists (select 1 from public.practice_tests p where p.id = 'pt-java-' || v.slug) as has_test,
  (select count(*) from public.test_attempts a where a.test_id = 'pt-java-' || v.slug) as test_attempts,
  t.id is not null and md5(cb.body) in (v.old_md5, v.new_md5)
    and (not v.adds_practice or not exists (select 1 from public.learning_contents p where p.topic_id = t.id
         and p.metadata ->> 'source' = 'java_practice_seed' and p.metadata ->> 'origin' is distinct from 'java_lesson_rewrite')) as ok
from (values
  ('linkedlist', 'collections-framework/linkedlist', '84fa4ca69df10ba0513f8cae1425332b', 'dfa41ae56b76cfa31e5ffef7719ab80c', true),
  ('hashset', 'collections-framework/hashset', 'b13eac8ffb19d0cae492c250e5fb0f45', '9ef7cd7e38168e9e1871ffcacf9422cb', true),
  ('treemap', 'collections-framework/treemap', '12f93e4e6c649cf01dd552928e032ed2', '5cecaaf936a0c9fb639fa9cf9f109cbf', true),
  ('treeset', 'collections-framework/treeset', 'c164d6c34ccf291ab168760e2bcdcb07', '0e4b5dcc8720e96787ce6979deeecb03', true),
  ('iterator', 'collections-framework/iterator', 'a2b2e9591aa3f0738d9bf5aac8c12441', 'acd27f7de00eeecff0f3d9c81b8eeb35', true),
  ('comparable', 'collections-framework/comparable', '9ea0b0ffd9704c9115144792da78663e', '0fe38df199ed177be8ade3c7292678d1', true),
  ('comparator', 'collections-framework/comparator', '3c5e414d9b35baff13593e8665f6f34a', '954f8ce2b2dcd5328ee3633ffd5d5ea4', true),
  ('generics', 'advanced-java/generics', 'c9fa8380ad712da5d79821ee52c733e6', '390f83999b8f4a73d3fe354b5934eb3d', true),
  ('wrapper-classes', 'advanced-java/wrapper-classes', '672825f113614442614f1ce9ebd7d4de', '8e957717a605b043e8607b2261fe7bd4', true),
  ('enum', 'advanced-java/enum', '66279f27e2e22206a117f6d8d1f4da2c', '6be6da1407f5b5469c98e3d7ea0231f2', true),
  ('access-modifiers', 'object-oriented-programming/access-modifiers', '94838698d7c9ec893076178d5587c37c', '55f17cfb3d8b7ed2316fc54c5186d8d8', true),
  ('encapsulation', 'object-oriented-programming/encapsulation', 'f90a5ca447a59e0fbc7805fbab26baed', 'dcfbd7aa86a1601b56ed21b7fe1accc7', true),
  ('final-keyword', 'object-oriented-programming/final-keyword', '286720cf4ccbbacdee052b80446ebd66', '772c238179c1d199bb07e4c23f1622e7', true),
  ('super-keyword', 'object-oriented-programming/super-keyword', '338d18a468075000b67f281b81ba94b6', '3c015cf8d015bfa7982d232c96615214', true),
  ('stringbuilder', 'arrays-and-strings/stringbuilder', '92c4f26946615f7a1a531704c8cd9b04', '660aff236a70d105bdf8688e376639fe', true),
  ('string-pool', 'arrays-and-strings/string-pool', '320527fb8c8ba8bdf14194fd9a48bdb5', 'f68dadcaf01d04da01c5712f3a592985', true),
  ('synchronization', 'multithreading/synchronization', '37b488bdf6943365677c0b8862212efd', 'a988540d3b87d9d6dbf0b336af22984d', true),
  ('executor-framework', 'multithreading/executor-framework', '507da6b4e6584793ef1506cc0d0a7b96', '4b7704369f75cdfecf8cab8b9d2e6834', true),
  ('garbage-collection', 'jvm-internals-and-memory/garbage-collection', '5b004d1a31e19d53b4e8b39bc2d01e71', '1620afe177abdfc92e03c1de57c1dde0', true),
  ('jdbc', 'file-handling-and-jdbc/jdbc', 'cc3d6da820cb14f7b7c05c6763defb41', '255a1761ada97112f9f34e0083ff5ca5', true)
) v(slug, ref, old_md5, new_md5, adds_practice)
left join public.learning_topics t on t.source_kind = 'java_tutorial' and t.source_ref = v.ref
left join public.learning_contents cb on cb.topic_id = t.id and cb.metadata ->> 'source' = 'java_tutorial_seed'
order by v.slug;
