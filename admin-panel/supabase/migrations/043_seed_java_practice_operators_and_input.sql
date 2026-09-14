-- admin-panel/supabase/migrations/043_seed_java_practice_operators_and_input.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0071_seed_java_practice_operators_and_input.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — Java Tutorials ▸ Operators & Input: per-topic Mock Test (10 MCQs / 10 min) +
-- Coding Problems + Practice Problems
-- (mobile 0071_seed_java_practice_operators_and_input.sql
--  == admin 043_seed_java_practice_operators_and_input.sql — byte-identical below
--  the 3-line header, guarded, idempotent, additive.)
-- ============================================================================
-- Attaches practice to the 9 existing 'operators-and-input' topics of the
-- java-tutorial grid (seeded by admin 024 / mobile 0047). Reuses the topic-
-- practice tables + RPCs from admin 025 / mobile 0048. Content only.
--
--   * 9 Mock Tests   — practice_tests rows (learning_topic_id set,
--     category 'aptitude', 10 questions, 10-minute timer) + 90 test_questions.
--     Scoring is unchanged (submit_test_attempt(), server-side).
--   * 32 Coding Problems — dsa_problems rows (topic_id NULL +
--     learning_topic_id set), Java-only, prompt-free stdin/stdout, every
--     reference solution + test case executed under javac --release 11.
--   * 4 Practice Problems — 1 theory topics each get a second
--     learning_contents block (heading 'Practice Problems',
--     metadata.source 'java_practice_seed') with 4 written exercises + answers.
--
-- IDEMPOTENT. Deterministic ids + on-conflict-do-nothing (tests / questions /
-- problems); the practice-problem content block is keyed by a partial unique
-- index and refreshes its own body only. Re-running never duplicates and never
-- changes an admin's later publish / premium / visibility edits.
-- ----------------------------------------------------------------------------

-- ---- ordering guard ---------------------------------------------------------
do $guard$
begin
  if to_regclass('public.learning_grids') is null then
    raise exception '0071/043: learning_* not found — apply 0042_learning_management.sql (admin 019) first.';
  end if;
  if to_regprocedure('public.learning_topic_practice(text, text, text)') is null then
    raise exception '0071/043: topic-practice not found — apply 0048_topic_practice.sql (admin 025) first.';
  end if;
  if not exists (
    select 1 from public.learning_topics
    where source_kind = 'java_tutorial'
      and source_ref = 'operators-and-input/arithmetic-operators'
  ) then
    raise exception '0071/043: Java Tutorials content not found — apply 0047_seed_java_tutorial_content.sql (admin 024) first.';
  end if;
end
$guard$;


-- ---- practice-problem content-block idempotency key ------------------------
create unique index if not exists learning_contents_java_practice_key
  on public.learning_contents (topic_id)
  where (metadata ->> 'source') = 'java_practice_seed';


-- ===========================================================================
-- 1. MOCK TESTS + QUESTIONS — one 10-question, 10-minute test per topic.
-- ===========================================================================

