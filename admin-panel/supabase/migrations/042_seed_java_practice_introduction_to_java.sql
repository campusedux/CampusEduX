-- admin-panel/supabase/migrations/042_seed_java_practice_introduction_to_java.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0070_seed_java_practice_introduction_to_java.sql ; apply either, the other is a guarded no-op.
-- ============================================================================
-- BODY — Java Tutorials ▸ Introduction to Java: per-topic Mock Test (10 MCQs / 10 min) +
-- Coding Problems + Practice Problems
-- (mobile 0070_seed_java_practice_introduction_to_java.sql
--  == admin 042_seed_java_practice_introduction_to_java.sql — byte-identical below
--  the 3-line header, guarded, idempotent, additive.)
-- ============================================================================
-- Attaches practice to the 14 existing 'introduction-to-java' topics of the
-- java-tutorial grid (seeded by admin 024 / mobile 0047). Reuses the topic-
-- practice tables + RPCs from admin 025 / mobile 0048. Content only.
--
--   * 14 Mock Tests   — practice_tests rows (learning_topic_id set,
--     category 'aptitude', 10 questions, 10-minute timer) + 140 test_questions.
--     Scoring is unchanged (submit_test_attempt(), server-side).
--   * 28 Coding Problems — dsa_problems rows (topic_id NULL +
--     learning_topic_id set), Java-only, prompt-free stdin/stdout, every
--     reference solution + test case executed under javac --release 11.
--   * 28 Practice Problems — 7 theory topics each get a second
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
    raise exception '0070/042: learning_* not found — apply 0042_learning_management.sql (admin 019) first.';
  end if;
  if to_regprocedure('public.learning_topic_practice(text, text, text)') is null then
    raise exception '0070/042: topic-practice not found — apply 0048_topic_practice.sql (admin 025) first.';
  end if;
  if not exists (
    select 1 from public.learning_topics
    where source_kind = 'java_tutorial'
      and source_ref = 'introduction-to-java/introduction-to-java'
  ) then
    raise exception '0070/042: Java Tutorials content not found — apply 0047_seed_java_tutorial_content.sql (admin 024) first.';
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

