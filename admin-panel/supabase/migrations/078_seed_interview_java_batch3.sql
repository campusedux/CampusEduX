-- admin-panel/supabase/migrations/078_seed_interview_java_batch3.sql
-- CANONICAL PAIR — the body below this line is byte-identical to its twin
-- twin: mobile-app/supabase/migrations/0106_seed_interview_java_batch3.sql ; apply either, the other is a guarded no-op.
--
-- ============================================================================
-- BODY — Java Interview Questions content, batch 3 of 6
-- (mobile 0106_seed_interview_java_batch3.sql  ==  admin 078_seed_interview_java_batch3.sql
--  below this header — byte-identical, guarded, idempotent, additive.)
-- ============================================================================
-- WHAT / WHY
--   Seeds the next 5 of 26 Java Interview Questions topics (Collections,
--   Exception Handling, Multithreading, Java 8+, Interfaces), each with an
--   original, technically accurate set of Question/Answer/Example/Important
--   Point rows for /practice/interview-questions/java/<topic>. Follows batch 1
--   (0104/076) and batch 2 (0105/077) exactly: same idempotency technique
--   (deterministic `id`, `on conflict (id) do update`), same sort_order gap
--   convention (this batch continues at 110, 120, 130, 140, 150), does not
--   touch any batch-1 or batch-2 row. 3 more batches follow, covering the
--   remaining 11 topics.
-- ----------------------------------------------------------------------------

-- ---- ordering guard -------------------------------------------------------
do $$
begin
  if to_regclass('public.interview_categories') is null
     or to_regclass('public.interview_topics') is null
     or to_regclass('public.interview_questions') is null then
    raise exception '0106/078: interview_categories/topics/questions not found — apply 0103_interview_questions.sql (admin 075) first.';
  end if;
  if not exists (select 1 from public.interview_topics where id = 'java-arrays') then
    raise exception '0106/078: batch-2 topics not found — apply 0105_seed_interview_java_batch2.sql (admin 077) first.';
  end if;
end $$;

-- ===========================================================================
-- 1. TOPICS (batch 3 of 6)
-- ===========================================================================
insert into public.interview_topics (id, category_id, name, slug, description, sort_order)
values
  ('java-collections', 'java', 'Collections', 'collections',
   'List/Set/Queue/Map implementations, Comparable vs Comparator, HashMap internals, and fail-fast iteration.', 110),
  ('java-exception-handling', 'java', 'Exception Handling', 'exception-handling',
   'Checked vs unchecked exceptions, try-with-resources, custom exceptions, and exception propagation.', 120),
  ('java-multithreading', 'java', 'Multithreading', 'multithreading',
   'Thread creation, synchronization, deadlock, volatile, locks, and the Executor framework.', 130),
  ('java-8-plus', 'java', 'Java 8+', 'java-8-plus',
   'Lambdas, functional interfaces, the Stream API, Optional, and default/static interface methods.', 140),
  ('java-interfaces', 'java', 'Interfaces', 'interfaces',
   'Interface contracts, multiple implementation, interface inheritance, and functional/marker interfaces.', 150)
on conflict (id) do update set
  category_id = excluded.category_id, name = excluded.name, slug = excluded.slug,
  description = excluded.description, sort_order = excluded.sort_order, updated_at = now();

-- ===========================================================================
-- 2. QUESTIONS
-- ===========================================================================

-- ---- Collections (15) -------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-collections-01','java-collections',
 $q$What is the Java Collection Framework?$q$,
 $a$The Collection Framework is a unified set of interfaces and classes in java.util for storing, organizing, and manipulating groups of objects, such as List, Set, Queue, and Map along with their common implementations. It replaces older, inconsistent structures with a common architecture, so algorithms and utility methods work across different collection types.$a$,
 $ex$```java
List<String> names = new ArrayList<>();
names.add("Amit");
names.add("Neha");
```$ex$,
 $ip$Map is part of the Collections Framework conceptually but does not extend the Collection interface, since it stores key-value pairs rather than single elements.$ip$,
 'Easy', 1),

('java-collections-02','java-collections',
 $q$What is the difference between Collection and Collections?$q$,
 $a$Collection (singular) is the root interface of the framework, representing a group of objects such as a List or Set. Collections (plural) is a utility class full of static helper methods that operate on collections, such as sorting, searching, reversing, or creating unmodifiable or synchronized wrappers.$a$,
 $ex$```java
List<Integer> nums = new ArrayList<>(List.of(3, 1, 2));
Collections.sort(nums); // Collections utility method
```$ex$,
 $ip$The capitalization matters a lot in interviews — Collection is an interface, Collections is a class of static utilities.$ip$,
 'Easy', 2),

('java-collections-03','java-collections',
 $q$When would you use a List, a Set, a Queue, or a Map?$q$,
 $a$Use a List when order matters and duplicates are allowed; use a Set when you need uniqueness and don't care about, or want a specific, ordering; use a Queue when you need FIFO or priority-based processing order, such as task scheduling; use a Map when you need to look up values by a unique key rather than by position.$a$,
 $ex$```java
List<Integer> list = new ArrayList<>();
Set<Integer> set = new HashSet<>();
Queue<Integer> queue = new LinkedList<>();
Map<Integer,String> map = new HashMap<>();
```$ex$,
 $ip$Picking the right collection up front avoids awkward workarounds later — e.g., using a List and manually checking for duplicates is a sign a Set was the better choice.$ip$,
 'Easy', 3),

('java-collections-04','java-collections',
 $q$What is the internal difference between ArrayList and LinkedList, and how does it affect performance?$q$,
 $a$ArrayList is backed by a resizable array, so indexed access with get(i) is O(1), but inserting or removing in the middle requires shifting subsequent elements, which is O(n). LinkedList is backed by a doubly linked list, so inserting or removing at a known node is O(1), but indexed access has to walk the list from one end, making it O(n).$a$,
 $ex$```java
List<Integer> arr = new ArrayList<>();     // fast random access
List<Integer> linked = new LinkedList<>(); // fast insert/remove at head/tail via Deque methods
```$ex$,
 $ip$For most everyday use, ArrayList is the better default; LinkedList mainly wins when you specifically need frequent insertions or removals at the ends, via its Deque interface.$ip$,
 'Medium', 4),

('java-collections-05','java-collections',
 $q$What is Vector, and why is it rarely used in new code?$q$,
 $a$Vector is a legacy List implementation very similar to ArrayList, but every method is synchronized, which adds locking overhead even in single-threaded code where that safety is unnecessary. Modern code generally prefers ArrayList for single-threaded use and CopyOnWriteArrayList or explicit synchronization for concurrent use.$a$,
 $ex$```java
List<Integer> v = new Vector<>(); // legacy, synchronized on every call
```$ex$,
 $ip$Being synchronized doesn't make compound operations on a Vector thread-safe on their own — checking then updating still needs external synchronization.$ip$,
 'Medium', 5),

