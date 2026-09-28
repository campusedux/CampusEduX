On the morning of a university exam, the hall supervisor holds a sheet of free seat numbers. Late candidates keep walking in, and each one needs the nearest free seat to a given number. Seats are also released when someone moves to a different hall. The supervisor wants the free seats sorted, with no repeats, and wants to answer "what is the next free seat after 30?" in a moment. That is the job of a `TreeSet`.

In this guide you will see what a `TreeSet` is, how it sits on top of a `TreeMap`, how to sort it with your own `Comparator`, and how its navigation methods find the nearest element. You will also learn the surprising rule that a `TreeSet` decides duplicates with `compareTo()`, not `equals()`.

## What is TreeSet?

> **Definition:** `TreeSet` is a class in `java.util` that stores unique elements in sorted order. It is backed by a `TreeMap`, so adding, removing and searching take O(log n) time.

A few facts to keep in mind:

- It implements `NavigableSet`, which extends `SortedSet` and `Set`.
- Elements are sorted by natural order, or by a `Comparator` passed to the constructor.
- An element that compares as 0 with an existing one is a duplicate and is not added.
- `null` is not allowed with natural ordering.
- It has no index, and it is not synchronized.

## Why is TreeSet used?

A `HashSet` answers "is this element here?" very quickly, but it knows nothing about order. If you need the smallest element, you must scan them all. If you need them sorted, you must copy and sort them every time.

A `TreeSet` keeps its elements sorted all the time, at a cost of O(log n) per operation. That makes it the right tool when you need:

- Unique values printed in sorted order, such as a list of seat numbers.
- The smallest or largest element straight away, with `first()` and `last()`.
- The nearest element above or below a value, with `floor`, `ceiling`, `lower` and `higher`.
- A live view of a range, such as every seat from 20 to 40.

## Real-Life Example

Picture the supervisor's board of seat tokens, pinned in one long row from the lowest number to the highest. A released seat's token is pinned into its correct place, not at the end. If someone tries to pin a token that is already on the board, it is simply handed back.

When a late candidate asks for a seat near 30, the supervisor puts a finger at 30 on the board and reads the token just before it and the one just after it. To hand out the lowest seat, she takes the first token off the left end.

Map it back to Java: tokens are elements, the ordered board is the tree, rejecting a repeated token is duplicate handling, and reading the neighbours of 30 is `floor(30)` and `ceiling(30)`.

## Syntax

```java
TreeSet<Type> name = new TreeSet<>();
TreeSet<Type> custom = new TreeSet<>(comparator);

name.add(item);               // false if a duplicate
Type low = name.first();      // smallest
Type high = name.last();      // largest
Type f = name.floor(x);       // greatest <= x
Type c = name.ceiling(x);     // smallest >= x
Type h = name.higher(x);      // smallest > x
Type l = name.lower(x);       // greatest < x
Type taken = name.pollFirst();
```

- The first constructor sorts by natural order, so the element class must implement `Comparable`.
- The second uses a `Comparator` to decide the order and to detect duplicates.
- `add` returns `false` when an element comparing as 0 is already present.
- `first` and `last` return the ends. They throw `NoSuchElementException` if the set is empty.
- `floor`, `ceiling`, `higher` and `lower` return the nearest element, or `null` if there is none.
- `pollFirst` removes and returns the smallest element, which is handy for handing things out in order.

## How TreeSet Works

A `TreeSet` has no storage of its own. It holds a `NavigableMap`, normally a `TreeMap`, and stores each element as a key with a shared dummy value called `PRESENT`. So every call becomes a map call.

```text
seats.add(27)
      |
      v
map.put(27, PRESENT)
      |
      v
compare 27 with each node
  < 0 -> go left
  > 0 -> go right
  = 0 -> duplicate, stop
      |
      v
link new node, rebalance
add returns true
```

The tree is a red-black tree, so its height stays near log n. Each `add` walks from the root, comparing the new element with one node per level. If any compare returns 0, the map already has that key, `put` returns the old dummy value, and `add` returns `false`. Otherwise a node is linked in and the tree recolours or rotates to stay balanced.

Navigation uses the same walk. Here is how the four "nearest" methods answer for the free seats 12, 18, 27, 33 and 41.

```text
free: 12 18 27 33 41
lower(27)   -> 18
floor(30)   -> 27
ceiling(30) -> 33
higher(33)  -> 41
```

`floor` and `ceiling` accept an exact match, while `lower` and `higher` skip it and look strictly below or above. Each one goes down the tree once, remembering the best candidate it passes, so it costs O(log n) no matter how many seats there are.

## Example Programs

### Handing out free exam seats

```java
import java.util.TreeSet;

public class FreeSeats {
    public static void main(String[] args) {
        TreeSet<Integer> free = new TreeSet<>();
        free.add(41);
        free.add(12);
        free.add(33);
        free.add(27);
        free.add(18);
        System.out.println("Added 27 again? " + free.add(27));
        System.out.println("Free : " + free);

        System.out.println("First: " + free.first()
                + ", Last: " + free.last());
        System.out.println("Near 30: " + free.floor(30)
                + " and " + free.ceiling(30));
        System.out.println("Below 12: " + free.lower(12));

        int given = free.pollFirst();
        System.out.println("Gave seat " + given);
        System.out.println("Up to 33: " + free.headSet(33));
        System.out.println("From 33 : " + free.tailSet(33));
    }
}
```

**Output:**

