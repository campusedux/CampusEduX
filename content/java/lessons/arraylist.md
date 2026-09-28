A small bakery takes cake orders on a whiteboard. On a quiet Monday there are four orders. On the Saturday before a festival there are sixty. The owner never knows the number in advance, so a fixed grid of ten boxes would either waste space or run out by noon. What she needs is a list that simply grows when more orders arrive.

Plain Java arrays cannot do that, because their size is fixed the moment you create them. `ArrayList` solves this. Below you will learn how to use it, what happens inside when it grows, how much each operation costs, and when a `LinkedList` is the better pick.

## What is ArrayList?

> **Definition:** `ArrayList` is a class in `java.util` that implements the `List` interface using a resizable array. It keeps elements in insertion order, allows duplicates and `null`, and lets you reach any element by its index.

Here is what that means in practice:

- It remembers the order in which you added items.
- Index 0 is the first item, just like an array.
- The same value can appear many times.
- It holds objects only, so `int` values are stored as `Integer` through autoboxing.
- It is not synchronized, so it is not safe for many threads writing at once.

## Why is ArrayList used?

Most programs deal with groups of things whose count changes: items in a cart, rows from a file, orders for the day. An `ArrayList` handles this for you.

- **It grows by itself.** You never pick a size or copy arrays by hand.
- **Reading is fast.** `get(i)` jumps straight to position `i`, however long the list is.
- **Rich methods.** `add`, `remove`, `contains`, `indexOf`, `sort` and many more come ready to use.
- **It works with the rest of Java.** Loops, streams, `Collections.sort` and most library methods accept a `List`.

Because of this, `ArrayList` is the list class Java developers reach for first.

## Real-Life Example

Picture the bakery's display rack with numbered slots. Trays go into the next free slot, and a customer can say "slot 3, please" and get it at once. When the rack is full, the baker brings a bigger rack about one and a half times the size and moves every tray across in the same order.

If the baker squeezes a new tray into slot 1, every tray from slot 1 onward must slide one place to the right. Taking a tray out from the middle makes the ones behind it slide left.

That is `ArrayList` exactly: slots are indexes, the rack is the internal array, the bigger rack is growth, and sliding trays is the cost of inserting or removing in the middle.

## Syntax

```java
List<Type> name = new ArrayList<>();       // empty
List<Type> big = new ArrayList<>(500);     // room for 500

name.add(item);            // append at the end
name.add(index, item);     // insert at a position
Type t = name.get(index);  // read by index
name.set(index, item);     // replace by index
name.remove(index);        // delete by index
name.size();               // number of items
```

- The variable type is `List`, the interface, so the code does not depend on the exact class.
- `<Type>` must be a class such as `String` or `Integer`, never a primitive like `int`.
- The constructor with a number sets the starting capacity, which saves resizes when you know the size.
- `add` with one argument appends; with two, it inserts and shifts later items right.
- `get` and `set` work by index and throw `IndexOutOfBoundsException` for a bad index.
- `size()` is the count of items, not the length of the hidden array.

## How ArrayList Works

Inside every `ArrayList` is a plain `Object[]` array called `elementData`, plus a `size` counter. The array is usually larger than `size`, and the spare room is what makes adding cheap.

```text
new ArrayList<>()
elementData = {} (empty)
        |
        v
first add: capacity 10
[a|b|c|d|e|f|g|h|i|j]
        |
        v
11th add: array is full
new = 10 + (10 >> 1) = 15
        |
        v
copy 10 items across
old array -> garbage
```

The no-argument constructor does not build ten slots straight away. It waits for the first `add`, then creates an array of 10, the default capacity. When an add finds the array full, Java makes a new one 1.5 times as big, copies the old items over with `System.arraycopy`, and lets the old array be collected. So the capacity grows 10, 15, 22, 33, 49 and so on.

Copying sounds slow, but it happens rarely. Averaged over many adds, appending costs O(1). This is called amortized constant time.

The real cost is in the middle of the list. Inserting at index 1 shifts every later item one step right. Removing from index 1 shifts them left. With a million items, that is up to a million moves.

```text
get(i) / set(i)      O(1)
add(item) at end     O(1)*
add(i, item)         O(n)
remove(i)            O(n)
contains / indexOf   O(n)
* amortized
```

## Example Programs

### Taking cake orders

```java
import java.util.ArrayList;
import java.util.List;

public class CakeOrders {
    public static void main(String[] args) {
        List<String> orders = new ArrayList<>();
        orders.add("Plum");
        orders.add("Brownie");
        orders.add("Tart");
        System.out.println(orders);

        orders.add(1, "Rusk");
        System.out.println("After insert:");
        System.out.println(orders);

        orders.set(2, "Nut brownie");
        System.out.println("Order 2: " + orders.get(2));

        orders.remove("Plum");
        System.out.println("Size now: " + orders.size());
        System.out.println("Tart at: "
                + orders.indexOf("Tart"));
    }
}
```

**Output:**