('java-collections-06','java-collections',
 $q$What is Stack in Java, and what's a better modern alternative?$q$,
 $a$Stack is a legacy class that extends Vector and provides classic LIFO operations like push(), pop(), and peek(), but it inherits Vector's unnecessary synchronization overhead and some inconsistent design, since it's still technically a List. The Deque interface, implemented by ArrayDeque, is now the recommended way to get stack behavior without those legacy costs.$a$,
 $ex$```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(10);
stack.push(20);
System.out.println(stack.pop()); // 20
```$ex$,
 $ip$java.util.Stack still works correctly — it's just considered legacy; ArrayDeque is generally faster and cleaner for new code.$ip$,
 'Medium', 6),

('java-collections-07','java-collections',
 $q$What is the difference between HashSet, LinkedHashSet, and TreeSet?$q$,
 $a$HashSet stores unique elements with no guaranteed order and offers the fastest average-case operations. LinkedHashSet keeps elements in the order they were inserted, at a small extra memory and performance cost. TreeSet keeps elements sorted according to their natural ordering or a supplied Comparator, with O(log n) operations instead of HashSet's average O(1).$a$,
 $ex$```java
Set<Integer> hs = new HashSet<>(List.of(3, 1, 2));       // order not guaranteed
Set<Integer> lhs = new LinkedHashSet<>(List.of(3, 1, 2)); // 3, 1, 2 — insertion order
Set<Integer> ts = new TreeSet<>(List.of(3, 1, 2));        // 1, 2, 3 — sorted
```$ex$,
 $ip$TreeSet requires elements to be Comparable, or a Comparator must be supplied, otherwise it throws a ClassCastException when elements are added.$ip$,
 'Medium', 7),

('java-collections-08','java-collections',
 $q$What is the difference between HashMap, LinkedHashMap, and TreeMap?$q$,
 $a$HashMap stores key-value pairs with no guaranteed iteration order and the fastest average-case performance. LinkedHashMap preserves insertion order, or optionally access order, which is useful for building an LRU cache. TreeMap keeps entries sorted by key, using natural ordering or a Comparator, with O(log n) operations.$a$,
 $ex$```java
Map<String,Integer> lru = new LinkedHashMap<>(16, 0.75f, true); // access-order mode
```$ex$,
 $ip$Choose TreeMap only when you actually need sorted iteration — its O(log n) operations are slower than HashMap's average O(1) for plain lookups.$ip$,
 'Medium', 8),

('java-collections-09','java-collections',
 $q$What is the difference between HashMap and Hashtable?$q$,
 $a$HashMap allows one null key and multiple null values and is not synchronized, making it faster for single-threaded or externally-synchronized use. Hashtable is a legacy class that is fully synchronized and does not permit null keys or null values at all.$a$,
 $ex$```java
Map<String,Integer> map = new HashMap<>();
map.put(null, 1); // allowed in HashMap, throws NullPointerException in Hashtable
```$ex$,
 $ip$For thread-safe maps in modern code, prefer ConcurrentHashMap over Hashtable — it offers better concurrency without a single global lock.$ip$,
 'Medium', 9),

('java-collections-10','java-collections',
 $q$What is a PriorityQueue, and how does it decide ordering?$q$,
 $a$A PriorityQueue is a queue where elements are ordered by priority rather than insertion order, by default using their natural ordering via Comparable, or a custom order if a Comparator is supplied, and its head is always the smallest, or highest-priority, element according to that ordering.$a$,
 $ex$```java
PriorityQueue<Integer> pq = new PriorityQueue<>();
pq.add(30); pq.add(10); pq.add(20);
System.out.println(pq.poll()); // 10
```$ex$,
 $ip$Iterating directly over a PriorityQueue does not produce sorted order — only repeatedly calling poll() retrieves elements in priority order.$ip$,
 'Medium', 10),

('java-collections-11','java-collections',
 $q$What is the difference between Iterator and ListIterator?$q$,
 $a$Iterator can traverse any Collection, such as a List, Set, or a Map's key/value views, only in the forward direction, and supports removing the current element. ListIterator works only on Lists but can move both forward and backward, and additionally supports adding a new element or replacing the current one during iteration.$a$,
 $ex$```java
ListIterator<Integer> it = list.listIterator();
while (it.hasNext()) {
    int v = it.next();
    if (v < 0) it.set(0); // ListIterator can modify during traversal
}
```$ex$,
 $ip$Both are fail-fast on most standard collections — structurally modifying the underlying collection any other way during iteration throws ConcurrentModificationException.$ip$,
 'Medium', 11),

('java-collections-12','java-collections',
 $q$What is the difference between Comparable and Comparator?$q$,
 $a$Comparable defines a class's single natural ordering through its own compareTo() method, so the class decides how its instances compare to each other. Comparator defines an external, alternative ordering through compare(), letting different callers sort the same objects in different ways without changing the class itself.$a$,
 $ex$```java
class Student implements Comparable<Student> {
    int marks;
    public int compareTo(Student o) { return Integer.compare(marks, o.marks); }
}
students.sort(Comparator.comparing(Student::getName)); // an alternative ordering
```$ex$,
 $ip$A class can implement Comparable only once, but you can write as many different Comparators for it as you need.$ip$,
 'Medium', 12),

('java-collections-13','java-collections',
 $q$Why must hashCode() be overridden whenever equals() is overridden, and how does this affect HashMap?$q$,
 $a$The hashCode contract requires that two objects considered equal by equals() must return the same hash code. HashMap and HashSet rely on hashCode() to decide which bucket an object belongs to, then use equals() to confirm a match within that bucket — if hashCode() isn't consistent with equals(), two "equal" objects could land in different buckets and the map would fail to recognize them as duplicates or fail to find them again.$a$,
 $ex$```java
class Point {
    int x, y;
    public boolean equals(Object o) { /* compares x and y */ return true; }
    public int hashCode() { return Objects.hash(x, y); } // must be consistent with equals
}
```$ex$,
 $ip$Unequal objects are allowed to share the same hash code, called a collision, but equal objects must never have different hash codes.$ip$,
 'Hard', 13),

