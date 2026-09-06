-- ============================================================================
-- admin-panel/supabase/migrations/024_seed_java_tutorial_content.sql
--   Seed the "Java Tutorials" Learning grid from core-java-full-course.md
-- ============================================================================
-- Apply AFTER the Learning chain (0042/019 · 0043/020 · 0044/021). Additive ·
-- guarded · idempotent · re-runnable. Content only — no schema / RLS / function
-- changes. Uses the existing learning_grids / learning_sections /
-- learning_topics / learning_contents tables and the existing admin CMS.
--
-- CANONICAL PAIR — the body below the marker is byte-identical to its twin
--   twin: mobile-app/supabase/migrations/0047_seed_java_tutorial_content.sql
-- Apply EITHER file once; the other is a guarded no-op (idempotent upserts).
-- ----------------------------------------------------------------------------

-- ============================================================================
-- BODY — seed "Java Tutorials" Learning content  (byte-identical in both twins)
-- ============================================================================
-- Imports the Core Java course (`core-java-full-course.md`) into the existing
-- Learning system: one grid (`java-tutorial`), 14 sections (modules),
-- 150 topics, one markdown content block per topic. Nothing else is touched.
--
-- IDEMPOTENT. Re-running:
--   * never duplicates — topics keyed on (source_kind,source_ref)=
--     ('java_tutorial','<section>/<topic>'); content on a partial unique index.
--   * refreshes canonical text (title / short_description / body / order) but
--     LEAVES publish state alone — status / show_on_website / show_on_mobile /
--     is_premium keep whatever an admin last set. First insert = published.
--   * leaves an existing `java-tutorial` grid exactly as the admin configured it
--     (on conflict do nothing); only creates one if the grid is absent.
--
-- After this runs, manage everything from Admin ▸ Learning ▸ Java Tutorials
-- (add / edit / delete / reorder / publish / draft). Website + mobile read the
-- same rows through the learning_* RPCs — no code change, no redeploy.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -----------------------------------------------------
do $guard$
begin
  if to_regclass('public.learning_grids') is null then
    raise exception '0047/024: learning_* not found — apply 0042_learning_management.sql (admin 019) first.';
  end if;
  if to_regprocedure('public.learning_slugify(text)') is null then
    raise exception '0047/024: learning_slugify() not found — apply 0043_merge_notes_into_learning.sql (admin 020) first.';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='learning_topics' and column_name='source_kind'
  ) then
    raise exception '0047/024: learning_topics.source_kind missing — apply 0044_learning_unification.sql (admin 021) first.';
  end if;
end
$guard$;

-- ---- content-block idempotency key (this seed only) --------------------
create unique index if not exists learning_contents_java_seed_key
  on public.learning_contents (topic_id)
  where (metadata ->> 'source') = 'java_tutorial_seed';

-- ===========================================================================
-- 1. GRID — create only if absent; never disturb an admin-configured grid.
-- ===========================================================================
insert into public.learning_grids
  (name, slug, description, icon, grid_type, sort_order,
   status, show_on_website, show_on_mobile, source_kind, source_ref)
values
  ('Java Tutorials', 'java-tutorial',
   'Complete Core Java course — fundamentals, OOP, collections, multithreading, JDBC, JVM internals, best practices, hands-on practice programs and interview preparation.',
   'Coffee', 'content', 50, 'published', true, true, 'seed', 'java_tutorial')
on conflict (lower(slug)) do nothing;

-- ===========================================================================
-- 2. SECTIONS — one per module. Re-run refreshes label/description/order only.
-- ===========================================================================

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$Introduction to Java$nm$, $sg$introduction-to-java$sg$, $ds$What Java is, why it is used, how it compiles and runs, and the core building blocks — variables, data types, type casting, constants, keywords and comments.$ds$, 10,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$Operators & Input$nm$, $sg$operators-and-input$sg$, $ds$Every Java operator group — arithmetic, relational, logical, assignment, unary, ternary and bitwise — plus reading user input and command-line arguments.$ds$, 20,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$Control Flow$nm$, $sg$control-flow$sg$, $ds$Decision-making and repetition: if / if-else / else-if / nested if, switch, for / while / do-while / nested loops, and the break, continue and return jump statements.$ds$, 30,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$Arrays & Strings$nm$, $sg$arrays-and-strings$sg$, $ds$One-dimensional, two-dimensional and multidimensional arrays, and Java text handling — String, its methods, the String Pool, StringBuilder and StringBuffer.$ds$, 40,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$Object-Oriented Programming$nm$, $sg$object-oriented-programming$sg$, $ds$The full OOP model — classes and objects, methods, constructors, this / static / super, and the four pillars: encapsulation, inheritance, polymorphism and abstraction, with interfaces, final and access modifiers.$ds$, 50,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$Packages & Exception Handling$nm$, $sg$packages-and-exception-handling$sg$, $ds$Organising code with packages and import, and handling runtime errors with try-catch-finally, throw / throws, custom exceptions, and the checked vs unchecked distinction.$ds$, 60,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$Collections Framework$nm$, $sg$collections-framework$sg$, $ds$The java.util Collections Framework — List / ArrayList / LinkedList / Vector, Set / HashSet / LinkedHashSet / TreeSet, Map / HashMap / LinkedHashMap / TreeMap, plus Iterator, Comparable and Comparator.$ds$, 70,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$Advanced Java$nm$, $sg$advanced-java$sg$, $ds$Modern Java features — wrapper classes, generics, enums, lambda expressions, functional interfaces, method references, the Stream API, Optional, the Date and Time API and regular expressions.$ds$, 80,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$Multithreading$nm$, $sg$multithreading$sg$, $ds$Concurrent execution in Java — Thread and Runnable, the thread lifecycle and methods, synchronization, deadlock, the Executor framework, and Callable / Future.$ds$, 90,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$File Handling & JDBC$nm$, $sg$file-handling-and-jdbc$sg$, $ds$Reading and writing data — the File class, byte and character streams, serialization, and database access with JDBC: connections, Statement / PreparedStatement / ResultSet, CRUD and transactions.$ds$, 100,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$JVM Internals & Memory$nm$, $sg$jvm-internals-and-memory$sg$, $ds$How the JVM works under the hood — its architecture, the Stack and Heap, garbage collection and the garbage collector, memory management and class loading.$ds$, 110,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$Real-World Java & Best Practices$nm$, $sg$real-world-java-and-best-practices$sg$, $ds$Working on real projects — Maven and standard project structure, debugging, exception-handling best practices, Java coding standards, common mistakes and clean-code basics.$ds$, 120,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$Practice Programs$nm$, $sg$practice-programs$sg$, $ds$This module is practice-focused. Instead of the usual concept format, each topic includes a short intro followed by a few worked example programs with code and output, so learners can practice hands-on.$ds$, 130,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();

with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial')
insert into public.learning_sections
  (grid_id, name, slug, description, sort_order, status, show_on_website, show_on_mobile)
select g.id, $nm$Interview Preparation$nm$, $sg$interview-preparation$sg$, $ds$This final module uses a Q&A and revision format rather than the standard topic structure, since it is designed for quick interview prep and last-minute revision.$ds$, 140,
  'published', true, true
from g
on conflict (grid_id, lower(slug)) do update set
  name = excluded.name, description = excluded.description,
  sort_order = excluded.sort_order, updated_at = now();


-- ===========================================================================
-- 3. TOPICS + 4. CONTENT — 150 topics, one markdown block each.
-- ===========================================================================

-- Introduction to Java  ▸  Introduction to Java
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Introduction to Java$ti$, $sl$introduction-to-java$sl$, $sd$Java is a programming language that lets you write instructions a computer can follow to solve a problem or run an application.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/introduction-to-java$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Java?

Java is a programming language that lets you write instructions a computer can follow to solve a problem or run an application. It was built to be simple to read, safe to use, and able to run on almost any device without changes to the code. Today, Java powers everything from Android apps to banking software to large enterprise systems.

## 2. Why is it used?

Companies choose Java because one Java program can run on Windows, Linux, or Mac without being rewritten. It also has strong safety checks built in, a huge collection of ready-made tools (called libraries), and a massive community, so help is always available when you get stuck.

## 3. Real-Life Example

Think of Java like a universal remote control. A normal remote only works with one brand of TV, but a universal remote works with almost any TV brand. In the same way, a Java program, once written, can run on almost any computer or device that has Java installed.

## 4. Syntax

```java
// A Java program always starts inside a class
public class MyFirstProgram {
    public static void main(String[] args) {
        // instructions go here
    }
}
```

## 5. Example Program

```java
public class Welcome {
    public static void main(String[] args) {
        System.out.println("Welcome to Java!");
    }
}
```

**Output:**
```
Welcome to Java!
```

## 6. Key Points to Remember

- Java is a general-purpose, object-oriented programming language.
- "Write once, run anywhere" is Java's biggest selling point.
- Java is used in mobile apps, web servers, desktop software, and more.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  Features of Java
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Features of Java$ti$, $sl$features-of-java$sl$, $sd$The features of Java are the core qualities that make it useful and popular. These include being simple, object-oriented, secure, platform-independent, and capable of handling multiple tasks at once (multithreading).$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/features-of-java$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is meant by "Features of Java"?

The features of Java are the core qualities that make it useful and popular. These include being simple, object-oriented, secure, platform-independent, and capable of handling multiple tasks at once (multithreading).

## 2. Why is it used?

Knowing the features helps you understand why Java is trusted for serious, large-scale software. For example, its security features matter for banking apps, and its platform independence matters for apps that must run on many types of devices.

## 3. Real-Life Example

Imagine buying a Swiss Army knife instead of a single blade. You get many tools (cutting, opening, screwing) built into one compact object. Java is similar — it bundles many useful qualities (security, portability, simplicity) into one language.

## 4. Syntax

Not applicable directly, but here is a quick example showing Java's simplicity in action:

```java
int total = 10 + 20; // simple, readable syntax
```

## 5. Example Program

```java
public class FeatureDemo {
    public static void main(String[] args) {
        // Simplicity: easy to read and write
        int a = 5, b = 10;
        System.out.println("Sum: " + (a + b));
    }
}
```

**Output:**
```
Sum: 15
```

## 6. Key Points to Remember

- Key features: Simple, Object-Oriented, Platform-Independent, Secure, Robust, Multithreaded.
- Platform independence comes from the JVM (covered in topic 4).
- These features are common interview questions — be ready to list at least 5.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  Java vs C/C++
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Java vs C/C++$ti$, $sl$java-vs-c-c$sl$, $sd$C and C++ are older programming languages that give you very direct control over computer memory. Java was designed after them, and it removes some of that direct control to make programs safer and easier to manage, while keeping a similar…$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/java-vs-c-c$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the difference between Java and C/C++?

C and C++ are older programming languages that give you very direct control over computer memory. Java was designed after them, and it removes some of that direct control to make programs safer and easier to manage, while keeping a similar style of writing code.

## 2. Why is it used?

Understanding this comparison helps beginners see why Java feels "safer" to learn. For example, Java manages memory automatically, so you don't have to manually free up space like you often do in C/C++.

## 3. Real-Life Example

Driving a manual car (C/C++) requires you to control the gears yourself, giving more control but more chances of mistakes. Driving an automatic car (Java) handles gear changes for you, making driving easier and reducing errors, even if you have slightly less control.

## 4. Syntax

```java
// Java does not need a separate header file like C/C++
// No pointers are exposed to the programmer directly
public class Demo {
}
```

## 5. Example Program

```java
public class MemoryDemo {
    public static void main(String[] args) {
        String name = "Java"; // no manual memory management needed
        System.out.println(name + " handles memory automatically.");
    }
}
```

**Output:**
```
Java handles memory automatically.
```

## 6. Key Points to Remember

- Java has automatic memory management (Garbage Collection); C/C++ requires manual handling.
- Java does not support pointers directly; C/C++ does.
- Java is platform-independent; C/C++ programs usually need recompiling for each platform.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  JDK, JRE and JVM
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$JDK, JRE and JVM$ti$, $sl$jdk-jre-and-jvm$sl$, $sd$JVM (Java Virtual Machine) is the engine that actually runs your Java program. JRE (Java Runtime Environment) is the JVM plus the libraries needed to run Java applications.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/jdk-jre-and-jvm$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are JDK, JRE, and JVM?

JVM (Java Virtual Machine) is the engine that actually runs your Java program. JRE (Java Runtime Environment) is the JVM plus the libraries needed to run Java applications. JDK (Java Development Kit) is the JRE plus tools needed to write and compile Java code, such as the compiler.

## 2. Why is it used?

If you only want to run Java applications, you need the JRE. If you want to write and build Java programs yourself, you need the JDK, since it includes everything the JRE has, plus development tools.

## 3. Real-Life Example

Think of a kitchen. The JVM is like the stove that actually cooks the food. The JRE is the whole kitchen with the stove, utensils, and ingredients needed to cook a finished dish. The JDK is the kitchen plus a recipe book and cooking classes — everything needed to create new dishes from scratch.

## 4. Syntax

```java
// Not code, but a command you run in terminal after installing JDK
// javac MyFirstProgram.java   -> compiles code (JDK)
// java MyFirstProgram         -> runs code (JRE + JVM)
```

## 5. Example Program

```java
public class CheckVersion {
    public static void main(String[] args) {
        System.out.println("Java version: " + System.getProperty("java.version"));
    }
}
```

**Output:**
```
Java version: 21.0.1   (this will vary depending on your installed JDK version)
```

## 6. Key Points to Remember

- JVM runs the code; JRE lets you run programs; JDK lets you write and run programs.
- JDK = JRE + Development Tools. JRE = JVM + Libraries.
- This is one of the most commonly asked basic interview questions.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  How Java Works
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$How Java Works$ti$, $sl$how-java-works$sl$, $sd$This describes the journey your code takes — from the moment you write it, to the moment it actually runs on a computer. Java code is first turned into a special in-between format called bytecode, and then the JVM reads that bytecode and ex…$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/how-java-works$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What does "How Java Works" mean?

This describes the journey your code takes — from the moment you write it, to the moment it actually runs on a computer. Java code is first turned into a special in-between format called bytecode, and then the JVM reads that bytecode and executes it.

## 2. Why is it used?

This two-step process (compile to bytecode, then run on JVM) is exactly why Java can work on different operating systems without changes. The bytecode is the same everywhere; only the JVM differs per platform.

## 3. Real-Life Example

Imagine writing a letter in a universal script that any translator, in any country, can read aloud in the local language. You write it once (your Java code becomes bytecode), and each country's translator (the JVM on each OS) reads it aloud correctly for local listeners.

## 4. Syntax

```java
// Step 1: Write code -> MyProgram.java
// Step 2: Compile   -> javac MyProgram.java  (creates MyProgram.class, the bytecode)
// Step 3: Run        -> java MyProgram        (JVM executes the bytecode)
```

## 5. Example Program

```java
public class HowItWorks {
    public static void main(String[] args) {
        System.out.println("This text became bytecode before running!");
    }
}
```

**Output:**
```
This text became bytecode before running!
```

## 6. Key Points to Remember

- Java code goes through: Source Code → Compilation → Bytecode → JVM Execution.
- Bytecode is stored in `.class` files.
- Bytecode is what makes Java platform-independent, not the source code directly.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  Installing Java
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Installing Java$ti$, $sl$installing-java$sl$, $sd$This means downloading and setting up the JDK on your computer so you can write, compile, and run Java programs. Once installed, your computer understands commands like javac (to compile) and java (to run).$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/installing-java$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What does "Installing Java" mean?

This means downloading and setting up the JDK on your computer so you can write, compile, and run Java programs. Once installed, your computer understands commands like `javac` (to compile) and `java` (to run).

## 2. Why is it used?

Without installing the JDK, your computer has no way to understand or execute Java code. Installing it correctly, and setting up the required system path, is the very first practical step before writing any real program.

## 3. Real-Life Example

It's like buying a new smartphone. Before you can use apps on it, you first need to switch it on and complete the initial setup. Installing the JDK is that same "initial setup" step, done once, before you can start building anything in Java.

## 4. Syntax

```
1. Download the JDK from a trusted official source for your operating system.
2. Install it following the setup wizard.
3. Set the JAVA_HOME environment variable and add it to your system PATH.
4. Confirm installation using a terminal command.
```

## 5. Example Program

```java
// After installing, test it by running this in your terminal:
// java -version
```

**Output:**
```
java version "21.0.1" 2024-xx-xx
```

## 6. Key Points to Remember

- You need the JDK, not just the JRE, if you plan to write code.
- `JAVA_HOME` and `PATH` must be set correctly for terminal commands to work.
- Use `java -version` and `javac -version` to confirm a successful installation.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  First Java Program
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$First Java Program$ti$, $sl$first-java-program$sl$, $sd$This is the very first small program every learner writes, usually one that prints a short message to the screen. It's a way to confirm that your Java setup works, and to see the basic shape of a Java program for the first time.$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/first-java-program$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a "First Java Program"?

This is the very first small program every learner writes, usually one that prints a short message to the screen. It's a way to confirm that your Java setup works, and to see the basic shape of a Java program for the first time.

## 2. Why is it used?

Writing this simple program builds confidence and shows the smallest working unit of Java code. Almost every programming language tradition starts with printing a simple greeting message, and Java is no different.

## 3. Real-Life Example

It's similar to a new driver's very first practice drive around an empty parking lot before going on a real road. It's small, low-risk, and lets you get comfortable with the basic controls before attempting anything bigger.

## 4. Syntax

```java
public class ClassName {
    public static void main(String[] args) {
        System.out.println("your message here");
    }
}
```

## 5. Example Program

```java
public class HelloJava {
    public static void main(String[] args) {
        System.out.println("Hello, Java learner!");
    }
}
```

**Output:**
```
Hello, Java learner!
```

## 6. Key Points to Remember

- Every Java program needs at least one class.
- The `main` method is where program execution begins.
- The file name must match the public class name exactly, including capital letters.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  Java Program Structure
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Java Program Structure$ti$, $sl$java-program-structure$sl$, $sd$This refers to the standard layout every Java file follows: an optional package statement, optional import statements, a class definition, and inside that class, methods (including the special main method where execution starts).$sd$, 8,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/java-program-structure$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Java Program Structure?

This refers to the standard layout every Java file follows: an optional package statement, optional import statements, a class definition, and inside that class, methods (including the special `main` method where execution starts).

## 2. Why is it used?

Java enforces this structure so that every program is organized in a predictable way. This makes it easier for any Java developer to read someone else's code and immediately understand where things begin and how they're organized.

## 3. Real-Life Example

Think of a college application form. It always has the same order: personal details section first, then academic details, then signature at the end. Regardless of who fills it out, the structure stays the same, making it easy for anyone to review.

## 4. Syntax

```java
package com.example.myapp;      // optional

import java.util.Scanner;       // optional

public class StructureDemo {
    // fields (variables) go here

    public static void main(String[] args) {
        // program logic goes here
    }

    // other methods go here
}
```

## 5. Example Program

```java
package com.example.demo;

public class StructureExample {
    static int counter = 0; // a field

    public static void main(String[] args) {
        counter++;
        System.out.println("Counter value: " + counter);
    }
}
```

**Output:**
```
Counter value: 1
```

## 6. Key Points to Remember

- Order matters: package, then imports, then the class.
- A Java file can have only one public class, and its name must match the file name.
- The `main` method signature must always be `public static void main(String[] args)`.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  Variables
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Variables$ti$, $sl$variables$sl$, $sd$A variable is a named container used to store a value that your program can use and change while it runs. Every variable in Java has a specific data type that decides what kind of value it can hold.$sd$, 9,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/variables$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Variable?

A variable is a named container used to store a value that your program can use and change while it runs. Every variable in Java has a specific data type that decides what kind of value it can hold.

## 2. Why is it used?

Variables let programs remember and reuse information instead of typing the same value repeatedly. For example, a variable can hold a user's age once, and that value can be used again anywhere in the program.

## 3. Real-Life Example

A variable is like a labelled box in your room. You might have a box labelled "books" and another labelled "clothes." You can look inside, take something out, or replace what's inside — the label (variable name) stays the same, but its contents (value) can change.

## 4. Syntax

```java
dataType variableName = value;
```

## 5. Example Program

```java
public class VariableDemo {
    public static void main(String[] args) {
        int age = 20;
        String city = "Pune";
        System.out.println("Age: " + age + ", City: " + city);
    }
}
```

**Output:**
```
Age: 20, City: Pune
```

## 6. Key Points to Remember

- A variable must be declared with a data type before use.
- Variable names are case-sensitive (`age` and `Age` are different).
- A variable's value can change during program execution, but its type cannot.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  Data Types
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Data Types$ti$, $sl$data-types$sl$, $sd$A data type tells Java what kind of value a variable will store — whether it's a whole number, a decimal number, a single character, or true/false.$sd$, 10,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/data-types$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Data Types?

A data type tells Java what kind of value a variable will store — whether it's a whole number, a decimal number, a single character, or true/false. Java has two categories: primitive types (like `int`, `double`, `char`, `boolean`) and reference types (like `String`, arrays, and objects).

## 2. Why is it used?

Data types help Java know exactly how much memory to reserve and what operations are valid on a value. For example, you can perform mathematical operations on an `int`, but not on a `String`, because their data types behave differently.

## 3. Real-Life Example

Think of different containers in a kitchen — a jar for sugar, a bottle for oil, a box for spices. Each container is designed for one kind of item. Similarly, each data type is designed to correctly store one kind of value.

## 4. Syntax

```java
int wholeNumber = 10;
double decimalNumber = 10.5;
char letter = 'A';
boolean isActive = true;
String text = "Hello";
```

## 5. Example Program

```java
public class DataTypeDemo {
    public static void main(String[] args) {
        int marks = 90;
        double percentage = 90.5;
        char grade = 'A';
        boolean passed = true;

        System.out.println(marks + " " + percentage + " " + grade + " " + passed);
    }
}
```

**Output:**
```
90 90.5 A true
```

## 6. Key Points to Remember

- 8 primitive types exist in Java: `byte`, `short`, `int`, `long`, `float`, `double`, `char`, `boolean`.
- `String` is not a primitive type — it is a class (reference type).
- Choosing the right data type avoids wasted memory and unexpected errors.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  Type Casting
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Type Casting$ti$, $sl$type-casting$sl$, $sd$Type casting means converting a value from one data type to another. Java allows this so a value stored in one type (say, a double) can be used where another type (say, an int) is expected, following certain rules.$sd$, 11,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/type-casting$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Type Casting?

Type casting means converting a value from one data type to another. Java allows this so a value stored in one type (say, a `double`) can be used where another type (say, an `int`) is expected, following certain rules.

## 2. Why is it used?

Sometimes your program stores data in one type but needs it in another for a calculation or a method call. Type casting lets you bridge that gap safely, either automatically or with explicit instructions from you.

## 3. Real-Life Example

Think of pouring juice from a large jug into a small glass. Some juice fits perfectly (like converting a small type to a bigger type automatically), but if you pour too much into a smaller glass, some juice spills out — similar to losing precision when converting a bigger type into a smaller one.

## 4. Syntax

```java
// Implicit (automatic) casting - smaller to bigger type
double d = 100; // int to double automatically

// Explicit casting - bigger to smaller type, needs manual instruction
int i = (int) 9.8;
```

## 5. Example Program

```java
public class CastingDemo {
    public static void main(String[] args) {
        double price = 99.99;
        int roundedPrice = (int) price; // explicit casting
        System.out.println("Original: " + price + ", Casted: " + roundedPrice);
    }
}
```

**Output:**
```
Original: 99.99, Casted: 99
```

## 6. Key Points to Remember

- Implicit casting happens automatically when there's no risk of data loss.
- Explicit casting requires `(type)` and may lose data (like decimal points).
- Casting between unrelated types (like `String` to `int` directly) is not allowed this way — special methods are needed instead.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  Constants
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Constants$ti$, $sl$constants$sl$, $sd$A constant is a value that, once assigned, cannot be changed during the program's execution. In Java, you create a constant using the final keyword along with a variable declaration.$sd$, 12,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/constants$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Constant?

A constant is a value that, once assigned, cannot be changed during the program's execution. In Java, you create a constant using the `final` keyword along with a variable declaration.

## 2. Why is it used?

Constants protect important fixed values, like a tax rate or the number of days in a week, from being accidentally changed somewhere else in the code. This makes programs safer and easier to maintain.

## 3. Real-Life Example

Think of your date of birth. It is a fixed fact that never changes no matter what happens in your life afterward. A constant in Java behaves the same way — fixed once, and never modified again.

## 4. Syntax

```java
final dataType CONSTANT_NAME = value;
```

## 5. Example Program

```java
public class ConstantDemo {
    public static void main(String[] args) {
        final double TAX_RATE = 0.18;
        double price = 1000;
        double finalPrice = price + (price * TAX_RATE);
        System.out.println("Final Price: " + finalPrice);
    }
}
```

**Output:**
```
Final Price: 1180.0
```

## 6. Key Points to Remember

- Constants use the `final` keyword and, by convention, are named in UPPERCASE.
- Trying to reassign a `final` variable causes a compile-time error.
- Constants make code more readable by giving meaning to fixed values.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  Keywords and Identifiers
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Keywords and Identifiers$ti$, $sl$keywords-and-identifiers$sl$, $sd$Keywords are reserved words that already have a special meaning in Java, such as class, public, static, and if. Identifiers are the names you create yourself for things like classes, variables, and methods, such as Student or totalMarks.$sd$, 13,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/keywords-and-identifiers$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Keywords and Identifiers?

Keywords are reserved words that already have a special meaning in Java, such as `class`, `public`, `static`, and `if`. Identifiers are the names you create yourself for things like classes, variables, and methods, such as `Student` or `totalMarks`.

## 2. Why is it used?

Keywords tell the Java compiler what action or structure you intend (like defining a class or writing a loop), so they cannot be reused as names for your own variables. Identifiers, on the other hand, let you label and organize your own code meaningfully.

## 3. Real-Life Example

Think of keywords like traffic signs — "STOP," "YIELD" — which have a fixed meaning everyone must follow and cannot be renamed. Identifiers are like the names you give your own pet or your own notebook — completely up to you, as long as you follow basic naming rules.

## 4. Syntax

```java
// Keywords (cannot be used as variable names)
class, public, static, void, int, if, else, for, while

// Identifiers (names you create)
int studentAge;
String courseName;
```

## 5. Example Program

```java
public class IdentifierDemo {
    public static void main(String[] args) {
        int studentMarks = 85; // studentMarks is an identifier
        System.out.println("Marks: " + studentMarks);
    }
}
```

**Output:**
```
Marks: 85
```

## 6. Key Points to Remember

- Keywords are fixed and reserved; you cannot use them as identifier names.
- Identifiers must start with a letter, `_`, or `$`, and cannot start with a digit.
- Java identifiers are case-sensitive, so `total` and `Total` are different names.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Introduction to Java  ▸  Comments
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$introduction-to-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Comments$ti$, $sl$comments$sl$, $sd$A comment is a line or block of text in your code that Java ignores when running the program. Comments are written purely for humans — to explain what the code does, so anyone reading it later understands the intention behind it.$sd$, 14,
    'published', true, true, 'java_tutorial', $sr$introduction-to-java/comments$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Comment?

A comment is a line or block of text in your code that Java ignores when running the program. Comments are written purely for humans — to explain what the code does, so anyone reading it later understands the intention behind it.

## 2. Why is it used?

Comments make code easier to understand, both for other developers and for your future self. When a program grows large, comments help explain tricky logic without needing to re-read every single line of code to figure out what's happening.

## 3. Real-Life Example

Think of sticky notes left on a recipe card, saying "reduce sugar if guests dislike sweet food." The recipe itself still works without the note, but the note helps whoever reads it later understand a special consideration behind a step.

## 4. Syntax

```java
// This is a single-line comment

/*
 This is a
 multi-line comment
*/

/**
 * This is a documentation comment (Javadoc)
 */
```

## 5. Example Program

```java
public class CommentDemo {
    public static void main(String[] args) {
        // Printing a welcome message
        System.out.println("Comments make code clear!");
        /* This line is just an example
           of a multi-line comment */
    }
}
```

**Output:**
```
Comments make code clear!
```

## 6. Key Points to Remember

- Comments are ignored by the compiler and do not affect program execution.
- Three types exist: single-line (`//`), multi-line (`/* */`), and documentation (`/** */`).
- Good comments explain "why," not just "what," since the code itself already shows "what."$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Operators & Input  ▸  Arithmetic Operators
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$operators-and-input$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Arithmetic Operators$ti$, $sl$arithmetic-operators$sl$, $sd$Arithmetic operators are symbols used to perform basic mathematical calculations in Java — addition, subtraction, multiplication, division, and finding the remainder of a division.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$operators-and-input/arithmetic-operators$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Arithmetic Operators?

Arithmetic operators are symbols used to perform basic mathematical calculations in Java — addition, subtraction, multiplication, division, and finding the remainder of a division.

## 2. Why is it used?

Almost every program needs to calculate something — a total bill, an average score, or a remaining balance. Arithmetic operators are the basic building blocks for all such calculations.

## 3. Real-Life Example

Think of a shopkeeper's calculator. Every time a customer buys something, the shopkeeper adds prices, subtracts a discount, or multiplies the price by quantity. Arithmetic operators do exactly this kind of work inside a Java program.

## 4. Syntax

```java
int sum = a + b;
int difference = a - b;
int product = a * b;
int quotient = a / b;
int remainder = a % b;
```

## 5. Example Program

```java
public class ArithmeticDemo {
    public static void main(String[] args) {
        int a = 17, b = 5;
        System.out.println("Sum: " + (a + b));
        System.out.println("Difference: " + (a - b));
        System.out.println("Product: " + (a * b));
        System.out.println("Quotient: " + (a / b));
        System.out.println("Remainder: " + (a % b));
    }
}
```

**Output:**
```
Sum: 22
Difference: 12
Product: 85
Quotient: 3
Remainder: 2
```

## 6. Key Points to Remember

- `%` gives the remainder, not a percentage — a common confusion for beginners.
- Dividing two integers gives an integer result; decimals are dropped (e.g., `7 / 2` gives `3`, not `3.5`).
- To get a decimal result, at least one value involved must be a `double` or `float`.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Operators & Input  ▸  Relational Operators
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$operators-and-input$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Relational Operators$ti$, $sl$relational-operators$sl$, $sd$Relational operators compare two values and return a boolean result — either true or false. They answer questions like "is this value greater than that one?" or "are these two values equal?"$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$operators-and-input/relational-operators$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Relational Operators?

Relational operators compare two values and return a `boolean` result — either `true` or `false`. They answer questions like "is this value greater than that one?" or "are these two values equal?"

## 2. Why is it used?

Programs constantly need to compare values to make decisions — like checking if a student's marks are enough to pass, or if a user's age qualifies them for something. Relational operators make these comparisons possible.

## 3. Real-Life Example

Think of a security guard checking if a visitor's age is 18 or above before allowing entry. The guard compares the visitor's age with 18 — this comparison is exactly what a relational operator does in code.

## 4. Syntax

```java
a == b   // equal to
a != b   // not equal to
a > b    // greater than
a < b    // less than
a >= b   // greater than or equal to
a <= b   // less than or equal to
```

## 5. Example Program

```java
public class RelationalDemo {
    public static void main(String[] args) {
        int age = 20;
        System.out.println("Is age >= 18? " + (age >= 18));
        System.out.println("Is age == 25? " + (age == 25));
    }
}
```

**Output:**
```
Is age >= 18? true
Is age == 25? false
```

## 6. Key Points to Remember

- Relational operators always produce a `boolean` value (`true` or `false`).
- Don't confuse `==` (comparison) with `=` (assignment) — this is a very common beginner mistake.
- These operators are heavily used inside `if` conditions and loops.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Operators & Input  ▸  Logical Operators
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$operators-and-input$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Logical Operators$ti$, $sl$logical-operators$sl$, $sd$Logical operators combine two or more boolean conditions into a single result. Java provides AND (&&), OR (||), and NOT (!) to build these combined conditions.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$operators-and-input/logical-operators$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Logical Operators?

