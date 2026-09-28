Try each problem on your own first, then compare with the solution.

### Easy: Answer-Sheet Bundles

After an exam, invigilators hand in answer-sheet bundles numbered 305, 112, 305, 87, 240 and 112. Some bundles were scanned twice. Print the unique bundle numbers in ascending order, how many there are, and the lowest and highest numbers.

Expected output:

```text
Bundles: [87, 112, 240, 305]
Count: 4
Lowest 87, highest 305
```

> **Hint:** A `TreeSet` drops the repeats and sorts the rest for you. Then `first()` and `last()` give the two ends.

**Answer:** Adding every number to a `TreeSet` removes duplicates and keeps the order in one step, so no separate sort or `contains` check is needed.

```java
import java.util.TreeSet;

public class SheetBundles {
    public static void main(String[] args) {
        int[] scanned = {305, 112, 305, 87, 240, 112};
        TreeSet<Integer> bundles = new TreeSet<>();
        for (int b : scanned) {
            bundles.add(b);
        }
        System.out.println("Bundles: " + bundles);
        System.out.println("Count: " + bundles.size());
        System.out.println("Lowest " + bundles.first()
                + ", highest " + bundles.last());
    }
}
```

**Output:**

```text
Bundles: [87, 112, 240, 305]
Count: 4
Lowest 87, highest 305
```

### Medium: Nearest Free Seat

An exam hall has free seats 2, 3, 5, 6, 8 and 9. Late candidates arrive one by one and ask for seats 5, 5, 5, 1 and 10. Give each one the free seat closest to the number asked for. If two free seats are equally close, give the lower one. A seat, once given, is no longer free. Print each assignment and the seats still free at the end.

Expected output:

```text
Asked 5 -> seat 5
Asked 5 -> seat 6
Asked 5 -> seat 3
Asked 1 -> seat 2
Asked 10 -> seat 9
Still free: [8]
```

> **Hint:** For each request, look at `floor(asked)` and `ceiling(asked)`. Either can be `null`. Pick the closer one, then `remove` it from the set.

**Answer:** Only the two neighbours of the requested number can be the closest free seat, and both are found in O(log n). Removing the chosen seat keeps the set correct for the next candidate.

```java
import java.util.Arrays;
import java.util.TreeSet;

public class NearestSeat {
    static int pick(TreeSet<Integer> free, int asked) {
        Integer below = free.floor(asked);
        Integer above = free.ceiling(asked);
        int chosen;
        if (below == null) {
            chosen = above;
        } else if (above == null) {
            chosen = below;
        } else if (asked - below <= above - asked) {
            chosen = below;
        } else {
            chosen = above;
        }
        free.remove(chosen);
        return chosen;
    }

    public static void main(String[] args) {
        TreeSet<Integer> free = new TreeSet<>(
                Arrays.asList(2, 3, 5, 6, 8, 9));
        int[] requests = {5, 5, 5, 1, 10};
        for (int r : requests) {
            System.out.println("Asked " + r + " -> seat "
                    + pick(free, r));
        }
        System.out.println("Still free: " + free);
    }
}
```

**Output:**

```text
Asked 5 -> seat 5
Asked 5 -> seat 6
Asked 5 -> seat 3
Asked 1 -> seat 2
Asked 10 -> seat 9
Still free: [8]
```