('java-collections-14','java-collections',
 $q$What is fail-fast vs fail-safe iteration, and what causes ConcurrentModificationException?$q$,
 $a$Fail-fast iterators, used by most standard collections like ArrayList and HashMap, detect structural changes made to the collection outside the iterator itself during iteration and immediately throw ConcurrentModificationException rather than risk undefined behavior. Fail-safe iterators, used by concurrent collections like CopyOnWriteArrayList or ConcurrentHashMap, iterate over a snapshot or otherwise tolerate concurrent modification without throwing, though they may not reflect the very latest changes.$a$,
 $ex$```java
List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
for (Integer x : list) {
    if (x == 2) list.remove(x); // throws ConcurrentModificationException
}
```$ex$,
 $ip$Use Iterator.remove() (or a concurrent collection) instead of modifying a collection directly while iterating over it with a for-each loop.$ip$,
 'Hard', 14),

('java-collections-15','java-collections',
 $q$How would you choose the right collection type for a given requirement?$q$,
 $a$Start from the requirement, not the collection: need order and duplicates, use a List (ArrayList unless frequent middle insertions favor LinkedList); need uniqueness, use a Set (HashSet by default, LinkedHashSet for insertion order, TreeSet for sorted order); need key-based lookup, use a Map (HashMap by default, TreeMap for sorted keys, LinkedHashMap for predictable iteration); need FIFO or priority processing, use a Queue or PriorityQueue; need thread safety, use a concurrent collection like ConcurrentHashMap rather than a manually synchronized wrapper.$a$,
 $ex$$ex$,
 $ip$In interviews, always justify the choice by the actual access pattern, such as lookup by index vs by key or need for ordering, rather than naming a collection first and reasoning backward.$ip$,
 'Medium', 15)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Exception Handling (10) -------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-exception-handling-01','java-exception-handling',
 $q$What is the difference between an Exception and an Error in Java?$q$,
 $a$Exception represents a condition that a well-written application might reasonably want to catch and recover from, such as invalid input or a missing file. Error represents a serious problem that applications generally aren't expected to catch or recover from, such as OutOfMemoryError or StackOverflowError, since it usually indicates the JVM itself is in trouble.$a$,
 $ex$```java
try {
    riskyOperation();
} catch (Exception e) {
    // reasonable to catch and recover
}
```$ex$,
 $ip$Both Exception and Error extend Throwable — catching Throwable directly is almost always a design smell.$ip$,
 'Easy', 1),

('java-exception-handling-02','java-exception-handling',
 $q$What is the difference between checked and unchecked exceptions?$q$,
 $a$Checked exceptions are subclasses of Exception, excluding RuntimeException, that the compiler forces you to either catch or declare with throws, typically representing recoverable external conditions like IOException. Unchecked exceptions extend RuntimeException and are not checked by the compiler at all, typically representing programming errors like NullPointerException or IllegalArgumentException.$a$,
 $ex$```java
void read() throws IOException { }           // checked — must declare or catch
void divide(int a, int b) { int r = a / b; }  // unchecked — ArithmeticException possible, no declaration needed
```$ex$,
 $ip$Whether an exception is checked is determined purely by its position in the class hierarchy, not by how serious it feels.$ip$,
 'Easy', 2),

('java-exception-handling-03','java-exception-handling',
 $q$What is the try-catch-finally flow, and when does finally not run?$q$,
 $a$Java runs the try block until it completes normally or an exception occurs; if an exception occurs, a matching catch block handles it; the finally block then runs afterward regardless of whether an exception was thrown or caught, making it the standard place for cleanup code. The main case where finally does NOT run is if the JVM terminates abruptly, such as a call to System.exit() inside the try or catch block, or if the JVM crashes.$a$,
 $ex$```java
try { work(); }
catch (IOException e) { recover(); }
finally { close(); } // runs whether or not an exception occurred
```$ex$,
 $ip$Try-with-resources is generally preferred over manual resource cleanup in finally, since it handles exceptions during close() more predictably.$ip$,
 'Medium', 3),

('java-exception-handling-04','java-exception-handling',
 $q$What is the difference between throw and throws?$q$,
 $a$throw is a statement that actually raises a specific exception instance at the point it's used. throws appears in a method's signature to declare which checked exceptions that method might propagate to its caller, without itself raising anything.$a$,
 $ex$```java
void validate(int age) {
    if (age < 0) throw new IllegalArgumentException("Invalid age"); // throw
}
void read() throws IOException { } // throws — declaration only
```$ex$,
 $ip$A method can throw unchecked exceptions freely without listing them in throws — the declaration is only mandatory for checked exceptions.$ip$,
 'Easy', 4),

('java-exception-handling-05','java-exception-handling',
 $q$How do you create and use a custom exception?$q$,
 $a$Create a custom exception by extending Exception for a checked exception, or RuntimeException for an unchecked one, typically adding a constructor that passes a message to the superclass, so it can carry meaning specific to your application that Java's built-in exceptions don't express well.$a$,
 $ex$```java
class InsufficientBalanceException extends RuntimeException {
    InsufficientBalanceException(String msg) { super(msg); }
}
void withdraw(double amount, double balance) {
    if (amount > balance) throw new InsufficientBalanceException("Not enough funds");
}
```$ex$,
 $ip$Extending RuntimeException is usually preferred for business-logic exceptions in modern code, avoiding forcing every caller up the chain to declare or catch them.$ip$,
 'Medium', 5),

('java-exception-handling-06','java-exception-handling',
 $q$How does Java handle multiple catch blocks for the same try?$q$,
 $a$Java checks catch blocks in the order they're written and runs the first one whose exception type matches, including subclasses, the thrown exception, then skips the rest, so more specific exception types must be listed before more general ones, or the compiler will flag unreachable code.$a$,
 $ex$```java
try {
    doWork();
} catch (FileNotFoundException e) {   // more specific, must come first
    // handle missing file
} catch (IOException e) {             // more general
    // handle other I/O problems
}
```$ex$,
 $ip$You can also catch multiple unrelated exception types in one block using catch (IOException | SQLException e), since Java 7, when they need identical handling.$ip$,
 'Medium', 6),

('java-exception-handling-07','java-exception-handling',
 $q$What is a nested try-catch, and when would you use one?$q$,
 $a$A nested try-catch is a try-catch block placed inside another try or catch block, used when an inner operation needs its own specific error handling separate from the outer operation's handling, for example, cleaning up a resource inside a catch block, where that cleanup step might itself throw.$a$,
 $ex$```java
try {
    connect();
    try {
        query();
    } catch (SQLException e) {
        rollback(); // inner, query-specific handling
    }
} catch (ConnectException e) {
    // outer, connection-specific handling
}
```$ex$,
 $ip$Overusing nested try-catch can make code hard to read — often a cleaner alternative is to extract the inner logic into its own method with its own try-catch.$ip$,
 'Medium', 7),

