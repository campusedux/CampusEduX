At an airport gate, the same list of passengers gets sorted again and again. The check-in desk wants it alphabetical by name. The gate agent wants priority groups first, then the back rows before the front. The lounge wants frequent flyers with the most miles on top. The passengers never change, only the rule does. In Java, each of those rules is a `Comparator`.

Here you will learn how to write a `Comparator` as a lambda, how to build one from ready-made pieces like `comparing`, `thenComparing` and `reversed`, how Java runs a chained comparator, and how to sort data that contains `null`. By the end you will be able to sort one list many ways without touching the class being sorted.

## What is Comparator?

> **Definition:** `Comparator<T>` is a functional interface in `java.util` with one abstract method, `compare(T a, T b)`. It describes an ordering from outside the class, so you can pass different orders to the same sort method.

A few points to remember:

- `compare(a, b)` follows the same sign rules as `compareTo`: negative puts `a` first, zero means a tie, positive puts `b` first.
- It is a separate object. The class being sorted does not implement it and needs no changes.
- Because it has a single abstract method, you can write it as a lambda or a method reference.
- Since Java 8 it carries many default and static helper methods for building orders.

## Why is Comparator used?

`Comparable` gives a class exactly one natural order, written inside the class. Real programs often need more than that.

- **Many views of one list.** A boarding app shows passengers by name, by seat row and by group, all from one `List`.
- **Classes you cannot edit.** You cannot change `String` or a class from a library, but you can still sort it your way, for example by length.
- **Orders that are not "natural".** Descending order, case-insensitive order or "longest first" do not belong inside the class.
- **Missing values.** Helpers like `nullsLast` let you sort fields that may be `null` without crashing.

Methods like `list.sort(cmp)`, `Collections.sort(list, cmp)`, `new TreeSet<>(cmp)`, `new PriorityQueue<>(cmp)` and a stream's `sorted(cmp)` all accept a `Comparator`.

## Real-Life Example

Think of a stack of printed boarding passes and a set of small rule cards kept in the gate agent's drawer. One card says "sort by surname". Another says "group 1 first, then back rows first". A third says "most loyalty miles first, non-members at the end".

The boarding passes do not carry any of these rules. The agent picks a card, shuffles the stack by it, and puts the card back. Tomorrow a new card can be written without reprinting a single pass.

Map it back to Java: the boarding passes are your objects, each rule card is a `Comparator`, picking a card is passing it to `sort`, and writing a new card is creating a new lambda. The class stays untouched.

## Syntax

```java
// 1. A lambda
Comparator<Passenger> byRow =
    (a, b) -> Integer.compare(a.getRow(), b.getRow());

// 2. Built from a key
Comparator<Passenger> byName =
    Comparator.comparing(Passenger::getName);

// 3. Chained and flipped
Comparator<Passenger> gate = Comparator
    .comparingInt(Passenger::getGroup)
    .thenComparing(Passenger::getName)
    .reversed();

list.sort(gate);
```

- The lambda form spells out `compare` directly. It gets two passengers and returns a signed `int`.
- `Comparator.comparing` takes a key extractor, such as a getter, and compares the keys by their natural order.
- `comparingInt` does the same for `int` keys without boxing them into `Integer`.
- `thenComparing` adds a tie-breaker that is used only when the earlier keys are equal.
- `reversed()` flips the whole comparator built so far.
- `list.sort(gate)` sorts the list in place using that rule.

## How Comparator Works

Each helper method returns a new small `Comparator` that wraps the previous one. Here is what happens inside a chained comparator when the sort compares two passengers.

```text
boarding.compare(a, b)
        |
        v
by group: compare(a.g, b.g)
        |
   not 0? --yes--> return it
        | no (same group)
        v
by row: compare(b.row, a.row)
        |
   not 0? --yes--> return it
        | no (same row)
        v
by name: compare names
        |
        v
     return it
```

`comparingInt` with the group getter builds a comparator that calls the getter on both objects and compares the two numbers. `thenComparing` wraps it: it runs the first comparator and only asks the next one when the answer is zero. So a chain behaves like a series of tie-breakers, checked from left to right, and it stops at the first difference.