```text
[Plum, Brownie, Tart]
After insert:
[Plum, Rusk, Brownie, Tart]
Order 2: Nut brownie
Size now: 3
Tart at: 2
```

Inserting "Rusk" at index 1 pushed "Brownie" to index 2. Removing "Plum" from the front shifted all the others left, so "Tart" moved from index 3 to index 2.

### Watching the capacity grow

```java
public class RackGrowth {
    public static void main(String[] args) {
        int capacity = 10;
        System.out.println("Start: 10 slots");
        for (int size = 1; size <= 60; size++) {
            if (size > capacity) {
                capacity = capacity + (capacity >> 1);
                System.out.println("Item " + size
                        + " -> " + capacity + " slots");
            }
        }
    }
}
```

**Output:**

```text
Start: 10 slots
Item 11 -> 15 slots
Item 16 -> 22 slots
Item 23 -> 33 slots
Item 34 -> 49 slots
Item 50 -> 73 slots
```

This program copies the growth rule `ArrayList` uses. Sixty adds need only five copies, which is why appending stays cheap on average.

### Removing by index or by value

```java
import java.util.ArrayList;
import java.util.List;

public class TrayCleanup {
    public static void main(String[] args) {
        List<Integer> trays = new ArrayList<>();
        trays.add(5);
        trays.add(0);
        trays.add(12);
        trays.add(0);
        trays.add(8);

        trays.remove(1);
        System.out.println("remove(1): " + trays);

        trays.remove(Integer.valueOf(12));
        System.out.println("remove(12): " + trays);

        trays.removeIf(count -> count == 0);
        System.out.println("No empties: " + trays);
    }
}
```

**Output:**

```text
remove(1): [5, 12, 0, 8]
remove(12): [5, 0, 8]
No empties: [5, 8]
```

With a list of `Integer`, `remove(1)` deletes the item at index 1, not the value 1. To remove a value, pass an `Integer` object. `removeIf` is the safe way to delete every item that matches a rule.

## ArrayList vs LinkedList

| Point | ArrayList | LinkedList |
|---|---|---|
| Inside | Resizable array | Doubly linked nodes |
| get(i) | O(1) | O(n), walks nodes |
| Add at end | O(1) amortized | O(1) |
| Insert in middle | O(n), shifts items | O(1) once there, O(n) to reach |
| Memory per item | Low | Higher, two links each |
| Best for | Reading by index | Adding at both ends |

In real projects `ArrayList` wins most of the time, because its items sit together in memory and the CPU reads them quickly. Choose `LinkedList` or `ArrayDeque` when you mostly add and remove at the ends.

## Common Mistakes

> **Warning:** Do not remove items inside a for-each loop over the same list. The loop's hidden iterator notices the change and throws ConcurrentModificationException. Use `removeIf` or an explicit `Iterator` instead.

- **Mixing up `remove(int)` and `remove(Object)`.** On a list of `Integer`, `remove(2)` removes index 2. Write `remove(Integer.valueOf(2))` for the value.
- **Confusing size with capacity.** `size()` counts items. The capacity is hidden and has no getter.
- **Growing `Arrays.asList`.** It returns a fixed-size list, so `add` throws `UnsupportedOperationException`. Wrap it in `new ArrayList<>(...)` first.
- **Reading past the end.** Valid indexes run from 0 to `size() - 1`.

## Interview Questions

**What is the default capacity of an ArrayList, and how does it grow?**
The no-argument constructor starts with an empty array and allocates 10 slots on the first add. When full, it grows to about 1.5 times the old size using `old + (old >> 1)`, then copies the items across.

**Why is get() fast but add(0, item) slow?**
`get` reads the array slot directly, so it is O(1). Adding at index 0 must shift every existing item one place right, which is O(n).

**What is the difference between size and capacity?**
Size is the number of items stored. Capacity is the length of the internal array, which is usually larger so that future adds need no copying.

**How do you remove items while iterating?**
Use `list.removeIf(condition)` or call `remove()` on an explicit `Iterator`. Removing through the list inside a for-each loop throws ConcurrentModificationException.

**When would you pick LinkedList over ArrayList?**
When most operations add or remove at the start or end and you rarely read by index. For random access and general use, `ArrayList` is faster and uses less memory.

## Summary

- `ArrayList` is a resizable array that keeps insertion order and allows duplicates.
- It allocates 10 slots on the first add and grows by 1.5 times when full.
- `get` and `set` are O(1); adding at the end is amortized O(1).
- Inserting or removing in the middle is O(n) because items shift.
- Use `removeIf` or an `Iterator` to delete while looping.
- Prefer it over `LinkedList` unless you mainly work at the list's ends.

## Related Topics

- [List](/learning/java-tutorial/list): the interface `ArrayList` implements.
- [LinkedList](/learning/java-tutorial/linkedlist): the node-based alternative from the table.
- [Iterator](/learning/java-tutorial/iterator): the safe way to walk and remove items.
- [Arrays](/learning/java-tutorial/arrays): the fixed-size structure hidden inside.
