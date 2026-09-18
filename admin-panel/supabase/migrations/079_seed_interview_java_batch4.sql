-- admin-panel/supabase/migrations/079_seed_interview_java_batch4.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0107_seed_interview_java_batch4.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — Java Interview Questions content, batch 4 of 6
-- (mobile 0107_seed_interview_java_batch4.sql  ==  admin 079_seed_interview_java_batch4.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Seeds the next 5 of 26 Java Interview Questions topics (Abstract Classes,
--   Generics, JVM, JDBC, SQL + Java), each with an original, technically
--   accurate set of Question/Answer/Example/Important Point rows for
--   /practice/interview-questions/java/<topic>. Follows batch 1 (0104/076),
--   batch 2 (0105/077) and batch 3 (0106/078) exactly: same idempotency
--   technique (deterministic `id`, `on conflict (id) do update`), same
--   sort_order gap convention (this batch continues at 160, 170, 180, 190,
--   200), does not touch any earlier-batch row. Topic slugs
--   (abstract-classes, generics, jvm, jdbc, sql-and-java) match the curated
--   Related Learning map already shipped in
--   website/src/lib/interviewQuestions.types.ts, so no website code change is
--   needed for these topics to link correctly. 2 more batches follow,
--   covering the remaining 6 topics.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -------------------------------------------------------
do $$
begin
  if to_regclass('public.interview_categories') is null
     or to_regclass('public.interview_topics') is null
     or to_regclass('public.interview_questions') is null then
    raise exception '0107/079: interview_categories/topics/questions not found — apply 0103_interview_questions.sql (admin 075) first.';
  end if;
  if not exists (select 1 from public.interview_topics where id = 'java-interfaces') then
    raise exception '0107/079: batch-3 topics not found — apply 0106_seed_interview_java_batch3.sql (admin 078) first.';
  end if;
end $$;

-- ===========================================================================
-- 1. TOPICS (batch 4 of 6)
-- ===========================================================================
insert into public.interview_topics (id, category_id, name, slug, description, sort_order)
values
  ('java-abstract-classes', 'java', 'Abstract Classes', 'abstract-classes',
   'Abstract class mechanics, constructors and fields, and a deep comparison with interfaces.', 160),
  ('java-generics', 'java', 'Generics', 'generics',
   'Generic classes and methods, bounded types, wildcards, PECS, and type erasure.', 170),
  ('java-jvm', 'java', 'JVM', 'jvm',
   'JVM architecture, class loading, runtime data areas, garbage collection, and common memory errors.', 180),
  ('java-jdbc', 'java', 'JDBC', 'jdbc',
   'Connecting Java to a database — drivers, statements, transactions, batching, and connection pooling.', 190),
  ('java-sql-and-java', 'java', 'SQL + Java', 'sql-and-java',
   'Practical Java-to-database interview scenarios — queries, joins, transactions, pagination, and stored procedures.', 200)
on conflict (id) do update set
  category_id = excluded.category_id, name = excluded.name, slug = excluded.slug,
  description = excluded.description, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. QUESTIONS
-- ===========================================================================

-- ---- Abstract Classes (9) ---------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-abstract-classes-01','java-abstract-classes',
 $q$Can an abstract class have a constructor, and what is it used for if the class can never be instantiated directly?$q$,
 $a$Yes — an abstract class can have one or more constructors, even though you can never call new on the abstract class itself. Its constructor still runs whenever a concrete subclass is instantiated, since every subclass constructor implicitly or explicitly calls a parent constructor via super(), so it's the normal place to initialize fields that belong to the abstract class.$a$,
 $ex$```java
abstract class Employee {
    String name;
    Employee(String name) { this.name = name; } // runs via super() from any subclass
}
class Manager extends Employee {
    Manager(String name) { super(name); }
}
```$ex$,
 $ip$You can never write new Employee(...) directly — the constructor is only ever reached through a subclass's super(...) call.$ip$,
 'Medium', 1),

('java-abstract-classes-02','java-abstract-classes',
 $q$Can an abstract class have instance fields and static members?$q$,
 $a$Yes — an abstract class behaves like a normal class for state: it can declare instance fields, static fields, and static methods, exactly like a concrete class. The only restriction is on its abstract methods, which have no body.$a$,
 $ex$```java
abstract class Shape {
    String color;                 // instance field
    static int shapeCount = 0;    // static field
    static void printCount() { System.out.println(shapeCount); } // static method
    abstract double area();
}
```$ex$,
 $ip$Static members belong to the abstract class itself and are shared across all subclasses, just as they would be for any regular class.$ip$,
 'Easy', 2),

('java-abstract-classes-03','java-abstract-classes',
 $q$Can an abstract class have a main() method, and can you run it directly?$q$,
 $a$Yes — an abstract class can declare a public static void main(String[] args) method like any class, and you can run it directly with the java command, because main() is a static method that doesn't require creating an object of the class at all.$a$,
 $ex$```java
abstract class Demo {
    public static void main(String[] args) {
        System.out.println("Running from an abstract class");
    }
    abstract void doWork();
}
```$ex$,
 $ip$This works because launching a program only calls the static main method — it never needs to instantiate the class that declares it.$ip$,
 'Medium', 3),

('java-abstract-classes-04','java-abstract-classes',
 $q$Can an abstract method be static, private, or final?$q$,
 $a$No to all three, and each for a different reason: static methods are resolved by the class at compile time, not overridden polymorphically, so an abstract static method would have nothing to override; private methods aren't visible to subclasses at all, so they could never be implemented by one; final methods can't be overridden by definition, which directly contradicts what an abstract method requires a subclass to do.$a$,
 $ex$```java
abstract class Demo {
    abstract static void bad1(); // compile error
    abstract private void bad2(); // compile error
    abstract final void bad3();  // compile error
}
```$ex$,
 $ip$This combination question is a favorite way interviewers check whether you understand why "abstract" specifically means "must be overridden by a subclass."$ip$,
 'Hard', 4),