-- Arithmetic Operators — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp1$operators-and-input/arithmetic-operators$jp1$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-arithmetic-operators', $jp2$Arithmetic Operators - Quick Test$jp2$, 'aptitude', 10, 10,
  $jp3$10 questions on +, -, *, /, % and how integer arithmetic behaves in Java.$jp3$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp4$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp4$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-arithmetic-operators-1', 'pt-java-arithmetic-operators',
   $jp5$What does the % operator compute?$jp5$,
   $jp6$["the remainder of a division", "rounding to the nearest whole number", "a square root", "a percentage"]$jp6$::jsonb,
   0, $jp7$% gives the remainder left after integer division, not a percentage.$jp7$, 1, 0),
  ('tq-java-arithmetic-operators-2', 'pt-java-arithmetic-operators',
   $jp8$What is the output of System.out.println(7 / 2); (both int)?$jp8$,
   $jp9$["4", "3.0", "3.5", "3"]$jp9$::jsonb,
   3, $jp10$int / int is integer division: the fractional part is dropped, giving 3.$jp10$, 1, 1),
  ('tq-java-arithmetic-operators-3', 'pt-java-arithmetic-operators',
   $jp11$What is the output of System.out.println(7 % 3);?$jp11$,
   $jp12$["1", "2", "3", "0"]$jp12$::jsonb,
   0, $jp13$7 divided by 3 is 2 remainder 1, so 7 % 3 is 1.$jp13$, 1, 2),
  ('tq-java-arithmetic-operators-4', 'pt-java-arithmetic-operators',
   $jp14$To get 3.5 from 7 / 2, you should ___.$jp14$,
   $jp15$["make at least one operand a double", "add parentheses", "store the result in a long", "use % instead"]$jp15$::jsonb,
   0, $jp16$If either operand is a double, Java does floating-point division and keeps the decimals.$jp16$, 1, 3),
  ('tq-java-arithmetic-operators-5', 'pt-java-arithmetic-operators',
   $jp17$What is the output of System.out.println(2 + 3 * 4);?$jp17$,
   $jp18$["9", "20", "14", "24"]$jp18$::jsonb,
   2, $jp19$* has higher precedence than +, so it is 2 + 12 = 14.$jp19$, 1, 4),
  ('tq-java-arithmetic-operators-6', 'pt-java-arithmetic-operators',
   $jp20$What is the value of r after int r = 10 - 4 - 3;?$jp20$,
   $jp21$["1", "3", "9", "11"]$jp21$::jsonb,
   1, $jp22$- is left-associative: (10 - 4) - 3 = 6 - 3 = 3.$jp22$, 1, 5),
  ('tq-java-arithmetic-operators-7', 'pt-java-arithmetic-operators',
   $jp23$Which expression multiplies a by b?$jp23$,
   $jp24$["a x b", "a * b", "a . b", "mul(a, b)"]$jp24$::jsonb,
   1, $jp25$* is the multiplication operator in Java.$jp25$, 1, 6),
  ('tq-java-arithmetic-operators-8', 'pt-java-arithmetic-operators',
   $jp26$What happens with System.out.println(10 / 0); for int operands?$jp26$,
   $jp27$["prints NaN", "prints 0", "prints Infinity", "throws an ArithmeticException"]$jp27$::jsonb,
   3, $jp28$Integer division by zero throws ArithmeticException at runtime.$jp28$, 1, 7),
  ('tq-java-arithmetic-operators-9', 'pt-java-arithmetic-operators',
   $jp29$What is the output of System.out.println(-7 % 3);?$jp29$,
   $jp30$["1", "-1", "2", "-2"]$jp30$::jsonb,
   1, $jp31$In Java the result of % takes the sign of the left operand, so -7 % 3 is -1.$jp31$, 1, 8),
  ('tq-java-arithmetic-operators-10', 'pt-java-arithmetic-operators',
   $jp32$What is the value of d after double d = 5 / 2;?$jp32$,
   $jp33$["a compile error", "2.5", "2.0", "2"]$jp33$::jsonb,
   2, $jp34$5 / 2 is evaluated as int division (2) first, then widened to the double 2.0.$jp34$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-arithmetic-operators' and question_count <> 10;

-- Relational Operators — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp35$operators-and-input/relational-operators$jp35$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-relational-operators', $jp36$Relational Operators - Quick Test$jp36$, 'aptitude', 10, 10,
  $jp37$10 questions on ==, !=, <, >, <=, >= and the boolean results they produce.$jp37$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp38$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp38$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-relational-operators-1', 'pt-java-relational-operators',
   $jp39$Relational operators produce a value of type ___.$jp39$,
   $jp40$["int", "boolean", "String", "double"]$jp40$::jsonb,
   1, $jp41$A comparison evaluates to true or false — a boolean.$jp41$, 1, 0),
  ('tq-java-relational-operators-2', 'pt-java-relational-operators',
   $jp42$Which operator means "not equal to"?$jp42$,
   $jp43$["~=", "<>", "!=", "=/="]$jp43$::jsonb,
   2, $jp44$!= is the not-equal operator in Java.$jp44$, 1, 1),
  ('tq-java-relational-operators-3', 'pt-java-relational-operators',
   $jp45$What is the value of 5 >= 5?$jp45$,
   $jp46$["false", "a compile error", "5", "true"]$jp46$::jsonb,
   3, $jp47$>= is "greater than OR equal to", and 5 equals 5, so it is true.$jp47$, 1, 2),
  ('tq-java-relational-operators-4', 'pt-java-relational-operators',
   $jp48$A very common beginner mistake is confusing == with ___.$jp48$,
   $jp49$[">=", "===", "!=", "="]$jp49$::jsonb,
   3, $jp50$= assigns a value; == compares two values.$jp50$, 1, 3),
  ('tq-java-relational-operators-5', 'pt-java-relational-operators',
   $jp51$What is the output of System.out.println(3 < 2);?$jp51$,
   $jp52$["false", "1", "0", "true"]$jp52$::jsonb,
   0, $jp53$3 is not less than 2, so the result is false.$jp53$, 1, 4),
  ('tq-java-relational-operators-6', 'pt-java-relational-operators',
   $jp54$For int a = 4, b = 4; which expression is true?$jp54$,
   $jp55$["a == b", "a != b", "a > b", "a < b"]$jp55$::jsonb,
   0, $jp56$The two values are equal, so a == b is true and a != b is false.$jp56$, 1, 5),
  ('tq-java-relational-operators-7', 'pt-java-relational-operators',
   $jp57$What is the value of 10 != 10?$jp57$,
   $jp58$["a compile error", "true", "false", "10"]$jp58$::jsonb,
   2, $jp59$10 is equal to 10, so "not equal" is false.$jp59$, 1, 6),
  ('tq-java-relational-operators-8', 'pt-java-relational-operators',
   $jp60$Relational operators are most often used inside ___.$jp60$,
   $jp61$["import lines", "if conditions and loops", "class declarations", "package statements"]$jp61$::jsonb,
   1, $jp62$They drive the decisions in if statements and the continuation checks in loops.$jp62$, 1, 7),
  ('tq-java-relational-operators-9', 'pt-java-relational-operators',
   $jp63$Which operator means "greater than or equal to"?$jp63$,
   $jp64$["=>", ">=", "=<", "gte"]$jp64$::jsonb,
   1, $jp65$The symbol is >=, greater-than sign first.$jp65$, 1, 8),
  ('tq-java-relational-operators-10', 'pt-java-relational-operators',
   $jp66$What is the output of System.out.println(2 + 3 == 5);?$jp66$,
   $jp67$["true", "false", "5", "23"]$jp67$::jsonb,
   0, $jp68$+ runs before ==, so it is 5 == 5, which is true.$jp68$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-relational-operators' and question_count <> 10;

-- Logical Operators — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp69$operators-and-input/logical-operators$jp69$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-logical-operators', $jp70$Logical Operators - Quick Test$jp70$, 'aptitude', 10, 10,
  $jp71$10 questions on &&, || and ! and how they combine boolean conditions.$jp71$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp72$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp72$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-logical-operators-1', 'pt-java-logical-operators',
   $jp73$&& returns true when ___.$jp73$,
   $jp74$["both operands are false", "the operands are equal", "at least one operand is true", "both operands are true"]$jp74$::jsonb,
   3, $jp75$Logical AND is true only if every operand is true.$jp75$, 1, 0),
  ('tq-java-logical-operators-2', 'pt-java-logical-operators',
   $jp76$|| returns true when ___.$jp76$,
   $jp77$["both operands are true", "at least one operand is true", "both operands are false", "neither operand is boolean"]$jp77$::jsonb,
   1, $jp78$Logical OR is true if any operand is true.$jp78$, 1, 1),
  ('tq-java-logical-operators-3', 'pt-java-logical-operators',
   $jp79$The ! operator ___.$jp79$,
   $jp80$["adds two booleans", "reverses a boolean value", "compares two values", "does nothing"]$jp80$::jsonb,
   1, $jp81$! turns true into false and false into true.$jp81$, 1, 2),
  ('tq-java-logical-operators-4', 'pt-java-logical-operators',
   $jp82$"Short-circuit" evaluation means ___.$jp82$,
   $jp83$["the second operand is skipped when the first already decides the result", "both operands are always evaluated", "the result is always true", "the program stops running"]$jp83$::jsonb,
   0, $jp84$&& stops at a false operand, || stops at a true one; the rest is not evaluated.$jp84$, 1, 3),
  ('tq-java-logical-operators-5', 'pt-java-logical-operators',
   $jp85$What is the value of true && false?$jp85$,
   $jp86$["false", "a compile error", "1", "true"]$jp86$::jsonb,
   0, $jp87$AND needs both true; one operand is false, so the result is false.$jp87$, 1, 4),
  ('tq-java-logical-operators-6', 'pt-java-logical-operators',
   $jp88$What is the value of false || true?$jp88$,
   $jp89$["0", "a compile error", "false", "true"]$jp89$::jsonb,
   3, $jp90$OR is true if either operand is true.$jp90$, 1, 5),
  ('tq-java-logical-operators-7', 'pt-java-logical-operators',
   $jp91$What is the value of !(5 > 3)?$jp91$,
   $jp92$["false", "5", "3", "true"]$jp92$::jsonb,
   0, $jp93$5 > 3 is true, and ! reverses it to false.$jp93$, 1, 6),
  ('tq-java-logical-operators-8', 'pt-java-logical-operators',
   $jp94$How does && differ from & for booleans?$jp94$,
   $jp95$["& returns an int", "&& is bitwise", "&& short-circuits; & always evaluates both sides", "they are identical"]$jp95$::jsonb,
   2, $jp96$&& stops early when the result is already known; & (as a boolean operator) evaluates both operands.$jp96$, 1, 7),
  ('tq-java-logical-operators-9', 'pt-java-logical-operators',
   $jp97$Why is (x != 0) && (10 / x > 1) safe from a divide-by-zero?$jp97$,
   $jp98$["|| is used instead", "10 / 0 is allowed in Java", "&& skips the right side when x != 0 is false", "the compiler reorders it"]$jp98$::jsonb,
   2, $jp99$If x is 0, x != 0 is false, so && never evaluates the division.$jp99$, 1, 8),
  ('tq-java-logical-operators-10', 'pt-java-logical-operators',
   $jp100$"Eligible only if attendance > 75 AND fees are paid" is written as ___.$jp100$,
   $jp101$["attendance > 75 || feesPaid", "attendance > 75 && feesPaid", "attendance > 75 & feesPaid == false", "!(attendance > 75) && feesPaid"]$jp101$::jsonb,
   1, $jp102$Both conditions must hold, so join them with &&.$jp102$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-logical-operators' and question_count <> 10;

-- Assignment Operators — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp103$operators-and-input/assignment-operators$jp103$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-assignment-operators', $jp104$Assignment Operators - Quick Test$jp104$, 'aptitude', 10, 10,
  $jp105$10 questions on =, +=, -=, *=, /= and how compound assignment works.$jp105$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp106$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp106$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-assignment-operators-1', 'pt-java-assignment-operators',
   $jp107$a += b is shorthand for ___.$jp107$,
   $jp108$["a = b + a + b", "a = a + b", "b = a + b", "a == a + b"]$jp108$::jsonb,
   1, $jp109$Compound assignment applies the operation and stores the result back into a.$jp109$, 1, 0),
  ('tq-java-assignment-operators-2', 'pt-java-assignment-operators',
   $jp110$After int x = 4; x *= 3; the value of x is ___.$jp110$,
   $jp111$["1", "7", "12", "43"]$jp111$::jsonb,
   2, $jp112$x *= 3 means x = x * 3, so 4 * 3 = 12.$jp112$, 1, 1),
  ('tq-java-assignment-operators-3', 'pt-java-assignment-operators',
   $jp113$The simplest assignment operator is ___.$jp113$,
   $jp114$["=", ":=", "<-", "=="]$jp114$::jsonb,
   0, $jp115$A single = assigns the right-hand value to the left-hand variable.$jp115$, 1, 2),
  ('tq-java-assignment-operators-4', 'pt-java-assignment-operators',
   $jp116$Besides numbers, += also works with which type?$jp116$,
   $jp117$["void", "boolean", "String", "char arrays"]$jp117$::jsonb,
   2, $jp118$s += "x" appends text, because + concatenates Strings.$jp118$, 1, 3),
  ('tq-java-assignment-operators-5', 'pt-java-assignment-operators',
   $jp119$What is wrong with int x; x += 5;?$jp119$,
   $jp120$["x must be given a value before += can use it", "+= only works on double", "5 must be in quotes", "Nothing"]$jp120$::jsonb,
   0, $jp121$x += 5 reads x first (x = x + 5), so x must already be initialized.$jp121$, 1, 4),
  ('tq-java-assignment-operators-6', 'pt-java-assignment-operators',
   $jp122$After int total = 130; total -= 20; total is ___.$jp122$,
   $jp123$["150", "110", "20", "130"]$jp123$::jsonb,
   1, $jp124$total -= 20 means total = total - 20, so 130 - 20 = 110.$jp124$, 1, 5),
  ('tq-java-assignment-operators-7', 'pt-java-assignment-operators',
   $jp125$Which is NOT a valid Java compound assignment operator?$jp125$,
   $jp126$["/=", "+=", "-=", "**="]$jp126$::jsonb,
   3, $jp127$Java has no ** (power) operator, so **= does not exist.$jp127$, 1, 6),
  ('tq-java-assignment-operators-8', 'pt-java-assignment-operators',
   $jp128$After String s = "a"; s += "b" + "c"; s is ___.$jp128$,
   $jp129$["\"bca\"", "\"a b c\"", "\"a\"", "\"abc\""]$jp129$::jsonb,
   3, $jp130$"b" + "c" is "bc", then appended to "a" gives "abc".$jp130$, 1, 7),
  ('tq-java-assignment-operators-9', 'pt-java-assignment-operators',
   $jp131$After int x = 7; x /= 2; the value of x is ___.$jp131$,
   $jp132$["3.5", "3", "4", "2"]$jp132$::jsonb,
   1, $jp133$x is an int, so x /= 2 does integer division: 7 / 2 = 3.$jp133$, 1, 8),
  ('tq-java-assignment-operators-10', 'pt-java-assignment-operators',
   $jp134$Compound assignment operators mainly help by ___.$jp134$,
   $jp135$["shortening repeated updates to the same variable", "avoiding the need for variables", "adding type safety", "making programs run faster"]$jp135$::jsonb,
   0, $jp136$They replace patterns like x = x + y with the shorter x += y.$jp136$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-assignment-operators' and question_count <> 10;

-- Unary Operators — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp137$operators-and-input/unary-operators$jp137$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-unary-operators', $jp138$Unary Operators - Quick Test$jp138$, 'aptitude', 10, 10,
  $jp139$10 questions on ++, --, unary minus and pre- vs post- increment.$jp139$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp140$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp140$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-unary-operators-1', 'pt-java-unary-operators',
   $jp141$A unary operator works on how many operands?$jp141$,
   $jp142$["any number", "one", "two", "three"]$jp142$::jsonb,
   1, $jp143$"Unary" means it acts on a single value.$jp143$, 1, 0),
  ('tq-java-unary-operators-2', 'pt-java-unary-operators',
   $jp144$a++ is called ___.$jp144$,
   $jp145$["unary plus", "pre-increment", "post-increment", "post-decrement"]$jp145$::jsonb,
   2, $jp146$The ++ comes after the variable, so it is post-increment.$jp146$, 1, 1),
  ('tq-java-unary-operators-3', 'pt-java-unary-operators',
   $jp147$After int a = 5; int b = a++; the values are ___.$jp147$,
   $jp148$["b = 5, a = 5", "b = 5, a = 6", "b = 6, a = 6", "b = 6, a = 5"]$jp148$::jsonb,
   1, $jp149$Post-increment uses the old value (5) for b, then increments a to 6.$jp149$, 1, 2),
  ('tq-java-unary-operators-4', 'pt-java-unary-operators',
   $jp150$After int a = 5; int b = ++a; the values are ___.$jp150$,
   $jp151$["b = 5, a = 5", "b = 5, a = 6", "b = 6, a = 6", "b = 6, a = 5"]$jp151$::jsonb,
   2, $jp152$Pre-increment increments a to 6 first, then uses 6 for b.$jp152$, 1, 3),
  ('tq-java-unary-operators-5', 'pt-java-unary-operators',
   $jp153$--x changes x by ___.$jp153$,
   $jp154$["0", "+1", "x itself", "-1"]$jp154$::jsonb,
   3, $jp155$-- decreases the value by one.$jp155$, 1, 4),
  ('tq-java-unary-operators-6', 'pt-java-unary-operators',
   $jp156$The unary minus, as in -a, ___.$jp156$,
   $jp157$["reverses the sign of a", "makes a zero", "doubles a", "subtracts 1 from a"]$jp157$::jsonb,
   0, $jp158$-a is the negation: positive becomes negative and vice versa.$jp158$, 1, 5),
  ('tq-java-unary-operators-7', 'pt-java-unary-operators',
   $jp159$Which of these is a unary operator?$jp159$,
   $jp160$["+ used between two numbers", "++", "&&", "*"]$jp160$::jsonb,
   1, $jp161$++ operates on one variable; the others need two operands.$jp161$, 1, 6),
  ('tq-java-unary-operators-8', 'pt-java-unary-operators',
   $jp162$In int y = x++; the value assigned to y is ___.$jp162$,
   $jp163$["x before it is incremented", "x after it is incremented", "always 0", "always 1"]$jp163$::jsonb,
   0, $jp164$Post-increment yields the current value first, then increments.$jp164$, 1, 7),
  ('tq-java-unary-operators-9', 'pt-java-unary-operators',
   $jp165$After int i = 0; i++; i++; i--; the value of i is ___.$jp165$,
   $jp166$["1", "2", "3", "0"]$jp166$::jsonb,
   0, $jp167$Two increments and one decrement: 0 + 1 + 1 - 1 = 1.$jp167$, 1, 8),
  ('tq-java-unary-operators-10', 'pt-java-unary-operators',
   $jp168$Pre- and post-increment differ in ___.$jp168$,
   $jp169$["which types they support", "nothing at all", "how much they add", "whether the value is used before or after the increment"]$jp169$::jsonb,
   3, $jp170$Both add 1; they differ only in the value the expression produces.$jp170$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-unary-operators' and question_count <> 10;

-- Ternary Operator — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp171$operators-and-input/ternary-operator$jp171$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-ternary-operator', $jp172$Ternary Operator - Quick Test$jp172$, 'aptitude', 10, 10,
  $jp173$10 questions on the condition ? valueIfTrue : valueIfFalse shortcut.$jp173$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp174$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp174$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-ternary-operator-1', 'pt-java-ternary-operator',
   $jp175$The ternary operator has how many parts?$jp175$,
   $jp176$["two", "three", "four", "one"]$jp176$::jsonb,
   1, $jp177$A condition, a value if true, and a value if false — three parts.$jp177$, 1, 0),
  ('tq-java-ternary-operator-2', 'pt-java-ternary-operator',
   $jp178$What is the correct ternary syntax?$jp178$,
   $jp179$["if condition then valueIfTrue else valueIfFalse", "condition ?? valueIfTrue :: valueIfFalse", "condition ? valueIfTrue : valueIfFalse", "condition : valueIfTrue ? valueIfFalse"]$jp179$::jsonb,
   2, $jp180$The ? separates the condition from the true value, and : separates the true and false values.$jp180$, 1, 1),
  ('tq-java-ternary-operator-3', 'pt-java-ternary-operator',
   $jp181$What is the value of x after int x = (5 > 3) ? 1 : 0;?$jp181$,
   $jp182$["5", "3", "0", "1"]$jp182$::jsonb,
   3, $jp183$5 > 3 is true, so x gets the value after the ? which is 1.$jp183$, 1, 2),
  ('tq-java-ternary-operator-4', 'pt-java-ternary-operator',
   $jp184$The ternary operator is a shortcut for ___.$jp184$,
   $jp185$["a method call", "a simple if-else", "a switch with many cases", "a loop"]$jp185$::jsonb,
   1, $jp186$It compactly chooses one of two values based on a condition.$jp186$, 1, 3),
  ('tq-java-ternary-operator-5', 'pt-java-ternary-operator',
   $jp187$For int n = 4; what does (n % 2 == 0) ? "Even" : "Odd" produce?$jp187$,
   $jp188$["true", "4", "\"Even\"", "\"Odd\""]$jp188$::jsonb,
   2, $jp189$4 % 2 is 0, so the condition is true and the result is "Even".$jp189$, 1, 4),
  ('tq-java-ternary-operator-6', 'pt-java-ternary-operator',
   $jp190$The ternary operator is an ___ because it produces a value.$jp190$,
   $jp191$["operator only", "import", "statement", "expression"]$jp191$::jsonb,
   3, $jp192$It evaluates to a value, so it can be assigned or printed directly.$jp192$, 1, 5),
  ('tq-java-ternary-operator-7', 'pt-java-ternary-operator',
   $jp193$What does (a > b) ? a : b compute?$jp193$,
   $jp194$["the larger of a and b", "a + b", "whether a equals b", "the smaller of a and b"]$jp194$::jsonb,
   0, $jp195$It returns a when a is greater, otherwise b — the maximum.$jp195$, 1, 6),
  ('tq-java-ternary-operator-8', 'pt-java-ternary-operator',
   $jp196$Nested ternary expressions are ___.$jp196$,
   $jp197$["not allowed in Java", "allowed but discouraged for readability", "faster than if-else", "required for three outcomes"]$jp197$::jsonb,
   1, $jp198$They compile, but deep nesting is hard to read and is best replaced by if-else.$jp198$, 1, 7),
  ('tq-java-ternary-operator-9', 'pt-java-ternary-operator',
   $jp199$What is the value of int r = (false) ? 10 : 20;?$jp199$,
   $jp200$["20", "0", "false", "10"]$jp200$::jsonb,
   0, $jp201$The condition is false, so r gets the value after the colon, 20.$jp201$, 1, 8),
  ('tq-java-ternary-operator-10', 'pt-java-ternary-operator',
   $jp202$Which situation is best replaced by a ternary?$jp202$,
   $jp203$["choosing one of two values based on a condition", "iterating over a list", "reading user input", "a twenty-line decision with side effects"]$jp203$::jsonb,
   0, $jp204$The ternary shines for simple "pick A or B" value selection.$jp204$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-ternary-operator' and question_count <> 10;

-- Bitwise Operators — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp205$operators-and-input/bitwise-operators$jp205$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-bitwise-operators', $jp206$Bitwise Operators - Quick Test$jp206$, 'aptitude', 10, 10,
  $jp207$10 questions on &, |, ^, ~, << and >> working on the bits of a number.$jp207$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp208$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp208$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-bitwise-operators-1', 'pt-java-bitwise-operators',
   $jp209$Bitwise operators operate on ___.$jp209$,
   $jp210$["the decimal value as a whole", "the individual bits of a number", "only positive numbers", "strings of text"]$jp210$::jsonb,
   1, $jp211$They work bit by bit on the binary representation.$jp211$, 1, 0),
  ('tq-java-bitwise-operators-2', 'pt-java-bitwise-operators',
   $jp212$What is 5 & 3?$jp212$,
   $jp213$["8", "1", "7", "6"]$jp213$::jsonb,
   1, $jp214$0101 & 0011 = 0001, which is 1.$jp214$, 1, 1),
  ('tq-java-bitwise-operators-3', 'pt-java-bitwise-operators',
   $jp215$What is 5 | 3?$jp215$,
   $jp216$["6", "2", "1", "7"]$jp216$::jsonb,
   3, $jp217$0101 | 0011 = 0111, which is 7.$jp217$, 1, 2),
  ('tq-java-bitwise-operators-4', 'pt-java-bitwise-operators',
   $jp218$What is 5 ^ 3?$jp218$,
   $jp219$["6", "0", "1", "7"]$jp219$::jsonb,
   0, $jp220$XOR: 0101 ^ 0011 = 0110, which is 6.$jp220$, 1, 3),
  ('tq-java-bitwise-operators-5', 'pt-java-bitwise-operators',
   $jp221$a << 1 roughly ___ a.$jp221$,
   $jp222$["negates", "leaves unchanged", "halves", "doubles"]$jp222$::jsonb,
   3, $jp223$Shifting left by one bit multiplies by 2.$jp223$, 1, 4),
  ('tq-java-bitwise-operators-6', 'pt-java-bitwise-operators',
   $jp224$a >> 1 roughly ___ a.$jp224$,
   $jp225$["leaves unchanged", "doubles", "halves", "squares"]$jp225$::jsonb,
   2, $jp226$Shifting right by one bit divides by 2 (discarding the low bit).$jp226$, 1, 5),
  ('tq-java-bitwise-operators-7', 'pt-java-bitwise-operators',
   $jp227$~a is the ___.$jp227$,
   $jp228$["remainder", "bitwise complement (NOT)", "bitwise AND", "left shift"]$jp228$::jsonb,
   1, $jp229$~ flips every bit of the number.$jp229$, 1, 6),
  ('tq-java-bitwise-operators-8', 'pt-java-bitwise-operators',
   $jp230$How does & differ from && for booleans?$jp230$,
   $jp231$["& does not short-circuit; it always evaluates both sides", "they are identical", "& returns a double", "& is only for strings"]$jp231$::jsonb,
   0, $jp232$&& stops early when the result is known; & (and the bitwise operators) evaluate fully.$jp232$, 1, 7),
  ('tq-java-bitwise-operators-9', 'pt-java-bitwise-operators',
   $jp233$What is 1 << 4?$jp233$,
   $jp234$["16", "32", "5", "8"]$jp234$::jsonb,
   0, $jp235$1 shifted left 4 places is 10000 in binary, which is 16.$jp235$, 1, 8),
  ('tq-java-bitwise-operators-10', 'pt-java-bitwise-operators',
   $jp236$What is 6 ^ 6?$jp236$,
   $jp237$["6", "12", "0", "1"]$jp237$::jsonb,
   2, $jp238$XOR of any value with itself is 0 (every bit matches).$jp238$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-bitwise-operators' and question_count <> 10;

-- User Input — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp239$operators-and-input/user-input$jp239$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-user-input', $jp240$User Input - Quick Test$jp240$, 'aptitude', 10, 10,
  $jp241$10 questions on reading keyboard input with the Scanner class.$jp241$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp242$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp242$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-user-input-1', 'pt-java-user-input',
   $jp243$Which class is commonly used to read keyboard input in Java?$jp243$,
   $jp244$["Scanner", "Console", "InputBox", "Reader"]$jp244$::jsonb,
   0, $jp245$java.util.Scanner reads tokens and lines from an input source.$jp245$, 1, 0),
  ('tq-java-user-input-2', 'pt-java-user-input',
   $jp246$Before using Scanner you must ___.$jp246$,
   $jp247$["call System.gc()", "declare it final", "import java.util.Scanner", "extend Scanner"]$jp247$::jsonb,
   2, $jp248$Scanner lives in java.util, so it needs an import statement.$jp248$, 1, 1),
  ('tq-java-user-input-3', 'pt-java-user-input',
   $jp249$sc.nextInt() reads ___.$jp249$,
   $jp250$["all remaining input", "a whole line of text", "the next integer token", "a single character"]$jp250$::jsonb,
   2, $jp251$nextInt parses the next whitespace-separated token as an int.$jp251$, 1, 2),
  ('tq-java-user-input-4', 'pt-java-user-input',
   $jp252$Mixing nextInt() then nextLine() can misbehave because ___.$jp252$,
   $jp253$["nextLine() is deprecated", "nextInt() leaves the line's newline, which nextLine() then reads as empty", "nextInt() closes the Scanner", "nextLine() only reads numbers"]$jp253$::jsonb,
   1, $jp254$nextInt() stops before the newline; the next nextLine() consumes that leftover newline.$jp254$, 1, 3),
  ('tq-java-user-input-5', 'pt-java-user-input',
   $jp255$new Scanner(System.in) reads from ___.$jp255$,
   $jp256$["standard input (the keyboard)", "the clipboard", "a file", "the network"]$jp256$::jsonb,
   0, $jp257$System.in is the standard input stream.$jp257$, 1, 4),
  ('tq-java-user-input-6', 'pt-java-user-input',
   $jp258$To read an entire line of text, use ___.$jp258$,
   $jp259$["sc.getLine()", "sc.nextLine()", "sc.nextInt()", "sc.readLine()"]$jp259$::jsonb,
   1, $jp260$nextLine() returns everything up to the end of the current line.$jp260$, 1, 5),
  ('tq-java-user-input-7', 'pt-java-user-input',
   $jp261$In real projects, once you are done reading you should ___.$jp261$,
   $jp262$["restart the JVM", "close the Scanner with sc.close()", "set it to 0", "call sc.flush()"]$jp262$::jsonb,
   1, $jp263$Closing the Scanner releases the underlying resource.$jp263$, 1, 6),
  ('tq-java-user-input-8', 'pt-java-user-input',
   $jp264$sc.next() reads ___.$jp264$,
   $jp265$["one number only", "nothing", "a full line", "a single whitespace-delimited token"]$jp265$::jsonb,
   3, $jp266$next() returns the next token, stopping at the next whitespace.$jp266$, 1, 7),
  ('tq-java-user-input-9', 'pt-java-user-input',
   $jp267$Without user input, a program can only ___.$jp267$,
   $jp268$["work with fixed, hardcoded values", "run on the JVM", "use loops", "print numbers"]$jp268$::jsonb,
   0, $jp269$Input is what lets a program react to different data each run.$jp269$, 1, 8),
  ('tq-java-user-input-10', 'pt-java-user-input',
   $jp270$sc.nextDouble() returns a value of type ___.$jp270$,
   $jp271$["String", "float", "int", "double"]$jp271$::jsonb,
   3, $jp272$nextDouble parses the next token as a double.$jp272$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-user-input' and question_count <> 10;

-- Command-Line Arguments — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp273$operators-and-input/command-line-arguments$jp273$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-command-line-arguments', $jp274$Command-Line Arguments - Quick Test$jp274$, 'aptitude', 10, 10,
  $jp275$10 questions on values passed through String[] args when a program starts.$jp275$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp276$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp276$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-command-line-arguments-1', 'pt-java-command-line-arguments',
   $jp277$Command-line arguments arrive inside which parameter?$jp277$,
   $jp278$["Scanner input", "String[] args of main", "System.env", "a global list"]$jp278$::jsonb,
   1, $jp279$They are delivered as the String array named args in the main method.$jp279$, 1, 0),
  ('tq-java-command-line-arguments-2', 'pt-java-command-line-arguments',
   $jp280$What is the type of args?$jp280$,
   $jp281$["String[]", "Object", "char[]", "int[]"]$jp281$::jsonb,
   0, $jp282$args is always an array of String.$jp282$, 1, 1),
  ('tq-java-command-line-arguments-3', 'pt-java-command-line-arguments',
   $jp283$How do you find how many arguments were passed?$jp283$,
   $jp284$["args.length", "args.total()", "args.size()", "args.count"]$jp284$::jsonb,
   0, $jp285$args.length gives the number of elements, like any array.$jp285$, 1, 2),
  ('tq-java-command-line-arguments-4', 'pt-java-command-line-arguments',
   $jp286$To use a numeric argument as a number you must ___.$jp286$,
   $jp287$["nothing, it is already an int", "wrap it in quotes", "cast it with (int)", "convert it, e.g. Integer.parseInt(args[0])"]$jp287$::jsonb,
   3, $jp288$Arguments are Strings; parse them to get a numeric value.$jp288$, 1, 3),
  ('tq-java-command-line-arguments-5', 'pt-java-command-line-arguments',
   $jp289$When are command-line arguments supplied?$jp289$,
   $jp290$["while the program is running, via the keyboard", "before the program starts, on the launch command", "only after main returns", "randomly during execution"]$jp290$::jsonb,
   1, $jp291$They are typed on the java command that starts the program.$jp291$, 1, 4),
  ('tq-java-command-line-arguments-6', 'pt-java-command-line-arguments',
   $jp292$Running java Demo Rahul makes args[0] equal to ___.$jp292$,
   $jp293$["an empty string", "\"Demo\"", "\"Rahul\"", "\"java\""]$jp293$::jsonb,
   2, $jp294$The program name is not included; the first real argument is args[0].$jp294$, 1, 5),
  ('tq-java-command-line-arguments-7', 'pt-java-command-line-arguments',
   $jp295$If no arguments are passed, args.length is ___.$jp295$,
   $jp296$["null", "-1", "0", "1"]$jp296$::jsonb,
   2, $jp297$args is a valid array with zero elements.$jp297$, 1, 6),
  ('tq-java-command-line-arguments-8', 'pt-java-command-line-arguments',
   $jp298$Reading args[0] when no arguments were passed causes ___.$jp298$,
   $jp299$["it returns null quietly", "it returns \"\"", "a compile error", "an ArrayIndexOutOfBoundsException at runtime"]$jp299$::jsonb,
   3, $jp300$Indexing past the end of the (empty) array throws at runtime; guard with args.length first.$jp300$, 1, 7),
  ('tq-java-command-line-arguments-9', 'pt-java-command-line-arguments',
   $jp301$How do command-line arguments differ from Scanner input?$jp301$,
   $jp302$["args are fixed at launch and always String; Scanner reads typed values while running", "Scanner can only read numbers", "args can only hold one value", "there is no difference"]$jp302$::jsonb,
   0, $jp303$Timing (launch vs during run) and typing (always String vs typed methods) are the key differences.$jp303$, 1, 8),
  ('tq-java-command-line-arguments-10', 'pt-java-command-line-arguments',
   $jp304$java Sum 8 5 with System.out.println(args[0] + args[1]); prints ___.$jp304$,
   $jp305$["13", "85", "\"8\" \"5\"", "a compile error"]$jp305$::jsonb,
   1, $jp306$args[0] and args[1] are the Strings "8" and "5", so + concatenates them into "85".$jp306$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-command-line-arguments' and question_count <> 10;

-- ===========================================================================
-- 2. CODING PROBLEMS — 4 per coding topic. dsa_problems, topic_id NULL,
--    learning_topic_id set, Java-only. Skips a slug already taken.
-- ===========================================================================

-- Arithmetic Operators — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp307$operators-and-input/arithmetic-operators$jp307$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-arithmetic-operators-1', null::text, $jp308$Five Arithmetic Results$jp308$, 'Easy', 'java-arithmetic-operators-five-results',
   $jp309$Read two integers `a` and `b` and print the five basic arithmetic results.

**Input:** two integers separated by whitespace (`b` is not zero).

**Output:** five lines:

```
Sum: <a+b>
Difference: <a-b>
Product: <a*b>
Quotient: <a/b>
Remainder: <a%b>
```$jp309$,
   $jp310$[{"input": "17 5", "output": "Sum: 22\nDifference: 12\nProduct: 85\nQuotient: 3\nRemainder: 2"}]$jp310$::jsonb,
   $jp311$["-100000 <= a, b <= 100000", "b != 0"]$jp311$::jsonb,
   jsonb_build_object('java', $jp312$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        // print the five labelled results
    }
}
$jp312$),
   $jp313$["Use +, -, *, / and % on a and b.", "Quotient uses integer division; Remainder uses %."]$jp313$::jsonb,
   $jp314$[{"input": "17 5", "expected": "Sum: 22\nDifference: 12\nProduct: 85\nQuotient: 3\nRemainder: 2", "hidden": false}, {"input": "10 3", "expected": "Sum: 13\nDifference: 7\nProduct: 30\nQuotient: 3\nRemainder: 1", "hidden": true}, {"input": "-9 4", "expected": "Sum: -5\nDifference: -13\nProduct: -36\nQuotient: -2\nRemainder: -1", "hidden": true}, {"input": "100 100", "expected": "Sum: 200\nDifference: 0\nProduct: 10000\nQuotient: 1\nRemainder: 0", "hidden": true}]$jp314$::jsonb,
   $jp315$Apply each of the five arithmetic operators to a and b. Remember that / on two ints truncates and % returns the remainder (with the sign of the left operand).$jp315$,
   jsonb_build_object('java', $jp316$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println("Sum: " + (a + b));
        System.out.println("Difference: " + (a - b));
        System.out.println("Product: " + (a * b));
        System.out.println("Quotient: " + (a / b));
        System.out.println("Remainder: " + (a % b));
    }
}
$jp316$),
   array['java'], 'published', false, 0),
  ('cp-java-arithmetic-operators-2', null::text, $jp317$Average of Two Integers$jp317$, 'Easy', 'java-arithmetic-operators-average-two',
   $jp318$Read two integers and print their average as a decimal with exactly two places. Because `int / int` drops the fraction, you must divide by `2.0`.

**Input:** two integers separated by whitespace.

**Output:** one line — the average, two digits after the decimal point.$jp318$,
   $jp319$[{"input": "7 2", "output": "4.50"}]$jp319$::jsonb,
   $jp320$["-1000000 <= a, b <= 1000000"]$jp320$::jsonb,
   jsonb_build_object('java', $jp321$import java.util.Scanner;
import java.util.Locale;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        // divide by 2.0 and print to 2 decimals
    }
}
$jp321$),
   $jp322$["(a + b) / 2.0 keeps the fraction; (a + b) / 2 would not.", "String.format(Locale.US, \"%.2f\", value) prints two decimal places with a dot."]$jp322$::jsonb,
   $jp323$[{"input": "7 2", "expected": "4.50", "hidden": false}, {"input": "10 20", "expected": "15.00", "hidden": true}, {"input": "-3 -4", "expected": "-3.50", "hidden": true}, {"input": "5 6", "expected": "5.50", "hidden": true}]$jp323$::jsonb,
   $jp324$The sum of two ints is an int; dividing it by 2.0 (a double) forces floating-point division so the .5 is not lost. Format the result to two decimals.$jp324$,
   jsonb_build_object('java', $jp325$import java.util.Scanner;
import java.util.Locale;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        double avg = (a + b) / 2.0;
        System.out.println(String.format(Locale.US, "%.2f", avg));
    }
}
$jp325$),
   array['java'], 'published', false, 1),
  ('cp-java-arithmetic-operators-3', null::text, $jp326$Seconds to H M S$jp326$, 'Medium', 'java-arithmetic-operators-seconds-to-hms',
   $jp327$Read a whole number of seconds and break it into hours, minutes and seconds using `/` and `%`.

**Input:** one non-negative integer — a number of seconds.

**Output:** one line: `<h>h <m>m <s>s`$jp327$,
   $jp328$[{"input": "3661", "output": "1h 1m 1s"}]$jp328$::jsonb,
   $jp329$["0 <= seconds <= 1000000"]$jp329$::jsonb,
   jsonb_build_object('java', $jp330$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int total = sc.nextInt();
        // hours = total / 3600, then use the remainder for minutes and seconds
    }
}
$jp330$),
   $jp331$["hours = total / 3600; remaining = total % 3600.", "minutes = remaining / 60; seconds = remaining % 60."]$jp331$::jsonb,
   $jp332$[{"input": "3661", "expected": "1h 1m 1s", "hidden": false}, {"input": "59", "expected": "0h 0m 59s", "hidden": true}, {"input": "7325", "expected": "2h 2m 5s", "hidden": true}, {"input": "0", "expected": "0h 0m 0s", "hidden": true}]$jp332$::jsonb,
   $jp333$Integer division by 3600 gives whole hours; the remainder (% 3600) is the leftover seconds, which you split again by 60 for minutes and seconds. This is the classic use of / and % together.$jp333$,
   jsonb_build_object('java', $jp334$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int total = sc.nextInt();
        int hours = total / 3600;
        int remaining = total % 3600;
        int minutes = remaining / 60;
        int seconds = remaining % 60;
        System.out.println(hours + "h " + minutes + "m " + seconds + "s");
    }
}
$jp334$),
   array['java'], 'published', false, 2),
  ('cp-java-arithmetic-operators-4', null::text, $jp335$Last Digit and the Rest$jp335$, 'Easy', 'java-arithmetic-operators-split-last-digit',
   $jp336$Read a non-negative integer and split it into its last digit and everything before it, using `% 10` and `/ 10`.

**Input:** one non-negative integer.

**Output:** one line: `<last digit> <the number without its last digit>`$jp336$,
   $jp337$[{"input": "472", "output": "2 47"}]$jp337$::jsonb,
   $jp338$["0 <= n <= 2000000000"]$jp338$::jsonb,
   jsonb_build_object('java', $jp339$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        // print n % 10, then n / 10
    }
}
$jp339$),
   $jp340$["n % 10 is the last digit.", "n / 10 (integer division) drops the last digit."]$jp340$::jsonb,
   $jp341$[{"input": "472", "expected": "2 47", "hidden": false}, {"input": "5", "expected": "5 0", "hidden": true}, {"input": "0", "expected": "0 0", "hidden": true}, {"input": "1000000007", "expected": "7 100000000", "hidden": true}]$jp341$::jsonb,
   $jp342$% 10 isolates the units digit; / 10 shifts the number right by one digit. For a single-digit number, n / 10 is 0.$jp342$,
   jsonb_build_object('java', $jp343$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        System.out.println((n % 10) + " " + (n / 10));
    }
}
$jp343$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Relational Operators — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp344$operators-and-input/relational-operators$jp344$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-relational-operators-1', null::text, $jp345$Compare Two Numbers Six Ways$jp345$, 'Easy', 'java-relational-operators-compare-two',
   $jp346$Read two integers and print the result of all six relational operators.