-- Introduction to Java — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp1$introduction-to-java/introduction-to-java$jp1$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-introduction-to-java', $jp2$Introduction to Java - Quick Test$jp2$, 'aptitude', 10, 10,
  $jp3$10 questions on what Java is, why it is used, and how a Java program is shaped.$jp3$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp4$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp4$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-introduction-to-java-1', 'pt-java-introduction-to-java',
   $jp5$Which phrase best describes Java?$jp5$,
   $jp6$["A high-level, class-based, object-oriented language", "A markup language for building web pages", "A database query language", "A procedural language with no classes"]$jp6$::jsonb,
   0, $jp7$Java is a high-level, class-based, object-oriented programming language that compiles to bytecode.$jp7$, 1, 0),
  ('tq-java-introduction-to-java-2', 'pt-java-introduction-to-java',
   $jp8$What does "write once, run anywhere" mean for Java?$jp8$,
   $jp9$["Java programs only run on Windows", "Java source needs no compiler", "Code must be rewritten for every operating system", "The same compiled program can run on any device that has a JVM"]$jp9$::jsonb,
   3, $jp10$Java compiles to platform-neutral bytecode, so one compiled program runs unchanged on any machine with a JVM.$jp10$, 1, 1),
  ('tq-java-introduction-to-java-3', 'pt-java-introduction-to-java',
   $jp11$In Java, program instructions must be written inside a ___.$jp11$,
   $jp12$["package statement", "function that sits outside any class", "class", "separate header file"]$jp12$::jsonb,
   2, $jp13$Every Java program needs at least one class; code lives inside classes.$jp13$, 1, 2),
  ('tq-java-introduction-to-java-4', 'pt-java-introduction-to-java',
   $jp14$Which method is where a Java application starts running?$jp14$,
   $jp15$["run()", "main()", "init()", "start()"]$jp15$::jsonb,
   1, $jp16$The JVM begins execution at public static void main(String[] args).$jp16$, 1, 3),
  ('tq-java-introduction-to-java-5', 'pt-java-introduction-to-java',
   $jp17$Which is a common real-world use of Java?$jp17$,
   $jp18$["Formatting spreadsheets", "Styling web pages", "Android app development", "Writing OS boot loaders in place of C"]$jp18$::jsonb,
   2, $jp19$Java powers Android apps, banking software and large enterprise systems, among others.$jp19$, 1, 4),
  ('tq-java-introduction-to-java-6', 'pt-java-introduction-to-java',
   $jp20$Java source code is first translated into an intermediate form called ___.$jp20$,
   $jp21$["machine code", "bytecode", "assembly language", "a disk image"]$jp21$::jsonb,
   1, $jp22$The Java compiler turns source into bytecode, which the JVM then executes.$jp22$, 1, 5),
  ('tq-java-introduction-to-java-7', 'pt-java-introduction-to-java',
   $jp23$Which statement about Java is TRUE?$jp23$,
   $jp24$["Java cannot be used for server applications", "Java has no standard libraries", "Java code runs directly on the CPU with no runtime", "Java needs a JVM to execute"]$jp24$::jsonb,
   3, $jp25$The JVM executes Java bytecode; it is always part of running a Java program.$jp25$, 1, 6),
  ('tq-java-introduction-to-java-8', 'pt-java-introduction-to-java',
   $jp26$The "universal remote" analogy in the notes illustrates Java's ___.$jp26$,
   $jp27$["portability across platforms", "small file size", "lack of syntax rules", "raw speed"]$jp27$::jsonb,
   0, $jp28$Like a universal remote works with many TVs, a Java program runs on many kinds of device.$jp28$, 1, 7),
  ('tq-java-introduction-to-java-9', 'pt-java-introduction-to-java',
   $jp29$Which is NOT true of Java?$jp29$,
   $jp30$["Its source code runs without any compilation", "It is general-purpose", "It is object-oriented", "It is platform-independent at the bytecode level"]$jp30$::jsonb,
   0, $jp31$Java source must be compiled to bytecode first; it does not run directly.$jp31$, 1, 8),
  ('tq-java-introduction-to-java-10', 'pt-java-introduction-to-java',
   $jp32$What is printed by System.out.println("Welcome to Java!");?$jp32$,
   $jp33$["nothing", "Welcome to Java!", "\"Welcome to Java!\" including the quotes", "println"]$jp33$::jsonb,
   1, $jp34$println writes the text between the quotes, followed by a newline; the quotes themselves are not printed.$jp34$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-introduction-to-java' and question_count <> 10;

-- Features of Java — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp35$introduction-to-java/features-of-java$jp35$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-features-of-java', $jp36$Features of Java - Quick Test$jp36$, 'aptitude', 10, 10,
  $jp37$10 questions on Java's core features and why they matter.$jp37$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp38$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp38$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-features-of-java-1', 'pt-java-features-of-java',
   $jp39$Which is a core feature of Java?$jp39$,
   $jp40$["Platform independence", "Pointer arithmetic", "C-style preprocessor directives", "Manual memory management"]$jp40$::jsonb,
   0, $jp41$Platform independence — running the same bytecode anywhere — is one of Java's defining features.$jp41$, 1, 0),
  ('tq-java-features-of-java-2', 'pt-java-features-of-java',
   $jp42$Java's platform independence mainly comes from ___.$jp42$,
   $jp43$["the text editor used", "the brand of CPU", "the operating system", "the JVM running bytecode"]$jp43$::jsonb,
   3, $jp44$Each platform has its own JVM that runs the same bytecode, so the program need not change.$jp44$, 1, 1),
  ('tq-java-features-of-java-3', 'pt-java-features-of-java',
   $jp45$"Multithreaded" means Java can ___.$jp45$,
   $jp46$["only run one task at a time", "handle multiple tasks at once", "not use loops", "avoid using classes"]$jp46$::jsonb,
   1, $jp47$Multithreading lets a Java program do several things concurrently.$jp47$, 1, 2),
  ('tq-java-features-of-java-4', 'pt-java-features-of-java',
   $jp48$Which feature makes Java well suited to banking software?$jp48$,
   $jp49$["The absence of exceptions", "Slow execution", "Its logo", "Built-in security checks"]$jp49$::jsonb,
   3, $jp50$Java's built-in security and memory safety reduce whole classes of bugs and attacks.$jp50$, 1, 3),
  ('tq-java-features-of-java-5', 'pt-java-features-of-java',
   $jp51$The notes compare Java to a Swiss Army knife to show that it ___.$jp51$,
   $jp52$["is sharp", "bundles many useful qualities into one language", "is physically small", "is expensive"]$jp52$::jsonb,
   1, $jp53$Java packs simplicity, security, portability and more into a single language.$jp53$, 1, 4),
  ('tq-java-features-of-java-6', 'pt-java-features-of-java',
   $jp54$Which is NOT listed as a Java feature?$jp54$,
   $jp55$["Secure", "Robust", "Machine-dependent", "Simple"]$jp55$::jsonb,
   2, $jp56$Java is machine-INdependent at the bytecode level — the opposite of machine-dependent.$jp56$, 1, 5),
  ('tq-java-features-of-java-7', 'pt-java-features-of-java',
   $jp57$"Robust", as a Java feature, refers to ___.$jp57$,
   $jp58$["strong error handling and reliability", "large file sizes", "fast typing", "colourful console output"]$jp58$::jsonb,
   0, $jp59$Robust means Java programs are reliable, with strong compile-time checks and exception handling.$jp59$, 1, 6),
  ('tq-java-features-of-java-8', 'pt-java-features-of-java',
   $jp60$Being "object-oriented" means Java organises code around ___.$jp60$,
   $jp61$["global variables", "objects and classes", "line numbers", "text macros"]$jp61$::jsonb,
   1, $jp62$OOP structures a program as interacting objects created from classes.$jp62$, 1, 7),
  ('tq-java-features-of-java-9', 'pt-java-features-of-java',
   $jp63$Why is knowing Java's features useful for interviews?$jp63$,
   $jp64$["They are kept secret", "They are almost never asked", "They are a very common basic question", "They change with every release"]$jp64$::jsonb,
   2, $jp65$"List the main features of Java" is one of the most frequently asked beginner questions.$jp65$, 1, 8),
  ('tq-java-features-of-java-10', 'pt-java-features-of-java',
   $jp66$Which pair of features is correctly stated?$jp66$,
   $jp67$["Platform-independent and multithreaded", "Compiled-only and single-threaded", "Pointer-based and unmanaged", "Interpreted-only and unsafe"]$jp67$::jsonb,
   0, $jp68$Java is both platform-independent (bytecode + JVM) and multithreaded.$jp68$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-features-of-java' and question_count <> 10;

-- Java vs C/C++ — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp69$introduction-to-java/java-vs-c-c$jp69$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-java-vs-c-c', $jp70$Java vs C/C++ - Quick Test$jp70$, 'aptitude', 10, 10,
  $jp71$10 questions comparing Java with C and C++.$jp71$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp72$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp72$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-java-vs-c-c-1', 'pt-java-java-vs-c-c',
   $jp73$In Java, unused memory is freed automatically by ___; in C/C++ the programmer often frees it manually.$jp73$,
   $jp74$["the garbage collector", "the preprocessor", "the linker", "no one — it is never freed"]$jp74$::jsonb,
   0, $jp75$Java's garbage collector reclaims unreachable objects automatically.$jp75$, 1, 0),
  ('tq-java-java-vs-c-c-2', 'pt-java-java-vs-c-c',
   $jp76$Which does Java NOT expose directly to the programmer?$jp76$,
   $jp77$["pointers", "methods", "classes", "variables"]$jp77$::jsonb,
   0, $jp78$Java hides raw pointers; you work with references instead, and no pointer arithmetic is allowed.$jp78$, 1, 1),
  ('tq-java-java-vs-c-c-3', 'pt-java-java-vs-c-c',
   $jp79$The automatic-car vs manual-car analogy compares Java to ___.$jp79$,
   $jp80$["a bicycle", "a train", "the manual car", "the automatic car"]$jp80$::jsonb,
   3, $jp81$Java is like an automatic car — it handles the "gear changes" (memory) for you.$jp81$, 1, 2),
  ('tq-java-java-vs-c-c-4', 'pt-java-java-vs-c-c',
   $jp82$A C++ program usually needs to be ___ for each operating system; a compiled Java program does not.$jp82$,
   $jp83$["recompiled", "deleted", "encrypted", "rewritten in another language"]$jp83$::jsonb,
   0, $jp84$C/C++ compiles to OS/CPU-specific machine code; Java bytecode is platform-neutral.$jp84$, 1, 3),
  ('tq-java-java-vs-c-c-5', 'pt-java-java-vs-c-c',
   $jp85$Which is an advantage C/C++ has over Java?$jp85$,
   $jp86$["Automatic memory management", "More direct, low-level control over memory", "Platform independence", "A garbage collector"]$jp86$::jsonb,
   1, $jp87$C/C++ trades safety for finer manual control over memory and hardware.$jp87$, 1, 4),
  ('tq-java-java-vs-c-c-6', 'pt-java-java-vs-c-c',
   $jp88$Java was designed ___ C/C++.$jp88$,
   $jp89$["instead of anyone ever using", "before", "after", "at exactly the same time as"]$jp89$::jsonb,
   2, $jp90$Java came later and deliberately removed some of C/C++'s riskier low-level features.$jp90$, 1, 5),
  ('tq-java-java-vs-c-c-7', 'pt-java-java-vs-c-c',
   $jp91$"Garbage collection" in Java refers to ___.$jp91$,
   $jp92$["clearing the console", "deleting source files", "automatically reclaiming unused memory", "removing comments"]$jp92$::jsonb,
   2, $jp93$The garbage collector frees memory held by objects the program can no longer reach.$jp93$, 1, 6),
  ('tq-java-java-vs-c-c-8', 'pt-java-java-vs-c-c',
   $jp94$Which statement is TRUE?$jp94$,
   $jp95$["Java's syntax is completely unlike C/C++", "Java keeps a C/C++-like syntax while adding safety", "C++ cannot manage memory manually", "Java has no automatic memory management"]$jp95$::jsonb,
   1, $jp96$Java's syntax is familiar to C/C++ programmers, but it adds automatic memory management and other safety.$jp96$, 1, 7),
  ('tq-java-java-vs-c-c-9', 'pt-java-java-vs-c-c',
   $jp97$Removing direct memory control makes Java programs generally ___.$jp97$,
   $jp98$["always faster than C", "safer and easier to manage", "unable to use loops", "impossible to debug"]$jp98$::jsonb,
   1, $jp99$Less manual control means fewer memory bugs and easier maintenance.$jp99$, 1, 8),
  ('tq-java-java-vs-c-c-10', 'pt-java-java-vs-c-c',
   $jp100$Which task is more error-prone in C/C++ than in Java, per the notes?$jp100$,
   $jp101$["Declaring variables", "Writing comments", "Printing text", "Manual memory management"]$jp101$::jsonb,
   3, $jp102$Manual allocate/free work in C/C++ causes leaks and dangling pointers that Java's GC avoids.$jp102$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-java-vs-c-c' and question_count <> 10;

-- JDK, JRE and JVM — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp103$introduction-to-java/jdk-jre-and-jvm$jp103$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-jdk-jre-and-jvm', $jp104$JDK, JRE and JVM - Quick Test$jp104$, 'aptitude', 10, 10,
  $jp105$10 questions on the three pieces you install and use to build and run Java.$jp105$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp106$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp106$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-jdk-jre-and-jvm-1', 'pt-java-jdk-jre-and-jvm',
   $jp107$Which one contains the Java compiler?$jp107$,
   $jp108$["JVM", "JRE", "JDK", "none of them"]$jp108$::jsonb,
   2, $jp109$The JDK bundles development tools, including the compiler (javac).$jp109$, 1, 0),
  ('tq-java-jdk-jre-and-jvm-2', 'pt-java-jdk-jre-and-jvm',
   $jp110$JRE stands for ___.$jp110$,
   $jp111$["Java Reference Edition", "Java Resource Executor", "Java Runtime Environment", "Java Rapid Engine"]$jp111$::jsonb,
   2, $jp112$JRE = Java Runtime Environment: the JVM plus the standard libraries.$jp112$, 1, 1),
  ('tq-java-jdk-jre-and-jvm-3', 'pt-java-jdk-jre-and-jvm',
   $jp113$Which one actually executes Java bytecode?$jp113$,
   $jp114$["JDK", "JVM", "the IDE", "the source file"]$jp114$::jsonb,
   1, $jp115$The JVM (Java Virtual Machine) runs the compiled bytecode.$jp115$, 1, 2),
  ('tq-java-jdk-jre-and-jvm-4', 'pt-java-jdk-jre-and-jvm',
   $jp116$The relationship is best written as ___.$jp116$,
   $jp117$["JRE = JDK + tools", "JVM = JDK + JRE", "JDK = JVM only", "JDK = JRE + development tools"]$jp117$::jsonb,
   3, $jp118$JDK = JRE + development tools; JRE = JVM + libraries.$jp118$, 1, 3),
  ('tq-java-jdk-jre-and-jvm-5', 'pt-java-jdk-jre-and-jvm',
   $jp119$To only RUN Java apps (not build them) you need at least the ___.$jp119$,
   $jp120$["JRE", "source code", "compiler", "JDK"]$jp120$::jsonb,
   0, $jp121$The JRE has the JVM and libraries — enough to run a program but not to compile one.$jp121$, 1, 4),
  ('tq-java-jdk-jre-and-jvm-6', 'pt-java-jdk-jre-and-jvm',
   $jp122$In the kitchen analogy, the JVM is the ___.$jp122$,
   $jp123$["recipe book", "stove that actually cooks", "whole kitchen", "grocery store"]$jp123$::jsonb,
   1, $jp124$The JVM does the actual work of running the program, like a stove cooking the food.$jp124$, 1, 5),
  ('tq-java-jdk-jre-and-jvm-7', 'pt-java-jdk-jre-and-jvm',
   $jp125$Which command compiles a .java file?$jp125$,
   $jp126$["jshell", "jar", "java", "javac"]$jp126$::jsonb,
   3, $jp127$javac (Java compiler) turns source into a .class file; it ships with the JDK.$jp127$, 1, 6),
  ('tq-java-jdk-jre-and-jvm-8', 'pt-java-jdk-jre-and-jvm',
   $jp128$JRE = JVM + ___.$jp128$,
   $jp129$["libraries", "source files", "the operating system", "development tools"]$jp129$::jsonb,
   0, $jp130$The JRE adds the standard class libraries on top of the JVM.$jp130$, 1, 7),
  ('tq-java-jdk-jre-and-jvm-9', 'pt-java-jdk-jre-and-jvm',
   $jp131$Which is TRUE?$jp131$,
   $jp132$["The JDK includes everything the JRE has, plus more", "The JRE cannot run programs", "The JVM includes the compiler", "The JDK is a subset of the JRE"]$jp132$::jsonb,
   0, $jp133$The JDK is a superset: JRE plus development tools.$jp133$, 1, 8),
  ('tq-java-jdk-jre-and-jvm-10', 'pt-java-jdk-jre-and-jvm',
   $jp134$Running java MyProgram uses the ___ to run the bytecode.$jp134$,
   $jp135$["JDK compiler", "JRE and JVM", "text editor", "package manager"]$jp135$::jsonb,
   1, $jp136$The java launcher starts the JVM (part of the JRE) to execute MyProgram.class.$jp136$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-jdk-jre-and-jvm' and question_count <> 10;

-- How Java Works — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp137$introduction-to-java/how-java-works$jp137$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-how-java-works', $jp138$How Java Works - Quick Test$jp138$, 'aptitude', 10, 10,
  $jp139$10 questions on the journey from source code to running program.$jp139$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp140$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp140$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-how-java-works-1', 'pt-java-how-java-works',
   $jp141$Correct order of the Java build-and-run process:$jp141$,
   $jp142$["Source code -> Compilation -> Bytecode -> JVM execution", "JVM -> Source -> Bytecode", "Source -> JVM -> Compilation", "Bytecode -> Source -> JVM"]$jp142$::jsonb,
   0, $jp143$You write source, compile it to bytecode, then the JVM executes that bytecode.$jp143$, 1, 0),
  ('tq-java-how-java-works-2', 'pt-java-how-java-works',
   $jp144$Compiled Java bytecode is stored in files with the extension ___.$jp144$,
   $jp145$[".java", ".class", ".exe", ".byte"]$jp145$::jsonb,
   1, $jp146$javac produces one .class file per class, containing its bytecode.$jp146$, 1, 1),
  ('tq-java-how-java-works-3', 'pt-java-how-java-works',
   $jp147$What makes Java platform-independent?$jp147$,
   $jp148$["the text editor used", "the file name", "the source code itself", "the bytecode plus a per-platform JVM"]$jp148$::jsonb,
   3, $jp149$The bytecode is the same everywhere; only the JVM differs per operating system.$jp149$, 1, 2),
  ('tq-java-how-java-works-4', 'pt-java-how-java-works',
   $jp150$In the translator analogy, the JVM on each OS acts like ___.$jp150$,
   $jp151$["the paper", "the envelope", "the letter writer", "a local translator reading the universal script aloud"]$jp151$::jsonb,
   3, $jp152$You write once (bytecode); each platform's JVM "reads it aloud" correctly for that platform.$jp152$, 1, 3),
  ('tq-java-how-java-works-5', 'pt-java-how-java-works',
   $jp153$The tool that turns .java into .class is the ___.$jp153$,
   $jp154$["Java compiler (javac)", "linker", "class loader", "JVM"]$jp154$::jsonb,
   0, $jp155$javac performs the compilation step.$jp155$, 1, 4),
  ('tq-java-how-java-works-6', 'pt-java-how-java-works',
   $jp156$Bytecode is ___.$jp156$,
   $jp157$["human-readable prose", "a platform-neutral intermediate format", "raw machine code for one specific CPU", "identical to the source code"]$jp157$::jsonb,
   1, $jp158$Bytecode sits between source and machine code and is not tied to any CPU.$jp158$, 1, 5),
  ('tq-java-how-java-works-7', 'pt-java-how-java-works',
   $jp159$Why does the same .class file work on Windows and Linux?$jp159$,
   $jp160$["Each OS has its own JVM that understands the same bytecode", "The OS ignores it", "It contains OS-specific machine code", "It is recompiled each time it runs"]$jp160$::jsonb,
   0, $jp161$The JVM is the platform-specific piece; the bytecode it runs is not.$jp161$, 1, 6),
  ('tq-java-how-java-works-8', 'pt-java-how-java-works',
   $jp162$Which step happens FIRST?$jp162$,
   $jp163$["Output is printed", "The JVM executes bytecode", "You write the source code", "The .class file is created"]$jp163$::jsonb,
   2, $jp164$Everything starts from source code you write.$jp164$, 1, 7),
  ('tq-java-how-java-works-9', 'pt-java-how-java-works',
   $jp165$Running javac Program.java produces ___.$jp165$,
   $jp166$["Program.exe", "Program.class", "Program.jar", "nothing"]$jp166$::jsonb,
   1, $jp167$Compilation creates the bytecode file Program.class.$jp167$, 1, 8),
  ('tq-java-how-java-works-10', 'pt-java-how-java-works',
   $jp168$The "compile, then run on a VM" model is the reason Java can ___.$jp168$,
   $jp169$["run with no runtime at all", "skip compilation entirely", "run unchanged across operating systems", "avoid using classes"]$jp169$::jsonb,
   2, $jp170$One compiled artifact runs on any OS that provides a JVM.$jp170$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-how-java-works' and question_count <> 10;

-- Installing Java — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp171$introduction-to-java/installing-java$jp171$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-installing-java', $jp172$Installing Java - Quick Test$jp172$, 'aptitude', 10, 10,
  $jp173$10 questions on setting up the JDK and confirming it works.$jp173$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp174$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp174$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-installing-java-1', 'pt-java-installing-java',
   $jp175$To write and compile your own Java programs you must install the ___.$jp175$,
   $jp176$["JDK", "a web browser", "an antivirus tool", "JRE only"]$jp176$::jsonb,
   0, $jp177$Only the JDK includes the compiler and other tools needed to build programs.$jp177$, 1, 0),
  ('tq-java-installing-java-2', 'pt-java-installing-java',
   $jp178$Which command confirms Java can RUN and prints the installed version?$jp178$,
   $jp179$["version java", "java -version", "run java", "java --compile"]$jp179$::jsonb,
   1, $jp180$java -version reports the runtime version and confirms the launcher works.$jp180$, 1, 1),
  ('tq-java-installing-java-3', 'pt-java-installing-java',
   $jp181$Which environment variable should point to your JDK installation folder?$jp181$,
   $jp182$["JAVA_HOME", "JDK_DIR", "CLASSFILE", "JAVA_PATH"]$jp182$::jsonb,
   0, $jp183$Tools and build systems read JAVA_HOME to locate the JDK.$jp183$, 1, 2),
  ('tq-java-installing-java-4', 'pt-java-installing-java',
   $jp184$Adding Java to the system ___ lets you run java and javac from any folder.$jp184$,
   $jp185$["clipboard", "PATH", "README", "recycle bin"]$jp185$::jsonb,
   1, $jp186$The PATH tells the shell where to find executable commands.$jp186$, 1, 3),
  ('tq-java-installing-java-5', 'pt-java-installing-java',
   $jp187$Installing the JDK is compared in the notes to ___.$jp187$,
   $jp188$["the one-time initial setup of a new smartphone", "debugging", "garbage collection", "writing your first program"]$jp188$::jsonb,
   0, $jp189$It is a one-time setup you do before you can build anything.$jp189$, 1, 4),
  ('tq-java-installing-java-6', 'pt-java-installing-java',
   $jp190$javac -version is used to check that ___ is available.$jp190$,
   $jp191$["the browser", "the internet", "the printer", "the compiler"]$jp191$::jsonb,
   3, $jp192$javac is the compiler; this confirms the JDK (not just a JRE) is installed.$jp192$, 1, 5),
  ('tq-java-installing-java-7', 'pt-java-installing-java',
   $jp193$How often do you normally install the JDK for a machine?$jp193$,
   $jp194$["Before every program", "Once, then reuse it", "Every time you restart", "Never"]$jp194$::jsonb,
   1, $jp195$Install once; every later project uses the same installation.$jp195$, 1, 6),
  ('tq-java-installing-java-8', 'pt-java-installing-java',
   $jp196$If java -version fails in the terminal after installing, a likely cause is ___.$jp196$,
   $jp197$["the monitor is off", "the source file has comments", "the class has no main method", "the PATH is not set correctly"]$jp197$::jsonb,
   3, $jp198$If the shell cannot find java on the PATH, the command fails even though Java is installed.$jp198$, 1, 7),
  ('tq-java-installing-java-9', 'pt-java-installing-java',
   $jp199$Which is TRUE?$jp199$,
   $jp200$["PATH is only used for image files", "The JRE alone is enough to compile code", "The JDK includes the tools needed to compile code", "Installing Java deletes other software"]$jp200$::jsonb,
   2, $jp201$Compilation needs javac, which comes with the JDK.$jp201$, 1, 8),
  ('tq-java-installing-java-10', 'pt-java-installing-java',
   $jp202$Installing Java is described as the ___ practical step before writing a real program.$jp202$,
   $jp203$["hardest", "last", "very first", "optional"]$jp203$::jsonb,
   2, $jp204$Without the JDK your computer cannot compile or run Java at all.$jp204$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-installing-java' and question_count <> 10;

-- Java Program Structure — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp205$introduction-to-java/java-program-structure$jp205$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-java-program-structure', $jp206$Java Program Structure - Quick Test$jp206$, 'aptitude', 10, 10,
  $jp207$10 questions on the standard layout every Java file follows.$jp207$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp208$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp208$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-java-program-structure-1', 'pt-java-java-program-structure',
   $jp209$Correct top-to-bottom order in a Java file:$jp209$,
   $jp210$["class, package, imports", "class, imports, package", "imports, package, class", "package, imports, class"]$jp210$::jsonb,
   3, $jp211$package first (if present), then imports, then the class definition.$jp211$, 1, 0),
  ('tq-java-java-program-structure-2', 'pt-java-java-program-structure',
   $jp212$How many public classes may a single .java file contain?$jp212$,
   $jp213$["exactly one", "exactly two", "unlimited", "zero"]$jp213$::jsonb,
   0, $jp214$At most one public class per file, and its name must match the file name.$jp214$, 1, 1),
  ('tq-java-java-program-structure-3', 'pt-java-java-program-structure',
   $jp215$The public class name must match the ___.$jp215$,
   $jp216$["method name", "variable name", "package name", "file name"]$jp216$::jsonb,
   3, $jp217$public class Report must be in Report.java.$jp217$, 1, 2),
  ('tq-java-java-program-structure-4', 'pt-java-java-program-structure',
   $jp218$Which part of a Java file is optional?$jp218$,
   $jp219$["the class definition", "the package statement", "the closing brace", "the braces around main"]$jp219$::jsonb,
   1, $jp220$A file may omit the package statement (it then belongs to the default package).$jp220$, 1, 3),
  ('tq-java-java-program-structure-5', 'pt-java-java-program-structure',
   $jp221$The required signature of the entry-point method is ___.$jp221$,
   $jp222$["public static void main(String[] args)", "public void main(String args)", "static main(String[] args)", "void main()"]$jp222$::jsonb,
   0, $jp223$The JVM looks for exactly public static void main(String[] args).$jp223$, 1, 4),
  ('tq-java-java-program-structure-6', 'pt-java-java-program-structure',
   $jp224$import statements are used to ___.$jp224$,
   $jp225$["bring in classes from other packages", "end the program", "declare local variables", "rename the class"]$jp225$::jsonb,
   0, $jp226$import makes classes from other packages usable by their short name.$jp226$, 1, 5),
  ('tq-java-java-program-structure-7', 'pt-java-java-program-structure',
   $jp227$Class-level fields are typically declared ___.$jp227$,
   $jp228$["outside the class", "inside the class, often before the methods", "after the final closing brace", "in the package line"]$jp228$::jsonb,
   1, $jp229$Fields live directly inside the class body.$jp229$, 1, 6),
  ('tq-java-java-program-structure-8', 'pt-java-java-program-structure',
   $jp230$The college-application-form analogy highlights that Java files have a ___ structure.$jp230$,
   $jp231$["colour-coded", "random", "predictable, standard", "secret"]$jp231$::jsonb,
   2, $jp232$The same fixed order every time makes any Java file easy to read.$jp232$, 1, 7),
  ('tq-java-java-program-structure-9', 'pt-java-java-program-structure',
   $jp233$Which is TRUE about the package statement?$jp233$,
   $jp234$["It replaces the class keyword", "It must appear after the imports", "It must be the first statement in the file, if present", "It is required in every file"]$jp234$::jsonb,
   2, $jp235$If a file declares a package, that line comes before everything else.$jp235$, 1, 8),
  ('tq-java-java-program-structure-10', 'pt-java-java-program-structure',
   $jp236$Program execution inside a class begins in the ___ method.$jp236$,
   $jp237$["first", "main", "last", "constructor"]$jp237$::jsonb,
   1, $jp238$The JVM starts the program at main.$jp238$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-java-program-structure' and question_count <> 10;

-- First Java Program — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp239$introduction-to-java/first-java-program$jp239$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-first-java-program', $jp240$First Java Program - Quick Test$jp240$, 'aptitude', 10, 10,
  $jp241$10 questions on the smallest working Java program and how it prints output.$jp241$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp242$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp242$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-first-java-program-1', 'pt-java-first-java-program',
   $jp243$Which line correctly prints text to the console?$jp243$,
   $jp244$["echo \"Hi\";", "console.log(\"Hi\");", "System.out.println(\"Hi\");", "print(\"Hi\");"]$jp244$::jsonb,
   2, $jp245$System.out.println(...) writes a line to standard output in Java.$jp245$, 1, 0),
  ('tq-java-first-java-program-2', 'pt-java-first-java-program',
   $jp246$A Java program needs at least ___ to run.$jp246$,
   $jp247$["one class", "two classes", "no class", "one interface"]$jp247$::jsonb,
   0, $jp248$All Java code lives inside classes; you need at least one.$jp248$, 1, 1),
  ('tq-java-first-java-program-3', 'pt-java-first-java-program',
   $jp249$If the public class is HelloJava, the file must be named ___.$jp249$,
   $jp250$["hellojava.java", "HelloJava.java", "Hello.java", "main.java"]$jp250$::jsonb,
   1, $jp251$The file name must match the public class name exactly, including capitals.$jp251$, 1, 2),
  ('tq-java-first-java-program-4', 'pt-java-first-java-program',
   $jp252$println differs from print because println ___.$jp252$,
   $jp253$["adds a newline after the text", "prints in colour", "repeats the text twice", "prints nothing"]$jp253$::jsonb,
   0, $jp254$println moves to a new line after printing; print does not.$jp254$, 1, 3),
  ('tq-java-first-java-program-5', 'pt-java-first-java-program',
   $jp255$What is the output of System.out.println(5 + 3);?$jp255$,
   $jp256$["8", "\"8\"", "53", "5 + 3"]$jp256$::jsonb,
   0, $jp257$Both operands are numbers, so + adds them: 8.$jp257$, 1, 4),
  ('tq-java-first-java-program-6', 'pt-java-first-java-program',
   $jp258$What is the output of System.out.println("5" + 3);?$jp258$,
   $jp259$["a compile error", "8", "53", "\"53\""]$jp259$::jsonb,
   2, $jp260$"5" is text, so + joins the values into the string 53.$jp260$, 1, 5),
  ('tq-java-first-java-program-7', 'pt-java-first-java-program',
   $jp261$Which is the valid entry-point method header?$jp261$,
   $jp262$["static void main[String args]", "public static void main(String[] args)", "public static void Main(String[] args)", "public void main()"]$jp262$::jsonb,
   1, $jp263$The JVM requires exactly this header (name and capitalisation matter).$jp263$, 1, 6),
  ('tq-java-first-java-program-8', 'pt-java-first-java-program',
   $jp264$Statements inside main normally end with a ___.$jp264$,
   $jp265$["period", "colon", "comma", "semicolon"]$jp265$::jsonb,
   3, $jp266$Each Java statement ends with a semicolon.$jp266$, 1, 7),
  ('tq-java-first-java-program-9', 'pt-java-first-java-program',
   $jp267$Java is ___, so Println and println are not the same.$jp267$,
   $jp268$["case-insensitive", "case-sensitive", "whitespace-sensitive", "line-numbered"]$jp268$::jsonb,
   1, $jp269$Java treats identifiers with different capitalisation as different names.$jp269$, 1, 8),
  ('tq-java-first-java-program-10', 'pt-java-first-java-program',
   $jp270$What does this print?

```java
public class Main {
    public static void main(String[] args) {
        System.out.print("Java");
        System.out.println("Rocks");
    }
}
```$jp270$,
   $jp271$["Java then Rocks on the next line", "Rocks", "Java Rocks", "JavaRocks"]$jp271$::jsonb,
   3, $jp272$print writes Java with no newline, then println writes Rocks right after it: JavaRocks.$jp272$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-first-java-program' and question_count <> 10;

-- Variables — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp273$introduction-to-java/variables$jp273$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-variables', $jp274$Variables - Quick Test$jp274$, 'aptitude', 10, 10,
  $jp275$10 questions on declaring, naming and changing variables in Java.$jp275$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp276$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp276$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-variables-1', 'pt-java-variables',
   $jp277$Which declares an integer variable named count set to 0?$jp277$,
   $jp278$["int count = 0;", "count int = 0;", "integer count = 0;", "int 0 = count;"]$jp278$::jsonb,
   0, $jp279$The form is: type name = value;$jp279$, 1, 0),
  ('tq-java-variables-2', 'pt-java-variables',
   $jp280$In Java, age and Age are ___.$jp280$,
   $jp281$["the same variable", "two different variables", "both keywords", "illegal names"]$jp281$::jsonb,
   1, $jp282$Identifiers are case-sensitive, so these are distinct names.$jp282$, 1, 1),
  ('tq-java-variables-3', 'pt-java-variables',
   $jp283$After int x = 5; which is NOT allowed later?$jp283$,
   $jp284$["x = \"hello\";", "x = -3;", "x = 10;", "x = x + 1;"]$jp284$::jsonb,
   0, $jp285$x is an int; assigning a String to it is a type error. The value may change, the type may not.$jp285$, 1, 2),
  ('tq-java-variables-4', 'pt-java-variables',
   $jp286$What does this print?

```java
int a = 4;
a = a + 6;
System.out.println(a);
```$jp286$,
   $jp287$["6", "10", "a + 6", "4"]$jp287$::jsonb,
   1, $jp288$a + 6 is 10, and that is stored back into a before it is printed.$jp288$, 1, 3),
  ('tq-java-variables-5', 'pt-java-variables',
   $jp289$A variable must be ___ before it is used.$jp289$,
   $jp290$["commented", "capitalised", "printed", "declared with a type"]$jp290$::jsonb,
   3, $jp291$Java requires a declaration (type + name) before first use.$jp291$, 1, 4),
  ('tq-java-variables-6', 'pt-java-variables',
   $jp292$Which is a valid variable declaration?$jp292$,
   $jp293$["double price = 9.99;", "double price = \"9.99\";", "9.99 = double price;", "price = double 9.99;"]$jp293$::jsonb,
   0, $jp294$A double holds a numeric literal like 9.99, written type name = value;$jp294$, 1, 5),
  ('tq-java-variables-7', 'pt-java-variables',
   $jp295$What is the value of b after:

```java
int a = 2, b = 3;
b = a;
```$jp295$,
   $jp296$["5", "0", "2", "3"]$jp296$::jsonb,
   2, $jp297$b = a copies a's value (2) into b.$jp297$, 1, 6),
  ('tq-java-variables-8', 'pt-java-variables',
   $jp298$The general form of a variable declaration is ___.$jp298$,
   $jp299$["value name dataType;", "dataType name = value;", "name = value dataType;", "= dataType name value;"]$jp299$::jsonb,
   1, $jp300$Type, then name, then = value.$jp300$, 1, 7),
  ('tq-java-variables-9', 'pt-java-variables',
   $jp301$Can a variable's type change during execution?$jp301$,
   $jp302$["Only inside loops", "Yes, at any time", "No, the type is fixed at declaration", "Only for int"]$jp302$::jsonb,
   2, $jp303$The value can change; the declared type cannot.$jp303$, 1, 8),
  ('tq-java-variables-10', 'pt-java-variables',
   $jp304$What prints?

```java
String city = "Pune";
int pin = 411001;
System.out.println(city + " " + pin);
```$jp304$,
   $jp305$["Pune+411001", "city pin", "411001 Pune", "Pune 411001"]$jp305$::jsonb,
   3, $jp306$The + operator joins the string, a space, and the number's text form.$jp306$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-variables' and question_count <> 10;

-- Data Types — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp307$introduction-to-java/data-types$jp307$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-data-types', $jp308$Data Types - Quick Test$jp308$, 'aptitude', 10, 10,
  $jp309$10 questions on Java's primitive types, String, and how they behave.$jp309$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp310$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp310$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-data-types-1', 'pt-java-data-types',
   $jp311$How many primitive types does Java have?$jp311$,
   $jp312$["7", "8", "10", "6"]$jp312$::jsonb,
   1, $jp313$byte, short, int, long, float, double, char, boolean — eight in total.$jp313$, 1, 0),
  ('tq-java-data-types-2', 'pt-java-data-types',
   $jp314$Which of these is NOT a primitive type?$jp314$,
   $jp315$["char", "int", "double", "String"]$jp315$::jsonb,
   3, $jp316$String is a class (a reference type), not a primitive.$jp316$, 1, 1),
  ('tq-java-data-types-3', 'pt-java-data-types',
   $jp317$Which type stores true / false?$jp317$,
   $jp318$["boolean", "flag", "bool", "bit"]$jp318$::jsonb,
   0, $jp319$The boolean type holds exactly true or false.$jp319$, 1, 2),
  ('tq-java-data-types-4', 'pt-java-data-types',
   $jp320$What is the output of System.out.println(7 / 2); (both operands int)?$jp320$,
   $jp321$["3", "4", "3.0", "3.5"]$jp321$::jsonb,
   0, $jp322$int / int does integer division and drops the fraction: 3.$jp322$, 1, 3),
  ('tq-java-data-types-5', 'pt-java-data-types',
   $jp323$Which literal is a char?$jp323$,
   $jp324$["\"A\"", "A with no quotes", "backtick A backtick", "'A'"]$jp324$::jsonb,
   3, $jp325$A char literal uses single quotes; double quotes make a String.$jp325$, 1, 4),
  ('tq-java-data-types-6', 'pt-java-data-types',
   $jp326$A whole-number literal like 100 defaults to which type?$jp326$,
   $jp327$["short", "int", "long", "byte"]$jp327$::jsonb,
   1, $jp328$Integer literals are int by default unless suffixed with L.$jp328$, 1, 5),
  ('tq-java-data-types-7', 'pt-java-data-types',
   $jp329$Which type is best for a person's age in whole years?$jp329$,
   $jp330$["double", "int", "String", "boolean"]$jp330$::jsonb,
   1, $jp331$An age in years is a whole number, so int fits and wastes no space.$jp331$, 1, 6),
  ('tq-java-data-types-8', 'pt-java-data-types',
   $jp332$double is used for ___.$jp332$,
   $jp333$["true/false values", "text", "decimal (fractional) numbers", "single characters"]$jp333$::jsonb,
   2, $jp334$double stores fractional numbers such as 90.5.$jp334$, 1, 7),
  ('tq-java-data-types-9', 'pt-java-data-types',
   $jp335$What is the output of System.out.println(3.0 / 2);?$jp335$,
   $jp336$["1.0", "1", "1.5", "2"]$jp336$::jsonb,
   2, $jp337$One operand is a double, so the division is done in floating point: 1.5.$jp337$, 1, 8),
  ('tq-java-data-types-10', 'pt-java-data-types',
   $jp338$Which statement is TRUE?$jp338$,
   $jp339$["A boolean can hold only true or false", "int can store 3.14", "String is a primitive type", "char values use double quotes"]$jp339$::jsonb,
   0, $jp340$boolean has exactly two values; int holds whole numbers only; String is a class; char uses single quotes.$jp340$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-data-types' and question_count <> 10;

-- Type Casting — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp341$introduction-to-java/type-casting$jp341$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-type-casting', $jp342$Type Casting - Quick Test$jp342$, 'aptitude', 10, 10,
  $jp343$10 questions on widening, narrowing, truncation and converting between types.$jp343$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp344$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp344$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-type-casting-1', 'pt-java-type-casting',
   $jp345$Converting int to double happens ___.$jp345$,
   $jp346$["automatically (widening)", "never", "only via parseInt", "only with an explicit cast"]$jp346$::jsonb,
   0, $jp347$Widening to a larger type is implicit because no data is lost.$jp347$, 1, 0),
  ('tq-java-type-casting-2', 'pt-java-type-casting',
   $jp348$What is the value of (int) 9.8?$jp348$,
   $jp349$["9", "9.8", "0", "10"]$jp349$::jsonb,
   0, $jp350$Casting a double to int truncates (drops) the fractional part.$jp350$, 1, 1),
  ('tq-java-type-casting-3', 'pt-java-type-casting',
   $jp351$Explicit casting uses which syntax?$jp351$,
   $jp352$["<type> value", "(type) value", "value as type", "cast(value)"]$jp352$::jsonb,
   1, $jp353$You write the target type in parentheses before the value.$jp353$, 1, 2),
  ('tq-java-type-casting-4', 'pt-java-type-casting',
   $jp354$Narrowing a double to an int can ___.$jp354$,
   $jp355$["convert it to a String", "add precision", "lose the fractional part", "always cause a compile error"]$jp355$::jsonb,
   2, $jp356$The decimal part is discarded during the narrowing cast.$jp356$, 1, 3),
  ('tq-java-type-casting-5', 'pt-java-type-casting',
   $jp357$To turn the String "42" into an int you use ___.$jp357$,
   $jp358$["int(\"42\")", "(int) \"42\"", "Integer.parseInt(\"42\")", "\"42\".toInt()"]$jp358$::jsonb,
   2, $jp359$String-to-number needs a parsing method; a cast does not work between String and int.$jp359$, 1, 4),
  ('tq-java-type-casting-6', 'pt-java-type-casting',
   $jp360$Which conversion needs an explicit cast?$jp360$,
   $jp361$["int -> double", "byte -> int", "int -> long", "double -> int"]$jp361$::jsonb,
   3, $jp362$double -> int is narrowing and may lose data, so it must be written explicitly.$jp362$, 1, 5),
  ('tq-java-type-casting-7', 'pt-java-type-casting',
   $jp363$What is the output?

```java
double d = 5;
System.out.println(d);
```$jp363$,
   $jp364$["5", "5.0", "5.00", "a compile error"]$jp364$::jsonb,
   1, $jp365$The int 5 is widened to double, and a double prints as 5.0.$jp365$, 1, 6),
  ('tq-java-type-casting-8', 'pt-java-type-casting',
   $jp366$What is (int) -3.9?$jp366$,
   $jp367$["3", "-3.9", "-4", "-3"]$jp367$::jsonb,
   3, $jp368$Truncation moves toward zero, so -3.9 becomes -3, not -4.$jp368$, 1, 7),
  ('tq-java-type-casting-9', 'pt-java-type-casting',
   $jp369$After char c = 'A'; int n = c; the value of n is ___.$jp369$,
   $jp370$["0", "65", "1", "the letter A"]$jp370$::jsonb,
   1, $jp371$A char widens to its Unicode code point; 'A' is 65.$jp371$, 1, 8),
  ('tq-java-type-casting-10', 'pt-java-type-casting',
   $jp372$Which statement is TRUE?$jp372$,
   $jp373$["Explicit casting may lose data; implicit does not", "You can cast a String to int with (int)", "Casting changes the original variable's type", "Implicit casting risks data loss; explicit is always safe"]$jp373$::jsonb,
   0, $jp374$Implicit (widening) casts never lose data; explicit (narrowing) casts can.$jp374$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-type-casting' and question_count <> 10;

-- Constants — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp375$introduction-to-java/constants$jp375$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-constants', $jp376$Constants - Quick Test$jp376$, 'aptitude', 10, 10,
  $jp377$10 questions on the final keyword and using fixed values in Java.$jp377$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp378$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp378$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-constants-1', 'pt-java-constants',
   $jp379$Which keyword makes a variable a constant in Java?$jp379$,
   $jp380$["final", "static", "constant", "const"]$jp380$::jsonb,
   0, $jp381$final marks a variable so it cannot be reassigned after initialization.$jp381$, 1, 0),
  ('tq-java-constants-2', 'pt-java-constants',
   $jp382$By convention, constant names are written in ___.$jp382$,
   $jp383$["lowercase", "PascalCase", "camelCase", "UPPERCASE_WITH_UNDERSCORES"]$jp383$::jsonb,
   3, $jp384$e.g. final double TAX_RATE = 0.18;$jp384$, 1, 1),
  ('tq-java-constants-3', 'pt-java-constants',
   $jp385$Trying to reassign a final variable causes ___.$jp385$,
   $jp386$["a runtime warning", "a compile-time error", "silent success", "a brand-new variable"]$jp386$::jsonb,
   1, $jp387$The compiler rejects any assignment to a final variable after its first value.$jp387$, 1, 2),
  ('tq-java-constants-4', 'pt-java-constants',
   $jp388$What happens here?

```java
final int MAX = 100;
MAX = 200;
```$jp388$,
   $jp389$["Compile-time error", "MAX stays 100 silently", "A runtime exception", "MAX becomes 200"]$jp389$::jsonb,
   0, $jp390$Reassigning MAX is not allowed, so the code does not compile.$jp390$, 1, 3),
  ('tq-java-constants-5', 'pt-java-constants',
   $jp391$A good use of a constant is ___.$jp391$,
   $jp392$["a temporary running sum", "a loop counter", "a fixed tax rate", "user input"]$jp392$::jsonb,
   2, $jp393$Constants suit values that should never change, like a tax rate or days per week.$jp393$, 1, 4),
  ('tq-java-constants-6', 'pt-java-constants',
   $jp394$Which declaration is a valid constant?$jp394$,
   $jp395$["final PI double = 3.14159;", "final double PI = 3.14159;", "double final PI = 3.14159;", "const double PI = 3.14159;"]$jp395$::jsonb,
   1, $jp396$final comes before the type: final type NAME = value;$jp396$, 1, 5),
  ('tq-java-constants-7', 'pt-java-constants',
   $jp397$Does Java have a dedicated const keyword like some languages?$jp397$,
   $jp398$["Only in newer versions", "Yes", "No, it uses final", "Yes, but only for int"]$jp398$::jsonb,
   2, $jp399$const is a reserved word but unused; final is how you make constants.$jp399$, 1, 6),
  ('tq-java-constants-8', 'pt-java-constants',
   $jp400$Constants mainly improve ___.$jp400$,
   $jp401$["execution speed", "safety and readability of fixed values", "file size", "compilation time"]$jp401$::jsonb,
   1, $jp402$They stop accidental changes and give a meaningful name to a magic number.$jp402$, 1, 7),
  ('tq-java-constants-9', 'pt-java-constants',
   $jp403$A final variable must be given a value ___.$jp403$,
   $jp404$["only at the end of main", "exactly twice", "never", "by the time it is first used (e.g. at declaration)"]$jp404$::jsonb,
   3, $jp405$It must be assigned once before use and can never be reassigned.$jp405$, 1, 8),
  ('tq-java-constants-10', 'pt-java-constants',
   $jp406$Which is TRUE?$jp406$,
   $jp407$["final prevents reassignment after initialization", "final only works on String", "final makes a variable global", "A final value can change once"]$jp407$::jsonb,
   0, $jp408$final locks the value after it is first set.$jp408$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-constants' and question_count <> 10;

-- Keywords and Identifiers — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp409$introduction-to-java/keywords-and-identifiers$jp409$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-keywords-and-identifiers', $jp410$Keywords and Identifiers - Quick Test$jp410$, 'aptitude', 10, 10,
  $jp411$10 questions on reserved words and the rules for names you create.$jp411$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp412$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp412$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-keywords-and-identifiers-1', 'pt-java-keywords-and-identifiers',
   $jp413$Which of these is a Java keyword?$jp413$,
   $jp414$["total", "student", "class", "marks"]$jp414$::jsonb,
   2, $jp415$class is reserved; the others are ordinary identifiers.$jp415$, 1, 0),
  ('tq-java-keywords-and-identifiers-2', 'pt-java-keywords-and-identifiers',
   $jp416$Which is a VALID identifier?$jp416$,
   $jp417$["my-value", "_value2", "class", "2ndValue"]$jp417$::jsonb,
   1, $jp418$It may start with an underscore; it cannot start with a digit, contain a hyphen, or be a keyword.$jp418$, 1, 1),
  ('tq-java-keywords-and-identifiers-3', 'pt-java-keywords-and-identifiers',
   $jp419$An identifier may start with ___.$jp419$,
   $jp420$["a letter, underscore, or dollar sign", "a space", "a hyphen", "a digit"]$jp420$::jsonb,
   0, $jp421$Valid first characters are letters, _ and $.$jp421$, 1, 2),
  ('tq-java-keywords-and-identifiers-4', 'pt-java-keywords-and-identifiers',
   $jp422$Why can't you name a variable int?$jp422$,
   $jp423$["It is too short", "int is a reserved keyword", "It has no vowels", "Identifiers must be capitalised"]$jp423$::jsonb,
   1, $jp424$Keywords already have a fixed meaning and cannot be reused as names.$jp424$, 1, 3),
  ('tq-java-keywords-and-identifiers-5', 'pt-java-keywords-and-identifiers',
   $jp425$Which pair of identifiers is DIFFERENT in Java?$jp425$,
   $jp426$["total and total", "x and x", "count and count", "Count and count"]$jp426$::jsonb,
   3, $jp427$Identifiers are case-sensitive, so Count and count are two different names.$jp427$, 1, 4),
  ('tq-java-keywords-and-identifiers-6', 'pt-java-keywords-and-identifiers',
   $jp428$Which identifier breaks the naming rules?$jp428$,
   $jp429$["firstName", "first_name", "first name", "first$name"]$jp429$::jsonb,
   2, $jp430$An identifier cannot contain a space.$jp430$, 1, 5),
  ('tq-java-keywords-and-identifiers-7', 'pt-java-keywords-and-identifiers',
   $jp431$static is best described as ___.$jp431$,
   $jp432$["a reserved keyword", "a variable name", "a class you define", "an identifier you can reuse"]$jp432$::jsonb,
   0, $jp433$static is one of Java's reserved words.$jp433$, 1, 6),
  ('tq-java-keywords-and-identifiers-8', 'pt-java-keywords-and-identifiers',
   $jp434$Which is a valid, conventional name for a student's total marks?$jp434$,
   $jp435$["TotalMarks", "totalMarks", "total-marks", "1totalMarks"]$jp435$::jsonb,
   1, $jp436$Variables use camelCase by convention; hyphens and a leading digit are invalid.$jp436$, 1, 7),
  ('tq-java-keywords-and-identifiers-9', 'pt-java-keywords-and-identifiers',
   $jp437$Identifiers in Java are ___.$jp437$,
   $jp438$["case-sensitive", "always uppercase", "limited to 8 characters", "case-insensitive"]$jp438$::jsonb,
   0, $jp439$total and Total are distinct; there is no length limit.$jp439$, 1, 8),
  ('tq-java-keywords-and-identifiers-10', 'pt-java-keywords-and-identifiers',
   $jp440$Which list contains ONLY keywords?$jp440$,
   $jp441$["public, name, void", "class, age, if", "for, total, while", "public, static, void"]$jp441$::jsonb,
   3, $jp442$public, static and void are all reserved words; the other lists mix in identifiers.$jp442$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-keywords-and-identifiers' and question_count <> 10;

-- Comments — Quick Test
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp443$introduction-to-java/comments$jp443$)
insert into public.practice_tests
  (id, title, category, question_count, duration_minutes, description,
   total_marks, pass_marks, is_published, difficulty,
   learning_grid_id, learning_topic_id, status, is_premium,
   negative_marking, instructions, show_on_website, show_on_mobile)
select
  'pt-java-comments', $jp444$Comments - Quick Test$jp444$, 'aptitude', 10, 10,
  $jp445$10 questions on Java's three comment styles and how the compiler treats them.$jp445$,
  10, 4, true, 'Easy',
  g.id, tp.id, 'published', false,
  0, $jp446$Answer all 10 questions. Each carries 1 mark. No negative marking. You have 10 minutes to complete this test.$jp446$,
  true, true
from g, tp
on conflict (id) do nothing;

insert into public.test_questions (id, test_id, question_text, options, correct_index, explanation, marks, sort_order)
values
  ('tq-java-comments-1', 'pt-java-comments',
   $jp447$Which starts a single-line comment?$jp447$,
   $jp448$["/*", "#", "//", "--"]$jp448$::jsonb,
   2, $jp449$// begins a comment that runs to the end of the line.$jp449$, 1, 0),
  ('tq-java-comments-2', 'pt-java-comments',
   $jp450$A multi-line comment is written between ___.$jp450$,
   $jp451$["/* and */", "<!-- and -->", "{ and }", "// and //"]$jp451$::jsonb,
   0, $jp452$/* ... */ can span several lines.$jp452$, 1, 1),
  ('tq-java-comments-3', 'pt-java-comments',
   $jp453$Comments are ___ by the compiler.$jp453$,
   $jp454$["executed", "ignored", "converted to code", "printed"]$jp454$::jsonb,
   1, $jp455$They are stripped during compilation and never affect the running program.$jp455$, 1, 2),
  ('tq-java-comments-4', 'pt-java-comments',
   $jp456$/** ... */ is specifically a ___ comment.$jp456$,
   $jp457$["documentation (Javadoc)", "disabled", "block-of-code", "single-line"]$jp457$::jsonb,
   0, $jp458$The /** form is read by the javadoc tool to build API documentation.$jp458$, 1, 3),
  ('tq-java-comments-5', 'pt-java-comments',
   $jp459$What does this print?

```java
System.out.println("A");
// System.out.println("B");
System.out.println("C");
```$jp459$,
   $jp460$["A then B then C", "A then C", "only A", "B then C"]$jp460$::jsonb,
   1, $jp461$The middle line is commented out, so only A and C print.$jp461$, 1, 4),
  ('tq-java-comments-6', 'pt-java-comments',
   $jp462$Good comments should mainly explain ___.$jp462$,
   $jp463$["why the code does something", "the programmer's name", "the file size", "what every line does word for word"]$jp463$::jsonb,
   0, $jp464$The code already shows "what"; comments add the "why".$jp464$, 1, 5),
  ('tq-java-comments-7', 'pt-java-comments',
   $jp465$How many comment styles does Java provide?$jp465$,
   $jp466$["1", "2", "3", "4"]$jp466$::jsonb,
   2, $jp467$Single-line //, multi-line /* */, and documentation /** */.$jp467$, 1, 6),
  ('tq-java-comments-8', 'pt-java-comments',
   $jp468$Which is TRUE?$jp468$,
   $jp469$["You can only have one comment per file", "Comments must be at the top of the file", "Comments slow the program at runtime", "Comments are removed before the bytecode runs and do not affect output"]$jp469$::jsonb,
   3, $jp470$Comments exist only in source code; they never reach the running program.$jp470$, 1, 7),
  ('tq-java-comments-9', 'pt-java-comments',
   $jp471$What is the output?

```java
int x = 10; /* x is ten */ int y = 5;
System.out.println(x + y);
```$jp471$,
   $jp472$["x + y", "a compile error", "10", "15"]$jp472$::jsonb,
   3, $jp473$The block comment is ignored, leaving x = 10 and y = 5, so x + y is 15.$jp473$, 1, 8),
  ('tq-java-comments-10', 'pt-java-comments',
   $jp474$Which comment is correctly formed?$jp474$,
   $jp475$["/* text with no closing", "// a fine single-line comment", "*/ text /*", "/*/"]$jp475$::jsonb,
   1, $jp476$// ... is a complete single-line comment; the others are unbalanced.$jp476$, 1, 9)
on conflict (id) do nothing;

update public.practice_tests set question_count = 10 where id = 'pt-java-comments' and question_count <> 10;

-- ===========================================================================
-- 2. CODING PROBLEMS — 4 per coding topic. dsa_problems, topic_id NULL,
--    learning_topic_id set, Java-only. Skips a slug already taken.
-- ===========================================================================

-- First Java Program — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp477$introduction-to-java/first-java-program$jp477$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-first-java-program-1', null::text, $jp478$Hello in Two Lines$jp478$, 'Easy', 'java-first-java-program-hello-two-lines',
   $jp479$Write a program that prints exactly these two lines:

```
Hello, World!
I am learning Java.
```

There is no input.

**Input:** none.

**Output:** the two lines above.$jp479$,
   $jp480$[{"input": "", "output": "Hello, World!\nI am learning Java."}]$jp480$::jsonb,
   $jp481$["The program reads no input.", "Match the punctuation and capitalisation exactly."]$jp481$::jsonb,
   jsonb_build_object('java', $jp482$public class Main {
    public static void main(String[] args) {
        // print the two lines
    }
}
$jp482$),
   $jp483$["Use System.out.println twice.", "println adds the line break for you."]$jp483$::jsonb,
   $jp484$[{"input": "", "expected": "Hello, World!\nI am learning Java.", "hidden": false}, {"input": "", "expected": "Hello, World!\nI am learning Java.", "hidden": true}]$jp484$::jsonb,
   $jp485$Two println calls, one per line. No input handling is needed for a program that reads nothing.$jp485$,
   jsonb_build_object('java', $jp486$public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("I am learning Java.");
    }
}
$jp486$),
   array['java'], 'published', false, 0),
  ('cp-java-first-java-program-2', null::text, $jp487$Greet the User$jp487$, 'Easy', 'java-first-java-program-greet-user',
   $jp488$Read a single line containing a person's name and print a greeting.

**Input:** one line — the name (it may contain spaces).

**Output:** one line: `Hello, <name>!`$jp488$,
   $jp489$[{"input": "Aditi", "output": "Hello, Aditi!"}]$jp489$::jsonb,
   $jp490$["The name is on one line.", "1 <= length of name <= 40"]$jp490$::jsonb,
   jsonb_build_object('java', $jp491$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.nextLine().trim();
        // print the greeting
    }
}
$jp491$),
   $jp492$["Read the whole line with sc.nextLine().", "Build the output with string concatenation: \"Hello, \" + name + \"!\"."]$jp492$::jsonb,
   $jp493$[{"input": "Aditi", "expected": "Hello, Aditi!", "hidden": false}, {"input": "Rohan", "expected": "Hello, Rohan!", "hidden": false}, {"input": "Sara Khan", "expected": "Hello, Sara Khan!", "hidden": true}, {"input": "  Meera  ", "expected": "Hello, Meera!", "hidden": true}]$jp493$::jsonb,
   $jp494$Read the line, trim surrounding spaces, then print "Hello, " + name + "!". This is the classic "read input, use it in output" first program.$jp494$,
   jsonb_build_object('java', $jp495$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.nextLine().trim();
        System.out.println("Hello, " + name + "!");
    }
}
$jp495$),
   array['java'], 'published', false, 1),
  ('cp-java-first-java-program-3', null::text, $jp496$About Me$jp496$, 'Easy', 'java-first-java-program-about-me',
   $jp497$Read a name and an age, then print two sentences.

**Input:** two lines — line 1 is the name, line 2 is the age (a whole number).

**Output:** two lines:

```
My name is <name>.
I am <age> years old.
```$jp497$,
   $jp498$[{"input": "Meera\n19", "output": "My name is Meera.\nI am 19 years old."}]$jp498$::jsonb,
   $jp499$["The age is a whole number, 1 <= age <= 120."]$jp499$::jsonb,
   jsonb_build_object('java', $jp500$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.nextLine().trim();
        int age = Integer.parseInt(sc.nextLine().trim());
        // print the two sentences
    }
}
$jp500$),
   $jp501$["Read the name line, then read the age line and convert it with Integer.parseInt.", "End each printed sentence with a full stop."]$jp501$::jsonb,
   $jp502$[{"input": "Meera\n19", "expected": "My name is Meera.\nI am 19 years old.", "hidden": false}, {"input": "Arjun\n25", "expected": "My name is Arjun.\nI am 25 years old.", "hidden": true}, {"input": "Priya Nair\n7", "expected": "My name is Priya Nair.\nI am 7 years old.", "hidden": true}]$jp502$::jsonb,
   $jp503$Read both lines. The name is used as-is; the age line is converted to an int so it is treated as a number. Then print the two sentences with the exact punctuation shown.$jp503$,
   jsonb_build_object('java', $jp504$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.nextLine().trim();
        int age = Integer.parseInt(sc.nextLine().trim());
        System.out.println("My name is " + name + ".");
        System.out.println("I am " + age + " years old.");
    }
}
$jp504$),
   array['java'], 'published', false, 2),
  ('cp-java-first-java-program-4', null::text, $jp505$Print the Sum$jp505$, 'Easy', 'java-first-java-program-print-sum',
   $jp506$Read two integers and print their sum. This is the next step after printing fixed text: reading numbers and doing arithmetic.

**Input:** one line with two integers separated by a space.

**Output:** one line: their sum.$jp506$,
   $jp507$[{"input": "2 3", "output": "5"}, {"input": "100 -40", "output": "60"}]$jp507$::jsonb,
   $jp508$["-1000000000 <= each integer <= 1000000000"]$jp508$::jsonb,
   jsonb_build_object('java', $jp509$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.nextLong();
        long b = sc.nextLong();
        // print a + b
    }
}
$jp509$),
   $jp510$["sc.nextLong() reads one whitespace-separated number.", "Use long so large values cannot overflow."]$jp510$::jsonb,
   $jp511$[{"input": "2 3", "expected": "5", "hidden": false}, {"input": "100 -40", "expected": "60", "hidden": false}, {"input": "1000000000 1000000000", "expected": "2000000000", "hidden": true}, {"input": "-7 -8", "expected": "-15", "hidden": true}]$jp511$::jsonb,
   $jp512$Read the two numbers as long values and print their sum. Using long keeps the result correct even when both inputs are near a billion.$jp512$,
   jsonb_build_object('java', $jp513$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.nextLong();
        long b = sc.nextLong();
        System.out.println(a + b);
    }
}
$jp513$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Variables — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp514$introduction-to-java/variables$jp514$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-variables-1', null::text, $jp515$Rectangle Area$jp515$, 'Easy', 'java-variables-rectangle-area',
   $jp516$Store a rectangle's length and width in variables and print its area.

