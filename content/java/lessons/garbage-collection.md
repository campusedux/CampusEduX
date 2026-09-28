After a wedding reception, the event hall is full of paper cups, used napkins and forgotten flower stands. Nobody asks each guest to carry out their own rubbish. A cleaning crew walks through once the guests have gone, checks what is still in use and clears away everything else, so the hall is ready for tomorrow's conference.

A Java program leaves the same kind of mess. Every `new` puts an object on the heap, and most of those objects are needed only briefly. You never write code to free them. The garbage collector, part of the JVM, finds objects that nothing can reach any more and reclaims their memory. In this guide you will see how it decides what is garbage, why the heap is split into young and old generations, what minor and major collections are, the exact moments an object becomes eligible, and why `System.gc()` and `finalize()` are not tools you should rely on.

## What is Garbage Collection?

> **Definition:** Garbage collection is the automatic process in which the JVM finds heap objects that can no longer be reached from any live part of the program and reclaims their memory so it can be reused for new objects.

Keep a few points in mind:

- It works only on the heap. Local variables on the stack disappear by themselves when a method returns.
- It decides by reachability, not by age or by how often an object was used.
- It runs when the JVM chooses, usually when a heap area fills up. You cannot schedule it.
- An object becoming eligible and an object actually being collected are two different moments.

## Why is Garbage Collection used?

In languages like C, the programmer calls `free()` for every allocation. Forget one call and memory leaks slowly until the program crashes. Call it too early and the program later reads memory that now belongs to something else.

Java removes that whole family of bugs. Because only the collector frees memory, a reference you hold can never point at a freed object, and you cannot free the same object twice. The collector also keeps the heap tidy. Modern collectors move surviving objects together, so free memory sits in one large block and new objects can be allocated very quickly by simply moving a pointer forward.

## Real-Life Example

Picture the cleaning crew at the event hall. The crew chief does not guess what is rubbish. She starts from the things that are clearly in use: the booking desk, the stage and the tables with guests at them. From each one she follows what it holds. The stage holds the microphone, the microphone holds its cable. Everything she can reach this way stays. Whatever she cannot reach, like a flyer on the floor or two chairs stacked on each other in a corner, gets cleared.

The mapping is direct. The booking desk, stage and occupied tables are GC roots. Following what each item holds is following references. The chairs that only hold each other are an island of isolation: they point at each other, but nothing in use points at them, so they are still cleared. The crew clears the busy foyer every hour but the storeroom only now and then, just as the JVM cleans the young generation often and the old generation rarely.

## Syntax

```java
Order o = new Order();   // object created on the heap
o = null;                // no reference: eligible
o = new Order();         // old object now unreachable

System.gc();             // a request, not a command
Runtime.getRuntime().gc();   // same request
```

- `new Order()` allocates an object on the heap and returns a reference to it.
- Setting the only reference to `null` makes the object eligible for collection.
- Pointing the variable at a new object leaves the earlier object with no reference, so it becomes eligible too.
- `System.gc()` asks the JVM to collect. The JVM may run a collection, delay it or ignore the request completely.
- `Runtime.getRuntime().gc()` makes the same request.

## How Garbage Collection Works

The collector begins at the GC roots: local variables of methods that are still running, static fields of loaded classes, and live threads. It then marks every object it can reach by following references.

```text
 GC roots: stack variables,
 static fields, live threads
          |
          v
 [Gala] ---> [Menu] ---> [Chef]
    |
    v
 [Band]

 [OldQuote]  no path in
 [TableA] <--> [TableB]
 island: no path in either
```

Everything marked survives. `OldQuote` has no incoming reference, and `TableA` and `TableB` refer only to each other, so none of the three is marked. After marking, the collector sweeps away the unmarked objects and often compacts the survivors so the free space is one continuous block. This is why a cycle of objects causes no leak in Java: what counts is a path from a root, not whether some reference exists.