**Input:** two integers separated by whitespace.

**Output:** six lines:

```
== <bool>
!= <bool>
> <bool>
< <bool>
>= <bool>
<= <bool>
```$jp346$,
   $jp347$[{"input": "5 3", "output": "== false\n!= true\n> true\n< false\n>= true\n<= false"}]$jp347$::jsonb,
   $jp348$["-1000000000 <= a, b <= 1000000000"]$jp348$::jsonb,
   jsonb_build_object('java', $jp349$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.nextLong();
        long b = sc.nextLong();
        // print each comparison's boolean result
    }
}
$jp349$),
   $jp350$["Each expression like (a > b) is already a boolean you can print.", "Concatenate the label and the boolean: \"> \" + (a > b)."]$jp350$::jsonb,
   $jp351$[{"input": "5 3", "expected": "== false\n!= true\n> true\n< false\n>= true\n<= false", "hidden": false}, {"input": "4 4", "expected": "== true\n!= false\n> false\n< false\n>= true\n<= true", "hidden": true}, {"input": "-2 7", "expected": "== false\n!= true\n> false\n< true\n>= false\n<= true", "hidden": true}]$jp351$::jsonb,
   $jp352$Every relational expression evaluates to a boolean. Print each of the six directly. Note that for equal values both >= and <= are true while > and < are false.$jp352$,
   jsonb_build_object('java', $jp353$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.nextLong();
        long b = sc.nextLong();
        System.out.println("== " + (a == b));
        System.out.println("!= " + (a != b));
        System.out.println("> " + (a > b));
        System.out.println("< " + (a < b));
        System.out.println(">= " + (a >= b));
        System.out.println("<= " + (a <= b));
    }
}
$jp353$),
   array['java'], 'published', false, 0),
  ('cp-java-relational-operators-2', null::text, $jp354$Larger of Two (No Math.max)$jp354$, 'Easy', 'java-relational-operators-max-of-two',
   $jp355$Read two integers and print the larger one, using a relational comparison (do not use `Math.max`).

**Input:** two integers separated by whitespace.

**Output:** one line — the larger value (or either one if they are equal).$jp355$,
   $jp356$[{"input": "5 3", "output": "5"}, {"input": "2 9", "output": "9"}]$jp356$::jsonb,
   $jp357$["-1000000000 <= a, b <= 1000000000"]$jp357$::jsonb,
   jsonb_build_object('java', $jp358$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.nextLong();
        long b = sc.nextLong();
        // compare a and b, print the larger
    }
}
$jp358$),
   $jp359$["Use if (a > b) ... else ...", "When they are equal, printing either is fine."]$jp359$::jsonb,
   $jp360$[{"input": "5 3", "expected": "5", "hidden": false}, {"input": "2 9", "expected": "9", "hidden": false}, {"input": "4 4", "expected": "4", "hidden": true}, {"input": "-10 -3", "expected": "-3", "hidden": true}]$jp360$::jsonb,
   $jp361$Compare with >; if a is greater print a, otherwise print b. This also covers the equal case correctly.$jp361$,
   jsonb_build_object('java', $jp362$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.nextLong();
        long b = sc.nextLong();
        if (a > b) {
            System.out.println(a);
        } else {
            System.out.println(b);
        }
    }
}
$jp362$),
   array['java'], 'published', false, 1),
  ('cp-java-relational-operators-3', null::text, $jp363$Is It In Range?$jp363$, 'Easy', 'java-relational-operators-in-range',
   $jp364$Read three integers `x`, `lo` and `hi`. Print `true` if `lo <= x <= hi` (inclusive), otherwise `false`.

**Input:** three integers separated by whitespace, in the order x lo hi (lo <= hi).

**Output:** one line — `true` or `false`.$jp364$,
   $jp365$[{"input": "5 1 10", "output": "true"}, {"input": "15 1 10", "output": "false"}]$jp365$::jsonb,
   $jp366$["-1000000000 <= x, lo, hi <= 1000000000", "lo <= hi"]$jp366$::jsonb,
   jsonb_build_object('java', $jp367$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long x = sc.nextLong();
        long lo = sc.nextLong();
        long hi = sc.nextLong();
        // print whether lo <= x AND x <= hi
    }
}
$jp367$),
   $jp368$["Java has no lo <= x <= hi; write it as two comparisons joined with &&.", "boolean inRange = x >= lo && x <= hi;"]$jp368$::jsonb,
   $jp369$[{"input": "5 1 10", "expected": "true", "hidden": false}, {"input": "15 1 10", "expected": "false", "hidden": false}, {"input": "1 1 10", "expected": "true", "hidden": true}, {"input": "10 1 10", "expected": "true", "hidden": true}, {"input": "-5 -10 -1", "expected": "true", "hidden": true}]$jp369$::jsonb,
   $jp370$Chained comparisons are not allowed in Java, so combine two relational checks with &&: x is in range when x >= lo and x <= hi. Both boundary values count because the range is inclusive.$jp370$,
   jsonb_build_object('java', $jp371$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long x = sc.nextLong();
        long lo = sc.nextLong();
        long hi = sc.nextLong();
        boolean inRange = x >= lo && x <= hi;
        System.out.println(inRange);
    }
}
$jp371$),
   array['java'], 'published', false, 2),
  ('cp-java-relational-operators-4', null::text, $jp372$Sign of a Number$jp372$, 'Easy', 'java-relational-operators-sign',
   $jp373$Read an integer and print `positive`, `negative` or `zero` based on relational comparisons with 0.

**Input:** one integer.

**Output:** one line — `positive`, `negative` or `zero`.$jp373$,
   $jp374$[{"input": "7", "output": "positive"}, {"input": "-3", "output": "negative"}]$jp374$::jsonb,
   $jp375$["-1000000000 <= n <= 1000000000"]$jp375$::jsonb,
   jsonb_build_object('java', $jp376$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        // compare n with 0 and print the right word
    }
}
$jp376$),
   $jp377$["Test n > 0, then n < 0, otherwise it is zero.", "Use if / else if / else."]$jp377$::jsonb,
   $jp378$[{"input": "7", "expected": "positive", "hidden": false}, {"input": "-3", "expected": "negative", "hidden": false}, {"input": "0", "expected": "zero", "hidden": true}, {"input": "1000000000", "expected": "positive", "hidden": true}]$jp378$::jsonb,
   $jp379$Three outcomes, decided by comparing n against 0: greater than 0 is positive, less than 0 is negative, and the remaining case is zero.$jp379$,
   jsonb_build_object('java', $jp380$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        if (n > 0) {
            System.out.println("positive");
        } else if (n < 0) {
            System.out.println("negative");
        } else {
            System.out.println("zero");
        }
    }
}
$jp380$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Logical Operators — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp381$operators-and-input/logical-operators$jp381$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-logical-operators-1', null::text, $jp382$Exam Eligibility$jp382$, 'Easy', 'java-logical-operators-exam-eligible',
   $jp383$A student may sit the exam only if attendance is **above** 75 **and** fees are paid.

