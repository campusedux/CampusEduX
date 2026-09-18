# Java Interview Questions — Source Reconciliation Audit & Backup

Applied by migration pair `080_interview_questions_source_reconciliation.sql` (admin) /
`0108_interview_questions_source_reconciliation.sql` (mobile). This file is the permanent
record of what the migration changed and why — a full source Q# -> DB row trace, plus a
backup listing of every row archived (not deleted) by the migration.

## Before / after

| | Before | After |
|---|---|---|
| interview_questions rows | 216 (all `published`) | 260 (121 `published`, 139 `archived`) |
| interview_topics rows (java) | 20 (all `published`) | 25 (24 `published`, 1 `archived`: SQL + Java) |
| Source Q1-121 represented | 81 / 121 | 121 / 121 |

## Full Source Q1-Q121 -> DB mapping (final state)

`Outcome` = what the migration did to reach the final published row for that source question.

| Q# | Source Question | Topic | Final DB ID | Outcome |
|---|---|---|---|---|
| 1 | What is Java? | Core Java | java-core-java-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 2 | Why is Java platform independent? | Core Java | java-core-java-02 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 3 | What is JVM? | Core Java | java-core-java-03 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 4 | What is JDK? | Core Java | java-core-java-04 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 5 | What is JRE? | Core Java | java-core-java-05 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 6 | What is bytecode? | Core Java | java-core-java-06 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 7 | What is the difference between JDK, JRE and JVM? | Core Java | java-core-java-07 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 8 | What are the main features of Java? | Core Java | java-core-java-08 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 9 | What is the main method in Java? | Core Java | java-core-java-09 | SPLIT — rewritten to hold Q9 alone (was merged with Q10) |
| 10 | Why is main() static? | Core Java | java-core-java-13 | SPLIT — inserted as a new row (was silently merged into its sibling's row) |
| 11 | What is OOP? | OOP | java-oop-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 12 | What is encapsulation? | Encapsulation | java-encapsulation-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 13 | What is inheritance? | Inheritance | java-inheritance-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 14 | What is polymorphism? | Polymorphism | java-polymorphism-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 15 | What is abstraction? | Abstraction | java-abstraction-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 16 | What is a class? | Classes & Objects | java-classes-objects-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 17 | What is an object? | Classes & Objects | java-classes-objects-02 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 18 | What is method overloading? | Polymorphism | java-polymorphism-03 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 19 | What is method overriding? | Polymorphism | java-polymorphism-04 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 20 | Overloading vs overriding? | Polymorphism | java-polymorphism-11 | RESTORED — inserted verbatim from source guide |
| 21 | What is a constructor? | Constructors | java-constructors-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 22 | What is a default constructor? | Constructors | java-constructors-02 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 23 | What is this keyword? | Classes & Objects | java-classes-objects-11 | RESTORED — inserted verbatim from source guide |
| 24 | What is super keyword? | Inheritance | java-inheritance-03 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 25 | What is static? | Classes & Objects | java-classes-objects-12 | RESTORED — inserted verbatim from source guide |
| 26 | What is final? | Inheritance | java-inheritance-12 | RESTORED — inserted verbatim from source guide |
| 27 | What is finally? | Exception Handling | java-exception-handling-11 | RESTORED — inserted verbatim from source guide |
| 28 | What is finalize()? | JVM | java-jvm-15 | RESTORED — inserted verbatim from source guide |
| 29 | What are access modifiers? | Encapsulation | java-encapsulation-03 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 30 | Why is String immutable? | Strings | java-strings-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 31 | What is String Pool? | Strings | java-strings-02 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 32 | String vs StringBuilder vs StringBuffer? | Strings | java-strings-04 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 33 | equals() vs == for String? | Strings | java-strings-03 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 34 | What is an array? | Arrays | java-arrays-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 35 | Array vs ArrayList? | Arrays | java-arrays-02 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 36 | What is Collection Framework? | Collections | java-collections-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 37 | List vs Set vs Map? | Collections | java-collections-03 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 38 | What is ArrayList? | Collections | java-collections-04 | SPLIT — rewritten to hold Q38 alone (was merged with Q39) |
| 39 | What is LinkedList? | Collections | java-collections-16 | SPLIT — inserted as a new row (was silently merged into its sibling's row) |
| 40 | What is HashSet? | Collections | java-collections-07 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 41 | What is HashMap? | Collections | java-collections-08 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 42 | HashMap vs Hashtable? | Collections | java-collections-09 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 43 | HashMap vs ConcurrentHashMap? | Collections | java-collections-17 | RESTORED — inserted verbatim from source guide |
| 44 | What is Iterator? | Collections | java-collections-11 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 45 | Comparable vs Comparator? | Collections | java-collections-12 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 46 | What is PriorityQueue? | Collections | java-collections-10 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 47 | What is exception handling? | Exception Handling | java-exception-handling-12 | RESTORED — inserted verbatim from source guide |
| 48 | Checked vs unchecked exception? | Exception Handling | java-exception-handling-02 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 49 | throw vs throws? | Exception Handling | java-exception-handling-04 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 50 | What is try-with-resources? | Exception Handling | java-exception-handling-08 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 51 | What is a thread? | Multithreading | java-multithreading-17 | RESTORED — inserted verbatim from source guide |
| 52 | Process vs thread? | Multithreading | java-multithreading-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 53 | What is synchronization? | Multithreading | java-multithreading-08 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 54 | What is volatile? | Multithreading | java-multithreading-11 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 55 | Runnable vs Callable? | Multithreading | java-multithreading-15 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 56 | What is ExecutorService? | Multithreading | java-multithreading-14 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 57 | sleep() vs wait()? | Multithreading | java-multithreading-05 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 58 | What is deadlock? | Multithreading | java-multithreading-10 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 59 | What is a lambda expression? | Java 8+ | java-8-plus-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 60 | What is a functional interface? | Java 8+ | java-8-plus-02 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 61 | What is Stream API? | Java 8+ | java-8-plus-05 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 62 | map() vs filter()? | Java 8+ | java-8-plus-06 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 63 | What is Optional? | Java 8+ | java-8-plus-11 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 64 | What is method reference? | Java 8+ | java-8-plus-04 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 65 | What is default method in interface? | Java 8+ | java-8-plus-12 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 66 | What is functional programming style in Java? | Java 8+ | java-8-plus-15 | RESTORED — inserted verbatim from source guide |
| 67 | What is heap memory? | JVM | java-jvm-05 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 68 | What is stack memory? | JVM | java-jvm-06 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 69 | What is garbage collection? | JVM | java-jvm-11 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 70 | What is memory leak in Java? | JVM | java-jvm-16 | RESTORED — inserted verbatim from source guide |
| 71 | What is class loader? | JVM | java-jvm-02 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 72 | What is JIT compiler? | JVM | java-jvm-10 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 73 | What is JDBC? | JDBC | java-jdbc-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 74 | Statement vs PreparedStatement? | JDBC | java-jdbc-03 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 75 | What is Spring Framework? | Spring | java-spring-01 | RESTORED — inserted verbatim from source guide |
| 76 | What is dependency injection? | Spring | java-spring-02 | RESTORED — inserted verbatim from source guide |
| 77 | What is Spring Boot? | Spring Boot | java-spring-boot-01 | RESTORED — inserted verbatim from source guide |
| 78 | What is REST API? | REST API | java-rest-api-01 | RESTORED — inserted verbatim from source guide |
| 79 | What is JPA? | JPA / Hibernate | java-jpa-hibernate-01 | RESTORED — inserted verbatim from source guide |
| 80 | What is Hibernate? | JPA / Hibernate | java-jpa-hibernate-02 | RESTORED — inserted verbatim from source guide |
| 81 | What is @RestController? | Spring Boot | java-spring-boot-02 | RESTORED — inserted verbatim from source guide |
| 82 | Why does Java not support multiple inheritance of classes? | Inheritance | java-inheritance-02 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 83 | What is an interface? | Interfaces | java-interfaces-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 84 | Abstract class vs interface? | Abstract Classes | java-abstract-classes-06 | DUPLICATE CONSOLIDATED — kept as sole published row; java-interfaces-09 + java-abstract-classes-09 archived |
| 85 | What is package? | Core Java | java-core-java-14 | RESTORED — inserted verbatim from source guide |
| 86 | What is enum? | Advanced Java | java-advanced-java-01 | RESTORED — inserted verbatim from source guide |
| 87 | What is autoboxing? | Advanced Java | java-advanced-java-02 | RESTORED — inserted verbatim from source guide |
| 88 | What is immutable class? | Advanced Java | java-advanced-java-03 | RESTORED — inserted verbatim from source guide |
| 89 | What is pass-by-value in Java? | Core Java | java-core-java-15 | RESTORED — inserted verbatim from source guide |
| 90 | What is recursion? | Advanced Java | java-advanced-java-04 | RESTORED — inserted verbatim from source guide |
| 91 | What is shallow copy vs deep copy? | Advanced Java | java-advanced-java-05 | RESTORED — inserted verbatim from source guide |
| 92 | What is upcasting? | Polymorphism | java-polymorphism-06 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 93 | What is downcasting? | Polymorphism | java-polymorphism-07 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 94 | What is instanceof? | Polymorphism | java-polymorphism-12 | RESTORED — inserted verbatim from source guide |
| 95 | What is covariant return type? | Polymorphism | java-polymorphism-13 | RESTORED — inserted verbatim from source guide |
| 96 | Can constructors be overridden? | Constructors | java-constructors-07 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 97 | Can static methods be overridden? | Polymorphism | java-polymorphism-08 | SPLIT — rewritten to hold Q97 alone (was merged with Q98) |
| 98 | Can private methods be overridden? | Polymorphism | java-polymorphism-10 | SPLIT — inserted as a new row (was silently merged into its sibling's row) |
| 99 | What is object class? | Advanced Java | java-advanced-java-06 | RESTORED — inserted verbatim from source guide |
| 100 | Why override hashCode when overriding equals? | Collections | java-collections-13 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 101 | What is try-catch-finally flow? | Exception Handling | java-exception-handling-03 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 102 | What is method signature? | Advanced Java | java-advanced-java-07 | RESTORED — inserted verbatim from source guide |
| 103 | What is varargs? | Advanced Java | java-advanced-java-08 | RESTORED — inserted verbatim from source guide |
| 104 | What is static block? | Classes & Objects | java-classes-objects-13 | RESTORED — inserted verbatim from source guide |
| 105 | What is instance initializer block? | Classes & Objects | java-classes-objects-14 | RESTORED — inserted verbatim from source guide |
| 106 | What is type casting? | Polymorphism | java-polymorphism-14 | RESTORED — inserted verbatim from source guide |
| 107 | What is widening and narrowing? | Advanced Java | java-advanced-java-09 | RESTORED — inserted verbatim from source guide |
| 108 | What is constructor chaining? | Constructors | java-constructors-05 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 109 | What is composition? | OOP | java-oop-05 | SPLIT — rewritten to hold Q109 alone (was merged with Q110) |
| 110 | What is aggregation? | OOP | java-oop-11 | SPLIT — inserted as a new row (was silently merged into its sibling's row) |
| 111 | What is marker interface? | Interfaces | java-interfaces-06 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 112 | What is a wrapper class? | Advanced Java | java-advanced-java-10 | RESTORED — inserted verbatim from source guide |
| 113 | Why use generics? | Generics | java-generics-01 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 114 | What is type erasure? | Generics | java-generics-09 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 115 | What is wildcard in generics? | Generics | java-generics-06 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 116 | What is PECS? | Generics | java-generics-07 | UNCHANGED — already published, faithful to this source question (batch 1-4 content) |
| 117 | What is record? | Advanced Java | java-advanced-java-11 | RESTORED — inserted verbatim from source guide |
| 118 | What is sealed class? | Advanced Java | java-advanced-java-12 | RESTORED — inserted verbatim from source guide |
| 119 | What is switch expression? | Advanced Java | java-advanced-java-13 | RESTORED — inserted verbatim from source guide |
| 120 | What is local variable type inference var? | Advanced Java | java-advanced-java-14 | RESTORED — inserted verbatim from source guide |
| 121 | What is text block? | Advanced Java | java-advanced-java-15 | RESTORED — inserted verbatim from source guide |

## Backup: 139 rows archived by this migration (status only — fully intact, not deleted)

### 4a. 137 non-source rows (original content, no source-guide equivalent)

| DB Question ID | Topic | Question |
|---|---|---|
| java-8-plus-03 | Java 8+ | What are Predicate, Consumer, Supplier, and Function, and how do they differ? |
| java-8-plus-07 | Java 8+ | What does reduce() do, and how would you use it? |
| java-8-plus-08 | Java 8+ | What do sorted() and distinct() do in a stream pipeline? |
| java-8-plus-09 | Java 8+ | What is collect(), and what is Collectors.groupingBy() used for? |
| java-8-plus-10 | Java 8+ | What is Collectors.partitioningBy(), and how does it differ from groupingBy()? |
| java-8-plus-13 | Java 8+ | What is the Date and Time API introduced in Java 8, and why did it replace java.util.Date? |
| java-8-plus-14 | Java 8+ | What are some common Java 8 interview traps to watch out for? |
| java-abstract-classes-01 | Abstract Classes | Can an abstract class have a constructor, and what is it used for if the class can never be instantiated directly? |
| java-abstract-classes-02 | Abstract Classes | Can an abstract class have instance fields and static members? |
| java-abstract-classes-03 | Abstract Classes | Can an abstract class have a main() method, and can you run it directly? |
| java-abstract-classes-04 | Abstract Classes | Can an abstract method be static, private, or final? |
| java-abstract-classes-05 | Abstract Classes | What is the difference between "partial abstraction" and "full abstraction"? |
| java-abstract-classes-07 | Abstract Classes | Since Java 8 interfaces can have default methods, what can an abstract class still do that an interface cannot? |
| java-abstract-classes-08 | Abstract Classes | How does polymorphism work through an abstract class reference? |
| java-abstraction-02 | Abstraction | What are the two main ways Java achieves abstraction? |
| java-abstraction-03 | Abstraction | How is abstraction different from encapsulation? |
| java-abstraction-04 | Abstraction | Why can't you create an object of an abstract class directly? |
| java-abstraction-05 | Abstraction | Can an abstract class have a mix of abstract and concrete (implemented) methods? |
| java-abstraction-06 | Abstraction | What happens if a subclass doesn't implement all of an abstract class's abstract methods? |
| java-abstraction-07 | Abstraction | Why is abstraction useful when designing a large system? |
| java-abstraction-08 | Abstraction | Give a real-world analogy for abstraction. |
| java-arrays-03 | Arrays | How do you declare and initialize a 2D array in Java? |
| java-arrays-04 | Arrays | What is the default value of elements in a newly created array? |
| java-arrays-05 | Arrays | How do you copy an array in Java? |
| java-arrays-06 | Arrays | How do you sort an array in Java, and what algorithm does it use? |
| java-arrays-07 | Arrays | How do you search for a value in an array? |
| java-arrays-08 | Arrays | How do you convert an array to a List and back? |
| java-arrays-09 | Arrays | How would you find the largest and second-largest elements in an array in one pass? |
| java-classes-objects-03 | Classes & Objects | What's the practical difference between a class and an object? |
| java-classes-objects-04 | Classes & Objects | What is the difference between instance variables, local variables, and static (class) variables? |
| java-classes-objects-05 | Classes & Objects | What is the difference between an instance method and a static method? |
| java-classes-objects-06 | Classes & Objects | What is an anonymous object, and when might you use one? |
| java-classes-objects-07 | Classes & Objects | Can a class be useful without ever creating objects from it? What's an example? |
| java-classes-objects-08 | Classes & Objects | What are the default values of instance variables versus local variables in Java? |
| java-classes-objects-09 | Classes & Objects | What is the order of initialization when a new object is created? |
| java-classes-objects-10 | Classes & Objects | How many objects can be created from a single class, and how does Java tell them apart? |
| java-collections-02 | Collections | What is the difference between Collection and Collections? |
| java-collections-05 | Collections | What is Vector, and why is it rarely used in new code? |
| java-collections-06 | Collections | What is Stack in Java, and what's a better modern alternative? |
| java-collections-14 | Collections | What is fail-fast vs fail-safe iteration, and what causes ConcurrentModificationException? |
| java-collections-15 | Collections | How would you choose the right collection type for a given requirement? |
| java-constructors-03 | Constructors | What is constructor overloading? |
| java-constructors-04 | Constructors | What's the difference between a constructor and a normal method? |
| java-constructors-06 | Constructors | Can a constructor be private? What's that used for? |
| java-constructors-08 | Constructors | What happens if a subclass constructor doesn't explicitly call super(...)? |
| java-constructors-09 | Constructors | Can a constructor call an instance method of the same class? What's the risk? |
| java-constructors-10 | Constructors | Does Java automatically provide a copy constructor, the way C++ does? |
| java-core-java-10 | Core Java | How is Java different from C and C++? |
| java-core-java-11 | Core Java | What is the classpath, and why does Java need it? |
| java-core-java-12 | Core Java | Is Java a compiled language or an interpreted language? |
| java-encapsulation-02 | Encapsulation | Why use private fields with public getters and setters instead of public fields? |
| java-encapsulation-04 | Encapsulation | Can a class be fully encapsulated without any getters or setters at all? |
| java-encapsulation-05 | Encapsulation | What is a read-only property, and how is it implemented in Java? |
| java-encapsulation-06 | Encapsulation | What's the risk of returning a mutable field directly from a getter? |
| java-encapsulation-07 | Encapsulation | How does encapsulation help with maintaining and changing code later? |
| java-encapsulation-08 | Encapsulation | Is encapsulation the same thing as data hiding? |
| java-exception-handling-01 | Exception Handling | What is the difference between an Exception and an Error in Java? |
| java-exception-handling-05 | Exception Handling | How do you create and use a custom exception? |
| java-exception-handling-06 | Exception Handling | How does Java handle multiple catch blocks for the same try? |
| java-exception-handling-07 | Exception Handling | What is a nested try-catch, and when would you use one? |
| java-exception-handling-09 | Exception Handling | What is exception propagation, and how does an unhandled exception travel up the call stack? |
| java-exception-handling-10 | Exception Handling | What are some commonly encountered runtime exceptions in Java, and what typically causes them? |
| java-generics-02 | Generics | What is a generic class, and how do you define one? |
| java-generics-03 | Generics | What is a generic method, and how is it different from a generic class? |
| java-generics-04 | Generics | Can an interface be generic? |
| java-generics-05 | Generics | What are bounded type parameters, and what is an upper bound? |
| java-generics-08 | Generics | What is the unbounded wildcard ?, and when would you use it? |
| java-generics-10 | Generics | What is a raw type, and why should it generally be avoided? |
| java-generics-11 | Generics | What are the main limitations of generics in Java? |
| java-inheritance-04 | Inheritance | What's the difference between single, multilevel, and hierarchical inheritance? |
| java-inheritance-05 | Inheritance | What happens to a parent class's private members when a child class inherits from it? |
| java-inheritance-06 | Inheritance | What is method hiding, and how is it different from method overriding? |
| java-inheritance-07 | Inheritance | Can a subclass object be created without any parent constructor running? |
| java-inheritance-08 | Inheritance | What is the "diamond problem," and how does Java avoid it for classes? |
| java-inheritance-09 | Inheritance | What's the difference between inheriting from a class and implementing an interface? |
| java-inheritance-10 | Inheritance | Why is inheritance sometimes described as "breaking encapsulation" (the fragile base class problem)? |
| java-inheritance-11 | Inheritance | Can a final class be inherited, or a final method be overridden? |
| java-interfaces-02 | Interfaces | How is an interface different from a class? |
| java-interfaces-03 | Interfaces | Can a class implement multiple interfaces? Why is that generally safe, unlike multiple class inheritance? |
| java-interfaces-04 | Interfaces | Can one interface extend another interface, or even multiple interfaces? |
| java-interfaces-05 | Interfaces | What are private methods in an interface, and why were they added? |
| java-interfaces-07 | Interfaces | What is an interface reference, and how does it enable polymorphism? |
| java-interfaces-08 | Interfaces | What's the difference between a functional interface and a normal interface with multiple abstract methods? |
| java-jdbc-02 | JDBC | What is a JDBC driver, and what are the driver types at a high level? |
| java-jdbc-04 | JDBC | What is a ResultSet, and how do you read data from it? |
| java-jdbc-05 | JDBC | What is the difference between executeQuery(), executeUpdate(), and execute()? |
| java-jdbc-06 | JDBC | How do transactions work in JDBC, and what do commit() and rollback() do? |
| java-jdbc-07 | JDBC | What is JDBC batch processing, and why would you use it? |
| java-jdbc-08 | JDBC | How does PreparedStatement help prevent SQL injection? |
| java-jdbc-09 | JDBC | Why is try-with-resources especially important for JDBC objects? |
| java-jdbc-10 | JDBC | What is connection pooling, and why is it used instead of opening a new connection every time? |
| java-jdbc-11 | JDBC | How would you retrieve an auto-generated key, like an identity column, after an INSERT in JDBC? |
| java-jvm-01 | JVM | What are the main components of JVM architecture? |
| java-jvm-03 | JVM | What is the difference between the Bootstrap, Platform, and Application class loaders? |
| java-jvm-04 | JVM | What are the JVM's runtime data areas? |
| java-jvm-07 | JVM | What is the Method Area / Metaspace, and what does it store? |
| java-jvm-08 | JVM | What is the Program Counter (PC) register, and why does each thread need its own? |
| java-jvm-09 | JVM | What is the native method stack used for? |
| java-jvm-12 | JVM | What is a StackOverflowError, and what typically causes it? |
| java-jvm-13 | JVM | What is an OutOfMemoryError, and what typically causes it? |
| java-jvm-14 | JVM | What does "JVM tuning" mean at a basic level, and what are common JVM options you might adjust? |
| java-multithreading-02 | Multithreading | What are the two main ways to create a thread in Java? |
| java-multithreading-03 | Multithreading | What is the difference between start() and run()? |
| java-multithreading-04 | Multithreading | What are the states in a thread's lifecycle? |
| java-multithreading-06 | Multithreading | What does join() do, and when would you use it? |
| java-multithreading-07 | Multithreading | What is thread interruption, and how does interrupt() work? |
| java-multithreading-09 | Multithreading | What is a race condition, and how does synchronization prevent it? |
| java-multithreading-12 | Multithreading | What is an atomic operation, and how do classes like AtomicInteger help? |
| java-multithreading-13 | Multithreading | What is a Lock from java.util.concurrent.locks, and how is it different from synchronized? |
| java-multithreading-16 | Multithreading | What are concurrent collections, and when would you use one instead of manual synchronization? |
| java-oop-02 | OOP | What are the four main pillars of OOP in Java? |
| java-oop-03 | OOP | How is object-oriented programming different from procedural programming? |
| java-oop-04 | OOP | Is Java a fully or purely object-oriented language? |
| java-oop-06 | OOP | What is the difference between an "is-a" relationship and a "has-a" relationship? |
| java-oop-07 | OOP | What are coupling and cohesion, and why do they matter in OOP design? |
| java-oop-08 | OOP | Why is "favor composition over inheritance" a common OOP design guideline? |
| java-oop-09 | OOP | What are the main advantages OOP gives over plain procedural code? |
| java-oop-10 | OOP | How would you model a real-world entity like a "Car" using OOP? |
| java-polymorphism-02 | Polymorphism | What is the difference between compile-time (static) and runtime (dynamic) polymorphism? |
| java-polymorphism-05 | Polymorphism | What is dynamic method dispatch? |
| java-polymorphism-09 | Polymorphism | Why is polymorphism useful in real code? |
| java-sql-and-java-01 | SQL + Java | What's the typical flow for executing a SELECT query from a Java application? |
| java-sql-and-java-02 | SQL + Java | How do you perform INSERT, UPDATE, and DELETE operations from a Java application? |
| java-sql-and-java-03 | SQL + Java | How would you map the results of a join query into Java objects? |
| java-sql-and-java-04 | SQL + Java | How do you handle a SQL transaction spanning multiple related updates from Java? |
| java-sql-and-java-05 | SQL + Java | How would you implement pagination for a large query result from Java? |
| java-sql-and-java-06 | SQL + Java | How do you handle NULL values when reading a ResultSet in Java? |
| java-sql-and-java-07 | SQL + Java | How would you call a stored procedure from Java, including one with an output parameter? |
| java-sql-and-java-08 | SQL + Java | What is a common way to prevent SQL injection when building dynamic queries with optional filters? |
| java-sql-and-java-09 | SQL + Java | What are typical database-related exceptions you'll encounter from Java, and how should they generally be handled? |
| java-sql-and-java-10 | SQL + Java | Why is connection pooling especially important for a Java web backend talking to a database? |
| java-sql-and-java-11 | SQL + Java | What's a practical example of combining PreparedStatement, transactions, and exception handling in one backend operation? |
| java-strings-05 | Strings | Why does repeatedly concatenating Strings with + inside a loop hurt performance? |
| java-strings-06 | Strings | How do you compare two Strings for equality while ignoring case? |
| java-strings-07 | Strings | What are some commonly used String methods, and what do they do? |
| java-strings-08 | Strings | How would you check if a String is a palindrome? |
| java-strings-09 | Strings | What happens when you use a String as a key in a HashMap? |

### 4b. 2 retired duplicate/derivative uses of source Q84

| DB Question ID | Topic | Question |
|---|---|---|
| java-interfaces-09 | Interfaces | At a high level, when would you choose an interface over an abstract class? |
| java-abstract-classes-09 | Abstract Classes | When would you choose an abstract class over an interface in a real design? |

### 4c. 1 topic archived (would otherwise have 0 published questions)

| Topic ID | Name | Reason |
|---|---|---|
| java-sql-and-java | SQL + Java | All 11 questions in this topic were non-source content; the source guide has no SQL+Java scenario section. Archived (not deleted) so it drops out of the topic grid and prev/next nav instead of showing an empty page. |

## Reversal

Every change in this migration is a `status` flip except the 4 rewritten "first half" rows and
44 inserted rows. To restore any archived row to public view: `update ... set status = 'published' where id = '<id>'`.
No row was permanently deleted.