('java-abstract-classes-05','java-abstract-classes',
 $q$What is the difference between "partial abstraction" and "full abstraction"?$q$,
 $a$Partial abstraction means only some behavior is hidden while some implementation is still visible or provided directly — an abstract class achieves this naturally, since it can mix concrete methods with abstract ones. Full abstraction means absolutely no implementation is exposed, only a contract of what must be done — a traditional interface with no default methods achieves this, since every method is abstract until a class implements it.$a$,
 $ex$```java
abstract class Shape {              // partial abstraction
    void printInfo() { System.out.println("A shape"); } // concrete
    abstract double area();                                // abstract
}
interface Drawable { void draw(); } // full abstraction (pre-Java 8 style)
```$ex$,
 $ip$Once default methods were added in Java 8, interfaces can also provide partial abstraction, blurring this distinction somewhat — but it's still a useful way to describe the traditional difference.$ip$,
 'Medium', 5),

('java-abstract-classes-06','java-abstract-classes',
 $q$What is a deep, practical comparison between an abstract class and an interface?$q$,
 $a$An abstract class can hold instance state and constructors and is extended by only one subclass at a time, single inheritance, while an interface traditionally holds no instance state, has no constructor, and can be implemented by any number of classes at once, multiple implementation. An abstract class is chosen when subclasses share real implementation and a genuine "is-a" relationship; an interface is chosen when unrelated classes need to guarantee the same capability.$a$,
 $ex$```java
abstract class Vehicle {           // shared state + implementation, single inheritance
    int speed;
    void printSpeed() { System.out.println(speed); }
}
interface Drivable { void drive(); } // pure capability, multiple implementation
class Car extends Vehicle implements Drivable {
    public void drive() { speed += 10; }
}
```$ex$,
 $ip$A class can extend only one abstract class but implement many interfaces — this single fact drives most real design decisions between the two.$ip$,
 'Medium', 6),

('java-abstract-classes-07','java-abstract-classes',
 $q$Since Java 8 interfaces can have default methods, what can an abstract class still do that an interface cannot?$q$,
 $a$An abstract class can declare instance fields that hold real per-object state, provide a constructor to initialize that state, and use access modifiers like protected or private for its members. An interface still cannot hold instance state, only constants, has no constructor, and, even with default and private methods, everything non-static remains implicitly public.$a$,
 $ex$```java
abstract class Account {
    protected double balance; // real per-object state — interfaces can't do this
    Account(double balance) { this.balance = balance; }
}
```$ex$,
 $ip$Default methods narrowed the implementation gap between interfaces and abstract classes, but the state and constructor gap remains — that's the real dividing line today.$ip$,
 'Hard', 7),

('java-abstract-classes-08','java-abstract-classes',
 $q$How does polymorphism work through an abstract class reference?$q$,
 $a$A variable declared with an abstract class type can point to an object of any concrete subclass, and calling a method on that reference runs the specific subclass's overridden implementation, resolved at runtime, exactly the same dynamic dispatch mechanism used for any parent-class reference.$a$,
 $ex$```java
Shape s = new Circle(5); // Shape is abstract
System.out.println(s.area()); // runs Circle's area(), decided at runtime
```$ex$,
 $ip$This is why code can be written once against the abstract class type and automatically work with every future subclass without modification.$ip$,
 'Medium', 8),

('java-abstract-classes-09','java-abstract-classes',
 $q$When would you choose an abstract class over an interface in a real design?$q$,
 $a$Choose an abstract class when a family of related classes shares real state and common implementation that would otherwise be duplicated across each subclass, and you're confident the class won't need to extend anything else. Choose an interface when the capability needs to be added to classes that already extend something else, or when unrelated classes across the codebase need to guarantee the same behavior without being part of the same class family.$a$,
 $ex$$ex$,
 $ip$In real codebases, it's common to use both together — an abstract class implementing one or more interfaces, providing shared implementation while still declaring the capabilities those interfaces promise.$ip$,
 'Medium', 9)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Generics (11) ----------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-generics-01','java-generics',
 $q$Why were generics introduced in Java?$q$,
 $a$Before generics, collections stored plain Object references, so you had to manually cast every element back to its real type, and mistakes were only caught at runtime as a ClassCastException. Generics let you specify the type a collection or class works with at compile time, so the compiler both removes the need for manual casts and catches type mismatches before the program ever runs.$a$,
 $ex$```java
List rawList = new ArrayList();       // pre-generics style
rawList.add("text");
String s = (String) rawList.get(0);   // manual cast, unsafe

List<String> list = new ArrayList<>(); // generic style
list.add("text");
String s2 = list.get(0);               // no cast needed, type-checked
```$ex$,
 $ip$Generics are a compile-time safety feature — they don't exist as extra information at runtime, which leads to type erasure.$ip$,
 'Easy', 1),

('java-generics-02','java-generics',
 $q$What is a generic class, and how do you define one?$q$,
 $a$A generic class declares one or more type parameters in angle brackets after the class name, which act as placeholders for an actual type supplied when the class is used, letting the same class work correctly with different types while staying type-safe.$a$,
 $ex$```java
class Box<T> {
    private T value;
    void set(T value) { this.value = value; }
    T get() { return value; }
}
Box<String> stringBox = new Box<>();
stringBox.set("Hello");
```$ex$,
 $ip$The type parameter name (T here) is just a convention, not a keyword — any valid identifier works, though single uppercase letters like T, E, K, V are the standard convention.$ip$,
 'Easy', 2),

('java-generics-03','java-generics',
 $q$What is a generic method, and how is it different from a generic class?$q$,
 $a$A generic method declares its own type parameter, before the return type, independently of whether its enclosing class is generic — this lets a single static or instance method work with different types per call, rather than fixing the type for the whole class.$a$,
 $ex$```java
static <T> void printArray(T[] array) {
    for (T item : array) System.out.println(item);
}
printArray(new Integer[]{1, 2, 3});
printArray(new String[]{"a", "b"});
```$ex$,
 $ip$A generic method can exist inside a completely non-generic class — the type parameter belongs to the method, not the class.$ip$,
 'Medium', 3),

