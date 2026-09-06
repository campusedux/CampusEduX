-- mobile-app/supabase/migrations/0049_seed_topic_practice_demo.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/026_seed_topic_practice_demo.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — OPTIONAL demo data for topic-specific practice
-- (mobile 0049_seed_topic_practice_demo.sql == admin 026_seed_topic_practice_demo.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- OPTIONAL. Apply this ONLY if you want the master-prompt §27 example data:
--   Java Tutorials ▸ Java Basics ▸ Introduction to Java
--     • Mock Test  "Introduction to Java - Quick Test"  (4 MCQs)
--     • Coding Problems: Print Hello World / Add Two Numbers / Check Even or Odd
--
-- Same pattern as 0047_seed_java_tutorial_content.sql: content only, no schema
-- change, guarded + idempotent via deterministic ids + on-conflict-do-nothing.
-- Re-running never duplicates and never disturbs an admin's later edits
-- (publish state / premium / visibility are left alone after first insert).
--
-- NO-OP unless a PUBLISHED topic with slug 'introduction-to-java' exists under a
-- grid whose slug is 'java-tutorial' or 'java-tutorials'. Apply AFTER
-- 0047/024 (seeds that topic) and 0048/025 (adds the practice columns + RPCs).
-- ----------------------------------------------------------------------------

do $seed$
declare
  v_grid  uuid;
  v_topic uuid;
begin
  select t.id, g.id
    into v_topic, v_grid
  from public.learning_topics t
  join public.learning_grids g on g.id = t.grid_id
  where lower(t.slug) = 'introduction-to-java'
    and lower(g.slug) in ('java-tutorial','java-tutorials')
    and t.status = 'published'
  order by t.created_at
  limit 1;

  if v_topic is null then
    raise notice '0049/026: no published "introduction-to-java" topic found — skipping demo seed.';
    return;
  end if;

  -- ---- guard: needs 0048/025 (practice columns + RPCs) -------------------
  if to_regprocedure('public.learning_topic_practice(text, text, text)') is null then
    raise exception '0049/026: apply 0048_topic_practice.sql (admin 025) first.';
  end if;

  -- ================= MOCK TEST =================
  insert into public.practice_tests
    (id, title, category, question_count, duration_minutes, description,
     total_marks, pass_marks, is_published, difficulty,
     learning_grid_id, learning_topic_id, status, is_premium,
     negative_marking, instructions, show_on_website, show_on_mobile)
  values
    ('mt-demo-introjava', 'Introduction to Java - Quick Test', 'aptitude', 4, 10,
     'A quick 4-question check on Java basics — what Java is, classes, the JVM and the program entry point.',
     4, 2, true, 'Easy',
     v_grid, v_topic, 'published', false,
     0, 'Answer all 4 questions. Each carries 1 mark. No negative marking.', true, true)
  on conflict (id) do nothing;

  insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
  values
    ('tq-demo-ij-1', 'mt-demo-introjava',
     'What is Java?',
     '["A high-level, class-based, object-oriented programming language","A relational database","An operating system","A web browser"]'::jsonb,
     0, 'Java is a high-level, class-based, object-oriented programming language that compiles to bytecode run by the JVM.', 1, 0),
    ('tq-demo-ij-2', 'mt-demo-introjava',
     'Which keyword is used to create a class in Java?',
     '["struct","function","class","define"]'::jsonb,
     2, 'The "class" keyword declares a class, e.g. "public class Main { }".', 1, 1),
    ('tq-demo-ij-3', 'mt-demo-introjava',
     'What is the JVM?',
     '["Java Verified Machine","Java Virtual Machine","Just-in-time Validating Module","Java Variable Manager"]'::jsonb,
     1, 'The Java Virtual Machine executes compiled Java bytecode, giving Java its "write once, run anywhere" portability.', 1, 2),
    ('tq-demo-ij-4', 'mt-demo-introjava',
     'Which method is the entry point of a Java program?',
     '["start()","init()","public static void main(String[] args)","run()"]'::jsonb,
     2, 'The JVM starts execution at "public static void main(String[] args)".', 1, 3)
  on conflict (id) do nothing;

  update public.practice_tests set question_count = 4 where id = 'mt-demo-introjava' and question_count <> 4;

  -- ================= CODING PROBLEMS (topic_id NULL) =================
  -- Skip a problem whose slug is already taken by any row (an admin may have made
  -- one) — the global slug is what /coding-problems/<slug> resolves on.
  insert into public.dsa_problems
    (id, topic_id, title, difficulty, slug, description,
     examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
     supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
  select v.* from (values
    ('cp-demo-hello', null::text, 'Print Hello World', 'Easy', 'print-hello-world',
     E'Write a program that prints exactly:\n\n```\nHello World\n```\n\nThere is no input.',
     '[{"input":"","output":"Hello World"}]'::jsonb,
     '["The program reads no input.","Output must match exactly, with no trailing spaces."]'::jsonb,
     jsonb_build_object(
       'java',   E'public class Main {\n    public static void main(String[] args) {\n        // print Hello World\n    }\n}\n',
       'python', E'# print Hello World\n',
       'c',      E'#include <stdio.h>\n\nint main(void) {\n    // print Hello World\n    return 0;\n}\n',
       'cpp',    E'#include <iostream>\n\nint main() {\n    // print Hello World\n    return 0;\n}\n'
     ),
     '["Most languages have a single print/println call.","Watch the exact capitalisation: Hello World."]'::jsonb,
     '[{"input":"","expected":"Hello World","hidden":false}]'::jsonb,
     'Print the literal string "Hello World" followed by a newline.',
     jsonb_build_object('python', E'print("Hello World")\n'),
     array['java','python','c','cpp'], v_grid, v_topic, 'published', false, 0),

    ('cp-demo-add', null, 'Add Two Numbers', 'Easy', 'add-two-numbers',
     E'Read two space-separated integers `a` and `b` from standard input and print their sum.',
     '[{"input":"2 3","output":"5"},{"input":"10 -4","output":"6"}]'::jsonb,
     '["-1000000000 <= a, b <= 1000000000"]'::jsonb,
     jsonb_build_object(
       'java',   E'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        long a = sc.nextLong(), b = sc.nextLong();\n        // print a + b\n    }\n}\n',
       'python', E'a, b = map(int, input().split())\n# print a + b\n',
       'c',      E'#include <stdio.h>\n\nint main(void) {\n    long long a, b;\n    scanf("%lld %lld", &a, &b);\n    // print a + b\n    return 0;\n}\n',
       'cpp',    E'#include <iostream>\n\nint main() {\n    long long a, b;\n    std::cin >> a >> b;\n    // print a + b\n    return 0;\n}\n'
     ),
     '["Split the input line on whitespace.","Use 64-bit integers to be safe."]'::jsonb,
     '[{"input":"2 3","expected":"5","hidden":false},{"input":"1000000000 1000000000","expected":"2000000000","hidden":true},{"input":"-5 5","expected":"0","hidden":true}]'::jsonb,
     'Parse both integers, add them, print the result.',
     jsonb_build_object('python', E'a, b = map(int, input().split())\nprint(a + b)\n'),
     array['java','python','c','cpp'], v_grid, v_topic, 'published', false, 1),

    ('cp-demo-evenodd', null, 'Check Even or Odd', 'Easy', 'check-even-or-odd',
     E'Read a single integer `n` from standard input. Print `Even` if it is even, otherwise print `Odd`.',
     '[{"input":"4","output":"Even"},{"input":"7","output":"Odd"}]'::jsonb,
     '["-1000000000 <= n <= 1000000000"]'::jsonb,
     jsonb_build_object(
       'java',   E'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        long n = new Scanner(System.in).nextLong();\n        // print Even or Odd\n    }\n}\n',
       'python', E'n = int(input())\n# print Even or Odd\n',
       'c',      E'#include <stdio.h>\n\nint main(void) {\n    long long n;\n    scanf("%lld", &n);\n    // print Even or Odd\n    return 0;\n}\n',
       'cpp',    E'#include <iostream>\n\nint main() {\n    long long n;\n    std::cin >> n;\n    // print Even or Odd\n    return 0;\n}\n'
     ),
     '["n % 2 == 0 means even.","Negative numbers can be even too."]'::jsonb,
     '[{"input":"4","expected":"Even","hidden":false},{"input":"7","expected":"Odd","hidden":false},{"input":"0","expected":"Even","hidden":true},{"input":"-3","expected":"Odd","hidden":true}]'::jsonb,
     'Take n modulo 2; print "Even" when the remainder is 0, else "Odd".',
     jsonb_build_object('python', E'n = int(input())\nprint("Even" if n % 2 == 0 else "Odd")\n'),
     array['java','python','c','cpp'], v_grid, v_topic, 'published', false, 2)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
  where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
  on conflict (id) do nothing;

  raise notice '0049/026 OK: demo mock test (mt-demo-introjava) + 3 coding problems attached to Introduction to Java.';
end
$seed$;

notify pgrst, 'reload schema';
