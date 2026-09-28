Stand near the finish line of a city marathon and watch the results screen. As each runner crosses the mat, a timing chip records their clock, and the screen quietly reshuffles so the fastest name stays on top. Nobody tells the screen how to rank people each time. The rule "lower time wins" is built in. In Java, a class carries a built-in rule like that by implementing `Comparable`.

Here you will learn what `Comparable` is, what its single method must return, how `Collections.sort` and `TreeSet` use it behind the scenes, and the tiny subtraction trick that silently breaks sorting. By the end you will be able to give any class of your own a natural order.

## What is Comparable?

> **Definition:** `Comparable<T>` is an interface in `java.lang` with one method, `compareTo(T other)`. A class that implements it defines its own natural ordering, so Java knows which of two objects comes first.

A few facts to hold on to:

- It is generic. You write `implements Comparable<Finisher>`, so `compareTo` receives a `Finisher`, not a plain `Object`.
- The ordering lives inside the class itself. There is exactly one natural order per class.
- Many JDK classes already implement it: `String`, `Integer`, `Double`, `LocalDate` and `BigDecimal` all know how to sort themselves.
- The return value is an `int` whose sign carries the answer. Its size does not matter.

## Why is Comparable used?

Sorting needs a way to ask "does A come before B?". For numbers and text Java already knows the answer. For your own class, say a marathon finisher with a name, a bib number and a time, Java has no idea. Should it sort by name? By bib? By time?

`Comparable` answers that question once, in the class. After that, every sorting tool in the JDK works on your objects with no extra code:

- `Collections.sort(list)` and `Arrays.sort(array)` order the elements.
- `TreeSet` and `TreeMap` keep elements or keys sorted as you add them.
- `PriorityQueue` hands out the smallest element first.
- `Collections.min` and `Collections.max` find the extremes.

If your class does not implement it, `Collections.sort` will not even compile, and a `TreeSet` throws `ClassCastException` on the first add.

## Real-Life Example

Picture the race officials comparing two timing cards. The rule on their desk says: subtract nothing, guess nothing, just look at the two clocks. If card A shows less time, A ranks higher. If card B shows less, B ranks higher. If both show the same second, they share a place for now.

Every card follows the same desk rule, so the officials can hand a pile of cards to any assistant and get the same ranking back.

Map it back to Java: the desk rule is `compareTo`, a card is an object, "A ranks higher" is a negative result, "B ranks higher" is a positive result, and a shared place is zero. The assistant is `Collections.sort`, which never needs to know what a marathon is.

## Syntax

```java
class Finisher implements Comparable<Finisher> {
    int seconds;

    @Override
    public int compareTo(Finisher other) {
        return Integer.compare(this.seconds,
                               other.seconds);
    }
}
```

- `implements Comparable<Finisher>` promises the class can compare itself with another `Finisher`.
- `compareTo` must be `public` and take exactly one argument of the same type.
- A **negative** result means `this` comes before `other`.
- **Zero** means both hold the same position in the order.
- A **positive** result means `this` comes after `other`.
- `Integer.compare(a, b)` returns -1, 0 or 1 safely, so you never write the comparison logic by hand.

## How Comparable Works

The sort method never looks at your fields. It only calls `compareTo` and reads the sign. Here is the path of one `Collections.sort` call.

```text
Collections.sort(board)
        |
        v
list.sort(null)
        |
        v
TimSort on the elements
        |
        v
a.compareTo(b)  -> int
        |
   +----+-----+
   |    |     |
  <0   ==0   >0
 keep  keep  swap
        |
        v
list is now in order
```

`Collections.sort` passes `null` as the comparator, which means "use the natural order". An `ArrayList` hands its inner array to TimSort, a merge-based algorithm. Other lists copy themselves into an array first and write the sorted result back. Every time TimSort needs to place two elements, it calls `compareTo` on one of them and looks only at the sign. A negative or zero result keeps the pair in place, and a positive one means they swap. Because TimSort is stable, runners with equal times keep their original order.

A `TreeSet` uses the same method differently. When you add an element, it starts at the root of a red-black tree and calls `compareTo` against each node. Negative goes left, positive goes right. Zero means "this element is already here", so the new one is simply dropped. That is why the contract matters.