('java-generics-04','java-generics',
 $q$Can an interface be generic?$q$,
 $a$Yes — an interface can declare type parameters exactly like a class, and any class implementing it must either supply a concrete type or remain generic itself and pass the type parameter through.$a$,
 $ex$```java
interface Repository<T> {
    void save(T item);
    T findById(int id);
}
class UserRepository implements Repository<User> {
    public void save(User item) { }
    public User findById(int id) { return new User(); }
}
```$ex$,
 $ip$Common built-in examples include Comparable<T> and Comparator<T>, both generic interfaces.$ip$,
 'Easy', 4),

('java-generics-05','java-generics',
 $q$What are bounded type parameters, and what is an upper bound?$q$,
 $a$A bounded type parameter restricts what types can be used as the actual type argument, using extends to declare an upper bound, meaning the type argument must be that class or interface or one of its subtypes. This lets the generic code safely call methods defined on the bound, which it couldn't do with a completely unbounded type parameter.$a$,
 $ex$```java
static <T extends Number> double sum(List<T> list) {
    double total = 0;
    for (T item : list) total += item.doubleValue(); // doubleValue() exists because T extends Number
    return total;
}
```$ex$,
 $ip$Despite using the keyword extends, an upper bound works the same way whether the bound is a class or an interface.$ip$,
 'Medium', 5),

('java-generics-06','java-generics',
 $q$What is a lower-bounded wildcard (? super), and how is it different from an upper-bounded wildcard (? extends)?$q$,
 $a$? extends T means the unknown type is T or a subtype of T, which is safe for reading values out as T but generally unsafe for adding new values in. ? super T means the unknown type is T or a supertype of T, which is safe for adding T values in but only lets you safely read values out as Object.$a$,
 $ex$```java
void copyIn(List<? super Integer> dest) { dest.add(10); }        // safe to add Integer
Number readOut(List<? extends Number> src) { return src.get(0); } // safe to read as Number
```$ex$,
 $ip$This asymmetry is exactly what PECS captures: Producer Extends, Consumer Super.$ip$,
 'Hard', 6),

('java-generics-07','java-generics',
 $q$What does PECS (Producer Extends, Consumer Super) mean, and how do you apply it?$q$,
 $a$PECS is a rule of thumb for choosing which wildcard to use: if a generic structure is a "producer" that you only read values from, use ? extends T; if it's a "consumer" that you only write values into, use ? super T. Applying it correctly keeps a generic API both flexible for callers and type-safe.$a$,
 $ex$```java
static void copy(List<? extends Number> src, List<? super Number> dst) {
    for (Number n : src) dst.add(n); // src produces, dst consumes
}
```$ex$,
 $ip$PECS is a design guideline for API authors, not a Java keyword or compiler-enforced rule.$ip$,
 'Hard', 7),

('java-generics-08','java-generics',
 $q$What is the unbounded wildcard ?, and when would you use it?$q$,
 $a$List<?> represents a list of some unknown type, used when the code genuinely doesn't care what the element type is, for example printing the size of any list or checking if it's empty, but doesn't need to read specific typed elements out of it or add anything, other than null, into it.$a$,
 $ex$```java
static void printSize(List<?> list) {
    System.out.println(list.size()); // works for a list of any type
}
```$ex$,
 $ip$You cannot add any element (except null) to a List<?>, since the compiler has no way to know what type would actually be safe to insert.$ip$,
 'Medium', 8),

('java-generics-09','java-generics',
 $q$What is type erasure, and why does Java use it?$q$,
 $a$Type erasure is the compiler strategy of removing most generic type information after compile-time checks are done, replacing type parameters with their bound, or Object if unbounded, in the generated bytecode, and inserting the necessary casts automatically. Java uses it to keep generic code binary-compatible with code written before generics existed, so old and new code and libraries can still interoperate.$a$,
 $ex$```java
List<String> a = new ArrayList<>();
List<Integer> b = new ArrayList<>();
System.out.println(a.getClass() == b.getClass()); // true — both are just ArrayList at runtime
```$ex$,
 $ip$Because of erasure, you cannot check obj instanceof List<String> or create a new T[] directly — the generic type argument simply isn't available at runtime.$ip$,
 'Hard', 9),

('java-generics-10','java-generics',
 $q$What is a raw type, and why should it generally be avoided?$q$,
 $a$A raw type is a generic class or interface used without any type argument at all, such as writing List instead of List<String>, which was allowed for backward compatibility with pre-generics code. Using a raw type disables all of the compiler's generic type checking for that variable, reintroducing the exact unsafe-cast risk that generics were designed to eliminate.$a$,
 $ex$```java
List list = new ArrayList(); // raw type — compiler gives an "unchecked" warning
list.add("text");
list.add(42);                 // compiles, but mixes types unsafely
```$ex$,
 $ip$The compiler emits an "unchecked operation" warning whenever you use a raw type in a generic context — never suppress or ignore that warning without understanding why it appeared.$ip$,
 'Medium', 10),

