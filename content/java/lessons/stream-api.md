It is 9 p.m. and a food delivery app has handled three hundred orders today. The manager asks a simple question: "What did we earn from delivered orders over ₹200, sorted from biggest to smallest?" With plain loops you would write a counter, an `if`, a temporary list and a sort call, and the actual question would hide inside all that code.

The Stream API lets you write the question almost as you would say it: take the orders, keep the delivered ones, keep those over 200, pick the amounts, sort them, collect them. Below you will learn how a stream pipeline is built, why nothing runs until the very end, and which mistakes trip up most beginners.

## What is the Stream API?

> **Definition:** The Stream API, in `java.util.stream`, lets you process a sequence of elements through a pipeline of operations. A stream reads from a source such as a list, passes each element through intermediate operations like `filter` and `map`, and produces a result with one terminal operation like `collect` or `sum`.

Keep three facts in mind:

- A stream is not a data structure. It stores nothing; it only carries elements from a source.
- A stream never changes its source. Filtering a stream of orders leaves the original list untouched.
- A stream can be used only once. After the terminal operation it is closed.

## Why is the Stream API used?

Loops tell the computer *how* to do something, step by step. Streams let you describe *what* you want, and the library handles the looping.

- **Readable code.** Each operation has a clear name, so the pipeline reads like a sentence.
- **Fewer bugs.** No index counters, no temporary lists, no forgotten `break`.
- **Easy to change.** Adding one more condition is one more `filter` line.
- **Built-in helpers.** Grouping, counting, summing, averaging and joining text are ready-made collectors.
- **Parallel option.** For large, CPU-heavy jobs, `parallelStream()` can split the work across cores.

Streams also pair naturally with lambda expressions, which is where most of their short, expressive style comes from.

## Real-Life Example

Think of the packing counter in a cloud kitchen. Finished orders arrive on a conveyor belt, one at a time. The first worker removes any order marked "cancelled". The second worker sticks a price label on each box. The last worker at the end of the belt puts the boxes into delivery bags.

Here is the interesting part: the belt does not start moving until someone is standing at the end to receive the boxes. There is no point packing orders that nobody will collect.

In stream terms, the conveyor belt is the stream, the pile of orders is the source, the first two workers are intermediate operations, and the bagging worker is the terminal operation. The belt waiting for someone at the end is called laziness.

## Syntax

```java
import java.util.stream.Collectors;

List<R> result = source.stream()          // source
        .filter(x -> condition)           // intermediate
        .map(x -> newValue)               // intermediate
        .sorted()                         // intermediate
        .collect(Collectors.toList());    // terminal
```

- `Collectors` is a helper class full of ready-made collectors. `Collectors.toList()` works on Java 8 and later.
- `source.stream()` opens a stream on any collection. For arrays, use `Arrays.stream(array)`.
- `filter` keeps only elements for which the condition is `true`.
- `map` turns each element into something else, such as an order into its amount.
- `sorted` puts elements in natural order, or in the order of a `Comparator` you pass in.
- `collect(Collectors.toList())` gathers the survivors into a new `List`. Other terminal operations include `count`, `forEach`, `reduce`, `sum` and `findFirst`.

> **Note:** From Java 16 you can also end a pipeline with `stream.toList()`. It is shorter and returns a list you cannot modify. This page uses `Collectors.toList()` so every example runs on Java 8 and later.

## How the Stream API Works

Every stream follows the same shape: one source, zero or more intermediate operations, and exactly one terminal operation.

```text
orders.stream()     source
      |
      v
.filter(delivered)  lazy
      |
      v
.map(amount)        lazy
      |
      v
.collect(          runs all
  Collectors.toList())
      |
      v
[250, 180, 420]
```

Intermediate operations do not process anything when you call them. Each one just adds a stage to a plan and returns a new stream. Only when the terminal operation is called does data begin to flow. Even then, Java does not filter the whole list first and map it afterwards. It pushes one element through every stage, then the next element, and so on. Because of this, `limit(2)` or `findFirst()` can stop the pipeline early, and the remaining elements are never touched.

There are two kinds of intermediate operations. Stateless ones like `filter` and `map` look at one element at a time. Stateful ones like `sorted` and `distinct` must see every element before they can pass anything on.

## Example Programs

### Totals from delivered orders

```java
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class DeliveryTotals {
    static class Order {
        String dish; int amount; boolean delivered;
        Order(String d, int a, boolean ok) {
            dish = d; amount = a; delivered = ok;
        }
    }

    public static void main(String[] args) {
        List<Order> orders = Arrays.asList(
                new Order("Biryani", 320, true),
                new Order("Dosa", 140, true),
                new Order("Thali", 260, false),
                new Order("Paneer roll", 210, true),
                new Order("Pizza", 450, true));

        List<Integer> big = orders.stream()
                .filter(o -> o.delivered)
                .filter(o -> o.amount > 200)
                .map(o -> o.amount)
                .sorted((a, b) -> b - a)
                .collect(Collectors.toList());
        System.out.println("Big orders: " + big);

        int earned = orders.stream()
                .filter(o -> o.delivered)
                .mapToInt(o -> o.amount)
                .sum();
        System.out.println("Earned: Rs " + earned);
        System.out.println("Orders in list: " + orders.size());
    }
}
```

