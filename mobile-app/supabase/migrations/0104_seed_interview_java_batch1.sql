-- mobile-app/supabase/migrations/0104_seed_interview_java_batch1.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/076_seed_interview_java_batch1.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — Java Interview Questions content, batch 1 of 6
-- (mobile 0104_seed_interview_java_batch1.sql  ==  admin 076_seed_interview_java_batch1.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Creates the "Java" interview_categories row and seeds the first 5 of 26
--   Java Interview Questions topics (Core Java, OOP, Classes & Objects,
--   Constructors, Inheritance), each with an original, technically accurate
--   set of Question/Answer/Example/Important Point rows for
--   /practice/interview-questions/java/<topic>. 5 more batches follow,
--   covering the remaining 21 topics.
--
--   Idempotency: every row uses a deterministic, human-readable `id`
--   (matching the dsa_topics/dsa_problems convention) and is upserted with
--   `on conflict (id) do update`, so re-running this file only refreshes
--   content — it never duplicates rows. sort_order for topics is left with
--   gaps of 10 (10, 20, 30, ...) across all 26 topics so later batches slot
--   in without renumbering anything seeded here.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -------------------------------------------------------
do $$
begin
  if to_regclass('public.interview_categories') is null
     or to_regclass('public.interview_topics') is null
     or to_regclass('public.interview_questions') is null then
    raise exception '0104/076: interview_categories/topics/questions not found — apply 0103_interview_questions.sql (admin 075) first.';
  end if;
end $$;

-- ===========================================================================
-- 1. CATEGORY — Java
-- ===========================================================================
insert into public.interview_categories (id, name, slug, description, icon, sort_order)
values ('java', 'Java', 'java',
        'Java interview questions and answers, organized by topic, with examples and key points for quick revision.',
        'Coffee', 10)
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, description = excluded.description,
  icon = excluded.icon, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. TOPICS (batch 1 of 6)
-- ===========================================================================
insert into public.interview_topics (id, category_id, name, slug, description, sort_order)
values
  ('java-core-java', 'java', 'Core Java', 'core-java',
   'Java fundamentals — the JVM, JDK, JRE, bytecode, and how a Java program actually runs.', 10),
  ('java-oop', 'java', 'OOP', 'oop',
   'Object-oriented programming as a paradigm — the four pillars, class relationships, and design guidelines.', 20),
  ('java-classes-objects', 'java', 'Classes & Objects', 'classes-objects',
   'Classes, objects, instance vs static members, and object initialization.', 30),
  ('java-constructors', 'java', 'Constructors', 'constructors',
   'Constructors, overloading, chaining, and common constructor pitfalls.', 40),
  ('java-inheritance', 'java', 'Inheritance', 'inheritance',
   'Inheritance, the super keyword, method hiding, and the diamond problem.', 50)
on conflict (id) do update set
  category_id = excluded.category_id, name = excluded.name, slug = excluded.slug,
  description = excluded.description, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 3. QUESTIONS
-- ===========================================================================

-- ---- Core Java (12) --------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-core-java-01','java-core-java',
 $q$What is Java, and what makes it different from many other programming languages?$q$,
 $a$Java is a high-level, class-based, object-oriented programming language whose source code compiles into an intermediate format called bytecode instead of directly into machine code. That bytecode runs inside a Java Virtual Machine (JVM), so the same compiled program can run on any operating system that has a matching JVM, without being recompiled for each platform. Java is used heavily for backend services, enterprise applications, Android development, and large-scale systems where portability and a mature ecosystem matter.$a$,
 $ex$```java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java");
    }
}
```$ex$,
 $ip$Java is not directly compiled to native machine code by javac — it produces bytecode first, and the JVM executes or further compiles that bytecode at runtime.$ip$,
 'Easy', 1),

('java-core-java-02','java-core-java',
 $q$Why is Java called "platform independent"?$q$,
 $a$Java source code is compiled once into bytecode (.class files), and that same bytecode can run unchanged on any machine that has a JVM built for its operating system. The JVM acts as a translation layer between the bytecode and the actual hardware/OS, so the application itself never needs to know what platform it is running on. This idea is commonly summarized as "write once, run anywhere."$a$,
 $ex$$ex$,
 $ip$Platform independence applies to the bytecode, not to native libraries a program depends on — code that calls OS-specific libraries can still lose portability.$ip$,
 'Easy', 2),