`reversed()` does not re-sort anything. It returns a comparator that calls the original with its two arguments swapped, `compare(b, a)`, which flips every sign. `Comparator.reverseOrder()` is the same trick applied to natural order. `nullsFirst` and `nullsLast` wrap another comparator with a quick check: if either value is `null`, they decide the order themselves, and only real values reach the inner comparator.

The sort algorithm never knows how the rule was built. It just calls `compare` and reads the sign.

## Example Programs

### One flight list, sorted two ways

```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

class Passenger {
    private final String name;
    private final int group;
    private final int row;

    Passenger(String name, int group, int row) {
        this.name = name;
        this.group = group;
        this.row = row;
    }

    String getName() { return name; }
    int getGroup() { return group; }
    int getRow() { return row; }

    @Override
    public String toString() {
        return name + " G" + group + " R" + row;
    }
}

public class BoardingGate {
    static void show(String title, List<Passenger> list) {
        System.out.println(title);
        for (Passenger p : list) {
            System.out.println("  " + p);
        }
    }

    public static void main(String[] args) {
        List<Passenger> flight = new ArrayList<>();
        flight.add(new Passenger("Oksana", 3, 12));
        flight.add(new Passenger("Dev", 1, 4));
        flight.add(new Passenger("Mariam", 3, 27));
        flight.add(new Passenger("Chen", 2, 19));
        flight.add(new Passenger("Aarav", 3, 27));

        flight.sort(Comparator.comparing(Passenger::getName));
        show("Check-in desk:", flight);

        Comparator<Passenger> boarding = Comparator
                .comparingInt(Passenger::getGroup)
                .thenComparing(Passenger::getRow,
                        Comparator.reverseOrder())
                .thenComparing(Passenger::getName);
        flight.sort(boarding);
        show("Boarding order:", flight);
    }
}
```

**Output:**

```text
Check-in desk:
  Aarav G3 R27
  Chen G2 R19
  Dev G1 R4
  Mariam G3 R27
  Oksana G3 R12
Boarding order:
  Dev G1 R4
  Chen G2 R19
  Aarav G3 R27
  Mariam G3 R27
  Oksana G3 R12
```

The `Passenger` class has no ordering code at all. The second sort puts group 3 in back-to-front row order, and Aarav beats Mariam only because they share row 27 and the name breaks the tie.

### Sorting Strings you cannot edit

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

public class DestinationBoard {
    static void show(String title, List<String> list) {
        System.out.println(title);
        System.out.println("  " + String.join(" ", list));
    }

    public static void main(String[] args) {
        List<String> cities = new ArrayList<>(Arrays.asList(
                "Oslo", "doha", "Lima", "Nairobi", "baku"));

        cities.sort(null);
        show("Natural (capitals first):", cities);

        cities.sort(String.CASE_INSENSITIVE_ORDER);
        show("Ignoring case:", cities);

        cities.sort(Comparator.comparingInt(String::length)
                .thenComparing(String.CASE_INSENSITIVE_ORDER));
        show("Short names first:", cities);

        cities.sort((x, y) ->
                Integer.compare(y.length(), x.length()));
        show("Longest first (lambda):", cities);
    }
}
```

**Output:**

```text
Natural (capitals first):
  Lima Nairobi Oslo baku doha
Ignoring case:
  baku doha Lima Nairobi Oslo
Short names first:
  baku doha Lima Oslo Nairobi
Longest first (lambda):
  Nairobi baku doha Lima Oslo
```

Passing `null` means natural order, where capital letters come before small ones. The other three orders come from comparators, even though `String` is a final class you can never change. The lambda swaps `x` and `y` to sort in descending order. The four-letter names keep their earlier order because the sort is stable.

### Handling null loyalty miles

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

class Traveller {
    private final String name;
    private final Integer miles;   // null = not a member

    Traveller(String name, Integer miles) {
        this.name = name;
        this.miles = miles;
    }

    String getName() { return name; }
    Integer getMiles() { return miles; }
}

public class LoungeQueue {
    public static void main(String[] args) {
        List<Traveller> queue = new ArrayList<>(Arrays.asList(
                new Traveller("Ifeoma", 48000),
                new Traveller("Rohit", null),
                new Traveller("Sven", 91500),
                new Traveller("Hana", 12300)));

        try {
            queue.sort(Comparator.comparing(Traveller::getMiles));
        } catch (NullPointerException e) {
            System.out.println("Plain sort failed: NPE");
        }

        Comparator<Traveller> byMiles = Comparator.comparing(
                Traveller::getMiles,
                Comparator.nullsLast(Comparator.reverseOrder()));
        queue.sort(byMiles);

        for (Traveller t : queue) {
            Object shown = t.getMiles() == null
                    ? "no card" : t.getMiles();
            System.out.println(t.getName() + ": " + shown);
        }
    }
}
```

