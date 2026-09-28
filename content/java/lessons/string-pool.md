A city bus depot runs hundreds of buses, yet only a few dozen destination names ever appear on their front boards. The depot would be silly to paint a fresh "Railway Station" board for every trip. It keeps one master board per name on a rack and lends it out again and again. The JVM treats text the same way. The same words turn up in a program thousands of times, so Java keeps one shared copy of each and hands out that copy.

That shared rack is the String pool. The [String](/learning/java-tutorial/string) topic showed that two equal literals point to one object. This guide goes further: which strings enter the pool and which do not, why `"a" + "b"` can be pooled while `x + "b"` usually is not, what `intern()` really does, and where the pool lives in memory.

## What is String Pool?

> **Definition:** The String pool is a table inside the JVM that holds exactly one `String` object for each distinct text it has registered. String literals and compile-time constant expressions are registered automatically, and any other string can join through `intern()`.

A few facts frame everything below:

- The pool holds `String` objects only. It is not a separate kind of string.
- Every literal in your source code, such as `"Gate 4"`, ends up in the pool.
- Strings built while the program runs, by `new`, `+` with variables, `substring`, `split` or reading input, are ordinary heap objects outside the pool.
- Since Java 7, the pool lives in the main heap. Before that it sat in a fixed-size area called PermGen.
- Pooling is safe only because strings are immutable. Nobody holding the shared copy can change it for the others.

## Why is String Pool used?

Real programs repeat text constantly. Status labels, country codes, column names, JSON keys and log prefixes appear on every record. If each occurrence were its own object, a list of a million bookings with the status "CONFIRMED" would carry a million identical copies of the same nine letters.

The pool removes those duplicates. Every literal with the same text becomes a reference to one object, so the memory cost is paid once. The JVM also saves work at class loading, because a literal is looked up once and then reused.

There is a second benefit. When two references point to the same pooled object, the JVM can compare them with a single address check. You should still use `equals()` in your own code, but `equals()` itself starts with that fast `==` check, so pooled strings compare quickly.

## Real-Life Example

Picture the board room at the depot. Along one wall hangs a rack with one painted board for each destination. When a driver needs "City Market", the clerk checks the rack. If the board is there, the driver borrows that very board. If not, a new one is painted, hung on the rack and handed over.

Now a driver decides to paint his own "City Market" board at home. It reads exactly the same, but it is a different board, and it is not on the rack. If he later asks the clerk to swap it for the official one, the clerk hands him the rack copy.

Mapping it back: the rack is the String pool, and borrowing from it is what a literal does. Painting at home is `new String(...)` or any string built at run time. Asking the clerk for the official board is `intern()`. The painted letters never change, just as a `String` never changes, which is why sharing one board is safe.

## Syntax

```java
String a = "Gate 4";              // literal: pooled
String b = new String("Gate 4");  // new heap object
String c = b.intern();            // pooled copy of b

final String G = "Gate";          // constant variable
String d = G + " 4";              // folded by javac: pooled

String g = "Gate";                // plain variable
String e = g + " 4";              // built at run time
```

- `a` is a literal, so it refers to the pooled "Gate 4".
- `b` always gets a brand-new object with the same characters, outside the pool.
- `c` is whatever the pool holds for "Gate 4", which is the same object as `a`.
- `G` is `final` and holds a literal, so it is a compile-time constant. The compiler replaces `G + " 4"` with `"Gate 4"` before the program ever runs, which makes `d` a pooled literal too.
- `g` is an ordinary variable. The compiler cannot be sure of its value, so `g + " 4"` is joined at run time and produces a new object. `e.equals(a)` is true, but `e == a` is false.

## How String Pool Works

When the JVM executes an instruction that loads a literal, it asks the pool, a hash table often called the StringTable, for that text.

```text
code loads the literal "Gate 4"
            |
            v
  hash the text, search
  the StringTable
            |
      +-----+------+
      |            |
    found       not found
      |            |
      v            v
 return that   create one,
 object        store it,
               return it
```

If no code has used that text before, it is not found, so the JVM creates the object and records it. Every later use of that text, from any class, is found and returns the same object. `intern()` follows this same path at run time: if the table already has equal text it returns the stored object, and otherwise it stores the string you called it on and returns it.

Here is where the pieces sit in memory since Java 7.

```text
 Stack         Heap
+-------+   +-------------------+
| a  ---+-->| String pool       |
| c  ---+-->|  "Gate 4"         |
| d  ---+-->|                   |
|       |   +-------------------+
| b  ---+-->  "Gate 4" (new)
| e  ---+-->  "Gate 4" (built)
+-------+   rest of the heap
```

Three variables share one pooled object, while `b` and `e` each own a separate object with equal text. Because the pool is inside the heap, pooled strings that nothing refers to any more can be removed by the garbage collector, and the pool no longer runs out of the small, fixed PermGen space that caused errors in Java 6.

## Example Programs

### Compile-time and run-time joining

```java
public class RouteBoard {
    static String depotName() {
        return "Kothrud";
    }

    public static void main(String[] args) {
        String full = "Kothrud Depot";

        String joined = "Kothrud" + " Depot";
        final String FIXED = "Kothrud";
        String fromFinal = FIXED + " Depot";
        String loose = "Kothrud";
        String fromLoose = loose + " Depot";
        final String CALLED = depotName();
        String fromCall = CALLED + " Depot";

        System.out.println("literal + literal : "
                + (full == joined));
        System.out.println("final + literal   : "
                + (full == fromFinal));
        System.out.println("var + literal     : "
                + (full == fromLoose));
        System.out.println("final from method : "
                + (full == fromCall));
        System.out.println("equals, all four  : "
                + (full.equals(joined) && full.equals(fromFinal)
                && full.equals(fromLoose)
                && full.equals(fromCall)));
    }
}
```

