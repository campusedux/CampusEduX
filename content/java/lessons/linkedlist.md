Picture a metro line on a map. Each station knows only two things: the station before it and the station after it. When the city opens a new station at the end of the line, the planners connect one new stop to the old terminus, and the rest of the route stays exactly as it was. Java's `LinkedList` stores data in the same way.

In this guide you will see how a `LinkedList` is built from nodes, why adding at the ends is cheap while reading by index is slow, and how the same object can act as a list, a queue and a stack. By the end you will know when it beats `ArrayList` and when it does not.

## What is LinkedList?

> **Definition:** `LinkedList` is a class in `java.util` that stores its elements in a chain of doubly linked nodes. Each node holds one element plus a link to the node before it and the node after it.

Keep these facts in mind:

- It implements both `List` and `Deque`, so it supports index methods and queue methods.
- It keeps insertion order and allows duplicates and `null` values.
- There is no backing array and no capacity. The chain grows one node at a time.
- The class remembers only the first node, the last node and the size.
- It is not synchronized, so threads that share one list need outside locking.

## Why is LinkedList used?

An `ArrayList` keeps its items in one block of memory. Adding at the front means shifting every item one slot to the right, and with a million items that is a million moves.

A `LinkedList` never shifts anything. To add at the front, it creates one node and changes two links. Removing from either end is just as quick. That makes it handy for queues of work, undo history, a "recently visited" trail, and any job where items mostly enter and leave at the ends.

It also gives you a ready-made `Deque`. You can use one object as a first-in-first-out queue with `offer` and `poll`, or as a stack with `push` and `pop`, without writing your own structure.

## Real-Life Example

Think of the metro line again. Each platform has a sign with two arrows: "previous: Kurla" and "next: Thane". The control room keeps only the names of the two terminal stations.

Opening a new terminus is easy. The planners point the old end station's "next" sign at the new stop, give the new stop a "previous" sign, and update the control room's record.

But if a tourist asks "what is the 23rd station?", nobody can answer at a glance. Someone has to start at one end and count the stops one by one.

Map it back to Java: each station is a node, the signs are the `prev` and `next` links, and the control room is the `first` and `last` fields. Counting stops is what `get(i)` has to do.

## Syntax

```java
LinkedList<Type> name = new LinkedList<>();

name.add(item);          // link at the end
name.addFirst(item);     // link at the front
name.add(index, item);   // walk, then link
Type a = name.getFirst();
Type b = name.removeLast();
Type c = name.get(index); // walks the chain
```

- `new LinkedList<>()` makes an empty chain. Both `first` and `last` are `null` and the size is 0.
- `add(item)` creates a node and links it after the current last node.
- `addFirst(item)` links a new node before the current first node.
- `add(index, item)` first walks to the position, then links the node there.
- `getFirst()` and `removeLast()` touch only the ends, so they finish in constant time.
- `get(index)` must walk node by node to reach the position.

## How LinkedList Works

Inside, every element sits in a small private `Node` object with three fields: `prev`, `item` and `next`. The list itself stores `first`, `last` and `size`. Here is a list of three metro stations.

```text
 first
   |
   v
+------+-------+------+
| null | Dadar | next |
+------+-------+--+---+
   ^              |
   |              v
+--+---+-------+------+
| prev | Kurla | next |
+------+-------+--+---+
   ^              |
   |              v
+--+---+-------+------+
| prev | Thane | null |
+------+-------+------+
   ^
   |
 last
```

The first node has no `prev`, and the last node has no `next`. Every node in between points both ways, which is why the list is called doubly linked. When you call `addLast("Mulund")`, Java makes a node whose `prev` is Thane, sets Thane's `next` to it, and moves `last` to the new node. No other node is touched, so the cost is O(1) however long the list is.

Reading by index is the weak spot. There is no array to jump into, so `get(i)` has to walk.

```text
get(5) on 8 nodes
      |
      v
is 5 < 8 / 2 ?  no
      |
      v
start at last (index 7)
      |
      v
step back via prev x2
      |
      v
return item at index 5
```

Java makes one smart choice here. If the index is in the first half, it starts from `first` and follows `next`. Otherwise it starts from `last` and follows `prev`. That halves the walk, but it is still O(n). A plain `for` loop that calls `get(i)` on every index therefore costs O(n²) in total, while a for-each loop walks the chain once.

Inserting in the middle is O(1) only after you reach the spot. With a `ListIterator` already standing there, `add` just rewires links. With `add(index, item)`, the walk to the index costs O(n) first.

## Example Programs

### Building a metro line

```java
import java.util.LinkedList;

public class MetroLine {
    public static void main(String[] args) {
        LinkedList<String> line = new LinkedList<>();
        line.add("Dadar");
        line.add("Kurla");
        System.out.println("Start: " + line);

        line.addFirst("Parel");
        line.addLast("Thane");
        line.add(2, "Sion");
        System.out.println("Grown:");
        System.out.println(line);

        System.out.println("Ends: " + line.getFirst()
                + " to " + line.getLast());
        System.out.println("Index 3: " + line.get(3));

        line.removeFirst();
        line.remove("Kurla");
        System.out.println("Final: " + line);
        System.out.println("Stops: " + line.size());
    }
}
```

**Output:**

```text
Start: [Dadar, Kurla]
Grown:
[Parel, Dadar, Sion, Kurla, Thane]
Ends: Parel to Thane
Index 3: Kurla
Final: [Dadar, Sion, Thane]
Stops: 3
```