**Output:**

```text
Plain sort failed: NPE
Sven: 91500
Ifeoma: 48000
Hana: 12300
Rohit: no card
```

The plain comparator tried to call `compareTo` on a `null` value and failed. Wrapping the key comparator in `nullsLast` sends the non-member to the end, while `reverseOrder` puts the highest miles first.

## Comparator Building Blocks

| Method | What it gives you |
|---|---|
| `comparing(key)` | Order by a key's natural order |
| `comparingInt(key)` | Same, for `int` keys, no boxing |
| `thenComparing(...)` | A tie-breaker for equal keys |
| `reversed()` | The whole chain flipped |
| `reverseOrder()` | Natural order, descending |
| `nullsFirst(cmp)` | `null` values placed first |
| `nullsLast(cmp)` | `null` values placed last |

## Common Mistakes

> **Common mistake:** Calling `reversed()` at the end of a chain flips every key, not just the last one. To reverse only one key, pass `Comparator.reverseOrder()` as the second argument of that `thenComparing` call, as the boarding example does.

- **Losing the type in a lambda.** `comparing(p -> p.getName()).reversed()` may not compile, because Java cannot infer that `p` is a `Passenger`. Use a method reference or write `(Passenger p) -> ...`.
- **Subtracting in a lambda.** `(a, b) -> a.getRow() - b.getRow()` can overflow for large values. Use `Integer.compare`.
- **Forgetting nulls.** `comparing` calls `compareTo` on the key, so a `null` key throws `NullPointerException`. Wrap with `nullsFirst` or `nullsLast`.
- **Loose comparators in a TreeSet.** A `TreeSet` built with a comparator treats a zero result as a duplicate. Add tie-breakers if different objects can share a key.

## Interview Questions

**How is Comparator different from Comparable?**
`Comparable` is implemented by the class itself and gives it one natural order through `compareTo`. `Comparator` is a separate object with `compare(a, b)`, so you can create many orders and use them for classes you cannot modify.

**Why can a Comparator be written as a lambda even though it declares equals as well?**
A functional interface must have exactly one abstract method. `equals` is already provided by `Object`, so it does not count, and `compare` is the only abstract method left. Everything else in the interface is a default or static method.

**How does thenComparing work?**
It returns a new comparator that first runs the existing one. If that result is not zero, it returns it at once. Only when the earlier keys are equal does it run the next comparator as a tie-breaker.

**What does reversed() do internally?**
It returns a comparator that calls the original with its arguments swapped, so `compare(a, b)` becomes `compare(b, a)`. Every sign flips, which reverses the whole order built so far.

**How do you sort a list whose key field may be null?**
Wrap the key comparator with `Comparator.nullsFirst` or `Comparator.nullsLast`. The wrapper decides the order whenever a `null` appears and passes only non-null values to the inner comparator, so no `NullPointerException` is thrown.

## Summary

- A `Comparator` defines an order outside the class through `compare(a, b)`.
- It is a functional interface, so lambdas and method references work.
- `comparing` and `comparingInt` build a comparator from a key getter.
- `thenComparing` adds tie-breakers, checked only when earlier keys are equal.
- `reversed()` flips the entire chain; `reverseOrder()` flips one key.
- `nullsFirst` and `nullsLast` make sorting safe when values are missing.

## Related Topics

- [Comparable](/learning/java-tutorial/comparable): the single natural order written inside a class.
- [Lambda Expressions](/learning/java-tutorial/lambda-expressions): the short syntax used for most comparators.
- [Method References](/learning/java-tutorial/method-references): the `Class::getter` form that `comparing` accepts.
- [Stream API](/learning/java-tutorial/stream-api): `sorted(cmp)` applies the same comparators to streams.