Most objects die young, so the heap is split by age.

```text
 new Order()
      |
      v
+------------------+
| Young: Eden      |
+------------------+
      | minor GC copies
      | survivors
      v
+------------------+
| Young: S0 / S1   |
| age + 1 each GC  |
+------------------+
      | age reaches
      | the threshold
      v
+------------------+
| Old generation   |
| cleaned by major |
+------------------+
```

New objects go into Eden. When Eden fills, a minor collection copies the few survivors into a survivor space and empties Eden in one go, which is fast because most of Eden is garbage. Each survival adds one to an object's age, and after enough survivals the object is promoted to the old generation. The old generation fills slowly and is cleaned by a major or full collection, which is slower because it holds many live objects. Since Java 9 the default collector is G1, which divides the heap into regions and aims for short, predictable pauses. ZGC keeps pauses to around a millisecond on very large heaps, and the Parallel collector trades longer pauses for maximum throughput.

## Example Programs

### Marking reachable objects from a root

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

class Thing {
    final String name;
    final List<Thing> refs = new ArrayList<>();

    Thing(String name) {
        this.name = name;
    }

    void pointTo(Thing other) {
        refs.add(other);
    }
}

public class HallSweep {
    static Set<Thing> mark(List<Thing> roots) {
        Set<Thing> marked = new LinkedHashSet<>();
        Deque<Thing> todo = new ArrayDeque<>(roots);
        while (!todo.isEmpty()) {
            Thing t = todo.poll();
            if (marked.add(t)) {
                todo.addAll(t.refs);
            }
        }
        return marked;
    }

    public static void main(String[] args) {
        Thing gala = new Thing("Gala");
        Thing menu = new Thing("Menu");
        Thing band = new Thing("Band");
        Thing chef = new Thing("Chef");
        Thing quote = new Thing("OldQuote");
        Thing tableA = new Thing("TableA");
        Thing tableB = new Thing("TableB");

        gala.pointTo(menu);
        gala.pointTo(band);
        menu.pointTo(chef);
        tableA.pointTo(tableB);
        tableB.pointTo(tableA);

        List<Thing> heap = Arrays.asList(
                gala, menu, band, chef, quote, tableA, tableB);
        List<Thing> roots = Arrays.asList(gala);

        Set<Thing> live = mark(roots);
        for (Thing t : heap) {
            String state = live.contains(t) ? "live" : "garbage";
            System.out.println(t.name + " -> " + state);
        }
        System.out.println("marked " + live.size()
                + " of " + heap.size());
    }
}
```

**Output:**

```text
Gala -> live
Menu -> live
Band -> live
Chef -> live
OldQuote -> garbage
TableA -> garbage
TableB -> garbage
marked 4 of 7
```

This program copies the mark phase on a small model of the heap, with `Gala` as the only root. The two tables point at each other, yet the walk never reaches them, which is exactly why an island of isolation is collectable.

### Four ways an object loses its last reference

```java
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

class Prop {
    final String name;
    Prop partner;

    Prop(String name) {
        this.name = name;
        LostReferences.created.add(name);
    }
}

public class LostReferences {
    static final List<String> created = new ArrayList<>();
    static final List<String> reported = new ArrayList<>();

    static void report(String step, Prop... variables) {
        Set<String> live = new HashSet<>();
        for (Prop v : variables) {
            Prop p = v;
            while (p != null && live.add(p.name)) {
                p = p.partner;
            }
        }
        List<String> fresh = new ArrayList<>();
        for (String name : created) {
            if (!live.contains(name) && !reported.contains(name)) {
                fresh.add("+" + name);
                reported.add(name);
            }
        }
        System.out.println(step + ": "
                + (fresh.isEmpty() ? "none" : String.join(" ", fresh)));
    }

    static void rentProjector() {
        Prop projector = new Prop("Projector");
        // only this local variable refers to it
    }

