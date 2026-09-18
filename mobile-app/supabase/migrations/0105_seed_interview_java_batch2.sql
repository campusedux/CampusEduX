-- mobile-app/supabase/migrations/0105_seed_interview_java_batch2.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: admin-panel/supabase/migrations/077_seed_interview_java_batch2.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — Java Interview Questions content, batch 2 of 6
-- (mobile 0105_seed_interview_java_batch2.sql  ==  admin 077_seed_interview_java_batch2.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Seeds the next 5 of 26 Java Interview Questions topics (Polymorphism,
--   Encapsulation, Abstraction, Strings, Arrays), each with an original,
--   technically accurate set of Question/Answer/Example/Important Point rows
--   for /practice/interview-questions/java/<topic>. Follows batch 1
--   (0104/076) exactly: same idempotency technique (deterministic `id`,
--   `on conflict (id) do update`), same sort_order gap convention (this batch
--   continues at 60, 70, 80, 90, 100), does not touch any batch-1 row.
--   4 more batches follow, covering the remaining 16 topics.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -------------------------------------------------------
do $$
begin
  if to_regclass('public.interview_categories') is null
     or to_regclass('public.interview_topics') is null
     or to_regclass('public.interview_questions') is null then
    raise exception '0105/077: interview_categories/topics/questions not found — apply 0103_interview_questions.sql (admin 075) first.';
  end if;
  if not exists (select 1 from public.interview_categories where id = 'java') then
    raise exception '0105/077: java category not found — apply 0104_seed_interview_java_batch1.sql (admin 076) first.';
  end if;
end $$;

-- ===========================================================================
-- 1. TOPICS (batch 2 of 6)
-- ===========================================================================
insert into public.interview_topics (id, category_id, name, slug, description, sort_order)
values
  ('java-polymorphism', 'java', 'Polymorphism', 'polymorphism',
   'Compile-time vs runtime polymorphism, dynamic dispatch, and upcasting/downcasting.', 60),
  ('java-encapsulation', 'java', 'Encapsulation', 'encapsulation',
   'Data hiding, access modifiers, and designing classes that protect their own state.', 70),
  ('java-abstraction', 'java', 'Abstraction', 'abstraction',
   'Hiding implementation detail behind abstract classes and interfaces.', 80),
  ('java-strings', 'java', 'Strings', 'strings',
   'String immutability, the String Pool, StringBuilder/StringBuffer, and common String methods.', 90),
  ('java-arrays', 'java', 'Arrays', 'arrays',
   'Array basics, multidimensional arrays, copying, sorting, and searching.', 100)
on conflict (id) do update set
  category_id = excluded.category_id, name = excluded.name, slug = excluded.slug,
  description = excluded.description, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. QUESTIONS
-- ===========================================================================

-- ---- Polymorphism (9) -------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-polymorphism-01','java-polymorphism',
 $q$What is polymorphism in Java?$q$,
 $a$Polymorphism means "many forms" — the ability for the same method call or the same reference type to behave differently depending on the actual object involved. In Java, it lets you write code against a general type, such as a parent class or interface, while the specific behavior that runs is determined by whatever concrete object is actually being used.$a$,
 $ex$```java
Animal a = new Dog();
a.eat(); // runs Dog's version of eat(), decided at runtime
```$ex$,
 $ip$Java has two forms of polymorphism: overloading (compile-time) and overriding (runtime).$ip$,
 'Easy', 1),

('java-polymorphism-02','java-polymorphism',
 $q$What is the difference between compile-time (static) and runtime (dynamic) polymorphism?$q$,
 $a$Compile-time polymorphism is resolved by the compiler based on the method signature at the call site — this is what happens with method overloading. Runtime polymorphism is resolved based on the actual object's class at the moment the method is called — this is what happens with method overriding, through a mechanism called dynamic method dispatch.$a$,
 $ex$```java
add(1, 2);       // compile-time: which overload of add() matches?
animal.sound();  // runtime: which class's sound() actually runs?
```$ex$,
 $ip$Compile-time polymorphism is about which method is picked; runtime polymorphism is about which implementation of an already-picked method actually executes.$ip$,
 'Medium', 2),