('java-core-java-03','java-core-java',
 $q$What is the JVM, and what does it actually do at runtime?$q$,
 $a$The JVM (Java Virtual Machine) is the runtime engine that loads compiled .class files, verifies the bytecode is safe to run, manages memory through garbage collection, and executes the program — either by interpreting bytecode or by compiling hot code paths into native instructions via the JIT compiler. It also enforces security checks and loads classes only when they are actually needed.$a$,
 $ex$$ex$,
 $ip$JVM is a specification with multiple implementations (HotSpot being the most common); it is a runtime engine, not the same thing as the JDK.$ip$,
 'Easy', 3),

('java-core-java-04','java-core-java',
 $q$What is the JDK, and why does a developer need it?$q$,
 $a$The JDK (Java Development Kit) bundles everything needed to develop and run Java applications — the compiler (javac), the launcher (java), debugging and packaging tools like jar and javadoc, and a full Java runtime. Installing the JDK is normally the first step for any Java developer, since it provides both the tools to build a program and the runtime to execute it.$a$,
 $ex$```bash
javac Main.java
java Main
```$ex$,
 $ip$In modern Java distributions there is no separately shipped JRE — the JDK itself contains everything needed to run a program.$ip$,
 'Easy', 4),

('java-core-java-05','java-core-java',
 $q$What is the JRE, and how is it different from the JDK?$q$,
 $a$The JRE (Java Runtime Environment) traditionally referred to just the pieces needed to run an already-compiled Java program — the JVM plus the standard class libraries — without any development tools like a compiler. The JDK is a superset: development tools plus a runtime. In current Java releases the distinction is mostly historical, since Oracle no longer ships the JRE as a separate download.$a$,
 $ex$$ex$,
 $ip$It is fine to explain the historical JDK/JRE/JVM split in an interview, but mention that modern distributions no longer separate JRE from JDK.$ip$,
 'Easy', 5),

('java-core-java-06','java-core-java',
 $q$What is bytecode, and why does it matter for Java's portability?$q$,
 $a$Bytecode is the intermediate, platform-neutral instruction format that the Java compiler produces from .java source files, stored in .class files. It is not native machine code for any specific CPU — instead, the JVM interprets or JIT-compiles it into whatever machine code the current CPU understands. This one extra layer is what lets the same compiled artifact run on different operating systems.$a$,
 $ex$```bash
javac Hello.java
# produces Hello.class containing bytecode
```$ex$,
 $ip$Bytecode is not native machine code — confusing the two is a common interview mistake.$ip$,
 'Easy', 6),

('java-core-java-07','java-core-java',
 $q$What's the relationship between JDK, JRE, and JVM?$q$,
 $a$The JVM executes bytecode. The JRE (conceptually) is the JVM plus the standard runtime libraries needed to run a program. The JDK adds development tooling — the compiler, debugger, and build tools — on top of that runtime. So the JDK is the broadest of the three, and the JVM is the innermost execution engine that both the JRE and JDK ultimately rely on.$a$,
 $ex$$ex$,
 $ip$Do not say the JVM "contains" the JDK — the containment goes the other way: JDK includes a runtime, which relies on the JVM.$ip$,
 'Medium', 7),

('java-core-java-08','java-core-java',
 $q$What are the main features that make Java popular for large applications?$q$,
 $a$Java combines object-oriented design, platform independence through bytecode and the JVM, automatic memory management via garbage collection, strong static typing with compile-time checks, structured exception handling, built-in multithreading support, and a very large standard library and ecosystem. Together these make it practical to build and maintain large, long-lived codebases with many contributors.$a$,
 $ex$$ex$,
 $ip$Java isn't purely object-oriented — it still has primitive types like int, boolean, and char that aren't objects.$ip$,
 'Easy', 8),

('java-core-java-09','java-core-java',
 $q$What is the main method, and why must it be public static void main(String[] args)?$q$,
 $a$main is the conventional entry point the JVM looks for when starting a Java application. It must be public so the JVM's launcher can call it from outside the class; static so it can be invoked without first creating an object (there's nothing to instantiate yet at startup); void because it does not return a value through Java's method-return mechanism; and it takes a String[] so command-line arguments can be passed in.$a$,
 $ex$```java
public static void main(String[] args) {
    System.out.println("Start: " + args.length + " args");
}
```$ex$,
 $ip$The parameter can also be written as String... args (varargs) — both are valid entry-point signatures.$ip$,
 'Easy', 9),

('java-core-java-10','java-core-java',
 $q$How is Java different from C and C++?$q$,
 $a$Java removes manual pointer arithmetic and manual memory management in favor of references and automatic garbage collection, eliminating whole categories of memory-corruption bugs common in C/C++. Java also compiles to portable bytecode instead of platform-specific native code, and it doesn't support multiple inheritance of classes (only of interfaces), whereas C++ does. In exchange, Java trades away some of the fine-grained control over memory layout and performance that C/C++ gives you.$a$,
 $ex$$ex$,
 $ip$Frame this as a trade-off (safety and portability vs. low-level control), not "Java is simply better."$ip$,
 'Medium', 10),