**Input:** two integers (length, then width), separated by whitespace.

**Output:** one line — the area (length x width).$jp516$,
   $jp517$[{"input": "5 3", "output": "15"}]$jp517$::jsonb,
   $jp518$["1 <= length, width <= 100000"]$jp518$::jsonb,
   jsonb_build_object('java', $jp519$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int length = sc.nextInt();
        int width = sc.nextInt();
        // compute area in a variable, then print it
    }
}
$jp519$),
   $jp520$["Declare an int variable area = length * width;", "Then print that variable."]$jp520$::jsonb,
   $jp521$[{"input": "5 3", "expected": "15", "hidden": false}, {"input": "100000 100000", "expected": "10000000000", "hidden": true}, {"input": "7 1", "expected": "7", "hidden": true}, {"input": "12 12", "expected": "144", "hidden": true}]$jp521$::jsonb,
   $jp522$Read both values into int variables, multiply into a variable, and print it. Note the hidden case 100000 x 100000 needs long, so a careful solution declares area as long.$jp522$,
   jsonb_build_object('java', $jp523$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long length = sc.nextLong();
        long width = sc.nextLong();
        long area = length * width;
        System.out.println(area);
    }
}
$jp523$),
   array['java'], 'published', false, 0),
  ('cp-java-variables-2', null::text, $jp524$Swap Two Values$jp524$, 'Easy', 'java-variables-swap-values',
   $jp525$Read two integers `a` and `b`, swap their values using a third temporary variable, and print them after the swap.

**Input:** two integers separated by whitespace.

**Output:** one line: `a=<a> b=<b>` using the values *after* the swap.$jp525$,
   $jp526$[{"input": "10 20", "output": "a=20 b=10"}]$jp526$::jsonb,
   $jp527$["-1000000 <= a, b <= 1000000"]$jp527$::jsonb,
   jsonb_build_object('java', $jp528$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        // swap a and b using a temp variable, then print
    }
}
$jp528$),
   $jp529$["int temp = a; a = b; b = temp;", "Print with concatenation: \"a=\" + a + \" b=\" + b."]$jp529$::jsonb,
   $jp530$[{"input": "10 20", "expected": "a=20 b=10", "hidden": false}, {"input": "-5 7", "expected": "a=7 b=-5", "hidden": true}, {"input": "0 0", "expected": "a=0 b=0", "hidden": true}, {"input": "1000000 -1000000", "expected": "a=-1000000 b=1000000", "hidden": true}]$jp530$::jsonb,
   $jp531$Copy a into temp, move b into a, then move temp into b. Printing afterwards shows the values have exchanged.$jp531$,
   jsonb_build_object('java', $jp532$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int temp = a;
        a = b;
        b = temp;
        System.out.println("a=" + a + " b=" + b);
    }
}
$jp532$),
   array['java'], 'published', false, 1),
  ('cp-java-variables-3', null::text, $jp533$Running Total$jp533$, 'Easy', 'java-variables-running-total',
   $jp534$Start with an initial value in a `total` variable, then add three more numbers to it one by one. Print the final value of `total`.

**Input:** four integers separated by whitespace — the starting value, then three numbers to add.

**Output:** one line — the final total.$jp534$,
   $jp535$[{"input": "100 10 -5 20", "output": "125"}]$jp535$::jsonb,
   $jp536$["-1000000 <= each integer <= 1000000"]$jp536$::jsonb,
   jsonb_build_object('java', $jp537$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int total = sc.nextInt();
        // add the next three numbers into total, then print it
    }
}
$jp537$),
   $jp538$["total = total + sc.nextInt(); repeated three times.", "The same variable is reused and updated each time."]$jp538$::jsonb,
   $jp539$[{"input": "100 10 -5 20", "expected": "125", "hidden": false}, {"input": "0 1 2 3", "expected": "6", "hidden": true}, {"input": "-50 -50 -50 -50", "expected": "-200", "hidden": true}, {"input": "1000000 1000000 1000000 1000000", "expected": "4000000", "hidden": true}]$jp539$::jsonb,
   $jp540$One variable, updated three times. This shows that a variable's value changes over the life of the program while its name and type stay the same.$jp540$,
   jsonb_build_object('java', $jp541$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int total = sc.nextInt();
        total = total + sc.nextInt();
        total = total + sc.nextInt();
        total = total + sc.nextInt();
        System.out.println(total);
    }
}
$jp541$),
   array['java'], 'published', false, 2),
  ('cp-java-variables-4', null::text, $jp542$Build a Profile String$jp542$, 'Easy', 'java-variables-profile-string',
   $jp543$Read a name, an age and a city, combine them into a single String variable, and print it.

**Input:** three lines — name, age (a whole number), city.

**Output:** one line: `<name>, <age>, <city>`$jp543$,
   $jp544$[{"input": "Aditi\n21\nPune", "output": "Aditi, 21, Pune"}]$jp544$::jsonb,
   $jp545$["1 <= age <= 120", "name and city fit on one line each"]$jp545$::jsonb,
   jsonb_build_object('java', $jp546$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.nextLine().trim();
        int age = Integer.parseInt(sc.nextLine().trim());
        String city = sc.nextLine().trim();
        // build one String variable and print it
    }
}
$jp546$),
   $jp547$["String profile = name + \", \" + age + \", \" + city;", "The int age is automatically converted to text inside the concatenation."]$jp547$::jsonb,
   $jp548$[{"input": "Aditi\n21\nPune", "expected": "Aditi, 21, Pune", "hidden": false}, {"input": "Rohan\n30\nDelhi", "expected": "Rohan, 30, Delhi", "hidden": true}, {"input": "Sara Khan\n8\nNew Town", "expected": "Sara Khan, 8, New Town", "hidden": true}]$jp548$::jsonb,
   $jp549$Read the three lines, converting only the age to an int. Concatenate them into one profile variable with ", " between the parts, then print that variable.$jp549$,
   jsonb_build_object('java', $jp550$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.nextLine().trim();
        int age = Integer.parseInt(sc.nextLine().trim());
        String city = sc.nextLine().trim();
        String profile = name + ", " + age + ", " + city;
        System.out.println(profile);
    }
}
$jp550$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Data Types — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp551$introduction-to-java/data-types$jp551$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-data-types-1', null::text, $jp552$Print Values of Different Types$jp552$, 'Easy', 'java-data-types-print-mixed-types',
   $jp553$Read one value of each of four types and print them on a single line separated by single spaces.