**Output:**

```text
literal + literal : true
final + literal   : true
var + literal     : false
final from method : false
equals, all four  : true
```

Only constant expressions are joined by the compiler. `CALLED` is `final`, but its value comes from a method call, so it is not a compile-time constant and the join happens at run time.

### Interning names from a data feed

```java
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;

public class RouteFeed {
    static int distinctObjects(String[] items) {
        Set<String> seen = Collections.newSetFromMap(
                new IdentityHashMap<>());
        Collections.addAll(seen, items);
        return seen.size();
    }

    public static void main(String[] args) {
        String feed = "R12,R7,R12,R40,R7,R12";
        String[] routes = feed.split(",");

        System.out.println("tokens          : " + routes.length);
        System.out.println("objects before  : "
                + distinctObjects(routes));
        System.out.println("routes[0] == R12: "
                + (routes[0] == "R12"));

        for (int i = 0; i < routes.length; i++) {
            routes[i] = routes[i].intern();
        }

        System.out.println("objects after   : "
                + distinctObjects(routes));
        System.out.println("routes[0] == R12: "
                + (routes[0] == "R12"));
        System.out.println("routes[0] == [2]: "
                + (routes[0] == routes[2]));
    }
}
```

**Output:**

```text
tokens          : 6
objects before  : 6
routes[0] == R12: false
objects after   : 3
routes[0] == R12: true
routes[0] == [2]: true
```

`split` creates a new object for every token, even repeated ones. An `IdentityHashMap` counts objects by address, so it shows six objects shrinking to three once each token is swapped for its pooled copy.

### Literals versus new String in bulk

```java
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;

public class BusStatus {
    static int countObjects(String[] labels) {
        Set<String> seen = Collections.newSetFromMap(
                new IdentityHashMap<>());
        Collections.addAll(seen, labels);
        return seen.size();
    }

    public static void main(String[] args) {
        int buses = 1000;
        String[] pooled = new String[buses];
        String[] copied = new String[buses];

        for (int i = 0; i < buses; i++) {
            pooled[i] = "ON TIME";
            copied[i] = new String("ON TIME");
        }

        System.out.println("labels stored   : " + buses);
        System.out.println("literal objects : "
                + countObjects(pooled));
        System.out.println("new String objs : "
                + countObjects(copied));
        System.out.println("same text?      : "
                + pooled[0].equals(copied[999]));
        System.out.println("same object?    : "
                + (pooled[0] == copied[999]));
    }
}
```

**Output:**

```text
labels stored   : 1000
literal objects : 1
new String objs : 1000
same text?      : true
same object?    : false
```

A thousand buses share a single "ON TIME" object through the literal, while `new String` builds a thousand separate copies. This is the waste the pool exists to prevent.

## Common Mistakes

> **Warning:** Never let a correct `==` result in a small test convince you that `==` works for strings. It passes with literals and fails as soon as the text comes from user input, a file, a database or a join at run time. Compare text with `equals()`.

- **Thinking `new String("x")` is pooled.** The literal inside the brackets is pooled; the object `new` returns is not.
- **Assuming every `final` variable is a constant.** Only a `final` variable set to a constant expression is folded. A value from a method call is joined at run time.
- **Interning everything.** `intern()` costs a hash lookup and keeps text in a global table. Use it only for heavily repeated values from outside the program.
- **Writing `new String("...")` out of habit.** It only adds a duplicate object. Assign the literal directly.

## Interview Questions

**Where is the String pool stored in modern Java?**
Since Java 7 it is part of the ordinary heap. In Java 6 and earlier it lived in PermGen, a small fixed area that could overflow with `OutOfMemoryError` when too many strings were interned.

**How many objects does `String s = new String("Ferry");` create?**
At most two. The literal "Ferry" is placed in the pool if it is not there already, and `new` always creates one more object on the heap. If the literal was pooled earlier, only the heap object is new.

**Why is `"Bus" + "Stop" == "BusStop"` true?**
Both operands are literals, so the compiler joins them into the single constant `"BusStop"` before the program runs. Both sides then refer to the same pooled literal.

**What does `intern()` return?**
It returns the pooled string with the same text. If the pool already holds equal text, you get that existing object. Otherwise the string you called it on is added to the pool and returned.

**Can strings in the pool be garbage collected?**
Yes. Since the pool moved into the heap in Java 7, a pooled string that no class or variable refers to any more can be collected like any other object. Literals stay alive while the class that uses them is loaded.

## Summary

- The String pool keeps one shared `String` object for each distinct registered text.
- Literals and compile-time constant expressions are pooled automatically.
- `new String`, run-time joins, `split`, `substring` and input all create objects outside the pool.
- `intern()` returns the pooled copy, adding the string first if the text is new.
- The pool has been part of the heap since Java 7, so unused entries can be collected.
- Pooling is safe because strings are immutable, but you should still compare text with `equals()`.

## Related Topics

- [String](/learning/java-tutorial/string): the immutable class that makes sharing text safe.
- [final Keyword](/learning/java-tutorial/final-keyword): why a `final` constant can be joined at compile time.
- [Heap](/learning/java-tutorial/heap): the memory area where the pool and every object live.
- [StringBuilder](/learning/java-tutorial/stringbuilder): the right tool when you build text at run time.