('java-generics-11','java-generics',
 $q$What are the main limitations of generics in Java?$q$,
 $a$Because of type erasure, you cannot create an instance of a type parameter directly (new T()), cannot create a generic array directly (new T[]), cannot use primitive types as type arguments (must use wrapper types like Integer instead of int), and cannot check an object's specific generic type at runtime with instanceof.$a$,
 $ex$```java
class Box<T> {
    // T item = new T(); // compile error — type erasure removes T at runtime
    List<Integer> nums = new ArrayList<>(); // must use Integer, not int
}
```$ex$,
 $ip$These limitations exist specifically because Java chose erasure-based generics for backward compatibility, unlike some other languages that keep full generic type information at runtime.$ip$,
 'Hard', 11)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- JVM (14) -----------------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-jvm-01','java-jvm',
 $q$What are the main components of JVM architecture?$q$,
 $a$JVM architecture has three main parts: the Class Loader subsystem, which loads, links, and initializes .class files; the Runtime Data Areas, which include the Heap, Stack, Method Area/Metaspace, PC register, and native method stack, used to store data while the program runs; and the Execution Engine, which actually runs the bytecode using an interpreter and a JIT compiler, backed by the garbage collector.$a$,
 $ex$$ex$,
 $ip$Interviewers often want you to name these three groups and briefly say what each one is responsible for, rather than reciting every internal detail.$ip$,
 'Medium', 1),

('java-jvm-02','java-jvm',
 $q$What is a class loader, and what are its three main responsibilities?$q$,
 $a$A class loader is the JVM component responsible for bringing a compiled class into memory when it's needed, through three phases: loading, finding and reading the .class bytecode, linking, verifying the bytecode is valid, preparing static fields with default values, and resolving symbolic references, and initialization, running static initializers and assigning actual values to static fields.$a$,
 $ex$```text
.class file -> Loading -> Linking (verify, prepare, resolve) -> Initialization -> ready to use
```$ex$,
 $ip$A class is only loaded when it's actually needed, lazy loading, not all at once when the program starts.$ip$,
 'Medium', 2),

('java-jvm-03','java-jvm',
 $q$What is the difference between the Bootstrap, Platform, and Application class loaders?$q$,
 $a$The Bootstrap class loader, implemented natively inside the JVM itself, loads Java's own core classes like those in java.lang. The Platform, formerly Extension, class loader loads classes from platform-specific extension libraries. The Application class loader loads the classes that make up your own program, found on the classpath — this is the class loader most application code is loaded by.$a$,
 $ex$```java
System.out.println(String.class.getClassLoader()); // often prints null, since Bootstrap isn't a normal Java object
```$ex$,
 $ip$These class loaders follow a delegation model — a class loader normally asks its parent to try loading a class first, before attempting to load it itself.$ip$,
 'Hard', 3),

('java-jvm-04','java-jvm',
 $q$What are the JVM's runtime data areas?$q$,
 $a$The runtime data areas are the memory regions the JVM sets up to run a program: the Heap, shared, stores objects, the Stack, per-thread, stores method frames and local variables, the Method Area or Metaspace, shared, stores class-level data, the PC register, per-thread, tracks the current instruction, and the native method stack, per-thread, supports native/non-Java code calls.$a$,
 $ex$$ex$,
 $ip$Heap and Method Area/Metaspace are shared across all threads; Stack, PC register, and native method stack are each private to a single thread.$ip$,
 'Medium', 4),

('java-jvm-05','java-jvm',
 $q$What is the Heap, and what is stored there?$q$,
 $a$The Heap is the shared memory area where every object and array created with new is actually allocated, regardless of which thread or method created it, and it's the memory region the garbage collector manages and cleans up.$a$,
 $ex$```java
Student s = new Student(); // the Student object itself lives on the Heap
```$ex$,
 $ip$Because the Heap is shared across all threads, concurrent access to the same heap object requires proper synchronization — the Heap itself doesn't provide that automatically.$ip$,
 'Easy', 5),

('java-jvm-06','java-jvm',
 $q$What is the Stack, and what is stored there?$q$,
 $a$Each thread gets its own Stack, which stores method call frames, one frame per active method call, holding that method's local variables, its operand stack for intermediate computation, and information about where to return to when the method finishes.$a$,
 $ex$```java
void calculate() {
    int x = 10; // x lives in calculate()'s stack frame, not on the Heap
}
```$ex$,
 $ip$Because each thread has its own Stack, local variables, unlike shared objects, are naturally thread-safe without needing synchronization.$ip$,
 'Easy', 6),

('java-jvm-07','java-jvm',
 $q$What is the Method Area / Metaspace, and what does it store?$q$,
 $a$The Method Area, implemented as Metaspace in modern JVMs and allocated from native memory rather than the Heap, stores class-level information shared across all instances of a class — its structure, method bytecode, runtime constant pool, and static variables.$a$,
 $ex$$ex$,
 $ip$Metaspace replaced the older PermGen space specifically to avoid PermGen's fixed-size OutOfMemoryError problems, since Metaspace can grow dynamically using native memory.$ip$,
 'Medium', 7),

('java-jvm-08','java-jvm',
 $q$What is the Program Counter (PC) register, and why does each thread need its own?$q$,
 $a$The PC register holds the address of the JVM instruction that the current thread is currently executing, so the JVM knows where to resume after a branch or method call. Each thread needs its own, because multiple threads can each be in the middle of executing different bytecode instructions at the same time.$a$,
 $ex$$ex$,
 $ip$For a native method being executed, the value of the PC register is undefined, since it isn't tracking JVM bytecode at that point.$ip$,
 'Medium', 8),

('java-jvm-09','java-jvm',
 $q$What is the native method stack used for?$q$,
 $a$The native method stack supports calls into native, non-Java, code, such as code written in C or C++ and invoked through JNI (Java Native Interface), keeping track of those native call frames separately from the regular Java method Stack.$a$,
 $ex$$ex$,
 $ip$Most everyday Java applications never directly interact with native methods, so this area is less commonly discussed than Heap or Stack in typical interviews, but it's worth knowing it exists.$ip$,
 'Easy', 9),

('java-jvm-10','java-jvm',
 $q$What is the difference between the interpreter and the JIT compiler in the execution engine?$q$,
 $a$The interpreter reads and executes bytecode instructions one at a time, which starts up quickly but is relatively slow for code that runs repeatedly. The JIT, Just-In-Time, compiler monitors which methods run frequently, "hot" code, and compiles those specific methods into optimized native machine code at runtime, so later calls run at near-native speed instead of being reinterpreted every time.$a$,
 $ex$$ex$,
 $ip$This combination, interpret first then JIT-compile hot paths, is why long-running Java applications often get noticeably faster the longer they run, as more hot code gets JIT-compiled.$ip$,
 'Medium', 10),