('java-exception-handling-08','java-exception-handling',
 $q$What is try-with-resources, and why is it preferred over manual finally cleanup?$q$,
 $a$Try-with-resources automatically closes any resource that implements AutoCloseable when the try block finishes, whether normally or via an exception, without needing an explicit finally block to call close(). It's preferred because it's harder to forget, handles multiple resources in the correct reverse closing order automatically, and correctly manages exceptions that occur during closing by suppressing them rather than hiding the original exception.$a$,
 $ex$```java
try (BufferedReader br = new BufferedReader(new FileReader("a.txt"))) {
    System.out.println(br.readLine());
} // br.close() is called automatically here
```$ex$,
 $ip$A resource used in try-with-resources must implement AutoCloseable, or its subtype Closeable — you can't use it with an arbitrary object.$ip$,
 'Medium', 8),

('java-exception-handling-09','java-exception-handling',
 $q$What is exception propagation, and how does an unhandled exception travel up the call stack?$q$,
 $a$When a method throws an exception it doesn't catch itself, Java stops executing that method immediately and passes the exception up to its caller; if the caller also doesn't catch it, it keeps propagating up the call stack, method by method, until some method catches it or it reaches the top of the stack at main, which then terminates the thread and prints a stack trace.$a$,
 $ex$```java
void a() { b(); }
void b() { c(); }
void c() { throw new RuntimeException("failure in c"); }
// if a() and b() don't catch it, it propagates all the way up
```$ex$,
 $ip$The stack trace printed when an exception is uncaught shows exactly this propagation path, which is why reading a stack trace from top to bottom tells you where the exception actually originated.$ip$,
 'Medium', 9),

('java-exception-handling-10','java-exception-handling',
 $q$What are some commonly encountered runtime exceptions in Java, and what typically causes them?$q$,
 $a$NullPointerException happens when you call a method or access a field on a null reference. ArrayIndexOutOfBoundsException happens when you access an array index outside its valid range. ClassCastException happens when an invalid downcast is attempted. NumberFormatException happens when parsing text that isn't a valid number, such as Integer.parseInt("abc"). ArithmeticException happens on operations like integer division by zero.$a$,
 $ex$```java
String s = null;
s.length(); // NullPointerException
int[] a = new int[3];
a[5] = 1;   // ArrayIndexOutOfBoundsException
```$ex$,
 $ip$Most of these are unchecked exceptions representing programming bugs — the fix is almost always to validate inputs or state before the risky operation, not just to catch the exception after the fact.$ip$,
 'Easy', 10)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Multithreading (16) ----------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-multithreading-01','java-multithreading',
 $q$What is the difference between a process and a thread?$q$,
 $a$A process is an independent, isolated unit of execution with its own memory space managed by the operating system. A thread is a lighter-weight unit of execution that exists inside a process, and multiple threads within the same process share that process's memory, which makes communication between them easy but also introduces the need for careful synchronization.$a$,
 $ex$```text
Process -> Thread 1, Thread 2, Thread 3 (share the same heap memory)
```$ex$,
 $ip$Because threads share memory, a bug in one thread, like corrupting shared data, can affect the whole process, unlike a crash in a separate process.$ip$,
 'Easy', 1),

('java-multithreading-02','java-multithreading',
 $q$What are the two main ways to create a thread in Java?$q$,
 $a$You can extend the Thread class and override its run() method, or you can implement the Runnable interface and pass an instance to a Thread's constructor. Implementing Runnable is usually preferred, since Java doesn't support multiple class inheritance, so extending Thread uses up your only superclass slot.$a$,
 $ex$```java
class MyTask implements Runnable {
    public void run() { System.out.println("Running"); }
}
new Thread(new MyTask()).start();
```$ex$,
 $ip$Since Runnable is a functional interface, you can also create a thread with a lambda: new Thread(() -> System.out.println("Running")).start().$ip$,
 'Easy', 2),

('java-multithreading-03','java-multithreading',
 $q$What is the difference between start() and run()?$q$,
 $a$Calling start() asks the JVM to create a new operating-system thread and, on that new thread, invoke run() — this is the only way to achieve real concurrent execution. Calling run() directly is just an ordinary method call on the current thread, with no new thread created and no concurrency at all.$a$,
 $ex$```java
Thread t = new Thread(() -> System.out.println("Running"));
t.start(); // runs on a new thread
t.run();   // just a normal method call on the current thread
```$ex$,
 $ip$Calling start() twice on the same Thread object throws IllegalThreadStateException — a Thread object can only be started once.$ip$,
 'Easy', 3),

('java-multithreading-04','java-multithreading',
 $q$What are the states in a thread's lifecycle?$q$,
 $a$A thread moves through NEW, created but not started, RUNNABLE, eligible to run whether actually running or waiting for CPU time, BLOCKED, waiting to acquire a lock, WAITING or TIMED_WAITING, waiting indefinitely or for a specified time for another thread's action, and TERMINATED, finished execution.$a$,
 $ex$```java
Thread t = new Thread(() -> {});
System.out.println(t.getState()); // NEW, before start()
```$ex$,
 $ip$Java's RUNNABLE state doesn't distinguish "actually running on a CPU core" from "ready and waiting for the scheduler" — the OS scheduler handles that distinction internally.$ip$,
 'Medium', 4),

('java-multithreading-05','java-multithreading',
 $q$What is the difference between Thread.sleep() and Object.wait()?$q$,
 $a$Thread.sleep() pauses the current thread for a fixed amount of time without releasing any locks it holds, and doesn't require any special context to call. wait() is called on an object's monitor from within synchronized code, releases that monitor's lock while waiting, and stays paused until another thread calls notify() or notifyAll() on the same object, or a timeout elapses.$a$,
 $ex$```java
Thread.sleep(1000); // pauses this thread, keeps any locks held

synchronized (lockObj) {
    lockObj.wait(); // releases lockObj's monitor while waiting
}
```$ex$,
 $ip$wait() must be called while holding the object's monitor, inside a synchronized block on that object, or it throws IllegalMonitorStateException.$ip$,
 'Medium', 5),

('java-multithreading-06','java-multithreading',
 $q$What does join() do, and when would you use it?$q$,
 $a$Calling t.join() makes the current thread pause and wait until thread t finishes executing, which is useful when your code needs a result or side effect from another thread to be complete before continuing.$a$,
 $ex$```java
Thread worker = new Thread(() -> doWork());
worker.start();
worker.join(); // main thread waits here until worker finishes
System.out.println("Worker is done");
```$ex$,
 $ip$join() can also take a timeout argument, so the caller doesn't wait forever if the other thread hangs.$ip$,
 'Medium', 6),

