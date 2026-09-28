Walk up to a railway reservation counter and give the clerk your PNR number. She does not read the whole chart from the first passenger to the last. She types the number and your seat appears at once. That jump from a key straight to its data is exactly what a `HashMap` gives your Java programs.

In this guide you will see what a `HashMap` is, how it decides where each entry lives, what happens when two keys land in the same place, and why `equals()` and `hashCode()` must always agree. By the end you will be able to explain its inner working in an interview without notes.

## What is HashMap?

> **Definition:** `HashMap` is a class in `java.util` that stores data as key-value pairs. Each key is unique, and the map uses the key's hash code to find its value in constant time on average.

A few facts to keep in mind from the start:

- It implements the `Map` interface, so it is not a `Collection` itself.
- Keys are unique. Putting the same key again replaces the old value.
- It allows one `null` key and any number of `null` values.
- It keeps no promise about order. Entries may come out in a different order than you put them in.
- It is not synchronized, so two threads writing at the same time can corrupt it.

## Why is HashMap used?

Imagine keeping 50,000 train bookings in an `ArrayList`. To find one passenger, you would compare entries one by one. On a long train that is slow, and it gets slower as the list grows.

A `HashMap` avoids that search. It turns the key into a number, uses the number to pick a slot, and looks only in that slot. So `get`, `put` and `remove` usually take the same short time whether the map holds ten entries or ten million.

That makes it the first choice for lookups by ID, caches, counting how often something occurs, grouping records, and any job where you ask "what belongs to this key?"

## Real-Life Example

Think of the parcel office at a big station. It has 16 numbered shelves. When a parcel arrives, the clerk adds up the digits of its tracking code and uses the result to choose a shelf. Later, when you come to collect it, she does the same sum on your receipt and walks straight to that shelf.

Sometimes two parcels get the same shelf number. They simply sit side by side, and the clerk checks the labels on that one shelf. When the office gets crowded, the station builds a bigger room with 32 shelves and moves every parcel to its new place.

Map it back to Java: the tracking code is the key, the digit sum is `hashCode()`, a shelf is a bucket, checking labels is `equals()`, and the bigger room is a resize.

## Syntax

```java
Map<KeyType, ValueType> name = new HashMap<>();

name.put(key, value);          // add or replace
ValueType v = name.get(key);   // null if absent
name.getOrDefault(key, other); // safe read
name.containsKey(key);         // true or false
name.remove(key);              // delete the pair
```

- `Map<KeyType, ValueType>` declares the variable using the interface, so you can swap the class later.
- `new HashMap<>()` creates an empty map with 16 buckets and a load factor of 0.75.
- `put` stores the pair. If the key already exists, it returns the old value and overwrites it.
- `get` returns the value for a key, or `null` when the key is missing.
- `getOrDefault` returns your fallback instead of `null`.
- `containsKey` and `remove` check for a key and delete a pair.

## How HashMap Works

Inside, a `HashMap` holds an array of buckets called the table. Here is the path of a single `put` call on a new map with 16 buckets.

```text
put("Pune", 4)
      |
      v
"Pune".hashCode()
= 2499228
      |
      v
spread: h ^ (h >>> 16)
= 2499258
      |
      v
index = hash & (16 - 1)
= 10
      |
      v
bucket[10] -> [Pune=4]
```

First Java calls `hashCode()` on the key. It then mixes the high bits into the low bits so that keys with similar codes still spread out. Because the table size is always a power of two, `hash & (n - 1)` gives the bucket index quickly without division. The pair is stored as a node in that bucket.

Here is what happens when two keys want the same bucket.

```text
bucket[10] -> [Pune=4]
                  |
                  v
              [Agra=2]

8+ nodes in one bucket and
64+ buckets: list -> tree
```

"Pune" and "Agra" both land in bucket 10. This is called a collision. Java links the second node after the first, so the bucket becomes a small linked list. On `get`, it walks that list and uses `equals()` to find the right key. If one bucket grows to 8 nodes and the table has at least 64 buckets, the list is turned into a red-black tree, so a bad bucket costs O(log n) instead of O(n). A smaller table is resized instead.

The **load factor** of 0.75 controls resizing. With 16 buckets, the threshold is 16 × 0.75 = 12. When the 13th entry arrives, the table doubles to 32 and every entry is **rehashed** into its new bucket. Resizing is costly, so if you know you will store about 1,000 entries, pass a starting capacity to the constructor.

## Example Programs

### Booking seats on a train

```java
import java.util.HashMap;
import java.util.Map;

public class SeatChart {
    public static void main(String[] args) {
        Map<String, String> seats = new HashMap<>();
        seats.put("S1", "Meera");
        seats.put("S2", "Kabir");
        seats.put("S7", "Farhan");

        System.out.println("S2 -> " + seats.get("S2"));

        String old = seats.put("S7", "Tanvi");
        System.out.println("S7 was " + old);
        System.out.println("S7 now " + seats.get("S7"));

        seats.remove("S1");
        System.out.println("Has S1? " + seats.containsKey("S1"));
        System.out.println("S9 -> "
                + seats.getOrDefault("S9", "empty"));
        System.out.println("Booked: " + seats.size());
    }
}
```

**Output:**

```text
S2 -> Kabir
S7 was Farhan
S7 now Tanvi
Has S1? false
S9 -> empty
Booked: 2
```

Putting "S7" twice did not create a second entry. The new passenger replaced the old one, and `put` handed back the name it removed.

### Peeking at bucket numbers

