Try each problem on your own first, then compare with the solution.

### Easy: Late Checkout Fee

A hotel charges a late checkout fee by hour of the day: from hour 0 the fee is 0, from hour 12 it is 500, from hour 15 it is 1200, and from hour 18 it is 2500. Four guests check out at hours 11, 12, 16 and 21. Store the bands in a `TreeMap` and print each guest's fee.

Expected output:

```text
Hour 11 -> fee 0
Hour 12 -> fee 500
Hour 16 -> fee 1200
Hour 21 -> fee 2500
```

> **Hint:** The right band is the greatest starting hour that is less than or equal to the checkout hour. That is exactly what `floorEntry` returns.

**Answer:** Each band's starting hour is a key and its fee is the value. One `floorEntry` call per guest finds the band in O(log n), with no chain of `if` statements.

```java
import java.util.TreeMap;

public class LateCheckout {
    public static void main(String[] args) {
        TreeMap<Integer, Integer> bands = new TreeMap<>();
        bands.put(0, 0);
        bands.put(12, 500);
        bands.put(15, 1200);
        bands.put(18, 2500);

        int[] hours = {11, 12, 16, 21};
        for (int h : hours) {
            int fee = bands.floorEntry(h).getValue();
            System.out.println("Hour " + h + " -> fee " + fee);
        }
    }
}
```

**Output:**

```text
Hour 11 -> fee 0
Hour 12 -> fee 500
Hour 16 -> fee 1200
Hour 21 -> fee 2500
```

### Medium: Banquet Hall Bookings

The hotel's banquet hall takes bookings by whole hours, where a slot from 10 to 12 means start at 10 and free at 12. Requests arrive in this order: 10-12, 14-16, 11-13, 12-14, 16-18 and 8-11. Accept a request only if it does not overlap an accepted booking, print the result for each request, and then print the final schedule in time order.

Expected output:

```text
10-12 booked
14-16 booked
11-13 clash
12-14 booked
16-18 booked
8-11 clash
Schedule:
{10=12, 12=14, 14=16, 16=18}
```

> **Hint:** Keep a `TreeMap` from start hour to end hour. A new slot clashes if the booking that starts at or before it ends after its start, or if the next booking starts before its end.

**Answer:** `floorEntry(start)` gives the nearest earlier booking and `ceilingKey(start)` the nearest later one. Only those two neighbours can overlap, so each request is checked in O(log n).

```java
import java.util.Map;
import java.util.TreeMap;

public class BanquetHall {
    static TreeMap<Integer, Integer> hall = new TreeMap<>();

    static boolean book(int start, int end) {
        Map.Entry<Integer, Integer> before =
                hall.floorEntry(start);
        if (before != null && before.getValue() > start) {
            return false;
        }
        Integer after = hall.ceilingKey(start);
        if (after != null && after < end) {
            return false;
        }
        hall.put(start, end);
        return true;
    }

    public static void main(String[] args) {
        int[][] requests = {{10, 12}, {14, 16}, {11, 13},
                            {12, 14}, {16, 18}, {8, 11}};
        for (int[] r : requests) {
            String result = book(r[0], r[1]) ? "booked" : "clash";
            System.out.println(r[0] + "-" + r[1] + " " + result);
        }
        System.out.println("Schedule:");
        System.out.println(hall);
    }
}
```

**Output:**

```text
10-12 booked
14-16 booked
11-13 clash
12-14 booked
16-18 booked
8-11 clash
Schedule:
{10=12, 12=14, 14=16, 16=18}
```