('java-jvm-11','java-jvm',
 $q$What is garbage collection, and what makes an object eligible for it?$q$,
 $a$Garbage collection automatically finds Heap objects that are no longer reachable through any live reference chain from active threads or static fields, and reclaims their memory without the programmer manually freeing it. An object becomes eligible once nothing in the program can reach it anymore, for example, after its only reference variable is set to null or goes out of scope.$a$,
 $ex$```java
Student s = new Student();
s = null; // the original Student object may now become eligible for garbage collection
```$ex$,
 $ip$Becoming eligible for garbage collection doesn't mean the object is collected immediately — the exact timing is controlled by the garbage collector, not the programmer.$ip$,
 'Medium', 11),

('java-jvm-12','java-jvm',
 $q$What is a StackOverflowError, and what typically causes it?$q$,
 $a$A StackOverflowError is thrown when a thread's Stack runs out of space, almost always because of excessively deep or infinite recursion, where each recursive call adds another frame to the Stack without ever returning.$a$,
 $ex$```java
static void recurse() { recurse(); } // no base case — eventually throws StackOverflowError
```$ex$,
 $ip$The fix is almost always to add or correct a recursion base case, or to convert the algorithm to an iterative approach, rather than trying to increase the Stack size as a permanent solution.$ip$,
 'Medium', 12),

('java-jvm-13','java-jvm',
 $q$What is an OutOfMemoryError, and what typically causes it?$q$,
 $a$An OutOfMemoryError is thrown when the JVM cannot allocate more memory in a given area because it's genuinely exhausted — a Heap OutOfMemoryError typically means too many live objects are being retained, often a memory leak, like an ever-growing static collection, while a Metaspace OutOfMemoryError typically means too many classes have been loaded, often from dynamically generating classes without ever releasing their class loaders.$a$,
 $ex$```java
static List<byte[]> cache = new ArrayList<>();
while (true) cache.add(new byte[1_000_000]); // eventually: OutOfMemoryError: Java heap space
```$ex$,
 $ip$Unlike a StackOverflowError, an OutOfMemoryError often points to a genuine memory leak rather than a single bad recursive call — it needs a heap analysis, such as a heap dump, to find the real cause.$ip$,
 'Hard', 13),

('java-jvm-14','java-jvm',
 $q$What does "JVM tuning" mean at a basic level, and what are common JVM options you might adjust?$q$,
 $a$At a basic level, JVM tuning means configuring startup flags that control memory sizes and garbage collection behavior to better match an application's workload — most commonly -Xms and -Xmx to set the initial and maximum Heap size, and -XX: flags to choose or configure a specific garbage collector.$a$,
 $ex$```bash
java -Xms256m -Xmx1024m -jar app.jar
```$ex$,
 $ip$For an interview, it's enough to recognize these flags and explain what they control — deep garbage-collector tuning is a specialized skill beyond typical fresher/junior interview scope.$ip$,
 'Medium', 14)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- JDBC (11) ----------------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-jdbc-01','java-jdbc',
 $q$What is JDBC, and why is it needed?$q$,
 $a$JDBC, Java Database Connectivity, is the standard Java API that lets a Java application connect to a relational database, send SQL statements, and process the results, without needing to know the low-level details of how each specific database communicates over the network.$a$,
 $ex$```java
try (Connection con = DriverManager.getConnection(url, user, pass)) {
    // connected
}
```$ex$,
 $ip$JDBC defines the API; each database vendor supplies its own JDBC driver that implements that API for their specific database.$ip$,
 'Easy', 1),

('java-jdbc-02','java-jdbc',
 $q$What is a JDBC driver, and what are the driver types at a high level?$q$,
 $a$A JDBC driver is the vendor-specific implementation that translates JDBC API calls into the actual network protocol a particular database understands. Historically there were four driver "types," but modern applications almost exclusively use Type 4 drivers, which are pure-Java drivers that talk directly to the database over its native network protocol, with no extra translation layer.$a$,
 $ex$$ex$,
 $ip$You rarely need to memorize all four driver types in depth today — knowing that a modern app uses a Type 4, pure-Java driver is usually sufficient.$ip$,
 'Easy', 2),

('java-jdbc-03','java-jdbc',
 $q$What is the difference between Statement, PreparedStatement, and CallableStatement?$q$,
 $a$Statement executes plain SQL strings directly, re-parsed by the database every time. PreparedStatement uses parameter placeholders (?) that are compiled once and filled in safely on each execution, which is both faster for repeated use and safe against SQL injection. CallableStatement extends PreparedStatement specifically to call stored procedures in the database.$a$,
 $ex$```java
PreparedStatement ps = con.prepareStatement("select * from users where email = ?");
ps.setString(1, email);
CallableStatement cs = con.prepareCall("{call getUserById(?)}");
```$ex$,
 $ip$Never build SQL by concatenating untrusted input into a Statement — that's the classic SQL injection vulnerability that PreparedStatement exists to prevent.$ip$,
 'Medium', 3),

('java-jdbc-04','java-jdbc',
 $q$What is a ResultSet, and how do you read data from it?$q$,
 $a$A ResultSet represents the table of rows returned by a SQL query, and you read it by repeatedly calling next() to move to each row, then using typed getter methods like getString() or getInt() with either a column name or a 1-based column index to read that row's values.$a$,
 $ex$```java
try (ResultSet rs = ps.executeQuery()) {
    while (rs.next()) {
        System.out.println(rs.getString("name"));
    }
}
```$ex$,
 $ip$ResultSet column indexes start at 1, not 0, which is a common off-by-one mistake for developers used to Java's 0-based array indexing.$ip$,
 'Easy', 4),

