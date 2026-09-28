Try each problem on your own first, then compare with the solution.

### Easy: First Repeated Prescription

A pharmacy scanner logged these prescription codes in order: RX71, RX42, RX19, RX42, RX71, RX08. Find the first code that appears a second time, reading from left to right, and print it. If no code repeats, print `No repeats`.

Expected output:

```text
First repeat: RX42
```

> **Hint:** `add` returns `false` when the element is already in the set. The first `false` is your answer.

**Answer:** Walk the codes once and add each one to a `HashSet`. The first failed `add` marks the earliest second sighting, and each check is O(1) on average.

```java
import java.util.HashSet;
import java.util.Set;

public class FirstRepeat {
    public static void main(String[] args) {
        String[] scans = {"RX71", "RX42", "RX19",
                          "RX42", "RX71", "RX08"};
        Set<String> seen = new HashSet<>();
        for (String code : scans) {
            if (!seen.add(code)) {
                System.out.println("First repeat: " + code);
                return;
            }
        }
        System.out.println("No repeats");
    }
}
```

**Output:**

```text
First repeat: RX42
```

### Medium: Longest Run of Batch Numbers

A cold-storage fridge holds vaccine batches numbered 104, 7, 101, 9, 103, 8, 102 and 50, in no order. Find the longest run of consecutive batch numbers, such as 7, 8, 9. Print where the run starts, where it ends and its length. Aim for O(n) time, so do not sort.

Expected output:

```text
Run: 101 to 104
Length: 4
```

> **Hint:** Put every number in a `HashSet`. Only start counting from a number `n` when `n - 1` is not in the set, because that number must be the start of a run.

**Answer:** Each run is counted once, from its smallest number, and every `contains` check is O(1). So the whole search is O(n), while sorting first would cost O(n log n).

```java
import java.util.HashSet;
import java.util.Set;

public class BatchRun {
    public static void main(String[] args) {
        int[] batches = {104, 7, 101, 9, 103, 8, 102, 50};
        Set<Integer> fridge = new HashSet<>();
        for (int b : batches) {
            fridge.add(b);
        }

        int bestStart = 0;
        int bestLen = 0;
        for (int b : batches) {
            if (fridge.contains(b - 1)) {
                continue;
            }
            int len = 1;
            while (fridge.contains(b + len)) {
                len++;
            }
            if (len > bestLen) {
                bestLen = len;
                bestStart = b;
            }
        }
        System.out.println("Run: " + bestStart + " to "
                + (bestStart + bestLen - 1));
        System.out.println("Length: " + bestLen);
    }
}
```

**Output:**

```text
Run: 101 to 104
Length: 4
```
