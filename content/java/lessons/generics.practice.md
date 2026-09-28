Try each problem on your own first, then compare with the solution.

### Easy: A Bin Label Pair

Every storage bin has a code and some content. Write a generic class `Pair<A, B>` with `first()`, `second()` and a `swap()` method that returns a new `Pair<B, A>`. Use it with the bin code "R2-B07" and the quantity 64, print the pair, then print the swapped pair.

Expected output:

```text
(R2-B07, 64)
(64, R2-B07)
Code length: 6
```

> **Hint:** Declare two type parameters on the class. `swap` can simply return `new Pair<>(second, first)`, and Java infers the new types.

**Answer:** Two type parameters let each half keep its own type. Because `first()` returns an `A`, which is `String` here, you can call `length()` on it without a cast.

```java
class Pair<A, B> {
    private final A first;
    private final B second;

    Pair(A first, B second) {
        this.first = first;
        this.second = second;
    }

    A first() { return first; }
    B second() { return second; }

    Pair<B, A> swap() {
        return new Pair<>(second, first);
    }

    @Override
    public String toString() {
        return "(" + first + ", " + second + ")";
    }
}

public class BinLabel {
    public static void main(String[] args) {
        Pair<String, Integer> bin = new Pair<>("R2-B07", 64);
        Pair<Integer, String> flipped = bin.swap();

        System.out.println(bin);
        System.out.println(flipped);
        System.out.println("Code length: "
                + bin.first().length());
    }
}
```

**Output:**

```text
(R2-B07, 64)
(64, R2-B07)
Code length: 6
```

### Medium: Largest Item and a Safe Transfer

Write two generic methods. `largest` takes any list whose elements can be compared with each other and returns the largest element. `transfer` moves every value from a source list into a destination list, and must accept an inbound `List<Integer>` going into a ledger of type `List<Number>`. Test `largest` with the bin codes A-14, C-02, B-31 and with the weights 18, 42, 7. Then transfer the weights into a ledger that already holds 2.5.

Expected output:

```text
Largest code: C-02
Largest weight: 42
Ledger: [2.5, 18, 42, 7]
```

> **Hint:** Use `<T extends Comparable<T>>` for `largest`. For `transfer`, the source produces values (`? extends T`) and the destination consumes them (`? super T`).

**Answer:** The bound lets `largest` call `compareTo` on any `T`. The two wildcards in `transfer` follow PECS, so an `Integer` list can pour into a `Number` list safely.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class InboundDock {
    static <T extends Comparable<T>> T largest(List<T> items) {
        T best = items.get(0);
        for (T item : items) {
            if (item.compareTo(best) > 0) {
                best = item;
            }
        }
        return best;
    }

    static <T> void transfer(List<? extends T> from,
                             List<? super T> to) {
        for (T item : from) {
            to.add(item);
        }
    }

    public static void main(String[] args) {
        List<String> codes = Arrays.asList("A-14", "C-02", "B-31");
        List<Integer> weights = Arrays.asList(18, 42, 7);

        System.out.println("Largest code: " + largest(codes));
        System.out.println("Largest weight: " + largest(weights));

        List<Number> ledger = new ArrayList<>();
        ledger.add(2.5);
        transfer(weights, ledger);
        System.out.println("Ledger: " + ledger);
    }
}
```

**Output:**

```text
Largest code: C-02
Largest weight: 42
Ledger: [2.5, 18, 42, 7]
```
