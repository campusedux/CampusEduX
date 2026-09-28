Try each problem on your own first, then compare with the solution.

### Easy: Happy Customer Count

A delivery rider received these ratings this week: 5, 3, 4, 2, 5, 4, 1. Using streams, print how many ratings were 4 or above, and the average of all ratings to one decimal place.

Expected output:

```text
Good ratings: 4
Average: 3.4
```

> **Hint:** Use `filter` and `count` for the first line. For the second, `mapToInt` gives an `IntStream` whose `average()` returns an `OptionalDouble`.

**Answer:** Each question is its own short pipeline over the same list. `count` and `average` are terminal operations, so each pipeline runs once and ends.

```java
import java.util.Arrays;
import java.util.List;

public class RiderRatings {
    public static void main(String[] args) {
        List<Integer> ratings = Arrays.asList(5, 3, 4, 2, 5, 4, 1);

        long good = ratings.stream()
                .filter(r -> r >= 4)
                .count();
        double avg = ratings.stream()
                .mapToInt(r -> r)
                .average()
                .orElse(0);

        System.out.println("Good ratings: " + good);
        System.out.printf("Average: %.1f%n", avg);
    }
}
```

**Output:**

```text
Good ratings: 4
Average: 3.4
```

### Medium: Top Three Dishes

Today's orders were: Dosa, Biryani, Dosa, Pizza, Biryani, Dosa, Momos, Pizza, Biryani, Momos, Dosa. Using streams, find the three most ordered dishes. Sort by count from high to low, and break ties by name in alphabetical order. Print each as `dish x count`.

Expected output:

```text
Dosa x 4
Biryani x 3
Momos x 2
```

> **Hint:** First build a `Map<String, Long>` with `groupingBy(d -> d, counting())`. Then stream its `entrySet()`, sort with a comparator, and `limit(3)`.

**Answer:** Grouping turns the order list into counts. A second stream over the map entries sorts them by count and then by name, so the tie between Momos and Pizza goes to Momos.

```java
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.counting;
import static java.util.stream.Collectors.groupingBy;

public class TopDishes {
    public static void main(String[] args) {
        List<String> orders = Arrays.asList("Dosa", "Biryani",
                "Dosa", "Pizza", "Biryani", "Dosa", "Momos",
                "Pizza", "Biryani", "Momos", "Dosa");

        Map<String, Long> counts = orders.stream()
                .collect(groupingBy(d -> d, counting()));

        counts.entrySet().stream()
                .sorted((a, b) -> {
                    int byCount = Long.compare(b.getValue(),
                            a.getValue());
                    return byCount != 0 ? byCount
                            : a.getKey().compareTo(b.getKey());
                })
                .limit(3)
                .forEach(e -> System.out.println(
                        e.getKey() + " x " + e.getValue()));
    }
}
```

**Output:**

```text
Dosa x 4
Biryani x 3
Momos x 2
```