('java-core-java-11','java-core-java',
 $q$What is the classpath, and why does Java need it?$q$,
 $a$The classpath is the list of locations — directories, JAR files, or modules — where the JVM and compiler look for class files when resolving import statements and loading classes at runtime. If a needed class isn't found on the classpath, you get a ClassNotFoundException or NoClassDefFoundError at runtime, or a compile error if it's missing during compilation.$a$,
 $ex$```bash
java -cp lib/somelib.jar:. Main
```$ex$,
 $ip$Build tools like Maven/Gradle manage the classpath for you, but understanding it is essential for debugging "class not found" errors.$ip$,
 'Medium', 11),

('java-core-java-12','java-core-java',
 $q$Is Java a compiled language or an interpreted language?$q$,
 $a$Java is both, in a specific sense: javac compiles source code ahead of time into bytecode, and the JVM then executes that bytecode — historically by interpreting it instruction-by-instruction, with modern JVMs also using a JIT compiler to translate frequently executed bytecode into native machine code on the fly for better performance.$a$,
 $ex$$ex$,
 $ip$Don't call Java "purely interpreted" — ahead-of-time compilation to bytecode plus JIT compilation at runtime is what gives Java its performance profile.$ip$,
 'Medium', 12)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- OOP (10) ---------------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-oop-01','java-oop',
 $q$What is Object-Oriented Programming, and why was it introduced?$q$,
 $a$Object-Oriented Programming (OOP) is a way of structuring software around "objects" that bundle together data (state) and the behavior (methods) that operates on that data, rather than organizing a program as a sequence of standalone functions acting on shared data. It was introduced to make large programs easier to reason about, extend, and maintain by modeling real business or domain concepts directly as objects.$a$,
 $ex$$ex$,
 $ip$OOP is a design paradigm, not a language feature tied to one syntax — Java, Python, and C++ all implement it differently.$ip$,
 'Easy', 1),

('java-oop-02','java-oop',
 $q$What are the four main pillars of OOP in Java?$q$,
 $a$The four pillars are encapsulation (hiding internal state behind controlled methods), inheritance (reusing and extending behavior from a parent class), polymorphism (letting the same method call behave differently depending on the actual object), and abstraction (exposing only essential behavior while hiding implementation detail). Each pillar addresses a different aspect of keeping code organized, reusable, and safe to change.$a$,
 $ex$$ex$,
 $ip$Interviewers often ask you to explain each pillar with a one-line example — keep a short example ready for all four.$ip$,
 'Easy', 2),

('java-oop-03','java-oop',
 $q$How is object-oriented programming different from procedural programming?$q$,
 $a$Procedural programming organizes a program as a series of functions/procedures that operate on data that is often passed around or shared globally, keeping logic and data largely separate. OOP instead groups data and the functions that operate on it into objects, making it easier to control who can access or change that data and to model relationships between real-world entities.$a$,
 $ex$$ex$,
 $ip$Neither style is universally "better" — OOP tends to scale better for large, evolving codebases; procedural code can be simpler for small scripts.$ip$,
 'Easy', 3),

('java-oop-04','java-oop',
 $q$Is Java a fully or purely object-oriented language?$q$,
 $a$No. Java is heavily object-oriented, but it still has eight primitive types (int, double, boolean, char, etc.) that are not objects and don't have methods of their own, along with static members that belong to a class rather than to any object. Languages considered "purely" object-oriented, like Smalltalk, treat everything, including numbers, as objects.$a$,
 $ex$$ex$,
 $ip$Java's wrapper classes (Integer, Double, ...) exist specifically to let primitives participate in object-oriented APIs like collections.$ip$,
 'Medium', 4),

('java-oop-05','java-oop',
 $q$What is the difference between association, aggregation, and composition?$q$,
 $a$Association is the most general relationship — two classes are simply related and know about each other (e.g., a Teacher and a Student). Aggregation is a "has-a" relationship where the contained object can exist independently of the container (e.g., a Department has Employees, but employees still exist if the department is deleted). Composition is a stronger "has-a" relationship where the contained object's lifecycle is tied to the container — if the container is destroyed, so is the part (e.g., a Car and its Engine).$a$,
 $ex$```java
class Car {
    private final Engine engine = new Engine(); // composition
}
```$ex$,
 $ip$The distinction matters for design: composition implies ownership and lifecycle control; aggregation and association don't.$ip$,
 'Medium', 5),