Logical operators combine two or more `boolean` conditions into a single result. Java provides AND (`&&`), OR (`||`), and NOT (`!`) to build these combined conditions.

## 2. Why is it used?

Real decisions often depend on more than one condition at once — like allowing login only if both the username AND password are correct. Logical operators let a program handle these multiple conditions together.

## 3. Real-Life Example

Think of an exam eligibility rule: "You can appear for the exam only if your attendance is above 75% AND your fees are fully paid." Both conditions must be true together — exactly how the `&&` operator behaves.

## 4. Syntax

```java
condition1 && condition2   // true only if both are true
condition1 || condition2   // true if at least one is true
!condition                 // reverses true to false, and false to true
```

## 5. Example Program

```java
public class LogicalDemo {
    public static void main(String[] args) {
        int attendance = 80;
        boolean feesPaid = true;

        boolean isEligible = (attendance > 75) && feesPaid;
        System.out.println("Exam Eligible: " + isEligible);
    }
}
```

**Output:**
```
Exam Eligible: true
```

## 6. Key Points to Remember

- `&&` and `||` use "short-circuit" evaluation — if the first condition already decides the result, the second condition is not even checked.
- `!` simply flips a boolean's value.
- Don't confuse logical operators (`&&`, `||`) with bitwise operators (`&`, `|`) — they look similar but behave differently.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Operators & Input  ▸  Assignment Operators
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$operators-and-input$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Assignment Operators$ti$, $sl$assignment-operators$sl$, $sd$Assignment operators are used to store a value into a variable. The simplest one is =, but Java also provides shortcut versions like +=, -=, *=, and /= that combine a calculation with assignment in one step.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$operators-and-input/assignment-operators$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Assignment Operators?

Assignment operators are used to store a value into a variable. The simplest one is `=`, but Java also provides shortcut versions like `+=`, `-=`, `*=`, and `/=` that combine a calculation with assignment in one step.

## 2. Why is it used?

Shortcut assignment operators save time and make code shorter and cleaner, especially when you're repeatedly updating the same variable, such as adding points to a running score.

## 3. Real-Life Example

Think of a shop's running total on a bill. Each time an item is added, the cashier doesn't restart the calculation — they simply add the new item's price to the existing total. `total += price` does exactly this in one step.

## 4. Syntax

```java
a = b;      // assign
a += b;     // same as a = a + b
a -= b;     // same as a = a - b
a *= b;     // same as a = a * b
a /= b;     // same as a = a / b
```

## 5. Example Program

```java
public class AssignmentDemo {
    public static void main(String[] args) {
        int total = 100;
        total += 50; // total becomes 150
        total -= 20; // total becomes 130
        System.out.println("Final Total: " + total);
    }
}
```

**Output:**
```
Final Total: 130
```

## 6. Key Points to Remember

- `+=`, `-=`, `*=`, `/=` are shortcuts that reduce repetitive code.
- The variable on the left must already exist before using shortcut assignment on it.
- These operators work with all numeric types, and `+=` also works with `String` for joining text.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Operators & Input  ▸  Unary Operators
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$operators-and-input$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Unary Operators$ti$, $sl$unary-operators$sl$, $sd$Unary operators work on a single value (unlike most operators, which need two). Common examples include increment (++), decrement (--), and unary minus (-) for making a number negative.$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$operators-and-input/unary-operators$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Unary Operators?

Unary operators work on a single value (unlike most operators, which need two). Common examples include increment (`++`), decrement (`--`), and unary minus (`-`) for making a number negative.

## 2. Why is it used?

Unary operators are extremely common for counting purposes — like increasing a counter by 1 every time a loop runs, without writing a longer expression each time.

## 3. Real-Life Example

Think of a movie theatre's ticket counter that increases by one every time a new customer buys a ticket. Instead of manually recalculating, the counter simply increases by one step — just like `counter++` in Java.

## 4. Syntax

```java
a++;   // increases a by 1 (post-increment)
++a;   // increases a by 1 (pre-increment)
a--;   // decreases a by 1
-a;    // makes a value negative
```

## 5. Example Program

```java
public class UnaryDemo {
    public static void main(String[] args) {
        int count = 5;
        count++;
        System.out.println("After increment: " + count);
        count--;
        System.out.println("After decrement: " + count);
    }
}
```

**Output:**
```
After increment: 6
After decrement: 5
```

## 6. Key Points to Remember

- `a++` (post-increment) uses the current value first, then increases it; `++a` (pre-increment) increases it first, then uses the new value.
- This difference between pre- and post- versions is a frequent interview question.
- Unary minus (`-a`) simply reverses the sign of a number.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Operators & Input  ▸  Ternary Operator
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$operators-and-input$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Ternary Operator$ti$, $sl$ternary-operator$sl$, $sd$The ternary operator is a shortcut for a simple if-else decision, written in a single line. It's called "ternary" because it works with three parts: a condition, a result if true, and a result if false.$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$operators-and-input/ternary-operator$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the Ternary Operator?

The ternary operator is a shortcut for a simple if-else decision, written in a single line. It's called "ternary" because it works with three parts: a condition, a result if true, and a result if false.

## 2. Why is it used?

It makes code shorter and cleaner for simple two-outcome decisions, avoiding a full if-else block when only one value needs to be picked based on a condition.

## 3. Real-Life Example

Think of a quick decision: "If it's raining, take an umbrella; otherwise, don't." This whole sentence can be captured in a single compact line using the ternary operator, instead of writing separate if and else blocks.

## 4. Syntax

```java
result = (condition) ? valueIfTrue : valueIfFalse;
```

## 5. Example Program

```java
public class TernaryDemo {
    public static void main(String[] args) {
        int marks = 40;
        String result = (marks >= 35) ? "Pass" : "Fail";
        System.out.println("Result: " + result);
    }
}
```

**Output:**
```
Result: Pass
```

## 6. Key Points to Remember

- The ternary operator always returns a value — it's an expression, not just a statement.
- Best used for simple, single-decision cases; complex conditions are clearer with a full if-else.
- Ternary operators can be nested, but this quickly becomes hard to read and should be avoided in real projects.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Operators & Input  ▸  Bitwise Operators
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$operators-and-input$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Bitwise Operators$ti$, $sl$bitwise-operators$sl$, $sd$Bitwise operators work directly on the individual bits (0s and 1s) that make up a number, rather than on the number as a whole. Java provides operators like & (AND), | (OR), ^ (XOR), ~ (NOT), << (left shift), and >> (right shift).$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$operators-and-input/bitwise-operators$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Bitwise Operators?

Bitwise operators work directly on the individual bits (0s and 1s) that make up a number, rather than on the number as a whole. Java provides operators like `&` (AND), `|` (OR), `^` (XOR), `~` (NOT), `<<` (left shift), and `>>` (right shift).

## 2. Why is it used?

Bitwise operators are used in performance-critical tasks, such as low-level programming, working with flags, encryption logic, and optimizing certain calculations by manipulating bits directly instead of using normal arithmetic.

## 3. Real-Life Example

Think of a row of light switches, where each switch is either ON (1) or OFF (0). Bitwise operators let you check, combine, or flip specific switches individually, rather than dealing with the whole row of switches as one single unit.

## 4. Syntax

```java
a & b    // bitwise AND
a | b    // bitwise OR
a ^ b    // bitwise XOR
~a       // bitwise NOT (complement)
a << 1   // left shift by 1 bit
a >> 1   // right shift by 1 bit
```

## 5. Example Program

```java
public class BitwiseDemo {
    public static void main(String[] args) {
        int a = 5;  // binary: 0101
        int b = 3;  // binary: 0011

        System.out.println("AND: " + (a & b));
        System.out.println("OR: " + (a | b));
        System.out.println("XOR: " + (a ^ b));
        System.out.println("Left Shift: " + (a << 1));
    }
}
```

**Output:**
```
AND: 1
OR: 7
XOR: 6
Left Shift: 10
```

## 6. Key Points to Remember

- Bitwise operators work on the binary form of numbers, not the decimal value directly.
- `<<` (left shift) roughly doubles a number for each shift; `>>` (right shift) roughly halves it.
- These are used less often in everyday business applications but are important for interviews and system-level programming.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Operators & Input  ▸  User Input
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$operators-and-input$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$User Input$ti$, $sl$user-input$sl$, $sd$User input means allowing a program to receive data typed by the person using it, instead of using only fixed, hardcoded values. Java commonly uses the Scanner class to read this input from the keyboard.$sd$, 8,
    'published', true, true, 'java_tutorial', $sr$operators-and-input/user-input$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is User Input in Java?

User input means allowing a program to receive data typed by the person using it, instead of using only fixed, hardcoded values. Java commonly uses the `Scanner` class to read this input from the keyboard.

## 2. Why is it used?

Real applications must react to whatever the user types — a login form needs the username typed by the user, and a calculator app needs the numbers the user enters. Without user input, programs could only ever work with fixed values.

## 3. Real-Life Example

Think of a food delivery app asking you to type your address and choose your food items. The app can't know these details in advance — it must take them as input directly from you, the user.

## 4. Syntax

```java
import java.util.Scanner;

Scanner sc = new Scanner(System.in);
int number = sc.nextInt();
String text = sc.nextLine();
```

## 5. Example Program

```java
import java.util.Scanner;

public class UserInputDemo {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter your age: ");
        int age = sc.nextInt();
        System.out.println("Your age is: " + age);
    }
}
```

**Output:**
```
Enter your age: 22
Your age is: 22
```

## 6. Key Points to Remember

- `Scanner` requires importing `java.util.Scanner` at the top of the file.
- Mixing `nextInt()` and `nextLine()` without care often causes a common beginner bug, since `nextInt()` leaves a leftover newline character behind.
- Always close the `Scanner` object (`sc.close()`) once you're done reading input, in real projects.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Operators & Input  ▸  Command-Line Arguments
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$operators-and-input$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Command-Line Arguments$ti$, $sl$command-line-arguments$sl$, $sd$Command-line arguments are values passed to a Java program at the moment it is run from the terminal, rather than typed in while the program is running. They arrive inside the String[] args parameter of the main method.$sd$, 9,
    'published', true, true, 'java_tutorial', $sr$operators-and-input/command-line-arguments$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Command-Line Arguments?

Command-line arguments are values passed to a Java program at the moment it is run from the terminal, rather than typed in while the program is running. They arrive inside the `String[] args` parameter of the `main` method.

## 2. Why is it used?

They let a program behave differently based on values supplied right when it starts — useful for configuration options, file names, or settings, without needing to modify the program's code itself.

## 3. Real-Life Example

Think of starting a washing machine and selecting a wash mode (quick wash, heavy wash) using the dial before pressing start. You're supplying a setting upfront, before the machine begins its main task — similar to how command-line arguments are supplied before the program runs.

## 4. Syntax

```java
public static void main(String[] args) {
    // args[0], args[1], etc. hold the values passed
}
```

```
java ProgramName value1 value2
```

## 5. Example Program

```java
public class CommandLineDemo {
    public static void main(String[] args) {
        if (args.length > 0) {
            System.out.println("Hello, " + args[0] + "!");
        } else {
            System.out.println("No name provided.");
        }
    }
}
```

**Output (when run as `java CommandLineDemo Rahul`):**
```
Hello, Rahul!
```

## 6. Key Points to Remember

- `args` is always a `String` array, even if you pass numbers — you must convert them manually if needed (e.g., using `Integer.parseInt()`).
- `args.length` tells you how many values were passed.
- Command-line arguments are supplied before the program starts, unlike `Scanner` input which is read while the program is running.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Control Flow  ▸  if Statement
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$control-flow$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$if Statement$ti$, $sl$if-statement$sl$, $sd$An if statement lets a program run a block of code only when a certain condition is true. If the condition is false, that block is simply skipped.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$control-flow/if-statement$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is an if Statement?

An `if` statement lets a program run a block of code only when a certain condition is true. If the condition is false, that block is simply skipped.

## 2. Why is it used?

Programs rarely do the exact same thing every time — they need to react differently depending on the situation. The `if` statement is the most basic way to make a program take a decision.

## 3. Real-Life Example

Think of a simple rule: "If it is raining, carry an umbrella." You only pick up the umbrella when the condition (raining) is true. If it's not raining, you simply skip that action.

## 4. Syntax

```java
if (condition) {
    // code runs only if condition is true
}
```

## 5. Example Program

```java
public class IfDemo {
    public static void main(String[] args) {
        int marks = 80;
        if (marks >= 35) {
            System.out.println("You passed!");
        }
    }
}
```

**Output:**
```
You passed!
```

## 6. Key Points to Remember

- The condition inside `if` must evaluate to a `boolean` (true or false).
- Curly braces are optional for a single statement, but using them is a good habit that avoids bugs later.
- If the condition is false and there's no `else`, the program simply moves to the next line.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Control Flow  ▸  if-else
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$control-flow$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$if-else$ti$, $sl$if-else$sl$, $sd$if-else extends the basic if statement by adding an alternative block of code that runs when the condition is false. Exactly one of the two blocks will run — never both, never neither.$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$control-flow/if-else$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is if-else?

`if-else` extends the basic `if` statement by adding an alternative block of code that runs when the condition is false. Exactly one of the two blocks will run — never both, never neither.

## 2. Why is it used?

Many decisions have exactly two outcomes — pass or fail, eligible or not eligible. `if-else` handles both possibilities cleanly in one structure.

## 3. Real-Life Example

Think of an exam result: "If marks are 35 or above, you pass; otherwise, you fail." Both outcomes are covered — there's always a result either way.

## 4. Syntax

```java
if (condition) {
    // runs if condition is true
} else {
    // runs if condition is false
}
```

## 5. Example Program

```java
public class IfElseDemo {
    public static void main(String[] args) {
        int marks = 20;
        if (marks >= 35) {
            System.out.println("Pass");
        } else {
            System.out.println("Fail");
        }
    }
}
```

**Output:**
```
Fail
```

## 6. Key Points to Remember

- Exactly one block runs — `if` or `else` — never both.
- The `else` block has no condition of its own; it simply handles "everything else."
- Great for situations with only two possible outcomes.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Control Flow  ▸  else-if
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$control-flow$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$else-if$ti$, $sl$else-if$sl$, $sd$else-if allows you to check multiple conditions one after another, in order, until one of them turns out to be true. It's used when there are more than two possible outcomes.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$control-flow/else-if$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is else-if?

`else-if` allows you to check multiple conditions one after another, in order, until one of them turns out to be true. It's used when there are more than two possible outcomes.

## 2. Why is it used?

Real-world decisions often have more than two possibilities — like grading a student as A, B, C, or D based on different mark ranges. `else-if` lets you handle all these ranges in one clean structure.

## 3. Real-Life Example

Think of a grading rule: "If marks are 90 or above, grade is A. Else if marks are 75 or above, grade is B. Else if marks are 60 or above, grade is C. Otherwise, grade is D." Each condition is checked only if the earlier ones failed.

## 4. Syntax

```java
if (condition1) {
    // runs if condition1 is true
} else if (condition2) {
    // runs if condition1 is false and condition2 is true
} else {
    // runs if none of the above are true
}
```

## 5. Example Program

```java
public class ElseIfDemo {
    public static void main(String[] args) {
        int marks = 78;
        if (marks >= 90) {
            System.out.println("Grade A");
        } else if (marks >= 75) {
            System.out.println("Grade B");
        } else if (marks >= 60) {
            System.out.println("Grade C");
        } else {
            System.out.println("Grade D");
        }
    }
}
```

**Output:**
```
Grade B
```

## 6. Key Points to Remember

- Conditions are checked top to bottom, and only the first true condition's block runs.
- Once a matching condition is found, the remaining `else if` checks are skipped entirely.
- The final `else` (if present) acts as a catch-all for anything not matched above.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Control Flow  ▸  Nested if
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$control-flow$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Nested if$ti$, $sl$nested-if$sl$, $sd$A nested if is an if statement placed inside another if (or else) block. It's used when a decision only makes sense after another condition has already been satisfied.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$control-flow/nested-if$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Nested if?

A nested `if` is an `if` statement placed inside another `if` (or `else`) block. It's used when a decision only makes sense after another condition has already been satisfied.

## 2. Why is it used?

Some decisions genuinely depend on multiple layers of conditions — like first checking if a user is logged in, and only then checking if they have admin access. Nested `if` handles this layered logic.

## 3. Real-Life Example

Think of entry rules at a club: "If you are 18 or older, then check if you have a valid ID. If both are true, you're allowed in." The ID check only matters once the age condition is already satisfied.

## 4. Syntax

```java
if (condition1) {
    if (condition2) {
        // runs only if both condition1 and condition2 are true
    }
}
```

## 5. Example Program

```java
public class NestedIfDemo {
    public static void main(String[] args) {
        int age = 20;
        boolean hasID = true;

        if (age >= 18) {
            if (hasID) {
                System.out.println("Entry allowed");
            } else {
                System.out.println("ID required");
            }
        } else {
            System.out.println("Not old enough");
        }
    }
}
```

**Output:**
```
Entry allowed
```

## 6. Key Points to Remember

- Nested `if` is useful when a condition is only relevant after another condition passes.
- Too many nested levels make code hard to read — consider combining conditions with `&&` instead when possible.
- Proper indentation is important to keep nested blocks readable.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Control Flow  ▸  switch
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$control-flow$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$switch$ti$, $sl$switch$sl$, $sd$A switch statement checks a single value against multiple possible matching cases and runs the code block for whichever case matches. It's a cleaner alternative to writing many else if checks for a single variable.$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$control-flow/switch$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a switch Statement?

A `switch` statement checks a single value against multiple possible matching cases and runs the code block for whichever case matches. It's a cleaner alternative to writing many `else if` checks for a single variable.

## 2. Why is it used?

When a program needs to compare one variable against many fixed possibilities — like a day number, a menu choice, or a grade letter — `switch` makes the code more organized and often easier to read than a long `else-if` chain.

## 3. Real-Life Example

Think of a TV remote's channel selector. Based on the exact channel number pressed, the TV switches to that specific channel. Each channel number is like a `case`, matched exactly against your input.

## 4. Syntax

```java
switch (variable) {
    case value1:
        // code
        break;
    case value2:
        // code
        break;
    default:
        // code if nothing matches
}
```

## 5. Example Program

```java
public class SwitchDemo {
    public static void main(String[] args) {
        int day = 3;
        switch (day) {
            case 1:
                System.out.println("Monday");
                break;
            case 2:
                System.out.println("Tuesday");
                break;
            case 3:
                System.out.println("Wednesday");
                break;
            default:
                System.out.println("Invalid day");
        }
    }
}
```

**Output:**
```
Wednesday
```

## 6. Key Points to Remember

- Forgetting `break` causes "fall-through," where execution continues into the next case unintentionally.
- `default` is optional but is good practice for handling unexpected values.
- Modern Java also supports a newer arrow-style switch expression, which avoids the fall-through problem entirely.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Control Flow  ▸  for Loop
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$control-flow$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$for Loop$ti$, $sl$for-loop$sl$, $sd$A for loop repeats a block of code a specific number of times. It combines initialization, a condition, and an update step, all in one compact line.$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$control-flow/for-loop$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a for Loop?

A `for` loop repeats a block of code a specific number of times. It combines initialization, a condition, and an update step, all in one compact line.

## 2. Why is it used?

Many tasks need repetition with a known count — like printing numbers from 1 to 10, or going through every item in a list. The `for` loop handles this kind of repetition cleanly.

## 3. Real-Life Example

Think of a teacher calling out roll numbers from 1 to 40 one by one during attendance. There's a clear starting point, an ending point, and a fixed step (increase by 1 each time) — exactly how a `for` loop works.

## 4. Syntax

```java
for (initialization; condition; update) {
    // code to repeat
}
```

## 5. Example Program

```java
public class ForLoopDemo {
    public static void main(String[] args) {
        for (int i = 1; i <= 5; i++) {
            System.out.println("Count: " + i);
        }
    }
}
```

**Output:**
```
Count: 1
Count: 2
Count: 3
Count: 4
Count: 5
```

## 6. Key Points to Remember

- The three parts (initialization, condition, update) are all optional individually, but the two semicolons are always required.
- The loop keeps running as long as the condition remains true.
- A missing or wrong update step can cause an infinite loop.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Control Flow  ▸  while Loop
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$control-flow$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$while Loop$ti$, $sl$while-loop$sl$, $sd$A while loop repeats a block of code as long as a given condition remains true. Unlike a for loop, it doesn't require a fixed count — it simply keeps checking the condition before every repetition.$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$control-flow/while-loop$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a while Loop?

A `while` loop repeats a block of code as long as a given condition remains true. Unlike a `for` loop, it doesn't require a fixed count — it simply keeps checking the condition before every repetition.

## 2. Why is it used?

Some tasks need to repeat until something happens, but you don't know in advance exactly how many times — like asking a user to keep entering numbers until they type "0". A `while` loop suits this kind of open-ended repetition.

## 3. Real-Life Example

Think of filling a bucket with water: "While the bucket is not full, keep pouring water." You don't count exact pours in advance — you just keep going until the condition (bucket full) becomes false.

## 4. Syntax

```java
while (condition) {
    // code repeats as long as condition is true
}
```

## 5. Example Program

```java
public class WhileLoopDemo {
    public static void main(String[] args) {
        int count = 1;
        while (count <= 5) {
            System.out.println("Count: " + count);
            count++;
        }
    }
}
```

**Output:**
```
Count: 1
Count: 2
Count: 3
Count: 4
Count: 5
```

## 6. Key Points to Remember

- The condition is checked before the loop body runs even once — if it's false at the start, the body never runs.
- You must update the variable inside the loop yourself, or the loop may run forever.
- `while` is ideal when the number of repetitions isn't known beforehand.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Control Flow  ▸  do-while Loop
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$control-flow$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$do-while Loop$ti$, $sl$do-while-loop$sl$, $sd$A do-while loop is similar to a while loop, but it checks the condition after running the block once. This guarantees the code inside runs at least one time, no matter what.$sd$, 8,
    'published', true, true, 'java_tutorial', $sr$control-flow/do-while-loop$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a do-while Loop?

A `do-while` loop is similar to a `while` loop, but it checks the condition after running the block once. This guarantees the code inside runs at least one time, no matter what.

## 2. Why is it used?

Some tasks must happen at least once before any check makes sense — like showing a menu to a user before asking if they want to continue. `do-while` guarantees this "at least once" behaviour.

## 3. Real-Life Example

Think of a food tasting session: "Taste the dish once, then decide if you want to taste it again." You always taste it at least once before deciding whether to repeat — that's exactly how `do-while` behaves.

## 4. Syntax

```java
do {
    // code runs at least once
} while (condition);
```

## 5. Example Program

```java
public class DoWhileDemo {
    public static void main(String[] args) {
        int count = 1;
        do {
            System.out.println("Count: " + count);
            count++;
        } while (count <= 3);
    }
}
```

**Output:**
```
Count: 1
Count: 2
Count: 3
```

## 6. Key Points to Remember

- The code block always runs at least once, even if the condition is false from the start.
- Note the semicolon after `while (condition);` — a common beginner mistake is forgetting it.
- Use `do-while` specifically when "run at least once" behaviour is required.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Control Flow  ▸  Nested Loops
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$control-flow$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Nested Loops$ti$, $sl$nested-loops$sl$, $sd$A nested loop is a loop placed inside another loop. The inner loop completes all its repetitions for every single repetition of the outer loop.$sd$, 9,
    'published', true, true, 'java_tutorial', $sr$control-flow/nested-loops$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Nested Loops?

A nested loop is a loop placed inside another loop. The inner loop completes all its repetitions for every single repetition of the outer loop.

## 2. Why is it used?

Some problems naturally involve two levels of repetition — like printing a grid of rows and columns, or comparing every student with every other student. Nested loops handle this two-level repetition.

## 3. Real-Life Example

Think of a teacher checking attendance for every student in every classroom of a school. For each classroom (outer loop), the teacher goes through every single student (inner loop) before moving to the next classroom.

## 4. Syntax

```java
for (int i = 0; i < outerLimit; i++) {
    for (int j = 0; j < innerLimit; j++) {
        // inner loop code
    }
}
```

## 5. Example Program

```java
public class NestedLoopDemo {
    public static void main(String[] args) {
        for (int i = 1; i <= 3; i++) {
            for (int j = 1; j <= 2; j++) {
                System.out.println("i=" + i + ", j=" + j);
            }
        }
    }
}
```

**Output:**
```
i=1, j=1
i=1, j=2
i=2, j=1
i=2, j=2
i=3, j=1
i=3, j=2
```

## 6. Key Points to Remember

- The inner loop finishes completely before the outer loop moves to its next step.
- Nested loops are commonly used for pattern printing and working with 2D arrays.
- Be careful with nested loops on large data — they can slow a program down significantly since work multiplies.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Control Flow  ▸  break
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$control-flow$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$break$ti$, $sl$break$sl$, $sd$The break statement immediately stops the loop or switch block it's inside, and control jumps to the code right after that loop or switch.$sd$, 10,
    'published', true, true, 'java_tutorial', $sr$control-flow/break$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the break Statement?

The `break` statement immediately stops the loop or switch block it's inside, and control jumps to the code right after that loop or switch.

## 2. Why is it used?

Sometimes there's no reason to keep looping once a certain condition is met — like stopping a search the moment the desired item is found, instead of wastefully checking the rest.

## 3. Real-Life Example

Think of searching for a specific book on a shelf. The moment you find it, you stop searching further, even if there are more books left to check. `break` does exactly this inside a loop.

## 4. Syntax

```java
for (...) {
    if (condition) {
        break; // exits the loop immediately
    }
}
```

## 5. Example Program

```java
public class BreakDemo {
    public static void main(String[] args) {
        for (int i = 1; i <= 10; i++) {
            if (i == 5) {
                break;
            }
            System.out.println(i);
        }
    }
}
```

**Output:**
```
1
2
3
4
```

## 6. Key Points to Remember

- `break` exits only the loop (or switch) it is directly inside, not any outer loops.
- Using `break` can improve performance by avoiding unnecessary further iterations.
- In nested loops, a labeled `break` can be used to exit an outer loop directly, if needed.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Control Flow  ▸  continue
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$control-flow$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$continue$ti$, $sl$continue$sl$, $sd$The continue statement skips the rest of the current loop iteration and jumps straight to the next one, without exiting the loop entirely.$sd$, 11,
    'published', true, true, 'java_tutorial', $sr$control-flow/continue$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the continue Statement?

The `continue` statement skips the rest of the current loop iteration and jumps straight to the next one, without exiting the loop entirely.

## 2. Why is it used?

Sometimes you want to skip just one specific case while still continuing the loop for everything else — like skipping negative numbers while still processing the rest of a list.

## 3. Real-Life Example

Think of a teacher calling out roll numbers for a fitness test, but skipping students who are absent that day — the teacher doesn't stop the whole test, they just move on to the next name.

## 4. Syntax

```java
for (...) {
    if (condition) {
        continue; // skips to next iteration
    }
    // remaining code in the loop
}
```

## 5. Example Program

```java
public class ContinueDemo {
    public static void main(String[] args) {
        for (int i = 1; i <= 5; i++) {
            if (i == 3) {
                continue;
            }
            System.out.println(i);
        }
    }
}
```

**Output:**
```
1
2
4
5
```

## 6. Key Points to Remember

- `continue` skips only the current iteration; the loop itself keeps running.
- It's different from `break`, which stops the loop entirely.
- Overusing `continue` in complex loops can sometimes make code harder to follow — use it thoughtfully.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Control Flow  ▸  return
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$control-flow$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$return$ti$, $sl$return$sl$, $sd$The return statement immediately exits a method and, if the method has a return type, sends a value back to wherever that method was called from.$sd$, 12,
    'published', true, true, 'java_tutorial', $sr$control-flow/return$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the return Statement?

The `return` statement immediately exits a method and, if the method has a return type, sends a value back to wherever that method was called from.

## 2. Why is it used?

Methods often need to send a result back to the calling code — like a method that calculates and returns a total price. `return` is how that result is handed back.

## 3. Real-Life Example

Think of ordering food at a counter — you place your request, and the counter staff hands back your finished order. The `return` statement is like handing back that finished result to whoever asked for it.

## 4. Syntax

```java
returnType methodName() {
    return value; // sends value back and exits the method
}
```

## 5. Example Program

```java
public class ReturnDemo {
    static int square(int number) {
        return number * number;
    }

    public static void main(String[] args) {
        int result = square(5);
        System.out.println("Square: " + result);
    }
}
```

**Output:**
```
Square: 25
```

## 6. Key Points to Remember

- A method with a `void` return type can still use `return;` alone, just to exit early, without sending back any value.
- Once `return` executes, no further code in that method runs.
- The type of value returned must match the method's declared return type.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Arrays & Strings  ▸  Arrays
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$arrays-and-strings$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Arrays$ti$, $sl$arrays$sl$, $sd$An array is a single container that can hold multiple values of the same data type, all stored together under one variable name. Each value inside the array is accessed using a position number called an index.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$arrays-and-strings/arrays$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is an Array?

An array is a single container that can hold multiple values of the same data type, all stored together under one variable name. Each value inside the array is accessed using a position number called an index.

## 2. Why is it used?