`addFirst` and `addLast` only relink the ends. `add(2, "Sion")` and `remove("Kurla")` had to walk the chain first to find their spot.

### One object as a queue and a stack

```java
import java.util.Deque;
import java.util.LinkedList;

public class GateQueue {
    public static void main(String[] args) {
        Deque<String> gate = new LinkedList<>();
        gate.offer("Rider-11");
        gate.offer("Rider-12");
        gate.offer("Rider-13");
        System.out.println("Next in: " + gate.peek());
        System.out.println("Entered: " + gate.poll());
        System.out.println("Waiting: " + gate);

        Deque<String> trail = new LinkedList<>();
        trail.push("Andheri");
        trail.push("Ghatkopar");
        trail.push("Vikhroli");
        System.out.println("Back to: " + trail.pop());
        System.out.println("Trail  : " + trail);
    }
}
```

**Output:**

```text
Next in: Rider-11
Entered: Rider-11
Waiting: [Rider-12, Rider-13]
Back to: Vikhroli
Trail  : [Ghatkopar, Andheri]
```

As a queue, `offer` adds at the tail and `poll` takes from the head. As a stack, `push` and `pop` both work at the head, so the last station visited comes out first.

### Inserting while walking with ListIterator

```java
import java.util.LinkedList;
import java.util.ListIterator;

public class NewStation {
    public static void main(String[] args) {
        LinkedList<String> line = new LinkedList<>();
        line.add("Vashi");
        line.add("Sanpada");
        line.add("Nerul");
        line.add("Belapur");

        ListIterator<String> it = line.listIterator();
        while (it.hasNext()) {
            String stop = it.next();
            if (stop.equals("Sanpada")) {
                it.add("Juinagar");
            }
            if (stop.equals("Belapur")) {
                it.remove();
            }
        }
        System.out.println(line);
    }
}
```

**Output:**

```text
[Vashi, Sanpada, Juinagar, Nerul]
```

The iterator already stands on the right node, so `add` and `remove` only rewire neighbouring links. This is the case where a `LinkedList` truly earns its O(1) insert.

## LinkedList vs ArrayList

| Point | ArrayList | LinkedList |
|---|---|---|
| Inside | Resizable array | Doubly linked nodes |
| get(i) | O(1) | O(n), walks nodes |
| Add at end | O(1) amortized | O(1) |
| Add or remove at front | O(n), shifts items | O(1) |
| Insert in middle | O(n), shifts items | O(1) once there, O(n) to reach |
| Memory per item | Low | Higher, two links each |
| Interfaces | List, RandomAccess | List, Deque |
| Best for | Reading by index | Adding at both ends |

In most programs `ArrayList` is still the better default, because its items sit side by side in memory and the CPU reads them fast. For a pure queue or stack, `ArrayDeque` is usually quicker than `LinkedList` too. Choose `LinkedList` when you need a `List` and a `Deque` in one object, or when you insert through an iterator.

## Common Mistakes

> **Warning:** Never loop over a `LinkedList` with `for (int i = 0; i < n; i++)` and `get(i)`. Each call walks the chain again, so the loop becomes O(n²). Use a for-each loop or an iterator.

- **Assuming middle inserts are free.** `add(index, item)` still walks to the index. Only an iterator that is already there makes it O(1).
- **Mixing up the ends.** `push` and `pop` work at the head, while `offer` adds at the tail. Pick one style and stick to it.
- **Calling `getFirst()` on an empty list.** It throws `NoSuchElementException`. Use `peekFirst()` if the list may be empty.
- **Choosing it to save memory.** Each element costs a whole node with two extra links, so it uses more memory than an `ArrayList`.

## Interview Questions

**How is a LinkedList stored inside Java?**
It is a chain of private `Node` objects, each with `prev`, `item` and `next` fields. The list keeps references to the first and last node and a size counter. There is no array and no capacity.

**Why is get(i) slow in a LinkedList?**
There is no index to jump to, so Java must follow links from one end. It starts from whichever end is closer, which halves the walk, but the cost is still O(n).

**Which interfaces does LinkedList implement, and why does it matter?**
It implements `List` and `Deque`, which extends `Queue`. So one object can be read by index, used as a FIFO queue with `offer` and `poll`, or used as a stack with `push` and `pop`.

**When would you choose LinkedList over ArrayList?**
When most work happens at the two ends, or when you insert and remove through a `ListIterator` while walking. For random reads by index, or for general storage, `ArrayList` is faster.

**Does LinkedList allow null values and duplicates?**
Yes to both, just like `ArrayList`. It also keeps insertion order. Note that `poll` returns `null` for an empty queue, so a stored `null` can be confusing in queue code.

## Summary

- `LinkedList` stores each element in a node that links to its previous and next node.
- The list tracks only `first`, `last` and `size`, and has no capacity to grow.
- Adding or removing at either end is O(1), while `get(i)` walks the chain in O(n).
- It implements both `List` and `Deque`, so it works as a list, queue or stack.
- Iterators make middle inserts O(1) once you stand on the right node.
- `ArrayList` remains the better default for reading by index and saving memory.

## Related Topics

- [ArrayList](/learning/java-tutorial/arraylist): the array-backed list compared in the table.
- [List](/learning/java-tutorial/list): the interface both list classes share.
- [Iterator](/learning/java-tutorial/iterator): the right way to walk and edit a linked chain.