('java-multithreading-07','java-multithreading',
 $q$What is thread interruption, and how does interrupt() work?$q$,
 $a$Calling t.interrupt() sets an internal "interrupted" flag on thread t and, if that thread is currently blocked in a method like sleep() or wait(), causes it to wake up immediately with an InterruptedException. It's a cooperative mechanism — interrupt() doesn't forcibly stop a thread; the target thread's own code must check the flag or handle the exception and decide to stop.$a$,
 $ex$```java
Thread t = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) { /* work */ }
});
t.start();
t.interrupt(); // asks the thread to stop; the thread must check for this
```$ex$,
 $ip$Swallowing InterruptedException with an empty catch block is a common bug — it silently discards the interruption signal that other code may depend on.$ip$,
 'Hard', 7),

('java-multithreading-08','java-multithreading',
 $q$What is the difference between a synchronized method and a synchronized block?$q$,
 $a$A synchronized method locks the entire method body using the object's own monitor, or the class's monitor for a static method, for its whole duration. A synchronized block lets you lock only the specific section of code that actually touches shared state, and optionally lock on a different object than this, which can reduce contention by keeping the locked region as small as possible.$a$,
 $ex$```java
synchronized void increment() { count++; }             // whole method locked

void incrementBlock() {
    synchronized (lockObj) { count++; }                 // only this line locked
}
```$ex$,
 $ip$Smaller synchronized blocks generally improve concurrency, since they hold the lock for less time, but only if you're careful not to leave any shared-state access outside the block.$ip$,
 'Medium', 8),

('java-multithreading-09','java-multithreading',
 $q$What is a race condition, and how does synchronization prevent it?$q$,
 $a$A race condition happens when two or more threads access and modify shared data at the same time without coordination, and the final result depends on the unpredictable timing of their execution, often producing incorrect results. Synchronization prevents this by ensuring only one thread at a time can execute a critical section that reads and updates the shared data, so the operations happen safely, one after another.$a$,
 $ex$```java
// without synchronization, two threads calling increment() simultaneously
// can both read the same old value of count before either writes it back
synchronized void increment() { count++; }
```$ex$,
 $ip$count++ looks like one operation but is actually three steps: read, add, write — this is exactly why it isn't safe under concurrent access without synchronization.$ip$,
 'Medium', 9),

('java-multithreading-10','java-multithreading',
 $q$What is deadlock, and how can it be avoided?$q$,
 $a$Deadlock happens when two or more threads each hold a lock the other needs and wait for each other indefinitely, so none of them can ever proceed, for example, thread A holds lock 1 and waits for lock 2, while thread B holds lock 2 and waits for lock 1. It's commonly avoided by always acquiring multiple locks in the same, consistent order across all threads, or by using timed lock attempts that can back off instead of waiting forever.$a$,
 $ex$```text
Thread A: lock(1) -> waits for lock(2)
Thread B: lock(2) -> waits for lock(1)   // deadlock
```$ex$,
 $ip$A related but different problem is starvation, where a thread technically can eventually proceed but keeps getting repeatedly passed over, often because other threads keep getting priority or the lock.$ip$,
 'Hard', 10),

('java-multithreading-11','java-multithreading',
 $q$What does the volatile keyword do, and what does it NOT guarantee?$q$,
 $a$volatile tells the JVM that reads and writes of that variable must always go to and from main memory, so a value written by one thread becomes immediately visible to other threads reading it, avoiding stale cached copies. What it does NOT guarantee is atomicity for compound operations — a volatile int being incremented with count++ can still lose updates under concurrent access, since read-modify-write still isn't a single atomic step.$a$,
 $ex$```java
private volatile boolean running = true; // a simple flag one thread sets, another reads
```$ex$,
 $ip$volatile is good for simple flags or single-write/multi-read state, not for counters or anything requiring compound read-modify-write safety.$ip$,
 'Hard', 11),

('java-multithreading-12','java-multithreading',
 $q$What is an atomic operation, and how do classes like AtomicInteger help?$q$,
 $a$An atomic operation completes as a single, indivisible step from the perspective of other threads — it can never be observed half-done. Classes like AtomicInteger provide methods such as incrementAndGet() that perform a read-modify-write as one atomic step, usually using low-level CPU compare-and-swap instructions, giving thread-safe counters without needing explicit locks.$a$,
 $ex$```java
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet(); // thread-safe, no synchronized needed
```$ex$,
 $ip$Atomic classes are often faster than synchronized blocks for simple counters, since compare-and-swap avoids the overhead of acquiring and releasing a lock.$ip$,
 'Medium', 12),

('java-multithreading-13','java-multithreading',
 $q$What is a Lock from java.util.concurrent.locks, and how is it different from synchronized?$q$,
 $a$Lock, and its common implementation ReentrantLock, provides explicit lock() and unlock() calls, giving more flexibility than synchronized, such as trying to acquire a lock with a timeout, checking whether a lock is currently held, or supporting fair ordering between waiting threads. Unlike synchronized, a Lock must be released manually, so it's normally used with a try/finally to guarantee unlock() always runs.$a$,
 $ex$```java
Lock lock = new ReentrantLock();
lock.lock();
try {
    // critical section
} finally {
    lock.unlock(); // must always run
}
```$ex$,
 $ip$Forgetting the finally block with an explicit Lock can leave it permanently held if an exception occurs — synchronized doesn't have this risk, since the JVM releases the monitor automatically.$ip$,
 'Hard', 13),

('java-multithreading-14','java-multithreading',
 $q$What is ExecutorService, and why is it preferred over manually creating threads?$q$,
 $a$ExecutorService manages a pool of reusable worker threads and lets you submit tasks to run without creating and destroying a new Thread object for every single task, which reduces the overhead of thread creation and gives you control over how many threads run concurrently.$a$,
 $ex$```java
ExecutorService pool = Executors.newFixedThreadPool(4);
pool.submit(() -> System.out.println("Task"));
pool.shutdown(); // important — an un-shutdown pool can keep the JVM alive
```$ex$,
 $ip$Always plan for shutdown/lifecycle handling — a thread pool that's never shut down can prevent the application from exiting.$ip$,
 'Medium', 14),

('java-multithreading-15','java-multithreading',
 $q$What is the difference between Runnable and Callable, and what is a Future?$q$,
 $a$Runnable's run() method returns no result and can't throw a checked exception. Callable's call() method can return a value and can throw a checked exception, which is why it's used with ExecutorService.submit() when you need a result back. That submitted Callable immediately returns a Future, a placeholder for a result that may not be ready yet — calling future.get() blocks until the task completes and returns its value.$a$,
 $ex$```java
Callable<Integer> task = () -> 10 + 20;
Future<Integer> f = executor.submit(task);
int result = f.get(); // blocks until the task finishes
```$ex$,
 $ip$future.get() can throw ExecutionException if the task itself threw an exception — the original exception is wrapped as the cause.$ip$,
 'Medium', 15),