**Input:** four lines — an integer, a decimal number, a single character, and the word `true` or `false`.

**Output:** one line: `<int> <double> <char> <boolean>`$jp553$,
   $jp554$[{"input": "90\n90.5\nA\ntrue", "output": "90 90.5 A true"}]$jp554$::jsonb,
   $jp555$["The decimal number uses a dot, e.g. 90.5", "The character is a single visible character"]$jp555$::jsonb,
   jsonb_build_object('java', $jp556$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int i = Integer.parseInt(sc.next());
        double d = Double.parseDouble(sc.next());
        char c = sc.next().charAt(0);
        boolean b = Boolean.parseBoolean(sc.next());
        // print them space-separated
    }
}
$jp556$),
   $jp557$["Read each token with sc.next() and convert it to the right type.", "Concatenate with spaces: i + \" \" + d + \" \" + c + \" \" + b."]$jp557$::jsonb,
   $jp558$[{"input": "90\n90.5\nA\ntrue", "expected": "90 90.5 A true", "hidden": false}, {"input": "-4\n0.25\nz\nfalse", "expected": "-4 0.25 z false", "hidden": true}, {"input": "0\n7.0\n#\ntrue", "expected": "0 7.0 # true", "hidden": true}]$jp558$::jsonb,
   $jp559$Convert each input token to its type (int, double, char, boolean) and print them joined by spaces. Notice that printing the double 7.0 keeps the .0, and the boolean prints as true / false.$jp559$,
   jsonb_build_object('java', $jp560$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int i = Integer.parseInt(sc.next());
        double d = Double.parseDouble(sc.next());
        char c = sc.next().charAt(0);
        boolean b = Boolean.parseBoolean(sc.next());
        System.out.println(i + " " + d + " " + c + " " + b);
    }
}
$jp560$),
   array['java'], 'published', false, 0),
  ('cp-java-data-types-2', null::text, $jp561$Integer Type Ranges$jp561$, 'Easy', 'java-data-types-primitive-ranges',
   $jp562$Print the smallest and largest value that each of `byte`, `short` and `int` can hold, using Java's built-in constants.

**Input:** none.

**Output:** three lines:

```
byte <min> <max>
short <min> <max>
int <min> <max>
```$jp562$,
   $jp563$[{"input": "", "output": "byte -128 127\nshort -32768 32767\nint -2147483648 2147483647"}]$jp563$::jsonb,
   $jp564$["Use Byte.MIN_VALUE / Byte.MAX_VALUE and the matching Short and Integer constants."]$jp564$::jsonb,
   jsonb_build_object('java', $jp565$public class Main {
    public static void main(String[] args) {
        // print the three ranges using the wrapper MIN_VALUE / MAX_VALUE constants
    }
}
$jp565$),
   $jp566$["Byte.MIN_VALUE and Byte.MAX_VALUE give -128 and 127.", "Concatenate the label, the min and the max with spaces."]$jp566$::jsonb,
   $jp567$[{"input": "", "expected": "byte -128 127\nshort -32768 32767\nint -2147483648 2147483647", "hidden": false}, {"input": "", "expected": "byte -128 127\nshort -32768 32767\nint -2147483648 2147483647", "hidden": true}]$jp567$::jsonb,
   $jp568$Each primitive integer type has a fixed size and therefore a fixed range. The wrapper classes expose those limits as MIN_VALUE / MAX_VALUE constants, so you never have to memorise the numbers.$jp568$,
   jsonb_build_object('java', $jp569$public class Main {
    public static void main(String[] args) {
        System.out.println("byte " + Byte.MIN_VALUE + " " + Byte.MAX_VALUE);
        System.out.println("short " + Short.MIN_VALUE + " " + Short.MAX_VALUE);
        System.out.println("int " + Integer.MIN_VALUE + " " + Integer.MAX_VALUE);
    }
}
$jp569$),
   array['java'], 'published', false, 1),
  ('cp-java-data-types-3', null::text, $jp570$Average of Three Integers$jp570$, 'Medium', 'java-data-types-average-three',
   $jp571$Read three integers and print their average as a decimal number rounded to exactly two places.

**Input:** three integers separated by whitespace.

**Output:** one line — the average with two digits after the decimal point.$jp571$,
   $jp572$[{"input": "1 2 4", "output": "2.33"}, {"input": "10 20 30", "output": "20.00"}]$jp572$::jsonb,
   $jp573$["-1000000 <= each integer <= 1000000"]$jp573$::jsonb,
   jsonb_build_object('java', $jp574$import java.util.Scanner;
import java.util.Locale;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int c = sc.nextInt();
        // compute the average as a double and print it to 2 decimals
    }
}
$jp574$),
   $jp575$["Divide by 3.0 (a double) so the result keeps its fraction.", "String.format(Locale.US, \"%.2f\", average) formats to two decimals with a dot."]$jp575$::jsonb,
   $jp576$[{"input": "1 2 4", "expected": "2.33", "hidden": false}, {"input": "10 20 30", "expected": "20.00", "hidden": false}, {"input": "-1 -2 -3", "expected": "-2.00", "hidden": true}, {"input": "5 5 6", "expected": "5.33", "hidden": true}]$jp576$::jsonb,
   $jp577$The sum of three ints is an int; dividing by 3.0 promotes the calculation to double so no precision is lost. String.format with Locale.US and "%.2f" prints exactly two decimal places with a dot regardless of the machine's locale.$jp577$,
   jsonb_build_object('java', $jp578$import java.util.Scanner;
import java.util.Locale;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        int c = sc.nextInt();
        double average = (a + b + c) / 3.0;
        System.out.println(String.format(Locale.US, "%.2f", average));
    }
}
$jp578$),
   array['java'], 'published', false, 2),
  ('cp-java-data-types-4', null::text, $jp579$Store a Comparison in a boolean$jp579$, 'Easy', 'java-data-types-is-greater',
   $jp580$Read two integers. Store the result of "is the first greater than the second?" in a `boolean` variable and print it.

**Input:** two integers separated by whitespace.

**Output:** one line — `true` or `false`.$jp580$,
   $jp581$[{"input": "7 3", "output": "true"}, {"input": "3 7", "output": "false"}]$jp581$::jsonb,
   $jp582$["-1000000000 <= a, b <= 1000000000"]$jp582$::jsonb,
   jsonb_build_object('java', $jp583$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.nextLong();
        long b = sc.nextLong();
        // store a > b in a boolean and print it
    }
}
$jp583$),
   $jp584$["The expression a > b already has type boolean.", "boolean firstIsGreater = a > b; then print it."]$jp584$::jsonb,
   $jp585$[{"input": "7 3", "expected": "true", "hidden": false}, {"input": "3 7", "expected": "false", "hidden": false}, {"input": "5 5", "expected": "false", "hidden": true}, {"input": "1000000000 -1000000000", "expected": "true", "hidden": true}]$jp585$::jsonb,
   $jp586$A comparison like a > b evaluates to a boolean, which you can keep in a boolean variable and print directly. Equal values give false because "greater than" is strict.$jp586$,
   jsonb_build_object('java', $jp587$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.nextLong();
        long b = sc.nextLong();
        boolean firstIsGreater = a > b;
        System.out.println(firstIsGreater);
    }
}
$jp587$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Type Casting — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp588$introduction-to-java/type-casting$jp588$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-type-casting-1', null::text, $jp589$Truncate a Decimal$jp589$, 'Easy', 'java-type-casting-truncate-to-int',
   $jp590$Read a decimal number and print the result of casting it to `int` (the fractional part is dropped, moving toward zero).