The contract of `compareTo` has four rules:

- **Opposite signs.** If `a.compareTo(b)` is negative, `b.compareTo(a)` must be positive.
- **Transitive.** If A comes before B and B before C, then A comes before C.
- **Consistent zeros.** If `a.compareTo(b)` is zero, then a and b compare the same way against every other object.
- **Consistent with equals (strongly advised).** `compareTo` returns zero exactly when `equals` returns true. Sorted sets and maps rely on it.

## Example Programs

### Ranking marathon finishers

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class Finisher implements Comparable<Finisher> {
    final String name;
    final int seconds;

    Finisher(String name, int seconds) {
        this.name = name;
        this.seconds = seconds;
    }

    @Override
    public int compareTo(Finisher other) {
        return Integer.compare(seconds, other.seconds);
    }

    String clock() {
        return String.format("%d:%02d:%02d", seconds / 3600,
                seconds / 60 % 60, seconds % 60);
    }
}

public class MarathonResults {
    public static void main(String[] args) {
        List<Finisher> board = new ArrayList<>();
        board.add(new Finisher("Nandini", 11520));
        board.add(new Finisher("Joseph", 9874));
        board.add(new Finisher("Arvind", 10695));
        board.add(new Finisher("Leela", 9310));

        Collections.sort(board);
        int place = 1;
        for (Finisher f : board) {
            System.out.println(place++ + ". " + f.name
                    + " " + f.clock());
        }
        System.out.println("Slowest: "
                + Collections.max(board).name);
    }
}
```

**Output:**

```text
1. Leela 2:35:10
2. Joseph 2:44:34
3. Arvind 2:58:15
4. Nandini 3:12:00
Slowest: Nandini
```

`Collections.sort` and `Collections.max` both worked with no extra arguments, because `Finisher` carries its own natural order by time.

### A tie that TreeSet swallows

```java
import java.util.TreeSet;

class TimeOnly implements Comparable<TimeOnly> {
    final int bib, seconds;
    TimeOnly(int bib, int seconds) {
        this.bib = bib;
        this.seconds = seconds;
    }
    public int compareTo(TimeOnly o) {
        return Integer.compare(seconds, o.seconds);
    }
    public String toString() { return "#" + bib; }
}

class TimeThenBib implements Comparable<TimeThenBib> {
    final int bib, seconds;
    TimeThenBib(int bib, int seconds) {
        this.bib = bib;
        this.seconds = seconds;
    }
    public int compareTo(TimeThenBib o) {
        int byTime = Integer.compare(seconds, o.seconds);
        if (byTime != 0) return byTime;
        return Integer.compare(bib, o.bib);
    }
    public String toString() { return "#" + bib; }
}