('java-multithreading-16','java-multithreading',
 $q$What are concurrent collections, and when would you use one instead of manual synchronization?$q$,
 $a$Concurrent collections, such as ConcurrentHashMap, CopyOnWriteArrayList, and BlockingQueue implementations, are specifically designed and internally optimized for safe access by multiple threads at once, typically offering much better throughput than wrapping a regular collection with Collections.synchronizedMap() or manually synchronizing every access. Use them whenever a collection genuinely needs to be shared and mutated across threads.$a$,
 $ex$```java
Map<String,Integer> counts = new ConcurrentHashMap<>();
counts.merge("Java", 1, Integer::sum); // thread-safe, no external lock needed
```$ex$,
 $ip$Thread-safe doesn't automatically mean every multi-step business operation on the collection is atomic — check the specific method's documentation, like merge() or putIfAbsent(), for what it actually guarantees as one atomic step.$ip$,
 'Hard', 16)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Java 8+ (14) -----------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-8-plus-01','java-8-plus',
 $q$What is a lambda expression, and what problem does it solve?$q$,
 $a$A lambda expression is a compact, inline way to write the implementation of a functional interface, letting you pass behavior as a value without writing a full named class. It solves the verbosity problem of anonymous inner classes, which needed several lines of boilerplate just to implement a single method.$a$,
 $ex$```java
List<String> names = List.of("Amit", "Neha");
names.forEach(name -> System.out.println(name));
```$ex$,
 $ip$A lambda's parameter types are usually inferred from the functional interface's abstract method, so you rarely need to write them explicitly.$ip$,
 'Easy', 1),

('java-8-plus-02','java-8-plus',
 $q$What is a functional interface, and how does it relate to lambda expressions?$q$,
 $a$A functional interface is an interface with exactly one abstract method, though it may still have default or static methods, and it's the type that a lambda expression or method reference actually implements. The compiler checks that your lambda's parameter list and return type match that single abstract method.$a$,
 $ex$```java
@FunctionalInterface
interface Calculator { int add(int a, int b); }
Calculator c = (a, b) -> a + b;
```$ex$,
 $ip$The @FunctionalInterface annotation is optional but recommended — it makes the compiler flag an error if a second abstract method is accidentally added later.$ip$,
 'Easy', 2),

('java-8-plus-03','java-8-plus',
 $q$What are Predicate, Consumer, Supplier, and Function, and how do they differ?$q$,
 $a$Predicate<T> takes a value and returns a boolean, used for conditions and filters. Consumer<T> takes a value and returns nothing, used for side effects like printing. Supplier<T> takes no arguments and returns a value, used for lazily producing or generating data. Function<T,R> takes a value of one type and returns a value of another type, used for transformations.$a$,
 $ex$```java
Predicate<Integer> isEven = n -> n % 2 == 0;
Consumer<String> printer = System.out::println;
Supplier<Double> random = Math::random;
Function<String,Integer> length = String::length;
```$ex$,
 $ip$These four are the most common of java.util.function's built-in functional interfaces — recognizing their shape (inputs and outputs) is often enough to answer method-reference and stream-related questions.$ip$,
 'Medium', 3),

('java-8-plus-04','java-8-plus',
 $q$What is a method reference, and what are its common forms?$q$,
 $a$A method reference is a shorthand for a lambda that would only call one existing method, referring to that method directly by name instead of writing out the lambda body. Common forms include a static method reference, an instance method reference on a particular object, an instance method reference on an arbitrary object of a type, and a constructor reference.$a$,
 $ex$```java
names.forEach(System.out::println);            // instance method on a particular object
list.stream().map(String::toUpperCase);         // instance method on an arbitrary object
Supplier<ArrayList<String>> factory = ArrayList::new; // constructor reference
```$ex$,
 $ip$A method reference must still be assignment-compatible with the target functional interface's parameter and return types, exactly like a lambda would need to be.$ip$,
 'Medium', 4),

('java-8-plus-05','java-8-plus',
 $q$What is the Stream API, and how is a Stream different from a Collection?$q$,
 $a$The Stream API provides a declarative way to process sequences of data through a pipeline of operations like filter, map, and collect, describing what should happen to the data rather than manually writing loops. A Stream isn't a data structure that stores elements the way a Collection does — it represents a computation over a source of data, is typically consumed once, and can be lazily evaluated, only doing work when a terminal operation is invoked.$a$,
 $ex$```java
List<Integer> result = numbers.stream()
    .filter(n -> n % 2 == 0)
    .map(n -> n * 2)
    .toList();
```$ex$,
 $ip$Trying to reuse a Stream after a terminal operation has already consumed it throws IllegalStateException.$ip$,
 'Medium', 5),

('java-8-plus-06','java-8-plus',
 $q$What is the difference between filter(), map(), and flatMap()?$q$,
 $a$filter() keeps only the elements that satisfy a condition, without changing their type. map() transforms each element into exactly one new value, which may be a different type. flatMap() is used when each element itself produces a stream of values, like a list of lists, mapping each element to a stream and then flattening all those streams into a single combined stream.$a$,
 $ex$```java
List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3, 4));
List<Integer> flat = nested.stream()
    .flatMap(List::stream) // flattens List<List<Integer>> into a single stream
    .toList(); // [1, 2, 3, 4]
```$ex$,
 $ip$If you use map() where you needed flatMap(), you end up with a stream of streams instead of a single flat stream of values.$ip$,
 'Medium', 6),

('java-8-plus-07','java-8-plus',
 $q$What does reduce() do, and how would you use it?$q$,
 $a$reduce() combines all the elements of a stream into a single result by repeatedly applying a combining function, such as summing all elements or finding the maximum, starting from an optional identity or initial value.$a$,
 $ex$```java
int sum = numbers.stream().reduce(0, Integer::sum);
Optional<Integer> max = numbers.stream().reduce(Integer::max);
```$ex$,
 $ip$Without an identity value, reduce() returns an Optional, since there's no defined result for an empty stream.$ip$,
 'Medium', 7),

('java-8-plus-08','java-8-plus',
 $q$What do sorted() and distinct() do in a stream pipeline?$q$,
 $a$sorted() returns a stream with elements arranged according to their natural ordering or a supplied Comparator, without modifying the original source. distinct() returns a stream with duplicate elements removed, based on equals().$a$,
 $ex$```java
List<Integer> result = List.of(3, 1, 2, 1).stream()
    .distinct()   // 3, 1, 2
    .sorted()     // 1, 2, 3
    .toList();
```$ex$,
 $ip$sorted() must buffer and sort all elements before it can pass any downstream, so it's not a fully lazy, element-by-element operation like filter() or map().$ip$,
 'Medium', 8),