**Input:** one decimal number (may be negative).

**Output:** one line — the value after `(int)` casting.$jp590$,
   $jp591$[{"input": "99.99", "output": "99"}, {"input": "-3.7", "output": "-3"}]$jp591$::jsonb,
   $jp592$["-1000000000 <= number <= 1000000000"]$jp592$::jsonb,
   jsonb_build_object('java', $jp593$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double d = Double.parseDouble(sc.next());
        // cast to int and print
    }
}
$jp593$),
   $jp594$["int i = (int) d; performs the narrowing cast.", "Truncation drops the decimals; it does not round."]$jp594$::jsonb,
   $jp595$[{"input": "99.99", "expected": "99", "hidden": false}, {"input": "-3.7", "expected": "-3", "hidden": false}, {"input": "4.0", "expected": "4", "hidden": true}, {"input": "0.99", "expected": "0", "hidden": true}]$jp595$::jsonb,
   $jp596$A double-to-int cast keeps only the whole-number part and discards everything after the decimal point, moving toward zero. That is why -3.7 becomes -3, not -4.$jp596$,
   jsonb_build_object('java', $jp597$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double d = Double.parseDouble(sc.next());
        int i = (int) d;
        System.out.println(i);
    }
}
$jp597$),
   array['java'], 'published', false, 0),
  ('cp-java-type-casting-2', null::text, $jp598$Character to Code$jp598$, 'Easy', 'java-type-casting-char-code',
   $jp599$Read a single character and print its integer (Unicode) value by casting it to `int`.

**Input:** one line with a single character.

**Output:** one line — the integer code of that character.$jp599$,
   $jp600$[{"input": "A", "output": "65"}, {"input": "a", "output": "97"}]$jp600$::jsonb,
   $jp601$["The character is a single printable ASCII character."]$jp601$::jsonb,
   jsonb_build_object('java', $jp602$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        char c = sc.next().charAt(0);
        // cast the char to int and print
    }
}
$jp602$),
   $jp603$["int code = (int) c; widens the char to its numeric value.", "For letters, 'A' is 65 and 'a' is 97."]$jp603$::jsonb,
   $jp604$[{"input": "A", "expected": "65", "hidden": false}, {"input": "a", "expected": "97", "hidden": false}, {"input": "0", "expected": "48", "hidden": true}, {"input": "Z", "expected": "90", "hidden": true}]$jp604$::jsonb,
   $jp605$Every char has an underlying integer code. Casting to int (or just assigning to an int) reveals it: 'A' is 65, 'a' is 97, the digit character '0' is 48.$jp605$,
   jsonb_build_object('java', $jp606$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        char c = sc.next().charAt(0);
        int code = (int) c;
        System.out.println(code);
    }
}
$jp606$),
   array['java'], 'published', false, 1),
  ('cp-java-type-casting-3', null::text, $jp607$Code to Character$jp607$, 'Easy', 'java-type-casting-code-to-char',
   $jp608$Read an integer between 33 and 126 and print the character it represents by casting it to `char`.

**Input:** one integer in the range 33..126.

**Output:** one line — the character with that code.$jp608$,
   $jp609$[{"input": "72", "output": "H"}, {"input": "97", "output": "a"}]$jp609$::jsonb,
   $jp610$["33 <= code <= 126"]$jp610$::jsonb,
   jsonb_build_object('java', $jp611$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.next());
        // cast n to char and print
    }
}
$jp611$),
   $jp612$["char c = (char) n; is a narrowing cast from int to char.", "Code 65 is 'A', 97 is 'a'."]$jp612$::jsonb,
   $jp613$[{"input": "72", "expected": "H", "hidden": false}, {"input": "97", "expected": "a", "hidden": false}, {"input": "65", "expected": "A", "hidden": true}, {"input": "36", "expected": "$", "hidden": true}]$jp613$::jsonb,
   $jp614$Casting an int to char is the reverse of char-to-int: the number is interpreted as a character code. 72 maps to 'H', 36 maps to '$'.$jp614$,
   jsonb_build_object('java', $jp615$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.next());
        char c = (char) n;
        System.out.println(c);
    }
}
$jp615$),
   array['java'], 'published', false, 2),
  ('cp-java-type-casting-4', null::text, $jp616$Add Two Numeric Strings$jp616$, 'Medium', 'java-type-casting-parse-int-strings',
   $jp617$Two numbers arrive as text (String). Convert each to an `int` and print their sum. A cast like `(int)` does **not** work here — you must parse.

**Input:** two lines, each a whole number written as text.

**Output:** one line — the sum of the two numbers.$jp617$,
   $jp618$[{"input": "12\n30", "output": "42"}]$jp618$::jsonb,
   $jp619$["-1000000000 <= each number <= 1000000000"]$jp619$::jsonb,
   jsonb_build_object('java', $jp620$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s1 = sc.nextLine().trim();
        String s2 = sc.nextLine().trim();
        // parse both strings to numbers and print the sum
    }
}
$jp620$),
   $jp621$["Integer.parseInt(s) converts a numeric String to an int.", "Use long if you want to be safe with values near a billion."]$jp621$::jsonb,
   $jp622$[{"input": "12\n30", "expected": "42", "hidden": false}, {"input": "-5\n5", "expected": "0", "hidden": true}, {"input": "1000000000\n2000000000", "expected": "3000000000", "hidden": true}, {"input": "7\n-20", "expected": "-13", "hidden": true}]$jp622$::jsonb,
   $jp623$String and int are unrelated types, so (int) cannot convert between them. Integer.parseInt (or Long.parseLong) reads the digits of the text and produces a real number you can add.$jp623$,
   jsonb_build_object('java', $jp624$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s1 = sc.nextLine().trim();
        String s2 = sc.nextLine().trim();
        long a = Long.parseLong(s1);
        long b = Long.parseLong(s2);
        System.out.println(a + b);
    }
}
$jp624$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Constants — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp625$introduction-to-java/constants$jp625$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-constants-1', null::text, $jp626$Circle Area with a PI Constant$jp626$, 'Easy', 'java-constants-circle-area',
   $jp627$Declare `final double PI = 3.14159;` and use it to compute the area of a circle from its radius.

