Step into a town library and look around. The shelves keep books in a fixed order. The membership register never lists the same card twice. A popular novel has a waiting list, and whoever asked first gets it first. The front desk also has a card index that takes you from a call number straight to a shelf. Four jobs, four different ways of holding things.

Java programs face the same variety, and the Collection Framework is its answer. Instead of writing your own list, set or queue from scratch, you pick a ready-made structure that already fits the job. Here you will see how the framework is organised, what each branch is for, and how to choose between them with confidence.

## What is the Collection Framework?

> **Definition:** The Collection Framework is a group of interfaces, classes and helper methods in `java.util` that store and process groups of objects. Interfaces such as `List`, `Set`, `Queue` and `Map` describe what a container can do, and classes such as `ArrayList`, `HashSet` and `HashMap` supply the working code.

The framework has three layers:

- **Interfaces** define behaviour: what a list or a set promises to do.
- **Implementations** are the concrete classes you create with `new`.
- **Algorithms** live in the `Collections` helper class: sorting, searching, shuffling, finding the largest item and more.

All of them are generic, so `List<String>` holds only strings and the compiler catches mistakes early.

## Why is the Collection Framework used?

Before Java 1.2, developers used arrays, `Vector` and `Hashtable`, and each had its own method names. Arrays also have a fixed size and almost no built-in methods. The framework fixed both problems.

- **Less code to write.** Growing, searching, sorting and removing duplicates are already done and well tested.
- **One common vocabulary.** `add`, `remove`, `size` and `contains` mean the same thing on every collection.
- **Easy swapping.** Code written against `List` works with `ArrayList` or `LinkedList`, so changing the class is a one-line edit.
- **Speed you can predict.** Each class has known costs, so you can pick the fast one for your task.

## Real-Life Example

Map the library back to Java:

- The shelf where books stand in order, copies allowed, is a `List`. You can say "the fifth book on shelf B".
- The membership register, where one card number may appear only once, is a `Set`.
- The waiting list for the new thriller, served first come first served, is a `Queue`.
- The card index from call number to shelf is a `Map`: a key leads to a value.

The first three all "hold books or cards", so they share a parent idea, `Collection`. The card index is different. It stores pairs, not single items, which is why `Map` sits in its own family.

## Syntax

```java
import java.util.*;

List<Type>     list  = new ArrayList<>();
Set<Type>      set   = new HashSet<>();
Queue<Type>    queue = new ArrayDeque<>();
Map<Key, Val>  map   = new HashMap<>();

Collections.sort(list);        // helper method
```

- `import java.util.*;` brings in every collection type. In real code, importing each class by name is clearer.
- The left side names an interface; the right side picks a class. This habit is called coding to the interface.
- `<Type>` sets the element type, and the empty `<>` lets Java infer it from the left side.
- `Map` takes two types, one for keys and one for values.
- `Collections` (with an s) is a helper class full of static methods. `Collection` without the s is the interface.

## How the Collection Framework Is Organised

Every container except the maps grows from one root. Here is the family tree with the classes you will use most.

```text
Iterable
   |
   v
Collection
   |
   +-- List
   |    +-- ArrayList
   |    +-- LinkedList
   |
   +-- Set
   |    +-- HashSet
   |    +-- LinkedHashSet
   |    +-- TreeSet
   |
   +-- Queue
        +-- PriorityQueue
        +-- Deque
             +-- ArrayDeque

Map (separate family)
   +-- HashMap
   +-- LinkedHashMap
   +-- TreeMap
```

At the top, `Iterable` gives every collection an `iterator()`, which is why a for-each loop works on all of them. `Collection` adds the shared methods such as `add`, `remove`, `size`, `contains` and `stream`. Below it, each sub-interface adds its own promise: `List` adds positions, `Set` forbids duplicates and `Queue` adds ordered removal from the head. `LinkedList` actually implements both `List` and `Deque`. `Map` does not extend `Collection` at all, but it can hand you views of its keys, values and entries.

When you are unsure which to use, walk through these questions in order.

```text
Look up values by a key?
  yes -> Map
  no
   |
   v
Every item must be unique?
  yes -> Set
  no
   |
   v
Serve in arrival or
priority order?
  yes -> Queue
  no  -> List
```

Once the interface is chosen, pick the class. Use the hash version for speed, the linked version to keep insertion order, and the tree version to keep items sorted.

## Example Programs

### One library, three collections

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Queue;
import java.util.Set;