('java-8-plus-09','java-8-plus',
 $q$What is collect(), and what is Collectors.groupingBy() used for?$q$,
 $a$collect() is a terminal stream operation that gathers the stream's elements into a resulting container, such as a List, Set, or Map, using a Collector. Collectors.groupingBy() is a collector that groups elements by a classifier function into a Map, where each key maps to a List, or another collection, of elements that share that key.$a$,
 $ex$```java
Map<String,List<Student>> byGrade = students.stream()
    .collect(Collectors.groupingBy(Student::getGrade));
```$ex$,
 $ip$groupingBy() can be combined with a downstream collector, such as Collectors.counting(), to get a count per group instead of the full list of elements.$ip$,
 'Medium', 9),

('java-8-plus-10','java-8-plus',
 $q$What is Collectors.partitioningBy(), and how does it differ from groupingBy()?$q$,
 $a$partitioningBy() splits a stream into exactly two groups based on a boolean predicate, always producing a Map<Boolean, List<T>> with a true key and a false key, even if one group ends up empty. groupingBy() instead produces a key for every distinct value the classifier function returns, so it can produce any number of groups.$a$,
 $ex$```java
Map<Boolean,List<Integer>> parts = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0));
// parts.get(true) = evens, parts.get(false) = odds
```$ex$,
 $ip$Use partitioningBy() specifically when the split is a yes/no condition; use groupingBy() for anything with more than two possible outcomes.$ip$,
 'Medium', 10),

('java-8-plus-11','java-8-plus',
 $q$What is Optional, and why was it introduced?$q$,
 $a$Optional<T> is a container that explicitly represents either a present value or an absent one, making the possibility of "no result" visible in a method's return type instead of silently returning null and risking a NullPointerException wherever the caller forgets to check.$a$,
 $ex$```java
Optional<String> name = Optional.ofNullable(getName());
name.ifPresent(System.out::println);
String value = name.orElse("Unknown");
```$ex$,
 $ip$Optional is intended mainly as a return type for methods where "no result" is a normal, expected outcome — it's generally discouraged as a field type or method parameter type.$ip$,
 'Easy', 11),

('java-8-plus-12','java-8-plus',
 $q$What are default and static methods in interfaces, and what problem did they solve in Java 8?$q$,
 $a$A default method provides a body directly inside an interface, letting existing interfaces gain new behavior without breaking every class that already implements them, since those classes automatically inherit the default implementation instead of being forced to implement the new method. Static methods on an interface belong to the interface itself, similar to utility methods, and are called through the interface name rather than through an implementing object.$a$,
 $ex$```java
interface Vehicle {
    default void start() { System.out.println("Starting"); }
    static Vehicle basic() { return new Car(); }
}
```$ex$,
 $ip$If a class implements two interfaces with conflicting default methods of the same signature, the compiler forces the class to override the method itself and resolve the conflict explicitly.$ip$,
 'Medium', 12),

('java-8-plus-13','java-8-plus',
 $q$What is the Date and Time API introduced in Java 8, and why did it replace java.util.Date?$q$,
 $a$The java.time package introduced immutable, thread-safe classes like LocalDate, LocalTime, LocalDateTime, and ZonedDateTime with a much clearer API, replacing the old java.util.Date and Calendar classes, which were mutable, not thread-safe, and had confusing, error-prone designs such as 0-based month indexing.$a$,
 $ex$```java
LocalDate today = LocalDate.now();
LocalDate nextWeek = today.plusDays(7);
```$ex$,
 $ip$Because java.time objects are immutable, every "modifying" method like plusDays() returns a new object rather than changing the original — forgetting to capture the return value is a common beginner mistake.$ip$,
 'Medium', 13),

('java-8-plus-14','java-8-plus',
 $q$What are some common Java 8 interview traps to watch out for?$q$,
 $a$A Stream can only be consumed once — reusing it after a terminal operation throws IllegalStateException. A lambda can only capture local variables that are final or "effectively final," meaning never reassigned after initialization, or it won't compile. sorted() and similar stateful intermediate operations must process the entire stream before producing any output, unlike filter() or map(), which can process elements one at a time.$a$,
 $ex$```java
Stream<Integer> s = list.stream();
s.forEach(System.out::println);
s.forEach(System.out::println); // IllegalStateException: stream has already been operated upon
```$ex$,
 $ip$When in doubt, create a fresh stream from the source collection each time you need to run a new pipeline over it.$ip$,
 'Hard', 14)
on conflict (id) do update set
  question = excluded.question, answer = excluded.answer, example = excluded.example,
  important_point = excluded.important_point, difficulty = excluded.difficulty,
  sort_order = excluded.sort_order, updated_at = now();

-- ---- Interfaces (9) ----------------------------------------------------------
insert into public.interview_questions
  (id, topic_id, question, answer, example, important_point, difficulty, sort_order)
values
('java-interfaces-01','java-interfaces',
 $q$What is an interface in Java?$q$,
 $a$An interface defines a contract of method signatures, and since Java 8, default and static methods too, that any implementing class agrees to fulfill, without necessarily providing the implementation itself. It describes what a class can do, not how it does it.$a$,
 $ex$```java
interface Payment { void pay(double amount); }
class CardPayment implements Payment {
    public void pay(double amount) { System.out.println("Paid " + amount + " by card"); }
}
```$ex$,
 $ip$All fields declared in an interface are implicitly public, static, and final, whether or not you write those keywords.$ip$,
 'Easy', 1),

('java-interfaces-02','java-interfaces',
 $q$How is an interface different from a class?$q$,
 $a$A class can hold instance state, constructors, and fully implemented methods, and a new object can be created directly from it unless it's abstract. An interface traditionally has no instance state, only constants, and mostly declares method signatures that implementing classes must provide, and you can never create an object of an interface directly with new.$a$,
 $ex$```java
interface Flyable { void fly(); }
Flyable f = new Bird();      // legal, references an implementing class's object
Flyable f2 = new Flyable();  // compile error — interfaces cannot be instantiated
```$ex$,
 $ip$A class can extend only one other class, but it can implement any number of interfaces at the same time.$ip$,
 'Easy', 2),