**Input:** one integer — the radius.

**Output:** one line — the area (PI x radius x radius) rounded to two decimal places.$jp627$,
   $jp628$[{"input": "5", "output": "78.54"}]$jp628$::jsonb,
   $jp629$["1 <= radius <= 100000", "Use PI = 3.14159 exactly."]$jp629$::jsonb,
   jsonb_build_object('java', $jp630$import java.util.Scanner;
import java.util.Locale;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        final double PI = 3.14159;
        int r = Integer.parseInt(sc.next());
        // compute PI * r * r and print it to 2 decimals
    }
}
$jp630$),
   $jp631$["double area = PI * r * r;", "String.format(Locale.US, \"%.2f\", area) rounds to two places."]$jp631$::jsonb,
   $jp632$[{"input": "5", "expected": "78.54", "hidden": false}, {"input": "1", "expected": "3.14", "hidden": true}, {"input": "10", "expected": "314.16", "hidden": true}, {"input": "100", "expected": "31415.90", "hidden": true}]$jp632$::jsonb,
   $jp633$Give the fixed value 3.14159 a name with final so it cannot be changed by mistake and the formula reads clearly. Format the double result to two decimals with Locale.US so the output is stable.$jp633$,
   jsonb_build_object('java', $jp634$import java.util.Scanner;
import java.util.Locale;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        final double PI = 3.14159;
        int r = Integer.parseInt(sc.next());
        double area = PI * r * r;
        System.out.println(String.format(Locale.US, "%.2f", area));
    }
}
$jp634$),
   array['java'], 'published', false, 0),
  ('cp-java-constants-2', null::text, $jp635$Final Price with a Tax Constant$jp635$, 'Easy', 'java-constants-price-with-tax',
   $jp636$Declare `final double TAX_RATE = 0.18;` and use it to add 18% tax to a price.

**Input:** one number — the price before tax.

**Output:** one line — the final price (price + price x TAX_RATE) rounded to two decimal places.$jp636$,
   $jp637$[{"input": "1000", "output": "1180.00"}]$jp637$::jsonb,
   $jp638$["0 <= price <= 10000000", "TAX_RATE is exactly 0.18"]$jp638$::jsonb,
   jsonb_build_object('java', $jp639$import java.util.Scanner;
import java.util.Locale;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        final double TAX_RATE = 0.18;
        double price = Double.parseDouble(sc.next());
        // print price + price * TAX_RATE, to 2 decimals
    }
}
$jp639$),
   $jp640$["double finalPrice = price + price * TAX_RATE;", "Format with \"%.2f\" and Locale.US."]$jp640$::jsonb,
   $jp641$[{"input": "1000", "expected": "1180.00", "hidden": false}, {"input": "250", "expected": "295.00", "hidden": true}, {"input": "0", "expected": "0.00", "hidden": true}, {"input": "999.99", "expected": "1179.99", "hidden": true}]$jp641$::jsonb,
   $jp642$The 18% rate lives in one named constant, so the intent is obvious and it can only be set once. Rounding to two decimals with String.format hides any tiny floating-point noise in the multiplication.$jp642$,
   jsonb_build_object('java', $jp643$import java.util.Scanner;
import java.util.Locale;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        final double TAX_RATE = 0.18;
        double price = Double.parseDouble(sc.next());
        double finalPrice = price + price * TAX_RATE;
        System.out.println(String.format(Locale.US, "%.2f", finalPrice));
    }
}
$jp643$),
   array['java'], 'published', false, 1),
  ('cp-java-constants-3', null::text, $jp644$Seconds in N Days$jp644$, 'Easy', 'java-constants-seconds-in-days',
   $jp645$Declare `final int SECONDS_PER_DAY = 86400;` and use it to convert a number of days to seconds.

**Input:** one whole number — the number of days.

**Output:** one line — the total number of seconds.$jp645$,
   $jp646$[{"input": "2", "output": "172800"}]$jp646$::jsonb,
   $jp647$["0 <= days <= 1000000"]$jp647$::jsonb,
   jsonb_build_object('java', $jp648$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        final int SECONDS_PER_DAY = 86400;
        long days = Long.parseLong(sc.next());
        // print days * SECONDS_PER_DAY
    }
}
$jp648$),
   $jp649$["Read days as long so the multiplication does not overflow.", "Total seconds = days * SECONDS_PER_DAY."]$jp649$::jsonb,
   $jp650$[{"input": "2", "expected": "172800", "hidden": false}, {"input": "0", "expected": "0", "hidden": true}, {"input": "365", "expected": "31536000", "hidden": true}, {"input": "1000000", "expected": "86400000000", "hidden": true}]$jp650$::jsonb,
   $jp651$86400 is a fixed fact (seconds in a day), so it belongs in a final constant with a clear name. Reading days as long keeps large results (like a million days) correct.$jp651$,
   jsonb_build_object('java', $jp652$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        final int SECONDS_PER_DAY = 86400;
        long days = Long.parseLong(sc.next());
        System.out.println(days * SECONDS_PER_DAY);
    }
}
$jp652$),
   array['java'], 'published', false, 2),
  ('cp-java-constants-4', null::text, $jp653$Weeks to Days$jp653$, 'Easy', 'java-constants-weeks-to-days',
   $jp654$Declare `final int DAYS_PER_WEEK = 7;` and use it to convert weeks into days.

**Input:** one whole number — the number of weeks.

**Output:** one line — the number of days.$jp654$,
   $jp655$[{"input": "3", "output": "21"}]$jp655$::jsonb,
   $jp656$["0 <= weeks <= 1000000"]$jp656$::jsonb,
   jsonb_build_object('java', $jp657$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        final int DAYS_PER_WEEK = 7;
        long weeks = Long.parseLong(sc.next());
        // print weeks * DAYS_PER_WEEK
    }
}
$jp657$),
   $jp658$["Multiply the input by the constant.", "Using the named constant makes the formula self-explanatory."]$jp658$::jsonb,
   $jp659$[{"input": "3", "expected": "21", "hidden": false}, {"input": "0", "expected": "0", "hidden": true}, {"input": "52", "expected": "364", "hidden": true}, {"input": "1000000", "expected": "7000000", "hidden": true}]$jp659$::jsonb,
   $jp660$The number 7 is fixed, so naming it DAYS_PER_WEEK with final documents the code and prevents accidental change. The conversion is a single multiplication.$jp660$,
   jsonb_build_object('java', $jp661$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        final int DAYS_PER_WEEK = 7;
        long weeks = Long.parseLong(sc.next());
        System.out.println(weeks * DAYS_PER_WEEK);
    }
}
$jp661$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Keywords and Identifiers — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp662$introduction-to-java/keywords-and-identifiers$jp662$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-keywords-and-identifiers-1', null::text, $jp663$Is It a Valid Identifier?$jp663$, 'Medium', 'java-keywords-and-identifiers-is-valid-identifier',
   $jp664$Read one line of text and decide whether it is a valid Java identifier.

A valid identifier: is non-empty; starts with a letter, `_` or `$`; every character is a letter, digit, `_` or `$`; and is **not** a Java reserved word (also excluding `true`, `false`, `null`).

**Input:** one line — the candidate (it may contain spaces, which make it invalid).

