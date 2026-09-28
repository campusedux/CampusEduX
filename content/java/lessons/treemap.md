The front desk of a busy hotel keeps a register of occupied rooms. Guests arrive in any order, but the night manager always wants the list sorted by room number. She also asks questions like "which is the nearest occupied room below 250?" or "show me every room from the fourth floor up". A plain `HashMap` cannot answer these. A `TreeMap` can, because it keeps its keys sorted at all times.

In this guide you will see what a `TreeMap` is, how its red-black tree keeps keys in order, how `compareTo()` or a `Comparator` decides that order, and how the navigation methods answer "nearest" and "range" questions in O(log n) time.

## What is TreeMap?

> **Definition:** `TreeMap` is a class in `java.util` that stores key-value pairs sorted by key. It is built on a red-black tree, so `get`, `put` and `remove` take O(log n) time.

A few facts to keep in mind:

- It implements `NavigableMap`, which extends `SortedMap` and `Map`.
- Keys are unique and always kept in ascending order, either natural order or the order of a `Comparator` you supply.
- A `null` key is not allowed with natural ordering. `null` values are fine.
- Keys are compared with `compareTo()` or `compare()`, not with `equals()` and `hashCode()`.
- It is not synchronized.

## Why is TreeMap used?

A `HashMap` is faster for plain lookups, but its entries come out in no useful order. If you sort them every time you print a report, you pay O(n log n) again and again.

A `TreeMap` pays a small price on every insert, O(log n) instead of O(1), and in return the data is always sorted. That brings real benefits:

- Reports and menus print in key order with no extra sorting.
- You can ask for the smallest or largest key in O(log n).
- You can find the nearest key at or below a value, which suits price bands, time slots and grade cut-offs.
- You can take a live view of a key range, such as all bookings between two dates.

## Real-Life Example

Think of the hotel's old key cabinet. The hooks are arranged strictly by room number, left to right. When a guest checks in, the clerk does not hang the key on the first empty hook. He finds its correct place between the smaller and the larger numbers, so the cabinet stays in order.

Because the hooks are ordered, the manager can glance at the first hook for the lowest room, the last hook for the highest, or put a finger at 250 and read the nearest keys on either side. She can also take out one whole stretch of hooks, say floor 3 only, without scanning the rest.

Map it back to Java: room numbers are keys, the guest names on the tags are values, keeping the hooks in order is the tree's job, and "nearest hook" and "a stretch of hooks" are `floorKey` and `subMap`.

## Syntax

```java
TreeMap<K, V> name = new TreeMap<>();
TreeMap<K, V> custom = new TreeMap<>(comparator);

name.put(key, value);       // O(log n)
V v = name.get(key);        // O(log n)
K low = name.firstKey();    // smallest key
K atOrBelow = name.floorKey(key);
K atOrAbove = name.ceilingKey(key);
SortedMap<K, V> left = name.headMap(key);
SortedMap<K, V> right = name.tailMap(key);
```

- The first constructor sorts keys by their natural order, so the key class must implement `Comparable`.
- The second takes a `Comparator` that decides the order instead.
- `put` and `get` walk down the tree, so they cost O(log n).
- `firstKey` and `lastKey` return the smallest and largest keys.
- `floorKey` returns the greatest key less than or equal to the given one, and `ceilingKey` the smallest key greater than or equal to it. `lowerKey` and `higherKey` do the same but exclude an exact match.
- `headMap(k)` is a view of keys strictly below `k`, and `tailMap(k)` a view of keys from `k` upward.

## How TreeMap Works

Every entry is a node in a red-black tree. Each node holds a key, a value, links to its left child, right child and parent, and a colour bit. Smaller keys always go to the left, larger keys to the right. Here is the register holding six rooms.

```text
          305(B)
         /      \
     112(B)    410(B)
     /    \        \
 101(R)  208(R)   512(R)
```

Reading the tree from left to right gives 101, 112, 208, 305, 410, 512, which is exactly the order a `TreeMap` prints. Now watch what `put(260, "Rao")` does.

```text
put(260, "Rao")
      |
      v
260 vs 305: smaller -> left
      |
      v
260 vs 112: bigger -> right
      |
      v
260 vs 208: bigger -> right
      |
      v
empty spot: link a red node
      |
      v
recolour or rotate if needed
```

Java compares the new key with the root and moves left or right at each level until it finds an empty spot. If a compare returns 0, the key already exists and only the value is replaced. The new node is coloured red. If that breaks a red-black rule, such as a red parent with a red child, the tree recolours nodes or rotates a small part of itself.

Those rules keep the tree roughly balanced, so its height stays near log n. With a million keys, a search visits only about twenty nodes. Navigation methods use the same walk. `floorKey(250)` goes down the tree and remembers the last key it passed that was not above 250.

## Example Programs

### A sorted room register

```java
import java.util.TreeMap;

public class RoomRegister {
    public static void main(String[] args) {
        TreeMap<Integer, String> rooms = new TreeMap<>();
        rooms.put(410, "Kapoor");
        rooms.put(112, "Iyer");
        rooms.put(305, "Singh");
        rooms.put(208, "Das");
        rooms.put(101, "Bose");

        rooms.forEach((no, guest) ->
                System.out.println(no + " " + guest));
        System.out.println("Lowest : " + rooms.firstKey());
        System.out.println("Highest: " + rooms.lastKey());
        System.out.println("floor 250  : " + rooms.floorKey(250));
        System.out.println("ceiling 250: "
                + rooms.ceilingKey(250));
        System.out.println("higher 305 : "
                + rooms.higherKey(305));
        System.out.println("lower 101  : " + rooms.lowerKey(101));
    }
}
```

**Output:**

