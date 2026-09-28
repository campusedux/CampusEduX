A pharmacist doing the evening stock check does not care how many strips of paracetamol arrived today. She only wants to know one thing: is it on the shelf or not? If a delivery brings a medicine that is already listed, she does not write it down twice. Java has a collection built for exactly this yes-or-no question, and it is called `HashSet`.

In this guide you will see what a `HashSet` is, how it quietly uses a `HashMap` inside, how it decides that two items are duplicates, and why your own classes must override `equals()` and `hashCode()` before you put them in one.

## What is HashSet?

> **Definition:** `HashSet` is a class in `java.util` that stores unique elements with no fixed order. It is backed by a `HashMap`, so adding, removing and checking for an element take constant time on average.

A few facts to keep in mind:

- It implements the `Set` interface, which extends `Collection`.
- Duplicates are ignored. Adding an element that is already there changes nothing.
- It allows one `null` element.
- It makes no promise about order. Printing it can show items in any sequence.
- It has no index, so there is no `get(i)` method.
- It is not synchronized, so threads that share one set need outside locking.

## Why is HashSet used?

Suppose a pharmacy chain keeps 20,000 medicine codes in an `ArrayList`. To check whether one code is in stock, `contains` compares it with the items one by one. As the list grows, every check gets slower.

A `HashSet` hashes the code, jumps to one bucket and checks only the few items there. The time for `contains` stays roughly the same whether the set holds fifty codes or fifty thousand.

That makes it the natural choice for removing duplicates from data, checking membership, tracking which items you have already seen, and set maths such as "which medicines do both branches stock?"

## Real-Life Example

Think of the pharmacy's wall of small drawers, each labelled with a number. When a new medicine arrives, the pharmacist works out a drawer number from its name and opens that drawer. If a card with the same name is already inside, she throws the new card away. If not, she files it there.

To check stock later, she repeats the same calculation, opens one drawer and reads the few cards in it. She never searches the whole wall.

Map it back to Java: the name is the element, the drawer number comes from `hashCode()`, reading the cards in a drawer is `equals()`, and throwing away the extra card is how a `HashSet` ignores duplicates.

## Syntax

```java
Set<Type> name = new HashSet<>();

boolean added = name.add(item);  // false if present
boolean has = name.contains(item);
boolean gone = name.remove(item);
int count = name.size();
for (Type t : name) { }          // any order
```

- `Set<Type>` declares the variable by its interface, so you can switch to another set later.
- `new HashSet<>()` builds an empty set whose inner map starts with 16 buckets and a load factor of 0.75.
- `add` returns `true` when the item was new and `false` when it was a duplicate.
- `contains` answers the membership question in O(1) on average.
- `remove` returns `true` only if the item was actually there.
- The for-each loop visits every element, but in no promised order.

## How HashSet Works

A `HashSet` does not have its own storage. It holds a private `HashMap` and stores each element as a key. Every key gets the same shared dummy value, a constant object named `PRESENT`.

```text
stock.add("Cetirizine")
        |
        v
map.put("Cetirizine", PRESENT)
        |
        v
hashCode() -> bucket index
        |
        v
bucket has an equal key?
  no  -> store it
         add returns true
  yes -> keep old key
         add returns false
```

When you call `add`, the set simply calls `put` on its map. The map hashes the element, picks a bucket and looks for an equal key there using `equals()`. If none is found, the element is stored and `put` returns `null`, so `add` returns `true`. If an equal key already exists, the map keeps it, `put` returns the old dummy value, and `add` returns `false`.

Everything you know about `HashMap` applies here. Collisions form small chains in a bucket, a long chain in a large table becomes a red-black tree, and when the set passes 75% of its capacity, the table doubles and every element is rehashed.

This design explains the rule for duplicates. Two elements count as the same only when their `hashCode()` values match and `equals()` returns `true`. If your class breaks that contract, the set will happily store two copies of what you think is one item.

## Example Programs

### Tracking medicines on the shelf

```java
import java.util.HashSet;
import java.util.Set;

public class ShelfCheck {
    public static void main(String[] args) {
        Set<String> shelf = new HashSet<>();
        System.out.println(shelf.add("Cetirizine"));
        System.out.println(shelf.add("Ibuprofen"));
        System.out.println(shelf.add("Cetirizine"));

        shelf.add("Amoxicillin");
        System.out.println("Items: " + shelf.size());
        System.out.println("Has Ibuprofen? "
                + shelf.contains("Ibuprofen"));

        shelf.remove("Ibuprofen");
        System.out.println("After sale: "
                + shelf.contains("Ibuprofen"));
        System.out.println("Remove again: "
                + shelf.remove("Ibuprofen"));
    }
}
```

**Output:**

```text
true
true
false
Items: 3
Has Ibuprofen? true
After sale: false
Remove again: false
```

The second `add("Cetirizine")` returned `false` and did not grow the set. The size is 3 because `add` ran four times but saw only three different names.

### A custom class with and without equals and hashCode