('java-jdbc-05','java-jdbc',
 $q$What is the difference between executeQuery(), executeUpdate(), and execute()?$q$,
 $a$executeQuery() is used for SELECT statements and returns a ResultSet. executeUpdate() is used for INSERT, UPDATE, and DELETE statements, or DDL, and returns the number of rows affected, not a ResultSet. execute() is a general-purpose method used when you don't know in advance whether the statement returns a ResultSet, and you check its boolean return value to find out.$a$,
 $ex$```java
int rows = ps.executeUpdate(); // e.g., "update users set active = true where id = ?"
```$ex$,
 $ip$Calling executeQuery() on an UPDATE statement, or executeUpdate() on a SELECT, throws a SQLException — using the right method for the right statement type matters.$ip$,
 'Medium', 5),

('java-jdbc-06','java-jdbc',
 $q$How do transactions work in JDBC, and what do commit() and rollback() do?$q$,
 $a$By default, a JDBC Connection runs in auto-commit mode, where every individual statement is committed to the database immediately on its own. Turning auto-commit off with setAutoCommit(false) lets you group multiple statements into a single transaction, calling commit() to make all of them permanent together, or rollback() to undo all of them if something went wrong.$a$,
 $ex$```java
con.setAutoCommit(false);
try {
    ps1.executeUpdate();
    ps2.executeUpdate();
    con.commit();
} catch (SQLException e) {
    con.rollback();
}
```$ex$,
 $ip$Grouping related statements into one transaction guarantees they either all succeed together or none of them apply at all, keeping the database in a consistent state.$ip$,
 'Medium', 6),

('java-jdbc-07','java-jdbc',
 $q$What is JDBC batch processing, and why would you use it?$q$,
 $a$Batch processing lets you group multiple SQL statements, usually the same statement with different parameter values, and send them to the database in a single round trip using addBatch() and executeBatch(), instead of sending each statement separately, which significantly reduces network overhead when inserting or updating many rows.$a$,
 $ex$```java
PreparedStatement ps = con.prepareStatement("insert into logs(message) values (?)");
for (String msg : messages) {
    ps.setString(1, msg);
    ps.addBatch();
}
ps.executeBatch();
```$ex$,
 $ip$Batching is most valuable when inserting or updating large numbers of rows — for a single statement, it offers no real benefit.$ip$,
 'Medium', 7),

('java-jdbc-08','java-jdbc',
 $q$How does PreparedStatement help prevent SQL injection?$q$,
 $a$PreparedStatement separates the fixed SQL structure from the actual parameter values — the SQL text with placeholders is compiled once, and values are sent to the database afterward purely as data, never re-parsed as part of the SQL syntax, so user input can never change the meaning or structure of the query.$a$,
 $ex$```java
// safe — user input can never alter the query's structure
PreparedStatement ps = con.prepareStatement("select * from users where email = ?");
ps.setString(1, userInput);

// unsafe — vulnerable to SQL injection
Statement st = con.createStatement();
st.executeQuery("select * from users where email = '" + userInput + "'");
```$ex$,
 $ip$SQL injection is one of the most common and dangerous real-world vulnerabilities — always use PreparedStatement, or an equivalent ORM parameterization, for any query built from user input.$ip$,
 'Hard', 8),

('java-jdbc-09','java-jdbc',
 $q$Why is try-with-resources especially important for JDBC objects?$q$,
 $a$Connection, Statement, and ResultSet all implement AutoCloseable and hold real, limited external resources such as database connections and cursors — forgetting to close them, especially under an exception, can exhaust a connection pool or leak database-side resources over time. Try-with-resources guarantees each one is closed automatically, in the correct reverse order, even when an exception occurs partway through.$a$,
 $ex$```java
try (Connection con = DriverManager.getConnection(url, user, pass);
     PreparedStatement ps = con.prepareStatement(sql);
     ResultSet rs = ps.executeQuery()) {
    while (rs.next()) { /* ... */ }
}
```$ex$,
 $ip$In a long-running application, a slow leak of unclosed connections is one of the most common causes of a production outage once the connection pool is fully exhausted.$ip$,
 'Medium', 9),

('java-jdbc-10','java-jdbc',
 $q$What is connection pooling, and why is it used instead of opening a new connection every time?$q$,
 $a$Connection pooling maintains a pool of already-open database connections that the application borrows and returns instead of opening and closing a brand-new physical connection for every database operation, since establishing a real connection is relatively slow and resource-intensive on both the application and database sides.$a$,
 $ex$```text
Application requests a connection -> pool hands out an existing idle connection
Application finishes -> connection is returned to the pool, not physically closed
```$ex$,
 $ip$In modern Java applications, a connection pool, like HikariCP, is almost always used in production rather than calling DriverManager.getConnection() directly for every request.$ip$,
 'Medium', 10),

('java-jdbc-11','java-jdbc',
 $q$How would you retrieve an auto-generated key, like an identity column, after an INSERT in JDBC?$q$,
 $a$Prepare the statement with the RETURN_GENERATED_KEYS flag, execute the insert, and then read the generated key from the special ResultSet returned by getGeneratedKeys(), instead of running a separate query to look it up afterward.$a$,
 $ex$```java
PreparedStatement ps = con.prepareStatement(
    "insert into users(name) values (?)", Statement.RETURN_GENERATED_KEYS);
ps.setString(1, "Amit");
ps.executeUpdate();
try (ResultSet keys = ps.getGeneratedKeys()) {
    if (keys.next()) System.out.println("New id: " + keys.getLong(1));
}
```$ex$,
 $ip$This avoids a race condition you'd risk by running a separate "select last inserted id" query, especially under concurrent inserts.$ip$,
 'Medium', 11)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- SQL + Java (11) ------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-sql-and-java-01','java-sql-and-java',
 $q$What's the typical flow for executing a SELECT query from a Java application?$q$,
 $a$Obtain a Connection, usually from a pool, create a PreparedStatement with the SQL and placeholders, set the parameter values, call executeQuery() to get a ResultSet, iterate over it with next() to read each row, and map each row into a Java object, all inside a try-with-resources block so everything closes automatically.$a$,
 $ex$```java
String sql = "select id, name from students where course_id = ?";
try (PreparedStatement ps = con.prepareStatement(sql)) {
    ps.setInt(1, courseId);
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
            System.out.println(rs.getInt("id") + " " + rs.getString("name"));
        }
    }
}
```$ex$,
 $ip$Always use a parameterized PreparedStatement rather than building the SQL string manually, even for values that seem "safe," to avoid SQL injection and keep the same query plan reused efficiently.$ip$,
 'Easy', 1),

