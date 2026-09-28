Every evening, the owner of a small spice shop walks along her shelf of jars with a clipboard. She checks one jar, moves to the next, and pulls any empty jar off the shelf as she passes it. She never needs to know how the shelf is built. She only needs to know two things: is there another jar, and which jar is next? Java gives every collection the same simple walker, and it is called `Iterator`.

In this guide you will see what an `Iterator` is, how its cursor moves, why removing items during a loop can crash your program, and how to remove them safely. You will also meet `ListIterator`, which can walk backwards and edit a list as it goes.

## What is Iterator?

> **Definition:** `Iterator` is an interface in `java.util` that walks through the elements of a collection one at a time. Its three core methods are `hasNext()`, `next()` and `remove()`.

A few facts to keep in mind:

- Every `Collection` has an `iterator()` method that returns a fresh `Iterator`.
- The for-each loop is built on it. Any class that implements `Iterable` can be used in a for-each loop.
- An iterator moves forward only, and each one can be used for a single pass.
- `remove()` is optional. Collections that cannot shrink, such as `List.of(...)`, throw `UnsupportedOperationException`.
- The iterators of `ArrayList`, `HashMap` and most other classes are fail-fast.

## Why is Iterator used?

Different collections store data in very different ways. An `ArrayList` has an array, a `LinkedList` has nodes, and a `HashSet` has buckets. Without a common tool, you would write a different loop for each one, and a `Set` has no index to loop over at all.

An `Iterator` hides those details. The same `while (it.hasNext())` loop works on a list, a set, or the entries of a map. This matters for three reasons:

- One loop style works for every collection, so code does not change when the collection class does.
- It is the only safe way to remove elements from most collections while you walk them.
- It lets you stop early without reading the whole collection.

## Real-Life Example

Think of the spice shop's clipboard again. The owner stands in the gap before the first jar. "Is there another jar?" is `hasNext()`. Stepping past a jar and reading its label is `next()`. Taking the jar she just read off the shelf is `remove()`.

Now imagine her helper removes a jar from the far end while the owner is still counting. Her count no longer matches the shelf, and she stops at once rather than record wrong numbers. That instant stop is what fail-fast means in Java.

## Syntax

```java
Iterator<Type> it = collection.iterator();

while (it.hasNext()) {
    Type item = it.next();   // step past one element
    if (condition) {
        it.remove();         // drop the last one returned
    }
}
```

- `collection.iterator()` returns a new iterator whose cursor sits before the first element.
- `hasNext()` returns `true` if at least one more element lies ahead. It does not move the cursor.
- `next()` moves the cursor past one element and returns it. With nothing left, it throws `NoSuchElementException`.
- `remove()` deletes the element that the last `next()` returned. Calling it twice in a row, or before any `next()`, throws `IllegalStateException`.

## How Iterator Works

An iterator's cursor never points at an element. It sits in the gap between two elements. Here is a walk over three spice jars.

```text
[Clove, Cumin, Mace]

^ Clove   Cumin   Mace
  cursor at start
      |
      v
next() -> "Clove"
  Clove ^ Cumin   Mace
      |
      v
next() -> "Cumin"
  Clove   Cumin ^ Mace
      |
      v
remove() drops "Cumin"
  Clove ^ Mace
```

Each `next()` jumps over one element and hands it back. `remove()` deletes the element just jumped over, and the cursor stays in the gap, so the next `next()` returns "Mace" with nothing skipped. For an `ArrayList`, the iterator simply keeps an int index called `cursor` and a `lastRet` index for the element it last returned.

The iterator also guards against changes it did not make. Every `ArrayList` counts its structural changes, such as adds and removes, in a field named `modCount`.

```text
it = jars.iterator()
expectedModCount = 4
      |
      v
jars.remove("Mace")
modCount becomes 5
      |
      v
it.next() checks
5 != 4 -> throw
```

When the iterator is created, it copies `modCount` into `expectedModCount`. Every `next()` compares the two. If the list was changed by anything other than this iterator, they differ and `next()` throws ConcurrentModificationException. The iterator's own `remove()` updates both counts, which is exactly why it is the safe way to delete during a walk.

## Example Programs

### Removing empty jars with an Iterator

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

public class SpiceShelf {
    public static void main(String[] args) {
        List<String> jars = new ArrayList<>(Arrays.asList(
                "Clove:12", "Cumin:0", "Mace:5", "Saffron:0"));

        Iterator<String> it = jars.iterator();
        while (it.hasNext()) {
            String jar = it.next();
            int grams = Integer.parseInt(jar.split(":")[1]);
            if (grams == 0) {
                it.remove();
                System.out.println("Removed " + jar);
            }
        }
        System.out.println("On shelf: " + jars);
    }
}
```

**Output:**

```text
Removed Cumin:0
Removed Saffron:0
On shelf: [Clove:12, Mace:5]
```

The loop reads each jar once and removes the empty ones through the iterator itself, so the list and the iterator stay in step.

### Fail-fast in action, and two safe fixes

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class RestockList {
    public static void main(String[] args) {
        List<String> order = new ArrayList<>(Arrays.asList(
                "Anise", "Dill", "Mace", "Ajwain"));
        try {
            for (String s : order) {
                if (s.startsWith("A")) {
                    order.remove(s);
                }
            }
        } catch (RuntimeException e) {
            System.out.println(e.getClass().getSimpleName());
        }
        System.out.println("After crash: " + order);

        order.removeIf(s -> s.startsWith("A"));
        System.out.println("removeIf   : " + order);
    }
}
```