('java-polymorphism-03','java-polymorphism',
 $q$What is method overloading, and how does Java decide which overload to call?$q$,
 $a$Method overloading means defining multiple methods with the same name but different parameter lists in the same class. The compiler decides which overload to call by matching the number, types, and order of the arguments at the call site before the program even runs, so the return type alone can never distinguish two overloads.$a$,
 $ex$```java
void print(int x) { }
void print(String x) { }
print(10);     // calls print(int)
print("hi");   // calls print(String)
```$ex$,
 $ip$If no exact match exists, Java can still widen a primitive argument or autobox it to find a compatible overload, following a defined precedence order.$ip$,
 'Easy', 3),

('java-polymorphism-04','java-polymorphism',
 $q$What is method overriding, and what rules must an overriding method follow?$q$,
 $a$Method overriding lets a subclass supply its own implementation of an inherited instance method with the same name and parameter list. The overriding method must have a compatible return type (the same type or a covariant subtype), cannot reduce the method's access level, and cannot throw new or broader checked exceptions than the method it overrides.$a$,
 $ex$```java
class Animal { void sound() throws Exception { } }
class Dog extends Animal {
    @Override void sound() { System.out.println("Bark"); } // narrower exception, that's fine
}
```$ex$,
 $ip$The @Override annotation isn't required, but it lets the compiler catch a typo in the method signature that would otherwise silently create a new method instead of overriding one.$ip$,
 'Medium', 4),

('java-polymorphism-05','java-polymorphism',
 $q$What is dynamic method dispatch?$q$,
 $a$Dynamic method dispatch is the mechanism the JVM uses to decide, at runtime, which overridden method implementation to actually run — it looks at the real class of the object the reference points to, not the declared type of the reference variable. This is what makes calling a method through a parent-type reference still produce the child's behavior.$a$,
 $ex$```java
Animal a = new Dog();
a.sound(); // JVM checks a's actual runtime type (Dog), not its declared type (Animal)
```$ex$,
 $ip$This lookup happens for every overridden instance method call, which is why runtime polymorphism is sometimes called "late binding."$ip$,
 'Medium', 5),

('java-polymorphism-06','java-polymorphism',
 $q$What is upcasting, and why is it always safe?$q$,
 $a$Upcasting means treating a subclass object as an instance of its superclass, by assigning it to a superclass-typed reference. It's always safe and can even happen implicitly, because every subclass object genuinely is an instance of its superclass too.$a$,
 $ex$```java
Dog d = new Dog();
Animal a = d; // upcasting, always safe, no cast needed
```$ex$,
 $ip$After upcasting, you can only directly call methods declared on the superclass type through that reference — but overridden methods still run the subclass's version thanks to dynamic dispatch.$ip$,
 'Easy', 6),