```java
public class BucketPeek {
    static int bucketFor(String key, int buckets) {
        int h = key.hashCode();
        int spread = h ^ (h >>> 16);
        return spread & (buckets - 1);
    }

    public static void main(String[] args) {
        String[] stations = {"Pune", "Agra", "Goa", "Delhi"};
        for (String s : stations) {
            System.out.println(s + " -> bucket "
                    + bucketFor(s, 16));
        }
        System.out.println("After resize to 32:");
        for (String s : stations) {
            System.out.println(s + " -> bucket "
                    + bucketFor(s, 32));
        }
    }
}
```

**Output:**

```text
Pune -> bucket 10
Agra -> bucket 10
Goa -> bucket 8
Delhi -> bucket 1
After resize to 32:
Pune -> bucket 26
Agra -> bucket 10
Goa -> bucket 24
Delhi -> bucket 1
```

This program repeats the same arithmetic `HashMap` uses. "Pune" and "Agra" collide at 16 buckets. After doubling, each key either stays put or moves up by exactly 16: "Pune" goes to 26 and "Goa" to 24. That split is what rehashing does.

### Why equals and hashCode must agree

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class BerthLookup {
    static class RawBerth {
        String coach; int no;
        RawBerth(String c, int n) { coach = c; no = n; }
    }

    static class Berth {
        String coach; int no;
        Berth(String c, int n) { coach = c; no = n; }

        @Override
        public boolean equals(Object o) {
            if (!(o instanceof Berth)) return false;
            Berth b = (Berth) o;
            return no == b.no && coach.equals(b.coach);
        }

        @Override
        public int hashCode() {
            return Objects.hash(coach, no);
        }
    }

    public static void main(String[] args) {
        Map<RawBerth, String> raw = new HashMap<>();
        raw.put(new RawBerth("B2", 14), "Irfan");
        System.out.println("Raw: "
                + raw.get(new RawBerth("B2", 14)));

        Map<Berth, String> fixed = new HashMap<>();
        fixed.put(new Berth("B2", 14), "Irfan");
        System.out.println("Fixed: "
                + fixed.get(new Berth("B2", 14)));
    }
}
```

**Output:**

```text
Raw: null
Fixed: Irfan
```

`RawBerth` uses the default `hashCode()` from `Object`, so two equal-looking berths go to different buckets and the lookup fails. `Berth` overrides both methods, so the second object finds the first one.

## HashMap vs Hashtable vs TreeMap vs LinkedHashMap

| Feature | HashMap | Hashtable | TreeMap | LinkedHashMap |
|---|---|---|---|---|
| Order | None | None | Sorted by key | Insertion order |
| get / put | O(1) average | O(1) average | O(log n) | O(1) average |
| null key | One allowed | Not allowed | Not allowed | One allowed |
| Thread-safe | No | Yes, slow | No | No |
| Inside | Buckets | Buckets | Red-black tree | Buckets + linked list |

Pick `HashMap` by default, `LinkedHashMap` when order of insertion matters, and `TreeMap` when you need keys sorted. For threads, use `ConcurrentHashMap` rather than the old `Hashtable`.

## Common Mistakes

> **Warning:** Never change a field used in `hashCode()` while the object is a key in a map. The entry stays in its old bucket, and `get` will look in the new one and return `null`.

- **Overriding only `equals()`.** Equal objects must return the same hash code, or lookups fail as in the berth example.
- **Trusting the print order.** `HashMap` order can change after a resize or in a newer Java version. Use `LinkedHashMap` or `TreeMap` when order matters.
- **Reading `get` as "missing".** A `null` result can mean no key, or a key whose value is `null`. Use `containsKey` to tell them apart.
- **Sharing one map across threads.** Concurrent writes can lose entries. Use `ConcurrentHashMap` instead.

## Interview Questions

**How does HashMap find the bucket for a key?**
It calls `hashCode()` on the key and XORs the high 16 bits into the low bits. Then it computes `hash & (n - 1)`, where `n` is the table size, which is always a power of two. The result is the bucket index.

**What happens when two keys land in the same bucket?**
Both nodes are kept in that bucket as a linked list, and `equals()` picks the right one during `get`. Since Java 8, a bucket with 8 or more nodes becomes a red-black tree if the table has at least 64 buckets.

**What is the load factor, and when does a HashMap resize?**
The load factor is how full the table may get before it grows, 0.75 by default. When the size passes capacity × 0.75, the table doubles and every entry is rehashed into its new bucket.

**What is the contract between equals() and hashCode()?**
If two objects are equal by `equals()`, they must return the same `hashCode()`. Unequal objects may share a hash code, which just causes a collision. Breaking the rule makes a map lose track of keys.

**Why is HashMap not thread-safe, and what should you use instead?**
Its methods are not synchronized, so parallel writes can overwrite each other or leave a bucket in a broken state. Use `ConcurrentHashMap`, which locks only small parts of the table and is faster than `Hashtable`.

## Summary

- `HashMap` stores unique keys with values and finds them in O(1) time on average.
- A key's `hashCode()` is spread and masked to choose one of the buckets.
- Collisions form a linked list, which turns into a tree at 8 nodes in a large table.
- At 75% full, the table doubles and every entry is rehashed.
- Keys must override `equals()` and `hashCode()` together and should be immutable.
- There is no order guarantee, one `null` key is allowed, and it is not thread-safe.

## Related Topics

- [HashSet](/learning/java-tutorial/hashset): a set that is backed by a `HashMap` inside.
- [LinkedHashMap](/learning/java-tutorial/linkedhashmap): the same fast lookups with a fixed order.
- [TreeMap](/learning/java-tutorial/treemap): keys kept sorted in a red-black tree.
- [Map](/learning/java-tutorial/map): the interface that all these classes share.