```java
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

class LooseBatch {
    String drug; int lot;
    LooseBatch(String d, int l) { drug = d; lot = l; }
}

class Batch {
    String drug; int lot;
    Batch(String d, int l) { drug = d; lot = l; }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Batch)) return false;
        Batch b = (Batch) o;
        return lot == b.lot && drug.equals(b.drug);
    }

    @Override
    public int hashCode() {
        return Objects.hash(drug, lot);
    }
}

public class BatchRegister {
    public static void main(String[] args) {
        Set<LooseBatch> loose = new HashSet<>();
        loose.add(new LooseBatch("Insulin", 4402));
        loose.add(new LooseBatch("Insulin", 4402));
        System.out.println("Loose size: " + loose.size());

        Set<Batch> strict = new HashSet<>();
        strict.add(new Batch("Insulin", 4402));
        strict.add(new Batch("Insulin", 4402));
        System.out.println("Strict size: " + strict.size());
        System.out.println("Found: " + strict.contains(
                new Batch("Insulin", 4402)));
    }
}
```

**Output:**

```text
Loose size: 2
Strict size: 1
Found: true
```

`LooseBatch` uses the `hashCode()` and `equals()` it inherits from `Object`, which treat every new object as different, so the same batch is stored twice. `Batch` compares the drug and lot number, so the second copy is rejected and a fresh object is found.

### Comparing two branches

```java
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

public class BranchStock {
    public static void main(String[] args) {
        Set<String> north = new HashSet<>(Arrays.asList(
                "Zinc", "Aspirin", "Iron", "Folic"));
        Set<String> south = new HashSet<>(Arrays.asList(
                "Iron", "Zinc", "Calcium"));

        Set<String> both = new HashSet<>(north);
        both.retainAll(south);

        Set<String> onlyNorth = new HashSet<>(north);
        onlyNorth.removeAll(south);

        Set<String> all = new HashSet<>(north);
        all.addAll(south);

        System.out.println("Both : " + new TreeSet<>(both));
        System.out.println("North: " + new TreeSet<>(onlyNorth));
        System.out.println("Total: " + all.size());
    }
}
```

**Output:**

```text
Both : [Iron, Zinc]
North: [Aspirin, Folic]
Total: 5
```

`retainAll` keeps the common items, `removeAll` subtracts one set from another, and `addAll` forms the union. Copying into a `TreeSet` just before printing gives a sorted, predictable display.

## HashSet vs LinkedHashSet vs TreeSet

| Feature | HashSet | LinkedHashSet | TreeSet |
|---|---|---|---|
| Order | None | Insertion order | Sorted |
| add / contains | O(1) average | O(1) average | O(log n) |
| null element | One allowed | One allowed | Not allowed |
| Inside | HashMap | LinkedHashMap | TreeMap |
| Duplicate test | hashCode + equals | hashCode + equals | compareTo |
| Best for | Fast lookups | Order you added | Sorted, ranges |

Start with `HashSet`. Switch to `LinkedHashSet` when the display order must match the order items arrived, and to `TreeSet` when you need them sorted or want methods like `first()` and `ceiling()`.

## Common Mistakes

> **Warning:** Do not change a field used by `hashCode()` while the object sits in a `HashSet`. The element stays in its old bucket, so `contains` and `remove` look in the wrong place and fail.

- **Overriding only `equals()`.** Without a matching `hashCode()`, equal objects land in different buckets and both get stored.
- **Relying on print order.** A `HashSet` can show items in any order, and that order can change after a resize.
- **Looking for `get(i)`.** A set has no index. Loop over it, or copy it into a list first.
- **Expecting `add` to replace.** Adding an equal element keeps the old object. Remove it first if you need the new one stored.

## Interview Questions

**How does HashSet work internally?**
It wraps a private `HashMap`. Each element becomes a key, and every key shares one dummy value called `PRESENT`. So `add`, `remove` and `contains` are just calls to the map's `put`, `remove` and `containsKey`.

**How does HashSet decide that two elements are duplicates?**
It first uses `hashCode()` to pick a bucket, then calls `equals()` on the elements in that bucket. Only when both agree is the new element treated as a duplicate and ignored.

**What does add() return for a duplicate element?**
It returns `false` and leaves the set unchanged. This is handy for spotting repeats in one step, because you do not need a separate `contains` call.

**Can a HashSet hold null, and is it ordered?**
It can hold a single `null`. It keeps no order at all. Use `LinkedHashSet` for insertion order or `TreeSet` for sorted order.

**Why must equals() and hashCode() be overridden together for set elements?**
Equal objects must produce equal hash codes. If only `equals()` is overridden, two equal objects usually get different codes, land in different buckets, and the set stores both as if they were different.

## Summary

- `HashSet` stores unique elements with no order and allows one `null`.
- Inside, each element is a key in a `HashMap` with a shared dummy value.
- `add`, `remove` and `contains` run in O(1) time on average.
- Duplicates are judged by `hashCode()` first and `equals()` second.
- Custom element classes must override both methods and should keep those fields unchanged.
- Choose `LinkedHashSet` for insertion order and `TreeSet` for sorted order.

## Related Topics

- [HashMap](/learning/java-tutorial/hashmap): the map that does the real work inside a `HashSet`.
- [LinkedHashSet](/learning/java-tutorial/linkedhashset): a hash set that remembers insertion order.
- [TreeSet](/learning/java-tutorial/treeset): a set that keeps its elements sorted.
- [Set](/learning/java-tutorial/set): the interface every set class shares.