('java-oop-06','java-oop',
 $q$What is the difference between an "is-a" relationship and a "has-a" relationship?$q$,
 $a$An "is-a" relationship is modeled with inheritance — a Dog is-a Animal, so Dog extends Animal. A "has-a" relationship is modeled with composition or aggregation — a Car has-a Engine, implemented as a field rather than a superclass. Choosing the wrong one, such as inheriting just to reuse code when there's no real "is-a" relationship, is a common design mistake.$a$,
 $ex$$ex$,
 $ip$A good rule of thumb: use inheritance only when the subtype could always be substituted wherever the supertype is expected (the Liskov Substitution Principle).$ip$,
 'Medium', 6),

('java-oop-07','java-oop',
 $q$What are coupling and cohesion, and why do they matter in OOP design?$q$,
 $a$Coupling measures how dependent one class is on the internal details of another — low coupling means classes can change independently without breaking each other. Cohesion measures how focused a single class is on doing one well-defined job — high cohesion means a class's responsibilities all relate to a single purpose. Good OOP design aims for low coupling and high cohesion, since it makes code easier to test, reuse, and change safely.$a$,
 $ex$$ex$,
 $ip$A class that does "too many things" (low cohesion) is a common sign it should be split into smaller, focused classes.$ip$,
 'Medium', 7),

('java-oop-08','java-oop',
 $q$Why is "favor composition over inheritance" a common OOP design guideline?$q$,
 $a$Composition lets you build new behavior by combining smaller, independent objects at runtime, whereas inheritance locks in a rigid, compile-time relationship between a subclass and a specific parent that's hard to change later. Deep inheritance hierarchies also tend to become fragile — a change to a base class can unexpectedly break every subclass. Composition keeps components loosely coupled and easier to swap out or test in isolation.$a$,
 $ex$$ex$,
 $ip$This doesn't mean "never use inheritance" — it means reach for composition first, and use inheritance only for genuine "is-a" relationships.$ip$,
 'Hard', 8),

('java-oop-09','java-oop',
 $q$What are the main advantages OOP gives over plain procedural code?$q$,
 $a$OOP makes it easier to model real-world entities directly as objects, reuse behavior through inheritance and composition instead of duplicating code, hide implementation details through encapsulation so internals can change without breaking callers, and write flexible code through polymorphism that can work with many related types through a common interface.$a$,
 $ex$$ex$,
 $ip$These benefits come with a cost — more upfront design effort and indirection — so OOP isn't automatically the right choice for every small script.$ip$,
 'Easy', 9),

('java-oop-10','java-oop',
 $q$How would you model a real-world entity like a "Car" using OOP?$q$,
 $a$You'd define a Car class encapsulating its state (fields like speed, fuelLevel) as private, expose behavior through methods (accelerate(), refuel()) that enforce valid state changes, use composition for parts it "has" (an Engine, Wheel[]), and use inheritance or an interface if you need specialized variants (ElectricCar extends Car, or a Drivable interface) that share or extend common behavior.$a$,
 $ex$```java
class Car {
    private int speed;
    private final Engine engine = new Engine();
    void accelerate(int amount) { speed += amount; }
}
```$ex$,
 $ip$A good model exposes behavior (methods), not raw internal fields, so the class can enforce its own rules.$ip$,
 'Medium', 10)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Classes & Objects (10) --------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-classes-objects-01','java-classes-objects',
 $q$What is a class in Java?$q$,
 $a$A class is a blueprint that defines the fields (state) and methods (behavior) that objects created from it will have. The class itself doesn't hold any real data — it just describes the shape and behavior that each object built from it will follow.$a$,
 $ex$```java
class Student {
    String name;
    void study() { System.out.println(name + " is studying"); }
}
```$ex$,
 $ip$Declaring a class does not create any object — objects only come into existence when you use new.$ip$,
 'Easy', 1),

('java-classes-objects-02','java-classes-objects',
 $q$What is an object in Java?$q$,
 $a$An object is a concrete, runtime instance of a class, with its own identity, its own copy of instance fields, and access to the behavior defined by its class. Many separate objects can be created from the same class, each holding different data.$a$,
 $ex$```java
Student s1 = new Student();
s1.name = "Rahul";
Student s2 = new Student();
s2.name = "Amit";
```$ex$,
 $ip$s1 and s2 are different objects with independent state, even though they were built from the exact same class.$ip$,
 'Easy', 2),

('java-classes-objects-03','java-classes-objects',
 $q$What's the practical difference between a class and an object?$q$,
 $a$A class is a design-time concept — a template that exists once in your compiled code. An object is a runtime concept — an actual piece of allocated memory (on the heap) that follows that template, and there can be zero, one, or many objects of a given class alive at any moment.$a$,
 $ex$$ex$,
 $ip$A useful analogy: class is to object as blueprint is to house.$ip$,
 'Easy', 3),