('java-sql-and-java-02','java-sql-and-java',
 $q$How do you perform INSERT, UPDATE, and DELETE operations from a Java application?$q$,
 $a$All three use PreparedStatement.executeUpdate() rather than executeQuery(), since none of them return a row set — executeUpdate() instead returns an int representing how many rows were affected, which is useful for confirming the operation actually matched something.$a$,
 $ex$```java
PreparedStatement ps = con.prepareStatement("update students set grade = ? where id = ?");
ps.setString(1, "A");
ps.setInt(2, studentId);
int updated = ps.executeUpdate();
if (updated == 0) System.out.println("No student found with that id");
```$ex$,
 $ip$Checking the returned row count is a simple way to detect a mistaken WHERE clause that matched zero rows, without needing a separate lookup query.$ip$,
 'Easy', 2),

('java-sql-and-java-03','java-sql-and-java',
 $q$How would you map the results of a join query into Java objects?$q$,
 $a$Write the SQL join so the ResultSet's columns include everything needed from all the joined tables, then read each row's columns with the appropriate getters and assemble them into your Java object graph — for a one-to-many join, such as one order with many items, you typically iterate rows and group them by the "one" side's key as you go.$a$,
 $ex$```java
String sql = "select o.id as order_id, i.name as item_name " +
             "from orders o join order_items i on i.order_id = o.id where o.id = ?";
// group rows by order_id while iterating the ResultSet to build one Order with its Items
```$ex$,
 $ip$For a one-to-many join, the "one" side's columns repeat across multiple rows — code that maps the results must account for that instead of assuming one row equals one entity.$ip$,
 'Medium', 3),

('java-sql-and-java-04','java-sql-and-java',
 $q$How do you handle a SQL transaction spanning multiple related updates from Java?$q$,
 $a$Turn off auto-commit on the Connection, perform each related update or insert with its own PreparedStatement, and only call commit() once every step has succeeded — if any step throws an exception, catch it and call rollback() so none of the partial changes are left applied.$a$,
 $ex$```java
con.setAutoCommit(false);
try {
    debit(con, fromAccount, amount);
    credit(con, toAccount, amount);
    con.commit();
} catch (SQLException e) {
    con.rollback();
    throw e;
}
```$ex$,
 $ip$A money-transfer-style operation like this is the classic interview example for explaining why transactions matter — without one, a crash between the debit and the credit would lose money.$ip$,
 'Medium', 4),

('java-sql-and-java-05','java-sql-and-java',
 $q$How would you implement pagination for a large query result from Java?$q$,
 $a$Use the database's own pagination syntax, such as LIMIT and OFFSET in PostgreSQL or MySQL, inside the SQL query itself, with the page size and offset passed in as parameters, rather than fetching every row into the application and skipping or truncating in Java code, which wastes memory and network bandwidth for large tables.$a$,
 $ex$```java
String sql = "select * from products order by id limit ? offset ?";
ps.setInt(1, pageSize);
ps.setInt(2, (page - 1) * pageSize);
```$ex$,
 $ip$For very large tables, offset-based pagination gets slower on later pages since the database still has to scan past all the skipped rows — keyset (cursor-based) pagination is a common optimization for that case.$ip$,
 'Medium', 5),

('java-sql-and-java-06','java-sql-and-java',
 $q$How do you handle NULL values when reading a ResultSet in Java?$q$,
 $a$After calling a primitive-returning getter like getInt(), call rs.wasNull() to check whether the actual database value was NULL, since a primitive getter can't represent null and silently returns 0 instead; alternatively, use the wrapper-returning getObject() method, which can genuinely return null.$a$,
 $ex$```java
int age = rs.getInt("age");
if (rs.wasNull()) age = -1; // distinguish "actually 0" from "was NULL"

Integer ageObj = (Integer) rs.getObject("age"); // can be a real null
```$ex$,
 $ip$Forgetting wasNull() is a subtle bug source — a NULL column and a genuine 0 value look identical if you only check the primitive getter's return value.$ip$,
 'Hard', 6),

('java-sql-and-java-07','java-sql-and-java',
 $q$How would you call a stored procedure from Java, including one with an output parameter?$q$,
 $a$Use a CallableStatement created with prepareCall(), registering any output parameters with registerOutParameter() before execution and reading them afterward with the matching getter, in addition to setting any input parameters normally.$a$,
 $ex$```java
CallableStatement cs = con.prepareCall("{call getTotalOrders(?, ?)}");
cs.setInt(1, customerId);               // input parameter
cs.registerOutParameter(2, Types.INTEGER); // output parameter
cs.execute();
int total = cs.getInt(2);
```$ex$,
 $ip$A stored procedure can have IN, OUT, or INOUT parameters — registerOutParameter() is required for any parameter the procedure writes a value back into.$ip$,
 'Medium', 7),