('java-interfaces-03','java-interfaces',
 $q$Can a class implement multiple interfaces? Why is that generally safe, unlike multiple class inheritance?$q$,
 $a$Yes — a class can implement as many interfaces as it needs, listed after implements and separated by commas. This is considered safe because, historically, interfaces carried no instance state or conflicting method implementations, so there was no ambiguity about which version of a field or method the class should inherit, unlike combining two classes that might both define the same field or method body.$a$,
 $ex$```java
interface Printable { void print(); }
interface Scannable { void scan(); }
class Machine implements Printable, Scannable {
    public void print() { }
    public void scan() { }
}
```$ex$,
 $ip$Since Java 8 introduced default methods, two interfaces CAN now conflict if they provide the same default method — Java then forces the implementing class to override that method itself rather than guessing.$ip$,
 'Medium', 3),

('java-interfaces-04','java-interfaces',
 $q$Can one interface extend another interface, or even multiple interfaces?$q$,
 $a$Yes — unlike classes, an interface can extend multiple other interfaces at once using extends, inheriting all of their abstract and default method declarations, and a class that eventually implements the combined interface must fulfill every method from the whole chain.$a$,
 $ex$```java
interface Readable { void read(); }
interface Writable { void write(); }
interface ReadWritable extends Readable, Writable { }
class MyFile implements ReadWritable {
    public void read() { }
    public void write() { }
}
```$ex$,
 $ip$This is one of the few places Java allows genuine "multiple inheritance" syntax, since interfaces, traditionally, can't conflict on state.$ip$,
 'Medium', 4),

('java-interfaces-05','java-interfaces',
 $q$What are private methods in an interface, and why were they added?$q$,
 $a$Private interface methods, added in Java 9, let an interface share helper logic between its own default or static methods without exposing that helper as part of the interface's public contract, avoiding duplicated code across multiple default methods.$a$,
 $ex$```java
interface Validator {
    default boolean isValidEmail(String s) { return checkPattern(s, "@"); }
    default boolean isValidPhone(String s) { return checkPattern(s, "^[0-9]+$"); }
    private boolean checkPattern(String s, String pattern) { return s.matches(pattern); } // shared, hidden helper
}
```$ex$,
 $ip$A private interface method can only be called from within the interface's own default or other private methods — implementing classes never see or inherit it directly.$ip$,
 'Medium', 5),

('java-interfaces-06','java-interfaces',
 $q$What is a marker interface, and how does it differ from a normal interface?$q$,
 $a$A marker interface has no methods at all — implementing it simply tags a class with a property or capability that other code or frameworks can check for using instanceof, rather than requiring the class to implement any specific behavior. Serializable and Cloneable are classic historical examples.$a$,
 $ex$```java
class Report implements Serializable { } // no methods to implement, just a tag
```$ex$,
 $ip$Modern Java code often prefers annotations over marker interfaces for tagging classes, but marker interfaces are still useful when the tag needs to participate in the type system, for example in method overloading or generic bounds.$ip$,
 'Medium', 6),

('java-interfaces-07','java-interfaces',
 $q$What is an interface reference, and how does it enable polymorphism?$q$,
 $a$An interface reference is a variable declared with an interface type, which can point to an object of any class that implements that interface — the actual method that runs is determined by the real object's class at runtime, giving the same polymorphic behavior as a parent-class reference.$a$,
 $ex$```java
Payment p = new UpiPayment(); // or new CardPayment(), interchangeably
p.pay(500); // runs whichever implementation p actually points to
```$ex$,
 $ip$Coding against an interface type rather than a concrete class lets you swap implementations later, for testing or adding new payment types, without changing the code that uses the reference.$ip$,
 'Medium', 7),

('java-interfaces-08','java-interfaces',
 $q$What's the difference between a functional interface and a normal interface with multiple abstract methods?$q$,
 $a$A functional interface has exactly one abstract method, which is what allows it to be implemented with a lambda expression or method reference. A normal interface with two or more abstract methods can't be implemented with a lambda at all — it needs a full class, or anonymous class, that provides every one of those methods.$a$,
 $ex$```java
interface Calculator { int add(int a, int b); }  // functional — one abstract method
interface Vehicle { void start(); void stop(); } // not functional — two abstract methods
Calculator c = (a, b) -> a + b; // valid
```$ex$,
 $ip$Default and static methods don't count toward the "one abstract method" rule — an interface with ten default methods and exactly one abstract method is still a valid functional interface.$ip$,
 'Medium', 8),

('java-interfaces-09','java-interfaces',
 $q$At a high level, when would you choose an interface over an abstract class?$q$,
 $a$Choose an interface when you're defining a capability that unrelated classes might share, like Comparable or Runnable, and you don't need to provide common state or implementation, especially if a class might already need to extend some other class. Choose an abstract class when there's a genuine "is-a" family of related classes that should share actual implementation and possibly instance state, not just a method signature.$a$,
 $ex$$ex$,
 $ip$This is a conceptual starting point only — the deeper mechanics of abstract classes, such as constructors, mixing abstract and concrete methods, and instantiation rules, are covered in their own dedicated topic.$ip$,
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
  v_batch12_topics int;
  v_batch12_questions int;
  v_dupe_count int;
begin
  select count(*) into v_topics from public.interview_topics where category_id = 'java'
    and id in ('java-collections','java-exception-handling','java-multithreading','java-8-plus','java-interfaces');
  if v_topics <> 5 then
    raise exception 'validation: expected 5 batch-3 interview_topics, found %', v_topics;
  end if;

  select count(*) into v_questions from public.interview_questions
    where topic_id in ('java-collections','java-exception-handling','java-multithreading','java-8-plus','java-interfaces');
  if v_questions <> 64 then
    raise exception 'validation: expected 64 batch-3 interview_questions, found %', v_questions;
  end if;

  -- Batches 1 and 2 must be untouched by this migration.
  select count(*) into v_batch12_topics from public.interview_topics where category_id = 'java'
    and id in ('java-core-java','java-oop','java-classes-objects','java-constructors','java-inheritance',
               'java-polymorphism','java-encapsulation','java-abstraction','java-strings','java-arrays');
  if v_batch12_topics <> 10 then
    raise exception 'validation: batch-1/2 interview_topics missing or damaged, found %', v_batch12_topics;
  end if;
  select count(*) into v_batch12_questions from public.interview_questions
    where topic_id in ('java-core-java','java-oop','java-classes-objects','java-constructors','java-inheritance',
                        'java-polymorphism','java-encapsulation','java-abstraction','java-strings','java-arrays');
  if v_batch12_questions <> 96 then
    raise exception 'validation: batch-1/2 interview_questions missing or damaged, found %', v_batch12_questions;
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

  raise notice '0106 OK: 5 batch-3 topics (Collections, Exception Handling, Multithreading, Java 8+, Interfaces), % questions. Batches 1-2 intact (% topics, % questions). No duplicate question text.', v_questions, v_batch12_topics, v_batch12_questions;
end $$;

notify pgrst, 'reload schema';
