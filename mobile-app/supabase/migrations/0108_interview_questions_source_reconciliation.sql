-- mobile-app/supabase/migrations/0108_interview_questions_source_reconciliation.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/080_interview_questions_source_reconciliation.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — Java Interview Questions, source reconciliation
-- (mobile 0108_interview_questions_source_reconciliation.sql  ==
--  admin 080_interview_questions_source_reconciliation.sql below this header
--  — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Reconciles the Java Interview Questions bank (0104-0107 / 076-079) against
--   its real source of truth — the original 240-entry "Java Interview Master
--   Guide" — after an audit found the batch content had drifted from it:
--
--     * The guide has 240 numbered entries but only 121 UNIQUE questions;
--       entries 122-240 are the guide's own "interview variation 2-5" of a
--       30-question subset (Q92-Q121) and were never seeded — nothing to do
--       there.
--     * Of the 216 rows batches 1-4 seeded, only 81 of the 121 unique source
--       questions were actually represented: 60 exact, 12 rewritten (scope
--       broadened beyond the single source question — left as-is here, out of
--       scope for this migration), 4 rows each silently merging 2 source
--       questions (Q9+10, Q38+39, Q97+98, Q109+110), and source Q84 ("abstract
--       class vs interface?") duplicated across 3 rows. 137 of the 216 rows
--       were original content with no source-guide equivalent at all (11 of
--       them being the *entire* SQL + Java topic — the source guide has no
--       SQL+Java scenario section), and 40 unique source questions were
--       missing entirely.
--
--   This migration makes the PUBLIC bank exactly the 121 unique source
--   questions, without touching schema/RLS/RPCs, by:
--
--     1. Adding 5 topics the missing questions need (Spring, Spring Boot,
--        JPA / Hibernate, REST API, Advanced Java) — only these 5; no
--        Scenario-Based topic, since the source has no scenario questions.
--     2. Rewriting the 4 merged rows to hold just their FIRST source question
--        (literal source text), then inserting the SECOND source question as
--        a new row — 4 merged rows -> 8 individual source rows.
--     3. Inserting the 40 missing source questions verbatim (question/answer/
--        example/important point copied from the guide; only whitespace and
--        code-fence-language formatting normalized for the DB column
--        convention — no content invented or reworded).
--     4. Consolidating source Q84 to ONE row (java-abstract-classes-06, the
--        fullest source-faithful version) and ARCHIVING its two duplicate/
--        derivative rows (java-interfaces-09, java-abstract-classes-09).
--     5. ARCHIVING (not deleting) the 137 original rows that have no source
--        equivalent, using the existing `status` column
--        (draft/published/archived) — no schema change. `archived` rows stay
--        fully visible and editable in the admin Interview Questions module
--        (its queries have no default status filter) and stay fully excluded
--        from the public site (the `*_select_public` RLS policies only
--        allow status = 'published'). Nothing is destroyed; this is
--        reversible by flipping status back to 'published'.
--     6. ARCHIVING the SQL + Java topic itself (java-sql-and-java) — every one
--        of its 11 questions was non-source content, so after step 5 it would
--        be a published topic with 0 published questions: a dead-end page and
--        a broken card on the topic grid. Archiving the topic (same
--        reversible status mechanism) removes it from the grid and from
--        prev/next navigation without deleting anything.
--
--   Net effect: 216 rows -> 260 question rows; 121 are `published` (exactly
--   Q1-Q121 of the source guide, one row each) and 139 are `archived` (137
--   non-source + 2 retired Q84 duplicates). 20 topics -> 25 topics; 24 are
--   `published` (19 original + 5 new) and 1 is `archived` (SQL + Java).
--   Batch-1..4 schema, RLS, and RPCs (0103/075) are untouched. The 60
--   exact-match and 12 rewritten-but-single-source rows from batches 1-4 are
--   untouched by this migration.
--
--   A full row-by-row audit (source Q# -> topic -> DB id -> match type) was
--   produced during the review pass; see JAVA_INTERVIEW_RECONCILIATION_AUDIT.md.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -------------------------------------------------------
do $$
begin
  if to_regclass('public.interview_categories') is null
     or to_regclass('public.interview_topics') is null
     or to_regclass('public.interview_questions') is null then
    raise exception '0108/080: interview_categories/topics/questions not found — apply 0103_interview_questions.sql (admin 075) first.';
  end if;
  if not exists (select 1 from public.interview_topics where id = 'java-sql-and-java') then
    raise exception '0108/080: java-sql-and-java topic not found — apply batches 1-4 (0104-0107 / 076-079) first.';
  end if;
end $$;

-- ===========================================================================
-- ===========================================================================
-- 1. NEW TOPICS — Spring, Spring Boot, JPA/Hibernate, REST API, Advanced Java
--    (only created because source questions Q75-Q81 and Q86-Q121 subset need them)
-- ===========================================================================
insert into public.interview_topics (id, category_id, name, slug, description, sort_order)
values
  ('java-spring', 'java', 'Spring', 'spring',
   'Core Spring Framework ideas — dependency injection, inversion of control, and building loosely coupled components.', 210),
  ('java-spring-boot', 'java', 'Spring Boot', 'spring-boot',
   'Spring Boot fundamentals — auto-configuration on top of Spring, and building REST controllers quickly.', 220),
  ('java-jpa-hibernate', 'java', 'JPA / Hibernate', 'jpa-hibernate',
   'Object-relational mapping in Java — the JPA specification and its most common implementation, Hibernate.', 230),
  ('java-rest-api', 'java', 'REST API', 'rest-api',
   'REST API fundamentals for Java backends — resources, HTTP verbs, and stateless design.', 240),
  ('java-advanced-java', 'java', 'Advanced Java', 'advanced-java',
   'Object class internals, varargs, initializer blocks, type conversions, wrapper classes, and modern Java language features from records to text blocks.', 250)
on conflict (id) do update set
  category_id = excluded.category_id, name = excluded.name, slug = excluded.slug,
  description = excluded.description, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. SPLIT MERGED ROWS BACK TO INDIVIDUAL SOURCE QUESTIONS (Q9/10, Q38/39, Q97/98, Q109/110)
--    2a. First half: replace merged content on the existing row with the literal
--        single source question it now represents (id/topic/sort_order/difficulty kept).
-- ===========================================================================
update public.interview_questions set
  question = $q$What is the main method in Java?$q$,
  answer = $a$The main method is the conventional entry point used by the Java launcher to start an application: `public static void main(String[] args)`.

`public` makes it accessible to the launcher, `static` means an object is not required, `void` means it returns no value, and `String[] args` receives command-line arguments.$a$,
  example = $ex$```java
public static void main(String[] args) {
    System.out.println("Start");
}
```

Output: `Start`$ex$,
  important_point = $ip$The parameter can also be written as `String... args`.$ip$,
  updated_at = now()
where id = 'java-core-java-09';

update public.interview_questions set
  question = $q$What is ArrayList?$q$,
  answer = $a$`ArrayList` is a resizable array implementation of the `List` interface. It provides fast indexed reads and is commonly used when reads are frequent and middle insertions are not dominant.

It grows automatically as elements are added.$a$,
  example = $ex$```java
List<String> names = new ArrayList<>();
names.add("A");
names.add("B");
System.out.println(names.get(0));
```$ex$,
  important_point = $ip$Removing or inserting elements in the middle can require shifting later elements.$ip$,
  updated_at = now()
where id = 'java-collections-04';

update public.interview_questions set
  question = $q$Can static methods be overridden?$q$,
  answer = $a$No. Static methods belong to the class and are hidden when a subclass declares a static method with the same signature.

The method chosen depends on the reference/class type rather than runtime object polymorphism.$a$,
  example = $ex$```java
class A { static void show() {} }
class B extends A { static void show() {} }
```$ex$,
  important_point = $ip$Calling a static method through an object reference is legal in some cases but discouraged because it can confuse readers.$ip$,
  updated_at = now()
where id = 'java-polymorphism-08';

update public.interview_questions set
  question = $q$What is composition?$q$,
  answer = $a$Composition means building a class using objects of other classes rather than inheriting their implementation.

It is useful when one object "has a" component and the relationship should be replaceable or loosely coupled.$a$,
  example = $ex$```java
class Car {
    private final Engine engine = new Engine();
}
```$ex$,
  important_point = $ip$Composition often gives more flexibility than inheritance, but the correct choice depends on the domain.$ip$,
  updated_at = now()
where id = 'java-oop-05';

-- ===========================================================================
-- 3. RESTORE 40 MISSING SOURCE QUESTIONS + 3. SPLIT SECOND HALVES (Q10, Q39, Q98, Q110)
--    All content below is copied verbatim from the source guide (whitespace/
--    fence-language normalized only); nothing here is generated.
-- ===========================================================================
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
  ('java-core-java-14','java-core-java',
   $q$What is package?$q$,
   $a$A package groups related Java types and creates a namespace that helps organize code and control package-private access.

Packages reduce naming conflicts and help structure applications by feature or layer.$a$,
   $ex$```java
package com.example.service;
```$ex$,
   $ip$Package-private members are accessible to types in the same package.$ip$,
   'Easy', 14),
  ('java-core-java-15','java-core-java',
   $q$What is pass-by-value in Java?$q$,
   $a$Java is always pass-by-value. For an object variable, the value being passed is a copy of the reference, so a method can change the referenced object's state but cannot replace the caller's reference itself.

This distinction explains many confusing object-parameter examples.$a$,
   $ex$```java
static void change(List<Integer> list) {
    list.add(10); // changes the same object
}
```$ex$,
   $ip$Never describe Java as pass-by-reference.$ip$,
   'Medium', 15),
  ('java-classes-objects-11','java-classes-objects',
   $q$What is this keyword?$q$,
   $a$`this` refers to the current object inside an instance context. It is commonly used to distinguish fields from parameters and to call another constructor.

It improves clarity when constructor or method parameters have the same names as fields.$a$,
   $ex$```java
class User {
    String name;
    User(String name) {
        this.name = name;
    }
}
```$ex$,
   $ip$`this()` can call another constructor, and it must be the first statement in that constructor.$ip$,
   'Easy', 11),
  ('java-classes-objects-12','java-classes-objects',
   $q$What is static?$q$,
   $a$`static` declares a member that belongs to the class rather than to each individual object.

Static fields are useful for class-level shared state, and static methods are useful when behavior does not require an object instance.$a$,
   $ex$```java
class Counter {
    static int count = 0;
    Counter() { count++; }
}
```$ex$,
   $ip$A static method cannot directly access an instance field because no particular object is implied.$ip$,
   'Easy', 12),
  ('java-classes-objects-13','java-classes-objects',
   $q$What is static block?$q$,
   $a$A static initializer block runs when the class is initialized, subject to the JVM's class-initialization rules.

It can initialize complex static state, although normal field initialization is often clearer.$a$,
   $ex$```java
class Config {
    static int value;
    static { value = 100; }
}
```$ex$,
   $ip$Static initialization occurs once per class initialization in a given class loader context.$ip$,
   'Medium', 13),
  ('java-classes-objects-14','java-classes-objects',
   $q$What is instance initializer block?$q$,
   $a$An instance initializer block runs during object construction as part of initializing an instance, in the order it appears relative to field initializers and constructors.

It is legal but less common than putting initialization directly in constructors or field initializers.$a$,
   $ex$```java
class Demo {
    { System.out.println("instance init"); }
    Demo() { System.out.println("constructor"); }
}
```$ex$,
   $ip$For maintainability, avoid initializer blocks when ordinary constructors or field initialization are clearer.$ip$,
   'Medium', 14),
  ('java-inheritance-12','java-inheritance',
   $q$What is final?$q$,
   $a$`final` prevents further change depending on where it is used. A final variable cannot be reassigned, a final method cannot be overridden, and a final class cannot be extended.

It is useful when a value or design contract should not be changed by later code.$a$,
   $ex$```java
final int MAX = 100;
```$ex$,
   $ip$A final reference cannot point to another object, but the referenced object's internal state may still be mutable.$ip$,
   'Easy', 12),
  ('java-exception-handling-11','java-exception-handling',
   $q$What is finally?$q$,
   $a$`finally` is a block associated with exception handling that is normally executed after the `try`/`catch` processing, whether or not an exception occurs.

It has traditionally been used for cleanup work.$a$,
   $ex$```java
try {
    System.out.println("Work");
} finally {
    System.out.println("Cleanup");
}
```$ex$,
   $ip$For resource management, try-with-resources is usually preferable to manually relying on `finally`.$ip$,
   'Easy', 11),
  ('java-exception-handling-12','java-exception-handling',
   $q$What is exception handling?$q$,
   $a$Exception handling is Java's mechanism for dealing with abnormal conditions without mixing error-recovery logic into normal control flow.

Java uses `try`, `catch`, `finally`, `throw`, and `throws` to manage exceptions.$a$,
   $ex$```java
try {
    int x = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("Cannot divide by zero");
}
```$ex$,
   $ip$Do not catch `Exception` blindly if a narrower exception type can be handled meaningfully.$ip$,
   'Easy', 12),
  ('java-jvm-15','java-jvm',
   $q$What is finalize()?$q$,
   $a$`finalize()` was an old mechanism associated with garbage-collection-based cleanup. It is deprecated and should not be used for reliable resource management.

Cleanup of files, sockets, database connections, and similar resources should be explicit or use `AutoCloseable` with try-with-resources.$a$,
   $ex$```java
try (var input = new java.io.FileInputStream("a.txt")) {
    System.out.println(input.read());
}
```$ex$,
   $ip$Do not tell an interviewer that `finalize()` guarantees cleanup; it does not.$ip$,
   'Medium', 15),
  ('java-jvm-16','java-jvm',
   $q$What is memory leak in Java?$q$,
   $a$A Java memory leak occurs when an application unintentionally keeps references to objects that it no longer needs, preventing garbage collection.

Common causes include static collections, unremoved listeners, caches without eviction, and long-lived objects holding unnecessary references.$a$,
   $ex$```java
static List<byte[]> cache = new ArrayList<>();
// continually adding unused data can retain memory
```$ex$,
   $ip$Java has automatic memory management, but developers still need to manage object reachability and resource lifecycles.$ip$,
   'Medium', 16),
  ('java-collections-17','java-collections',
   $q$HashMap vs ConcurrentHashMap?$q$,
   $a$`HashMap` is not designed for concurrent structural updates without external synchronization. `ConcurrentHashMap` supports concurrent access with thread-safe operations and does not allow null keys or values.

Use ConcurrentHashMap when multiple threads need to access and update a shared map safely.$a$,
   $ex$```java
ConcurrentHashMap<String,Integer> counts = new ConcurrentHashMap<>();
counts.merge("Java", 1, Integer::sum);
```$ex$,
   $ip$Thread-safe does not mean every multi-step business operation becomes automatically atomic; use the appropriate atomic API or synchronization.$ip$,
   'Medium', 17),
  ('java-multithreading-17','java-multithreading',
   $q$What is a thread?$q$,
   $a$A thread is an independent path of execution within a process. Java allows multiple threads to execute tasks concurrently.

Threads are useful for background work, parallelizable tasks, I/O waiting, and responsive applications.$a$,
   $ex$```java
Thread t = new Thread(() -> System.out.println("Running"));
t.start();
```$ex$,
   $ip$Call `start()` to create a new execution path; calling `run()` directly is just a normal method call.$ip$,
   'Easy', 17),
  ('java-8-plus-15','java-8-plus',
   $q$What is functional programming style in Java?$q$,
   $a$Java supports a functional style using lambdas, functional interfaces, method references, streams, and operations that avoid unnecessary shared mutable state.

It is particularly useful for collection transformations and declarative pipelines.$a$,
   $ex$```java
int sum = numbers.stream().mapToInt(Integer::intValue).sum();
```$ex$,
   $ip$Java remains a multi-paradigm language; object-oriented design is still fundamental.$ip$,
   'Medium', 15),
  ('java-polymorphism-11','java-polymorphism',
   $q$Overloading vs overriding?$q$,
   $a$Overloading uses the same method name with different parameter lists and is resolved mainly at compile time. Overriding replaces inherited behavior with a subclass implementation and is selected dynamically for virtual instance calls.

Use overloading for related operations with different inputs; use overriding when a subtype needs different behavior.$a$,
   $ex$```text
add(int,int)       -> overloading
Dog.sound()        -> overriding
```$ex$,
   $ip$Static methods are hidden rather than overridden; private methods are not overridden because they are not inherited in the usual polymorphic sense.$ip$,
   'Medium', 11),
  ('java-polymorphism-12','java-polymorphism',
   $q$What is instanceof?$q$,
   $a$`instanceof` checks whether an object reference is compatible with a specified type.

It is useful before a potentially unsafe cast and can also use Java's pattern matching syntax in modern versions.$a$,
   $ex$```java
if (obj instanceof String s) {
    System.out.println(s.length());
}
```$ex$,
   $ip$The expression is false for null.$ip$,
   'Easy', 12),
  ('java-polymorphism-13','java-polymorphism',
   $q$What is covariant return type?$q$,
   $a$When overriding a method, Java allows the subclass method to return a subtype of the original method's return type.

This lets overriding methods return a more specific type without breaking polymorphism.$a$,
   $ex$```java
class Animal { Animal copy() { return new Animal(); } }
class Dog extends Animal { @Override Dog copy() { return new Dog(); } }
```$ex$,
   $ip$Primitive return types cannot use covariant return rules.$ip$,
   'Medium', 13),
  ('java-polymorphism-14','java-polymorphism',
   $q$What is type casting?$q$,
   $a$Type casting converts a value or reference to another compatible type. Primitive casts can change numeric types; reference casts change the view of an object within its inheritance hierarchy.

It is useful when an API returns a broader type but a narrower type is known.$a$,
   $ex$```java
double d = 10.8;
int n = (int) d; // 10
```$ex$,
   $ip$Narrowing primitive conversion can lose information.$ip$,
   'Easy', 14),
  ('java-spring-01','java-spring',
   $q$What is Spring Framework?$q$,
   $a$Spring is a Java framework that provides infrastructure for building applications, especially backend and enterprise systems. Core Spring concepts include dependency injection, inversion of control, web support, transactions, and integration with data technologies.

It reduces boilerplate and encourages loosely coupled components.$a$,
   $ex$```java
@Service
class UserService {
    private final UserRepository repo;
    UserService(UserRepository repo) { this.repo = repo; }
}
```$ex$,
   $ip$Spring Framework is broader than Spring Boot; Boot builds on Spring and simplifies application setup.$ip$,
   'Easy', 1),
  ('java-spring-02','java-spring',
   $q$What is dependency injection?$q$,
   $a$Dependency injection means an object receives the dependencies it needs from outside instead of constructing them itself.

This improves testability and reduces tight coupling between classes.$a$,
   $ex$```java
@Service
class OrderService {
    private final PaymentService paymentService;
    OrderService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```$ex$,
   $ip$Constructor injection is generally preferred because dependencies are explicit and can be final.$ip$,
   'Medium', 2),
  ('java-spring-boot-01','java-spring-boot',
   $q$What is Spring Boot?$q$,
   $a$Spring Boot is a Spring-based framework that simplifies application development through auto-configuration, starter dependencies, embedded servers, externalized configuration, and production-oriented features.

It lets developers create deployable Spring applications with much less configuration.$a$,
   $ex$```java
@SpringBootApplication
public class App {
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
}
```$ex$,
   $ip$Spring Boot does not replace Spring; it provides conventions and tooling around the Spring ecosystem.$ip$,
   'Easy', 1),
  ('java-spring-boot-02','java-spring-boot',
   $q$What is @RestController?$q$,
   $a$`@RestController` is a Spring annotation used for classes whose methods handle web requests and return response data directly, commonly serialized as JSON.

It combines controller semantics with response-body behavior.$a$,
   $ex$```java
@RestController
class HelloController {
    @GetMapping("/hello")
    String hello() { return "Hello"; }
}
```$ex$,
   $ip$For complex APIs, also consider explicit status codes, validation, exception handling, and consistent response contracts.$ip$,
   'Medium', 2),
  ('java-rest-api-01','java-rest-api',
   $q$What is REST API?$q$,
   $a$A REST-style API exposes resources through HTTP and commonly uses methods such as GET, POST, PUT, PATCH, and DELETE.

It is widely used for communication between web/mobile clients and backend services.$a$,
   $ex$```text
GET /api/students/101
POST /api/students
```$ex$,
   $ip$REST is an architectural style, not simply a synonym for "JSON API."$ip$,
   'Easy', 1),
  ('java-jpa-hibernate-01','java-jpa-hibernate',
   $q$What is JPA?$q$,
   $a$JPA, Jakarta Persistence, is a Java specification for object-relational mapping and persistence. It defines APIs and annotations for mapping Java objects to relational database data.

It reduces repetitive JDBC mapping code for applications that fit an ORM approach.$a$,
   $ex$```java
@Entity
class Student {
    @Id
    private Long id;
    private String name;
}
```$ex$,
   $ip$JPA is a specification; Hibernate is a popular implementation/provider.$ip$,
   'Easy', 1),
  ('java-jpa-hibernate-02','java-jpa-hibernate',
   $q$What is Hibernate?$q$,
   $a$Hibernate is an ORM framework and a common implementation of the Jakarta Persistence specification. It maps Java objects to relational database tables and manages persistence operations.

It can reduce manual SQL and result-set mapping for typical CRUD and relationship operations.$a$,
   $ex$```java
@Entity
class Employee {
    @Id
    @GeneratedValue
    Long id;
    String name;
}
```$ex$,
   $ip$ORM does not eliminate the need to understand SQL, indexes, transactions, and query performance.$ip$,
   'Easy', 2),
  ('java-advanced-java-01','java-advanced-java',
   $q$What is enum?$q$,
   $a$An enum defines a fixed set of named constants and can also contain fields, methods, and constructors.

Enums are useful when a value must come from a controlled set such as order status or user role.$a$,
   $ex$```java
enum Status { NEW, PAID, CANCELLED }
Status s = Status.PAID;
```$ex$,
   $ip$Enums are type-safe compared with using arbitrary integer constants or strings.$ip$,
   'Easy', 1),
  ('java-advanced-java-02','java-advanced-java',
   $q$What is autoboxing?$q$,
   $a$Autoboxing is automatic conversion from a primitive to its corresponding wrapper object, such as `int` to `Integer`. Unboxing converts the wrapper back to the primitive.

It allows primitive values to work with APIs such as generic collections that require reference types.$a$,
   $ex$```java
Integer x = 10; // boxing
int y = x;      // unboxing
```$ex$,
   $ip$Unboxing a null wrapper throws NullPointerException.$ip$,
   'Medium', 2),
  ('java-advanced-java-03','java-advanced-java',
   $q$What is immutable class?$q$,
   $a$An immutable class creates objects whose observable state cannot change after construction.

Immutability makes objects easier to reason about and safer to share, especially across threads.$a$,
   $ex$```java
final class User {
    private final String name;
    User(String name) { this.name = name; }
    public String getName() { return name; }
}
```$ex$,
   $ip$For mutable fields such as lists, defensive copies may be required; simply making fields final is not enough.$ip$,
   'Medium', 3),
  ('java-advanced-java-04','java-advanced-java',
   $q$What is recursion?$q$,
   $a$Recursion is when a method calls itself on a smaller or simpler version of the problem until a base condition is reached.

It is useful for trees, divide-and-conquer algorithms, and problems naturally defined recursively.$a$,
   $ex$```java
static int fact(int n) {
    if (n <= 1) return 1;
    return n * fact(n - 1);
}
```$ex$,
   $ip$Every recursive solution needs a correct base case; deep recursion can overflow the thread stack.$ip$,
   'Easy', 4),
  ('java-advanced-java-05','java-advanced-java',
   $q$What is shallow copy vs deep copy?$q$,
   $a$A shallow copy duplicates the outer object but may keep references to the same nested mutable objects. A deep copy creates independent copies of the nested state as required by the design.

The distinction matters when copied objects contain mutable collections or child objects.$a$,
   $ex$```text
shallow: new object -> same child reference
deep:    new object -> copied child object
```$ex$,
   $ip$Java does not provide one universal deep-copy mechanism; the correct approach depends on the object model.$ip$,
   'Medium', 5),
  ('java-advanced-java-06','java-advanced-java',
   $q$What is object class?$q$,
   $a$`java.lang.Object` is the root class of the Java class hierarchy. Classes ultimately inherit methods such as `toString()`, `equals()`, `hashCode()`, and `getClass()`.

Understanding Object explains why these methods are available on ordinary Java objects.$a$,
   $ex$```java
Object x = "Java";
System.out.println(x.toString());
```$ex$,
   $ip$Interfaces do not extend Object, although their implementing objects still inherit Object methods through their class.$ip$,
   'Medium', 6),
  ('java-advanced-java-07','java-advanced-java',
   $q$What is method signature?$q$,
   $a$For Java methods, the signature used for overloading consists of the method name and parameter types (including type parameter effects under Java's rules), not the return type alone.

It matters when the compiler decides which overloaded method matches a call.$a$,
   $ex$```java
void add(int a, int b) {}
void add(double a, double b) {}
```$ex$,
   $ip$Return type alone cannot distinguish overloads.$ip$,
   'Easy', 7),
  ('java-advanced-java-08','java-advanced-java',
   $q$What is varargs?$q$,
   $a$Varargs allows a method to accept zero or more arguments of the same type using `type...`. Inside the method, the parameter behaves like an array.

It is useful when callers may naturally provide a variable number of values.$a$,
   $ex$```java
static int sum(int... nums) {
    int total = 0;
    for (int n : nums) total += n;
    return total;
}
```$ex$,
   $ip$A varargs parameter must be the last parameter.$ip$,
   'Easy', 8),
  ('java-advanced-java-09','java-advanced-java',
   $q$What is widening and narrowing?$q$,
   $a$Widening converts a value to a type that can represent a broader range, such as int to long. Narrowing converts to a potentially smaller type, such as long to int, and may lose data.

Widening primitive conversions are generally implicit; narrowing usually requires an explicit cast.$a$,
   $ex$```java
int x = 10;
long y = x;
int z = (int) y;
```$ex$,
   $ip$Floating-point to integer conversion truncates the fractional part.$ip$,
   'Easy', 9),
  ('java-advanced-java-10','java-advanced-java',
   $q$What is a wrapper class?$q$,
   $a$Wrapper classes represent primitive values as objects, such as Integer for int and Boolean for boolean.

They are required where Java APIs use reference types, such as generic collections.$a$,
   $ex$```java
Integer age = 25;
```$ex$,
   $ip$Wrapper objects can be null, unlike primitives.$ip$,
   'Easy', 10),
  ('java-advanced-java-11','java-advanced-java',
   $q$What is record?$q$,
   $a$A record is a concise Java type for transparent data carriers. The compiler supplies components, accessors, a canonical constructor, equals, hashCode, and toString according to record rules.

Records are useful for immutable-style DTOs and value-like data.$a$,
   $ex$```java
record Student(int id, String name) {}
Student s = new Student(1, "Amit");
```$ex$,
   $ip$A record's components are final fields, but referenced mutable objects can still themselves be mutable.$ip$,
   'Medium', 11),
  ('java-advanced-java-12','java-advanced-java',
   $q$What is sealed class?$q$,
   $a$A sealed class or interface restricts which types may directly extend or implement it.

It is useful when the set of permitted subtypes is intentionally controlled.$a$,
   $ex$```java
sealed interface Result permits Success, Failure {}
final class Success implements Result {}
final class Failure implements Result {}
```$ex$,
   $ip$Permitted subclasses must follow Java's rules such as being final, sealed, or non-sealed.$ip$,
   'Medium', 12),
  ('java-advanced-java-13','java-advanced-java',
   $q$What is switch expression?$q$,
   $a$A switch expression produces a value, unlike the older statement-oriented switch style.

It can make branching assignments shorter and reduce fall-through mistakes.$a$,
   $ex$```java
int days = switch (month) {
    case 2 -> 28;
    case 4, 6, 9, 11 -> 30;
    default -> 31;
};
```$ex$,
   $ip$The exact available switch features depend on the Java version used by the project.$ip$,
   'Medium', 13),
  ('java-advanced-java-14','java-advanced-java',
   $q$What is local variable type inference var?$q$,
   $a$`var` lets the compiler infer the type of a local variable from its initializer. It does not make Java dynamically typed.

It can reduce repetition when the type is obvious from the right side.$a$,
   $ex$```java
var names = new ArrayList<String>();
```$ex$,
   $ip$`var` cannot be used for fields, method parameters, or method return types, and the initializer must provide enough type information.$ip$,
   'Easy', 14),
  ('java-advanced-java-15','java-advanced-java',
   $q$What is text block?$q$,
   $a$A text block is a Java multiline string literal that makes formatted text easier to write.

It is useful for JSON, SQL, HTML, and other multiline content embedded in source code.$a$,
   $ex$```java
String json = """
    {"name":"Amit"}
    """;
```$ex$,
   $ip$Indentation and escaping follow Java's text-block rules; do not treat it as a raw string literal.$ip$,
   'Easy', 15),
  ('java-core-java-13','java-core-java',
   $q$Why is main() static?$q$,
   $a$The main method is static so the JVM can invoke it without first creating an object of the class.

At application startup there may be no application object available yet, so a class-level entry point is convenient.$a$,
   $ex$```java
class App {
    static void start() {
        System.out.println("Started");
    }
}
```$ex$,
   $ip$The JVM's startup contract expects a suitable static main method for the traditional launcher model.$ip$,
   'Medium', 13),
  ('java-collections-16','java-collections',
   $q$What is LinkedList?$q$,
   $a$`LinkedList` is a doubly linked list implementation that also implements `Deque`. It stores elements in linked nodes rather than a contiguous dynamic array.

It can be useful for deque operations and specific workloads, but it is not automatically faster than ArrayList for general use.$a$,
   $ex$```java
Deque<Integer> q = new LinkedList<>();
q.addFirst(10);
q.addLast(20);
```$ex$,
   $ip$Indexed access is O(n), so it is usually a poor choice when random index access is frequent.$ip$,
   'Medium', 16),
  ('java-polymorphism-10','java-polymorphism',
   $q$Can private methods be overridden?$q$,
   $a$No. Private methods are not accessible to subclasses and are not inherited as overridable methods.

A child class can declare a method with the same name, but it is a separate method.$a$,
   $ex$```java
class A { private void test() {} }
class B extends A { private void test() {} }
```$ex$,
   $ip$Do not describe this as runtime overriding.$ip$,
   'Medium', 10),
  ('java-oop-11','java-oop',
   $q$What is aggregation?$q$,
   $a$Aggregation is a weaker has-a relationship where the contained object can conceptually exist independently of the container.

It is mainly a modeling concept rather than a special Java keyword.$a$,
   $ex$```text
Department -> Employee objects
Employees can exist independently of a particular Department
```$ex$,
   $ip$Do not confuse aggregation with Java's syntax; both aggregation and composition can be represented using fields.$ip$,
   'Easy', 11)
on conflict (id) do update set
  topic_id = excluded.topic_id, question = excluded.question, answer = excluded.answer,
  example = excluded.example, important_point = excluded.important_point,
  difficulty = excluded.difficulty, sort_order = excluded.sort_order, updated_at = now();
-- ===========================================================================
-- 4. ARCHIVE NON-SOURCE / DUPLICATE-Q84 ROWS (status only — no delete)
-- ===========================================================================

-- 4a. 137 rows with no source-guide equivalent — preserved, hidden from public.
update public.interview_questions set status = 'archived', updated_at = now()
where id in (
    'java-8-plus-03', 'java-8-plus-07', 'java-8-plus-08', 'java-8-plus-09',
    'java-8-plus-10', 'java-8-plus-13', 'java-8-plus-14', 'java-abstract-classes-01',
    'java-abstract-classes-02', 'java-abstract-classes-03', 'java-abstract-classes-04',
    'java-abstract-classes-05', 'java-abstract-classes-07', 'java-abstract-classes-08',
    'java-abstraction-02', 'java-abstraction-03', 'java-abstraction-04',
    'java-abstraction-05', 'java-abstraction-06', 'java-abstraction-07',
    'java-abstraction-08', 'java-arrays-03', 'java-arrays-04', 'java-arrays-05',
    'java-arrays-06', 'java-arrays-07', 'java-arrays-08', 'java-arrays-09',
    'java-classes-objects-03', 'java-classes-objects-04', 'java-classes-objects-05',
    'java-classes-objects-06', 'java-classes-objects-07', 'java-classes-objects-08',
    'java-classes-objects-09', 'java-classes-objects-10', 'java-collections-02',
    'java-collections-05', 'java-collections-06', 'java-collections-14',
    'java-collections-15', 'java-constructors-03', 'java-constructors-04',
    'java-constructors-06', 'java-constructors-08', 'java-constructors-09',
    'java-constructors-10', 'java-core-java-10', 'java-core-java-11',
    'java-core-java-12', 'java-encapsulation-02', 'java-encapsulation-04',
    'java-encapsulation-05', 'java-encapsulation-06', 'java-encapsulation-07',
    'java-encapsulation-08', 'java-exception-handling-01',
    'java-exception-handling-05', 'java-exception-handling-06',
    'java-exception-handling-07', 'java-exception-handling-09',
    'java-exception-handling-10', 'java-generics-02', 'java-generics-03',
    'java-generics-04', 'java-generics-05', 'java-generics-08', 'java-generics-10',
    'java-generics-11', 'java-inheritance-04', 'java-inheritance-05',
    'java-inheritance-06', 'java-inheritance-07', 'java-inheritance-08',
    'java-inheritance-09', 'java-inheritance-10', 'java-inheritance-11',
    'java-interfaces-02', 'java-interfaces-03', 'java-interfaces-04',
    'java-interfaces-05', 'java-interfaces-07', 'java-interfaces-08', 'java-jdbc-02',
    'java-jdbc-04', 'java-jdbc-05', 'java-jdbc-06', 'java-jdbc-07', 'java-jdbc-08',
    'java-jdbc-09', 'java-jdbc-10', 'java-jdbc-11', 'java-jvm-01', 'java-jvm-03',
    'java-jvm-04', 'java-jvm-07', 'java-jvm-08', 'java-jvm-09', 'java-jvm-12',
    'java-jvm-13', 'java-jvm-14', 'java-multithreading-02', 'java-multithreading-03',
    'java-multithreading-04', 'java-multithreading-06', 'java-multithreading-07',
    'java-multithreading-09', 'java-multithreading-12', 'java-multithreading-13',
    'java-multithreading-16', 'java-oop-02', 'java-oop-03', 'java-oop-04',
    'java-oop-06', 'java-oop-07', 'java-oop-08', 'java-oop-09', 'java-oop-10',
    'java-polymorphism-02', 'java-polymorphism-05', 'java-polymorphism-09',
    'java-sql-and-java-01', 'java-sql-and-java-02', 'java-sql-and-java-03',
    'java-sql-and-java-04', 'java-sql-and-java-05', 'java-sql-and-java-06',
    'java-sql-and-java-07', 'java-sql-and-java-08', 'java-sql-and-java-09',
    'java-sql-and-java-10', 'java-sql-and-java-11', 'java-strings-05',
    'java-strings-06', 'java-strings-07', 'java-strings-08', 'java-strings-09'
  );

-- 4b. 2 retired duplicate/derivative uses of source Q84 — canonical row is
--     java-abstract-classes-06 (left untouched, already published).
update public.interview_questions set status = 'archived', updated_at = now()
where id in ('java-interfaces-09', 'java-abstract-classes-09');

-- 4c. SQL + Java topic — every question in it was non-source content, so
--     after 4a it has 0 published questions. Archive the topic itself so it
--     drops out of the topic grid and prev/next nav instead of dead-ending.
update public.interview_topics set status = 'archived', updated_at = now()
where id = 'java-sql-and-java';

-- ===========================================================================
-- 5. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $$
declare
  v_topics_new int;
  v_total int;
  v_published int;
  v_archived int;
  v_dupe_text int;
  v_empty_topics int;
begin
  select count(*) into v_topics_new from public.interview_topics
    where id in ('java-spring','java-spring-boot','java-jpa-hibernate','java-rest-api','java-advanced-java');
  if v_topics_new <> 5 then
    raise exception 'validation: expected 5 new topics (Spring/Spring Boot/JPA-Hibernate/REST API/Advanced Java), found %', v_topics_new;
  end if;

  select count(*) into v_total from public.interview_questions where topic_id like 'java-%';
  if v_total <> 260 then
    raise exception 'validation: expected 260 total java interview_questions rows after reconciliation, found %', v_total;
  end if;

  select count(*) into v_published from public.interview_questions
    where topic_id like 'java-%' and status = 'published';
  if v_published <> 121 then
    raise exception 'validation: expected exactly 121 published (source-based) java interview_questions, found %', v_published;
  end if;

  select count(*) into v_archived from public.interview_questions
    where topic_id like 'java-%' and status = 'archived';
  if v_archived <> 139 then
    raise exception 'validation: expected exactly 139 archived java interview_questions (137 non-source + 2 retired Q84), found %', v_archived;
  end if;

  select count(*) into v_dupe_text from (
    select question from public.interview_questions
    where topic_id like 'java-%' and status = 'published'
    group by question having count(*) > 1
  ) d;
  if v_dupe_text <> 0 then
    raise exception 'validation: found % duplicate question text among published java interview_questions', v_dupe_text;
  end if;

  if (select count(*) from public.interview_questions
      where id in ('java-interfaces-09','java-abstract-classes-06','java-abstract-classes-09')
        and status = 'published') <> 1 then
    raise exception 'validation: source Q84 (abstract class vs interface) must have exactly 1 published row';
  end if;

  select count(*) into v_empty_topics from public.interview_topics t
    where t.category_id = 'java' and coalesce(t.status,'published') = 'published'
      and not exists (
        select 1 from public.interview_questions q
        where q.topic_id = t.id and coalesce(q.status,'published') = 'published'
      );
  if v_empty_topics <> 0 then
    raise exception 'validation: % published java topic(s) have 0 published questions', v_empty_topics;
  end if;

  raise notice '0108 OK: % published (source Q1-121), % archived (non-source + retired Q84 dupes), % total; 0 published topics with 0 questions.', v_published, v_archived, v_total;
end $$;

notify pgrst, 'reload schema';