('java-classes-objects-04','java-classes-objects',
 $q$What is the difference between instance variables, local variables, and static (class) variables?$q$,
 $a$Instance variables are declared inside a class but outside any method, and each object gets its own separate copy. Local variables are declared inside a method or block and only exist while that method is executing, on that thread's stack. Static variables are declared with the static keyword and belong to the class itself — every object of that class shares the exact same copy.$a$,
 $ex$```java
class Counter {
    static int totalCount = 0;   // shared by all objects
    int id;                      // one copy per object
    void increment(int step) {
        int result = id + step;  // local variable
    }
}
```$ex$,
 $ip$Local variables have no default value and must be explicitly initialized before use; instance and static fields get sensible defaults (0, false, null).$ip$,
 'Medium', 4),

('java-classes-objects-05','java-classes-objects',
 $q$What is the difference between an instance method and a static method?$q$,
 $a$An instance method operates on a specific object and can access that object's instance fields via an implicit this. A static method belongs to the class rather than any object, cannot directly access instance fields since there's no particular object involved, and can be called using just the class name without creating an object.$a$,
 $ex$```java
class MathUtils {
    static int square(int n) { return n * n; } // no object needed
}
int r = MathUtils.square(5);
```$ex$,
 $ip$Utility/helper methods that don't depend on object state are natural candidates for static.$ip$,
 'Easy', 5),

('java-classes-objects-06','java-classes-objects',
 $q$What is an anonymous object, and when might you use one?$q$,
 $a$An anonymous object is an object created with new but never assigned to a variable, typically because you only need to use it once immediately, such as calling a single method on it right after construction. It becomes eligible for garbage collection as soon as that expression finishes, since nothing holds a reference to it.$a$,
 $ex$```java
new Student().study(); // used once, never stored
```$ex$,
 $ip$Useful for quick one-off calls, but if you need the object again later you must store it in a variable.$ip$,
 'Medium', 6),

('java-classes-objects-07','java-classes-objects',
 $q$Can a class be useful without ever creating objects from it? What's an example?$q$,
 $a$Yes — a "utility class" made entirely of static members, like Java's own Math class, is used purely through its class name and never needs an object. Such classes are typically given a private constructor to prevent anyone from accidentally instantiating them, since instances would serve no purpose.$a$,
 $ex$```java
final class MathUtils {
    private MathUtils() {}       // prevents instantiation
    static int square(int n) { return n * n; }
}
```$ex$,
 $ip$Making the constructor private is a common, deliberate way to signal "this class is not meant to be instantiated."$ip$,
 'Medium', 7),

('java-classes-objects-08','java-classes-objects',
 $q$What are the default values of instance variables versus local variables in Java?$q$,
 $a$Instance variables (and static variables) automatically get a default value if you don't initialize them — 0 for numeric types, false for boolean, the null character for char, and null for object references. Local variables get no default at all — the compiler requires you to assign a value before you read them, or it's a compile-time error.$a$,
 $ex$$ex$,
 $ip$This is a common interview trap: "what does this uninitialized local variable print?" — the honest answer is that it won't even compile.$ip$,
 'Medium', 8),

('java-classes-objects-09','java-classes-objects',
 $q$What is the order of initialization when a new object is created?$q$,
 $a$When you create an object, Java first initializes static members (only once, the first time the class is loaded), then, for each new object, it runs instance variable initializers and instance initializer blocks in the order they appear in the class, and finally runs the constructor body.$a$,
 $ex$```java
class Demo {
    static { System.out.println("static block"); }   // once, at class load
    { System.out.println("instance block"); }         // every object, before constructor
    Demo() { System.out.println("constructor"); }
}
```$ex$,
 $ip$If a parent class exists, its static and instance initialization happens before the child's, and its constructor runs before the child constructor's body.$ip$,
 'Hard', 9),

('java-classes-objects-10','java-classes-objects',
 $q$How many objects can be created from a single class, and how does Java tell them apart?$q$,
 $a$There is no fixed limit — you can create as many objects of a class as memory allows. Java tells objects apart by their reference/identity (essentially their location in memory), not by their field values, which is why two objects with identical field values are still two distinct objects unless you explicitly define equals() to compare them by content.$a$,
 $ex$$ex$,
 $ip$== on objects compares references (identity), not content — use .equals() when you want to compare the actual data inside two objects.$ip$,
 'Medium', 10)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Constructors (10) --------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-constructors-01','java-constructors',
 $q$What is a constructor in Java?$q$,
 $a$A constructor is a special block of code that runs automatically whenever an object is created with new, used to put the new object into a valid initial state. It has the same name as the class, has no return type at all (not even void), and can't be called directly like a normal method.$a$,
 $ex$```java
class Student {
    String name;
    Student(String name) { this.name = name; }
}
Student s = new Student("Amit");
```$ex$,
 $ip$A constructor is not inherited by subclasses, and it isn't a regular method even though its syntax looks similar.$ip$,
 'Easy', 1),

