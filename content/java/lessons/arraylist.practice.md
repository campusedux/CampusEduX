Try each problem on your own first, then compare with the solution.

### Easy: Flip the Display Rack

The bakery rack holds Bun, Rusk, Tart, Puff and Scone, in that order. The baker wants the rack reversed for the evening. Reverse the `ArrayList` in place using only `get` and `set`, without `Collections.reverse`, and print it before and after.

Expected output:

```text
Before:
[Bun, Rusk, Tart, Puff, Scone]
After:
[Scone, Puff, Tart, Rusk, Bun]
```

> **Hint:** Keep one index at the start and one at the end. Swap the two items, then move both indexes toward the middle.

**Answer:** Swapping pairs from both ends needs only `size() / 2` swaps, and each `get` or `set` is O(1), so the whole reverse is O(n) with no extra list.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class FlipRack {
    public static void main(String[] args) {
        List<String> rack = new ArrayList<>(Arrays.asList(
                "Bun", "Rusk", "Tart", "Puff", "Scone"));
        System.out.println("Before:");
        System.out.println(rack);

        int left = 0;
        int right = rack.size() - 1;
        while (left < right) {
            String temp = rack.get(left);
            rack.set(left, rack.get(right));
            rack.set(right, temp);
            left++;
            right--;
        }
        System.out.println("After:");
        System.out.println(rack);
    }
}
```

**Output:**

```text
Before:
[Bun, Rusk, Tart, Puff, Scone]
After:
[Scone, Puff, Tart, Rusk, Bun]
```

### Medium: Merge Morning and Evening Tokens

Order tokens from the morning shift are 3, 8, 15, 21 and from the evening shift are 5, 8, 19, 30, 42. Both lists are already sorted. Merge them into one sorted `ArrayList` in a single pass, keeping duplicates, and print it with its size.

Expected output:

```text
[3, 5, 8, 8, 15, 19, 21, 30, 42]
Tokens: 9
```

> **Hint:** Use two indexes, one per list. Each time, add the smaller of the two current tokens and move that index forward. When one list runs out, copy the rest of the other.

**Answer:** Each token is looked at once, so the merge is O(n + m). Giving the result list its final capacity up front means it never has to grow.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class MergeTokens {
    public static void main(String[] args) {
        List<Integer> morning = Arrays.asList(3, 8, 15, 21);
        List<Integer> evening = Arrays.asList(5, 8, 19, 30, 42);

        List<Integer> all =
                new ArrayList<>(morning.size() + evening.size());
        int i = 0;
        int j = 0;
        while (i < morning.size() && j < evening.size()) {
            if (morning.get(i) <= evening.get(j)) {
                all.add(morning.get(i++));
            } else {
                all.add(evening.get(j++));
            }
        }
        while (i < morning.size()) all.add(morning.get(i++));
        while (j < evening.size()) all.add(evening.get(j++));

        System.out.println(all);
        System.out.println("Tokens: " + all.size());
    }
}
```

**Output:**

```text
[3, 5, 8, 8, 15, 19, 21, 30, 42]
Tokens: 9
```