('java-polymorphism-07','java-polymorphism',
 $q$What is downcasting, and why can it fail at runtime?$q$,
 $a$Downcasting means converting a superclass reference back to a specific subclass type, which requires an explicit cast because the compiler can't guarantee the object really is that subclass. If the object isn't actually an instance of the target subclass at runtime, Java throws a ClassCastException.$a$,
 $ex$```java
Animal a = new Dog();
Dog d = (Dog) a;   // safe here, a really holds a Dog
Cat c = (Cat) a;   // compiles, but throws ClassCastException at runtime
```$ex$,
 $ip$Use instanceof (or Java's pattern-matching instanceof) to check the actual type before downcasting when you're not certain.$ip$,
 'Medium', 7),

('java-polymorphism-08','java-polymorphism',
 $q$Can a private or static method participate in runtime polymorphism?$q$,
 $a$No — static methods are resolved by the reference type at compile time (method hiding, not overriding), and private methods aren't inherited or visible to subclasses at all, so neither can participate in the dynamic dispatch that produces runtime polymorphism. Only inherited, overridable instance methods (not private, not static, not final) get polymorphic behavior.$a$,
 $ex$```java
class A { static void greet() { System.out.println("A"); } }
class B extends A { static void greet() { System.out.println("B"); } }
A ref = new B();
ref.greet(); // prints "A" — resolved by reference type, not polymorphic
```$ex$,
 $ip$This is a favorite interview trap — always check whether a method is static before reasoning about which version "wins."$ip$,
 'Hard', 8),

('java-polymorphism-09','java-polymorphism',
 $q$Why is polymorphism useful in real code?$q$,
 $a$Polymorphism lets you write code against a shared parent type or interface and add new behavior later just by creating new subclasses, without touching the code that already uses the parent type. For example, a payment-processing method that accepts a Payment interface parameter can work with CardPayment, UpiPayment, or any future payment type without being changed at all.$a$,
 $ex$```java
void process(Payment p) { p.pay(500); } // works for any current or future Payment implementation
```$ex$,
 $ip$This is the foundation of extensible, loosely coupled designs — new behavior is added by adding classes, not by editing existing ones.$ip$,
 'Medium', 9)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Encapsulation (8) ------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-encapsulation-01','java-encapsulation',
 $q$What is encapsulation in Java?$q$,
 $a$Encapsulation means keeping an object's internal state, its fields, hidden from the outside and only allowing controlled access through public methods. It lets a class enforce its own rules about how its data can be read or changed, instead of letting other code modify it directly and possibly leave it in an invalid state.$a$,
 $ex$```java
class Account {
    private double balance;
    public void deposit(double amount) {
        if (amount > 0) balance += amount;
    }
    public double getBalance() { return balance; }
}
```$ex$,
 $ip$Private fields plus public getters/setters are a common implementation, but true encapsulation is about protecting invariants, not just about hiding fields mechanically.$ip$,
 'Easy', 1),

('java-encapsulation-02','java-encapsulation',
 $q$Why use private fields with public getters and setters instead of public fields?$q$,
 $a$Public fields let any code change an object's state directly, with no way to validate the new value or react to the change. Private fields with getters and setters let the class control exactly what values are allowed and can add logic, such as validation, logging, or derived calculations, later without breaking any code that calls the getter or setter.$a$,
 $ex$```java
private int age;
public void setAge(int age) {
    if (age < 0) throw new IllegalArgumentException("Age cannot be negative");
    this.age = age;
}
```$ex$,
 $ip$A getter or setter doesn't have to be a trivial pass-through — that flexibility is the actual value of encapsulation.$ip$,
 'Easy', 2),

('java-encapsulation-03','java-encapsulation',
 $q$What are Java's access modifiers, and how do they support encapsulation?$q$,
 $a$Java has four access levels: private (only the same class), package-private/default (same package), protected (same package plus subclasses), and public (everywhere). Encapsulation typically uses the narrowest level that still works — private fields, and public methods only for what genuinely needs to be exposed.$a$,
 $ex$```java
private int balance;            // hidden
protected void logChange() { }  // visible to subclasses
public double getBalance() { return balance; } // exposed deliberately
```$ex$,
 $ip$Top-level classes can only be public or package-private — private and protected aren't valid there.$ip$,
 'Easy', 3),

('java-encapsulation-04','java-encapsulation',
 $q$Can a class be fully encapsulated without any getters or setters at all?$q$,
 $a$Yes — encapsulation doesn't require exposing every field through a getter or setter. A class can keep some state entirely internal and only expose higher-level behavior, methods that describe what the object does rather than what data it holds, which is often a stronger form of encapsulation than a class made only of getters and setters.$a$,
 $ex$```java
class Stack {
    private int[] data;
    private int top;
    public void push(int x) { data[++top] = x; } // no direct access to data/top at all
}
```$ex$,
 $ip$A class that is "just getters and setters for every field" is sometimes criticized as an "anemic" design that doesn't really protect its own invariants.$ip$,
 'Medium', 4),

('java-encapsulation-05','java-encapsulation',
 $q$What is a read-only property, and how is it implemented in Java?$q$,
 $a$A read-only property is a piece of state that can be set once, usually in the constructor, but never changed afterward, implemented in Java by making the field private final and providing only a getter, with no setter at all.$a$,
 $ex$```java
class User {
    private final String id;
    User(String id) { this.id = id; }
    public String getId() { return id; }
}
```$ex$,
 $ip$final prevents reassigning the field itself, but if the field holds a mutable object like a List, callers could still mutate its contents unless the getter returns a defensive copy.$ip$,
 'Medium', 5),