```text
Added 27 again? false
Free : [12, 18, 27, 33, 41]
First: 12, Last: 41
Near 30: 27 and 33
Below 12: null
Gave seat 12
Up to 33: [18, 27]
From 33 : [33, 41]
```

The seats were added out of order but printed sorted, and the repeated 27 was rejected. `headSet(33)` leaves out 33, while `tailSet(33)` keeps it.

### Sorting exam halls with a Comparator

```java
import java.util.Comparator;
import java.util.TreeSet;

class Hall {
    String name; int seats;
    Hall(String n, int s) { name = n; seats = s; }
    public String toString() { return name + "(" + seats + ")"; }
}

public class HallOrder {
    public static void main(String[] args) {
        Comparator<Hall> bigFirst = Comparator
                .comparingInt((Hall h) -> h.seats)
                .reversed()
                .thenComparing(h -> h.name);

        TreeSet<Hall> halls = new TreeSet<>(bigFirst);
        halls.add(new Hall("Annex", 60));
        halls.add(new Hall("Main", 120));
        halls.add(new Hall("Lab", 60));
        halls.add(new Hall("Library", 40));

        for (Hall h : halls) {
            System.out.println(h);
        }
        System.out.println("Largest: " + halls.first());
    }
}
```

**Output:**

```text
Main(120)
Annex(60)
Lab(60)
Library(40)
Largest: Main(120)
```

`Hall` does not implement `Comparable`, so the `Comparator` supplies the order: most seats first, then name as a tie-breaker. Without `thenComparing`, "Annex" and "Lab" would compare as 0 and one of them would vanish.

### Duplicates are judged by compare, not equals

```java
import java.util.Comparator;
import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

public class DeskCodes {
    public static void main(String[] args) {
        Comparator<String> byLength =
                Comparator.comparingInt(String::length);
        Set<String> tree = new TreeSet<>(byLength);
        Set<String> hash = new HashSet<>();

        String[] codes = {"A12", "B07", "C3", "D19"};
        for (String c : codes) {
            tree.add(c);
            hash.add(c);
        }
        System.out.println("TreeSet: " + tree);
        System.out.println("HashSet size: " + hash.size());
    }
}
```

**Output:**

```text
TreeSet: [C3, A12]
HashSet size: 4
```

The comparator looks only at length, so "B07" and "D19" compare as 0 with "A12" and are dropped, even though `equals()` would call them different. The `HashSet` uses `equals()` and keeps all four.

## TreeSet vs HashSet

| Feature | TreeSet | HashSet |
|---|---|---|
| Order | Sorted | None |
| add / contains | O(log n) | O(1) average |
| null element | Not allowed | One allowed |
| Inside | TreeMap (red-black tree) | HashMap (buckets) |
| Duplicate test | compareTo or compare | hashCode + equals |
| Navigation | first, floor, ceiling, ranges | None |

Choose `HashSet` when you only ask "is it there?". Choose `TreeSet` when you need sorted output, the smallest or largest value, or the nearest element to a given one.

## Common Mistakes

> **Common mistake:** Writing a `Comparator` that compares only one field. Any two elements that tie on that field compare as 0, so the `TreeSet` silently keeps only the first one. Add a tie-breaker with `thenComparing`.

- **Using a class with no order.** Adding an element that is not `Comparable`, with no `Comparator`, throws `ClassCastException`.
- **Adding `null`.** With natural ordering, `add(null)` throws `NullPointerException`.
- **Calling `first()` on an empty set.** It throws `NoSuchElementException`. Use `pollFirst()` or check `isEmpty()` first.
- **Changing a field used for sorting.** The element stays in its old place, and later lookups can miss it.

## Interview Questions

**How does TreeSet work internally?**
It wraps a `NavigableMap`, normally a `TreeMap`. Each element is stored as a key with a dummy value, so `add`, `remove` and `contains` are map calls on a red-black tree and cost O(log n).

**How does TreeSet decide that an element is a duplicate?**
It uses `compareTo()` or the given `Comparator`. If the result is 0, the element is treated as already present, even if `equals()` would return `false`. That is why the ordering should be consistent with `equals()`.

**What is the difference between floor() and lower() in a TreeSet?**
`floor(x)` returns the greatest element less than or equal to `x`, so `x` itself counts. `lower(x)` returns the greatest element strictly less than `x`. Both return `null` if nothing qualifies.

**Why can a TreeSet not store null with natural ordering?**
Every add compares the new element with existing ones through `compareTo()`, and calling it on `null` throws `NullPointerException`. A `HashSet`, by contrast, allows one `null`.

**When would you choose TreeSet over HashSet?**
When you need the elements sorted, or need the smallest, largest or nearest element, or a range view. If you only test membership, a `HashSet` is faster.

## Summary

- `TreeSet` stores unique elements in sorted order and is backed by a `TreeMap`.
- `add`, `remove`, `contains` and navigation run in O(log n) time.
- Order comes from `Comparable` or a `Comparator` passed to the constructor.
- `first`, `last`, `floor`, `ceiling`, `lower` and `higher` find ends and neighbours.
- Duplicates are judged by `compareTo()` or `compare()`, not by `equals()`.
- `null` is not allowed with natural ordering, and it is not thread-safe.

## Related Topics

- [TreeMap](/learning/java-tutorial/treemap): the sorted map a `TreeSet` is built on.
- [HashSet](/learning/java-tutorial/hashset): the faster, unordered set in the table.
- [Comparator](/learning/java-tutorial/comparator): how to give a `TreeSet` your own order.
- [Set](/learning/java-tutorial/set): the interface every set class shares.