**Input:** two lines — line 1 is the attendance percentage (an integer), line 2 is `true` or `false` for fees paid.

**Output:** one line — `true` if eligible, otherwise `false`.$jp383$,
   $jp384$[{"input": "80\ntrue", "output": "true"}]$jp384$::jsonb,
   $jp385$["0 <= attendance <= 100"]$jp385$::jsonb,
   jsonb_build_object('java', $jp386$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int attendance = Integer.parseInt(sc.next());
        boolean feesPaid = Boolean.parseBoolean(sc.next());
        // print (attendance > 75) && feesPaid
    }
}
$jp386$),
   $jp387$["Combine the two conditions with &&.", "attendance > 75 is a boolean; feesPaid is already a boolean."]$jp387$::jsonb,
   $jp388$[{"input": "80\ntrue", "expected": "true", "hidden": false}, {"input": "80\nfalse", "expected": "false", "hidden": true}, {"input": "70\ntrue", "expected": "false", "hidden": true}, {"input": "75\ntrue", "expected": "false", "hidden": true}]$jp388$::jsonb,
   $jp389$Both parts must be true: attendance strictly greater than 75, and fees paid. Joining them with && gives the answer. Note 75 itself is not "above 75", so 75 with fees paid is still false.$jp389$,
   jsonb_build_object('java', $jp390$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int attendance = Integer.parseInt(sc.next());
        boolean feesPaid = Boolean.parseBoolean(sc.next());
        boolean eligible = (attendance > 75) && feesPaid;
        System.out.println(eligible);
    }
}
$jp390$),
   array['java'], 'published', false, 0),
  ('cp-java-logical-operators-2', null::text, $jp391$Leap Year Check$jp391$, 'Medium', 'java-logical-operators-leap-year',
   $jp392$A year is a leap year if it is divisible by 4 **and not** by 100, **or** if it is divisible by 400.

**Input:** one integer — the year.

**Output:** one line — `Leap` or `Not leap`.$jp392$,
   $jp393$[{"input": "2000", "output": "Leap"}, {"input": "1900", "output": "Not leap"}]$jp393$::jsonb,
   $jp394$["1 <= year <= 100000"]$jp394$::jsonb,
   jsonb_build_object('java', $jp395$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int year = sc.nextInt();
        // ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)
    }
}
$jp395$),
   $jp396$["Translate the rule directly into && and ||.", "Use parentheses to group the \"divisible by 4 and not by 100\" part."]$jp396$::jsonb,
   $jp397$[{"input": "2000", "expected": "Leap", "hidden": false}, {"input": "1900", "expected": "Not leap", "hidden": false}, {"input": "2024", "expected": "Leap", "hidden": true}, {"input": "2023", "expected": "Not leap", "hidden": true}, {"input": "2400", "expected": "Leap", "hidden": true}]$jp397$::jsonb,
   $jp398$The rule is a single boolean expression: (divisible by 4 AND not by 100) OR (divisible by 400). 2000 passes via the divisible-by-400 clause; 1900 fails both clauses.$jp398$,
   jsonb_build_object('java', $jp399$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int year = sc.nextInt();
        boolean leap = ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
        System.out.println(leap ? "Leap" : "Not leap");
    }
}
$jp399$),
   array['java'], 'published', false, 1),
  ('cp-java-logical-operators-3', null::text, $jp400$Login Check with &&$jp400$, 'Easy', 'java-logical-operators-login-check',
   $jp401$Access is granted only if **both** the username and the password match the expected values.

**Input:** four lines — expected username, expected password, entered username, entered password.

**Output:** one line — `Access granted` or `Access denied`.$jp401$,
   $jp402$[{"input": "admin\nsecret\nadmin\nsecret", "output": "Access granted"}]$jp402$::jsonb,
   $jp403$["each value is one line, 1..30 characters, no spaces"]$jp403$::jsonb,
   jsonb_build_object('java', $jp404$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String expUser = sc.nextLine().trim();
        String expPass = sc.nextLine().trim();
        String gotUser = sc.nextLine().trim();
        String gotPass = sc.nextLine().trim();
        // grant only if both match
    }
}
$jp404$),
   $jp405$["Compare strings with .equals, not ==.", "expUser.equals(gotUser) && expPass.equals(gotPass)"]$jp405$::jsonb,
   $jp406$[{"input": "admin\nsecret\nadmin\nsecret", "expected": "Access granted", "hidden": false}, {"input": "admin\nsecret\nadmin\nwrong", "expected": "Access denied", "hidden": true}, {"input": "admin\nsecret\nguest\nsecret", "expected": "Access denied", "hidden": true}, {"input": "a\nb\na\nb", "expected": "Access granted", "hidden": true}]$jp406$::jsonb,
   $jp407$Both the username check and the password check must be true, so combine the two .equals results with &&. If either fails, access is denied.$jp407$,
   jsonb_build_object('java', $jp408$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String expUser = sc.nextLine().trim();
        String expPass = sc.nextLine().trim();
        String gotUser = sc.nextLine().trim();
        String gotPass = sc.nextLine().trim();
        boolean ok = expUser.equals(gotUser) && expPass.equals(gotPass);
        System.out.println(ok ? "Access granted" : "Access denied");
    }
}
$jp408$),
   array['java'], 'published', false, 2),
  ('cp-java-logical-operators-4', null::text, $jp409$De Morgan's Law$jp409$, 'Medium', 'java-logical-operators-de-morgan',
   $jp410$Read two booleans `p` and `q`. Print the value of `!(p && q)` and the value of `!p || !q` — De Morgan's law says they are always equal.

**Input:** one line with two words, each `true` or `false`.

**Output:** one line: `<!(p && q)> <!p || !q>` (they will match).$jp410$,
   $jp411$[{"input": "true false", "output": "true true"}]$jp411$::jsonb,
   $jp412$["each value is true or false"]$jp412$::jsonb,
   jsonb_build_object('java', $jp413$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        boolean p = Boolean.parseBoolean(sc.next());
        boolean q = Boolean.parseBoolean(sc.next());
        // print !(p && q) then !p || !q
    }
}
$jp413$),
   $jp414$["Compute both expressions separately.", "! has higher precedence than && and ||, but parentheses make it clearer."]$jp414$::jsonb,
   $jp415$[{"input": "true false", "expected": "true true", "hidden": false}, {"input": "true true", "expected": "false false", "hidden": false}, {"input": "false false", "expected": "true true", "hidden": true}, {"input": "false true", "expected": "true true", "hidden": true}]$jp415$::jsonb,
   $jp416$!(p && q) is the negation of "both true". De Morgan's law rewrites it as !p || !q — "at least one is false". The two columns are identical for every combination of p and q.$jp416$,
   jsonb_build_object('java', $jp417$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        boolean p = Boolean.parseBoolean(sc.next());
        boolean q = Boolean.parseBoolean(sc.next());
        boolean left = !(p && q);
        boolean right = !p || !q;
        System.out.println(left + " " + right);
    }
}
$jp417$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Assignment Operators — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp418$operators-and-input/assignment-operators$jp418$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-assignment-operators-1', null::text, $jp419$Running Bill with +=$jp419$, 'Easy', 'java-assignment-operators-running-bill',
   $jp420$Start from a given total, then add several item prices one by one using `+=`.