('java-encapsulation-06','java-encapsulation',
 $q$What's the risk of returning a mutable field directly from a getter?$q$,
 $a$If a getter returns a direct reference to a mutable internal field, such as a List or an array, the caller can modify that object's contents from outside the class, silently bypassing any validation the class would normally enforce, breaking encapsulation even though the field itself was private.$a$,
 $ex$```java
private List<String> tags = new ArrayList<>();
public List<String> getTags() { return tags; }              // caller can now do getTags().clear()
public List<String> getTagsSafe() { return List.copyOf(tags); } // safer: defensive copy
```$ex$,
 $ip$Returning an unmodifiable view or a defensive copy is the standard fix for this exact leak.$ip$,
 'Hard', 6),

('java-encapsulation-07','java-encapsulation',
 $q$How does encapsulation help with maintaining and changing code later?$q$,
 $a$Because callers only interact with a class through its public methods, the class is free to change how it stores or computes its internal state, as long as the public method behavior stays the same, without breaking any code that uses it. This decoupling is what makes large codebases safe to refactor incrementally.$a$,
 $ex$$ex$,
 $ip$This benefit disappears if internal fields are exposed publicly, since callers can then depend on internal representation details that were never meant to be part of the contract.$ip$,
 'Medium', 7),

('java-encapsulation-08','java-encapsulation',
 $q$Is encapsulation the same thing as data hiding?$q$,
 $a$They're closely related but not identical — data hiding specifically refers to restricting direct access to fields using access modifiers, while encapsulation is the broader idea of bundling data and behavior together and controlling access to both, of which data hiding is one mechanism. In everyday interview conversation, though, the terms are often used interchangeably.$a$,
 $ex$$ex$,
 $ip$If asked to distinguish them, mention that encapsulation is the design principle and data hiding is one technique used to achieve it.$ip$,
 'Medium', 8)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Abstraction (8) ---------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-abstraction-01','java-abstraction',
 $q$What is abstraction in Java?$q$,
 $a$Abstraction means exposing only the essential behavior of an object while hiding the internal implementation details that a caller doesn't need to know about. In Java, it's achieved mainly through abstract classes and interfaces, which describe what an object can do without necessarily saying how.$a$,
 $ex$```java
interface Payment { void pay(double amount); }
class UpiPayment implements Payment {
    public void pay(double amount) { System.out.println("Paid " + amount + " via UPI"); }
}
```$ex$,
 $ip$A caller using the Payment interface never needs to know how UpiPayment actually processes the payment internally.$ip$,
 'Easy', 1),

('java-abstraction-02','java-abstraction',
 $q$What are the two main ways Java achieves abstraction?$q$,
 $a$Java achieves abstraction through abstract classes, which can mix fully implemented methods with abstract ones that subclasses must complete, and interfaces, which primarily define a contract of method signatures a class agrees to implement. Both hide implementation detail behind a simpler, described capability.$a$,
 $ex$```java
abstract class Shape { abstract double area(); }
interface Drawable { void draw(); }
```$ex$,
 $ip$Choosing between them depends on whether you need shared implementation and state (abstract class) or just a capability contract across unrelated classes (interface).$ip$,
 'Easy', 2),

('java-abstraction-03','java-abstraction',
 $q$How is abstraction different from encapsulation?$q$,
 $a$Abstraction is about hiding complexity by exposing only what's necessary at the design level, deciding what a caller needs to know. Encapsulation is about hiding data specifically, using access control, to protect an object's internal state. They work together, but abstraction is a design-level concept, while encapsulation is more of an implementation-level mechanism.$a$,
 $ex$$ex$,
 $ip$A common one-line distinction: abstraction hides complexity/detail; encapsulation hides data.$ip$,
 'Medium', 3),

('java-abstraction-04','java-abstraction',
 $q$Why can't you create an object of an abstract class directly?$q$,
 $a$An abstract class is intentionally incomplete — it may declare abstract methods with no body, so Java has no way to know what those methods should actually do if you tried to create a plain instance of the abstract class itself. Only a concrete subclass that implements all the abstract methods can be instantiated.$a$,
 $ex$```java
abstract class Shape { abstract double area(); }
Shape s = new Shape();   // compile error
Shape s2 = new Circle(5); // fine, Circle implements area()
```$ex$,
 $ip$An abstract class can still have a constructor — it's just called via super() from a concrete subclass, never directly with new.$ip$,
 'Medium', 4),