**Output:**

```text
Big orders: [450, 320, 210]
Earned: Rs 1120
Orders in list: 5
```

Two pipelines read the same list. The cancelled thali was skipped in both, and the original list still holds all five orders, because streams never change their source.

### Watching laziness at work

```java
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class LazyKitchen {
    public static void main(String[] args) {
        List<String> dishes = Arrays.asList(
                "Idli", "Poha", "Upma", "Vada", "Kheer");

        Stream<String> plan = dishes.stream()
                .filter(d -> {
                    System.out.println("check " + d);
                    return !d.equals("Poha");
                });
        System.out.println("Plan ready, nothing ran");

        List<String> firstTwo = plan
                .map(d -> {
                    System.out.println("pack  " + d);
                    return d.toUpperCase();
                })
                .limit(2)
                .collect(Collectors.toList());
        System.out.println(firstTwo);
    }
}
```

**Output:**

```text
Plan ready, nothing ran
check Idli
pack  Idli
check Poha
check Upma
pack  Upma
[IDLI, UPMA]
```

The line "Plan ready" printed before any check, which proves the filter waited for a terminal operation. Each dish went through check and pack before the next one started, and once `limit(2)` had two dishes, "Vada" and "Kheer" were never even looked at.

### Grouping orders by restaurant

```java
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class RestaurantReport {
    static class Order {
        String place; String dish; int amount;
        Order(String p, String d, int a) {
            place = p; dish = d; amount = a;
        }
    }

    public static void main(String[] args) {
        List<Order> orders = Arrays.asList(
                new Order("Spice Hut", "Korma", 280),
                new Order("Dosa Point", "Dosa", 120),
                new Order("Spice Hut", "Naan", 60),
                new Order("Dosa Point", "Vada", 90));

        Map<String, Integer> totals = orders.stream()
                .collect(Collectors.groupingBy(o -> o.place,
                        TreeMap::new,
                        Collectors.summingInt(o -> o.amount)));
        totals.forEach((place, sum) ->
                System.out.println(place + ": Rs " + sum));

        String menu = orders.stream()
                .map(o -> o.dish)
                .distinct()
                .collect(Collectors.joining(", "));
        System.out.println(menu);
    }
}
```

**Output:**

```text
Dosa Point: Rs 210
Spice Hut: Rs 340
Korma, Dosa, Naan, Vada
```

`groupingBy` split the orders by restaurant, and `summingInt` added up each group. Passing `TreeMap::new` kept the restaurant names sorted. `joining` turned a stream of strings into one line.

## Common Mistakes

> **Warning:** A stream can be consumed only once. Calling a second terminal operation on the same stream variable throws `IllegalStateException`. Create a fresh stream from the source each time.

- **Forgetting the terminal operation.** A pipeline with only `filter` and `map` does nothing at all, so side effects inside it never happen.
- **Using `Stream.toList()` on older Java.** It arrived in Java 16. On Java 11, collect with `Collectors.toList()` instead.
- **Changing the source inside the pipeline.** Adding to or removing from the list while streaming it can throw ConcurrentModificationException.
- **Reaching for `parallelStream()` by default.** For small lists, the cost of splitting work is bigger than the gain.
- **Putting heavy logic in `peek` or `forEach`.** Keep lambdas short and free of side effects so the pipeline stays easy to read.

## Interview Questions

**What are the three parts of a stream pipeline?**
A source, such as a collection or an array. Zero or more intermediate operations, such as `filter`, `map` and `sorted`, which return new streams. And one terminal operation, such as `collect`, `count` or `forEach`, which produces the result and closes the stream.

**What does it mean that streams are lazy?**
Intermediate operations only record what to do. No element is processed until a terminal operation starts the pipeline, and then elements flow through one by one, so short-circuit operations like `limit` and `findFirst` can stop early.

**What is the difference between map and flatMap?**
`map` turns each element into exactly one new element. `flatMap` turns each element into a stream and merges all those streams into one, which is useful for flattening a list of lists.

**Can a stream be reused?**
No. Once a terminal operation runs, the stream is closed, and using it again throws `IllegalStateException`. You create a new stream from the source instead.

**How is a stream different from a collection?**
A collection stores elements in memory and can be read many times. A stream stores nothing; it carries elements from a source through operations once and computes results on demand.

## Summary

- A stream is a one-time pipeline over a source; it never stores or changes data.
- The shape is always source, then intermediate operations, then one terminal operation.
- Intermediate operations are lazy and run only when the terminal operation is called.
- Elements travel through all stages one at a time, so `limit` and `findFirst` can stop early.
- Collect results with `Collectors.toList()`, `groupingBy`, `summingInt` and `joining`.
- Use `mapToInt` for number streams with handy methods like `sum` and `average`.

## Related Topics

- [Lambda Expressions](/learning/java-tutorial/lambda-expressions): the short functions you pass to `filter` and `map`.
- [Method References](/learning/java-tutorial/method-references): a shorter way to write many stream lambdas.
- [Optional](/learning/java-tutorial/optional): what `findFirst` and `max` return.
- [Collection Framework](/learning/java-tutorial/collection-framework): the sources most streams start from.