**Input:** the first line is the starting total; the second line is an integer N; the third line has N prices separated by spaces.

**Output:** one line — the final total after adding every price.$jp420$,
   $jp421$[{"input": "0\n3\n10 20 5", "output": "35"}]$jp421$::jsonb,
   $jp422$["0 <= starting total <= 1000000", "1 <= N <= 100", "0 <= each price <= 100000"]$jp422$::jsonb,
   jsonb_build_object('java', $jp423$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long total = sc.nextLong();
        int n = sc.nextInt();
        // read n prices, adding each into total with +=
    }
}
$jp423$),
   $jp424$["Loop n times; each iteration: total += sc.nextLong();", "Print total once after the loop."]$jp424$::jsonb,
   $jp425$[{"input": "0\n3\n10 20 5", "expected": "35", "hidden": false}, {"input": "100\n2\n50 25", "expected": "175", "hidden": true}, {"input": "0\n1\n0", "expected": "0", "hidden": true}, {"input": "1000\n4\n1 2 3 4", "expected": "1010", "hidden": true}]$jp425$::jsonb,
   $jp426$A single total variable is updated in place with += for each price. This is the everyday use of compound assignment: accumulate into one running variable.$jp426$,
   jsonb_build_object('java', $jp427$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long total = sc.nextLong();
        int n = sc.nextInt();
        for (int i = 0; i < n; i++) {
            total += sc.nextLong();
        }
        System.out.println(total);
    }
}
$jp427$),
   array['java'], 'published', false, 0),
  ('cp-java-assignment-operators-2', null::text, $jp428$Apply Four Operations$jp428$, 'Medium', 'java-assignment-operators-apply-ops',
   $jp429$Start from a value, then apply four operations in order using compound assignment, printing the value after each step.

**Input:** the first line is the starting integer; then four lines, each an operator (`+`, `-`, `*` or `/`) and an integer, separated by a space. Division is integer division and the divisor is never zero.

**Output:** four lines — the value after each operation.$jp429$,
   $jp430$[{"input": "100\n+ 50\n- 20\n* 2\n/ 13", "output": "150\n130\n260\n20"}]$jp430$::jsonb,
   $jp431$["values stay within the range of a 64-bit integer"]$jp431$::jsonb,
   jsonb_build_object('java', $jp432$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long value = Long.parseLong(sc.next());
        for (int i = 0; i < 4; i++) {
            String op = sc.next();
            long x = Long.parseLong(sc.next());
            // apply op to value with +=, -=, *= or /=, then print value
        }
    }
}
$jp432$),
   $jp433$["Use a switch (or if chain) on op to pick the compound operator.", "Print value inside the loop, right after updating it."]$jp433$::jsonb,
   $jp434$[{"input": "100\n+ 50\n- 20\n* 2\n/ 13", "expected": "150\n130\n260\n20", "hidden": false}, {"input": "10\n* 10\n* 10\n- 1\n/ 3", "expected": "100\n1000\n999\n333", "hidden": true}, {"input": "-5\n+ 5\n- 5\n* 3\n/ 3", "expected": "0\n-5\n-15\n-5", "hidden": true}]$jp434$::jsonb,
   $jp435$Read each operator token and number, then branch to the matching compound assignment (+=, -=, *=, /=). Printing after every step shows the value evolving through one variable.$jp435$,
   jsonb_build_object('java', $jp436$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long value = Long.parseLong(sc.next());
        for (int i = 0; i < 4; i++) {
            String op = sc.next();
            long x = Long.parseLong(sc.next());
            switch (op) {
                case "+": value += x; break;
                case "-": value -= x; break;
                case "*": value *= x; break;
                case "/": value /= x; break;
            }
            System.out.println(value);
        }
    }
}
$jp436$),
   array['java'], 'published', false, 1),
  ('cp-java-assignment-operators-3', null::text, $jp437$Build a Sentence with +=$jp437$, 'Easy', 'java-assignment-operators-string-build',
   $jp438$Read several words and join them into one sentence using `+=` on a String.

**Input:** the first line is an integer N; the second line has N words separated by single spaces.

**Output:** one line — the words joined by single spaces (no leading or trailing space).$jp438$,
   $jp439$[{"input": "3\nJava is fun", "output": "Java is fun"}]$jp439$::jsonb,
   $jp440$["1 <= N <= 50", "each word is 1..20 letters"]$jp440$::jsonb,
   jsonb_build_object('java', $jp441$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.next());
        String sentence = "";
        for (int i = 0; i < n; i++) {
            String w = sc.next();
            // append w (and a separating space) to sentence
        }
        // print sentence with no trailing space
    }
}
$jp441$),
   $jp442$["sentence += w + \" \"; builds the text with a trailing space each time.", "sentence.trim() removes the extra space at the end before printing."]$jp442$::jsonb,
   $jp443$[{"input": "3\nJava is fun", "expected": "Java is fun", "hidden": false}, {"input": "1\nHello", "expected": "Hello", "hidden": true}, {"input": "4\na b c d", "expected": "a b c d", "hidden": true}]$jp443$::jsonb,
   $jp444$+= also concatenates Strings. Append each word followed by a space, then trim the single trailing space at the end. (A StringBuilder would be better for very long input, but += is the point here.)$jp444$,
   jsonb_build_object('java', $jp445$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.next());
        String sentence = "";
        for (int i = 0; i < n; i++) {
            String w = sc.next();
            sentence += w + " ";
        }
        System.out.println(sentence.trim());
    }
}
$jp445$),
   array['java'], 'published', false, 2),
  ('cp-java-assignment-operators-4', null::text, $jp446$Double Until Limit$jp446$, 'Medium', 'java-assignment-operators-double-until',
   $jp447$Start from a value and repeatedly do `x *= 2` until `x` is greater than or equal to a limit. Print how many doublings were needed and the final value.

**Input:** two integers `start` and `limit` separated by whitespace (start >= 1).

**Output:** one line: `<number of doublings> <final value>`. If `start` is already `>= limit`, the answer is `0 <start>`.$jp447$,
   $jp448$[{"input": "3 20", "output": "3 24"}]$jp448$::jsonb,
   $jp449$["1 <= start <= 1000000", "1 <= limit <= 1000000000"]$jp449$::jsonb,
   jsonb_build_object('java', $jp450$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long x = sc.nextLong();
        long limit = sc.nextLong();
        int count = 0;
        // while x < limit: x *= 2; count++;
    }
}
$jp450$),
   $jp451$["Loop while x < limit, doubling x with x *= 2 and incrementing count each time.", "If the loop never runs, count stays 0 and x is unchanged."]$jp451$::jsonb,
   $jp452$[{"input": "3 20", "expected": "3 24", "hidden": false}, {"input": "10 10", "expected": "0 10", "hidden": true}, {"input": "1 1000", "expected": "10 1024", "hidden": true}, {"input": "5 5", "expected": "0 5", "hidden": true}]$jp452$::jsonb,
   $jp453$Each pass multiplies x by 2 via compound assignment and counts one doubling. The loop condition x < limit means that if start already meets the limit, no doublings happen.$jp453$,
   jsonb_build_object('java', $jp454$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long x = sc.nextLong();
        long limit = sc.nextLong();
        int count = 0;
        while (x < limit) {
            x *= 2;
            count++;
        }
        System.out.println(count + " " + x);
    }
}
$jp454$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Unary Operators — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp455$operators-and-input/unary-operators$jp455$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-unary-operators-1', null::text, $jp456$Pre- vs Post-Increment$jp456$, 'Medium', 'java-unary-operators-pre-vs-post',
   $jp457$Read an integer `x`. Simulate both forms of increment starting from `x` and print what each produces.