Without arrays, storing many related values (like 50 students' marks) would mean creating 50 separate variables — completely impractical. An array lets you manage all of them together, using one name and simple index numbers.

## 3. Real-Life Example

Think of an egg tray with 12 slots. Instead of keeping 12 separate boxes for 12 eggs, the tray holds all of them together, and each egg has a fixed position in the tray. An array works the same way for data.

## 4. Syntax

```java
dataType[] arrayName = new dataType[size];
```

## 5. Example Program

```java
public class ArrayDemo {
    public static void main(String[] args) {
        int[] marks = new int[3];
        marks[0] = 80;
        marks[1] = 90;
        marks[2] = 70;

        System.out.println("First mark: " + marks[0]);
    }
}
```

**Output:**
```
First mark: 80
```

## 6. Key Points to Remember

- Array indexing starts from 0, not 1 — the first element is at index 0.
- Once created, an array's size cannot be changed.
- All elements in an array must be of the same data type.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Arrays & Strings  ▸  One-Dimensional Array
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$arrays-and-strings$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$One-Dimensional Array$ti$, $sl$one-dimensional-array$sl$, $sd$A one-dimensional array is the simplest form of array — a single, straight line of values, all stored under one variable name and accessed with a single index.$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$arrays-and-strings/one-dimensional-array$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a One-Dimensional Array?

A one-dimensional array is the simplest form of array — a single, straight line of values, all stored under one variable name and accessed with a single index.

## 2. Why is it used?

It's useful whenever you need to store a simple list of related values, like a list of temperatures recorded over a week, or the ages of students in a class.

## 3. Real-Life Example

Think of a single row of lockers in a school corridor, numbered from 1 onward. Each locker holds one item, and you access an item by simply knowing its locker number — that's a one-dimensional array.

## 4. Syntax

```java
int[] numbers = {10, 20, 30, 40};
```

## 5. Example Program

```java
public class OneDArrayDemo {
    public static void main(String[] args) {
        int[] numbers = {10, 20, 30, 40};

        for (int i = 0; i < numbers.length; i++) {
            System.out.println("Element at index " + i + ": " + numbers[i]);
        }
    }
}
```

**Output:**
```
Element at index 0: 10
Element at index 1: 20
Element at index 2: 30
Element at index 3: 40
```

## 6. Key Points to Remember

- `.length` gives the number of elements in the array (not `.length()`, which is used for `String`).
- A one-dimensional array is ideal for simple lists that don't need rows and columns.
- You can declare and initialize values together using curly braces `{}`.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Arrays & Strings  ▸  Two-Dimensional Array
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$arrays-and-strings$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Two-Dimensional Array$ti$, $sl$two-dimensional-array$sl$, $sd$A two-dimensional array stores data in the form of rows and columns, like a table or grid. It's essentially an array of arrays.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$arrays-and-strings/two-dimensional-array$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Two-Dimensional Array?

A two-dimensional array stores data in the form of rows and columns, like a table or grid. It's essentially an array of arrays.

## 2. Why is it used?

Some data naturally fits a grid structure — like a seating chart in a classroom, or a matrix used in calculations. A two-dimensional array represents this row-and-column structure directly.

## 3. Real-Life Example

Think of a chessboard with 8 rows and 8 columns. Every square can be identified using its row number and column number together — exactly how elements in a two-dimensional array are accessed.

## 4. Syntax

```java
dataType[][] arrayName = new dataType[rows][columns];
```

## 5. Example Program

```java
public class TwoDArrayDemo {
    public static void main(String[] args) {
        int[][] grid = {
            {1, 2, 3},
            {4, 5, 6}
        };

        System.out.println("Element at row 1, column 2: " + grid[1][2]);
    }
}
```

**Output:**
```
Element at row 1, column 2: 6
```

## 6. Key Points to Remember

- Access an element using two indices: `array[row][column]`.
- The number of rows and columns don't have to be equal.
- Nested loops (row loop inside column loop, or vice versa) are the usual way to process every element of a 2D array.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Arrays & Strings  ▸  Multidimensional Arrays
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$arrays-and-strings$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Multidimensional Arrays$ti$, $sl$multidimensional-arrays$sl$, $sd$A multidimensional array extends the idea of rows and columns to even more dimensions — such as a 3D array, which can be thought of as multiple 2D grids stacked together.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$arrays-and-strings/multidimensional-arrays$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Multidimensional Arrays?

A multidimensional array extends the idea of rows and columns to even more dimensions — such as a 3D array, which can be thought of as multiple 2D grids stacked together.

## 2. Why is it used?

Some real problems naturally need more than two dimensions of organization — like storing data separately for multiple classrooms, where each classroom itself has rows and columns of student data.

## 3. Real-Life Example

Think of a school building with multiple floors, and each floor having multiple classrooms arranged in rows and columns. To find one classroom, you need three pieces of information: floor number, row, and column — that's a three-dimensional structure.

## 4. Syntax

```java
dataType[][][] arrayName = new dataType[x][y][z];
```

## 5. Example Program

```java
public class MultiDimArrayDemo {
    public static void main(String[] args) {
        int[][][] data = new int[2][2][2];
        data[0][1][1] = 99;

        System.out.println("Value: " + data[0][1][1]);
    }
}
```

**Output:**
```
Value: 99
```

## 6. Key Points to Remember

- Multidimensional arrays beyond 2D are used rarely in everyday applications, but do appear in scientific or graphics-related programming.
- Each additional dimension adds another index needed to access an element.
- Memory usage grows quickly with each added dimension, so these should be used only when genuinely necessary.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Arrays & Strings  ▸  String
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$arrays-and-strings$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$String$ti$, $sl$string$sl$, $sd$A String in Java represents a sequence of characters, like a word or sentence. Unlike primitive types, String is a class, and once created, a String object's content cannot be changed (it is "immutable").$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$arrays-and-strings/string$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a String?

A `String` in Java represents a sequence of characters, like a word or sentence. Unlike primitive types, `String` is a class, and once created, a `String` object's content cannot be changed (it is "immutable").

## 2. Why is it used?

Almost every program deals with text in some way — names, messages, addresses. `String` is the standard way Java represents and works with this kind of text data.

## 3. Real-Life Example

Think of a printed name tag. Once printed, you can't directly edit the letters on it — you'd need to print an entirely new tag to show a different name. A Java `String` behaves the same way; any "change" actually creates a brand-new `String`.

## 4. Syntax

```java
String text = "Hello, Java!";
```

## 5. Example Program

```java
public class StringDemo {
    public static void main(String[] args) {
        String name = "Java Learner";
        System.out.println("Welcome, " + name);
    }
}
```

**Output:**
```
Welcome, Java Learner
```

## 6. Key Points to Remember

- Strings in Java are immutable — every "modification" actually creates a new `String` object.
- `String` can be created using double quotes directly, or with the `new String()` constructor.
- `String` comparison should use `.equals()`, not `==`, to compare actual content correctly.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Arrays & Strings  ▸  String Methods
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$arrays-and-strings$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$String Methods$ti$, $sl$string-methods$sl$, $sd$String methods are built-in functions that let you work with String values — like finding their length, changing their case, extracting a portion, or checking if they contain certain text.$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$arrays-and-strings/string-methods$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are String Methods?

String methods are built-in functions that let you work with `String` values — like finding their length, changing their case, extracting a portion, or checking if they contain certain text.

## 2. Why is it used?

Text processing is extremely common — validating a username's length, converting text to uppercase for display, or checking if a search term appears in a sentence. String methods make all of this possible without writing that logic yourself.

## 3. Real-Life Example

Think of a word processor's "Find" and "Replace" tools, or the button that converts selected text to all capitals. String methods give a Java program that same kind of built-in text-handling power.

## 4. Syntax

```java
str.length();
str.toUpperCase();
str.toLowerCase();
str.substring(start, end);
str.charAt(index);
str.contains("text");
```

## 5. Example Program

```java
public class StringMethodDemo {
    public static void main(String[] args) {
        String text = "Hello Java";
        System.out.println("Length: " + text.length());
        System.out.println("Uppercase: " + text.toUpperCase());
        System.out.println("Substring: " + text.substring(0, 5));
    }
}
```

**Output:**
```
Length: 10
Uppercase: HELLO JAVA
Substring: Hello
```

## 6. Key Points to Remember

- None of these methods change the original `String` — they always return a new one, since strings are immutable.
- `substring(start, end)` includes the start index but excludes the end index.
- These methods are used constantly in real applications, so getting comfortable with them early is worthwhile.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Arrays & Strings  ▸  String Pool
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$arrays-and-strings$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$String Pool$ti$, $sl$string-pool$sl$, $sd$The String Pool is a special memory area where Java stores String literals (strings written directly with double quotes). If the same text is used again elsewhere in the program, Java reuses the existing object from the pool instead of crea…$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$arrays-and-strings/string-pool$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the String Pool?

The String Pool is a special memory area where Java stores `String` literals (strings written directly with double quotes). If the same text is used again elsewhere in the program, Java reuses the existing object from the pool instead of creating a new one.

## 2. Why is it used?

This saves memory, since many programs repeat the same text values often. Instead of creating a new object every single time the same text appears, Java is smart enough to reuse what's already stored.

## 3. Real-Life Example

Think of a library with only one copy of a popular book. Instead of printing a fresh copy for every reader, the library lends out the same copy repeatedly. The String Pool works similarly — the same text value is "lent out" wherever it's needed instead of duplicated.

## 4. Syntax

```java
String a = "Java";   // goes into the String Pool
String b = "Java";   // reuses the same pooled object as 'a'
String c = new String("Java"); // creates a separate object, NOT in the pool
```

## 5. Example Program

```java
public class StringPoolDemo {
    public static void main(String[] args) {
        String a = "Java";
        String b = "Java";
        String c = new String("Java");

        System.out.println(a == b);   // true - same pooled object
        System.out.println(a == c);   // false - different object in heap
    }
}
```

**Output:**
```
true
false
```

## 6. Key Points to Remember

- `String` literals go into the pool automatically; `new String()` always creates a separate object outside the pool.
- Use `.equals()` to compare string content, and reserve `==` only for checking if two references point to the exact same object.
- This String Pool behaviour is a very frequently asked Java interview question.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Arrays & Strings  ▸  StringBuilder
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$arrays-and-strings$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$StringBuilder$ti$, $sl$stringbuilder$sl$, $sd$StringBuilder is a class used to create and modify text efficiently. Unlike String, a StringBuilder object is mutable, meaning its content can be changed directly without creating a brand-new object each time.$sd$, 8,
    'published', true, true, 'java_tutorial', $sr$arrays-and-strings/stringbuilder$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is StringBuilder?

`StringBuilder` is a class used to create and modify text efficiently. Unlike `String`, a `StringBuilder` object is mutable, meaning its content can be changed directly without creating a brand-new object each time.

## 2. Why is it used?

When a program needs to build or modify text repeatedly — like constructing a long report line by line — using regular `String` would create many unnecessary objects, wasting memory. `StringBuilder` avoids this by modifying the same object directly.

## 3. Real-Life Example

Think of writing on a whiteboard versus writing on a fresh sheet of paper every single time you want to change a word. `StringBuilder` is like the whiteboard — you can erase and rewrite parts without needing a whole new sheet.

## 4. Syntax

```java
StringBuilder sb = new StringBuilder();
sb.append("text");
sb.insert(position, "text");
sb.reverse();
```

## 5. Example Program

```java
public class StringBuilderDemo {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("Hello");
        sb.append(" Java");
        System.out.println(sb);
    }
}
```

**Output:**
```
Hello Java
```

## 6. Key Points to Remember

- `StringBuilder` is mutable — changes happen on the same object, without creating new ones each time.
- `StringBuilder` is not thread-safe, meaning it's not designed for safe use by multiple threads at once.
- It's the preferred choice over `String` when building or editing text repeatedly inside loops.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Arrays & Strings  ▸  StringBuffer
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$arrays-and-strings$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$StringBuffer$ti$, $sl$stringbuffer$sl$, $sd$StringBuffer works almost identically to StringBuilder — it's mutable and used for building or modifying text. The key difference is that StringBuffer is thread-safe, meaning it's designed to be used safely when multiple threads access it a…$sd$, 9,
    'published', true, true, 'java_tutorial', $sr$arrays-and-strings/stringbuffer$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is StringBuffer?

`StringBuffer` works almost identically to `StringBuilder` — it's mutable and used for building or modifying text. The key difference is that `StringBuffer` is thread-safe, meaning it's designed to be used safely when multiple threads access it at the same time.

## 2. Why is it used?

In programs where multiple parts of the code (running as separate threads) might modify the same text data at the same time, `StringBuffer` protects against data corruption, unlike `StringBuilder`.

## 3. Real-Life Example

Think of a shared notice board in an office, where a security guard makes sure only one person edits it at a time so nothing gets messed up. `StringBuffer` behaves like this careful, one-at-a-time editing process.

## 4. Syntax

```java
StringBuffer sb = new StringBuffer();
sb.append("text");
sb.insert(position, "text");
sb.reverse();
```

## 5. Example Program

```java
public class StringBufferDemo {
    public static void main(String[] args) {
        StringBuffer sb = new StringBuffer("Hello");
        sb.append(" World");
        System.out.println(sb);
    }
}
```

**Output:**
```
Hello World
```

## 6. Key Points to Remember

- `StringBuffer` methods are synchronized (thread-safe); `StringBuilder` methods are not.
- Because of this safety check, `StringBuffer` is slightly slower than `StringBuilder` in single-threaded programs.
- Use `StringBuilder` for regular, single-threaded work, and `StringBuffer` only when multiple threads need safe access — this distinction is a common interview question.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Class
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Class$ti$, $sl$class$sl$, $sd$A class is a blueprint that defines the properties (variables) and behaviours (methods) that its objects will have. It doesn't hold real data by itself — it just describes the structure that objects created from it will follow.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/class$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Class?

A class is a blueprint that defines the properties (variables) and behaviours (methods) that its objects will have. It doesn't hold real data by itself — it just describes the structure that objects created from it will follow.

## 2. Why is it used?

Classes let you model real-world things in code in an organized way. Instead of scattering related data and actions randomly, a class groups everything about one type of "thing" (like a Student or a Car) together in one place.

## 3. Real-Life Example

Think of a blueprint for a house. The blueprint itself is not a house you can live in — it just describes how each house built from it should look, with rooms, doors, and windows in specific places. A class is exactly this kind of blueprint for objects.

## 4. Syntax

```java
class ClassName {
    // fields (variables)
    // methods
}
```

## 5. Example Program

```java
class Student {
    String name;
    int rollNumber;
}

public class ClassDemo {
    public static void main(String[] args) {
        Student s = new Student();
        s.name = "Aditi";
        s.rollNumber = 12;
        System.out.println(s.name + " - " + s.rollNumber);
    }
}
```

**Output:**
```
Aditi - 12
```

## 6. Key Points to Remember

- A class by itself takes no memory for data — memory is used only when an object is created from it.
- A class can contain fields, methods, constructors, and more.
- One Java file can have multiple classes, but only one can be `public`.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Object
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Object$ti$, $sl$object$sl$, $sd$An object is a real, usable instance created from a class. While a class is just a design, an object is the actual "thing" built using that design, with its own actual values stored in memory.$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/object$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is an Object?

An object is a real, usable instance created from a class. While a class is just a design, an object is the actual "thing" built using that design, with its own actual values stored in memory.

## 2. Why is it used?

Objects let a program actually work with real data based on a class's structure — like creating an actual Student object with a real name and roll number, rather than just describing what a Student should look like.

## 3. Real-Life Example

If a class is a blueprint for a house, an object is an actual house built from that blueprint, standing on real land, with a real address, and people actually living in it.

## 4. Syntax

```java
ClassName objectName = new ClassName();
```

## 5. Example Program

```java
class Car {
    String model;
}

public class ObjectDemo {
    public static void main(String[] args) {
        Car car1 = new Car();
        car1.model = "Sedan";
        System.out.println("Car model: " + car1.model);
    }
}
```

**Output:**
```
Car model: Sedan
```

## 6. Key Points to Remember

- The `new` keyword is used to create an object in Java.
- Multiple objects can be created from the same class, each holding its own separate data.
- Objects are stored in a memory area called the Heap.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Methods
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Methods$ti$, $sl$methods$sl$, $sd$A method is a named block of code inside a class that performs a specific task. Methods let you group a set of instructions together so they can be reused by simply calling the method's name.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/methods$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Method?

A method is a named block of code inside a class that performs a specific task. Methods let you group a set of instructions together so they can be reused by simply calling the method's name.

## 2. Why is it used?

Without methods, you would have to rewrite the same logic every time you need it. Methods let you write logic once — like calculating an average — and reuse it as many times as needed, just by calling it.

## 3. Real-Life Example

Think of a coffee machine with a single "Make Coffee" button. Pressing that one button triggers a whole series of internal steps (grinding, brewing, pouring), without you needing to perform each step manually every time.

## 4. Syntax

```java
returnType methodName(parameters) {
    // method body
}
```

## 5. Example Program

```java
public class MethodDemo {
    static int addNumbers(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        int result = addNumbers(10, 20);
        System.out.println("Sum: " + result);
    }
}
```

**Output:**
```
Sum: 30
```

## 6. Key Points to Remember

- A method's return type must match the type of value it actually returns (or be `void` if it returns nothing).
- Method names should clearly describe what the method does.
- Parameters let a method receive different input values each time it's called.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Constructors
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Constructors$ti$, $sl$constructors$sl$, $sd$A constructor is a special block of code, similar to a method, that runs automatically when an object is created. It's typically used to set up initial values for an object's fields.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/constructors$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Constructor?

A constructor is a special block of code, similar to a method, that runs automatically when an object is created. It's typically used to set up initial values for an object's fields.

## 2. Why is it used?

Without a constructor, you'd need to manually set every field's value right after creating each object. A constructor lets you set these initial values automatically, right at the moment of creation.

## 3. Real-Life Example

Think of filling out basic details (name, date) the moment you open a new notebook for the first time, before writing anything else in it. A constructor performs this same kind of initial setup automatically, the moment an object is created.

## 4. Syntax

```java
class ClassName {
    ClassName() {
        // constructor code, runs when object is created
    }
}
```

## 5. Example Program

```java
class Student {
    String name;

    Student(String studentName) {
        name = studentName;
    }
}

public class ConstructorDemo {
    public static void main(String[] args) {
        Student s = new Student("Rohan");
        System.out.println("Student name: " + s.name);
    }
}
```

**Output:**
```
Student name: Rohan
```

## 6. Key Points to Remember

- A constructor has the same name as the class and no return type, not even `void`.
- If you don't write any constructor, Java automatically provides an empty default constructor.
- A class can have multiple constructors with different parameters — this is called constructor overloading.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  this Keyword
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$this Keyword$ti$, $sl$this-keyword$sl$, $sd$this refers to the current object — the specific object whose method or constructor is currently running. It's often used to distinguish between a class field and a parameter that share the same name.$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/this-keyword$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the this Keyword?

`this` refers to the current object — the specific object whose method or constructor is currently running. It's often used to distinguish between a class field and a parameter that share the same name.

## 2. Why is it used?

When a constructor or method parameter has the same name as a class field, Java needs a way to tell them apart. `this` clearly points to the object's own field, avoiding confusion with the parameter.

## 3. Real-Life Example

Think of a person saying "my house" to refer specifically to their own house, even when several houses are being discussed. `this` works the same way — pointing specifically to the current object's own data.

## 4. Syntax

```java
this.fieldName = parameterName;
```

## 5. Example Program

```java
class Student {
    String name;

    Student(String name) {
        this.name = name; // this.name = field, name = parameter
    }
}

public class ThisDemo {
    public static void main(String[] args) {
        Student s = new Student("Sneha");
        System.out.println("Name: " + s.name);
    }
}
```

**Output:**
```
Name: Sneha
```

## 6. Key Points to Remember

- `this` always refers to the current object, never to a class in general.
- It's most commonly used to resolve naming conflicts between fields and parameters.
- `this()` (with parentheses) can also be used to call one constructor from another within the same class.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  static Keyword
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$static Keyword$ti$, $sl$static-keyword$sl$, $sd$static marks a field or method as belonging to the class itself, rather than to any one specific object. This means a static member is shared across all objects of that class.$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/static-keyword$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the static Keyword?

`static` marks a field or method as belonging to the class itself, rather than to any one specific object. This means a `static` member is shared across all objects of that class.

## 2. Why is it used?

Some data or behaviour naturally belongs to the whole class rather than to individual objects — like a counter that tracks how many objects have been created in total. `static` is used for exactly this kind of shared data.

## 3. Real-Life Example

Think of a school's name, which is the same for every student in that school, versus each student's own individual roll number, which is different for each one. The school name is like a `static` field — shared by all.

## 4. Syntax

```java
static dataType fieldName;
static returnType methodName() { }
```

## 5. Example Program

```java
class Counter {
    static int count = 0;

    Counter() {
        count++;
    }
}

public class StaticDemo {
    public static void main(String[] args) {
        new Counter();
        new Counter();
        new Counter();
        System.out.println("Total objects created: " + Counter.count);
    }
}
```

**Output:**
```
Total objects created: 3
```

## 6. Key Points to Remember

- Static members belong to the class and are shared by all objects, not duplicated for each one.
- Static methods can be called directly using the class name, without creating an object.
- A static method cannot directly access non-static (instance) fields or methods, since those belong to specific objects.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Encapsulation
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Encapsulation$ti$, $sl$encapsulation$sl$, $sd$Encapsulation means bundling an object's data (fields) together with the methods that operate on that data, while restricting direct outside access to the data itself.$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/encapsulation$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Encapsulation?

Encapsulation means bundling an object's data (fields) together with the methods that operate on that data, while restricting direct outside access to the data itself. In Java, this is usually done by making fields `private` and providing public `getter` and `setter` methods to access them.

## 2. Why is it used?

Encapsulation protects an object's data from being changed incorrectly from outside the class. For example, a setter method can include validation logic (like rejecting a negative age), something direct field access wouldn't allow.

## 3. Real-Life Example

Think of a medicine capsule, which safely wraps the actual medicine inside a protective shell. You interact with the capsule as a whole, not by directly touching the raw medicine inside — encapsulation protects an object's internal data the same way.

## 4. Syntax

```java
class ClassName {
    private dataType fieldName;

    public dataType getFieldName() {
        return fieldName;
    }

    public void setFieldName(dataType value) {
        fieldName = value;
    }
}
```

## 5. Example Program

```java
class Account {
    private double balance;

    public double getBalance() {
        return balance;
    }

    public void setBalance(double amount) {
        if (amount >= 0) {
            balance = amount;
        }
    }
}

public class EncapsulationDemo {
    public static void main(String[] args) {
        Account acc = new Account();
        acc.setBalance(5000);
        System.out.println("Balance: " + acc.getBalance());
    }
}
```

**Output:**
```
Balance: 5000.0
```

## 6. Key Points to Remember

- Fields are usually kept `private`; access is provided only through public getters and setters.
- Encapsulation allows adding validation logic inside setters, protecting data integrity.
- It's one of the four main pillars of Object-Oriented Programming, along with Inheritance, Polymorphism, and Abstraction.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Inheritance
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Inheritance$ti$, $sl$inheritance$sl$, $sd$Inheritance allows one class (called the child or subclass) to acquire the fields and methods of another class (called the parent or superclass). This lets the child class reuse and extend existing functionality instead of rewriting it.$sd$, 8,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/inheritance$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Inheritance?

Inheritance allows one class (called the child or subclass) to acquire the fields and methods of another class (called the parent or superclass). This lets the child class reuse and extend existing functionality instead of rewriting it.

## 2. Why is it used?

It avoids duplicate code when multiple classes share common features. For example, both a `Car` and a `Bike` might share common `Vehicle` features like speed and fuel, which can be written once in a `Vehicle` class and reused by both.

## 3. Real-Life Example

Think of how children naturally inherit certain traits from their parents, like eye colour or height range, while also having their own unique traits. A subclass inherits features from its parent class in a similar way, while also adding its own.

## 4. Syntax

```java
class Parent {
    // fields and methods
}

class Child extends Parent {
    // additional fields and methods
}
```

## 5. Example Program

```java
class Vehicle {
    int speed = 60;
}

class Car extends Vehicle {
    String type = "Sedan";
}

public class InheritanceDemo {
    public static void main(String[] args) {
        Car car = new Car();
        System.out.println("Speed: " + car.speed + ", Type: " + car.type);
    }
}
```

**Output:**
```
Speed: 60, Type: Sedan
```

## 6. Key Points to Remember

- The `extends` keyword is used to inherit from a parent class.
- Java supports only single inheritance for classes — a class can extend only one other class directly.
- A subclass can add new fields/methods and can also override existing ones from the parent.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Types of Inheritance
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Types of Inheritance$ti$, $sl$types-of-inheritance$sl$, $sd$Inheritance can be organized in different patterns: single (one child, one parent), multilevel (a chain of inheritance across generations), and hierarchical (multiple children inheriting from one common parent).$sd$, 9,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/types-of-inheritance$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are the Types of Inheritance?

Inheritance can be organized in different patterns: single (one child, one parent), multilevel (a chain of inheritance across generations), and hierarchical (multiple children inheriting from one common parent). Java does not support multiple inheritance of classes directly (a class extending two classes at once).

## 2. Why is it used?

Understanding these patterns helps you design class relationships correctly, based on how features are genuinely shared between different real-world categories of objects.

## 3. Real-Life Example

Single inheritance is like a child inheriting from one parent. Multilevel is like traits passing from grandparent to parent to child. Hierarchical is like multiple siblings all inheriting common family traits from the same parent.

## 4. Syntax

```java
// Single
class B extends A { }

// Multilevel
class C extends B { }   // where B extends A

// Hierarchical
class D extends A { }
class E extends A { }
```

## 5. Example Program

```java
class Animal {
    void eat() { System.out.println("This animal eats food"); }
}

class Dog extends Animal { }      // hierarchical: sibling 1
class Cat extends Animal { }      // hierarchical: sibling 2

public class InheritanceTypesDemo {
    public static void main(String[] args) {
        Dog d = new Dog();
        Cat c = new Cat();
        d.eat();
        c.eat();
    }
}
```

**Output:**
```
This animal eats food
This animal eats food
```

## 7. Key Points to Remember

- Java avoids multiple inheritance of classes to prevent ambiguity (known as the "Diamond Problem").
- Multiple inheritance of behaviour is instead achieved in Java through interfaces (covered later).
- Hierarchical inheritance is common when several distinct classes share the same base features.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  super Keyword
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$super Keyword$ti$, $sl$super-keyword$sl$, $sd$super refers to the immediate parent class. It's used to access the parent class's fields, methods, or constructor from within a subclass.$sd$, 10,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/super-keyword$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the super Keyword?

`super` refers to the immediate parent class. It's used to access the parent class's fields, methods, or constructor from within a subclass.

## 2. Why is it used?

Sometimes a subclass needs to specifically call the parent's version of a method (especially if it has overridden that method), or needs to pass values up to the parent's constructor. `super` provides this direct link to the parent.

## 3. Real-Life Example

Think of a child referring to "my parent's rules" specifically, when their own rules might be slightly different. `super` lets code specifically point to the parent class's version of something, even inside a subclass.

## 4. Syntax

```java
super.fieldName;
super.methodName();
super(parameters); // calls parent constructor
```

## 5. Example Program

```java
class Animal {
    Animal() {
        System.out.println("Animal created");
    }
}

class Dog extends Animal {
    Dog() {
        super(); // calls Animal's constructor
        System.out.println("Dog created");
    }
}

public class SuperDemo {
    public static void main(String[] args) {
        new Dog();
    }
}
```

**Output:**
```
Animal created
Dog created
```

## 6. Key Points to Remember

- `super()` must be the first statement inside a constructor, if used.
- If you don't explicitly call `super()`, Java automatically calls the parent's no-argument constructor first.
- `super` is also useful to access an overridden method's original version from the parent class.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Polymorphism
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Polymorphism$ti$, $sl$polymorphism$sl$, $sd$Polymorphism means "many forms." In Java, it refers to the ability of the same method name or the same object reference to behave differently depending on the actual object or the arguments involved.$sd$, 11,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/polymorphism$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Polymorphism?

Polymorphism means "many forms." In Java, it refers to the ability of the same method name or the same object reference to behave differently depending on the actual object or the arguments involved.

## 2. Why is it used?

It allows one consistent interface (like a single method name) to work correctly across different types of objects, without needing separate, uniquely named methods for every single case.

## 3. Real-Life Example

Think of the word "draw" — drawing a circle, drawing a square, and drawing a triangle are all different actions, but they're all referred to using the same general word "draw." Polymorphism lets code use one common name while behaviour still adapts to the specific case.

## 4. Syntax

```java
ParentClass ref = new ChildClass(); // reference type vs actual object type
ref.someMethod(); // runs ChildClass's version, if overridden
```

## 5. Example Program

```java
class Shape {
    void draw() { System.out.println("Drawing a shape"); }
}

class Circle extends Shape {
    void draw() { System.out.println("Drawing a circle"); }
}

public class PolymorphismDemo {
    public static void main(String[] args) {
        Shape shape = new Circle();
        shape.draw(); // runs Circle's version
    }
}
```

**Output:**
```
Drawing a circle
```

## 6. Key Points to Remember

- Polymorphism appears in Java mainly in two forms: method overloading (compile-time) and method overriding (runtime).
- Runtime polymorphism happens through overriding, decided based on the actual object, not the reference type.
- It's a core Object-Oriented concept, frequently tested in interviews with practical code examples.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Method Overloading
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Method Overloading$ti$, $sl$method-overloading$sl$, $sd$Method overloading means defining multiple methods with the same name in the same class, but with different parameter lists (different number or types of parameters). Java decides which version to run based on the arguments you pass.$sd$, 12,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/method-overloading$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Method Overloading?

Method overloading means defining multiple methods with the same name in the same class, but with different parameter lists (different number or types of parameters). Java decides which version to run based on the arguments you pass.

## 2. Why is it used?

It lets you use one intuitive method name for similar operations that differ only in input type or count — like an `add` method that can work with two integers or three integers, without needing different method names for each case.

## 3. Real-Life Example

Think of a single word "cut" used for cutting paper, cutting vegetables, or cutting hair — same action name, but the specific tool and technique used depends on what's being cut. Method overloading works the same way, adapting based on what's passed in.

## 4. Syntax

```java
returnType methodName(paramType1 a) { }
returnType methodName(paramType1 a, paramType2 b) { }
```

## 5. Example Program

```java
class Calculator {
    int add(int a, int b) {
        return a + b;
    }

    int add(int a, int b, int c) {
        return a + b + c;
    }
}

public class OverloadingDemo {
    public static void main(String[] args) {
        Calculator calc = new Calculator();
        System.out.println(calc.add(2, 3));
        System.out.println(calc.add(2, 3, 4));
    }
}
```

**Output:**
```
5
9
```

## 6. Key Points to Remember

- Overloading is resolved at compile-time, based on the number and types of arguments.
- Changing only the return type (without changing parameters) is not enough to overload a method.
- Overloading is also called "compile-time polymorphism" or "static polymorphism."$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Method Overriding
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Method Overriding$ti$, $sl$method-overriding$sl$, $sd$Method overriding happens when a subclass provides its own specific implementation of a method that is already defined in its parent class, using the exact same method name and parameters.$sd$, 13,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/method-overriding$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Method Overriding?

Method overriding happens when a subclass provides its own specific implementation of a method that is already defined in its parent class, using the exact same method name and parameters.

## 2. Why is it used?

It lets a subclass customize or replace inherited behaviour to suit its own specific needs, while still keeping the same method name so it can be called consistently across related classes.

## 3. Real-Life Example

Think of a general "make sound" instruction for animals, where a dog barks and a cat meows. Each animal overrides the general idea of "making sound" with its own specific version, while the underlying instruction name stays the same.

## 4. Syntax

```java
class Parent {
    void methodName() { }
}

class Child extends Parent {
    @Override
    void methodName() { }
}
```

## 5. Example Program

```java
class Animal {
    void makeSound() {
        System.out.println("Some generic animal sound");
    }
}

class Dog extends Animal {
    @Override
    void makeSound() {
        System.out.println("Bark");
    }
}

public class OverridingDemo {
    public static void main(String[] args) {
        Animal a = new Dog();
        a.makeSound();
    }
}
```

**Output:**
```
Bark
```

## 6. Key Points to Remember

- Overriding is resolved at runtime, based on the actual object, not the reference type — this is called "runtime polymorphism."
- The overriding method must have the same name, same parameters, and a compatible return type as the parent's method.
- The `@Override` annotation isn't mandatory but is strongly recommended, since it helps catch mistakes at compile-time.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Abstraction
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Abstraction$ti$, $sl$abstraction$sl$, $sd$Abstraction means showing only the essential features of something while hiding the internal, complicated details. In Java, this is achieved using abstract classes and interfaces.$sd$, 14,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/abstraction$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Abstraction?

Abstraction means showing only the essential features of something while hiding the internal, complicated details. In Java, this is achieved using abstract classes and interfaces.

## 2. Why is it used?

It lets users of a class interact with it through a simple, clear set of actions, without needing to understand or worry about how those actions are actually implemented internally.

## 3. Real-Life Example

Think of driving a car using just the steering wheel, accelerator, and brake, without needing to understand the internal engine mechanics. Abstraction lets you use something effectively while hiding the complex internal working.

## 4. Syntax

```java
abstract class ClassName {
    abstract void methodName(); // no body, just a declaration
}
```

## 5. Example Program

```java
abstract class Payment {
    abstract void pay();
}

class CardPayment extends Payment {
    void pay() {
        System.out.println("Payment done using card");
    }
}

public class AbstractionDemo {
    public static void main(String[] args) {
        Payment p = new CardPayment();
        p.pay();
    }
}
```

**Output:**
```
Payment done using card
```

## 6. Key Points to Remember

- Abstraction focuses on "what" an object does, hiding "how" it does it.
- It's achieved in Java through abstract classes and interfaces.
- Abstraction and Encapsulation are related but different: abstraction hides implementation complexity, encapsulation hides and protects data.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Abstract Class
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Abstract Class$ti$, $sl$abstract-class$sl$, $sd$An abstract class is a class that cannot be used to create objects directly. It can contain both fully implemented methods and abstract methods (methods with no body), which any subclass extending it must implement.$sd$, 15,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/abstract-class$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is an Abstract Class?

An abstract class is a class that cannot be used to create objects directly. It can contain both fully implemented methods and abstract methods (methods with no body), which any subclass extending it must implement.

## 2. Why is it used?

It's useful when you want to define a common structure and some shared behaviour for related classes, while forcing each subclass to provide its own specific implementation for certain methods.

## 3. Real-Life Example

Think of a general job description like "Teacher," which describes common duties like "teach a subject," but the exact subject taught depends on the specific teacher. The abstract class defines the general role; each subclass fills in the specifics.

## 4. Syntax

```java
abstract class ClassName {
    abstract void abstractMethod();
    void normalMethod() {
        // regular implemented method
    }
}
```

## 5. Example Program

```java
abstract class Shape {
    abstract double area();

    void describe() {
        System.out.println("This is a shape.");
    }
}

class Square extends Shape {
    double side = 5;

    double area() {
        return side * side;
    }
}

public class AbstractClassDemo {
    public static void main(String[] args) {
        Square sq = new Square();
        sq.describe();
        System.out.println("Area: " + sq.area());
    }
}
```

**Output:**
```
This is a shape.
Area: 25.0
```

## 6. Key Points to Remember

- You cannot create an object of an abstract class directly using `new`.
- An abstract class can still have constructors, fields, and fully implemented methods.
- A subclass must implement all abstract methods, or it must also be declared abstract itself.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Interface
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Interface$ti$, $sl$interface$sl$, $sd$An interface is a completely abstract type in Java that defines a set of methods a class must implement, without providing (in most cases) any implementation itself. It represents a "contract" that implementing classes must follow.$sd$, 16,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/interface$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is an Interface?

An interface is a completely abstract type in Java that defines a set of methods a class must implement, without providing (in most cases) any implementation itself. It represents a "contract" that implementing classes must follow.

## 2. Why is it used?

Interfaces let unrelated classes share a common set of expected behaviours, and they allow Java to support something close to multiple inheritance, since a class can implement multiple interfaces at once.

## 3. Real-Life Example

Think of a job advertisement listing required skills, like "must know driving and cooking." Anyone who takes the job (implements the interface) must actually have those skills — the advertisement itself doesn't do the driving or cooking.

## 4. Syntax

```java
interface InterfaceName {
    void methodName(); // implicitly public and abstract
}

class ClassName implements InterfaceName {
    public void methodName() {
        // implementation
    }
}
```

## 5. Example Program

```java
interface Drivable {
    void drive();
}

class Car implements Drivable {
    public void drive() {
        System.out.println("Car is being driven");
    }
}

public class InterfaceDemo {
    public static void main(String[] args) {
        Drivable d = new Car();
        d.drive();
    }
}
```

**Output:**
```
Car is being driven
```

## 6. Key Points to Remember

- A class uses `implements` to use an interface, and must provide implementations for all its methods.
- A class can implement multiple interfaces at once, unlike extending multiple classes.
- Since Java 8, interfaces can also have `default` and `static` methods with actual implementations.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  final Keyword
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$final Keyword$ti$, $sl$final-keyword$sl$, $sd$final is used to mark something as unchangeable. A final variable's value can't be reassigned, a final method can't be overridden by subclasses, and a final class can't be extended (inherited from) at all.$sd$, 17,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/final-keyword$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the final Keyword?

`final` is used to mark something as unchangeable. A `final` variable's value can't be reassigned, a `final` method can't be overridden by subclasses, and a `final` class can't be extended (inherited from) at all.

## 2. Why is it used?

It's used to protect important values, methods, or entire class designs from being accidentally or intentionally altered elsewhere in the code, keeping certain behaviour guaranteed and consistent.

## 3. Real-Life Example

Think of a sealed exam paper — once sealed and signed off, its content is locked and cannot be changed. `final` locks a variable, method, or class in a similar way, depending on where it's applied.

## 4. Syntax

```java
final dataType variableName = value;
final class ClassName { }
final returnType methodName() { }
```

## 5. Example Program

```java
class Vehicle {
    final int wheels = 4;

    final void showWheels() {
        System.out.println("Wheels: " + wheels);
    }
}

public class FinalDemo {
    public static void main(String[] args) {
        Vehicle v = new Vehicle();
        v.showWheels();
    }
}
```

**Output:**
```
Wheels: 4
```

## 6. Key Points to Remember

- `final` variable: value cannot be changed once assigned.
- `final` method: cannot be overridden by a subclass.
- `final` class: cannot be extended by any other class.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Object-Oriented Programming  ▸  Access Modifiers
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$object-oriented-programming$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Access Modifiers$ti$, $sl$access-modifiers$sl$, $sd$Access modifiers control who can see or use a class, method, or field from other parts of a program. Java provides four levels: public, private, protected, and default (no keyword at all, also called package-private).$sd$, 18,
    'published', true, true, 'java_tutorial', $sr$object-oriented-programming/access-modifiers$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Access Modifiers?

Access modifiers control who can see or use a class, method, or field from other parts of a program. Java provides four levels: `public`, `private`, `protected`, and default (no keyword at all, also called package-private).

## 2. Why is it used?

They let you control exactly how much of your class's internal details should be exposed to the outside world, supporting proper encapsulation and preventing unwanted or unsafe access from other parts of a large codebase.

## 3. Real-Life Example

Think of different areas in a company building — the reception area is open to everyone (`public`), certain floors are open only to employees of that department (`protected` or default), and the server room is accessible only to specific authorized staff (`private`).

## 4. Syntax

```java
public class ClassName { }
private dataType fieldName;
protected returnType methodName() { }
dataType fieldName; // default (package-private) - no keyword
```

## 5. Example Program

```java
class BankAccount {
    private double balance = 1000;

    public double getBalance() {
        return balance;
    }
}

public class AccessModifierDemo {
    public static void main(String[] args) {
        BankAccount acc = new BankAccount();
        System.out.println("Balance: " + acc.getBalance());
    }
}
```

**Output:**
```
Balance: 1000.0
```

## 6. Key Points to Remember

- `private`: accessible only within the same class.
- Default (no modifier): accessible within the same package only.
- `protected`: accessible within the same package, and also by subclasses in other packages.
- `public`: accessible from anywhere in the program.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Packages & Exception Handling  ▸  Packages
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$packages-and-exception-handling$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Packages$ti$, $sl$packages$sl$, $sd$A package is a way of grouping related classes and interfaces together under one common name, similar to how folders organize files on a computer. Java itself is organized into packages, like java.util and java.io.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$packages-and-exception-handling/packages$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Package?

A package is a way of grouping related classes and interfaces together under one common name, similar to how folders organize files on a computer. Java itself is organized into packages, like `java.util` and `java.io`.

## 2. Why is it used?

Packages keep large projects organized and avoid naming conflicts, since two classes with the same name can exist safely as long as they belong to different packages. They also make it easier to locate related classes.

## 3. Real-Life Example

Think of a library organized into sections — Fiction, Science, History — instead of throwing all books onto one giant shelf. Packages organize Java classes the same way, grouping related ones together.

## 4. Syntax

```java
package packageName;
```

## 5. Example Program

```java
package com.myapp.model;

public class Student {
    String name = "Java Learner";
}
```

**Output:**
```
(No visible output — this class simply belongs to the com.myapp.model package)
```

## 6. Key Points to Remember

- The `package` statement, if used, must be the very first line in a Java file (excluding comments).
- Package names are usually written in lowercase, often based on a reversed domain name (e.g., `com.company.project`).
- Packages help organize code and avoid class name clashes across a large project.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Packages & Exception Handling  ▸  import
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$packages-and-exception-handling$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$import$ti$, $sl$import$sl$, $sd$import is used to bring in a class or an entire package from elsewhere, so it can be used in your current file without typing its full package path every single time.$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$packages-and-exception-handling/import$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is import?

`import` is used to bring in a class or an entire package from elsewhere, so it can be used in your current file without typing its full package path every single time.

## 2. Why is it used?

Without `import`, you'd have to write out a class's complete path (like `java.util.Scanner`) every time you use it. `import` lets you simply write `Scanner` after importing it once at the top of the file.

## 3. Real-Life Example

Think of saving a frequently called contact under a short name in your phone, instead of typing their full phone number every single time you want to call them. `import` gives you this same kind of shortcut for using classes.

## 4. Syntax

```java
import packageName.ClassName;
import packageName.*; // imports all classes in that package
```

## 5. Example Program

```java
import java.util.Scanner;

public class ImportDemo {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println("Scanner class imported and ready to use.");
    }
}
```

**Output:**
```
Scanner class imported and ready to use.
```

## 6. Key Points to Remember

- Classes inside `java.lang` (like `String` and `System`) are automatically available, without needing an explicit import.
- Using `packageName.*` imports all classes in that package, but not classes in its sub-packages.
- Import statements must appear after the `package` statement (if present) and before the class definition.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Packages & Exception Handling  ▸  Exception
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$packages-and-exception-handling$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Exception$ti$, $sl$exception$sl$, $sd$An exception is an unexpected problem that occurs while a program is running, disrupting its normal flow — like trying to divide a number by zero, or accessing an array index that doesn't exist.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$packages-and-exception-handling/exception$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is an Exception?

An exception is an unexpected problem that occurs while a program is running, disrupting its normal flow — like trying to divide a number by zero, or accessing an array index that doesn't exist.

## 2. Why is it used?

Java's exception mechanism allows a program to detect these problems and respond to them gracefully, instead of crashing suddenly and unpredictably.

## 3. Real-Life Example

Think of a fire alarm system in a building. When something unexpected (a fire) happens, the alarm system reacts in an organized way (alerting people, triggering sprinklers) instead of the building simply collapsing without warning.

## 4. Syntax

```java
// An exception is thrown automatically or manually
throw new ExceptionType("message");
```

## 5. Example Program

```java
public class ExceptionDemo {
    public static void main(String[] args) {
        int[] numbers = {1, 2, 3};
        System.out.println(numbers[5]); // causes an exception
    }
}
```

**Output:**
```
Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 3
```

## 6. Key Points to Remember

- Exceptions represent problems detected during program execution (runtime), not while writing the code.
- If not handled, an exception stops the program and prints an error trace.
- Java exceptions are objects, all ultimately based on the `Throwable` class.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Packages & Exception Handling  ▸  try-catch
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$packages-and-exception-handling$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$try-catch$ti$, $sl$try-catch$sl$, $sd$try-catch is used to handle exceptions gracefully. Code that might cause a problem is placed inside a try block, and the code to handle that problem, if it occurs, is placed inside a matching catch block.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$packages-and-exception-handling/try-catch$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is try-catch?

`try-catch` is used to handle exceptions gracefully. Code that might cause a problem is placed inside a `try` block, and the code to handle that problem, if it occurs, is placed inside a matching `catch` block.

## 2. Why is it used?

It prevents a program from crashing suddenly when something goes wrong. Instead, the `catch` block can display a helpful message or take an alternative action, keeping the rest of the program running smoothly.

## 3. Real-Life Example

Think of a safety net under a tightrope walker. If the walker (the risky code in `try`) slips, the safety net (`catch`) catches them, preventing a complete disaster, and the show can continue.

## 4. Syntax

```java
try {
    // risky code
} catch (ExceptionType e) {
    // code to handle the exception
}
```

## 5. Example Program

```java
public class TryCatchDemo {
    public static void main(String[] args) {
        try {
            int result = 10 / 0;
        } catch (ArithmeticException e) {
            System.out.println("Cannot divide by zero!");
        }
    }
}
```

**Output:**
```
Cannot divide by zero!
```

## 6. Key Points to Remember

- Only the code genuinely at risk of throwing an exception needs to be inside `try`.
- A `try` block can have multiple `catch` blocks to handle different exception types differently.
- If no matching `catch` handles the thrown exception, the program still crashes with an error trace.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Packages & Exception Handling  ▸  finally
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$packages-and-exception-handling$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$finally$ti$, $sl$finally$sl$, $sd$finally is a block that runs after a try-catch, regardless of whether an exception occurred or not. It's typically used for cleanup work, like closing a file or a database connection.$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$packages-and-exception-handling/finally$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is finally?

`finally` is a block that runs after a `try-catch`, regardless of whether an exception occurred or not. It's typically used for cleanup work, like closing a file or a database connection.

## 2. Why is it used?

Certain cleanup actions must happen no matter what — whether the risky code succeeded or failed. `finally` guarantees this cleanup code always runs, avoiding resource leaks like an open file being left unclosed.

## 3. Real-Life Example

Think of turning off the stove after cooking, whether the dish turned out perfectly or got burnt. That final step (turning off the stove) always happens regardless of the outcome — just like a `finally` block.

## 4. Syntax

```java
try {
    // risky code
} catch (ExceptionType e) {
    // handle exception
} finally {
    // always runs
}
```

## 5. Example Program

```java
public class FinallyDemo {
    public static void main(String[] args) {
        try {
            int result = 10 / 0;
        } catch (ArithmeticException e) {
            System.out.println("Error occurred!");
        } finally {
            System.out.println("Cleanup complete.");
        }
    }
}
```

**Output:**
```
Error occurred!
Cleanup complete.
```

## 6. Key Points to Remember

- `finally` runs whether or not an exception was thrown, and even if the `try` block has a `return` statement.
- It's commonly used to release resources, like closing files, database connections, or network connections.
- `finally` is optional, but when present, it always follows the `catch` block(s).$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Packages & Exception Handling  ▸  throw
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$packages-and-exception-handling$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$throw$ti$, $sl$throw$sl$, $sd$throw is used to manually create and trigger an exception yourself, rather than waiting for Java to generate one automatically due to some code error.$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$packages-and-exception-handling/throw$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is throw?

`throw` is used to manually create and trigger an exception yourself, rather than waiting for Java to generate one automatically due to some code error.

## 2. Why is it used?

Sometimes your own program logic detects an invalid situation that Java itself wouldn't naturally flag — like a negative age value. `throw` lets you signal this problem explicitly as an exception.

## 3. Real-Life Example

Think of a security guard manually raising an alarm after personally noticing something suspicious, even though no automatic sensor detected anything. `throw` lets your code raise this kind of manual alert.

## 4. Syntax

```java
throw new ExceptionType("error message");
```

## 5. Example Program

```java
public class ThrowDemo {
    static void checkAge(int age) {
        if (age < 18) {
            throw new IllegalArgumentException("Age must be 18 or above");
        }
        System.out.println("Age is valid.");
    }

    public static void main(String[] args) {
        checkAge(15);
    }
}
```

**Output:**
```
Exception in thread "main" java.lang.IllegalArgumentException: Age must be 18 or above
```

## 6. Key Points to Remember

- `throw` is used with a single exception object, created using `new`.
- After a `throw` statement executes, the rest of that method stops running immediately.
- `throw` is typically combined with an `if` check to catch invalid conditions in your own logic.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Packages & Exception Handling  ▸  throws
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$packages-and-exception-handling$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$throws$ti$, $sl$throws$sl$, $sd$throws is used in a method's signature to declare that the method might produce a certain type of exception, so whoever calls that method knows they must handle it.$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$packages-and-exception-handling/throws$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is throws?

`throws` is used in a method's signature to declare that the method might produce a certain type of exception, so whoever calls that method knows they must handle it.

## 2. Why is it used?

It acts as a warning label on a method, telling other developers (and the compiler) that calling this method carries a risk that must be dealt with, usually with a `try-catch`.

## 3. Real-Life Example

Think of a warning label on a product box saying "May cause allergic reaction — check ingredients." It doesn't cause the reaction itself, but it warns the user in advance that there's a certain risk involved.

## 4. Syntax

```java
returnType methodName() throws ExceptionType {
    // method body
}
```

## 5. Example Program

```java
import java.io.IOException;

public class ThrowsDemo {
    static void readFile() throws IOException {
        throw new IOException("File not found");
    }

    public static void main(String[] args) {
        try {
            readFile();
        } catch (IOException e) {
            System.out.println("Handled: " + e.getMessage());
        }
    }
}
```

**Output:**
```
Handled: File not found
```

## 6. Key Points to Remember

- `throws` is written in the method signature; `throw` is used inside the method body to actually trigger an exception.
- A method can declare multiple exception types using `throws`, separated by commas.
- `throws` is mainly required for checked exceptions (explained further in topic 71).$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Packages & Exception Handling  ▸  Custom Exceptions
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$packages-and-exception-handling$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Custom Exceptions$ti$, $sl$custom-exceptions$sl$, $sd$A custom exception is an exception class you create yourself, usually to represent a very specific problem related to your own application's logic, which Java's built-in exceptions don't already describe well.$sd$, 8,
    'published', true, true, 'java_tutorial', $sr$packages-and-exception-handling/custom-exceptions$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Custom Exception?

A custom exception is an exception class you create yourself, usually to represent a very specific problem related to your own application's logic, which Java's built-in exceptions don't already describe well.

## 2. Why is it used?

Built-in exceptions are quite general. Creating your own, clearly named exception (like `InsufficientBalanceException`) makes your error handling more meaningful and easier for other developers to understand.

## 3. Real-Life Example

Think of a company creating its own specific complaint category, like "Late Delivery Complaint," instead of just using a generic "Issue" label for every problem. A custom exception gives a specific, meaningful name to a specific kind of problem.

## 4. Syntax

```java
class CustomExceptionName extends Exception {
    CustomExceptionName(String message) {
        super(message);
    }
}
```

## 5. Example Program

```java
class InsufficientBalanceException extends Exception {
    InsufficientBalanceException(String message) {
        super(message);
    }
}

public class CustomExceptionDemo {
    static void withdraw(double balance, double amount) throws InsufficientBalanceException {
        if (amount > balance) {
            throw new InsufficientBalanceException("Not enough balance!");
        }
        System.out.println("Withdrawal successful.");
    }

    public static void main(String[] args) {
        try {
            withdraw(1000, 5000);
        } catch (InsufficientBalanceException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
```

**Output:**
```
Error: Not enough balance!
```

## 6. Key Points to Remember

- A custom exception usually extends `Exception` (checked) or `RuntimeException` (unchecked), depending on the intended use.
- Using `super(message)` passes the error message up to the built-in exception behaviour.
- Custom exceptions make error messages in large applications much clearer and more specific.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Packages & Exception Handling  ▸  Checked vs Unchecked Exceptions
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$packages-and-exception-handling$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Checked vs Unchecked Exceptions$ti$, $sl$checked-vs-unchecked-exceptions$sl$, $sd$Checked exceptions are problems the compiler forces you to handle (using try-catch or throws) before your code will even compile — like IOException. Unchecked exceptions are not checked by the compiler at compile-time;$sd$, 9,
    'published', true, true, 'java_tutorial', $sr$packages-and-exception-handling/checked-vs-unchecked-exceptions$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Checked and Unchecked Exceptions?

Checked exceptions are problems the compiler forces you to handle (using `try-catch` or `throws`) before your code will even compile — like `IOException`. Unchecked exceptions are not checked by the compiler at compile-time; they usually represent programming mistakes, like `ArithmeticException` or `NullPointerException`.

## 2. Why is it used?

This distinction helps separate genuinely unpredictable, external problems (like a missing file) from avoidable programming bugs (like dividing by zero). Checked exceptions force careful handling for known risky operations.

## 3. Real-Life Example

Think of checked exceptions like mandatory safety checks before a flight — you cannot skip them; they are enforced beforehand. Unchecked exceptions are more like accidents from careless driving — not something the system forces you to plan for beforehand, but caused by an avoidable mistake.

## 4. Syntax

```java
// Checked exception - must be declared or handled
void readFile() throws IOException { }

// Unchecked exception - compiler does not force handling
int result = 10 / 0; // ArithmeticException, unchecked
```

## 5. Example Program

```java
public class CheckedUncheckedDemo {
    public static void main(String[] args) {
        try {
            int result = 10 / 0; // unchecked - ArithmeticException
        } catch (ArithmeticException e) {
            System.out.println("Unchecked exception handled: " + e.getMessage());
        }
    }
}
```

**Output:**
```
Unchecked exception handled: / by zero
```

## 6. Key Points to Remember

- Checked exceptions extend `Exception` (excluding `RuntimeException`); the compiler forces handling.
- Unchecked exceptions extend `RuntimeException`; handling is optional, and the compiler doesn't complain if you skip it.
- This checked vs unchecked distinction is one of the most frequently asked topics in Java interviews.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  Collection Framework
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Collection Framework$ti$, $sl$collection-framework$sl$, $sd$The Collection Framework is a set of ready-made classes and interfaces in Java used to store, organize, and manipulate groups of objects, such as lists, sets, and maps.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$collections-framework/collection-framework$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the Collection Framework?

The Collection Framework is a set of ready-made classes and interfaces in Java used to store, organize, and manipulate groups of objects, such as lists, sets, and maps. It gives programmers a standard, well-tested way to handle groups of data instead of building such structures from scratch.

## 2. Why is it used?

Arrays have a fixed size and limited built-in functionality. The Collection Framework provides flexible, resizable, and feature-rich alternatives — with built-in sorting, searching, and organizing capabilities already handled for you.

## 3. Real-Life Example

Think of a toolbox with different compartments for screws, nails, and bolts, each designed for a specific kind of item and a specific way of organizing them. The Collection Framework offers different "compartments" (List, Set, Map) suited to different data-handling needs.

## 4. Syntax

```java
import java.util.*; // commonly used to bring in collection classes
```

## 5. Example Program

```java
import java.util.ArrayList;

public class CollectionFrameworkDemo {
    public static void main(String[] args) {
        ArrayList<String> fruits = new ArrayList<>();
        fruits.add("Apple");
        fruits.add("Mango");
        System.out.println(fruits);
    }
}
```

**Output:**
```
[Apple, Mango]
```

## 6. Key Points to Remember

- The three main types of collections are List, Set, and Map, each suited for different needs.
- Collections can grow or shrink dynamically, unlike fixed-size arrays.
- The `java.util` package contains most of Java's Collection Framework classes.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  List
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$List$ti$, $sl$list$sl$, $sd$List is an interface in the Collection Framework that represents an ordered group of elements, where duplicate values are allowed, and each element has a specific position (index), just like an array.$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$collections-framework/list$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a List?

`List` is an interface in the Collection Framework that represents an ordered group of elements, where duplicate values are allowed, and each element has a specific position (index), just like an array.

## 2. Why is it used?

`List` is used whenever the order of elements matters, and duplicates are acceptable — like maintaining a list of items in a shopping cart, where the same item could appear more than once.

## 3. Real-Life Example

Think of a to-do list written on paper. Items are in a specific order, and you could accidentally write the same task twice — both are perfectly fine for a `List`.

## 4. Syntax

```java
List<DataType> listName = new ArrayList<>(); // or LinkedList, Vector, etc.
```

## 5. Example Program

```java
import java.util.List;
import java.util.ArrayList;

public class ListDemo {
    public static void main(String[] args) {
        List<String> tasks = new ArrayList<>();
        tasks.add("Read");
        tasks.add("Write");
        tasks.add("Read"); // duplicate allowed
        System.out.println(tasks);
    }
}
```

**Output:**
```
[Read, Write, Read]
```

## 6. Key Points to Remember

- `List` maintains insertion order and allows duplicate elements.
- `List` is an interface — you must use an implementing class like `ArrayList`, `LinkedList`, or `Vector` to actually create one.
- Elements in a `List` are accessed using a zero-based index, just like arrays.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  ArrayList
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$ArrayList$ti$, $sl$arraylist$sl$, $sd$ArrayList is one of the most commonly used implementations of the List interface. It stores elements in a resizable array internally, growing automatically as more elements are added.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$collections-framework/arraylist$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is ArrayList?

`ArrayList` is one of the most commonly used implementations of the `List` interface. It stores elements in a resizable array internally, growing automatically as more elements are added.

## 2. Why is it used?

Unlike a normal array, `ArrayList` can grow or shrink as needed, and it comes with many built-in methods for adding, removing, and searching elements, making everyday list operations much simpler.

## 3. Real-Life Example

Think of an expandable file folder that automatically adds more sections as you keep adding documents, instead of being limited to a fixed number of sections from the start.

## 4. Syntax

```java
ArrayList<DataType> listName = new ArrayList<>();
```

## 5. Example Program

```java
import java.util.ArrayList;

public class ArrayListDemo {
    public static void main(String[] args) {
        ArrayList<Integer> numbers = new ArrayList<>();
        numbers.add(10);
        numbers.add(20);
        numbers.remove(0);
        System.out.println(numbers);
    }
}
```

**Output:**
```
[20]
```

## 6. Key Points to Remember

- `ArrayList` is best when frequent reading/searching is needed, since it offers fast index-based access.
- Adding or removing elements from the middle of a large `ArrayList` can be slower, since remaining elements need to shift.
- `ArrayList` is not synchronized, so it is not automatically safe to use across multiple threads at once.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  LinkedList
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$LinkedList$ti$, $sl$linkedlist$sl$, $sd$LinkedList is another implementation of the List interface, where each element is stored as a node that also holds a reference (link) to the next (and previous) node, rather than sitting in one continuous block of memory like an array.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$collections-framework/linkedlist$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is LinkedList?

`LinkedList` is another implementation of the `List` interface, where each element is stored as a node that also holds a reference (link) to the next (and previous) node, rather than sitting in one continuous block of memory like an array.

## 2. Why is it used?

`LinkedList` is efficient for frequent insertions and deletions, especially at the beginning or middle of the list, since it only needs to update a few links rather than shifting many elements.

## 3. Real-Life Example

Think of a treasure hunt where each clue tells you the location of the next clue. To reach any clue, you follow the chain from the start. `LinkedList` stores and accesses data through this kind of chain of connections.

## 4. Syntax

```java
LinkedList<DataType> listName = new LinkedList<>();
```

## 5. Example Program

```java
import java.util.LinkedList;

public class LinkedListDemo {
    public static void main(String[] args) {
        LinkedList<String> names = new LinkedList<>();
        names.add("Amit");
        names.addFirst("Priya");
        System.out.println(names);
    }
}
```

**Output:**
```
[Priya, Amit]
```

## 6. Key Points to Remember

- `LinkedList` is efficient for insertions/deletions but slower for random access (like getting the 50th element) compared to `ArrayList`.
- It also implements the `Deque` interface, so it can be used as a stack or a queue.
- Choose `ArrayList` when access speed matters more; choose `LinkedList` when frequent insertions/deletions matter more.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  Vector
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Vector$ti$, $sl$vector$sl$, $sd$Vector is an older implementation of the List interface, very similar to ArrayList, but with all its methods synchronized, meaning it is safe to use across multiple threads simultaneously.$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$collections-framework/vector$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Vector?

`Vector` is an older implementation of the `List` interface, very similar to `ArrayList`, but with all its methods synchronized, meaning it is safe to use across multiple threads simultaneously.

## 2. Why is it used?

`Vector` is used in situations where thread safety for list operations is genuinely required, though in modern Java, other approaches are often preferred for new projects.

## 3. Real-Life Example

Think of a single shared notice board where only one person is allowed to write on it at a time, ensuring nothing gets overwritten or lost due to two people writing simultaneously. `Vector` behaves similarly across threads.

## 4. Syntax

```java
Vector<DataType> vectorName = new Vector<>();
```

## 5. Example Program

```java
import java.util.Vector;

public class VectorDemo {
    public static void main(String[] args) {
        Vector<String> colors = new Vector<>();
        colors.add("Red");
        colors.add("Blue");
        System.out.println(colors);
    }
}
```

**Output:**
```
[Red, Blue]
```

## 6. Key Points to Remember

- `Vector` is synchronized (thread-safe), unlike `ArrayList`.
- Because of this synchronization, `Vector` is generally slower than `ArrayList` in single-threaded programs.
- `Vector` is considered a legacy class; `ArrayList` combined with explicit synchronization (when needed) is usually preferred today.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  Set
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Set$ti$, $sl$set$sl$, $sd$Set is an interface in the Collection Framework that represents a group of unique elements — duplicate values are simply not allowed.$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$collections-framework/set$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Set?

`Set` is an interface in the Collection Framework that represents a group of unique elements — duplicate values are simply not allowed. Unlike `List`, a `Set` generally does not guarantee any specific order of elements (though some implementations do).

## 2. Why is it used?

`Set` is ideal when you need to store data but must ensure that no value is repeated — like storing a list of unique usernames or unique email addresses.

## 3. Real-Life Example

Think of a collection of unique stamps in an album, where a collector never keeps two copies of exactly the same stamp. A `Set` behaves the same way — automatically preventing duplicate entries.

## 4. Syntax

```java
Set<DataType> setName = new HashSet<>(); // or LinkedHashSet, TreeSet
```

## 5. Example Program

```java
import java.util.Set;
import java.util.HashSet;

public class SetDemo {
    public static void main(String[] args) {
        Set<String> names = new HashSet<>();
        names.add("Riya");
        names.add("Riya"); // duplicate, ignored
        System.out.println(names);
    }
}
```

**Output:**
```
[Riya]
```

## 6. Key Points to Remember

- `Set` never allows duplicate elements — adding a duplicate is simply ignored, without an error.
- `Set` is an interface; common implementations include `HashSet`, `LinkedHashSet`, and `TreeSet`.
- The order of elements depends on which implementation you use.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  HashSet
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$HashSet$ti$, $sl$hashset$sl$, $sd$HashSet is the most commonly used implementation of the Set interface. It stores unique elements and does not guarantee any particular order when you iterate through them.$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$collections-framework/hashset$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is HashSet?

`HashSet` is the most commonly used implementation of the `Set` interface. It stores unique elements and does not guarantee any particular order when you iterate through them.

## 2. Why is it used?

`HashSet` is used when you need fast operations (adding, removing, checking existence) and don't care about maintaining any specific order of elements.

## 3. Real-Life Example

Think of tossing unique tokens into a large basket without arranging them in any particular order. You can still quickly check if a specific token is in the basket, even though there's no defined sequence.

## 4. Syntax

```java
HashSet<DataType> setName = new HashSet<>();
```

## 5. Example Program

```java
import java.util.HashSet;

public class HashSetDemo {
    public static void main(String[] args) {
        HashSet<Integer> numbers = new HashSet<>();
        numbers.add(10);
        numbers.add(20);
        numbers.add(10); // duplicate, ignored
        System.out.println(numbers.size());
    }
}
```

**Output:**
```
2
```

## 6. Key Points to Remember

- `HashSet` offers very fast add, remove, and search operations on average.
- The iteration order of a `HashSet` is unpredictable and should never be relied upon.
- `HashSet` internally uses a `HashMap` to store its elements.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  LinkedHashSet
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$LinkedHashSet$ti$, $sl$linkedhashset$sl$, $sd$LinkedHashSet is a variation of HashSet that maintains the insertion order of elements — meaning elements appear in the same order they were added, while still preventing duplicates.$sd$, 8,
    'published', true, true, 'java_tutorial', $sr$collections-framework/linkedhashset$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is LinkedHashSet?

`LinkedHashSet` is a variation of `HashSet` that maintains the insertion order of elements — meaning elements appear in the same order they were added, while still preventing duplicates.

## 2. Why is it used?

It's useful when you need the uniqueness guarantee of a `Set`, but also want to preserve a predictable, consistent order of elements, unlike a regular `HashSet`.

## 3. Real-Life Example

Think of a guest list at an event where each guest's name is unique, and names are recorded in exactly the order they registered. `LinkedHashSet` preserves this registration order while ensuring no repeated names.

## 4. Syntax

```java
LinkedHashSet<DataType> setName = new LinkedHashSet<>();
```

## 5. Example Program

```java
import java.util.LinkedHashSet;

public class LinkedHashSetDemo {
    public static void main(String[] args) {
        LinkedHashSet<String> visitors = new LinkedHashSet<>();
        visitors.add("Karan");
        visitors.add("Divya");
        visitors.add("Karan"); // duplicate, ignored
        System.out.println(visitors);
    }
}
```

**Output:**
```
[Karan, Divya]
```

## 6. Key Points to Remember

- `LinkedHashSet` keeps elements in the order they were inserted, unlike `HashSet`.
- It's slightly slower than `HashSet` due to the extra work of maintaining order.
- Choose `LinkedHashSet` when both uniqueness and predictable order are needed.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  TreeSet
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$TreeSet$ti$, $sl$treeset$sl$, $sd$TreeSet is an implementation of the Set interface that automatically stores its elements in sorted order, based on their natural ordering (like ascending numbers or alphabetical order) or a custom sorting rule you provide.$sd$, 9,
    'published', true, true, 'java_tutorial', $sr$collections-framework/treeset$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is TreeSet?

`TreeSet` is an implementation of the `Set` interface that automatically stores its elements in sorted order, based on their natural ordering (like ascending numbers or alphabetical order) or a custom sorting rule you provide.

## 2. Why is it used?

It's useful whenever you need a collection of unique elements that must also stay sorted at all times, without you needing to manually sort them yourself after every addition.

## 3. Real-Life Example

Think of a set of unique exam roll numbers that are always kept arranged in ascending order automatically, no matter in what order students originally submitted their forms. `TreeSet` maintains this kind of automatic sorted arrangement.

## 4. Syntax

```java
TreeSet<DataType> setName = new TreeSet<>();
```

## 5. Example Program

```java
import java.util.TreeSet;

public class TreeSetDemo {
    public static void main(String[] args) {
        TreeSet<Integer> numbers = new TreeSet<>();
        numbers.add(50);
        numbers.add(10);
        numbers.add(30);
        System.out.println(numbers);
    }
}
```

**Output:**
```
[10, 30, 50]
```

## 6. Key Points to Remember

- `TreeSet` keeps elements sorted automatically at all times.
- It does not allow `null` elements, since sorting a `null` value doesn't make sense.
- `TreeSet` is generally slower than `HashSet` due to the extra work of maintaining sorted order.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  Map
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Map$ti$, $sl$map$sl$, $sd$Map is an interface in the Collection Framework that stores data as key-value pairs. Every key is unique, and it's linked directly to one specific value, allowing quick lookup of a value using its key.$sd$, 10,
    'published', true, true, 'java_tutorial', $sr$collections-framework/map$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Map?

`Map` is an interface in the Collection Framework that stores data as key-value pairs. Every key is unique, and it's linked directly to one specific value, allowing quick lookup of a value using its key.

## 2. Why is it used?

`Map` is ideal when data naturally comes in pairs — like a student's roll number (key) linked to their name (value), letting you retrieve information quickly using just the key.

## 3. Real-Life Example

Think of a phonebook, where each contact name (key) is linked to a specific phone number (value). You look up a phone number directly by the name, without scanning through every entry.

## 4. Syntax

```java
Map<KeyType, ValueType> mapName = new HashMap<>(); // or LinkedHashMap, TreeMap
```

## 5. Example Program

```java
import java.util.Map;
import java.util.HashMap;

public class MapDemo {
    public static void main(String[] args) {
        Map<Integer, String> students = new HashMap<>();
        students.put(1, "Aman");
        students.put(2, "Neha");
        System.out.println(students.get(1));
    }
}
```

**Output:**
```
Aman
```

## 6. Key Points to Remember

- `Map` stores data as key-value pairs, and keys must be unique (values can repeat).
- `Map` does not extend the `Collection` interface, unlike `List` and `Set`.
- Common implementations include `HashMap`, `LinkedHashMap`, and `TreeMap`.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  HashMap
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$HashMap$ti$, $sl$hashmap$sl$, $sd$HashMap is the most commonly used implementation of the Map interface. It stores key-value pairs and does not guarantee any particular order of the entries.$sd$, 11,
    'published', true, true, 'java_tutorial', $sr$collections-framework/hashmap$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is HashMap?

`HashMap` is the most commonly used implementation of the `Map` interface. It stores key-value pairs and does not guarantee any particular order of the entries.

## 2. Why is it used?

`HashMap` provides very fast lookup, insertion, and deletion of key-value pairs on average, making it a go-to choice whenever quick access using a key is needed and order doesn't matter.

## 3. Real-Life Example

Think of a large filing cabinet where each drawer is labeled with a unique code, and you can jump directly to the right drawer using that code, without checking every drawer one by one. `HashMap` gives this same kind of quick, direct access using keys.

## 4. Syntax

```java
HashMap<KeyType, ValueType> mapName = new HashMap<>();
```

## 5. Example Program

```java
import java.util.HashMap;

public class HashMapDemo {
    public static void main(String[] args) {
        HashMap<String, Integer> marks = new HashMap<>();
        marks.put("Rahul", 85);
        marks.put("Sneha", 90);
        System.out.println(marks);
    }
}
```

**Output:**
```
{Rahul=85, Sneha=90}
```
*(Note: HashMap does not guarantee this exact order every time.)*

## 6. Key Points to Remember

- `HashMap` allows one `null` key and multiple `null` values.
- Iteration order is not guaranteed and may vary.
- `HashMap` is not synchronized, so it's not automatically thread-safe.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  LinkedHashMap
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$LinkedHashMap$ti$, $sl$linkedhashmap$sl$, $sd$LinkedHashMap is a variation of HashMap that maintains the insertion order of key-value pairs, meaning entries appear in the exact order they were added.$sd$, 12,
    'published', true, true, 'java_tutorial', $sr$collections-framework/linkedhashmap$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is LinkedHashMap?

`LinkedHashMap` is a variation of `HashMap` that maintains the insertion order of key-value pairs, meaning entries appear in the exact order they were added.

## 2. Why is it used?

It's useful when you need the fast lookup benefits of a `HashMap`, but also want the entries to appear in a predictable, consistent order — for example, when displaying recently added items in the order they were added.

## 3. Real-Life Example

Think of a reception logbook where visitor entries are recorded strictly in the order they arrive, even though each visitor also has a unique ID for lookup. `LinkedHashMap` preserves this same kind of arrival order.

## 4. Syntax

```java
LinkedHashMap<KeyType, ValueType> mapName = new LinkedHashMap<>();
```

## 5. Example Program

```java
import java.util.LinkedHashMap;

public class LinkedHashMapDemo {
    public static void main(String[] args) {
        LinkedHashMap<String, Integer> scores = new LinkedHashMap<>();
        scores.put("Ankit", 70);
        scores.put("Meera", 95);
        System.out.println(scores);
    }
}
```

**Output:**
```
{Ankit=70, Meera=95}
```

## 6. Key Points to Remember

- `LinkedHashMap` preserves insertion order, unlike `HashMap`.
- It's slightly slower than `HashMap` due to the extra bookkeeping needed to maintain order.
- It can also be configured to maintain access order instead of insertion order, useful for building simple caches.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  TreeMap
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$TreeMap$ti$, $sl$treemap$sl$, $sd$TreeMap is an implementation of the Map interface that automatically keeps its key-value pairs sorted based on the keys, either in their natural order or a custom order you define.$sd$, 13,
    'published', true, true, 'java_tutorial', $sr$collections-framework/treemap$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is TreeMap?

`TreeMap` is an implementation of the `Map` interface that automatically keeps its key-value pairs sorted based on the keys, either in their natural order or a custom order you define.

## 2. Why is it used?

It's useful whenever key-value data must always stay sorted by key — like maintaining a dictionary of words in alphabetical order, or numeric IDs in ascending order, without manual sorting.

## 3. Real-Life Example

Think of a well-organized dictionary where every word (key) and its meaning (value) is automatically kept in alphabetical order, regardless of the order in which words were originally added.

## 4. Syntax

```java
TreeMap<KeyType, ValueType> mapName = new TreeMap<>();
```

## 5. Example Program

```java
import java.util.TreeMap;

public class TreeMapDemo {
    public static void main(String[] args) {
        TreeMap<String, Integer> ages = new TreeMap<>();
        ages.put("Zara", 22);
        ages.put("Amit", 25);
        System.out.println(ages);
    }
}
```

**Output:**
```
{Amit=25, Zara=22}
```

## 6. Key Points to Remember

- `TreeMap` keeps its entries sorted by key automatically at all times.
- It does not allow a `null` key, since sorting requires comparing keys.
- `TreeMap` is generally slower than `HashMap` due to the overhead of maintaining sorted order.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  Iterator
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Iterator$ti$, $sl$iterator$sl$, $sd$An Iterator is an object used to go through the elements of a collection one by one, in a standard way, regardless of the specific type of collection being used (List, Set, or Map's key/value views).$sd$, 14,
    'published', true, true, 'java_tutorial', $sr$collections-framework/iterator$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is an Iterator?

An `Iterator` is an object used to go through the elements of a collection one by one, in a standard way, regardless of the specific type of collection being used (List, Set, or Map's key/value views).

## 2. Why is it used?

It provides a consistent, safe way to loop through any collection's elements, and it also allows safely removing elements while iterating — something a normal for loop can't do reliably on collections.

## 3. Real-Life Example

Think of flipping through pages of a photo album one at a time, always moving forward, and being able to remove a photo you're currently looking at without disturbing the rest of the album. An `Iterator` provides this same controlled, one-by-one movement through a collection.

## 4. Syntax

```java
Iterator<DataType> it = collectionName.iterator();
while (it.hasNext()) {
    DataType value = it.next();
}
```

## 5. Example Program

```java
import java.util.ArrayList;
import java.util.Iterator;

public class IteratorDemo {
    public static void main(String[] args) {
        ArrayList<String> fruits = new ArrayList<>();
        fruits.add("Apple");
        fruits.add("Banana");

        Iterator<String> it = fruits.iterator();
        while (it.hasNext()) {
            System.out.println(it.next());
        }
    }
}
```

**Output:**
```
Apple
Banana
```

## 6. Key Points to Remember

- `hasNext()` checks if more elements exist; `next()` retrieves the next element.
- `Iterator` also provides a `remove()` method to safely delete the current element during iteration.
- Directly modifying a collection while using a regular for-each loop (instead of an Iterator's `remove()`) can cause a `ConcurrentModificationException`.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  Comparable
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Comparable$ti$, $sl$comparable$sl$, $sd$Comparable is an interface that lets you define the "natural" sorting order for objects of your own class, by implementing its single method, compareTo().$sd$, 15,
    'published', true, true, 'java_tutorial', $sr$collections-framework/comparable$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Comparable?

`Comparable` is an interface that lets you define the "natural" sorting order for objects of your own class, by implementing its single method, `compareTo()`.

## 2. Why is it used?

When you have a custom class (like `Student`) and want collections of its objects (like a `List<Student>` or `TreeSet<Student>`) to sort automatically, you implement `Comparable` to define exactly how two objects of that class should be compared.

## 3. Real-Life Example

Think of defining a general house rule: "Always arrange books by their title, alphabetically." Once this rule is set, any bookshelf using it automatically knows how to arrange the books, without needing separate instructions each time.

## 4. Syntax

```java
class ClassName implements Comparable<ClassName> {
    public int compareTo(ClassName other) {
        // comparison logic
    }
}
```

## 5. Example Program

```java
class Student implements Comparable<Student> {
    String name;
    int marks;

    Student(String name, int marks) {
        this.name = name;
        this.marks = marks;
    }

    public int compareTo(Student other) {
        return this.marks - other.marks;
    }
}

import java.util.*;

public class ComparableDemo {
    public static void main(String[] args) {
        List<Student> students = new ArrayList<>();
        students.add(new Student("Riya", 85));
        students.add(new Student("Aman", 70));

        Collections.sort(students);
        for (Student s : students) {
            System.out.println(s.name + ": " + s.marks);
        }
    }
}
```

**Output:**
```
Aman: 70
Riya: 85
```

## 6. Key Points to Remember

- `Comparable` defines only one, single "natural" sorting order per class.
- The `compareTo()` method should return a negative number, zero, or a positive number, depending on the comparison result.
- Use `Comparator` (next topic) when you need multiple, different sorting orders for the same class.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Collections Framework  ▸  Comparator
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$collections-framework$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Comparator$ti$, $sl$comparator$sl$, $sd$Comparator is an interface used to define custom sorting logic for objects, separately from the class itself. Unlike Comparable, you can create multiple different Comparator implementations to sort the same class in different ways.$sd$, 16,
    'published', true, true, 'java_tutorial', $sr$collections-framework/comparator$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Comparator?

`Comparator` is an interface used to define custom sorting logic for objects, separately from the class itself. Unlike `Comparable`, you can create multiple different `Comparator` implementations to sort the same class in different ways.

## 2. Why is it used?

Sometimes you need to sort the same type of object in more than one way — like sorting students by marks in one place, and by name in another. `Comparator` allows this flexibility without changing the original class.

## 3. Real-Life Example

Think of a bookshelf that can be reorganized differently depending on the situation — sometimes by title, sometimes by author, sometimes by publication year — without changing anything about the books themselves. `Comparator` provides this kind of flexible, external sorting rule.

## 4. Syntax

```java
Comparator<DataType> comparatorName = new Comparator<DataType>() {
    public int compare(DataType a, DataType b) {
        // comparison logic
    }
};
```

## 5. Example Program

```java
import java.util.*;

class Student {
    String name;
    int marks;

    Student(String name, int marks) {
        this.name = name;
        this.marks = marks;
    }
}

public class ComparatorDemo {
    public static void main(String[] args) {
        List<Student> students = new ArrayList<>();
        students.add(new Student("Riya", 85));
        students.add(new Student("Aman", 70));

        Comparator<Student> byName = (a, b) -> a.name.compareTo(b.name);
        Collections.sort(students, byName);

        for (Student s : students) {
            System.out.println(s.name + ": " + s.marks);
        }
    }
}
```

**Output:**
```
Aman: 70
Riya: 85
```

## 6. Key Points to Remember

- `Comparator` is defined outside the class being sorted, allowing multiple different sorting strategies.
- It's commonly written using a lambda expression for brevity, as shown above.
- Use `Comparable` for a single default sort order; use `Comparator` when multiple sort orders are needed.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Advanced Java  ▸  Wrapper Classes
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$advanced-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Wrapper Classes$ti$, $sl$wrapper-classes$sl$, $sd$Wrapper classes let you use primitive data types (like int, double, boolean) as objects. Each primitive type has a corresponding wrapper class — for example, int becomes Integer, and double becomes Double.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$advanced-java/wrapper-classes$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Wrapper Classes?

Wrapper classes let you use primitive data types (like `int`, `double`, `boolean`) as objects. Each primitive type has a corresponding wrapper class — for example, `int` becomes `Integer`, and `double` becomes `Double`.

## 2. Why is it used?

Many parts of Java, especially the Collection Framework, work only with objects, not primitives. Wrapper classes let you store primitive-like values inside collections such as `ArrayList<Integer>`, which wouldn't accept a plain `int` directly.

## 3. Real-Life Example

Think of putting loose coins into a small pouch before placing them into a large storage locker that only accepts pouches, not loose coins. The wrapper class is like that pouch, letting a plain primitive value be "accepted" wherever an object is required.

## 4. Syntax

```java
int a = 10;
Integer wrappedA = a; // autoboxing
int unwrappedA = wrappedA; // unboxing
```

## 5. Example Program

```java
import java.util.ArrayList;

public class WrapperDemo {
    public static void main(String[] args) {
        ArrayList<Integer> numbers = new ArrayList<>();
        numbers.add(10); // int auto-converted to Integer
        int value = numbers.get(0); // Integer auto-converted back to int
        System.out.println("Value: " + value);
    }
}
```

**Output:**
```
Value: 10
```

## 6. Key Points to Remember

- Each of Java's 8 primitive types has one corresponding wrapper class.
- Autoboxing is automatic conversion from primitive to wrapper; unboxing is the reverse.
- Wrapper classes also provide useful utility methods, like `Integer.parseInt()` to convert a `String` into an `int`.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Advanced Java  ▸  Generics
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$advanced-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Generics$ti$, $sl$generics$sl$, $sd$Generics allow you to write classes, interfaces, and methods that work with a specific type you decide when you actually use them, instead of fixing the type in advance. This is written using angle brackets, like <T>.$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$advanced-java/generics$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Generics?

Generics allow you to write classes, interfaces, and methods that work with a specific type you decide when you actually use them, instead of fixing the type in advance. This is written using angle brackets, like `<T>`.

## 2. Why is it used?

Generics allow the same class or method to work safely with different data types, while still catching type-related mistakes at compile-time, rather than causing unexpected errors while the program is running.

## 3. Real-Life Example

Think of a universal container that can be labeled to hold exactly one specific kind of item at a time — sometimes fruits, sometimes books — but once labeled, it strictly enforces that only that kind of item goes inside.

## 4. Syntax

```java
class ClassName<T> {
    T value;
}

ClassName<String> obj = new ClassName<>();
```

## 5. Example Program

```java
class Box<T> {
    T item;

    void setItem(T item) {
        this.item = item;
    }

    T getItem() {
        return item;
    }
}

public class GenericsDemo {
    public static void main(String[] args) {
        Box<String> box = new Box<>();
        box.setItem("Java Book");
        System.out.println("Item: " + box.getItem());
    }
}
```

**Output:**
```
Item: Java Book
```

## 6. Key Points to Remember

- Generics catch type mismatches at compile-time, avoiding many runtime errors.
- `<T>` is just a placeholder name — common conventions include `T` for type, `E` for element, `K`/`V` for key/value.
- Collections like `ArrayList<Integer>` already use generics internally, which is why they only allow one specified type of element.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Advanced Java  ▸  Enum
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$advanced-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Enum$ti$, $sl$enum$sl$, $sd$An enum (short for enumeration) is a special Java type used to define a fixed set of named constant values, like the days of the week or the directions North, South, East, and West.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$advanced-java/enum$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is an Enum?

An `enum` (short for enumeration) is a special Java type used to define a fixed set of named constant values, like the days of the week or the directions North, South, East, and West.

## 2. Why is it used?

When a value should only ever be one of a small, known set of options, an `enum` prevents invalid values from being used by mistake, unlike a plain `String` or `int`, which could accidentally hold anything.

## 3. Real-Life Example

Think of traffic light colours — only Red, Yellow, or Green are valid; there's no "Purple" traffic light. An `enum` locks a value down to only its officially defined options, just like a traffic light's fixed set of colours.

## 4. Syntax

```java
enum EnumName {
    VALUE1, VALUE2, VALUE3
}
```

## 5. Example Program

```java
enum Day {
    MONDAY, TUESDAY, WEDNESDAY
}

public class EnumDemo {
    public static void main(String[] args) {
        Day today = Day.TUESDAY;
        System.out.println("Today is: " + today);
    }
}
```

**Output:**
```
Today is: TUESDAY
```

## 6. Key Points to Remember

- Enum values are constants and are conventionally written in uppercase.
- An `enum` can also have fields, constructors, and methods, making it more powerful than a plain list of names.
- Using an `enum` instead of plain numbers or strings makes code safer and more readable.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Advanced Java  ▸  Lambda Expressions
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$advanced-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Lambda Expressions$ti$, $sl$lambda-expressions$sl$, $sd$A lambda expression is a short, compact way of writing an anonymous (unnamed) block of code that represents a single method's behaviour, often used to implement a functional interface without writing a full class.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$advanced-java/lambda-expressions$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Lambda Expression?

A lambda expression is a short, compact way of writing an anonymous (unnamed) block of code that represents a single method's behaviour, often used to implement a functional interface without writing a full class.

## 2. Why is it used?

Lambda expressions reduce boilerplate code significantly, especially when passing simple behaviour (like a comparison rule or an action) as an argument, instead of writing an entire separate class just for that one small piece of logic.

## 3. Real-Life Example

Think of leaving a short instruction note, like "water the plants," instead of writing a full formal document explaining who should do it, when, and why. A lambda expresses the needed action briefly, focusing only on what matters.

## 4. Syntax

```java
(parameters) -> expression;
(parameters) -> { statements; }
```

## 5. Example Program

```java
interface Greeting {
    void sayHello(String name);
}

public class LambdaDemo {
    public static void main(String[] args) {
        Greeting greeting = (name) -> System.out.println("Hello, " + name);
        greeting.sayHello("Java Learner");
    }
}
```

**Output:**
```
Hello, Java Learner
```

## 6. Key Points to Remember

- Lambda expressions can only be used with functional interfaces (interfaces with exactly one abstract method).
- They make code shorter, especially for tasks like sorting or simple event handling.
- Introduced in Java 8, lambda expressions are a major part of modern Java's more concise style.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Advanced Java  ▸  Functional Interfaces
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$advanced-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Functional Interfaces$ti$, $sl$functional-interfaces$sl$, $sd$A functional interface is an interface that contains exactly one abstract method. It's the type of interface that lambda expressions are designed to implement directly.$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$advanced-java/functional-interfaces$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Functional Interface?

A functional interface is an interface that contains exactly one abstract method. It's the type of interface that lambda expressions are designed to implement directly.

## 2. Why is it used?

Functional interfaces provide the foundation that makes lambda expressions possible — the lambda's short code becomes the implementation of that one single abstract method defined in the interface.

## 3. Real-Life Example

Think of a job role with exactly one single core responsibility, like "Deliver the package." Because there's only one clear task, anyone can quickly describe how they'll do it, without needing a long, detailed job description — that's the simplicity a functional interface provides.

## 4. Syntax

```java
@FunctionalInterface
interface InterfaceName {
    void methodName(); // exactly one abstract method
}
```

## 5. Example Program

```java
@FunctionalInterface
interface Calculator {
    int operate(int a, int b);
}

public class FunctionalInterfaceDemo {
    public static void main(String[] args) {
        Calculator addition = (a, b) -> a + b;
        System.out.println("Sum: " + addition.operate(5, 10));
    }
}
```

**Output:**
```
Sum: 15
```

## 6. Key Points to Remember

- The `@FunctionalInterface` annotation is optional, but it helps the compiler catch accidental extra methods.
- Java provides many built-in functional interfaces in `java.util.function`, like `Function`, `Predicate`, and `Consumer`.
- A functional interface can still have `default` and `static` methods, as long as there's exactly one abstract method.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Advanced Java  ▸  Method References
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$advanced-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Method References$ti$, $sl$method-references$sl$, $sd$A method reference is a shorthand way of referring directly to an existing method, using it as if it were a lambda expression, without rewriting its logic again.$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$advanced-java/method-references$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Method Reference?

A method reference is a shorthand way of referring directly to an existing method, using it as if it were a lambda expression, without rewriting its logic again.

## 2. Why is it used?

When a lambda expression would simply call an existing method with no extra logic, a method reference makes the code shorter and clearer by directly pointing to that method instead.

## 3. Real-Life Example

Think of saying "just do what the manual says," pointing directly to an existing instruction manual, instead of rewriting all those instructions again yourself. A method reference "points to" existing method logic instead of duplicating it.

## 4. Syntax

```java
ClassName::methodName
```

## 5. Example Program

```java
import java.util.List;
import java.util.Arrays;

public class MethodReferenceDemo {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Aman", "Riya", "Karan");
        names.forEach(System.out::println);
    }
}
```

**Output:**
```
Aman
Riya
Karan
```

## 6. Key Points to Remember

- Method references use the `::` syntax between the class (or object) and the method name.
- They work only in places where a matching lambda expression could also be used.
- Common forms include static method references, instance method references, and constructor references.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Advanced Java  ▸  Stream API
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$advanced-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Stream API$ti$, $sl$stream-api$sl$, $sd$The Stream API lets you process collections of data (like lists) in a clean, declarative style — describing what should happen (filter, transform, count) rather than manually writing loops to do it step-by-step.$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$advanced-java/stream-api$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the Stream API?

The Stream API lets you process collections of data (like lists) in a clean, declarative style — describing what should happen (filter, transform, count) rather than manually writing loops to do it step-by-step.

## 2. Why is it used?

It significantly reduces the amount of code needed for common data-processing tasks, like filtering a list of students by marks, or converting a list of names to uppercase, all in a few readable lines.

## 3. Real-Life Example

Think of a factory assembly line where raw material passes through several stages — cleaning, cutting, packaging — each stage doing one specific job before passing the result to the next. A Java Stream processes data through a similar chain of steps.

## 4. Syntax

```java
collection.stream()
    .filter(condition)
    .map(transformation)
    .collect(Collectors.toList());
```

## 5. Example Program

```java
import java.util.*;
import java.util.stream.*;

public class StreamDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6);

        List<Integer> evenNumbers = numbers.stream()
            .filter(n -> n % 2 == 0)
            .collect(Collectors.toList());

        System.out.println(evenNumbers);
    }
}
```

**Output:**
```
[2, 4, 6]
```

## 6. Key Points to Remember

- A stream doesn't store data itself — it simply processes data from an existing source, like a `List`.
- Stream operations don't modify the original collection; they produce a new result.
- Common operations include `filter()`, `map()`, `sorted()`, `collect()`, and `forEach()`.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Advanced Java  ▸  Optional
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$advanced-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Optional$ti$, $sl$optional$sl$, $sd$Optional is a container object that may or may not hold a non-null value. It's used to represent the possibility that a value might be missing, without directly using null.$sd$, 8,
    'published', true, true, 'java_tutorial', $sr$advanced-java/optional$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Optional?

`Optional` is a container object that may or may not hold a non-null value. It's used to represent the possibility that a value might be missing, without directly using `null`.

## 2. Why is it used?

Directly working with `null` values often causes unexpected `NullPointerException` errors. `Optional` forces you to explicitly check whether a value is present before using it, reducing this common source of bugs.

## 3. Real-Life Example

Think of a sealed box labeled "may or may not contain an item," which you must deliberately open and check before assuming there's something inside. `Optional` represents this same "might be empty" possibility clearly, instead of silently allowing a hidden, unexpected `null`.

## 4. Syntax

```java
Optional<DataType> optionalValue = Optional.of(value);
Optional<DataType> emptyValue = Optional.empty();
```

## 5. Example Program

```java
import java.util.Optional;

public class OptionalDemo {
    public static void main(String[] args) {
        Optional<String> name = Optional.ofNullable(null);
        System.out.println(name.isPresent() ? name.get() : "No name provided");
    }
}
```

**Output:**
```
No name provided
```

## 6. Key Points to Remember

- `Optional.of()` throws an error if given a `null` value directly; `Optional.ofNullable()` safely allows `null`.
- `isPresent()` checks if a value exists; `get()` retrieves it (only safe after checking `isPresent()`).
- `Optional` is mainly intended for method return types, to clearly signal that a result might be absent.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Advanced Java  ▸  Date and Time API
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$advanced-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Date and Time API$ti$, $sl$date-and-time-api$sl$, $sd$Java's modern Date and Time API (introduced in Java 8, mainly in the java.time package) provides clear, reliable classes like LocalDate, LocalTime, and LocalDateTime for handling dates and times.$sd$, 9,
    'published', true, true, 'java_tutorial', $sr$advanced-java/date-and-time-api$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the Date and Time API?

Java's modern Date and Time API (introduced in Java 8, mainly in the `java.time` package) provides clear, reliable classes like `LocalDate`, `LocalTime`, and `LocalDateTime` for handling dates and times.

## 2. Why is it used?

Handling dates and times correctly (accounting for time zones, formatting, and calculations) is genuinely tricky. This API provides a cleaner, more reliable way to do it, replacing older, more error-prone approaches.

## 3. Real-Life Example

Think of a well-designed calendar app that can clearly tell you today's date, add or subtract days accurately, and never gets confused about how many days are in February during a leap year. This API is built to handle that same kind of reliable date logic.

## 4. Syntax

```java
LocalDate today = LocalDate.now();
LocalDate futureDate = today.plusDays(10);
```

## 5. Example Program

```java
import java.time.LocalDate;

public class DateTimeDemo {
    public static void main(String[] args) {
        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);
        System.out.println("Today: " + today);
        System.out.println("Next week: " + nextWeek);
    }
}
```

**Output:**
```
Today: 2026-09-01
Next week: 2026-09-08
```
*(Exact dates will vary depending on when the program is run.)*

## 6. Key Points to Remember

- `LocalDate` handles only dates; `LocalTime` handles only times; `LocalDateTime` handles both together.
- Objects from this API are immutable — methods like `plusDays()` return a new object rather than changing the original.
- This modern API is preferred over the older `Date` and `Calendar` classes for new Java code.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Advanced Java  ▸  Regular Expressions
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$advanced-java$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Regular Expressions$ti$, $sl$regular-expressions$sl$, $sd$A regular expression (regex) is a pattern used to match, search, or validate specific formats within text — like checking if a string looks like a valid email address or a valid phone number.$sd$, 10,
    'published', true, true, 'java_tutorial', $sr$advanced-java/regular-expressions$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Regular Expressions?

A regular expression (regex) is a pattern used to match, search, or validate specific formats within text — like checking if a string looks like a valid email address or a valid phone number.

## 2. Why is it used?

Regular expressions let you validate or search text based on a pattern rule, instead of writing long, manual character-by-character checks yourself.

## 3. Real-Life Example

Think of a security checkpoint with a specific rule: "Only ID cards matching this exact format (2 letters followed by 6 digits) are valid." A regular expression defines and checks this kind of pattern rule against text automatically.

## 4. Syntax

```java
String text = "example123";
boolean matches = text.matches("regexPattern");
```

## 5. Example Program

```java
public class RegexDemo {
    public static void main(String[] args) {
        String email = "student@example.com";
        boolean isValid = email.matches("^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$");
        System.out.println("Valid email: " + isValid);
    }
}
```

**Output:**
```
Valid email: true
```

## 6. Key Points to Remember

- `String.matches()` checks if the entire string fits the given pattern.
- The `java.util.regex` package (with `Pattern` and `Matcher` classes) offers more advanced regex operations, like finding partial matches.
- Regex patterns can look complex at first, but common patterns (email, phone number, pin code) are widely available for reference and reuse.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Multithreading  ▸  Thread
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$multithreading$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Thread$ti$, $sl$thread$sl$, $sd$A thread is a single, independent path of execution within a program. A Java program always starts with at least one thread (the main thread), but it can create additional threads to perform tasks alongside it.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$multithreading/thread$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Thread?

A thread is a single, independent path of execution within a program. A Java program always starts with at least one thread (the main thread), but it can create additional threads to perform tasks alongside it.

## 2. Why is it used?

Threads let a program perform multiple tasks at (roughly) the same time — like downloading a file while still allowing a user to interact with the app — instead of doing everything one task at a time, in strict sequence.

## 3. Real-Life Example

Think of a restaurant kitchen where one chef prepares a starter while another chef prepares the main course, both working at the same time instead of one waiting for the other to finish completely. Each chef here is like a separate thread.

## 4. Syntax

```java
class MyThread extends Thread {
    public void run() {
        // code to run in this thread
    }
}
```

## 5. Example Program

```java
class MyThread extends Thread {
    public void run() {
        System.out.println("Thread is running");
    }
}

public class ThreadDemo {
    public static void main(String[] args) {
        MyThread t = new MyThread();
        t.start();
    }
}
```

**Output:**
```
Thread is running
```

## 6. Key Points to Remember

- A thread's task is written inside its `run()` method.
- Call `start()` to actually begin a new thread — calling `run()` directly just runs it like a normal method, on the current thread, not as a separate thread.
- Every Java program has at least one thread automatically, called the main thread.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Multithreading  ▸  Runnable
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$multithreading$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Runnable$ti$, $sl$runnable$sl$, $sd$Runnable is an interface with a single method, run(), used to define a task that can be executed by a thread. It's an alternative to extending the Thread class directly.$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$multithreading/runnable$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Runnable?

`Runnable` is an interface with a single method, `run()`, used to define a task that can be executed by a thread. It's an alternative to extending the `Thread` class directly.

## 2. Why is it used?

Since Java allows extending only one class, using `Runnable` instead of extending `Thread` leaves your class free to extend some other class as well, if needed, while still defining thread-based behaviour.

## 3. Real-Life Example

Think of writing down a task on a piece of paper (the `Runnable`) and handing it to any available worker (a `Thread`) to actually carry out. The task itself is separate from who performs it.

## 4. Syntax

```java
class MyTask implements Runnable {
    public void run() {
        // code to run
    }
}

Thread t = new Thread(new MyTask());
t.start();
```

## 5. Example Program

```java
class MyTask implements Runnable {
    public void run() {
        System.out.println("Task running via Runnable");
    }
}

public class RunnableDemo {
    public static void main(String[] args) {
        Thread t = new Thread(new MyTask());
        t.start();
    }
}
```

**Output:**
```
Task running via Runnable
```

## 6. Key Points to Remember

- `Runnable` only defines the task; it must still be passed to a `Thread` object to actually run.
- Using `Runnable` is generally preferred over extending `Thread`, since it keeps your design more flexible.
- `Runnable` can also be implemented easily using a lambda expression, since it's a functional interface.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Multithreading  ▸  Thread Lifecycle
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$multithreading$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Thread Lifecycle$ti$, $sl$thread-lifecycle$sl$, $sd$The thread lifecycle describes the different stages a thread passes through during its existence: New, Runnable, Running, Blocked/Waiting, and Terminated.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$multithreading/thread-lifecycle$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the Thread Lifecycle?

The thread lifecycle describes the different stages a thread passes through during its existence: New, Runnable, Running, Blocked/Waiting, and Terminated.

## 2. Why is it used?

Understanding these stages helps you know exactly what state a thread is in at any given moment, which is important for debugging multithreaded programs and understanding why a thread might be paused or waiting.

## 3. Real-Life Example

Think of a student's day: waking up (New), waiting in line for the bus (Runnable), actually attending class (Running), waiting during a break for the next class (Waiting), and finally going home at the end of the day (Terminated).

## 4. Syntax

```java
// Lifecycle stages are managed internally by the JVM
// but can be observed using thread state methods
Thread.State state = thread.getState();
```

## 5. Example Program

```java
public class ThreadLifecycleDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(() -> System.out.println("Running"));
        System.out.println("State before start: " + t.getState());
        t.start();
        t.join();
        System.out.println("State after completion: " + t.getState());
    }
}
```

**Output:**
```
State before start: NEW
Running
State after completion: TERMINATED
```

## 6. Key Points to Remember

- A thread cannot go back to an earlier stage once it moves forward — for example, a terminated thread cannot be restarted.
- The "Runnable" state means a thread is ready to run but may not currently be executing (the CPU decides scheduling).
- `getState()` is useful for understanding a thread's current lifecycle stage during debugging.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Multithreading  ▸  Thread Methods
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$multithreading$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Thread Methods$ti$, $sl$thread-methods$sl$, $sd$Thread methods are built-in methods provided by the Thread class to control thread behaviour — like start() to begin a thread, sleep() to pause it temporarily, and join() to wait for another thread to finish.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$multithreading/thread-methods$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Thread Methods?

Thread methods are built-in methods provided by the `Thread` class to control thread behaviour — like `start()` to begin a thread, `sleep()` to pause it temporarily, and `join()` to wait for another thread to finish.

## 2. Why is it used?

These methods give you control over how and when threads run, pause, or wait for each other, which is essential for coordinating multiple threads working together correctly.

## 3. Real-Life Example

Think of a relay race where one runner must wait (`join()`) for the previous runner to finish before starting their own leg. These thread methods manage this kind of coordination between multiple independent tasks.

## 4. Syntax

```java
thread.start();
Thread.sleep(milliseconds);
thread.join();
thread.setPriority(value);
```

## 5. Example Program

```java
public class ThreadMethodsDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread t = new Thread(() -> System.out.println("Task done"));
        t.start();
        t.join(); // main thread waits for t to finish
        System.out.println("Main thread continues");
    }
}
```

**Output:**
```
Task done
Main thread continues
```

## 6. Key Points to Remember

- `sleep()` pauses the current thread for a given time, without releasing any locks it holds.
- `join()` makes the calling thread wait until the target thread finishes execution.
- Thread priority (`setPriority()`) is only a hint to the scheduler — it doesn't guarantee a strict execution order.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Multithreading  ▸  Synchronization
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$multithreading$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Synchronization$ti$, $sl$synchronization$sl$, $sd$Synchronization is a mechanism that ensures only one thread can access a particular block of code or resource at a time, preventing multiple threads from causing conflicting changes to shared data simultaneously.$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$multithreading/synchronization$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Synchronization?

Synchronization is a mechanism that ensures only one thread can access a particular block of code or resource at a time, preventing multiple threads from causing conflicting changes to shared data simultaneously.

## 2. Why is it used?

When multiple threads access and modify the same shared data (like a bank account balance) at the same time, it can lead to incorrect or corrupted results. Synchronization prevents this by allowing only one thread in at a time.

## 3. Real-Life Example

Think of a single-occupancy washroom with a lock. Only one person can go inside and lock the door at a time; others must wait outside until it's free. Synchronization enforces this same "one at a time" access to shared resources.

## 4. Syntax

```java
synchronized void methodName() {
    // only one thread can execute this at a time
}
```

## 5. Example Program

```java
class Counter {
    int count = 0;

    synchronized void increment() {
        count++;
    }
}

public class SynchronizationDemo {
    public static void main(String[] args) throws InterruptedException {
        Counter counter = new Counter();
        Runnable task = () -> {
            for (int i = 0; i < 1000; i++) counter.increment();
        };

        Thread t1 = new Thread(task);
        Thread t2 = new Thread(task);
        t1.start();
        t2.start();
        t1.join();
        t2.join();

        System.out.println("Final count: " + counter.count);
    }
}
```

**Output:**
```
Final count: 2000
```

## 6. Key Points to Remember

- The `synchronized` keyword can be applied to methods or specific blocks of code.
- Synchronization prevents data corruption but can slow down a program if overused, since threads must wait their turn.
- Without synchronization, shared data updated by multiple threads can produce unpredictable, incorrect results.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Multithreading  ▸  Deadlock
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$multithreading$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Deadlock$ti$, $sl$deadlock$sl$, $sd$A deadlock happens when two or more threads are stuck waiting forever for each other to release a resource, with neither thread able to proceed — resulting in the program freezing for those threads.$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$multithreading/deadlock$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Deadlock?

A deadlock happens when two or more threads are stuck waiting forever for each other to release a resource, with neither thread able to proceed — resulting in the program freezing for those threads.

## 2. Why is it used?

Understanding deadlocks isn't about "using" them intentionally — it's about recognizing how they happen so you can design your synchronized code to avoid this dangerous, frozen situation.

## 3. Real-Life Example

Think of two people, each holding one chopstick, both needing two chopsticks to eat. Person A refuses to give up their chopstick until they get the second one from Person B, and Person B does the same — neither ever eats, and both remain stuck forever.

## 4. Syntax

```java
// Deadlock typically arises from this kind of pattern:
synchronized(lockA) {
    synchronized(lockB) {
        // thread 1 does this
    }
}
// while another thread does:
synchronized(lockB) {
    synchronized(lockA) {
        // thread 2 does this - opposite order causes deadlock risk
    }
}
```

## 5. Example Program

```java
public class DeadlockDemo {
    public static void main(String[] args) {
        final Object lockA = new Object();
        final Object lockB = new Object();

        Thread t1 = new Thread(() -> {
            synchronized (lockA) {
                synchronized (lockB) {
                    System.out.println("Thread 1 acquired both locks");
                }
            }
        });

        Thread t2 = new Thread(() -> {
            synchronized (lockA) {
                synchronized (lockB) {
                    System.out.println("Thread 2 acquired both locks");
                }
            }
        });

        t1.start();
        t2.start();
    }
}
```

**Output:**
```
Thread 1 acquired both locks
Thread 2 acquired both locks
```
*(This particular example uses a consistent lock order and completes safely — deadlock risk arises specifically when different threads acquire the same locks in different, conflicting orders.)*

## 6. Key Points to Remember

- Deadlock commonly happens when multiple locks are acquired in different, inconsistent orders by different threads.
- A deadlocked program doesn't crash — it simply hangs forever for the affected threads.
- Always acquiring locks in the exact same, consistent order across all threads is a common way to avoid deadlocks.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Multithreading  ▸  Executor Framework
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$multithreading$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Executor Framework$ti$, $sl$executor-framework$sl$, $sd$The Executor Framework is a higher-level way of managing and running threads in Java, using a pool of reusable threads instead of manually creating and managing individual Thread objects yourself.$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$multithreading/executor-framework$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the Executor Framework?

The Executor Framework is a higher-level way of managing and running threads in Java, using a pool of reusable threads instead of manually creating and managing individual `Thread` objects yourself.

## 2. Why is it used?

Manually creating a new thread for every single task can be wasteful and hard to manage at scale. The Executor Framework reuses a fixed set of threads efficiently, handling task scheduling for you.

## 3. Real-Life Example

Think of a call center with a fixed number of staff (a thread pool) handling an incoming stream of customer calls (tasks), rather than hiring a brand-new employee for every single call and letting them go right after.

## 4. Syntax

```java
ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
executor.execute(runnableTask);
executor.shutdown();
```

## 5. Example Program

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ExecutorDemo {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(2);

        executor.execute(() -> System.out.println("Task 1 executed"));
        executor.execute(() -> System.out.println("Task 2 executed"));

        executor.shutdown();
    }
}
```

**Output:**
```
Task 1 executed
Task 2 executed
```

## 6. Key Points to Remember

- `ExecutorService` manages a pool of threads, reusing them for multiple tasks instead of creating new ones each time.
- Always call `shutdown()` once done submitting tasks, to allow the program to exit cleanly.
- The Executor Framework is generally preferred over manually managing individual threads in real-world applications.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Multithreading  ▸  Callable and Future
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$multithreading$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Callable and Future$ti$, $sl$callable-and-future$sl$, $sd$Callable is similar to Runnable, but its task can return a result and can throw a checked exception. Future represents the eventual result of a Callable task, which may still be running in the background when you first receive it.$sd$, 8,
    'published', true, true, 'java_tutorial', $sr$multithreading/callable-and-future$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Callable and Future?

`Callable` is similar to `Runnable`, but its task can return a result and can throw a checked exception. `Future` represents the eventual result of a `Callable` task, which may still be running in the background when you first receive it.

## 2. Why is it used?

`Runnable` cannot return a value, but many real tasks need to produce a result — like a calculation running in the background whose result you need later. `Callable` and `Future` together support this "run now, collect result later" pattern.

## 3. Real-Life Example

Think of placing an online order and receiving a tracking number (the `Future`) immediately, without waiting for the actual delivery. Later, you can check the tracking number to see if your order (the actual result) has arrived.

## 4. Syntax

```java
Callable<ResultType> task = () -> {
    return result;
};

Future<ResultType> future = executor.submit(task);
ResultType result = future.get(); // waits for and retrieves the result
```

## 5. Example Program

```java
import java.util.concurrent.*;

public class CallableFutureDemo {
    public static void main(String[] args) throws Exception {
        ExecutorService executor = Executors.newSingleThreadExecutor();

        Callable<Integer> task = () -> {
            return 10 * 10;
        };

        Future<Integer> future = executor.submit(task);
        System.out.println("Result: " + future.get());

        executor.shutdown();
    }
}
```

**Output:**
```
Result: 100
```

## 6. Key Points to Remember

- `Callable` returns a value; `Runnable` does not.
- `future.get()` blocks (waits) until the result is ready, unless you check `isDone()` first.
- `Callable` can throw checked exceptions, unlike `Runnable`'s `run()` method.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling & JDBC  ▸  File Handling
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$file-handling-and-jdbc$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$File Handling$ti$, $sl$file-handling$sl$, $sd$File handling refers to the ability of a Java program to create, read, write, and delete files stored on a computer's disk. Java provides the File class and related classes to work with files and folders.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$file-handling-and-jdbc/file-handling$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is File Handling?

File handling refers to the ability of a Java program to create, read, write, and delete files stored on a computer's disk. Java provides the `File` class and related classes to work with files and folders.

## 2. Why is it used?

Programs often need to save data permanently (so it's still available after the program closes) or read data that already exists on disk, like a configuration file or a saved report. File handling makes this possible.

## 3. Real-Life Example

Think of writing important notes in a physical notebook so you can refer back to them later, even after closing the notebook and putting it away. File handling lets a program "write in its notebook" and "read it back" whenever needed.

## 4. Syntax

```java
File file = new File("filename.txt");
boolean exists = file.exists();
```

## 5. Example Program

```java
import java.io.File;

public class FileHandlingDemo {
    public static void main(String[] args) {
        File file = new File("sample.txt");
        System.out.println("File exists: " + file.exists());
    }
}
```

**Output:**
```
File exists: false
```
*(Output depends on whether "sample.txt" actually exists in the program's folder.)*

## 6. Key Points to Remember

- The `File` class represents a file or folder path, but doesn't read or write content by itself — other classes handle that.
- Common file operations include checking existence, creating, deleting, and renaming.
- File paths can be relative (based on the current folder) or absolute (the complete path from the root).$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling & JDBC  ▸  InputStream and OutputStream
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$file-handling-and-jdbc$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$InputStream and OutputStream$ti$, $sl$inputstream-and-outputstream$sl$, $sd$InputStream and OutputStream are base classes used for reading and writing raw binary data (bytes), such as images, audio files, or any non-text data.$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$file-handling-and-jdbc/inputstream-and-outputstream$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are InputStream and OutputStream?

`InputStream` and `OutputStream` are base classes used for reading and writing raw binary data (bytes), such as images, audio files, or any non-text data.

## 2. Why is it used?

Not all data is plain text — files like images or videos are stored as raw bytes. `InputStream` and `OutputStream` (and their subclasses) provide the tools needed to read and write this kind of binary data correctly.

## 3. Real-Life Example

Think of a water pipe carrying water into a tank (`InputStream`, bringing data in) and another pipe carrying water out to a different location (`OutputStream`, sending data out). Data flows through these "pipes" one byte at a time.

## 4. Syntax

```java
InputStream in = new FileInputStream("file.dat");
OutputStream out = new FileOutputStream("output.dat");
```

## 5. Example Program

```java
import java.io.*;

public class StreamDemo {
    public static void main(String[] args) throws IOException {
        FileOutputStream out = new FileOutputStream("data.bin");
        out.write(65); // writes byte for letter 'A'
        out.close();

        FileInputStream in = new FileInputStream("data.bin");
        int data = in.read();
        System.out.println("Byte read: " + data);
        in.close();
    }
}
```

**Output:**
```
Byte read: 65
```

## 6. Key Points to Remember

- `InputStream`/`OutputStream` work with raw bytes, suitable for any type of file, including non-text files.
- Always close streams after use (or use try-with-resources) to release system resources properly.
- For plain text specifically, `Reader`/`Writer` classes (next topic) are usually a better, more convenient choice.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling & JDBC  ▸  Reader and Writer
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$file-handling-and-jdbc$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Reader and Writer$ti$, $sl$reader-and-writer$sl$, $sd$Reader and Writer are base classes designed specifically for handling character (text) data, rather than raw bytes. They handle text encoding details more conveniently than InputStream/OutputStream.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$file-handling-and-jdbc/reader-and-writer$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Reader and Writer?

`Reader` and `Writer` are base classes designed specifically for handling character (text) data, rather than raw bytes. They handle text encoding details more conveniently than `InputStream`/`OutputStream`.

## 2. Why is it used?

When working specifically with text files, `Reader` and `Writer` classes (like `FileReader` and `FileWriter`) are simpler and more appropriate, since they're designed to correctly interpret readable characters rather than raw binary bytes.

## 3. Real-Life Example

Think of reading a printed letter written in your own language, versus reading a strip of Morse code that needs decoding first. `Reader`/`Writer` work directly with readable text, while `InputStream`/`OutputStream` deal with raw, undecoded data.

## 4. Syntax

```java
Reader reader = new FileReader("file.txt");
Writer writer = new FileWriter("output.txt");
```

## 5. Example Program

```java
import java.io.*;

public class ReaderWriterDemo {
    public static void main(String[] args) throws IOException {
        FileWriter writer = new FileWriter("notes.txt");
        writer.write("Hello, Java file handling!");
        writer.close();

        FileReader reader = new FileReader("notes.txt");
        int character;
        StringBuilder content = new StringBuilder();
        while ((character = reader.read()) != -1) {
            content.append((char) character);
        }
        reader.close();

        System.out.println(content);
    }
}
```

**Output:**
```
Hello, Java file handling!
```

## 6. Key Points to Remember

- `Reader`/`Writer` are meant for character (text) data; `InputStream`/`OutputStream` are meant for raw byte data.
- `BufferedReader` and `BufferedWriter` are commonly wrapped around these for more efficient, line-based reading and writing.
- Always close readers and writers after use to avoid resource leaks.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling & JDBC  ▸  Serialization
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$file-handling-and-jdbc$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Serialization$ti$, $sl$serialization$sl$, $sd$Serialization is the process of converting a Java object into a stream of bytes, so it can be saved to a file, sent over a network, or stored for later use, while preserving the object's data.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$file-handling-and-jdbc/serialization$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Serialization?

Serialization is the process of converting a Java object into a stream of bytes, so it can be saved to a file, sent over a network, or stored for later use, while preserving the object's data.

## 2. Why is it used?

It allows an object's current state to be saved permanently, or transferred elsewhere, and later restored back into a usable object — useful for saving application data, session information, or sending objects between systems.

## 3. Real-Life Example

Think of packing a fully assembled piece of furniture into a flat, compact box for shipping, so it can be transported and later reassembled elsewhere. Serialization "packs" an object into a storable, transferable form.

## 4. Syntax

```java
class ClassName implements Serializable {
    // fields
}

ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream("data.ser"));
out.writeObject(objectName);
```

## 5. Example Program

```java
import java.io.*;

class Student implements Serializable {
    String name;
    int age;

    Student(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

public class SerializationDemo {
    public static void main(String[] args) throws IOException {
        Student s = new Student("Aditi", 21);

        ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream("student.ser"));
        out.writeObject(s);
        out.close();

        System.out.println("Object serialized successfully.");
    }
}
```

**Output:**
```
Object serialized successfully.
```

## 6. Key Points to Remember

- A class must implement the `Serializable` interface (a marker interface with no methods) to support serialization.
- Fields marked as `transient` are skipped during serialization and won't be saved.
- Serialized objects are typically saved with a `.ser` file extension by convention.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling & JDBC  ▸  Deserialization
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$file-handling-and-jdbc$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Deserialization$ti$, $sl$deserialization$sl$, $sd$Deserialization is the reverse of serialization — it converts a previously saved stream of bytes back into a usable Java object, restoring its original data.$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$file-handling-and-jdbc/deserialization$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Deserialization?

Deserialization is the reverse of serialization — it converts a previously saved stream of bytes back into a usable Java object, restoring its original data.

## 2. Why is it used?

Once an object has been serialized (saved), deserialization is needed to bring that saved data back into an actual, working object again, so the program can use it just like before.

## 3. Real-Life Example

Continuing the furniture example, deserialization is like unpacking that flat-packed box and reassembling the furniture back into its original, usable form.

## 4. Syntax

```java
ObjectInputStream in = new ObjectInputStream(new FileInputStream("data.ser"));
ClassName obj = (ClassName) in.readObject();
```

## 5. Example Program

```java
import java.io.*;

class Student implements Serializable {
    String name;
    int age;

    Student(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

public class DeserializationDemo {
    public static void main(String[] args) throws IOException, ClassNotFoundException {
        ObjectInputStream in = new ObjectInputStream(new FileInputStream("student.ser"));
        Student s = (Student) in.readObject();
        in.close();

        System.out.println("Name: " + s.name + ", Age: " + s.age);
    }
}
```

**Output:**
```
Name: Aditi, Age: 21
```
*(This assumes "student.ser" was already created using the serialization example above.)*

## 6. Key Points to Remember

- The class being deserialized must be available and match closely with the class used during serialization.
- `readObject()` requires a cast back to the original class type, since it returns a general `Object`.
- Mismatches between the saved object's class version and the current class definition can cause errors during deserialization.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling & JDBC  ▸  JDBC
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$file-handling-and-jdbc$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$JDBC$ti$, $sl$jdbc$sl$, $sd$JDBC (Java Database Connectivity) is an API that allows a Java program to connect to and interact with a relational database, like MySQL or PostgreSQL, to run queries and manage data.$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$file-handling-and-jdbc/jdbc$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is JDBC?

JDBC (Java Database Connectivity) is an API that allows a Java program to connect to and interact with a relational database, like MySQL or PostgreSQL, to run queries and manage data.

## 2. Why is it used?

Most real applications need to store and retrieve data from a database. JDBC provides a standard way for Java code to talk to different databases, without needing completely different code for each database type.

## 3. Real-Life Example

Think of a universal translator that lets you communicate with people speaking different languages, using one consistent method of translation. JDBC lets Java communicate with different databases using one consistent approach.

## 4. Syntax

```java
import java.sql.*;

Connection conn = DriverManager.getConnection(url, username, password);
```

## 5. Example Program

```java
import java.sql.*;

public class JdbcDemo {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/mydb", "root", "password"
            );
            System.out.println("Database connected successfully!");
            conn.close();
        } catch (SQLException e) {
            System.out.println("Connection failed: " + e.getMessage());
        }
    }
}
```

**Output:**
```
Database connected successfully!
```
*(Actual output depends on whether a real database with matching credentials is available.)*

## 6. Key Points to Remember

- JDBC requires a database-specific driver (like MySQL Connector/J) to actually connect to that database.
- The connection URL typically includes the database type, host, port, and database name.
- Always close database connections properly once done, to avoid wasting resources.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling & JDBC  ▸  Database Connection
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$file-handling-and-jdbc$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Database Connection$ti$, $sl$database-connection$sl$, $sd$A database connection represents an active link between your Java program and a specific database, established using JDBC, through which queries and commands can be sent.$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$file-handling-and-jdbc/database-connection$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Database Connection?

A database connection represents an active link between your Java program and a specific database, established using JDBC, through which queries and commands can be sent.

## 2. Why is it used?

Before any data can be read from or written to a database, a valid connection must be created first — it's the foundation on which all further database operations depend.

## 3. Real-Life Example

Think of dialing a phone call before you can actually speak to someone. The database connection is like that established call — without it, no conversation (data exchange) with the database can happen.

## 4. Syntax

```java
Connection conn = DriverManager.getConnection(url, username, password);
```

## 5. Example Program

```java
import java.sql.*;

public class ConnectionDemo {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/schooldb";
        try (Connection conn = DriverManager.getConnection(url, "root", "password")) {
            System.out.println("Connected to schooldb successfully!");
        } catch (SQLException e) {
            System.out.println("Connection error: " + e.getMessage());
        }
    }
}
```

**Output:**
```
Connected to schooldb successfully!
```

## 6. Key Points to Remember

- A connection should always be closed once you're done, either manually or using try-with-resources, as shown above.
- Connection details (URL, username, password) should be kept secure and are often stored outside the source code in real projects.
- A failed connection usually throws a `SQLException`, which should always be handled properly.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling & JDBC  ▸  Statement
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$file-handling-and-jdbc$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Statement$ti$, $sl$statement$sl$, $sd$Statement is a JDBC interface used to send simple SQL queries to a database and execute them, without any parameters that change between executions.$sd$, 8,
    'published', true, true, 'java_tutorial', $sr$file-handling-and-jdbc/statement$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Statement?

`Statement` is a JDBC interface used to send simple SQL queries to a database and execute them, without any parameters that change between executions.

## 2. Why is it used?

It's the most basic way to run SQL commands from Java — useful for simple, fixed queries where the SQL text itself doesn't need to change based on outside input.

## 3. Real-Life Example

Think of reading out a fixed, pre-written announcement exactly as written, every single time, without changing any part of it based on the audience. `Statement` works well for this kind of fixed, unchanging instruction.

## 4. Syntax

```java
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM students");
```

## 5. Example Program

```java
import java.sql.*;

public class StatementDemo {
    public static void main(String[] args) throws SQLException {
        Connection conn = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/schooldb", "root", "password"
        );
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT name FROM students");

        while (rs.next()) {
            System.out.println(rs.getString("name"));
        }
        conn.close();
    }
}
```

**Output:**
```
Aditi
Rohan
Sneha
```
*(Actual output depends on the real data present in the students table.)*

## 6. Key Points to Remember

- `Statement` is suitable only for fixed queries; it's not safe for queries built directly from user input.
- Directly inserting user input into a `Statement`'s SQL text can lead to SQL injection security risks.
- `PreparedStatement` (next topic) is the safer, recommended choice when input values are involved.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling & JDBC  ▸  PreparedStatement
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$file-handling-and-jdbc$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$PreparedStatement$ti$, $sl$preparedstatement$sl$, $sd$PreparedStatement is a JDBC interface used to run SQL queries that include placeholders (?) for values, which are filled in safely and separately from the SQL text itself.$sd$, 9,
    'published', true, true, 'java_tutorial', $sr$file-handling-and-jdbc/preparedstatement$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is PreparedStatement?

`PreparedStatement` is a JDBC interface used to run SQL queries that include placeholders (`?`) for values, which are filled in safely and separately from the SQL text itself.

## 2. Why is it used?

It protects against SQL injection attacks by keeping user-provided values separate from the actual SQL command structure, and it also allows the same query structure to be reused efficiently with different values.

## 3. Real-Life Example

Think of a fill-in-the-blanks form, like "Dear ____, your order number is ____," where the blanks are safely filled in with specific details each time, without altering the fixed structure of the form itself.

## 4. Syntax

```java
PreparedStatement pstmt = conn.prepareStatement("SELECT * FROM students WHERE id = ?");
pstmt.setInt(1, studentId);
ResultSet rs = pstmt.executeQuery();
```

## 5. Example Program

```java
import java.sql.*;