('java-sql-and-java-08','java-sql-and-java',
 $q$What is a common way to prevent SQL injection when building dynamic queries with optional filters?$q$,
 $a$Build the SQL string with placeholders that only get added when a given filter is actually provided, but always bind every value through PreparedStatement parameters rather than string concatenation — never insert the actual filter value directly into the SQL text, even for something like a numeric ID.$a$,
 $ex$```java
StringBuilder sql = new StringBuilder("select * from products where 1=1");
List<Object> params = new ArrayList<>();
if (category != null) { sql.append(" and category = ?"); params.add(category); }
if (minPrice != null) { sql.append(" and price >= ?"); params.add(minPrice); }
PreparedStatement ps = con.prepareStatement(sql.toString());
for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
```$ex$,
 $ip$Dynamic SQL built this way is still fully safe from injection, because every actual value still goes through a parameter binding, not string concatenation — only the SQL structure, which clauses exist, is built dynamically.$ip$,
 'Hard', 8),

('java-sql-and-java-09','java-sql-and-java',
 $q$What are typical database-related exceptions you'll encounter from Java, and how should they generally be handled?$q$,
 $a$SQLException, and its subclasses, is the checked exception JDBC methods throw for problems like a broken connection, a constraint violation, or invalid SQL; SQLTimeoutException specifically signals a query or connection took too long. These are generally caught at a service or repository boundary, logged with enough context to debug, and translated into an application-specific exception rather than leaking raw JDBC details up to the caller.$a$,
 $ex$```java
try {
    ps.executeUpdate();
} catch (SQLException e) {
    if ("23505".equals(e.getSQLState())) { // Postgres unique_violation code
        throw new DuplicateEmailException("Email already registered");
    }
    throw new RuntimeException("Database error", e);
}
```$ex$,
 $ip$SQLState codes, like "23505" for a unique constraint violation, let you react differently to specific database error types instead of treating every SQLException the same way.$ip$,
 'Medium', 9),

('java-sql-and-java-10','java-sql-and-java',
 $q$Why is connection pooling especially important for a Java web backend talking to a database?$q$,
 $a$A web backend can receive many concurrent requests, each needing database access, and opening a brand-new physical connection for every single request would be far too slow and would quickly overwhelm the database with connection overhead. A connection pool keeps a bounded set of already-open connections ready to be borrowed and returned quickly across many concurrent requests, keeping both latency and database load predictable.$a$,
 $ex$$ex$,
 $ip$Sizing a connection pool too large can overwhelm the database just as badly as too few connections can bottleneck the application — pool size needs to match the database's actual capacity.$ip$,
 'Medium', 10),

('java-sql-and-java-11','java-sql-and-java',
 $q$What's a practical example of combining PreparedStatement, transactions, and exception handling in one backend operation?$q$,
 $a$A typical "place an order" operation would open a connection, disable auto-commit, insert the order row with a PreparedStatement, retrieve its generated key, insert each order-item row referencing that key, often batched, commit if everything succeeded, and roll back and translate the exception into a meaningful application error if anything failed along the way, with everything wrapped in try-with-resources so connections are always released.$a$,
 $ex$```java
try (Connection con = dataSource.getConnection()) {
    con.setAutoCommit(false);
    try {
        long orderId = insertOrder(con, order);
        insertOrderItems(con, orderId, order.getItems());
        con.commit();
    } catch (SQLException e) {
        con.rollback();
        throw new OrderPlacementException("Could not place order", e);
    }
}
```$ex$,
 $ip$This pattern — connection, transaction boundary, multiple related statements, commit/rollback, and guaranteed cleanup — is essentially the backbone of almost every real JDBC-based backend operation.$ip$,
 'Hard', 11)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 3. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $$
declare
  v_topics int;
  v_questions int;
  v_prior_topics int;
  v_prior_questions int;
  v_dupe_count int;
begin
  select count(*) into v_topics from public.interview_topics where category_id = 'java'
    and id in ('java-abstract-classes','java-generics','java-jvm','java-jdbc','java-sql-and-java');
  if v_topics <> 5 then
    raise exception 'validation: expected 5 batch-4 interview_topics, found %', v_topics;
  end if;

  select count(*) into v_questions from public.interview_questions
    where topic_id in ('java-abstract-classes','java-generics','java-jvm','java-jdbc','java-sql-and-java');
  if v_questions <> 56 then
    raise exception 'validation: expected 56 batch-4 interview_questions, found %', v_questions;
  end if;

  -- Batches 1-3 must be untouched by this migration.
  select count(*) into v_prior_topics from public.interview_topics where category_id = 'java'
    and id in ('java-core-java','java-oop','java-classes-objects','java-constructors','java-inheritance',
               'java-polymorphism','java-encapsulation','java-abstraction','java-strings','java-arrays',
               'java-collections','java-exception-handling','java-multithreading','java-8-plus','java-interfaces');
  if v_prior_topics <> 15 then
    raise exception 'validation: batch-1/2/3 interview_topics missing or damaged, found %', v_prior_topics;
  end if;
  select count(*) into v_prior_questions from public.interview_questions
    where topic_id in ('java-core-java','java-oop','java-classes-objects','java-constructors','java-inheritance',
                        'java-polymorphism','java-encapsulation','java-abstraction','java-strings','java-arrays',
                        'java-collections','java-exception-handling','java-multithreading','java-8-plus','java-interfaces');
  if v_prior_questions <> 160 then
    raise exception 'validation: batch-1/2/3 interview_questions missing or damaged, found %', v_prior_questions;
  end if;

  -- No duplicate question text across ALL Java interview questions so far.
  select count(*) into v_dupe_count from (
    select question from public.interview_questions iq
    join public.interview_topics it on it.id = iq.topic_id
    where it.category_id = 'java'
    group by question having count(*) > 1
  ) d;
  if v_dupe_count > 0 then
    raise exception 'validation: % duplicate question text value(s) found across Java interview questions', v_dupe_count;
  end if;

  raise notice '0107 OK: 5 batch-4 topics (Abstract Classes, Generics, JVM, JDBC, SQL + Java), % questions. Batches 1-3 intact (% topics, % questions). No duplicate question text.', v_questions, v_prior_topics, v_prior_questions;
end $$;

notify pgrst, 'reload schema';