- Post-increment: `r1 = a++` — `r1` gets the old value, then `a` becomes `x + 1`.
- Pre-increment: `r2 = ++b` — `b` becomes `x + 1` first, then `r2` gets the new value.

**Input:** one integer `x`.

**Output:** two lines:

```
<r1> <a>
<r2> <b>
```$jp457$,
   $jp458$[{"input": "5", "output": "5 6\n6 6"}]$jp458$::jsonb,
   $jp459$["-1000000 <= x <= 1000000"]$jp459$::jsonb,
   jsonb_build_object('java', $jp460$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int x = sc.nextInt();
        int a = x;
        int r1 = a++;   // post-increment
        int b = x;
        int r2 = ++b;   // pre-increment
        // print r1, a on one line; r2, b on the next
    }
}
$jp460$),
   $jp461$["a++ returns the value of a before adding 1; a is then x + 1.", "++b adds 1 to b first, so both r2 and b are x + 1."]$jp461$::jsonb,
   $jp462$[{"input": "5", "expected": "5 6\n6 6", "hidden": false}, {"input": "0", "expected": "0 1\n1 1", "hidden": true}, {"input": "-3", "expected": "-3 -2\n-2 -2", "hidden": true}]$jp462$::jsonb,
   $jp463$Post-increment (a++) evaluates to the old value, so r1 equals x while a moves to x+1. Pre-increment (++b) updates first, so both r2 and b are x+1. This is the classic difference the topic highlights.$jp463$,
   jsonb_build_object('java', $jp464$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int x = sc.nextInt();
        int a = x;
        int r1 = a++;
        int b = x;
        int r2 = ++b;
        System.out.println(r1 + " " + a);
        System.out.println(r2 + " " + b);
    }
}
$jp464$),
   array['java'], 'published', false, 0),
  ('cp-java-unary-operators-2', null::text, $jp465$Sum 1..N with i++$jp465$, 'Easy', 'java-unary-operators-counter-sum',
   $jp466$Use a counter and the `++` operator in a loop to add up every integer from 1 to N.

**Input:** one integer N.

**Output:** one line — the sum 1 + 2 + ... + N.$jp466$,
   $jp467$[{"input": "5", "output": "15"}]$jp467$::jsonb,
   $jp468$["1 <= N <= 1000000"]$jp468$::jsonb,
   jsonb_build_object('java', $jp469$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long sum = 0;
        // for (int i = 1; i <= n; i++) sum += i;
    }
}
$jp469$),
   $jp470$["The loop's i++ advances the counter each pass.", "Use long for the sum since N can be up to a million."]$jp470$::jsonb,
   $jp471$[{"input": "5", "expected": "15", "hidden": false}, {"input": "1", "expected": "1", "hidden": true}, {"input": "100", "expected": "5050", "hidden": true}, {"input": "1000000", "expected": "500000500000", "hidden": true}]$jp471$::jsonb,
   $jp472$A standard counting loop: i starts at 1 and i++ moves it forward until it passes N, adding each value to the running sum. long is needed because the sum for N = 1000000 exceeds the int range.$jp472$,
   jsonb_build_object('java', $jp473$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long sum = 0;
        for (int i = 1; i <= n; i++) {
            sum += i;
        }
        System.out.println(sum);
    }
}
$jp473$),
   array['java'], 'published', false, 1),
  ('cp-java-unary-operators-3', null::text, $jp474$Negate a Number$jp474$, 'Easy', 'java-unary-operators-negate',
   $jp475$Read an integer and print its negation using the unary minus operator.

**Input:** one integer.

**Output:** one line — the number with its sign reversed (`0` stays `0`).$jp475$,
   $jp476$[{"input": "5", "output": "-5"}, {"input": "-3", "output": "3"}]$jp476$::jsonb,
   $jp477$["-1000000000 <= n <= 1000000000"]$jp477$::jsonb,
   jsonb_build_object('java', $jp478$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        // print -n
    }
}
$jp478$),
   $jp479$["Unary minus: -n reverses the sign.", "-0 is just 0."]$jp479$::jsonb,
   $jp480$[{"input": "5", "expected": "-5", "hidden": false}, {"input": "-3", "expected": "3", "hidden": false}, {"input": "0", "expected": "0", "hidden": true}, {"input": "1000000000", "expected": "-1000000000", "hidden": true}]$jp480$::jsonb,
   $jp481$The unary minus operator returns the arithmetic negation of its single operand. Applying it to 0 leaves 0 unchanged.$jp481$,
   jsonb_build_object('java', $jp482$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        System.out.println(-n);
    }
}
$jp482$),
   array['java'], 'published', false, 2),
  ('cp-java-unary-operators-4', null::text, $jp483$Countdown with --$jp483$, 'Easy', 'java-unary-operators-countdown',
   $jp484$Read an integer N and print N, N-1, ..., down to 1 on a single line, separated by spaces, using the `--` operator.

**Input:** one integer N.

**Output:** one line — the numbers from N down to 1, space-separated.$jp484$,
   $jp485$[{"input": "5", "output": "5 4 3 2 1"}]$jp485$::jsonb,
   $jp486$["1 <= N <= 100000"]$jp486$::jsonb,
   jsonb_build_object('java', $jp487$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        StringBuilder sb = new StringBuilder();
        // for (int i = n; i >= 1; i--) append i and a space
    }
}
$jp487$),
   $jp488$["Start i at N and use i-- until i drops below 1.", "Build the line in a StringBuilder, then print it trimmed."]$jp488$::jsonb,
   $jp489$[{"input": "5", "expected": "5 4 3 2 1", "hidden": false}, {"input": "1", "expected": "1", "hidden": true}, {"input": "3", "expected": "3 2 1", "hidden": true}, {"input": "10", "expected": "10 9 8 7 6 5 4 3 2 1", "hidden": true}]$jp489$::jsonb,
   $jp490$A loop that starts high and uses i-- to step down. Collect the values with single spaces between them and trim the trailing space before printing.$jp490$,
   jsonb_build_object('java', $jp491$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        StringBuilder sb = new StringBuilder();
        for (int i = n; i >= 1; i--) {
            sb.append(i);
            if (i > 1) sb.append(' ');
        }
        System.out.println(sb.toString());
    }
}
$jp491$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Ternary Operator — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp492$operators-and-input/ternary-operator$jp492$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-ternary-operator-1', null::text, $jp493$Pass or Fail (Ternary)$jp493$, 'Easy', 'java-ternary-operator-pass-fail',
   $jp494$Read a mark and print `Pass` if it is at least 35, otherwise `Fail`. Use the ternary operator.