public class PreparedStatementDemo {
    public static void main(String[] args) throws SQLException {
        Connection conn = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/schooldb", "root", "password"
        );

        PreparedStatement pstmt = conn.prepareStatement(
            "SELECT name FROM students WHERE id = ?"
        );
        pstmt.setInt(1, 101);

        ResultSet rs = pstmt.executeQuery();
        while (rs.next()) {
            System.out.println(rs.getString("name"));
        }
        conn.close();
    }
}
```

**Output:**
```
Aditi
```
*(Actual output depends on the real data present for the given student id.)*

## 6. Key Points to Remember

- Placeholders (`?`) are filled in using methods like `setInt()`, `setString()`, matching the position number (starting from 1).
- `PreparedStatement` protects against SQL injection, unlike plain `Statement`.
- It's the generally recommended choice for real-world applications whenever queries involve external input.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling & JDBC  ▸  ResultSet
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$file-handling-and-jdbc$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$ResultSet$ti$, $sl$resultset$sl$, $sd$ResultSet represents the table of data returned after running a SQL query, like a SELECT statement. It lets you move through the returned rows and read column values one at a time.$sd$, 10,
    'published', true, true, 'java_tutorial', $sr$file-handling-and-jdbc/resultset$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is ResultSet?

`ResultSet` represents the table of data returned after running a SQL query, like a `SELECT` statement. It lets you move through the returned rows and read column values one at a time.

## 2. Why is it used?

After running a query, you need a way to actually access and use the returned data. `ResultSet` provides this row-by-row access to the results, along with methods to read specific columns by name or position.

## 3. Real-Life Example

Think of receiving a printed report after submitting a request, with each row representing one record, and columns holding specific details. `ResultSet` is how a Java program reads through this "report" one row at a time.

## 4. Syntax

```java
ResultSet rs = statement.executeQuery("SELECT * FROM table");
while (rs.next()) {
    String value = rs.getString("columnName");
}
```

## 5. Example Program

```java
import java.sql.*;