('java-abstraction-05','java-abstraction',
 $q$Can an abstract class have a mix of abstract and concrete (implemented) methods?$q$,
 $a$Yes — that's one of the main reasons to choose an abstract class over an interface. It can provide shared, ready-to-use implementation for some methods while leaving others abstract for subclasses to fill in with type-specific behavior.$a$,
 $ex$```java
abstract class Employee {
    String name;
    void printName() { System.out.println(name); } // shared, concrete
    abstract double calculateSalary();               // must be provided by each subclass
}
```$ex$,
 $ip$This mix is exactly what lets an abstract class reduce duplicated code across related subclasses.$ip$,
 'Medium', 5),

('java-abstraction-06','java-abstraction',
 $q$What happens if a subclass doesn't implement all of an abstract class's abstract methods?$q$,
 $a$The subclass itself must then also be declared abstract, since it's still incomplete — it can't be instantiated either. Only when every abstract method somewhere in the chain finally has a concrete implementation can a class actually be instantiated with new.$a$,
 $ex$```java
abstract class Shape { abstract double area(); }
abstract class Polygon extends Shape { } // still abstract, area() still missing
class Square extends Polygon {
    double side;
    double area() { return side * side; } // now concrete
}
```$ex$,
 $ip$This chain lets you build multi-level abstraction hierarchies where each level adds more concrete detail.$ip$,
 'Medium', 6),

('java-abstraction-07','java-abstraction',
 $q$Why is abstraction useful when designing a large system?$q$,
 $a$Abstraction lets different parts of a system depend on a simple, stable description of a capability, an interface or abstract class, rather than on a specific concrete implementation, so implementations can change, be swapped, or multiply without forcing changes everywhere that capability is used.$a$,
 $ex$```java
void sendNotification(Notifier n) { n.send("Hello"); } // works with Email, SMS, Push, or any future Notifier
```$ex$,
 $ip$This is the same idea behind "programming to an interface, not an implementation" — a core object-oriented design guideline.$ip$,
 'Medium', 7),

('java-abstraction-08','java-abstraction',
 $q$Give a real-world analogy for abstraction.$q$,
 $a$Driving a car is a classic analogy: you use the steering wheel, pedals, and gear stick without knowing how the engine, transmission, or fuel injection actually work internally. The car abstracts away that complexity behind a simple set of controls, similar to how a well-designed class or interface exposes simple methods while hiding complicated logic behind them.$a$,
 $ex$$ex$,
 $ip$A good abstraction hides just enough complexity — hiding too much can make an API inflexible, while hiding too little defeats the purpose.$ip$,
 'Easy', 8)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Strings (9) --------------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-strings-01','java-strings',
 $q$Why is the String class immutable in Java?$q$,
 $a$Once a String object is created, its internal character content can never be changed — any operation that looks like it modifies a String, such as concatenation, actually creates and returns a brand-new String object. Immutability makes strings safe to share across threads without synchronization, allows the JVM to cache each String's hash code, and makes String pooling possible.$a$,
 $ex$```java
String s = "Java";
s.concat(" 17");
System.out.println(s); // still prints "Java" — concat() returned a new String that was discarded
```$ex$,
 $ip$To keep a changed value, you must assign the returned String back, e.g. s = s.concat(" 17").$ip$,
 'Easy', 1),

('java-strings-02','java-strings',
 $q$What is the String Pool, and how does it save memory?$q$,
 $a$The String Pool is a special JVM-managed memory area that stores string literals so that identical literals can share the same underlying object instead of each creating a separate one. When you write a String literal, Java checks the pool first and reuses an existing matching object if one is already there.$a$,
 $ex$```java
String a = "Java";
String b = "Java";
System.out.println(a == b); // true — both point to the same pooled object
```$ex$,
 $ip$Strings created with new String("Java") are NOT automatically pooled — they create a separate object on the heap even if an identical literal is in the pool.$ip$,
 'Medium', 2),

