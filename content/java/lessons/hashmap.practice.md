Try each problem on your own first, then compare with the solution.

### Easy: Ticket Tally by Destination

A station kiosk sold these tickets today: Pune, Agra, Pune, Goa, Pune, Agra. Count how many tickets went to each town with a `HashMap`, then print the counts for Pune, Agra and Goa in that order.

Expected output:

```text
Pune: 3
Agra: 2
Goa: 1
```

> **Hint:** For each ticket, call `merge(town, 1, Integer::sum)`. It adds 1 to the old count, or stores 1 when the town is new.

**Answer:** The town is the key and its count is the value. `merge` handles both the first sighting and every repeat in one call.

```java
import java.util.HashMap;
import java.util.Map;

public class TicketTally {
    public static void main(String[] args) {
        String[] sold = {"Pune", "Agra", "Pune",
                         "Goa", "Pune", "Agra"};
        Map<String, Integer> count = new HashMap<>();
        for (String town : sold) {
            count.merge(town, 1, Integer::sum);
        }
        String[] report = {"Pune", "Agra", "Goa"};
        for (String town : report) {
            System.out.println(town + ": " + count.get(town));
        }
    }
}
```

**Output:**

```text
Pune: 3
Agra: 2
Goa: 1
```

### Medium: Two Parcels for One Trolley

The parcel office has parcels weighing 12, 7, 31, 19 and 25 kg, in that order. A trolley must carry exactly 50 kg in two parcels. Find the positions (0-based) of the first pair that adds up to 50 in a single pass, and print their weights too. If no pair exists, print `No pair`.

Expected output:

```text
Parcels 2 and 3
31 kg + 19 kg = 50 kg
```

> **Hint:** Walk the array once. For each weight, ask the map whether `50 - weight` has been seen, and store each weight with its position as you go.

**Answer:** The map remembers every weight already passed, so each check is O(1) and the whole search is O(n) instead of O(n²) with two nested loops.

```java
import java.util.HashMap;
import java.util.Map;

public class TrolleyPair {
    public static void main(String[] args) {
        int[] weights = {12, 7, 31, 19, 25};
        int target = 50;
        Map<Integer, Integer> seenAt = new HashMap<>();

        for (int i = 0; i < weights.length; i++) {
            int need = target - weights[i];
            if (seenAt.containsKey(need)) {
                int j = seenAt.get(need);
                System.out.println("Parcels " + j + " and " + i);
                System.out.println(weights[j] + " kg + "
                        + weights[i] + " kg = " + target + " kg");
                return;
            }
            seenAt.put(weights[i], i);
        }
        System.out.println("No pair");
    }
}
```

**Output:**

```text
Parcels 2 and 3
31 kg + 19 kg = 50 kg
```