public class ResultSetDemo {
    public static void main(String[] args) throws SQLException {
        Connection conn = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/schooldb", "root", "password"
        );
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT name, age FROM students");

        while (rs.next()) {
            System.out.println(rs.getString("name") + " - " + rs.getInt("age"));
        }
        conn.close();
    }
}
```

**Output:**
```
Aditi - 21
Rohan - 22
```
*(Actual output depends on the real data present in the students table.)*

## 6. Key Points to Remember

- `rs.next()` moves the cursor to the next row and returns `false` once there are no more rows.
- Column values can be retrieved using column names (`getString("name")`) or column index positions.
- The cursor initially starts before the first row, so `next()` must be called at least once before reading any data.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling & JDBC  ▸  CRUD Operations
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$file-handling-and-jdbc$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$CRUD Operations$ti$, $sl$crud-operations$sl$, $sd$CRUD stands for Create, Read, Update, and Delete — the four basic operations performed on data stored in a database, corresponding to SQL commands INSERT, SELECT, UPDATE, and DELETE.$sd$, 11,
    'published', true, true, 'java_tutorial', $sr$file-handling-and-jdbc/crud-operations$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are CRUD Operations?

CRUD stands for Create, Read, Update, and Delete — the four basic operations performed on data stored in a database, corresponding to SQL commands `INSERT`, `SELECT`, `UPDATE`, and `DELETE`.

## 2. Why is it used?

Almost every application that uses a database needs to perform these four fundamental actions on its data — adding new records, viewing existing ones, modifying them, and removing them when no longer needed.

## 3. Real-Life Example

Think of managing a library's book records: adding a new book (Create), searching for a book (Read), updating a book's availability status (Update), and removing a book that's no longer part of the collection (Delete).

## 4. Syntax

```java
// Create
"INSERT INTO table (col1, col2) VALUES (?, ?)"
// Read
"SELECT * FROM table WHERE condition"
// Update
"UPDATE table SET col1 = ? WHERE condition"
// Delete
"DELETE FROM table WHERE condition"
```

## 5. Example Program

```java
import java.sql.*;