**Output:** `Valid` or `Invalid`.$jp664$,
   $jp665$[{"input": "totalMarks", "output": "Valid"}, {"input": "2name", "output": "Invalid"}]$jp665$::jsonb,
   $jp666$["1 <= line length <= 60"]$jp666$::jsonb,
   jsonb_build_object('java', $jp667$import java.util.Scanner;
import java.util.Set;

public class Main {
    static final Set<String> RESERVED = Set.of(
        "abstract","assert","boolean","break","byte","case","catch","char","class","const",
        "continue","default","do","double","else","enum","extends","final","finally","float",
        "for","goto","if","implements","import","instanceof","int","interface","long","native",
        "new","package","private","protected","public","return","short","static","strictfp",
        "super","switch","synchronized","this","throw","throws","transient","try","void",
        "volatile","while","true","false","null");

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        // print "Valid" or "Invalid"
    }
}
$jp667$),
   $jp668$["Check the first character, then every remaining character, against the rules.", "Character.isLetter, Character.isLetterOrDigit, and a check for '_' / '$' cover the cases.", "Finally, reject the word if RESERVED contains it."]$jp668$::jsonb,
   $jp669$[{"input": "totalMarks", "expected": "Valid", "hidden": false}, {"input": "2name", "expected": "Invalid", "hidden": false}, {"input": "class", "expected": "Invalid", "hidden": true}, {"input": "_id", "expected": "Valid", "hidden": true}, {"input": "my age", "expected": "Invalid", "hidden": true}, {"input": "$price1", "expected": "Valid", "hidden": true}]$jp669$::jsonb,
   $jp670$First rule out the empty string and reserved words. Then verify the first character is a letter, underscore or dollar sign, and that every other character is a letter, digit, underscore or dollar sign. A space fails that test, so "my age" is Invalid.$jp670$,
   jsonb_build_object('java', $jp671$import java.util.Scanner;
import java.util.Set;

public class Main {
    static final Set<String> RESERVED = Set.of(
        "abstract","assert","boolean","break","byte","case","catch","char","class","const",
        "continue","default","do","double","else","enum","extends","final","finally","float",
        "for","goto","if","implements","import","instanceof","int","interface","long","native",
        "new","package","private","protected","public","return","short","static","strictfp",
        "super","switch","synchronized","this","throw","throws","transient","try","void",
        "volatile","while","true","false","null");

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        System.out.println(isValid(s) ? "Valid" : "Invalid");
    }

    static boolean isValid(String s) {
        if (s.isEmpty() || RESERVED.contains(s)) return false;
        char first = s.charAt(0);
        if (!(Character.isLetter(first) || first == '_' || first == '$')) return false;
        for (int i = 1; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (!(Character.isLetterOrDigit(ch) || ch == '_' || ch == '$')) return false;
        }
        return true;
    }
}
$jp671$),
   array['java'], 'published', false, 0),
  ('cp-java-keywords-and-identifiers-2', null::text, $jp672$Count the Keywords$jp672$, 'Easy', 'java-keywords-and-identifiers-count-keywords',
   $jp673$Given a line of space-separated words, count how many are Java reserved words.

Treat these as the reserved words (plus the literals `true`, `false`, `null`): `abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while`.

**Input:** one line of words separated by single spaces.

**Output:** one line — the count of words that are reserved.$jp673$,
   $jp674$[{"input": "int x class for", "output": "3"}]$jp674$::jsonb,
   $jp675$["1 <= number of words <= 50"]$jp675$::jsonb,
   jsonb_build_object('java', $jp676$import java.util.Scanner;
import java.util.Set;

public class Main {
    static final Set<String> RESERVED = Set.of(
        "abstract","assert","boolean","break","byte","case","catch","char","class","const",
        "continue","default","do","double","else","enum","extends","final","finally","float",
        "for","goto","if","implements","import","instanceof","int","interface","long","native",
        "new","package","private","protected","public","return","short","static","strictfp",
        "super","switch","synchronized","this","throw","throws","transient","try","void",
        "volatile","while","true","false","null");

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.hasNextLine() ? sc.nextLine().trim() : "";
        // split on spaces and count reserved words
    }
}
$jp676$),
   $jp677$["line.split(\"\\\\s+\") gives the words.", "For each word, check RESERVED.contains(word) and add 1 if true."]$jp677$::jsonb,
   $jp678$[{"input": "int x class for", "expected": "3", "hidden": false}, {"input": "myVar total price", "expected": "0", "hidden": true}, {"input": "public static void main", "expected": "3", "hidden": true}, {"input": "if else while return new", "expected": "5", "hidden": true}]$jp678$::jsonb,
   $jp679$Split the line into words and test each against the reserved-word set. Ordinary names like myVar or main (which is not reserved) do not count.$jp679$,
   jsonb_build_object('java', $jp680$import java.util.Scanner;
import java.util.Set;

public class Main {
    static final Set<String> RESERVED = Set.of(
        "abstract","assert","boolean","break","byte","case","catch","char","class","const",
        "continue","default","do","double","else","enum","extends","final","finally","float",
        "for","goto","if","implements","import","instanceof","int","interface","long","native",
        "new","package","private","protected","public","return","short","static","strictfp",
        "super","switch","synchronized","this","throw","throws","transient","try","void",
        "volatile","while","true","false","null");

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.hasNextLine() ? sc.nextLine().trim() : "";
        int count = 0;
        if (!line.isEmpty()) {
            for (String w : line.split("\\s+")) {
                if (RESERVED.contains(w)) count++;
            }
        }
        System.out.println(count);
    }
}
$jp680$),
   array['java'], 'published', false, 1),
  ('cp-java-keywords-and-identifiers-3', null::text, $jp681$snake_case to camelCase$jp681$, 'Medium', 'java-keywords-and-identifiers-snake-to-camel',
   $jp682$Convert a `snake_case` identifier to `camelCase`: remove each underscore and capitalise the letter that followed it.

**Input:** one token in snake_case (lowercase letters, digits and single underscores between parts; no leading or trailing underscore).

**Output:** one line — the camelCase form.$jp682$,
   $jp683$[{"input": "total_student_marks", "output": "totalStudentMarks"}]$jp683$::jsonb,
   $jp684$["1 <= length <= 60"]$jp684$::jsonb,
   jsonb_build_object('java', $jp685$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        // build the camelCase form
    }
}
$jp685$),
   $jp686$["Walk the characters. On '_', set a flag to upper-case the next letter.", "Otherwise append the character (upper-cased if the flag is set), then clear the flag.", "Use a StringBuilder for the result."]$jp686$::jsonb,
   $jp687$[{"input": "total_student_marks", "expected": "totalStudentMarks", "hidden": false}, {"input": "is_valid", "expected": "isValid", "hidden": true}, {"input": "row_count_2", "expected": "rowCount2", "hidden": true}, {"input": "name", "expected": "name", "hidden": true}]$jp687$::jsonb,
   $jp688$Scan left to right. An underscore is dropped and tells you the next character should be upper-cased; every other character is copied as-is. A name with no underscores comes out unchanged.$jp688$,
   jsonb_build_object('java', $jp689$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        StringBuilder sb = new StringBuilder();
        boolean upperNext = false;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '_') {
                upperNext = true;
            } else if (upperNext) {
                sb.append(Character.toUpperCase(ch));
                upperNext = false;
            } else {
                sb.append(ch);
            }
        }
        System.out.println(sb.toString());
    }
}
$jp689$),
   array['java'], 'published', false, 2),
  ('cp-java-keywords-and-identifiers-4', null::text, $jp690$camelCase to CONSTANT_CASE$jp690$, 'Medium', 'java-keywords-and-identifiers-to-constant-case',
   $jp691$Convert a `camelCase` identifier to the `CONSTANT_CASE` style used for Java constants: insert an underscore before each interior capital letter, then upper-case everything.

**Input:** one token in camelCase (letters and digits, first letter lowercase).

**Output:** one line — the CONSTANT_CASE form.$jp691$,
   $jp692$[{"input": "maxRetryCount", "output": "MAX_RETRY_COUNT"}]$jp692$::jsonb,
   $jp693$["1 <= length <= 60"]$jp693$::jsonb,
   jsonb_build_object('java', $jp694$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        // build the CONSTANT_CASE form
    }
}
$jp694$),
   $jp695$["For each character after the first, if it is upper-case, append '_' before it.", "Append the upper-cased character each time.", "Character.isUpperCase and Character.toUpperCase do the work."]$jp695$::jsonb,
   $jp696$[{"input": "maxRetryCount", "expected": "MAX_RETRY_COUNT", "hidden": false}, {"input": "taxRate", "expected": "TAX_RATE", "hidden": true}, {"input": "pi", "expected": "PI", "hidden": true}, {"input": "httpOk", "expected": "HTTP_OK", "hidden": true}]$jp696$::jsonb,
   $jp697$This is the naming convention constants use. Walk the characters: before any capital letter that is not the first character, add an underscore; then upper-case every character as you append it.$jp697$,
   jsonb_build_object('java', $jp698$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (i > 0 && Character.isUpperCase(ch)) {
                sb.append('_');
            }
            sb.append(Character.toUpperCase(ch));
        }
        System.out.println(sb.toString());
    }
}
$jp698$),
   array['java'], 'published', false, 3)
  ) as v(id, topic_id, title, difficulty, slug, description,
         examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
         supported_languages, status, is_premium, sort_order)
where not exists (select 1 from public.dsa_problems d where lower(d.slug) = lower(v.slug))
on conflict (id) do nothing;

-- Comments — Coding Problems
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
tp as (select id from public.learning_topics
        where source_kind = 'java_tutorial' and source_ref = $jp699$introduction-to-java/comments$jp699$)
insert into public.dsa_problems
  (id, topic_id, title, difficulty, slug, description,
   examples, constraints, starter_code, hints, test_cases, editorial, solution_code,
   supported_languages, learning_grid_id, learning_topic_id, status, is_premium, sort_order)
select v.id, v.topic_id, v.title, v.difficulty, v.slug, v.description,
       v.examples, v.constraints, v.starter_code, v.hints, v.test_cases, v.editorial, v.solution_code,
       v.supported_languages, g.id, tp.id, v.status, v.is_premium, v.sort_order
from g, tp, (values
  ('cp-java-comments-1', null::text, $jp700$Strip Line Comments$jp700$, 'Medium', 'java-comments-strip-line-comments',
   $jp701$Given lines of pretend source code, remove any `//` line comment from each line (everything from the first `//` to the end of the line), trim trailing spaces, and print the lines that still have content.

Assume `//` never appears inside a string literal.

**Input:** the first line is an integer N; then N lines of text.

**Output:** for each line, the code part with its `//` comment removed and trailing spaces trimmed — but skip lines that become empty.$jp701$,
   $jp702$[{"input": "3\nint x = 5; // set x\n// full comment line\ny = x + 1;", "output": "int x = 5;\ny = x + 1;"}]$jp702$::jsonb,
   $jp703$["1 <= N <= 100", "each line has at most 200 characters"]$jp703$::jsonb,
   jsonb_build_object('java', $jp704$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine().trim());
        StringBuilder out = new StringBuilder();
        for (int k = 0; k < n; k++) {
            String line = sc.hasNextLine() ? sc.nextLine() : "";
            // remove from the first "//", trim trailing spaces, keep if non-empty
        }
        System.out.print(out.toString());
    }
}
$jp704$),
   $jp705$["line.indexOf(\"//\") finds the comment start (or -1 if none).", "line.substring(0, idx) keeps only the code part.", "String.stripTrailing() removes trailing spaces; skip the line if it is then empty."]$jp705$::jsonb,
   $jp706$[{"input": "3\nint x = 5; // set x\n// full comment line\ny = x + 1;", "expected": "int x = 5;\ny = x + 1;", "hidden": false}, {"input": "2\na = 1;\n  // indented note", "expected": "a = 1;", "hidden": true}, {"input": "1\nSystem.out.println(\"hi\"); // note", "expected": "System.out.println(\"hi\");", "hidden": true}, {"input": "2\n// one\n// two", "expected": "", "hidden": true}]$jp706$::jsonb,
   $jp707$For each line, cut everything from the first // onward, then strip trailing whitespace. A line that was entirely a comment becomes empty and is skipped, so only real code lines are printed.$jp707$,
   jsonb_build_object('java', $jp708$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine().trim());
        StringBuilder out = new StringBuilder();
        for (int k = 0; k < n; k++) {
            String line = sc.hasNextLine() ? sc.nextLine() : "";
            int idx = line.indexOf("//");
            if (idx >= 0) line = line.substring(0, idx);
            line = line.stripTrailing();
            if (!line.isEmpty()) out.append(line).append('\n');
        }
        System.out.print(out.toString());
    }
}
$jp708$),
   array['java'], 'published', false, 0),
  ('cp-java-comments-2', null::text, $jp709$Count Full-Line Comments$jp709$, 'Easy', 'java-comments-count-comment-lines',
   $jp710$Count how many of the given lines are *full-line* single-line comments — that is, the first non-whitespace characters on the line are `//`.

**Input:** the first line is an integer N; then N lines of text.

**Output:** one line — the number of full-line `//` comments.$jp710$,
   $jp711$[{"input": "4\n// header\nint x = 1;\n   // indented note\ny = 2; // trailing", "output": "2"}]$jp711$::jsonb,
   $jp712$["1 <= N <= 100"]$jp712$::jsonb,
   jsonb_build_object('java', $jp713$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine().trim());
        int count = 0;
        for (int k = 0; k < n; k++) {
            String line = sc.hasNextLine() ? sc.nextLine() : "";
            // count if line.trim() starts with "//"
        }
        System.out.println(count);
    }
}
$jp713$),
   $jp714$["line.trim() removes leading spaces so an indented comment still counts.", "startsWith(\"//\") on the trimmed line is the test.", "A line with code before // does not count."]$jp714$::jsonb,
   $jp715$[{"input": "4\n// header\nint x = 1;\n   // indented note\ny = 2; // trailing", "expected": "2", "hidden": false}, {"input": "3\ncode;\ncode;\ncode;", "expected": "0", "hidden": true}, {"input": "3\n//a\n//b\n//c", "expected": "3", "hidden": true}, {"input": "2\n\t// tabbed\n  x = 1;", "expected": "1", "hidden": true}]$jp715$::jsonb,
   $jp716$Trim each line first so indentation does not matter, then check whether it begins with //. A trailing comment after code (like y = 2; // trailing) is not a full-line comment and is not counted.$jp716$,
   jsonb_build_object('java', $jp717$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine().trim());
        int count = 0;
        for (int k = 0; k < n; k++) {
            String line = sc.hasNextLine() ? sc.nextLine() : "";
            if (line.trim().startsWith("//")) count++;
        }
        System.out.println(count);
    }
}
$jp717$),
   array['java'], 'published', false, 1),
  ('cp-java-comments-3', null::text, $jp718$Remove a Block Comment$jp718$, 'Medium', 'java-comments-remove-block-comment',
   $jp719$A single line of code may contain one `/* ... */` block comment. Remove it. If there is a single space immediately before the `/*`, remove that space too. Print the resulting line.

**Input:** one line of text (it may or may not contain `/* ... */`).

**Output:** one line — the text with the block comment removed.$jp719$,
   $jp720$[{"input": "a = 1; /* init */ b = 2;", "output": "a = 1; b = 2;"}]$jp720$::jsonb,
   $jp721$["the line has at most 200 characters", "at most one /* ... */ per line"]$jp721$::jsonb,
   jsonb_build_object('java', $jp722$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.hasNextLine() ? sc.nextLine() : "";
        // find /* and */, remove that span (and one leading space), then print
    }
}
$jp722$),
   $jp723$["indexOf(\"/*\") and indexOf(\"*/\") locate the comment.", "before = text up to /*, after = text from */ + 2.", "If before ends with a space, drop that one space; then print before + after."]$jp723$::jsonb,
   $jp724$[{"input": "a = 1; /* init */ b = 2;", "expected": "a = 1; b = 2;", "hidden": false}, {"input": "total = price * qty;", "expected": "total = price * qty;", "hidden": true}, {"input": "x=1;/* set x */", "expected": "x=1;", "hidden": true}, {"input": "run(); /* call */", "expected": "run();", "hidden": true}]$jp724$::jsonb,
   $jp725$Locate /* and */. Everything before /* and everything after */ is kept; the comment itself is dropped. Removing one space before /* keeps the spacing tidy, turning "a = 1; /* init */ b = 2;" into "a = 1; b = 2;". A line with no block comment is printed unchanged.$jp725$,
   jsonb_build_object('java', $jp726$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.hasNextLine() ? sc.nextLine() : "";
        int start = line.indexOf("/*");
        int end = line.indexOf("*/");
        if (start >= 0 && end >= start + 2) {
            String before = line.substring(0, start);
            String after = line.substring(end + 2);
            if (before.endsWith(" ")) before = before.substring(0, before.length() - 1);
            line = before + after;
        }
        System.out.println(line);
    }
}
$jp726$),
   array['java'], 'published', false, 2),
  ('cp-java-comments-4', null::text, $jp727$First Line of a Javadoc Block$jp727$, 'Medium', 'java-comments-javadoc-summary',
   $jp728$Given the lines of a `/** ... */` documentation comment, print the first real content line: the first non-empty line of prose after `/**`, with any leading `*` and surrounding spaces removed. Ignore lines that are only `/**`, only `*/`, or start with `@`.

**Input:** the first line is an integer N; then N lines forming the Javadoc block.

**Output:** one line — the first content line's text.$jp728$,
   $jp729$[{"input": "4\n/**\n * Calculates the area of a circle.\n * @param r the radius\n */", "output": "Calculates the area of a circle."}]$jp729$::jsonb,
   $jp730$["1 <= N <= 50", "there is at least one content line"]$jp730$::jsonb,
   jsonb_build_object('java', $jp731$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine().trim());
        String summary = "";
        for (int k = 0; k < n; k++) {
            String line = sc.hasNextLine() ? sc.nextLine().trim() : "";
            // strip a leading /** , a trailing */ , a leading * ; skip empty / @ lines
        }
        System.out.println(summary);
    }
}
$jp731$),
   $jp732$["Trim the line, then peel off a leading \"/**\", a trailing \"*/\", and a leading \"*\".", "Skip the line if it is now empty or starts with '@'.", "The first line that survives is the summary; stop there."]$jp732$::jsonb,
   $jp733$[{"input": "4\n/**\n * Calculates the area of a circle.\n * @param r the radius\n */", "expected": "Calculates the area of a circle.", "hidden": false}, {"input": "1\n/** Returns the total count. */", "expected": "Returns the total count.", "hidden": true}, {"input": "3\n/**\n * Builds the report.\n */", "expected": "Builds the report.", "hidden": true}, {"input": "4\n/**\n *\n * Sends the email.\n */", "expected": "Sends the email.", "hidden": true}]$jp733$::jsonb,
   $jp734$Normalise each line by removing the Javadoc punctuation (/**, */, leading *). The first line that still has text and is not an @tag is the summary sentence. A single-line /** ... */ is handled by the same peeling steps.$jp734$,
   jsonb_build_object('java', $jp735$import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine().trim());
        String summary = "";
        for (int k = 0; k < n; k++) {
            String line = sc.hasNextLine() ? sc.nextLine().trim() : "";
            if (line.startsWith("/**")) line = line.substring(3).trim();
            if (line.endsWith("*/")) line = line.substring(0, line.length() - 2).trim();
            if (line.startsWith("*")) line = line.substring(1).trim();
            if (line.isEmpty() || line.startsWith("@")) continue;
            summary = line;
            break;
        }
        System.out.println(summary);
    }
}
$jp735$),
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