('java-constructors-02','java-constructors',
 $q$What is a default constructor, and when does Java provide one automatically?$q$,
 $a$If a class declares no constructor of its own, the compiler automatically inserts a no-argument "default constructor" that does nothing but call the parent's no-arg constructor. As soon as you write even one constructor yourself, Java stops adding the default one, so new MyClass() will only work if you've written a matching no-arg constructor yourself.$a$,
 $ex$```java
class Student { }          // compiler-provided no-arg constructor
Student s = new Student(); // works
```$ex$,
 $ip$This is a common source of compile errors when someone adds a parameterized constructor and forgets the implicit no-arg one has now disappeared.$ip$,
 'Easy', 2),

('java-constructors-03','java-constructors',
 $q$What is constructor overloading?$q$,
 $a$Constructor overloading means defining multiple constructors in the same class with different parameter lists, so an object can be created in more than one way depending on what information is available at creation time.$a$,
 $ex$```java
class Rectangle {
    Rectangle() { this(1, 1); }
    Rectangle(int side) { this(side, side); }
    Rectangle(int w, int h) { /* set width/height */ }
}
```$ex$,
 $ip$Just like method overloading, constructors are distinguished by their parameter list, never by return type, since constructors have none anyway.$ip$,
 'Easy', 3),

('java-constructors-04','java-constructors',
 $q$What's the difference between a constructor and a normal method?$q$,
 $a$A constructor shares the class's name, has no return type at all, and runs automatically exactly once per object at creation time via new. A normal method has its own name, must declare a return type (even if void), and can be called any number of times on an existing object.$a$,
 $ex$$ex$,
 $ip$Writing a method with the class's name but adding a return type (even void) makes it a normal method, not a constructor — a subtle mistake.$ip$,
 'Easy', 4),

('java-constructors-05','java-constructors',
 $q$What is constructor chaining, and how do this() and super() achieve it?$q$,
 $a$Constructor chaining means one constructor calls another constructor instead of duplicating initialization logic — this(...) calls another constructor in the same class, while super(...) calls a constructor in the parent class. Both must be the very first statement in a constructor, and only one of the two can be used in the same constructor.$a$,
 $ex$```java
class User {
    User() { this("Guest"); }         // chains to the other constructor
    User(String name) { /* ... */ }
}
```$ex$,
 $ip$If you don't explicitly call this() or super(), Java silently inserts a call to the parent's no-arg constructor as the first line.$ip$,
 'Medium', 5),

('java-constructors-06','java-constructors',
 $q$Can a constructor be private? What's that used for?$q$,
 $a$Yes — a private constructor prevents other classes, even in the same package, from creating instances directly with new. This is the basis of patterns like Singleton, where a class controls its own single instance internally and exposes it through a static method instead of a public constructor.$a$,
 $ex$```java
class Singleton {
    private static final Singleton INSTANCE = new Singleton();
    private Singleton() {}
    static Singleton getInstance() { return INSTANCE; }
}
```$ex$,
 $ip$A private constructor doesn't mean "never instantiated" — it means "only instantiated from inside the class itself."$ip$,
 'Medium', 6),

('java-constructors-07','java-constructors',
 $q$Can constructors be inherited or overridden?$q$,
 $a$No to both. Constructors are tied specifically to building an instance of the exact class they're declared in, so they are never inherited the way normal methods are, and since they aren't inherited, "overriding" doesn't apply to them either. A subclass always defines its own constructors, which may call a parent constructor via super().$a$,
 $ex$$ex$,
 $ip$Constructors can be overloaded (multiple constructors, different parameters) even though they can't be overridden.$ip$,
 'Medium', 7),

('java-constructors-08','java-constructors',
 $q$What happens if a subclass constructor doesn't explicitly call super(...)?$q$,
 $a$The compiler automatically inserts a call to the parent class's no-argument constructor as the first statement. If the parent class doesn't have a no-argument constructor, because it only defines a parameterized one, this becomes a compile error, and the subclass must explicitly call the correct super(...) overload itself.$a$,
 $ex$```java
class Animal {
    Animal(String name) { /* no no-arg constructor exists */ }
}
class Dog extends Animal {
    Dog() { super("unnamed"); } // must call this explicitly
}
```$ex$,
 $ip$This is a very common real compile error once a parent class stops having a no-arg constructor.$ip$,
 'Medium', 8),