('java-strings-03','java-strings',
 $q$What's the difference between == and equals() for Strings?$q$,
 $a$== compares whether two references point to the exact same object in memory, reference identity, while .equals(), overridden by String, compares the actual sequence of characters, returning true whenever the content matches regardless of whether they're the same object.$a$,
 $ex$```java
String a = new String("Java");
String b = new String("Java");
System.out.println(a == b);       // false — two different objects
System.out.println(a.equals(b));  // true — same characters
```$ex$,
 $ip$Always use .equals() to compare String content — using == is a very common beginner bug.$ip$,
 'Easy', 3),

('java-strings-04','java-strings',
 $q$What is the difference between String, StringBuilder, and StringBuffer?$q$,
 $a$String is immutable, so every modification creates a new object. StringBuilder is mutable and lets you change the same object's content in place, which is much more efficient for building or editing strings repeatedly in a single thread. StringBuffer behaves like StringBuilder but has synchronized methods, making it safe for multiple threads at the cost of extra overhead.$a$,
 $ex$```java
StringBuilder sb = new StringBuilder();
sb.append("Java").append(" ").append("Interview");
System.out.println(sb); // "Java Interview" — same object modified in place
```$ex$,
 $ip$For loops that build a large string, always prefer StringBuilder over repeated String concatenation, since each += on a String creates a whole new object.$ip$,
 'Medium', 4),

('java-strings-05','java-strings',
 $q$Why does repeatedly concatenating Strings with + inside a loop hurt performance?$q$,
 $a$Because String is immutable, every + concatenation inside a loop creates a brand-new String object and copies over the old content, so a loop that runs n times ends up creating roughly n intermediate throwaway String objects, wasting both time and memory. Using a StringBuilder and calling append() avoids this by reusing the same growable buffer.$a$,
 $ex$```java
String result = "";
for (int i = 0; i < 1000; i++) result += i; // creates ~1000 intermediate String objects

StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) sb.append(i); // reuses one buffer
```$ex$,
 $ip$The compiler does optimize a single, compile-time-known concatenation expression into a StringBuilder automatically — but it can't do that across loop iterations.$ip$,
 'Medium', 5),

('java-strings-06','java-strings',
 $q$How do you compare two Strings for equality while ignoring case?$q$,
 $a$Use .equalsIgnoreCase(), which compares the two strings character by character while treating uppercase and lowercase letters as equal, rather than manually converting both strings to the same case first and then comparing.$a$,
 $ex$```java
"HELLO".equalsIgnoreCase("hello"); // true
```$ex$,
 $ip$Converting both sides with .toLowerCase() before .equals() also works, but .equalsIgnoreCase() is clearer and avoids creating extra temporary String objects.$ip$,
 'Easy', 6),

('java-strings-07','java-strings',
 $q$What are some commonly used String methods, and what do they do?$q$,
 $a$length() returns the number of characters, charAt(i) returns the character at a given index, substring(start, end) extracts part of the string, indexOf() finds the position of a substring, split() breaks a string into an array using a delimiter, trim()/strip() removes leading and trailing whitespace, and toUpperCase()/toLowerCase() change case.$a$,
 $ex$```java
String s = " Hello World ";
System.out.println(s.trim().toUpperCase()); // "HELLO WORLD"
System.out.println(s.trim().split(" ")[1]);  // "World"
```$ex$,
 $ip$All of these return a new String rather than modifying the original, consistent with String's immutability.$ip$,
 'Easy', 7),

('java-strings-08','java-strings',
 $q$How would you check if a String is a palindrome?$q$,
 $a$Compare characters from both ends of the string moving toward the middle, or more simply, reverse the string and check whether it equals the original.$a$,
 $ex$```java
static boolean isPalindrome(String s) {
    int l = 0, r = s.length() - 1;
    while (l < r) {
        if (s.charAt(l++) != s.charAt(r--)) return false;
    }
    return true;
}
```$ex$,
 $ip$The two-pointer approach runs in O(n) time and O(1) extra space, versus O(n) extra space for the reverse-and-compare approach.$ip$,
 'Medium', 8),