**Output:**

```text
ConcurrentModificationException
After crash: [Dill, Mace, Ajwain]
removeIf   : [Dill, Mace]
```

The for-each loop used a hidden iterator, but the removal went through the list, so the next `next()` saw a changed `modCount` and threw ConcurrentModificationException. `removeIf` does the walk and the removal internally, so it is safe and short.

### Walking both ways with ListIterator

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.ListIterator;

public class PriceBoard {
    public static void main(String[] args) {
        List<Integer> prices = new ArrayList<>(
                Arrays.asList(120, 340, 95));

        ListIterator<Integer> it = prices.listIterator();
        while (it.hasNext()) {
            int p = it.next();
            it.set(p + 10);
            if (p == 340) {
                it.add(410);
            }
        }
        System.out.println("Raised: " + prices);

        System.out.print("Backwards:");
        while (it.hasPrevious()) {
            int i = it.previousIndex();
            System.out.print(" " + i + "=" + it.previous());
        }
        System.out.println();
    }
}
```

**Output:**

```text
Raised: [130, 350, 410, 105]
Backwards: 3=105 2=410 1=350 0=130
```

`set` replaced each price in place, and `add` slipped 410 in right after the old 340. The cursor then sat past the new item, so it was not raised again. Once the cursor reached the end, `previous()` walked the same list back to the start.

## Iterator vs ListIterator vs for-each

| Feature | Iterator | ListIterator | for-each |
|---|---|---|---|
| Works on | Any Collection | Lists only | Arrays, Iterable |
| Direction | Forward | Both ways | Forward |
| Remove | Yes | Yes | No |
| Replace, add | No | set, add | No |
| Index | No | nextIndex | No |

Use for-each for plain reading, an `Iterator` when you must remove, and a `ListIterator` when you need to edit a list or walk it backwards.

## Common Mistakes

> **Warning:** Never call `list.remove()` or `list.add()` inside a for-each loop over the same list. Use `it.remove()`, `removeIf`, or collect the changes and apply them after the loop.

- **Calling `next()` twice per loop.** Each call moves the cursor, so you skip elements and may hit `NoSuchElementException`.
- **Calling `remove()` before `next()`.** There is no element to remove yet, so it throws `IllegalStateException`.
- **Trusting fail-fast as a lock.** It is a best-effort bug check, not thread safety. Threads still need a concurrent collection.
- **Thinking no exception means no bug.** Removing the second-to-last element inside a for-each loop does not throw. The size shrinks, `hasNext()` returns false, and the last element is silently never checked.
- **Reusing a finished iterator.** Once `hasNext()` is false, ask the collection for a new iterator.

## Interview Questions

**What are the main methods of the Iterator interface?**
`hasNext()` checks whether another element exists, `next()` returns it and moves the cursor forward, and `remove()` deletes the element last returned. Java 8 also added `forEachRemaining()`.

**What does fail-fast mean for an Iterator?**
The iterator records the collection's `modCount` when it is created and checks it on every `next()`. If the collection was changed structurally by someone else, it throws ConcurrentModificationException instead of returning wrong data.

**How do you safely remove elements while iterating over a list?**
Call `remove()` on the iterator itself, which keeps its expected count in step with the list. From Java 8 you can also use `removeIf` with a condition. Removing through the list inside a for-each loop is unsafe.

**What is the difference between Iterator and ListIterator?**
`Iterator` works on every collection and moves only forward. `ListIterator` works only on lists, moves both ways, reports indexes, and can replace elements with `set` and insert them with `add`.

**How is the for-each loop related to Iterator?**
For a collection, the compiler turns a for-each loop into a loop that calls `iterator()`, `hasNext()` and `next()`. The iterator is hidden, so you cannot call its `remove()` from a for-each loop.

## Summary

- `Iterator` walks any collection with `hasNext()`, `next()` and `remove()`.
- The cursor sits between elements, and `next()` jumps over one element at a time.
- `remove()` deletes the element last returned and can be called once per `next()`.
- Fail-fast iterators compare `modCount` and throw on outside structural changes.
- Remove safely with `it.remove()` or `removeIf`, never with the list inside for-each.
- `ListIterator` adds backward movement, indexes, `set` and `add` for lists.

## Related Topics

- [ArrayList](/learning/java-tutorial/arraylist): the list whose iterator tracks `modCount`.
- [LinkedList](/learning/java-tutorial/linkedlist): where a `ListIterator` makes inserts cheap.
- [Collection Framework](/learning/java-tutorial/collection-framework): the family of classes every iterator serves.