public class LibraryDesk {
    public static void main(String[] args) {
        List<String> loans = new ArrayList<>();
        loans.add("Gitanjali");
        loans.add("Malgudi Days");
        loans.add("Gitanjali");
        System.out.println("Loans: " + loans.size());

        Set<String> members = new LinkedHashSet<>();
        members.add("M101");
        members.add("M205");
        boolean again = members.add("M101");
        System.out.println("M101 added twice? " + again);
        System.out.println("Members: " + members);

        Queue<String> waiting = new ArrayDeque<>();
        waiting.offer("Rhea");
        waiting.offer("Dev");
        waiting.offer("Zoya");
        System.out.println("Next: " + waiting.poll());
        System.out.println("Waiting: " + waiting);
    }
}
```

**Output:**

```text
Loans: 3
M101 added twice? false
Members: [M101, M205]
Next: Rhea
Waiting: [Dev, Zoya]
```

The list kept both loans of "Gitanjali". The set quietly refused the second "M101" and returned `false`. The queue handed out the earliest name first.

### Coding to the interface

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.TreeSet;

public class ShelfReport {
    static void report(String label, Collection<String> c) {
        System.out.println(label + ": " + c.size()
                + " items, has Ruskin? "
                + c.contains("Ruskin"));
    }

    public static void main(String[] args) {
        String[] authors = {"Ruskin", "Tagore", "Ruskin"};
        report("List", new ArrayList<>(Arrays.asList(authors)));
        report("Set", new TreeSet<>(Arrays.asList(authors)));
        report("Queue", new ArrayDeque<>(Arrays.asList(authors)));
    }
}
```

**Output:**

```text
List: 3 items, has Ruskin? true
Set: 2 items, has Ruskin? true
Queue: 3 items, has Ruskin? true
```

One method accepts any `Collection`, so it works with a list, a set and a queue without change. Only the set dropped the repeated author, which shows each class keeping its own rules behind a shared interface.

### The Collections helper class

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class ReturnsDesk {
    public static void main(String[] args) {
        List<Integer> daysLate = new ArrayList<>(
                Arrays.asList(4, 0, 9, 2, 0));
        Collections.sort(daysLate);
        System.out.println("Sorted: " + daysLate);
        System.out.println("Worst: "
                + Collections.max(daysLate));
        System.out.println("On time: "
                + Collections.frequency(daysLate, 0));

        List<Integer> locked =
                Collections.unmodifiableList(daysLate);
        try {
            locked.add(7);
        } catch (UnsupportedOperationException e) {
            System.out.println("Read-only list");
        }
    }
}
```

**Output:**

```text
Sorted: [0, 0, 2, 4, 9]
Worst: 9
On time: 2
Read-only list
```

`Collections` sorted the list, found the largest value and counted zeros without a single loop in our code. `unmodifiableList` gives out a read-only view, which is handy when other code should look but not touch.

## List vs Set vs Queue vs Map

| Point | List | Set | Queue | Map |
|---|---|---|---|---|
| Stores | Items | Items | Items | Key-value pairs |
| Duplicates | Allowed | Not allowed | Allowed | Keys unique |
| Order | By index | Depends on class | Head first | Depends on class |
| Main access | `get(i)` | `contains` | `poll()` | `get(key)` |
| Common class | ArrayList | HashSet | ArrayDeque | HashMap |
| Library match | Shelf | Register | Waiting list | Card index |

## Common Mistakes

> **Common mistake:** Mixing up `Collection` and `Collections`. The first is the root interface you store data in. The second is a helper class with static methods like `sort` and `max`.

- **Thinking `Map` is a `Collection`.** It is not, so a `Map` cannot be passed where a `Collection` is expected. Use `keySet()` or `values()` instead.
- **Picking a list for uniqueness.** Calling `contains` before every `add` on a big list is O(n) each time. A `Set` does the check for you.
- **Declaring the class type everywhere.** Writing `ArrayList<String>` in method parameters locks callers to one class. Prefer `List<String>`.
- **Using legacy classes.** `Vector`, `Stack` and `Hashtable` still work but are slower. Use `ArrayList`, `ArrayDeque` and `HashMap`.

## Interview Questions

**What is the root interface of the Collection Framework?**
`Collection` is the root for lists, sets and queues, and it extends `Iterable`, which provides the iterator used by for-each loops. `Map` has its own separate hierarchy.

**Why does Map not extend Collection?**
A collection holds single items, but a map holds key-value pairs, so methods like `add(item)` do not fit. Instead, a map offers `keySet()`, `values()` and `entrySet()` views that are collections.

**What is the difference between Collection and Collections?**
`Collection` is an interface that containers implement. `Collections` is a utility class of static methods such as `sort`, `reverse`, `max` and `unmodifiableList`.

**How do you choose between List, Set and Queue?**
Use a `List` when position and duplicates matter, a `Set` when every item must be unique, and a `Queue` when items are processed in arrival or priority order.

**What does coding to the interface mean for collections?**
It means declaring variables and parameters with interface types like `List` and creating them with a class like `ArrayList`. The rest of the code then works unchanged if you later switch the class.

## Summary

- The framework lives in `java.util` and has interfaces, implementations and algorithms.
- `Iterable` → `Collection` → `List`, `Set` and `Queue` form one family; `Map` stands apart.
- Lists keep order and duplicates, sets keep unique items, queues serve from the head.
- Maps link unique keys to values.
- Hash classes are fastest, linked classes keep insertion order, tree classes keep items sorted.
- `Collections` offers ready-made helpers such as `sort`, `max` and `frequency`.

## Related Topics

- [ArrayList](/learning/java-tutorial/arraylist): the list class you will use most often.
- [HashSet](/learning/java-tutorial/hashset): the go-to set for unique items.
- [HashMap](/learning/java-tutorial/hashmap): fast key-value lookups outside the `Collection` tree.
- [Iterator](/learning/java-tutorial/iterator): the shared way to walk any collection.