('java-strings-09','java-strings',
 $q$What happens when you use a String as a key in a HashMap?$q$,
 $a$Because String correctly overrides both equals() and hashCode() based on its character content, two different String objects with the same characters produce the same hash code and are considered equal, so a HashMap correctly treats "abc" used as a key in two different places as the same key, even if they're different String objects.$a$,
 $ex$```java
Map<String, Integer> map = new HashMap<>();
map.put(new String("key"), 1);
System.out.println(map.get("key")); // 1 — content-based equals/hashCode make this work
```$ex$,
 $ip$This only works because String's hashCode() is content-based and cached; a custom class used as a map key must override both equals() and hashCode() consistently to behave the same way.$ip$,
 'Hard', 9)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Arrays (9) -----------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-arrays-01','java-arrays',
 $q$What is an array in Java?$q$,
 $a$An array is a fixed-size container that holds multiple values of the same type in contiguous memory, with each value accessed using a numeric index starting at 0. Once created, an array's length can never change.$a$,
 $ex$```java
int[] marks = {80, 90, 75};
System.out.println(marks[1]); // 90
```$ex$,
 $ip$Accessing an index outside the valid range (0 to length-1) throws ArrayIndexOutOfBoundsException.$ip$,
 'Easy', 1),

('java-arrays-02','java-arrays',
 $q$What is the difference between an array and an ArrayList?$q$,
 $a$An array has a fixed length set at creation time and can directly store primitives. An ArrayList is a resizable List implementation that grows and shrinks automatically as elements are added or removed, but it stores objects, so primitives are automatically boxed into their wrapper types.$a$,
 $ex$```java
int[] a = new int[5];                          // fixed size, primitives directly
ArrayList<Integer> list = new ArrayList<>();   // resizable, boxes int to Integer
```$ex$,
 $ip$Choose an array when the size is fixed and performance/memory matters; choose ArrayList when the collection needs to grow or shrink.$ip$,
 'Easy', 2),

('java-arrays-03','java-arrays',
 $q$How do you declare and initialize a 2D array in Java?$q$,
 $a$A two-dimensional array is essentially an array of arrays, declared with two sets of square brackets, and initialized either with explicit values or with new specifying both dimensions.$a$,
 $ex$```java
int[][] grid = { {1, 2, 3}, {4, 5, 6} };
int[][] grid2 = new int[2][3]; // 2 rows, 3 columns, all zeros
System.out.println(grid[1][2]); // 6
```$ex$,
 $ip$Java's 2D arrays don't have to be rectangular — each row can have a different length (a "jagged array"), since each row is really its own independent 1D array.$ip$,
 'Easy', 3),

('java-arrays-04','java-arrays',
 $q$What is the default value of elements in a newly created array?$q$,
 $a$Java automatically initializes array elements to a type-appropriate default when the array is created with new — 0 for numeric types, false for boolean, the null character for char, and null for reference types — rather than leaving them undefined.$a$,
 $ex$```java
int[] a = new int[3];
System.out.println(a[0]); // 0, not garbage or undefined
```$ex$,
 $ip$This differs from local variables, which get no default at all and must be explicitly assigned before use.$ip$,
 'Medium', 4),

('java-arrays-05','java-arrays',
 $q$How do you copy an array in Java?$q$,
 $a$You can copy an array with Arrays.copyOf() or Arrays.copyOfRange() for a straightforward full or partial copy, or with System.arraycopy() for more control and better performance when copying into an existing array; simply assigning one array variable to another only copies the reference, not the contents.$a$,
 $ex$```java
int[] a = {1, 2, 3};
int[] b = a;                          // b is the SAME array as a
int[] c = Arrays.copyOf(a, a.length); // c is an independent copy
```$ex$,
 $ip$Arrays.copyOf() performs a shallow copy — for an array of objects, the copied array holds the same object references, not deep copies of the objects themselves.$ip$,
 'Medium', 5),

