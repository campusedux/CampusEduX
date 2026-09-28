-- mobile-app/supabase/checks/java_lesson_rewrite_batch01_precheck.sql
-- READ-ONLY. Run before 0145_java_lesson_rewrite_batch01.sql (or its admin twin 116_java_lesson_rewrite_batch01.sql) to see what it will do.
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
  ('hashmap', 'collections-framework/hashmap', '49e66a666d79037ff550179404e2bbc8', '50cf9f5408282ff0dc1a752dd627a454', true),
  ('arraylist', 'collections-framework/arraylist', '733533a342d65d2376cf7fbad6fb7f51', 'e9cc7f553719b7668d1f01957140630f', true),
  ('collection-framework', 'collections-framework/collection-framework', 'f1871c96d9302b9ae7a61fc5f384f2b9', 'c84a4093cb395fb2caef25c0191b1bf8', true),
  ('stream-api', 'advanced-java/stream-api', '7c7e3c4d1cbbb6e53b9cd65263caf958', '30bda7b5f8c671e5ba4b07a4fc565956', true),
  ('lambda-expressions', 'advanced-java/lambda-expressions', 'dce3a38244d63842dd9ae803cfa9ec86', '1cc97bcee79eea05ba7dbdd31f0f5983', true),
  ('constructors', 'object-oriented-programming/constructors', '19b6352fd27184e61fa5190f4e39f127', 'fc8a3229846f164d5670990fc077ad35', true),
  ('inheritance', 'object-oriented-programming/inheritance', 'd2a31c5dbda7ee7cc315e6e1bc2ea7d1', '7ad2478f9be4e6cf5681c1b3468cc762', true),
  ('polymorphism', 'object-oriented-programming/polymorphism', 'bde083f9d9043948c0a91dbf64c795e4', '0d01b1042b8a56c63b2b11e2f6db4baa', true),
  ('abstraction', 'object-oriented-programming/abstraction', '6057c280457772cc430a4d0a3f6c2cd6', 'c9e5cc817470f27171d252edb3288117', true),
  ('interface', 'object-oriented-programming/interface', 'c56fade72c54a044dd7be5923ba4c383', 'da0777eb021a7005a18098f5e94a6453', true),
  ('abstract-class', 'object-oriented-programming/abstract-class', 'c60cc16111ffc322fed6b58d796a2aee', 'ba744cfb650a693678f5d40b834d48df', true),
  ('static-keyword', 'object-oriented-programming/static-keyword', '2a30046100402a1a507176f9fa80b16a', 'ac354507d8862c33f251b96f0ba6e713', true),
  ('this-keyword', 'object-oriented-programming/this-keyword', '4b4caf104ebf5365b5f12205f087f4a0', 'af8978a577778dfdb8fbae7572c068ec', true),
  ('method-overloading', 'object-oriented-programming/method-overloading', 'f1f628b6f0a3c23105d1ce4e7f144160', '89af4ca6efed2a8d3678d5c826ff539e', true),
  ('method-overriding', 'object-oriented-programming/method-overriding', '1499b47b3f8698a9613e6a547e48f2c5', '53dc88b7fff7758e60a666b6d50790e4', true),
  ('string', 'arrays-and-strings/string', '0c6f5d513e7895a710bb7207a7f77e79', 'c08d709edbcc46a8432f6c92554d4df0', true),
  ('exception', 'packages-and-exception-handling/exception', '26e886c5a9f88fcead4d4c6fbf849276', '96991d0e4c707b1b2e1bab95374e2c0e', true),
  ('try-catch', 'packages-and-exception-handling/try-catch', '313bed611daff1c0548708e7962e32ba', '371ce56f6cf948b1ca34070d231cee47', true),
  ('thread', 'multithreading/thread', 'a26ab771572eecf57ef21f0cc99f2294', 'a7f61e5f88a566579aeb948ebe574264', true),
  ('jdk-jre-and-jvm', 'introduction-to-java/jdk-jre-and-jvm', 'd48a622c3c407ea360241d890aca4073', '6bef73d0cdf8256237513d73b7d23182', false)
) v(slug, ref, old_md5, new_md5, adds_practice)
left join public.learning_topics t on t.source_kind = 'java_tutorial' and t.source_ref = v.ref
left join public.learning_contents cb on cb.topic_id = t.id and cb.metadata ->> 'source' = 'java_tutorial_seed'
order by v.slug;