    public static void main(String[] args) {
        Prop banner = new Prop("Banner");
        Prop mic = new Prop("Mic");
        report("start          ", banner, mic);

        banner = null;
        report("banner = null  ", banner, mic);

        mic = new Prop("SpareMic");
        report("mic reassigned ", banner, mic);

        rentProjector();
        report("method returned", banner, mic);

        Prop usher = new Prop("Usher");
        Prop badge = new Prop("Badge");
        usher.partner = badge;
        badge.partner = usher;
        report("island built   ", banner, mic, usher, badge);

        usher = null;
        badge = null;
        report("island cut off ", banner, mic, usher, badge);
        System.out.println("still reachable: " + mic.name);
    }
}
```

**Output:**

```text
start          : none
banner = null  : +Banner
mic reassigned : +Mic
method returned: +Projector
island built   : none
island cut off : +Usher +Badge
still reachable: SpareMic
```

The program records only names, so its log keeps no object alive. After each step it follows the current variables and reports which objects just became eligible: by `null`, by reassignment, by a method ending, and as an island.

## Minor GC vs Major GC

| Point | Minor GC | Major GC |
|---|---|---|
| Area cleaned | Young generation | Old generation |
| Trigger | Eden is full | Old generation filling up |
| How often | Very often | Rarely |
| Speed | Fast, few survivors | Slower, many live objects |
| Pause | Short | Longer, varies by collector |

Frequent minor collections are normal and cheap. Frequent major collections usually mean objects live too long or the heap is too small.

## Common Mistakes

> **Warning:** Do not call `System.gc()` to fix memory problems. It is only a request, it can trigger a slow full collection, and a leak stays a leak however often you ask. Find what still holds the references instead.

- **Believing Java cannot leak memory.** Objects kept in a static list or an ever-growing cache stay reachable forever, so they are never collected.
- **Using `finalize()` for cleanup.** It is deprecated since Java 9, may run late or never, and slows collection. Use try-with-resources.
- **Thinking `null` frees memory at once.** It only makes the object eligible. The memory returns at the next collection that covers it.
- **Nulling every local variable by hand.** Locals vanish when the method returns. Nulling helps only for long-lived fields or collections.

## Interview Questions

**How does the JVM decide that an object is garbage?**
It checks reachability. Starting from GC roots such as local variables of running methods, static fields and live threads, it marks every object it can reach. Anything left unmarked is garbage.

**What are GC roots?**
They are the starting points of the reachability check: local variables and parameters on thread stacks, static fields of loaded classes, active threads and references held by native code. An object reachable from any root stays alive.

**What is an island of isolation?**
It is a group of objects that refer to each other but are not reachable from any root. Because Java traces from roots instead of counting references, the whole group is collected.

**Does System.gc() force garbage collection?**
No. It only suggests a collection, and the JVM is free to ignore it. It can also be disabled entirely with the `-XX:+DisableExplicitGC` option.

**What is the difference between minor and major GC?**
A minor GC cleans the young generation. It runs often and is fast because most young objects are already dead. A major GC cleans the old generation, runs less often and usually takes longer.

## Summary

- Garbage collection frees heap objects that no GC root can reach.
- Roots include local variables, static fields and live threads; cycles without a root path are collected.
- The heap is split into young (Eden plus survivor spaces) and old generations.
- Minor GCs clean the young generation often; major GCs clean the old generation rarely.
- Objects become eligible through `null`, reassignment, leaving scope or isolation.
- `System.gc()` is only a request, `finalize()` is deprecated, and G1 is the default collector.

## Related Topics

- [Heap](/learning/java-tutorial/heap): the memory area the collector manages.
- [Stack](/learning/java-tutorial/stack): where local variables, the most common GC roots, live.
- [Memory Management](/learning/java-tutorial/memory-management): how the JVM organises all its memory.
- [JVM Architecture](/learning/java-tutorial/jvm-architecture): where the garbage collector fits inside the JVM.