public class CrudDemo {
    public static void main(String[] args) throws SQLException {
        Connection conn = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/schooldb", "root", "password"
        );

        PreparedStatement insert = conn.prepareStatement(
            "INSERT INTO students (name, age) VALUES (?, ?)"
        );
        insert.setString(1, "Kabir");
        insert.setInt(2, 20);
        insert.executeUpdate();

        System.out.println("Student record created successfully.");
        conn.close();
    }
}
```

**Output:**
```
Student record created successfully.
```

## 6. Key Points to Remember

- `executeUpdate()` is used for `INSERT`, `UPDATE`, and `DELETE`; `executeQuery()` is used specifically for `SELECT`.
- CRUD forms the foundation of almost every data-driven application, from simple apps to large enterprise systems.
- Using `PreparedStatement` for all CRUD operations is the safer, recommended practice.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- File Handling & JDBC  ▸  Transactions
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$file-handling-and-jdbc$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Transactions$ti$, $sl$transactions$sl$, $sd$A transaction is a group of one or more database operations that are treated as a single unit — either all of them succeed together, or none of them are applied at all, keeping the data consistent.$sd$, 12,
    'published', true, true, 'java_tutorial', $sr$file-handling-and-jdbc/transactions$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is a Transaction?

A transaction is a group of one or more database operations that are treated as a single unit — either all of them succeed together, or none of them are applied at all, keeping the data consistent.

## 2. Why is it used?

Some operations depend on each other — like transferring money, which involves both deducting from one account and adding to another. A transaction ensures that if one part fails, the other part doesn't get applied either, avoiding inconsistent data.

## 3. Real-Life Example

Think of transferring money between two bank accounts. If money is deducted from one account but the system crashes before adding it to the other, the money would simply vanish. Transactions prevent this by ensuring both steps happen together, or neither does.

## 4. Syntax

```java
conn.setAutoCommit(false);
try {
    // multiple related operations
    conn.commit();
} catch (SQLException e) {
    conn.rollback();
}
```

## 5. Example Program

```java
import java.sql.*;

public class TransactionDemo {
    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/bankdb", "root", "password")) {

            conn.setAutoCommit(false);

            PreparedStatement debit = conn.prepareStatement(
                "UPDATE accounts SET balance = balance - 500 WHERE id = 1");
            PreparedStatement credit = conn.prepareStatement(
                "UPDATE accounts SET balance = balance + 500 WHERE id = 2");