('java-constructors-09','java-constructors',
 $q$Can a constructor call an instance method of the same class? What's the risk?$q$,
 $a$Yes, syntactically a constructor can call any instance method. The risk is that if that method is overridden in a subclass and relies on fields the subclass hasn't initialized yet, the overridden version can run during the parent's constructor before the subclass's own fields are set up, producing subtly wrong or null-related behavior.$a$,
 $ex$$ex$,
 $ip$As a general rule, avoid calling overridable instance methods from a constructor unless you're certain about initialization order.$ip$,
 'Hard', 9),

('java-constructors-10','java-constructors',
 $q$Does Java automatically provide a copy constructor, the way C++ does?$q$,
 $a$No — Java has no built-in copy constructor concept. If you want a new object that's a copy of an existing one, you write your own constructor that takes an instance of the same class and copies its fields, implement Cloneable/clone() (which has its own well-known pitfalls), or use a copy factory method.$a$,
 $ex$```java
class Point {
    int x, y;
    Point(Point other) { this.x = other.x; this.y = other.y; } // manual "copy constructor"
}
```$ex$,
 $ip$Because Java has no compiler-generated copy constructor, you must decide yourself whether a "copy" should be shallow or deep for any mutable fields.$ip$,
 'Medium', 10)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Inheritance (11) -----------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-inheritance-01','java-inheritance',
 $q$What is inheritance in Java?$q$,
 $a$Inheritance lets one class (the subclass/child) reuse and extend the fields and methods of another class (the superclass/parent) using the extends keyword. It's appropriate when there's a genuine "is-a" relationship and shared behavior naturally belongs in a common ancestor.$a$,
 $ex$```java
class Animal { void eat() { System.out.println("Eating"); } }
class Dog extends Animal { void bark() { System.out.println("Bark"); } }
```$ex$,
 $ip$Java supports only single inheritance for classes (one direct parent), though a class can implement multiple interfaces.$ip$,
 'Easy', 1),

('java-inheritance-02','java-inheritance',
 $q$What types of inheritance does Java support, and why doesn't it support multiple inheritance of classes?$q$,
 $a$Java directly supports single inheritance (one parent), multilevel inheritance (a chain: grandparent, parent, child), and hierarchical inheritance (several children sharing one parent). It deliberately does not allow a class to extend two classes at once, because if both parents defined a conflicting field or method implementation, there would be no unambiguous way to decide which one the child inherits — the "diamond problem." Interfaces sidestep this because, before default methods, they carried no state and no conflicting implementation.$a$,
 $ex$$ex$,
 $ip$Java achieves the flexibility of "multiple inheritance of type" safely through interfaces, just not multiple inheritance of class implementation.$ip$,
 'Medium', 2),

('java-inheritance-03','java-inheritance',
 $q$What is the super keyword, and what are its main uses?$q$,
 $a$super refers to the immediate parent part of the current object. It has three common uses: calling a parent constructor (super(...), must be the first statement), accessing a parent field that's been hidden by a same-named child field, and calling a parent's version of a method that the child has overridden.$a$,
 $ex$```java
class Dog extends Animal {
    Dog() { super(); }
    @Override void eat() { super.eat(); System.out.println("Dog eats too"); }
}
```$ex$,
 $ip$super() must be the first statement in a constructor when used explicitly, exactly like this().$ip$,
 'Easy', 3),

('java-inheritance-04','java-inheritance',
 $q$What's the difference between single, multilevel, and hierarchical inheritance?$q$,
 $a$Single inheritance is one child extending one direct parent. Multilevel inheritance is a chain where a class extends a class that itself extends another, so the last class indirectly inherits from the first too. Hierarchical inheritance is when multiple distinct child classes all extend the same single parent class, sharing its behavior independently of each other.$a$,
 $ex$$ex$,
 $ip$Java does not support "multiple inheritance" — one child, two direct parents — that's the one pattern that's disallowed for classes.$ip$,
 'Easy', 4),

('java-inheritance-05','java-inheritance',
 $q$What happens to a parent class's private members when a child class inherits from it?$q$,
 $a$Private members still physically exist as part of the inherited object's memory layout, but the child class has no direct access to them by name — they can only be reached indirectly, through public or protected methods the parent class exposes, like getters and setters. This preserves encapsulation even across an inheritance relationship.$a$,
 $ex$$ex$,
 $ip$"Inherited but inaccessible" is the key nuance — don't say private members are "not inherited at all."$ip$,
 'Medium', 5),