**Input:** one integer — the mark.

**Output:** one line — `Pass` or `Fail`.$jp494$,
   $jp495$[{"input": "40", "output": "Pass"}, {"input": "30", "output": "Fail"}]$jp495$::jsonb,
   $jp496$["0 <= mark <= 100"]$jp496$::jsonb,
   jsonb_build_object('java', $jp497$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int mark = sc.nextInt();
        // String result = (mark >= 35) ? "Pass" : "Fail";
    }
}
$jp497$),
   $jp498$["The condition is mark >= 35.", "Assign the ternary result to a String and print it."]$jp498$::jsonb,
   $jp499$[{"input": "40", "expected": "Pass", "hidden": false}, {"input": "30", "expected": "Fail", "hidden": false}, {"input": "35", "expected": "Pass", "hidden": true}, {"input": "0", "expected": "Fail", "hidden": true}]$jp499$::jsonb,
   $jp500$One condition, two possible values — the perfect fit for the ternary operator. mark >= 35 selects "Pass", anything else selects "Fail".$jp500$,
   jsonb_build_object('java', $jp501$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int mark = sc.nextInt();
        String result = (mark >= 35) ? "Pass" : "Fail";
        System.out.println(result);
    }
}
$jp501$),
   array['java'], 'published', false, 0),
  ('cp-java-ternary-operator-2', null::text, $jp502$Larger Value (Ternary)$jp502$, 'Easy', 'java-ternary-operator-max-ternary',
   $jp503$Read two integers and print the larger one using a single ternary expression.

**Input:** two integers separated by whitespace.

**Output:** one line — the larger value.$jp503$,
   $jp504$[{"input": "5 3", "output": "5"}, {"input": "2 9", "output": "9"}]$jp504$::jsonb,
   $jp505$["-1000000000 <= a, b <= 1000000000"]$jp505$::jsonb,
   jsonb_build_object('java', $jp506$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.nextLong();
        long b = sc.nextLong();
        // long max = (a > b) ? a : b;
    }
}
$jp506$),
   $jp507$["(a > b) ? a : b returns the larger of the two.", "When a and b are equal, either branch gives the same value."]$jp507$::jsonb,
   $jp508$[{"input": "5 3", "expected": "5", "hidden": false}, {"input": "2 9", "expected": "9", "hidden": false}, {"input": "-7 -7", "expected": "-7", "hidden": true}, {"input": "0 -1", "expected": "0", "hidden": true}]$jp508$::jsonb,
   $jp509$The ternary chooses a when a is greater, otherwise b. This replaces a four-line if-else with a single expression.$jp509$,
   jsonb_build_object('java', $jp510$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.nextLong();
        long b = sc.nextLong();
        long max = (a > b) ? a : b;
        System.out.println(max);
    }
}
$jp510$),
   array['java'], 'published', false, 1),
  ('cp-java-ternary-operator-3', null::text, $jp511$Even or Odd (Ternary)$jp511$, 'Easy', 'java-ternary-operator-even-odd',
   $jp512$Read an integer and print `Even` or `Odd` using the ternary operator.

**Input:** one integer.

**Output:** one line — `Even` or `Odd`.$jp512$,
   $jp513$[{"input": "4", "output": "Even"}, {"input": "7", "output": "Odd"}]$jp513$::jsonb,
   $jp514$["-1000000000 <= n <= 1000000000"]$jp514$::jsonb,
   jsonb_build_object('java', $jp515$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        // String r = (n % 2 == 0) ? "Even" : "Odd";
    }
}
$jp515$),
   $jp516$["n % 2 == 0 tests for even.", "Negative even numbers also give remainder 0."]$jp516$::jsonb,
   $jp517$[{"input": "4", "expected": "Even", "hidden": false}, {"input": "7", "expected": "Odd", "hidden": false}, {"input": "0", "expected": "Even", "hidden": true}, {"input": "-3", "expected": "Odd", "hidden": true}]$jp517$::jsonb,
   $jp518$n % 2 == 0 is the condition; the ternary returns "Even" when it holds and "Odd" otherwise. Zero is even, and the sign does not matter.$jp518$,
   jsonb_build_object('java', $jp519$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        String r = (n % 2 == 0) ? "Even" : "Odd";
        System.out.println(r);
    }
}
$jp519$),
   array['java'], 'published', false, 2),
  ('cp-java-ternary-operator-4', null::text, $jp520$Absolute Value (Ternary, No Math.abs)$jp520$, 'Easy', 'java-ternary-operator-abs-value',
   $jp521$Read an integer and print its absolute value using a ternary expression — do not use `Math.abs`.

**Input:** one integer.

**Output:** one line — the absolute value.$jp521$,
   $jp522$[{"input": "-7", "output": "7"}, {"input": "5", "output": "5"}]$jp522$::jsonb,
   $jp523$["-1000000000 <= n <= 1000000000"]$jp523$::jsonb,
   jsonb_build_object('java', $jp524$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        // long abs = (n < 0) ? -n : n;
    }
}
$jp524$),
   $jp525$["If n is negative, the absolute value is -n; otherwise it is n.", "-n uses the unary minus operator."]$jp525$::jsonb,
   $jp526$[{"input": "-7", "expected": "7", "hidden": false}, {"input": "5", "expected": "5", "hidden": false}, {"input": "0", "expected": "0", "hidden": true}, {"input": "-1000000000", "expected": "1000000000", "hidden": true}]$jp526$::jsonb,
   $jp527$The ternary picks -n when n is below zero and n otherwise. This is exactly what Math.abs does for integers, written by hand.$jp527$,
   jsonb_build_object('java', $jp528$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        long abs = (n < 0) ? -n : n;
        System.out.println(abs);
    }
}
$jp528$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Bitwise Operators — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp529$operators-and-input/bitwise-operators$jp529$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-bitwise-operators-1', null::text, $jp530$Four Bitwise Results$jp530$, 'Easy', 'java-bitwise-operators-four-ops',
   $jp531$Read two non-negative integers `a` and `b` and print four bitwise results.

**Input:** two integers separated by whitespace.

**Output:** four lines:

```
AND: <a & b>
OR: <a | b>
XOR: <a ^ b>
Left Shift: <a << 1>
```$jp531$,
   $jp532$[{"input": "5 3", "output": "AND: 1\nOR: 7\nXOR: 6\nLeft Shift: 10"}]$jp532$::jsonb,
   $jp533$["0 <= a, b <= 1000000"]$jp533$::jsonb,
   jsonb_build_object('java', $jp534$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        // print a & b, a | b, a ^ b, a << 1 with the labels shown
    }
}
$jp534$),
   $jp535$["Wrap each bitwise expression in parentheses when concatenating with a String.", "a << 1 shifts a's bits one place to the left."]$jp535$::jsonb,
   $jp536$[{"input": "5 3", "expected": "AND: 1\nOR: 7\nXOR: 6\nLeft Shift: 10", "hidden": false}, {"input": "12 10", "expected": "AND: 8\nOR: 14\nXOR: 6\nLeft Shift: 24", "hidden": true}, {"input": "0 0", "expected": "AND: 0\nOR: 0\nXOR: 0\nLeft Shift: 0", "hidden": true}, {"input": "255 1", "expected": "AND: 1\nOR: 255\nXOR: 254\nLeft Shift: 510", "hidden": true}]$jp536$::jsonb,
   $jp537$Apply &, |, ^ to the two numbers bit by bit, and << to shift a left by one bit (doubling it). Parentheses are needed so the + concatenation does not bind first.$jp537$,
   jsonb_build_object('java', $jp538$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println("AND: " + (a & b));
        System.out.println("OR: " + (a | b));
        System.out.println("XOR: " + (a ^ b));
        System.out.println("Left Shift: " + (a << 1));
    }
}
$jp538$),
   array['java'], 'published', false, 0),
  ('cp-java-bitwise-operators-2', null::text, $jp539$Power of Two Check$jp539$, 'Medium', 'java-bitwise-operators-power-of-two',
   $jp540$Read a positive integer and decide whether it is a power of two (1, 2, 4, 8, 16, ...), using the trick `(n & (n - 1)) == 0`.

**Input:** one integer `n` (n >= 1).

**Output:** one line — `Yes` or `No`.$jp540$,
   $jp541$[{"input": "8", "output": "Yes"}, {"input": "6", "output": "No"}]$jp541$::jsonb,
   $jp542$["1 <= n <= 1000000000"]$jp542$::jsonb,
   jsonb_build_object('java', $jp543$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        // print Yes if (n & (n - 1)) == 0, else No
    }
}
$jp543$),
   $jp544$["A power of two has exactly one bit set; n - 1 flips that bit and all below it.", "Keep the parentheses: (n & (n - 1)) == 0, because == binds tighter than &."]$jp544$::jsonb,
   $jp545$[{"input": "8", "expected": "Yes", "hidden": false}, {"input": "6", "expected": "No", "hidden": false}, {"input": "1", "expected": "Yes", "hidden": true}, {"input": "1024", "expected": "Yes", "hidden": true}, {"input": "1000000000", "expected": "No", "hidden": true}]$jp545$::jsonb,
   $jp546$For a power of two, the binary form is a single 1 bit. Subtracting 1 turns that bit to 0 and all lower bits to 1, so ANDing the two gives 0. Any other number shares at least one bit with n - 1.$jp546$,
   jsonb_build_object('java', $jp547$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long n = sc.nextLong();
        boolean isPow = (n & (n - 1)) == 0;
        System.out.println(isPow ? "Yes" : "No");
    }
}
$jp547$),
   array['java'], 'published', false, 1),
  ('cp-java-bitwise-operators-3', null::text, $jp548$Read the K-th Bit$jp548$, 'Medium', 'java-bitwise-operators-kth-bit',
   $jp549$Read a non-negative integer `n` and a bit position `k` (0 = least significant). Print the value of that bit using `(n >> k) & 1`.

**Input:** two integers `n` and `k` separated by whitespace.

**Output:** one line — `0` or `1`.$jp549$,
   $jp550$[{"input": "13 0", "output": "1"}, {"input": "13 1", "output": "0"}]$jp550$::jsonb,
   $jp551$["0 <= n <= 1000000000", "0 <= k <= 30"]$jp551$::jsonb,
   jsonb_build_object('java', $jp552$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int k = sc.nextInt();
        // print (n >> k) & 1
    }
}
$jp552$),
   $jp553$["Shifting n right by k moves the wanted bit into the lowest position.", "& 1 keeps only that lowest bit."]$jp553$::jsonb,
   $jp554$[{"input": "13 0", "expected": "1", "hidden": false}, {"input": "13 1", "expected": "0", "hidden": false}, {"input": "13 2", "expected": "1", "hidden": true}, {"input": "13 3", "expected": "1", "hidden": true}, {"input": "1024 10", "expected": "1", "hidden": true}]$jp554$::jsonb,
   $jp555$13 is 1101 in binary. Shifting right by k lines up bit k with position 0, and & 1 masks off everything else, leaving just that bit.$jp555$,
   jsonb_build_object('java', $jp556$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int k = sc.nextInt();
        System.out.println((n >> k) & 1);
    }
}
$jp556$),
   array['java'], 'published', false, 2),
  ('cp-java-bitwise-operators-4', null::text, $jp557$Swap with XOR$jp557$, 'Medium', 'java-bitwise-operators-xor-swap',
   $jp558$Read two integers `a` and `b` and swap their values using only the XOR operator (`a ^= b; b ^= a; a ^= b;`), then print them.

**Input:** two integers separated by whitespace.

**Output:** one line: `a=<a> b=<b>` after the swap.$jp558$,
   $jp559$[{"input": "10 20", "output": "a=20 b=10"}]$jp559$::jsonb,
   $jp560$["0 <= a, b <= 1000000000"]$jp560$::jsonb,
   jsonb_build_object('java', $jp561$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        // a ^= b; b ^= a; a ^= b;
        // then print a=... b=...
    }
}
$jp561$),
   $jp562$["Apply the three XOR-assignments in order.", "XOR swap works even when a and b are equal (both stay the same)."]$jp562$::jsonb,
   $jp563$[{"input": "10 20", "expected": "a=20 b=10", "hidden": false}, {"input": "7 7", "expected": "a=7 b=7", "hidden": true}, {"input": "0 255", "expected": "a=255 b=0", "hidden": true}, {"input": "1 2", "expected": "a=2 b=1", "hidden": true}]$jp563$::jsonb,
   $jp564$XOR has the property that x ^ y ^ y == x. The three-step sequence uses this to exchange the two values without a temporary variable. Equal inputs are unaffected.$jp564$,
   jsonb_build_object('java', $jp565$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        a ^= b;
        b ^= a;
        a ^= b;
        System.out.println("a=" + a + " b=" + b);
    }
}
$jp565$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- User Input — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp566$operators-and-input/user-input$jp566$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-user-input-1', null::text, $jp567$Read and Echo an Age$jp567$, 'Easy', 'java-user-input-echo-age',
   $jp568$Read one integer from input and echo it back in a sentence.