            debit.executeUpdate();
            credit.executeUpdate();

            conn.commit();
            System.out.println("Transaction completed successfully.");

        } catch (SQLException e) {
            System.out.println("Transaction failed, changes rolled back.");
        }
    }
}
```

**Output:**
```
Transaction completed successfully.
```

## 6. Key Points to Remember

- `setAutoCommit(false)` must be set first to manually control when changes are actually saved.
- `commit()` permanently saves all changes made during the transaction; `rollback()` undoes them if something goes wrong.
- Transactions are essential for keeping data consistent whenever multiple related database changes must succeed or fail together.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- JVM Internals & Memory  ▸  JVM Architecture
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$jvm-internals-and-memory$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$JVM Architecture$ti$, $sl$jvm-architecture$sl$, $sd$JVM Architecture refers to the internal structure of the Java Virtual Machine — the different components that work together to load, verify, and execute Java bytecode.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$jvm-internals-and-memory/jvm-architecture$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is JVM Architecture?

JVM Architecture refers to the internal structure of the Java Virtual Machine — the different components that work together to load, verify, and execute Java bytecode. Major parts include the Class Loader, Runtime Data Areas (like Stack and Heap), and the Execution Engine.

## 2. Why is it used?

Understanding JVM architecture helps you know exactly what happens behind the scenes when your Java program runs — how classes get loaded into memory, where objects are stored, and how your code actually gets executed on the underlying machine.

## 3. Real-Life Example

Think of a large restaurant kitchen with different sections — one team receiving ingredients (Class Loader), separate storage areas for different ingredients (Runtime Data Areas), and chefs actually cooking the food (Execution Engine). Each part plays a specific role in producing the final dish.

## 4. Syntax

```java
// Not code - a conceptual structure:
// Class Loader -> Runtime Data Areas (Stack, Heap, Method Area) -> Execution Engine
```

## 5. Example Program

```java
public class JvmArchitectureDemo {
    public static void main(String[] args) {
        // When this program runs, the JVM loads this class,
        // allocates memory, and executes this method using its Execution Engine.
        System.out.println("Running inside the JVM");
    }
}
```

**Output:**
```
Running inside the JVM
```

## 6. Key Points to Remember

- The three major JVM components are: Class Loader, Runtime Data Areas, and Execution Engine.
- The Execution Engine includes the interpreter and the Just-In-Time (JIT) compiler, which speeds up repeated code execution.
- Understanding this architecture is very helpful for JVM-related interview questions and for understanding performance behaviour.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- JVM Internals & Memory  ▸  Stack
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$jvm-internals-and-memory$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Stack$ti$, $sl$stack$sl$, $sd$The Stack is a memory area used to store method calls and their local variables. Each time a method is called, a new block (called a stack frame) is added; when the method finishes, that block is removed.$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$jvm-internals-and-memory/stack$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the Stack (in JVM memory)?

The Stack is a memory area used to store method calls and their local variables. Each time a method is called, a new block (called a stack frame) is added; when the method finishes, that block is removed.

## 2. Why is it used?

The Stack keeps track of exactly where a program is during method execution, including local variables and the order in which methods must return, allowing correct and organized execution of nested method calls.

## 3. Real-Life Example

Think of a stack of plates in a cafeteria. The last plate placed on top is the first one picked up. Similarly, the most recently called method's data is stored on top of the Stack, and it's removed first once that method completes.

## 4. Syntax

```java
// Not directly written in code - managed automatically by the JVM
void methodA() {
    int x = 10; // stored in methodA's stack frame
    methodB();
}
```

## 5. Example Program

```java
public class StackDemo {
    static void methodB() {
        System.out.println("Inside methodB");
    }

    static void methodA() {
        System.out.println("Inside methodA");
        methodB();
    }

    public static void main(String[] args) {
        methodA();
    }
}
```

**Output:**
```
Inside methodA
Inside methodB
```

## 6. Key Points to Remember

- Each thread in Java gets its own separate Stack.
- Stack memory is automatically managed — memory is freed as soon as a method call finishes.
- Excessive recursive method calls can exhaust Stack memory, causing a `StackOverflowError`.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- JVM Internals & Memory  ▸  Heap
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$jvm-internals-and-memory$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Heap$ti$, $sl$heap$sl$, $sd$The Heap is the memory area where all Java objects are actually stored, whenever you use the new keyword to create them. Unlike the Stack, the Heap is shared across all threads in a program.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$jvm-internals-and-memory/heap$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the Heap (in JVM memory)?

The Heap is the memory area where all Java objects are actually stored, whenever you use the `new` keyword to create them. Unlike the Stack, the Heap is shared across all threads in a program.

## 2. Why is it used?

Objects generally need to exist beyond the lifetime of a single method call — they may be passed around, stored, and used across many different parts of a program. The Heap provides this more flexible, longer-lived storage.

## 3. Real-Life Example

Think of a shared warehouse where all finished products from different departments are stored together, accessible by multiple departments as needed, rather than each department keeping products only in their own private desk drawer.

## 4. Syntax

```java
ClassName obj = new ClassName(); // 'obj' reference is on Stack, actual object is in Heap
```

## 5. Example Program

```java
class Student {
    String name;
}

public class HeapDemo {
    public static void main(String[] args) {
        Student s = new Student(); // object created in Heap
        s.name = "Priya";
        System.out.println(s.name);
    }
}
```

**Output:**
```
Priya
```

## 6. Key Points to Remember

- All objects created with `new` are stored in the Heap, regardless of which method created them.
- The Heap is shared across all threads, unlike the Stack, which is separate for each thread.
- The Heap is managed by the Garbage Collector, which automatically removes objects no longer in use.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- JVM Internals & Memory  ▸  Garbage Collection
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$jvm-internals-and-memory$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Garbage Collection$ti$, $sl$garbage-collection$sl$, $sd$Garbage Collection is the automatic process by which Java identifies and removes objects from the Heap that are no longer being used by the program, freeing up memory without the programmer needing to manually delete them.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$jvm-internals-and-memory/garbage-collection$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Garbage Collection?

Garbage Collection is the automatic process by which Java identifies and removes objects from the Heap that are no longer being used by the program, freeing up memory without the programmer needing to manually delete them.

## 2. Why is it used?

In many other languages, developers must manually free memory, which can lead to mistakes like memory leaks or accessing memory that's already been freed. Java's automatic Garbage Collection removes this burden and reduces such memory-related bugs.

## 3. Real-Life Example

Think of a cleaning service that automatically removes unused, discarded items from a room, without you needing to manually take out the trash yourself every time something is no longer needed.

## 4. Syntax

```java
// Not directly called by the programmer in normal use
System.gc(); // requests garbage collection, though the JVM decides when it actually runs
```

## 5. Example Program

```java
public class GarbageCollectionDemo {
    public static void main(String[] args) {
        String data = new String("Temporary data");
        data = null; // object now has no references, eligible for garbage collection
        System.gc(); // requests JVM to run garbage collection
        System.out.println("Garbage collection requested.");
    }
}
```

**Output:**
```
Garbage collection requested.
```
*(Note: `System.gc()` is only a request — the JVM decides whether and when to actually run it.)*

## 6. Key Points to Remember

- An object becomes eligible for garbage collection once no part of the program holds a reference to it anymore.
- `System.gc()` only suggests garbage collection to the JVM; it doesn't force it to happen immediately.
- Garbage Collection removes the need for manual memory deallocation, unlike languages such as C/C++.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- JVM Internals & Memory  ▸  Garbage Collector
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$jvm-internals-and-memory$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Garbage Collector$ti$, $sl$garbage-collector$sl$, $sd$The Garbage Collector is the actual component within the JVM responsible for performing garbage collection — scanning the Heap, identifying unused objects, and reclaiming their memory.$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$jvm-internals-and-memory/garbage-collector$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is the Garbage Collector?

The Garbage Collector is the actual component within the JVM responsible for performing garbage collection — scanning the Heap, identifying unused objects, and reclaiming their memory.

## 2. Why is it used?

It's the mechanism that actually carries out the memory-cleanup process described in the previous topic, working automatically in the background as a Java program runs.

## 3. Real-Life Example

If garbage collection is "the process of cleaning," the Garbage Collector is "the cleaning staff" who actually does the physical work of removing waste from the building.

## 4. Syntax

```java
// The Garbage Collector runs automatically; no direct syntax to control its internal work
```

## 5. Example Program

```java
public class GarbageCollectorDemo {
    public static void main(String[] args) {
        for (int i = 0; i < 3; i++) {
            String temp = new String("Object " + i);
            System.out.println(temp + " created");
        }
        // Once this loop ends, these temporary objects become eligible
        // for cleanup by the Garbage Collector.
    }
}
```

**Output:**
```
Object 0 created
Object 1 created
Object 2 created
```

## 6. Key Points to Remember

- Java offers several types of Garbage Collectors (like G1, Serial, and Parallel Collector), each suited to different application needs.
- The Garbage Collector runs on its own schedule, decided internally by the JVM, not directly by the programmer.
- Programmers cannot force immediate garbage collection — `System.gc()` is only ever a suggestion, not a command.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- JVM Internals & Memory  ▸  Memory Management
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$jvm-internals-and-memory$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Memory Management$ti$, $sl$memory-management$sl$, $sd$Memory management refers to how Java allocates, uses, and frees up memory throughout a program's execution — covering both the Stack (for method calls) and the Heap (for objects), along with the automatic cleanup done by the Garbage Collect…$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$jvm-internals-and-memory/memory-management$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Memory Management (in Java)?

Memory management refers to how Java allocates, uses, and frees up memory throughout a program's execution — covering both the Stack (for method calls) and the Heap (for objects), along with the automatic cleanup done by the Garbage Collector.

## 2. Why is it used?

Efficient memory management ensures a program runs smoothly without running out of memory or slowing down due to unused objects piling up. Java handles most of this automatically, but understanding it helps developers write more memory-efficient code.

## 3. Real-Life Example

Think of managing space in a house — some areas are for temporary daily use (like a kitchen counter, similar to the Stack), while others are for longer-term storage (like a storeroom, similar to the Heap), and periodically, unused items are cleared out (Garbage Collection).

## 4. Syntax

```java
// Memory management in Java is largely automatic
// Developers influence it indirectly through good coding practices
```

## 5. Example Program

```java
public class MemoryManagementDemo {
    public static void main(String[] args) {
        int[] largeArray = new int[1000]; // allocated in Heap
        largeArray = null; // reference removed, memory becomes eligible for cleanup
        System.out.println("Array reference cleared.");
    }
}
```

**Output:**
```
Array reference cleared.
```

## 6. Key Points to Remember

- Java automatically manages memory allocation and cleanup, unlike languages requiring manual memory management.
- Setting unused object references to `null` can help the Garbage Collector identify them sooner.
- Poor coding practices (like keeping unnecessary references alive) can still cause memory-related issues, even with automatic management.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- JVM Internals & Memory  ▸  Class Loading
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$jvm-internals-and-memory$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Class Loading$ti$, $sl$class-loading$sl$, $sd$Class loading is the process by which the JVM locates, reads, and loads a compiled .class file into memory, making the class available for use when a program needs it.$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$jvm-internals-and-memory/class-loading$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Class Loading?

Class loading is the process by which the JVM locates, reads, and loads a compiled `.class` file into memory, making the class available for use when a program needs it.

## 2. Why is it used?

Java loads classes only when they are actually needed, rather than loading everything at once. This makes programs start faster and use memory more efficiently, only bringing in classes as the program actually requires them.

## 3. Real-Life Example

Think of a library that fetches a specific book from storage only when a reader actually requests it, rather than placing every single book from the storage room out on display shelves from day one.

## 4. Syntax

```java
// Class loading happens automatically when a class is first referenced
ClassName obj = new ClassName(); // triggers class loading if not already loaded
```

## 5. Example Program

```java
public class ClassLoadingDemo {
    public static void main(String[] args) {
        System.out.println("Main class loaded and running");
        Helper h = new Helper(); // Helper class gets loaded here, when first used
    }
}

class Helper {
    Helper() {
        System.out.println("Helper class loaded and object created");
    }
}
```

**Output:**
```
Main class loaded and running
Helper class loaded and object created
```

## 6. Key Points to Remember

- Classes are loaded lazily — only when first actually referenced or used in the program.
- Java uses a hierarchy of class loaders (Bootstrap, Platform, and Application class loaders) to load different categories of classes.
- Class loading happens automatically; developers rarely need to trigger it manually in typical applications.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Real-World Java & Best Practices  ▸  Maven
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$real-world-java-and-best-practices$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Maven$ti$, $sl$maven$sl$, $sd$Maven is a build automation and project management tool for Java projects. It manages a project's dependencies (external libraries), compiles code, runs tests, and packages the final application, all based on a single configuration file cal…$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$real-world-java-and-best-practices/maven$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Maven?

Maven is a build automation and project management tool for Java projects. It manages a project's dependencies (external libraries), compiles code, runs tests, and packages the final application, all based on a single configuration file called `pom.xml`.

## 2. Why is it used?

Real Java projects often depend on many external libraries. Manually downloading and managing all of them, along with their own dependencies, would be extremely tedious. Maven automates this entire process, along with the build steps needed to produce a working application.

## 3. Real-Life Example

Think of a restaurant that automatically orders all needed ingredients from suppliers based on a fixed recipe list, rather than someone manually visiting different markets to buy each ingredient separately. Maven manages a project's "ingredients" (dependencies) in a similar automated way.

## 4. Syntax

```xml
<!-- A basic pom.xml dependency entry -->
<dependency>
    <groupId>org.example</groupId>
    <artifactId>example-library</artifactId>
    <version>1.0.0</version>
</dependency>
```

## 5. Example Program

```
mvn compile     // compiles the project
mvn test        // runs tests
mvn package     // packages the project into a .jar file
```

**Output (for `mvn package`):**
```
BUILD SUCCESS
Total time: 3.245 s
```

## 6. Key Points to Remember

- `pom.xml` is the central configuration file where dependencies, plugins, and build settings are defined.
- Maven automatically downloads required libraries from a central repository, along with their own dependencies.
- Maven follows a standard project folder structure, making projects consistent and easier for other developers to understand.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Real-World Java & Best Practices  ▸  Java Project Structure
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$real-world-java-and-best-practices$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Java Project Structure$ti$, $sl$java-project-structure$sl$, $sd$Java Project Structure refers to the standard way folders and files are organized in a real Java project — typically separating source code, resources, tests, and compiled output into clearly defined folders.$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$real-world-java-and-best-practices/java-project-structure$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Java Project Structure?

Java Project Structure refers to the standard way folders and files are organized in a real Java project — typically separating source code, resources, tests, and compiled output into clearly defined folders.

## 2. Why is it used?

A consistent project structure makes it easy for any developer (or build tool like Maven) to know exactly where to find source code, configuration files, or test cases, without needing special instructions for every single project.

## 3. Real-Life Example

Think of a well-organized office building where every floor has a known purpose — reception on the ground floor, meeting rooms on the second floor, and so on. Anyone visiting for the first time can navigate it easily because the structure follows a common pattern.

## 4. Syntax

```
project-name/
 ├── src/
 │    └── main/
 │         ├── java/        (source code)
 │         └── resources/    (config files, etc.)
 │    └── test/
 │         └── java/         (test code)
 ├── pom.xml
```

## 5. Example Program

```java
// Example: src/main/java/com/example/App.java
package com.example;

public class App {
    public static void main(String[] args) {
        System.out.println("Project structure demo");
    }
}
```

**Output:**
```
Project structure demo
```

## 6. Key Points to Remember

- The `src/main/java` folder holds actual application source code; `src/test/java` holds test code.
- This structure is a widely followed convention, especially in Maven and Gradle-based projects.
- Following a standard structure makes it much easier to onboard new developers or integrate with build tools.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Real-World Java & Best Practices  ▸  Debugging
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$real-world-java-and-best-practices$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Debugging$ti$, $sl$debugging$sl$, $sd$Debugging is the process of finding and fixing errors (bugs) in a program by carefully examining its behaviour, often using tools that let you pause execution and inspect variable values step-by-step.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$real-world-java-and-best-practices/debugging$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Debugging?

Debugging is the process of finding and fixing errors (bugs) in a program by carefully examining its behaviour, often using tools that let you pause execution and inspect variable values step-by-step.

## 2. Why is it used?

Programs don't always behave as expected, and simply reading code isn't always enough to spot a problem. Debugging tools let you observe exactly what's happening while the program runs, making it much easier to locate the actual source of an issue.

## 3. Real-Life Example

Think of a mechanic using diagnostic tools to check exactly which part of a car engine is malfunctioning, instead of guessing based on the engine's external appearance alone. Debugging tools give this same kind of detailed internal insight into a running program.

## 4. Syntax

```java
// A breakpoint is typically set visually in an IDE, not written as code
// Print-based debugging is a simpler alternative:
System.out.println("Value of x: " + x);
```

## 5. Example Program

```java
public class DebuggingDemo {
    public static void main(String[] args) {
        int a = 10, b = 0;
        System.out.println("Before division"); // helps trace program flow
        try {
            int result = a / b;
        } catch (ArithmeticException e) {
            System.out.println("Caught an error: " + e.getMessage());
        }
    }
}
```

**Output:**
```
Before division
Caught an error: / by zero
```

## 6. Key Points to Remember

- IDEs like IntelliJ IDEA and Eclipse provide built-in debuggers with breakpoints, step-through execution, and variable inspection.
- Print statements are a simple, if less powerful, debugging technique useful for quick checks.
- Reading exception messages and stack traces carefully is often the fastest way to identify where a problem occurred.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Real-World Java & Best Practices  ▸  Exception Handling Best Practices
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$real-world-java-and-best-practices$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Exception Handling Best Practices$ti$, $sl$exception-handling-best-practices$sl$, $sd$These are recommended habits for handling exceptions properly in real projects — like catching specific exceptions rather than overly general ones, always logging meaningful error information, and avoiding empty catch blocks that silently h…$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$real-world-java-and-best-practices/exception-handling-best-practices$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Exception Handling Best Practices?

These are recommended habits for handling exceptions properly in real projects — like catching specific exceptions rather than overly general ones, always logging meaningful error information, and avoiding empty catch blocks that silently hide problems.

## 2. Why is it used?

Poor exception handling can hide real bugs, make debugging difficult, or cause a program to behave unpredictably after an error. Following good practices keeps error handling clear, useful, and safe.

## 3. Real-Life Example

Think of a proper incident report at a workplace, clearly describing what went wrong and when, versus simply ignoring an incident and pretending it never happened. Good exception handling ensures problems are recorded and addressed properly, not silently ignored.

## 4. Syntax

```java
try {
    // risky code
} catch (SpecificException e) {
    System.err.println("Specific error: " + e.getMessage());
    // proper handling or logging
}
```

## 5. Example Program

```java
public class BestPracticeDemo {
    public static void main(String[] args) {
        try {
            int[] numbers = {1, 2, 3};
            System.out.println(numbers[5]);
        } catch (ArrayIndexOutOfBoundsException e) {
            System.err.println("Invalid array access: " + e.getMessage());
        }
    }
}
```

**Output:**
```
Invalid array access: Index 5 out of bounds for length 3
```

## 6. Key Points to Remember

- Avoid catching the overly general `Exception` class unless truly necessary — catch specific exception types instead.
- Never leave a `catch` block completely empty — at least log the error, even if you can't fully handle it.
- Use `finally` (or try-with-resources) to reliably release resources like files or database connections.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Real-World Java & Best Practices  ▸  Java Coding Standards
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$real-world-java-and-best-practices$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Java Coding Standards$ti$, $sl$java-coding-standards$sl$, $sd$Java coding standards are widely accepted conventions for writing Java code consistently — including naming rules (like camelCase for variables, PascalCase for classes), indentation style, and code organization practices.$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$real-world-java-and-best-practices/java-coding-standards$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Java Coding Standards?

Java coding standards are widely accepted conventions for writing Java code consistently — including naming rules (like `camelCase` for variables, `PascalCase` for classes), indentation style, and code organization practices.

## 2. Why is it used?

Consistent coding standards make code easier to read, understand, and maintain, especially when multiple developers work on the same project together over time.

## 3. Real-Life Example

Think of standardized road signs that look and mean the same thing across an entire country, so any driver can understand them instantly, regardless of which city they're in. Coding standards provide this same kind of shared understanding across a codebase.

## 4. Syntax

```java
// Class names: PascalCase
class StudentRecord { }

// Variable and method names: camelCase
int totalMarks;
void calculateAverage() { }

// Constants: UPPERCASE with underscores
final int MAX_LIMIT = 100;
```

## 5. Example Program

```java
public class CodingStandardsDemo {
    static final int MAX_STUDENTS = 50;

    public static void main(String[] args) {
        int totalStudents = 30;
        System.out.println("Total students: " + totalStudents + " out of " + MAX_STUDENTS);
    }
}
```

**Output:**
```
Total students: 30 out of 50
```

## 6. Key Points to Remember

- Class names typically use PascalCase (e.g., `StudentRecord`); variables and methods use camelCase (e.g., `totalMarks`).
- Constants are usually written in uppercase with underscores (e.g., `MAX_LIMIT`).
- Consistent formatting and naming make code significantly easier for teams to read and maintain over time.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Real-World Java & Best Practices  ▸  Common Java Mistakes
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$real-world-java-and-best-practices$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Common Java Mistakes$ti$, $sl$common-java-mistakes$sl$, $sd$These are frequent errors beginners (and even experienced developers) make while writing Java code — like confusing == with .equals() for comparing objects, forgetting to close resources, or misunderstanding array indexing.$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$real-world-java-and-best-practices/common-java-mistakes$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What are Common Java Mistakes?

These are frequent errors beginners (and even experienced developers) make while writing Java code — like confusing `==` with `.equals()` for comparing objects, forgetting to close resources, or misunderstanding array indexing.

## 2. Why is it used?

Being aware of these common pitfalls in advance helps you avoid them altogether, or at least recognize and fix them quickly when they do occur, saving significant debugging time.

## 3. Real-Life Example

Think of commonly known mistakes new drivers make, like forgetting to check blind spots. Knowing about these common mistakes in advance helps a new driver actively watch out for them and avoid accidents.

## 4. Syntax

```java
// Common mistake: comparing objects with ==
String a = new String("Java");
String b = new String("Java");
System.out.println(a == b); // false, even though content is the same

// Correct way:
System.out.println(a.equals(b)); // true
```

## 5. Example Program

```java
public class CommonMistakesDemo {
    public static void main(String[] args) {
        String a = new String("Java");
        String b = new String("Java");

        System.out.println("Using ==: " + (a == b));
        System.out.println("Using equals(): " + a.equals(b));
    }
}
```

**Output:**
```
Using ==: false
Using equals(): true
```

## 6. Key Points to Remember

- Always use `.equals()` to compare the content of objects like `String`, and reserve `==` for comparing primitive values or checking if two references point to the exact same object.
- Forgetting to close resources (files, database connections) can cause resource leaks over time.
- Off-by-one errors (like looping one time too many or too few) are among the most common beginner mistakes with loops and arrays.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Real-World Java & Best Practices  ▸  Clean Code Basics
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$real-world-java-and-best-practices$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Clean Code Basics$ti$, $sl$clean-code-basics$sl$, $sd$Clean code refers to code that is easy to read, understand, and maintain — using meaningful names, small focused methods, consistent formatting, and avoiding unnecessary complexity.$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$real-world-java-and-best-practices/clean-code-basics$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## 1. What is Clean Code?

Clean code refers to code that is easy to read, understand, and maintain — using meaningful names, small focused methods, consistent formatting, and avoiding unnecessary complexity.

## 2. Why is it used?

Code is read far more often than it is written. Clean code saves significant time and effort for anyone (including your future self) who needs to understand, fix, or extend it later.

## 3. Real-Life Example

Think of a well-organized recipe with clear, simple steps written in order, versus a messy recipe with steps scattered randomly and unclear instructions. A clean recipe is far easier to follow correctly — clean code offers this same clarity for programmers.

## 4. Syntax

```java
// Unclear naming
int d;

// Clean, meaningful naming
int daysRemaining;
```

## 5. Example Program

```java
public class CleanCodeDemo {
    static int calculateTotalPrice(int quantity, double pricePerItem) {
        return (int) (quantity * pricePerItem);
    }

    public static void main(String[] args) {
        int totalPrice = calculateTotalPrice(3, 250.0);
        System.out.println("Total Price: " + totalPrice);
    }
}
```

**Output:**
```
Total Price: 750
```

## 6. Key Points to Remember

- Use meaningful, descriptive names for variables and methods, rather than short, unclear abbreviations.
- Keep methods small and focused on doing just one clear task.
- Consistent formatting, spacing, and organization make code significantly easier for others (and yourself) to read later.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Practice Programs  ▸  Beginner Java Programs
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$practice-programs$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Beginner Java Programs$ti$, $sl$beginner-java-programs$sl$, $sd$These are the classic small programs every Java learner should be comfortable writing from scratch. They build confidence with loops, conditionals, and basic logic before moving to bigger topics.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$practice-programs/beginner-java-programs$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## Why practice these?

These are the classic small programs every Java learner should be comfortable writing from scratch. They build confidence with loops, conditionals, and basic logic before moving to bigger topics.

### Program 1: Check if a Number is Even or Odd

```java
public class EvenOdd {
    public static void main(String[] args) {
        int number = 15;
        if (number % 2 == 0) {
            System.out.println(number + " is even");
        } else {
            System.out.println(number + " is odd");
        }
    }
}
```

**Output:**
```
15 is odd
```

### Program 2: Find the Factorial of a Number

```java
public class Factorial {
    public static void main(String[] args) {
        int number = 5;
        int factorial = 1;
        for (int i = 1; i <= number; i++) {
            factorial *= i;
        }
        System.out.println("Factorial of " + number + " is " + factorial);
    }
}
```

**Output:**
```
Factorial of 5 is 120
```

### Program 3: Check if a Number is Prime

```java
public class PrimeCheck {
    public static void main(String[] args) {
        int number = 29;
        boolean isPrime = true;

        if (number <= 1) {
            isPrime = false;
        } else {
            for (int i = 2; i <= Math.sqrt(number); i++) {
                if (number % i == 0) {
                    isPrime = false;
                    break;
                }
            }
        }
        System.out.println(number + " is prime: " + isPrime);
    }
}
```

**Output:**
```
29 is prime: true
```

## Key Points to Remember

- Start with small, self-contained programs before attempting larger multi-class projects.
- Practicing the same type of problem in a few different ways builds stronger logic-building skills.
- These beginner programs are frequently asked in college assignments and entry-level interviews.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Practice Programs  ▸  Pattern Programs
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$practice-programs$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Pattern Programs$ti$, $sl$pattern-programs$sl$, $sd$Pattern programs build strong control over nested loops, which is a skill used throughout more advanced programming, including grid-based logic and 2D array processing.$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$practice-programs/pattern-programs$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## Why practice these?

Pattern programs build strong control over nested loops, which is a skill used throughout more advanced programming, including grid-based logic and 2D array processing.

### Program 1: Right-Angled Triangle of Stars

```java
public class TrianglePattern {
    public static void main(String[] args) {
        int rows = 5;
        for (int i = 1; i <= rows; i++) {
            for (int j = 1; j <= i; j++) {
                System.out.print("*");
            }
            System.out.println();
        }
    }
}
```

**Output:**
```
*
**
***
****
*****
```

### Program 2: Number Pyramid

```java
public class NumberPyramid {
    public static void main(String[] args) {
        int rows = 4;
        for (int i = 1; i <= rows; i++) {
            for (int j = 1; j <= i; j++) {
                System.out.print(j + " ");
            }
            System.out.println();
        }
    }
}
```

**Output:**
```
1 
1 2 
1 2 3 
1 2 3 4 
```

### Program 3: Inverted Star Triangle

```java
public class InvertedTriangle {
    public static void main(String[] args) {
        int rows = 4;
        for (int i = rows; i >= 1; i--) {
            for (int j = 1; j <= i; j++) {
                System.out.print("*");
            }
            System.out.println();
        }
    }
}
```

**Output:**
```
****
***
**
*
```

## Key Points to Remember

- Pattern programs almost always use a nested loop — an outer loop for rows and an inner loop for columns.
- Practicing patterns strengthens the ability to trace through nested loop logic manually, step by step.
- Common variations include triangles, pyramids, diamonds, and number/character-based patterns.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Practice Programs  ▸  Array Programs
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$practice-programs$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Array Programs$ti$, $sl$array-programs$sl$, $sd$Array-based problems are common in interviews and help build a strong understanding of indexing, traversal, and basic algorithms like searching and sorting.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$practice-programs/array-programs$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## Why practice these?

Array-based problems are common in interviews and help build a strong understanding of indexing, traversal, and basic algorithms like searching and sorting.

### Program 1: Find the Largest Element in an Array

```java
public class LargestElement {
    public static void main(String[] args) {
        int[] numbers = {12, 45, 7, 89, 34};
        int largest = numbers[0];

        for (int num : numbers) {
            if (num > largest) {
                largest = num;
            }
        }
        System.out.println("Largest element: " + largest);
    }
}
```

**Output:**
```
Largest element: 89
```

### Program 2: Reverse an Array

```java
public class ReverseArray {
    public static void main(String[] args) {
        int[] numbers = {1, 2, 3, 4, 5};

        for (int i = numbers.length - 1; i >= 0; i--) {
            System.out.print(numbers[i] + " ");
        }
    }
}
```

**Output:**
```
5 4 3 2 1 
```

### Program 3: Sum of Array Elements

```java
public class ArraySum {
    public static void main(String[] args) {
        int[] numbers = {10, 20, 30, 40};
        int sum = 0;

        for (int num : numbers) {
            sum += num;
        }
        System.out.println("Sum: " + sum);
    }
}
```

**Output:**
```
Sum: 100
```

## Key Points to Remember

- Enhanced for-each loops (`for (int num : array)`) are convenient for simply reading through array elements.
- Array-based problems (finding max/min, reversing, sorting) are extremely common in coding interviews.
- Always be careful with index boundaries to avoid `ArrayIndexOutOfBoundsException`.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Practice Programs  ▸  String Programs
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$practice-programs$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$String Programs$ti$, $sl$string-programs$sl$, $sd$String manipulation problems are among the most frequently asked in interviews, and practicing them builds comfort with Java's built-in String methods.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$practice-programs/string-programs$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## Why practice these?

String manipulation problems are among the most frequently asked in interviews, and practicing them builds comfort with Java's built-in `String` methods.

### Program 1: Check if a String is a Palindrome

```java
public class PalindromeCheck {
    public static void main(String[] args) {
        String text = "madam";
        String reversed = new StringBuilder(text).reverse().toString();

        System.out.println("Is palindrome: " + text.equals(reversed));
    }
}
```

**Output:**
```
Is palindrome: true
```

### Program 2: Count Vowels in a String

```java
public class CountVowels {
    public static void main(String[] args) {
        String text = "Java Programming";
        int count = 0;

        for (char ch : text.toLowerCase().toCharArray()) {
            if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') {
                count++;
            }
        }
        System.out.println("Vowel count: " + count);
    }
}
```

**Output:**
```
Vowel count: 5
```

### Program 3: Reverse Each Word in a Sentence

```java
public class ReverseWords {
    public static void main(String[] args) {
        String sentence = "Java is fun";
        String[] words = sentence.split(" ");
        StringBuilder result = new StringBuilder();

        for (String word : words) {
            result.append(new StringBuilder(word).reverse()).append(" ");
        }
        System.out.println(result.toString().trim());
    }
}
```

**Output:**
```
avaJ si nuf
```

## Key Points to Remember

- `StringBuilder`'s `reverse()` method is a quick way to reverse text without writing manual loop logic.
- `split()` is commonly used to break a sentence into individual words for processing.
- String problems are among the most common topics in coding interviews, so regular practice pays off.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Practice Programs  ▸  OOP Programs
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$practice-programs$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$OOP Programs$ti$, $sl$oop-programs$sl$, $sd$Practicing small OOP-based programs helps solidify concepts like inheritance, polymorphism, and encapsulation in a practical, hands-on way.$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$practice-programs/oop-programs$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## Why practice these?

Practicing small OOP-based programs helps solidify concepts like inheritance, polymorphism, and encapsulation in a practical, hands-on way.

### Program 1: Simple Inheritance Example

```java
class Employee {
    String name = "Employee";
    void work() {
        System.out.println(name + " is working");
    }
}