('java-arrays-06','java-arrays',
 $q$How do you sort an array in Java, and what algorithm does it use?$q$,
 $a$Arrays.sort() sorts a primitive array in place using a tuned Dual-Pivot Quicksort with O(n log n) average time, while sorting an array of objects uses a stable, modified Merge Sort (TimSort) so that equal elements keep their original relative order, which matters when sorting is based on only one field of a larger object.$a$,
 $ex$```java
int[] a = {5, 2, 8, 1};
Arrays.sort(a); // {1, 2, 5, 8}
```$ex$,
 $ip$Stability only matters for object arrays sorted with a Comparator — primitive arrays have no notion of "equal but distinguishable" elements.$ip$,
 'Medium', 6),

('java-arrays-07','java-arrays',
 $q$How do you search for a value in an array?$q$,
 $a$For an unsorted array, you scan linearly with a loop, which is O(n). For a sorted array, Arrays.binarySearch() finds a value in O(log n) time by repeatedly halving the search range, but it gives undefined results if the array isn't actually sorted first.$a$,
 $ex$```java
int[] a = {10, 20, 30, 40};
int idx = Arrays.binarySearch(a, 30); // 2
```$ex$,
 $ip$binarySearch() returns a negative number, not -1, when the value isn't found, encoding the insertion point — check if (idx >= 0) rather than if (idx != -1).$ip$,
 'Medium', 7),

('java-arrays-08','java-arrays',
 $q$How do you convert an array to a List and back?$q$,
 $a$Arrays.asList() wraps an array in a fixed-size List view backed directly by that array, so you can't add or remove elements, and changes to one are reflected in the other, while List.toArray() converts a List back into a new, independent array.$a$,
 $ex$```java
Integer[] arr = {1, 2, 3};
List<Integer> list = Arrays.asList(arr); // fixed-size view
Integer[] back = list.toArray(new Integer[0]);
```$ex$,
 $ip$Calling .add() or .remove() on the List returned by Arrays.asList() throws UnsupportedOperationException, since it's not backed by a real resizable structure.$ip$,
 'Hard', 8),

('java-arrays-09','java-arrays',
 $q$How would you find the largest and second-largest elements in an array in one pass?$q$,
 $a$Keep two running variables, one for the current largest value and one for the current second-largest, and update both as you scan the array once, making sure a new maximum correctly pushes the old maximum down into the second-largest slot.$a$,
 $ex$```java
static int secondLargest(int[] a) {
    int first = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
    for (int x : a) {
        if (x > first) { second = first; first = x; }
        else if (x > second && x != first) second = x;
    }
    return second;
}
```$ex$,
 $ip$This runs in O(n) time with O(1) extra space, compared to O(n log n) if you sorted the array first just to read off the last two elements.$ip$,
 'Medium', 9)
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
  v_batch1_topics int;
  v_batch1_questions int;
begin
  select count(*) into v_topics from public.interview_topics where category_id = 'java'
    and id in ('java-polymorphism','java-encapsulation','java-abstraction','java-strings','java-arrays');
  if v_topics <> 5 then
    raise exception 'validation: expected 5 batch-2 interview_topics, found %', v_topics;
  end if;

  select count(*) into v_questions from public.interview_questions
    where topic_id in ('java-polymorphism','java-encapsulation','java-abstraction','java-strings','java-arrays');
  if v_questions <> 43 then
    raise exception 'validation: expected 43 batch-2 interview_questions, found %', v_questions;
  end if;

  -- Batch 1 must be untouched by this migration.
  select count(*) into v_batch1_topics from public.interview_topics where category_id = 'java'
    and id in ('java-core-java','java-oop','java-classes-objects','java-constructors','java-inheritance');
  if v_batch1_topics <> 5 then
    raise exception 'validation: batch-1 interview_topics missing or damaged, found %', v_batch1_topics;
  end if;
  select count(*) into v_batch1_questions from public.interview_questions
    where topic_id in ('java-core-java','java-oop','java-classes-objects','java-constructors','java-inheritance');
  if v_batch1_questions <> 53 then
    raise exception 'validation: batch-1 interview_questions missing or damaged, found %', v_batch1_questions;
  end if;

  raise notice '0105 OK: 5 batch-2 topics (Polymorphism, Encapsulation, Abstraction, Strings, Arrays), % questions. Batch 1 intact (% topics, % questions).', v_questions, v_batch1_topics, v_batch1_questions;
end $$;

notify pgrst, 'reload schema';