```text
101 Bose
112 Iyer
208 Das
305 Singh
410 Kapoor
Lowest : 101
Highest: 410
floor 250  : 208
ceiling 250: 305
higher 305 : 410
lower 101  : null
```

The rooms were added in a jumbled order, yet `forEach` visited them sorted by number. `lowerKey(101)` returns `null` because no room number is below 101.

### Check-ins by time of day

```java
import java.util.Map;
import java.util.TreeMap;

public class CheckInLog {
    public static void main(String[] args) {
        TreeMap<String, String> log = new TreeMap<>();
        log.put("14:05", "Nair");
        log.put("09:30", "Khan");
        log.put("19:45", "Roy");
        log.put("11:10", "Pai");
        log.put("16:20", "Gill");

        System.out.println("Morning: " + log.headMap("12:00"));
        System.out.println("Evening: " + log.tailMap("18:00"));

        Map.Entry<String, String> last =
                log.floorEntry("15:40");
        System.out.println("Latest by 15:40: "
                + last.getValue() + " at " + last.getKey());

        Map.Entry<String, String> first = log.pollFirstEntry();
        System.out.println("Removed: " + first.getValue());
        System.out.println("Left: " + log.size());
    }
}
```

**Output:**

```text
Morning: {09:30=Khan, 11:10=Pai}
Evening: {19:45=Roy}
Latest by 15:40: Nair at 14:05
Removed: Khan
Left: 4
```

Zero-padded times like "09:30" sort correctly as strings. `headMap` excludes its limit and `tailMap` includes it, and `floorEntry` found the most recent check-in before 15:40.

### Choosing the order with a Comparator

```java
import java.util.Comparator;
import java.util.TreeMap;

public class GuestNights {
    public static void main(String[] args) {
        TreeMap<String, Integer> nights =
                new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        nights.put("mehta", 2);
        nights.put("Arora", 1);
        nights.put("MEHTA", 5);
        System.out.println(nights);

        TreeMap<Integer, String> rates =
                new TreeMap<>(Comparator.reverseOrder());
        rates.put(3500, "Deluxe");
        rates.put(9000, "Suite");
        rates.put(2200, "Standard");
        System.out.println("Order: " + rates.keySet());
        int top = rates.firstKey();
        System.out.println("Top: " + top + " " + rates.get(top));
    }
}
```

**Output:**

```text
{Arora=1, mehta=5}
Order: [9000, 3500, 2200]
Top: 9000 Suite
```

The case-insensitive comparator says "mehta" and "MEHTA" compare as 0, so they are the same key. The value became 5, but the original spelling of the key stayed. The reverse comparator makes `firstKey` return the most expensive rate.

## TreeMap vs HashMap vs LinkedHashMap

| Feature | TreeMap | HashMap | LinkedHashMap |
|---|---|---|---|
| Order | Sorted by key | None | Insertion order |
| get / put | O(log n) | O(1) average | O(1) average |
| null key | Not allowed | One allowed | One allowed |
| Inside | Red-black tree | Buckets | Buckets + linked list |
| Key needs | compareTo or Comparator | hashCode + equals | hashCode + equals |
| Range and nearest | Yes | No | No |

Use `HashMap` for plain lookups, `LinkedHashMap` when you need the order entries arrived in, and `TreeMap` when keys must stay sorted or you need range and nearest-key queries.

## Common Mistakes

> **Warning:** Make `compareTo()` or your `Comparator` consistent with `equals()`. If two different keys compare as 0, the `TreeMap` keeps only one of them and silently replaces its value.

- **Using a key class without an order.** A key that is not `Comparable`, with no `Comparator`, throws `ClassCastException` on the first `put`.
- **Putting a `null` key.** With natural ordering it throws `NullPointerException`.
- **Mixing up the edges.** `headMap(k)` leaves out `k`, while `tailMap(k)` keeps it.
- **Choosing it for speed alone.** If you never need order or ranges, a `HashMap` is faster.

## Interview Questions

**What data structure does TreeMap use internally?**
A red-black tree, which is a self-balancing binary search tree. Each node stores a key, a value, left, right and parent links, and a colour. Balancing keeps the height near log n.

**What is the time complexity of get and put in a TreeMap?**
Both are O(log n), because each walks from the root down to one leaf. `containsKey`, `remove`, `firstKey` and the navigation methods are O(log n) as well.

**How does TreeMap decide whether two keys are equal?**
It uses `compareTo()` or the supplied `Comparator`. If the result is 0, the keys are treated as the same. It never calls `equals()` or `hashCode()` for this.

**What is the difference between floorKey and lowerKey?**
`floorKey(k)` returns the greatest key less than or equal to `k`, so an exact match counts. `lowerKey(k)` returns the greatest key strictly less than `k`. Both return `null` when no such key exists.

**Can a TreeMap have a null key?**
Not with natural ordering, because `compareTo` cannot be called on `null`, so `put` throws `NullPointerException`. A custom `Comparator` that handles `null` can allow it. Values may be `null` either way.

## Summary

- `TreeMap` keeps key-value pairs sorted by key in a red-black tree.
- `get`, `put`, `remove` and navigation all run in O(log n) time.
- Order comes from `compareTo()` or a `Comparator`, which also decides key equality.
- `floorKey`, `ceilingKey`, `lowerKey` and `higherKey` find the nearest keys.
- `headMap`, `tailMap` and `subMap` give live views of a key range.
- No `null` key with natural ordering, and it is not thread-safe.

## Related Topics

- [HashMap](/learning/java-tutorial/hashmap): the faster, unordered map in the table.
- [TreeSet](/learning/java-tutorial/treeset): a sorted set built on a `TreeMap`.
- [Comparator](/learning/java-tutorial/comparator): how to give a `TreeMap` your own order.
- [Map](/learning/java-tutorial/map): the interface all map classes share.