class Manager extends Employee {
    Manager() {
        name = "Manager";
    }
}

public class InheritancePractice {
    public static void main(String[] args) {
        Manager m = new Manager();
        m.work();
    }
}
```

**Output:**
```
Manager is working
```

### Program 2: Runtime Polymorphism Example

```java
class Shape {
    void area() {
        System.out.println("Calculating area of a shape");
    }
}

class Circle extends Shape {
    void area() {
        System.out.println("Calculating area of a circle");
    }
}

public class PolymorphismPractice {
    public static void main(String[] args) {
        Shape shape = new Circle();
        shape.area();
    }
}
```

**Output:**
```
Calculating area of a circle
```

### Program 3: Encapsulation with Getters and Setters

```java
class BankAccount {
    private double balance = 0;

    void deposit(double amount) {
        if (amount > 0) balance += amount;
    }

    double getBalance() {
        return balance;
    }
}

public class EncapsulationPractice {
    public static void main(String[] args) {
        BankAccount account = new BankAccount();
        account.deposit(1500);
        System.out.println("Balance: " + account.getBalance());
    }
}
```

**Output:**
```
Balance: 1500.0
```

## Key Points to Remember

- Practicing small OOP programs is the best way to internalize how classes, objects, and inheritance actually behave.
- Try modifying these programs (adding new subclasses or fields) to deepen your understanding further.
- OOP-based coding questions are extremely common in interviews for freshers and experienced developers alike.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Practice Programs  ▸  Collection Programs
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$practice-programs$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Collection Programs$ti$, $sl$collection-programs$sl$, $sd$Working with lists, sets, and maps hands-on is the best way to become comfortable with the Collection Framework for real projects and interviews.$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$practice-programs/collection-programs$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## Why practice these?

Working with lists, sets, and maps hands-on is the best way to become comfortable with the Collection Framework for real projects and interviews.

### Program 1: Remove Duplicates from a List Using a Set

```java
import java.util.*;

public class RemoveDuplicates {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 2, 3, 4, 4, 5);
        Set<Integer> uniqueNumbers = new LinkedHashSet<>(numbers);

        System.out.println(uniqueNumbers);
    }
}
```

**Output:**
```
[1, 2, 3, 4, 5]
```

### Program 2: Count Word Frequency Using a Map

```java
import java.util.*;

public class WordFrequency {
    public static void main(String[] args) {
        String[] words = {"apple", "banana", "apple", "orange", "banana", "apple"};
        Map<String, Integer> frequency = new HashMap<>();

        for (String word : words) {
            frequency.put(word, frequency.getOrDefault(word, 0) + 1);
        }
        System.out.println(frequency);
    }
}
```

**Output:**
```
{banana=2, orange=1, apple=3}
```

### Program 3: Sort a List of Names Alphabetically

```java
import java.util.*;

public class SortNames {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>(Arrays.asList("Riya", "Aman", "Karan"));
        Collections.sort(names);
        System.out.println(names);
    }
}
```

**Output:**
```
[Aman, Karan, Riya]
```

## Key Points to Remember

- `getOrDefault()` is a handy `HashMap` method for counting occurrences without extra null-checking code.
- Converting a `List` into a `Set` is a quick, common way to remove duplicates.
- `Collections.sort()` is the standard way to sort a `List` using its natural ordering.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Practice Programs  ▸  Exception Handling Programs
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$practice-programs$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Exception Handling Programs$ti$, $sl$exception-handling-programs$sl$, $sd$Practicing exception handling scenarios builds confidence in writing safe, robust code that doesn't crash unexpectedly on bad input or unusual conditions.$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$practice-programs/exception-handling-programs$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## Why practice these?

Practicing exception handling scenarios builds confidence in writing safe, robust code that doesn't crash unexpectedly on bad input or unusual conditions.

### Program 1: Handle Division by Zero Safely

```java
import java.util.Scanner;

public class SafeDivision {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter numerator: ");
        int a = sc.nextInt();
        System.out.print("Enter denominator: ");
        int b = sc.nextInt();

        try {
            System.out.println("Result: " + (a / b));
        } catch (ArithmeticException e) {
            System.out.println("Error: Cannot divide by zero.");
        }
    }
}
```

**Output (when denominator entered is 0):**
```
Enter numerator: 10
Enter denominator: 0
Error: Cannot divide by zero.
```

### Program 2: Custom Exception for Invalid Age

```java
class InvalidAgeException extends Exception {
    InvalidAgeException(String message) {
        super(message);
    }
}

public class AgeValidation {
    static void validateAge(int age) throws InvalidAgeException {
        if (age < 0 || age > 120) {
            throw new InvalidAgeException("Age must be between 0 and 120");
        }
        System.out.println("Valid age: " + age);
    }

    public static void main(String[] args) {
        try {
            validateAge(150);
        } catch (InvalidAgeException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
```

**Output:**
```
Error: Age must be between 0 and 120
```

## Key Points to Remember

- Always validate user input before processing it, especially for values that could cause runtime exceptions.
- Custom exceptions make error messages clearer and more specific to your application's actual rules.
- Practicing multiple `catch` blocks for different exception types builds confidence in handling varied error scenarios.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Practice Programs  ▸  Multithreading Programs
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$practice-programs$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Multithreading Programs$ti$, $sl$multithreading-programs$sl$, $sd$Multithreading can feel abstract at first — hands-on practice with simple thread examples helps make the concept concrete.$sd$, 8,
    'published', true, true, 'java_tutorial', $sr$practice-programs/multithreading-programs$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## Why practice these?

Multithreading can feel abstract at first — hands-on practice with simple thread examples helps make the concept concrete.

### Program 1: Two Threads Printing Simultaneously

```java
class NumberPrinter extends Thread {
    public void run() {
        for (int i = 1; i <= 3; i++) {
            System.out.println(Thread.currentThread().getName() + ": " + i);
        }
    }
}

public class MultipleThreadsDemo {
    public static void main(String[] args) {
        NumberPrinter t1 = new NumberPrinter();
        NumberPrinter t2 = new NumberPrinter();
        t1.start();
        t2.start();
    }
}
```

**Output (order may vary between runs):**
```
Thread-0: 1
Thread-1: 1
Thread-0: 2
Thread-1: 2
Thread-0: 3
Thread-1: 3
```

### Program 2: Using Runnable with a Lambda

```java
public class RunnableLambdaDemo {
    public static void main(String[] args) {
        Runnable task = () -> System.out.println("Task executed by: " + Thread.currentThread().getName());
        Thread t = new Thread(task);
        t.start();
    }
}
```

**Output:**
```
Task executed by: Thread-0
```

## Key Points to Remember

- Thread execution order is not guaranteed — running the same program twice may show a different interleaving of output.
- Practicing with small thread examples helps build intuition before tackling synchronization and thread pools.
- Using lambda expressions with `Runnable` is a common, concise style in modern Java code.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Practice Programs  ▸  JDBC Programs
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$practice-programs$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$JDBC Programs$ti$, $sl$jdbc-programs$sl$, $sd$Practicing JDBC operations end-to-end helps connect the concepts (Connection, Statement, ResultSet) covered earlier into a complete, working flow.$sd$, 9,
    'published', true, true, 'java_tutorial', $sr$practice-programs/jdbc-programs$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## Why practice these?

Practicing JDBC operations end-to-end helps connect the concepts (Connection, Statement, ResultSet) covered earlier into a complete, working flow.

### Program 1: Insert and Retrieve a Record

```java
import java.sql.*;

public class JdbcPractice {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/schooldb";

        try (Connection conn = DriverManager.getConnection(url, "root", "password")) {
            PreparedStatement insert = conn.prepareStatement(
                "INSERT INTO students (name, age) VALUES (?, ?)"
            );
            insert.setString(1, "Meera");
            insert.setInt(2, 21);
            insert.executeUpdate();

            PreparedStatement select = conn.prepareStatement(
                "SELECT name, age FROM students WHERE name = ?"
            );
            select.setString(1, "Meera");
            ResultSet rs = select.executeQuery();

            while (rs.next()) {
                System.out.println(rs.getString("name") + " - " + rs.getInt("age"));
            }

        } catch (SQLException e) {
            System.out.println("Database error: " + e.getMessage());
        }
    }
}
```

**Output:**
```
Meera - 21
```
*(Requires a real, running database with a matching table for actual execution.)*

## Key Points to Remember

- Practicing a complete insert-then-read flow ties together Connection, PreparedStatement, and ResultSet in one working example.
- Always wrap JDBC code in try-catch (or try-with-resources) to handle potential `SQLException`s gracefully.
- Testing JDBC code requires an actual running database instance with matching table structures.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Practice Programs  ▸  Mini Projects
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$practice-programs$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Mini Projects$ti$, $sl$mini-projects$sl$, $sd$Small, complete projects combine multiple concepts together — control flow, OOP, collections, and sometimes file handling — giving you practical, portfolio-worthy experience.$sd$, 10,
    'published', true, true, 'java_tutorial', $sr$practice-programs/mini-projects$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$## Why practice these?

Small, complete projects combine multiple concepts together — control flow, OOP, collections, and sometimes file handling — giving you practical, portfolio-worthy experience.

### Mini Project Idea 1: Simple Student Management System (Console-Based)

A console application where a user can add a student's name and marks, store them in an `ArrayList` of `Student` objects, and display all records.

```java
import java.util.*;

class Student {
    String name;
    int marks;

    Student(String name, int marks) {
        this.name = name;
        this.marks = marks;
    }
}

public class StudentManagementDemo {
    public static void main(String[] args) {
        List<Student> students = new ArrayList<>();
        students.add(new Student("Aarav", 88));
        students.add(new Student("Divya", 92));

        for (Student s : students) {
            System.out.println(s.name + ": " + s.marks);
        }
    }
}
```

**Output:**
```
Aarav: 88
Divya: 92
```

### Mini Project Idea 2: Simple Banking System (Console-Based)

A console application simulating deposit and withdrawal operations on a single account, using encapsulation to protect the balance field.

```java
class BankAccount {
    private double balance = 0;

    void deposit(double amount) {
        balance += amount;
        System.out.println("Deposited: " + amount);
    }

    void withdraw(double amount) {
        if (amount <= balance) {
            balance -= amount;
            System.out.println("Withdrawn: " + amount);
        } else {
            System.out.println("Insufficient balance!");
        }
    }

    double getBalance() {
        return balance;
    }
}

public class BankingSystemDemo {
    public static void main(String[] args) {
        BankAccount account = new BankAccount();
        account.deposit(2000);
        account.withdraw(500);
        System.out.println("Final Balance: " + account.getBalance());
    }
}
```

**Output:**
```
Deposited: 2000.0
Withdrawn: 500.0
Final Balance: 1500.0
```

## Key Points to Remember

- Mini projects are a great way to combine OOP, collections, and control flow into one complete, working application.
- Starting with console-based projects (before adding a GUI or database) keeps the learning focus on core logic.
- Once comfortable, these mini projects can be extended further — adding file storage, JDBC persistence, or basic validation.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Interview Preparation  ▸  Core Java Interview Questions
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$interview-preparation$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Core Java Interview Questions$ti$, $sl$core-java-interview-questions$sl$, $sd$JVM runs bytecode, JRE is the JVM plus libraries needed to run programs, and JDK is the JRE plus development tools like the compiler. In short: JDK is for developers; JRE is for running Java programs; JVM is the actual execution engine.$sd$, 1,
    'published', true, true, 'java_tutorial', $sr$interview-preparation/core-java-interview-questions$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$**Q1. What is the difference between JDK, JRE, and JVM?**
JVM runs bytecode, JRE is the JVM plus libraries needed to run programs, and JDK is the JRE plus development tools like the compiler. In short: JDK is for developers; JRE is for running Java programs; JVM is the actual execution engine.

**Q2. Why is Java called platform-independent?**
Because Java code compiles into bytecode, which can run on any device that has a JVM installed, without needing to recompile the code separately for each operating system.

**Q3. What is the difference between `==` and `.equals()`?**
`==` checks whether two references point to the exact same object in memory. `.equals()` checks whether the actual content of two objects is the same, which is usually what you want when comparing values like `String`s.

**Q4. What is the difference between method overloading and method overriding?**
Overloading means multiple methods with the same name but different parameters in the same class, resolved at compile-time. Overriding means a subclass provides its own version of a method already defined in its parent class, resolved at runtime.

**Q5. Why are Strings immutable in Java?**
Immutability makes `String` objects safe to share across multiple parts of a program (including the String Pool) without risk of one part accidentally changing a value another part depends on. It also supports thread safety and enables the memory-saving String Pool mechanism.

**Q6. What is the difference between `ArrayList` and `LinkedList`?**
`ArrayList` offers faster access by index but slower insertions/deletions in the middle. `LinkedList` offers faster insertions/deletions but slower index-based access, since it must traverse node by node.

**Q7. What is the purpose of the `final` keyword?**
`final` prevents changes: a `final` variable can't be reassigned, a `final` method can't be overridden, and a `final` class can't be extended.

**Q8. What is autoboxing and unboxing?**
Autoboxing is the automatic conversion of a primitive type into its corresponding wrapper class object (e.g., `int` to `Integer`). Unboxing is the reverse conversion, back from wrapper to primitive.

## Key Points to Remember

- These core questions are almost always asked in the first round of any Java interview.
- Practice explaining these answers out loud, in your own words, not just reading them silently.
- Interviewers often ask a quick follow-up code example after a conceptual answer, so be ready to write a short snippet too.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Interview Preparation  ▸  OOP Interview Questions
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$interview-preparation$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$OOP Interview Questions$ti$, $sl$oop-interview-questions$sl$, $sd$Encapsulation, Inheritance, Polymorphism, and Abstraction.$sd$, 2,
    'published', true, true, 'java_tutorial', $sr$interview-preparation/oop-interview-questions$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$**Q1. What are the four main pillars of OOP?**
Encapsulation, Inheritance, Polymorphism, and Abstraction.

**Q2. What is the difference between an abstract class and an interface?**
An abstract class can have both implemented and abstract methods, along with constructors and fields, but supports only single inheritance. An interface traditionally only declares methods (though modern Java allows default/static methods) and a class can implement multiple interfaces at once.

**Q3. Can a constructor be inherited in Java?**
No, constructors are not inherited by subclasses. However, a subclass constructor can call a parent's constructor using `super()`.

**Q4. Why doesn't Java support multiple inheritance of classes?**
To avoid the "Diamond Problem," where ambiguity would arise if a class inherited the same method from two different parent classes. Java instead achieves similar flexibility using interfaces.

**Q5. What is runtime polymorphism, and how does it work internally?**
Runtime polymorphism occurs through method overriding, where the actual method called depends on the real object type, not the reference type, decided at the moment the program runs.

**Q6. Why do we use encapsulation if we could just use public fields directly?**
Encapsulation allows adding validation logic in setters, restricts direct external modification of internal data, and makes it easier to change internal implementation later without breaking external code that depends on the class.

**Q7. What happens if a subclass doesn't implement all abstract methods of its parent abstract class?**
The subclass must then also be declared `abstract` itself; otherwise, it results in a compile-time error.

## Key Points to Remember

- OOP questions often ask you to explain a concept AND write a small supporting code example — practice both together.
- Interviewers commonly ask "why" a design choice exists (like why Java avoids multiple inheritance), not just "what" it is.
- Be ready to compare related concepts directly, like abstract class vs interface, or overloading vs overriding.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Interview Preparation  ▸  Collections Interview Questions
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$interview-preparation$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Collections Interview Questions$ti$, $sl$collections-interview-questions$sl$, $sd$List maintains order and allows duplicates. Set does not allow duplicates and generally doesn't guarantee order. Map stores data as unique key-value pairs.$sd$, 3,
    'published', true, true, 'java_tutorial', $sr$interview-preparation/collections-interview-questions$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$**Q1. What is the difference between `List`, `Set`, and `Map`?**
`List` maintains order and allows duplicates. `Set` does not allow duplicates and generally doesn't guarantee order. `Map` stores data as unique key-value pairs.

**Q2. What is the difference between `HashMap` and `TreeMap`?**
`HashMap` offers fast access but no guaranteed order. `TreeMap` keeps its entries sorted by key automatically, at the cost of somewhat slower performance.

**Q3. What is the difference between `Comparable` and `Comparator`?**
`Comparable` defines a single, natural sorting order within the class itself, using `compareTo()`. `Comparator` defines sorting logic externally, allowing multiple different sort orders for the same class.

**Q4. Why is `HashSet` faster than `TreeSet`?**
`HashSet` uses a hash-based internal structure for quick access without maintaining any order, while `TreeSet` must maintain sorted order at all times, requiring extra comparison work on every insertion.

**Q5. Can a `HashMap` have a `null` key?**
Yes, `HashMap` allows exactly one `null` key and any number of `null` values. `TreeMap`, however, does not allow a `null` key.

**Q6. What is the difference between `Iterator` and a simple for-each loop?**
An `Iterator` allows safe removal of elements while looping through a collection, using its own `remove()` method. A simple for-each loop does not support safely modifying the collection during iteration.

## Key Points to Remember

- Collections questions frequently compare two similar classes (`ArrayList` vs `LinkedList`, `HashMap` vs `TreeMap`) — always know the key trade-off.
- Be ready to explain when you'd choose one collection over another, based on actual use-case needs.
- Practice writing small code snippets using these collections, since interviewers often ask you to code, not just explain.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Interview Preparation  ▸  Exception Handling Interview Questions
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$interview-preparation$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Exception Handling Interview Questions$ti$, $sl$exception-handling-interview-questions$sl$, $sd$Checked exceptions are verified by the compiler at compile-time and must be either handled or declared using throws. Unchecked exceptions extend RuntimeException and are not checked by the compiler.$sd$, 4,
    'published', true, true, 'java_tutorial', $sr$interview-preparation/exception-handling-interview-questions$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$**Q1. What is the difference between checked and unchecked exceptions?**
Checked exceptions are verified by the compiler at compile-time and must be either handled or declared using `throws`. Unchecked exceptions extend `RuntimeException` and are not checked by the compiler.

**Q2. What is the difference between `throw` and `throws`?**
`throw` is used inside a method to actually trigger a specific exception object. `throws` is used in a method's signature to declare that the method might produce a certain type of exception.

**Q3. Does the `finally` block always execute?**
Yes, `finally` executes whether or not an exception occurred, and even if the `try` block contains a `return` statement (with rare exceptions, like if the JVM itself shuts down abruptly).

**Q4. Can you have a try block without a catch block?**
Yes, as long as it has a `finally` block. A `try` block must be followed by at least one `catch`, or a `finally`, or both.

**Q5. What is a custom exception, and why would you create one?**
A custom exception is a user-defined exception class, usually extending `Exception` or `RuntimeException`, created to represent a specific error condition relevant to your application's own business logic more clearly than a generic built-in exception would.

**Q6. What happens if an exception is thrown but never caught?**
The program terminates abruptly, and the JVM prints a stack trace describing the exception and where it occurred.

## Key Points to Remember

- Interviewers often ask you to trace through code involving nested try-catch-finally blocks — practice this carefully.
- Understand exactly when `finally` runs, even with early `return` statements inside `try` or `catch`.
- Be ready to explain real scenarios where you'd create a custom exception in a real project.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Interview Preparation  ▸  Multithreading Interview Questions
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$interview-preparation$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Multithreading Interview Questions$ti$, $sl$multithreading-interview-questions$sl$, $sd$A process is an independent running program with its own memory space. A thread is a smaller unit of execution within a process, and multiple threads within the same process share that process's memory.$sd$, 5,
    'published', true, true, 'java_tutorial', $sr$interview-preparation/multithreading-interview-questions$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$**Q1. What is the difference between a process and a thread?**
A process is an independent running program with its own memory space. A thread is a smaller unit of execution within a process, and multiple threads within the same process share that process's memory.

**Q2. What is the difference between extending `Thread` and implementing `Runnable`?**
Extending `Thread` uses up your one allowed class inheritance in Java. Implementing `Runnable` keeps your class free to extend some other class as well, making it generally the more flexible choice.

**Q3. What is synchronization, and why is it needed?**
Synchronization ensures only one thread can access a particular block of code or shared resource at a time, preventing data corruption when multiple threads try to modify shared data simultaneously.

**Q4. What is a deadlock?**
A deadlock occurs when two or more threads are stuck waiting indefinitely for each other to release a resource, causing the program to freeze for those threads.

**Q5. What is the difference between `Runnable` and `Callable`?**
`Runnable`'s `run()` method returns nothing and cannot throw a checked exception. `Callable`'s `call()` method can return a result and can throw checked exceptions.

**Q6. What does the `join()` method do?**
It makes the calling thread wait until the thread it's called on has finished executing, before continuing further.

## Key Points to Remember

- Multithreading questions often test conceptual understanding through short scenario-based questions, like "what happens if two threads do X at the same time?"
- Be ready to explain the difference between `sleep()` and `wait()` if asked, even though `wait()` wasn't covered in earlier modules — it's a common follow-up.
- Practice explaining deadlock with a simple, clear real-life analogy, since interviewers often ask for one.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Interview Preparation  ▸  JVM Interview Questions
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$interview-preparation$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$JVM Interview Questions$ti$, $sl$jvm-interview-questions$sl$, $sd$The main areas include the Stack (for method calls and local variables), the Heap (for objects), and the Method Area (for class-level data like static fields and method code).$sd$, 6,
    'published', true, true, 'java_tutorial', $sr$interview-preparation/jvm-interview-questions$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$**Q1. What are the main memory areas managed by the JVM?**
The main areas include the Stack (for method calls and local variables), the Heap (for objects), and the Method Area (for class-level data like static fields and method code).

**Q2. What is the difference between Stack and Heap memory?**
Stack memory stores method calls and local variables, and is separate for each thread. Heap memory stores actual objects, and is shared across all threads in the program.

**Q3. What causes a `StackOverflowError`?**
It usually happens due to excessive or infinite recursive method calls, which keep adding new stack frames until the Stack's limited memory is exhausted.

**Q4. What is Garbage Collection, and can a programmer force it to run?**
Garbage Collection automatically removes objects from the Heap that are no longer referenced by the program. A programmer can only request it using `System.gc()`, but the JVM decides whether and when it actually runs — it cannot be forced directly.

**Q5. What is Class Loading?**
It's the process by which the JVM locates and loads a compiled `.class` file into memory, done lazily — only when a class is actually first referenced in the running program.

## Key Points to Remember

- JVM questions test whether you understand what actually happens "under the hood" when a Java program runs.
- Be ready to explain the journey from source code to execution: Compilation → Bytecode → Class Loading → Execution.
- Understanding Stack vs Heap clearly is one of the most frequently tested JVM concepts.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Interview Preparation  ▸  Java Coding Interview Questions
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$interview-preparation$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Java Coding Interview Questions$ti$, $sl$java-coding-interview-questions$sl$, $sd$Java Coding Interview Questions — Core Java.$sd$, 7,
    'published', true, true, 'java_tutorial', $sr$interview-preparation/java-coding-interview-questions$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$*A few short coding problems commonly asked in interviews, with solutions.*

**Q1. Write a program to swap two numbers without using a third variable.**

```java
public class SwapNumbers {
    public static void main(String[] args) {
        int a = 5, b = 10;
        a = a + b;
        b = a - b;
        a = a - b;
        System.out.println("a = " + a + ", b = " + b);
    }
}
```

**Output:**
```
a = 10, b = 5
```

**Q2. Write a program to check if a string contains only digits.**

```java
public class DigitCheck {
    public static void main(String[] args) {
        String text = "12345";
        boolean allDigits = text.matches("[0-9]+");
        System.out.println("Contains only digits: " + allDigits);
    }
}
```

**Output:**
```
Contains only digits: true
```

**Q3. Write a program to find the second largest number in an array.**

```java
public class SecondLargest {
    public static void main(String[] args) {
        int[] numbers = {12, 45, 7, 89, 34};
        int largest = Integer.MIN_VALUE, secondLargest = Integer.MIN_VALUE;

        for (int num : numbers) {
            if (num > largest) {
                secondLargest = largest;
                largest = num;
            } else if (num > secondLargest && num != largest) {
                secondLargest = num;
            }
        }
        System.out.println("Second largest: " + secondLargest);
    }
}
```

**Output:**
```
Second largest: 45
```

## Key Points to Remember

- Practice writing these solutions by hand, without an IDE's auto-complete, to simulate real whiteboard or online interview conditions.
- Always consider edge cases out loud during an interview (empty arrays, negative numbers, duplicate values).
- Interviewers often ask you to explain the time complexity of your solution after writing it.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Interview Preparation  ▸  Core Java MCQs
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$interview-preparation$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Core Java MCQs$ti$, $sl$core-java-mcqs$sl$, $sd$Core Java MCQs — Core Java.$sd$, 8,
    'published', true, true, 'java_tutorial', $sr$interview-preparation/core-java-mcqs$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$**1. What is the default value of a boolean variable in Java?**
a) true
b) false
c) 0
d) null

**Answer: b) false**

**2. Which of these is not a primitive data type in Java?**
a) int
b) float
c) String
d) char

**Answer: c) String**

**3. Which keyword is used to inherit a class in Java?**
a) implements
b) extends
c) inherits
d) super

**Answer: b) extends**

**4. Which method is the entry point of a Java program?**
a) start()
b) run()
c) main()
d) init()

**Answer: c) main()**

**5. Which collection class does not allow duplicate elements?**
a) ArrayList
b) LinkedList
c) HashSet
d) Vector

**Answer: c) HashSet**

**6. What does JVM stand for?**
a) Java Virtual Machine
b) Java Variable Method
c) Java Verified Machine
d) Java Virtual Method

**Answer: a) Java Virtual Machine**

**7. Which of these is used to handle exceptions in Java?**
a) if-else
b) try-catch
c) switch
d) for loop

**Answer: b) try-catch**

**8. Which keyword prevents a class from being inherited?**
a) static
b) private
c) final
d) protected

**Answer: c) final**

**9. Which of these allows multiple inheritance-like behaviour in Java?**
a) Abstract class
b) Interface
c) Constructor
d) Enum

**Answer: b) Interface**

**10. Which memory area stores Java objects?**
a) Stack
b) Heap
c) Method Area
d) Register

**Answer: b) Heap**

## Key Points to Remember

- MCQ rounds usually test quick recall of definitions and keywords rather than deep reasoning.
- Reviewing all module summaries (topic "Key Points" sections) is a fast way to prepare for this kind of round.
- Practice a timed mock MCQ round before a real interview to build speed and confidence.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();

-- Interview Preparation  ▸  Interview Revision Notes
with g as (select id from public.learning_grids where lower(slug) = 'java-tutorial'),
sec as (select s.id from public.learning_sections s join g on s.grid_id = g.id where s.slug = $sg$interview-preparation$sg$),
up_topic as (
  insert into public.learning_topics
    (grid_id, section_id, title, slug, short_description, sort_order,
     status, show_on_website, show_on_mobile, source_kind, source_ref)
  select g.id, sec.id, $ti$Interview Revision Notes$ti$, $sl$interview-revision-notes$sl$, $sd$Interview Revision Notes — Core Java.$sd$, 9,
    'published', true, true, 'java_tutorial', $sr$interview-preparation/interview-revision-notes$sr$
  from g, sec
  on conflict (source_kind, source_ref) where source_kind is not null and source_ref is not null
  do update set
    title = excluded.title,
    short_description = excluded.short_description,
    section_id = excluded.section_id,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning id
)
insert into public.learning_contents
  (topic_id, heading, body, content_format, metadata, status, sort_order)
select up_topic.id, '', $md$*A quick, compact revision summary across all modules — ideal for a final review right before an interview.*

**Fundamentals:** JDK = development tools + JRE. JRE = libraries + JVM. JVM runs bytecode. Java is platform-independent because of bytecode + JVM.

**Operators & Control Flow:** `==` compares values (or references for objects); `.equals()` compares object content. `switch` needs `break` to avoid fall-through. `do-while` always runs at least once.

**Arrays & Strings:** Arrays have a fixed size; array indexing starts at 0. Strings are immutable. `StringBuilder` is mutable and faster for repeated modifications; `StringBuffer` is the thread-safe version.

**OOP:** Four pillars: Encapsulation, Inheritance, Polymorphism, Abstraction. Overloading = same name, different parameters, compile-time. Overriding = same signature in subclass, runtime. Interfaces support multiple inheritance-like behaviour; classes support only single inheritance.

**Packages & Exceptions:** Checked exceptions are verified at compile-time; unchecked extend `RuntimeException`. `finally` always runs. Custom exceptions extend `Exception` or `RuntimeException`.

**Collections:** `List` allows duplicates and keeps order. `Set` disallows duplicates. `Map` stores key-value pairs. `HashMap` is fast but unordered; `TreeMap` is sorted; `LinkedHashMap` preserves insertion order.

**Advanced Concepts:** Wrapper classes let primitives be used as objects. Generics add compile-time type safety. Lambda expressions implement functional interfaces concisely. Streams process collections declaratively.

**Multithreading:** Threads allow concurrent execution. `synchronized` prevents data corruption from simultaneous access. Deadlock happens when threads wait on each other forever. Executor Framework manages thread pools efficiently.

**JVM & Memory:** Stack stores method calls (per-thread); Heap stores objects (shared). Garbage Collection is automatic and cannot be forced, only requested.

**Real-World Practices:** Maven manages dependencies and builds. Use `.equals()`, not `==`, for object comparison. Keep methods small, names meaningful, and catch blocks never empty.

## Key Points to Remember

- Use this page as your final five-minute review before walking into an interview.
- If any single line here feels unclear, go back to that specific module for a fuller explanation before your interview.
- Confidence in explaining these points out loud, in your own words, matters more than memorizing them word-for-word.$md$, 'markdown',
  jsonb_build_object('source', 'java_tutorial_seed', 'content_type', 'article'),
  'published', 0
from up_topic
on conflict (topic_id) where (metadata ->> 'source') = 'java_tutorial_seed'
do update set body = excluded.body, content_format = excluded.content_format, updated_at = now();


-- ===========================================================================
-- 5. VALIDATION — raise (never silently pass) if the import is short.
-- ===========================================================================
do $val$
declare v_g uuid; v_sec int; v_top int; v_con int;
begin
  select id into v_g from public.learning_grids where lower(slug) = 'java-tutorial';
  if v_g is null then raise exception 'java seed: grid java-tutorial missing after seed'; end if;
  select count(*) into v_sec from public.learning_sections where grid_id = v_g;
  select count(*) into v_top from public.learning_topics
    where grid_id = v_g and source_kind = 'java_tutorial';
  select count(*) into v_con from public.learning_contents c
    join public.learning_topics t on t.id = c.topic_id
   where t.grid_id = v_g and (c.metadata ->> 'source') = 'java_tutorial_seed';
  if v_sec < 14 then raise exception 'java seed: expected >= 14 sections, got %', v_sec; end if;
  if v_top <> 150 then raise exception 'java seed: expected 150 topics, got %', v_top; end if;
  if v_con <> 150 then raise exception 'java seed: expected 150 content blocks, got %', v_con; end if;
  raise notice 'java seed OK: grid %, % sections, % topics, % content blocks', v_g, v_sec, v_top, v_con;
end
$val$;

notify pgrst, 'reload schema';