-- Introduction to Java — Practice Problems
with tp as (select id from public.learning_topics
             where source_kind = 'java_tutorial' and source_ref = $jp736$introduction-to-java/introduction-to-java$jp736$)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select tp.id, 'Practice Problems', $jp737$Try each question yourself first, then check the answer.

### 1. Explain the slogan

In one sentence, explain what "write once, run anywhere" means and name the component that makes it possible.

**Answer:** You compile a Java program once into bytecode, and it then runs on any device that has a JVM. The JVM is the component that provides this portability.

### 2. Predict the output

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Java");
        System.out.println("powers Android apps");
    }
}
```

What exactly is printed?

**Answer:** Two lines:

```
Java
powers Android apps
```

### 3. Spot the mistake

A beginner writes their print statements straight into a file with no class around them, and the program will not compile. Which rule did they break?

**Answer:** Every Java instruction must live inside a class. A Java program needs at least one class, and execution begins in a `main` method inside it.

### 4. Recall

Name three real-world areas where Java is used, as mentioned in the notes.

**Answer:** Any three of: Android apps, banking software, large enterprise systems, desktop software, web servers.
$jp737$, 'markdown',
  jsonb_build_object('source', 'java_practice_seed', 'content_type', 'exercise'),
  'published', 1
from tp
on conflict (topic_id) where (metadata ->> 'source') = 'java_practice_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Features of Java — Practice Problems
with tp as (select id from public.learning_topics
             where source_kind = 'java_tutorial' and source_ref = $jp738$introduction-to-java/features-of-java$jp738$)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select tp.id, 'Practice Problems', $jp739$Try each question yourself first, then check the answer.

### 1. List the features

List at least five core features of Java.

**Answer:** Any five of: Simple, Object-Oriented, Platform-Independent, Secure, Robust, Multithreaded.

### 2. One feature, one enabler

Which single feature lets one compiled Java program run on Windows, Linux and Mac, and what provides it?

**Answer:** Platform independence, provided by the JVM — each operating system has its own JVM that executes the same bytecode.

### 3. Why security matters here

Why does the "secure" feature matter specifically for a banking application?

**Answer:** Banking apps handle money and sensitive data. Java's built-in checks (bytecode verification, no direct pointer access, automatic memory management) remove common crash and tampering risks.

### 4. Read the code

```java
public class Main {
    public static void main(String[] args) {
        int a = 5, b = 10;
        System.out.println("Sum: " + (a + b));
    }
}
```

What is printed, and which feature does this short, readable code demonstrate?

**Answer:** `Sum: 15`. It demonstrates the "Simple" feature — Java code is easy to read and write.
$jp739$, 'markdown',
  jsonb_build_object('source', 'java_practice_seed', 'content_type', 'exercise'),
  'published', 1
from tp
on conflict (topic_id) where (metadata ->> 'source') = 'java_practice_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Java vs C/C++ — Practice Problems
with tp as (select id from public.learning_topics
             where source_kind = 'java_tutorial' and source_ref = $jp740$introduction-to-java/java-vs-c-c$jp740$)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select tp.id, 'Practice Problems', $jp741$Try each question yourself first, then check the answer.

### 1. Two things Java gives up

State two things C/C++ let the programmer do that Java deliberately does not.

**Answer:** (1) Use raw pointers and pointer arithmetic. (2) Manually allocate and free memory. Java hides pointers and frees memory automatically with garbage collection.

### 2. Move it to another OS

A C++ program is moved from Windows to Linux and stops working until it is rebuilt. Why does a compiled Java program not have this problem?

**Answer:** C/C++ compiles to machine code for one OS and CPU, so it must be recompiled per platform. Java compiles to platform-neutral bytecode that any platform's JVM can run as-is.

### 3. Explain the analogy

Explain the automatic-vs-manual car analogy from the notes in your own words.

**Answer:** C/C++ is like a manual car — you shift the gears (manage memory) yourself: more control, more chances to make a mistake. Java is like an automatic — gear changes (memory management) are handled for you: easier, fewer errors, slightly less low-level control.

### 4. Which errors disappear

Which kind of bug is common in C/C++ but largely removed by Java, and what feature removes it?

**Answer:** Memory bugs — leaks from forgetting to free memory, freeing the same block twice, and dangling pointers. Java's automatic garbage collection removes this whole class of errors.
$jp741$, 'markdown',
  jsonb_build_object('source', 'java_practice_seed', 'content_type', 'exercise'),
  'published', 1
from tp
on conflict (topic_id) where (metadata ->> 'source') = 'java_practice_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- JDK, JRE and JVM — Practice Problems
with tp as (select id from public.learning_topics
             where source_kind = 'java_tutorial' and source_ref = $jp742$introduction-to-java/jdk-jre-and-jvm$jp742$)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select tp.id, 'Practice Problems', $jp743$Try each question yourself first, then check the answer.

### 1. The two equations

Write the two equations that relate JDK, JRE and JVM.

**Answer:** `JDK = JRE + development tools` (such as the compiler) and `JRE = JVM + libraries`.

### 2. Run only

You only want to run Java apps, not build them. What is the minimum you must install, and why?

**Answer:** The JRE. It contains the JVM (to execute bytecode) plus the standard libraries — everything needed to run a program. The JDK is only needed to compile.

### 3. Command to component

Match each command to the component it uses: `javac Hello.java` and `java Hello`.

**Answer:** `javac Hello.java` uses the JDK's compiler to produce `Hello.class`. `java Hello` uses the JRE + JVM to execute that bytecode.

### 4. Kitchen analogy

In the kitchen analogy, what do the stove, the whole kitchen, and the kitchen-plus-recipe-book represent?

**Answer:** Stove = JVM (runs the code). Whole kitchen = JRE (everything needed to run a finished dish). Kitchen + recipe book and classes = JDK (everything needed to create new programs).
$jp743$, 'markdown',
  jsonb_build_object('source', 'java_practice_seed', 'content_type', 'exercise'),
  'published', 1
from tp
on conflict (topic_id) where (metadata ->> 'source') = 'java_practice_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- How Java Works — Practice Problems
with tp as (select id from public.learning_topics
             where source_kind = 'java_tutorial' and source_ref = $jp744$introduction-to-java/how-java-works$jp744$)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select tp.id, 'Practice Problems', $jp745$Try each question yourself first, then check the answer.

### 1. Order the steps

Put these in order: Bytecode, JVM execution, Source code, Compilation.

**Answer:** Source code -> Compilation -> Bytecode -> JVM execution.

### 2. What does javac create

What file does `javac Program.java` create, and what is inside it?

**Answer:** `Program.class`, which contains the platform-neutral bytecode for that class.

### 3. Same file, two systems

Explain why the *same* `.class` file runs on both Windows and Linux.

**Answer:** Bytecode is not tied to any OS or CPU. Each platform ships its own JVM that knows how to execute that same bytecode, so no recompilation is needed.

### 4. Predict and locate the step

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("This text became bytecode before running!");
    }
}
```

What is printed, and at which step did the text become bytecode?

**Answer:** It prints `This text became bytecode before running!`. The source became bytecode during the compilation step (`javac`), before the JVM ran it.
$jp745$, 'markdown',
  jsonb_build_object('source', 'java_practice_seed', 'content_type', 'exercise'),
  'published', 1
from tp
on conflict (topic_id) where (metadata ->> 'source') = 'java_practice_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Installing Java — Practice Problems
with tp as (select id from public.learning_topics
             where source_kind = 'java_tutorial' and source_ref = $jp746$introduction-to-java/installing-java$jp746$)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select tp.id, 'Practice Problems', $jp747$Try each question yourself first, then check the answer.

### 1. JRE or JDK

You want to WRITE and compile Java. Should you install the JRE or the JDK? Why?

**Answer:** The JDK — it includes the compiler (`javac`) and other development tools. The JRE can only run already-compiled programs.

### 2. Two settings to configure

Name the two things you typically configure after installing the JDK so terminal commands work.

**Answer:** Set `JAVA_HOME` to the JDK folder, and add Java's `bin` directory to the system `PATH`.

### 3. Two verification commands

Which two commands verify a successful installation, and what does each check?

**Answer:** `java -version` checks that the runtime works and prints its version. `javac -version` checks that the compiler is available (i.e. the JDK, not just a JRE).

### 4. Diagnose the failure

`java -version` gives "command not found" right after installing. What is the most likely cause?

**Answer:** The `PATH` (or `JAVA_HOME`) was not set correctly, so the terminal cannot locate the `java` executable.
$jp747$, 'markdown',
  jsonb_build_object('source', 'java_practice_seed', 'content_type', 'exercise'),
  'published', 1
from tp
on conflict (topic_id) where (metadata ->> 'source') = 'java_practice_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Java Program Structure — Practice Problems
with tp as (select id from public.learning_topics
             where source_kind = 'java_tutorial' and source_ref = $jp748$introduction-to-java/java-program-structure$jp748$)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select tp.id, 'Practice Problems', $jp749$Try each question yourself first, then check the answer.

### 1. Order the parts

List the parts of a Java file in the required top-to-bottom order.

**Answer:** (optional) `package` statement -> (optional) `import` statements -> `class` definition -> inside the class: fields and methods, including `main`.

### 2. Spot the bug

```java
import java.util.Scanner;
package com.example;
public class Demo { }
```

Why will this not compile?

**Answer:** The `package` statement must come before any `import` and be the first statement in the file. Here `import` appears first, which is invalid.

### 3. File and class names

A file `Report.java` contains `public class Summary { ... }`. What is wrong?

**Answer:** A public class must have the same name as its file. Either rename the file to `Summary.java` or rename the class to `Report`.

### 4. Write the signature

Write the exact required signature of the program's entry-point method.

**Answer:** `public static void main(String[] args)`
$jp749$, 'markdown',
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
  select count(*) into v_tests from public.practice_tests where id in ('pt-java-introduction-to-java','pt-java-features-of-java','pt-java-java-vs-c-c','pt-java-jdk-jre-and-jvm','pt-java-how-java-works','pt-java-installing-java','pt-java-java-program-structure','pt-java-first-java-program','pt-java-variables','pt-java-data-types','pt-java-type-casting','pt-java-constants','pt-java-keywords-and-identifiers','pt-java-comments');
  if v_tests <> 14 then
    raise exception 'validation: expected 14 introduction-to-java mock tests, found %', v_tests;
  end if;

  select count(*) into v_bad from public.practice_tests
   where id in ('pt-java-introduction-to-java','pt-java-features-of-java','pt-java-java-vs-c-c','pt-java-jdk-jre-and-jvm','pt-java-how-java-works','pt-java-installing-java','pt-java-java-program-structure','pt-java-first-java-program','pt-java-variables','pt-java-data-types','pt-java-type-casting','pt-java-constants','pt-java-keywords-and-identifiers','pt-java-comments') and (question_count <> 10 or duration_minutes <> 10);
  if v_bad > 0 then
    raise exception 'validation: % introduction-to-java mock tests are not 10 questions / 10 minutes', v_bad;
  end if;

  select count(*) into v_questions from public.test_questions where test_id in ('pt-java-introduction-to-java','pt-java-features-of-java','pt-java-java-vs-c-c','pt-java-jdk-jre-and-jvm','pt-java-how-java-works','pt-java-installing-java','pt-java-java-program-structure','pt-java-first-java-program','pt-java-variables','pt-java-data-types','pt-java-type-casting','pt-java-constants','pt-java-keywords-and-identifiers','pt-java-comments');
  if v_questions <> 140 then
    raise exception 'validation: expected 140 introduction-to-java MCQ rows, found %', v_questions;
  end if;

  select count(*) into v_problems from public.dsa_problems where id like 'cp-java-first-java-program-%' or id like 'cp-java-variables-%' or id like 'cp-java-data-types-%' or id like 'cp-java-type-casting-%' or id like 'cp-java-constants-%' or id like 'cp-java-keywords-and-identifiers-%' or id like 'cp-java-comments-%';
  if v_problems <> 28 then
    raise exception 'validation: expected 28 introduction-to-java coding problems, found %', v_problems;
  end if;

  select count(*) into v_blocks from public.learning_contents c
    join public.learning_topics t on t.id = c.topic_id
   where (c.metadata ->> 'source') = 'java_practice_seed'
     and t.source_kind = 'java_tutorial' and t.source_ref in ($jp750$introduction-to-java/introduction-to-java$jp750$,$jp751$introduction-to-java/features-of-java$jp751$,$jp752$introduction-to-java/java-vs-c-c$jp752$,$jp753$introduction-to-java/jdk-jre-and-jvm$jp753$,$jp754$introduction-to-java/how-java-works$jp754$,$jp755$introduction-to-java/installing-java$jp755$,$jp756$introduction-to-java/java-program-structure$jp756$);
  if v_blocks <> 7 then
    raise exception 'validation: expected 7 introduction-to-java practice-problem blocks, found %', v_blocks;
  end if;

  raise notice '0070 OK: Introduction to Java — 14 mock tests (140 MCQs), 28 coding problems, 28 practice problems.';
end
$val$;

notify pgrst, 'reload schema';