public class PhotoFinish {
    public static void main(String[] args) {
        TreeSet<TimeOnly> loose = new TreeSet<>();
        loose.add(new TimeOnly(87, 9874));
        loose.add(new TimeOnly(45, 9310));
        loose.add(new TimeOnly(12, 9874));
        System.out.println("Time only: " + loose);

        TreeSet<TimeThenBib> strict = new TreeSet<>();
        strict.add(new TimeThenBib(87, 9874));
        strict.add(new TimeThenBib(45, 9310));
        strict.add(new TimeThenBib(12, 9874));
        System.out.println("Tie-break: " + strict);
    }
}
```

**Output:**

```text
Time only: [#45, #87]
Tie-break: [#45, #12, #87]
```

Runner 12 finished in the same second as runner 87, so `TimeOnly.compareTo` returned zero and the set treated them as one runner. Adding the bib number as a tie-breaker keeps both.

### The subtraction overflow bug

```java
import java.util.Arrays;

public class ClubPoints {
    static class Risky implements Comparable<Risky> {
        final String club; final int points;
        Risky(String c, int p) { club = c; points = p; }
        public int compareTo(Risky o) {
            return points - o.points;
        }
        public String toString() { return club; }
    }

    static class Safe implements Comparable<Safe> {
        final String club; final int points;
        Safe(String c, int p) { club = c; points = p; }
        public int compareTo(Safe o) {
            return Integer.compare(points, o.points);
        }
        public String toString() { return club; }
    }

    public static void main(String[] args) {
        int high = 2_100_000_000, low = -100_000_000;
        System.out.println("high - low = " + (high - low));

        Risky[] r = { new Risky("Hill", high),
                new Risky("Lake", low) };
        Arrays.sort(r);
        System.out.println("Risky: " + Arrays.toString(r));

        Safe[] s = { new Safe("Hill", high),
                new Safe("Lake", low) };
        Arrays.sort(s);
        System.out.println("Safe:  " + Arrays.toString(s));
    }
}
```

**Output:**

```text
high - low = -2094967296
Risky: [Hill, Lake]
Safe:  [Lake, Hill]
```

The true difference is 2,200,000,000, which does not fit in an `int`, so it wraps round to a negative number. The risky version then claims the higher score comes first. `Integer.compare` never subtracts, so it cannot overflow.

## Comparable vs Comparator

| Feature | Comparable | Comparator |
|---|---|---|
| Package | `java.lang` | `java.util` |
| Method | `compareTo(T o)` | `compare(T a, T b)` |
| Where it lives | Inside the class | Outside the class |
| Orders per class | One natural order | As many as you like |
| Needs source access | Yes | No |
| Used by | `sort(list)`, `TreeSet<>()` | `sort(list, cmp)` |

Use `Comparable` for the one order that feels obvious for the class, like time for a finisher. Use a `Comparator` for every other view, or for classes you cannot edit.

## Common Mistakes

> **Warning:** Never write `return a - b;` inside `compareTo`. It looks neat, but it overflows for large or negative values and quietly produces a wrong order. Use `Integer.compare`, `Long.compare` or `Double.compare`.

- **Ignoring ties in sorted sets.** If two different objects compare as zero, a `TreeSet` or `TreeMap` keeps only one. Add a tie-breaker field.
- **Casting doubles to int.** `(int) (a.pace - b.pace)` turns 0.4 into 0 and calls different paces equal. Use `Double.compare`.
- **Using the raw type.** `implements Comparable` without `<T>` forces `compareTo(Object)` and a cast, and the compiler can no longer catch type errors.
- **Comparing against null.** `compareTo(null)` should throw `NullPointerException`. Do not return a made-up number for it.

## Interview Questions

**What does the int returned by compareTo mean?**
Only the sign matters. A negative value places `this` before the argument, zero means they hold the same position, and a positive value places `this` after it. Callers must not assume the value is exactly -1 or 1.

**What does "consistent with equals" mean for compareTo?**
It means `a.compareTo(b) == 0` is true exactly when `a.equals(b)` is true. It is not forced by the compiler, but `TreeSet` and `TreeMap` use `compareTo` instead of `equals`, so breaking it makes them drop or merge elements. `BigDecimal` is a known exception: 2.0 and 2.00 compare as zero but are not equal.

**Why is subtraction a bad way to implement compareTo?**
Subtracting two `int` values can overflow when they are far apart or have opposite signs. The result wraps to the wrong sign, and the sort breaks without any exception. `Integer.compare` avoids this.

**What happens if you add objects that do not implement Comparable to a TreeSet?**
If no `Comparator` was given, the tree casts each element to `Comparable` to place it. The cast fails, so the first `add` throws `ClassCastException` at run time.

**Can a class have more than one natural order?**
No. A class implements `compareTo` once, so it has one natural order. For extra orders, such as by name or by bib number, you pass a `Comparator` to the sort method instead.

## Summary

- `Comparable<T>` gives a class one natural order through `compareTo`.
- Only the sign of the result matters: negative, zero or positive.
- `Collections.sort`, `Arrays.sort`, `TreeSet`, `TreeMap` and `PriorityQueue` all call it.
- Keep `compareTo` consistent with `equals`, or sorted sets will lose elements.
- Use `Integer.compare` and friends instead of subtraction to avoid overflow.
- Add tie-breaker fields when the main field can repeat.

## Related Topics

- [Comparator](/learning/java-tutorial/comparator): extra sort orders defined outside the class.
- [TreeSet](/learning/java-tutorial/treeset): a sorted set that places every element with `compareTo`.
- [TreeMap](/learning/java-tutorial/treemap): a map that keeps its keys in natural order.