**Input:** one integer — an age.

**Output:** one line: `Your age is: <age>`$jp568$,
   $jp569$[{"input": "22", "output": "Your age is: 22"}]$jp569$::jsonb,
   $jp570$["0 <= age <= 150"]$jp570$::jsonb,
   jsonb_build_object('java', $jp571$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int age = sc.nextInt();
        // print the sentence
    }
}
$jp571$),
   $jp572$["sc.nextInt() reads the number.", "Concatenate: \"Your age is: \" + age."]$jp572$::jsonb,
   $jp573$[{"input": "22", "expected": "Your age is: 22", "hidden": false}, {"input": "0", "expected": "Your age is: 0", "hidden": true}, {"input": "150", "expected": "Your age is: 150", "hidden": true}]$jp573$::jsonb,
   $jp574$Read the integer with nextInt() and print it inside the required sentence. (On this judge you never print an "Enter your age" prompt — the input arrives directly.)$jp574$,
   jsonb_build_object('java', $jp575$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int age = sc.nextInt();
        System.out.println("Your age is: " + age);
    }
}
$jp575$),
   array['java'], 'published', false, 0),
  ('cp-java-user-input-2', null::text, $jp576$Sum of N Numbers$jp576$, 'Easy', 'java-user-input-sum-n',
   $jp577$Read a count `N`, then read `N` integers, and print their sum.

**Input:** the first token is N; then N integers (any whitespace between them).

**Output:** one line — the sum of the N integers.$jp577$,
   $jp578$[{"input": "3\n10 20 30", "output": "60"}]$jp578$::jsonb,
   $jp579$["1 <= N <= 1000", "-1000000 <= each integer <= 1000000"]$jp579$::jsonb,
   jsonb_build_object('java', $jp580$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long sum = 0;
        // read n integers with sc.nextInt(), adding each to sum
    }
}
$jp580$),
   $jp581$["Scanner ignores the difference between spaces and newlines for nextInt().", "Loop exactly n times."]$jp581$::jsonb,
   $jp582$[{"input": "3\n10 20 30", "expected": "60", "hidden": false}, {"input": "1\n42", "expected": "42", "hidden": true}, {"input": "5\n1 2 3 4 5", "expected": "15", "hidden": true}, {"input": "4\n-10 -20 30 0", "expected": "0", "hidden": true}]$jp582$::jsonb,
   $jp583$nextInt() skips any whitespace (spaces or newlines) before each number, so the same loop works no matter how the N values are laid out. Accumulate them into a long sum.$jp583$,
   jsonb_build_object('java', $jp584$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        long sum = 0;
        for (int i = 0; i < n; i++) {
            sum += sc.nextInt();
        }
        System.out.println(sum);
    }
}
$jp584$),
   array['java'], 'published', false, 1),
  ('cp-java-user-input-3', null::text, $jp585$Name Then Age$jp585$, 'Medium', 'java-user-input-name-age',
   $jp586$Read a name on the first line and an age on the second line, then print them together.

**Input:** line 1 is a name (may contain spaces); line 2 is an integer age.

**Output:** one line: `<name> (<age>)`$jp586$,
   $jp587$[{"input": "Aditi Rao\n21", "output": "Aditi Rao (21)"}]$jp587$::jsonb,
   $jp588$["1 <= name length <= 40", "0 <= age <= 150"]$jp588$::jsonb,
   jsonb_build_object('java', $jp589$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.nextLine().trim();
        int age = Integer.parseInt(sc.nextLine().trim());
        // print name (age)
    }
}
$jp589$),
   $jp590$["Read the name with nextLine() so spaces are kept.", "Read the age line and convert it with Integer.parseInt to avoid the nextInt/nextLine pitfall."]$jp590$::jsonb,
   $jp591$[{"input": "Aditi Rao\n21", "expected": "Aditi Rao (21)", "hidden": false}, {"input": "Sam\n0", "expected": "Sam (0)", "hidden": true}, {"input": "Maria De La Cruz\n35", "expected": "Maria De La Cruz (35)", "hidden": true}]$jp591$::jsonb,
   $jp592$Reading both values as lines (and parsing the age yourself) sidesteps the classic bug where a leftover newline from nextInt() makes the following nextLine() return an empty string.$jp592$,
   jsonb_build_object('java', $jp593$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.nextLine().trim();
        int age = Integer.parseInt(sc.nextLine().trim());
        System.out.println(name + " (" + age + ")");
    }
}
$jp593$),
   array['java'], 'published', false, 2),
  ('cp-java-user-input-4', null::text, $jp594$Read Three Different Types$jp594$, 'Easy', 'java-user-input-read-mixed',
   $jp595$Read an integer, a decimal number and a word (in that order), then print them in a formatted line.

**Input:** three whitespace-separated tokens — an int, a double, a word.

**Output:** one line: `<word>: <int>, <double>`$jp595$,
   $jp596$[{"input": "5\n2.5\nscore", "output": "score: 5, 2.5"}]$jp596$::jsonb,
   $jp597$["the double uses a dot as the decimal separator"]$jp597$::jsonb,
   jsonb_build_object('java', $jp598$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.next());
        double d = Double.parseDouble(sc.next());
        String word = sc.next();
        // print word: n, d
    }
}
$jp598$),
   $jp599$["Read each value as a token with sc.next() and convert it.", "Assemble the output as word + \": \" + n + \", \" + d."]$jp599$::jsonb,
   $jp600$[{"input": "5\n2.5\nscore", "expected": "score: 5, 2.5", "hidden": false}, {"input": "-3\n0.75\ntemp", "expected": "temp: -3, 0.75", "hidden": true}, {"input": "100\n1.0\ntotal", "expected": "total: 100, 1.0", "hidden": true}]$jp600$::jsonb,
   $jp601$Scanner can read tokens of different kinds one after another. Convert each with the matching parse method, then build the output string. The double 1.0 prints with its .0 preserved.$jp601$,
   jsonb_build_object('java', $jp602$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.next());
        double d = Double.parseDouble(sc.next());
        String word = sc.next();
        System.out.println(word + ": " + n + ", " + d);
    }
}
$jp602$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- ===========================================================================
-- 3. PRACTICE PROBLEMS — a 2nd learning_contents block per theory topic
--    (renders right after the notes on web + mobile).
-- ===========================================================================

-- Command-Line Arguments — Practice Problems
with tp as (select id from public.learning_topics
             where source_kind = 'java_tutorial' and source_ref = $jp603$operators-and-input/command-line-arguments$jp603$)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select tp.id, 'Practice Problems', $jp604$Try each question yourself first, then check the answer.

### 1. The basics of `args`

What is the type of `args`, and how do you find out how many values were passed?

**Answer:** `args` is a `String[]` (an array of `String`). `args.length` tells you how many arguments were passed.

### 2. Predict the output

```java
public class Main {
    public static void main(String[] args) {
        if (args.length > 0) {
            System.out.println("Hello, " + args[0] + "!");
        } else {
            System.out.println("No name provided.");
        }
    }
}
```

What is printed when run as `java Main Rahul`? And when run as `java Main` with no arguments?

**Answer:** `java Main Rahul` prints `Hello, Rahul!`. `java Main` prints `No name provided.` (because `args.length` is 0).

### 3. Why the numbers do not add

You run `java Sum 8 5` and write `System.out.println(args[0] + args[1]);`. It prints `85`, not `13`. Why, and how do you fix it?

**Answer:** `args[0]` and `args[1]` are the Strings `"8"` and `"5"`, so `+` concatenates them. Convert first: `Integer.parseInt(args[0]) + Integer.parseInt(args[1])` gives `13`.

### 4. Compare with Scanner

Name two differences between command-line arguments and `Scanner` input.

**Answer:** (1) Command-line arguments are supplied once, on the launch command, before the program runs; `Scanner` reads input while the program is running. (2) Arguments always arrive as `String` and must be converted manually; `Scanner` has typed methods like `nextInt()` and `nextDouble()`.
$jp604$, 'markdown',
  jsonb_build_object('source', 'java_practice_seed', 'content_type', 'exercise'),
  'published', 1
from tp
on conflict (topic_id) where (metadata ->> 'source') = 'java_practice_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- ===========================================================================
-- 4. VALIDATION  (raises, never silently passes — scoped to THIS pair's ids)
-- ===========================================================================
do $val$
declare
  v_tests     int;
  v_bad       int;
  v_questions int;
  v_problems  int;
  v_blocks    int;
begin
  select count(*) into v_tests from public.practice_tests where id in ('pt-java-arithmetic-operators','pt-java-relational-operators','pt-java-logical-operators','pt-java-assignment-operators','pt-java-unary-operators','pt-java-ternary-operator','pt-java-bitwise-operators','pt-java-user-input','pt-java-command-line-arguments');
  if v_tests <> 9 then
    raise exception 'validation: expected 9 operators-and-input mock tests, found %', v_tests;
  end if;

  select count(*) into v_bad from public.practice_tests
   where id in ('pt-java-arithmetic-operators','pt-java-relational-operators','pt-java-logical-operators','pt-java-assignment-operators','pt-java-unary-operators','pt-java-ternary-operator','pt-java-bitwise-operators','pt-java-user-input','pt-java-command-line-arguments') and (question_count <> 10 or duration_minutes <> 10);
  if v_bad > 0 then
    raise exception 'validation: % operators-and-input mock tests are not 10 questions / 10 minutes', v_bad;
  end if;

  select count(*) into v_questions from public.test_questions where test_id in ('pt-java-arithmetic-operators','pt-java-relational-operators','pt-java-logical-operators','pt-java-assignment-operators','pt-java-unary-operators','pt-java-ternary-operator','pt-java-bitwise-operators','pt-java-user-input','pt-java-command-line-arguments');
  if v_questions <> 90 then
    raise exception 'validation: expected 90 operators-and-input MCQ rows, found %', v_questions;
  end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-java-arithmetic-operators-%' or id like 'cp-java-relational-operators-%' or id like 'cp-java-logical-operators-%' or id like 'cp-java-assignment-operators-%' or id like 'cp-java-unary-operators-%' or id like 'cp-java-ternary-operator-%' or id like 'cp-java-bitwise-operators-%' or id like 'cp-java-user-input-%';
  if v_problems <> 32 then
    raise exception 'validation: expected 32 operators-and-input coding problems, found %', v_problems;
  end if;

  select count(*) into v_blocks from public.learning_contents c
    join public.learning_topics t on t.id = c.topic_id
   where (c.metadata ->> 'source') = 'java_practice_seed'
     and t.source_kind = 'java_tutorial' and t.source_ref in ($jp605$operators-and-input/command-line-arguments$jp605$);
  if v_blocks <> 1 then
    raise exception 'validation: expected 1 operators-and-input practice-problem blocks, found %', v_blocks;
  end if;

  raise notice '0071 OK: Operators & Input — 9 mock tests (90 MCQs), 32 coding problems, 4 practice problems.';
end
$val$;

notify pgrst, 'reload schema';