('java-inheritance-06','java-inheritance',
 $q$What is method hiding, and how is it different from method overriding?$q$,
 $a$Method hiding happens with static methods: if a subclass declares a static method with the same signature as one in its parent, the version that runs is chosen based on the reference type at compile time, not the actual object type — this is "hiding," not polymorphic dispatch. Overriding, by contrast, applies to instance methods and is resolved at runtime based on the object's actual class, giving true polymorphic behavior.$a$,
 $ex$```java
class A { static void show() { System.out.println("A"); } }
class B extends A { static void show() { System.out.println("B"); } }
A ref = new B();
ref.show(); // prints "A" — hiding is resolved by reference type
```$ex$,
 $ip$Calling a static method through an object reference is legal but discouraged, precisely because it can create this kind of confusion.$ip$,
 'Hard', 6),

('java-inheritance-07','java-inheritance',
 $q$Can a subclass object be created without any parent constructor running?$q$,
 $a$No — every subclass constructor, whether explicitly or implicitly, always triggers exactly one parent constructor call as its first action, via super(...) or an automatically inserted no-arg super(), all the way up the inheritance chain to Object. This guarantees the parent portion of the object is always fully initialized before the child's own constructor body runs.$a$,
 $ex$$ex$,
 $ip$This is why removing a parent's no-arg constructor without updating subclasses is a breaking change.$ip$,
 'Medium', 7),

('java-inheritance-08','java-inheritance',
 $q$What is the "diamond problem," and how does Java avoid it for classes?$q$,
 $a$The diamond problem occurs when a class could inherit from two parents that both define the same method or field, leaving it ambiguous which version the class should use. Java avoids this for classes entirely by only allowing a class to extend one direct parent; for interfaces with default methods, Java instead forces the implementing class to explicitly override the conflicting method to resolve the ambiguity itself.$a$,
 $ex$$ex$,
 $ip$The "resolve it yourself" rule for conflicting default methods is Java's safety valve for the diamond problem in interfaces.$ip$,
 'Hard', 8),

('java-inheritance-09','java-inheritance',
 $q$What's the difference between inheriting from a class and implementing an interface?$q$,
 $a$Inheriting from a class gives you the parent's actual field values and any concrete method implementations it has, but limits you to one parent. Implementing an interface gives you a contract of method signatures, plus any default methods, that your class agrees to fulfill, and a class can implement as many interfaces as it needs, since interfaces traditionally carry no conflicting state.$a$,
 $ex$$ex$,
 $ip$Use inheritance when you want to reuse actual implementation and there's a true "is-a" relationship; use interfaces when you want to guarantee a capability across otherwise unrelated classes.$ip$,
 'Medium', 9),

('java-inheritance-10','java-inheritance',
 $q$Why is inheritance sometimes described as "breaking encapsulation" (the fragile base class problem)?$q$,
 $a$Because a subclass's correctness can depend on internal implementation details of its parent, not just its public contract, a seemingly safe change inside the parent class can unexpectedly break every subclass that relies on the old behavior, even though the parent's public API didn't change. This tight coupling is why "favor composition over inheritance" is common advice for anything beyond a genuine, stable "is-a" relationship.$a$,
 $ex$$ex$,
 $ip$Deep inheritance hierarchies, with many levels, tend to make this problem worse, since a change can ripple through several generations of subclasses.$ip$,
 'Hard', 10),

('java-inheritance-11','java-inheritance',
 $q$Can a final class be inherited, or a final method be overridden?$q$,
 $a$No to both — declaring a class final prevents any other class from extending it at all, and declaring a method final prevents any subclass from providing its own overriding implementation, even if the class itself isn't final. This is used when a design should never be extended or altered by subclasses, such as java.lang.String, which is final specifically so its immutability guarantee can never be broken by a subclass.$a$,
 $ex$$ex$,
 $ip$A final reference variable is a different concept — it means the variable can't be reassigned, not that the object it points to is immutable.$ip$,
 'Medium', 11)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 4. VALIDATION  (raises, never silently passes)
-- ===========================================================================
do $$
declare
  v_topics int;
  v_questions int;
begin
  select count(*) into v_topics from public.interview_topics where category_id = 'java'
    and id in ('java-core-java','java-oop','java-classes-objects','java-constructors','java-inheritance');
  if v_topics <> 5 then
    raise exception 'validation: expected 5 batch-1 interview_topics, found %', v_topics;
  end if;

  select count(*) into v_questions from public.interview_questions
    where topic_id in ('java-core-java','java-oop','java-classes-objects','java-constructors','java-inheritance');
  if v_questions <> 53 then
    raise exception 'validation: expected 53 batch-1 interview_questions, found %', v_questions;
  end if;

  raise notice '0104 OK: java category + 5 topics (Core Java, OOP, Classes & Objects, Constructors, Inheritance), % questions.', v_questions;
end $$;

notify pgrst, 'reload schema';
