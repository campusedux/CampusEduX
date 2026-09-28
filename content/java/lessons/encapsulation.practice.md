Try each problem on your own first, then compare with the solution.

### Easy: Locker Rental Days

A gym rents lockers for 1 to 90 days. Write a `LockerRental` class with a `private int days` field, a getter, and a setter that ignores any value outside 1 to 90 and returns `false` for it. Start at 30 days, then try to set 0, 120 and 45, printing whether each change was accepted and the days after it.

Expected output:

```text
Start: 30 days
Set 0: rejected, days = 30
Set 120: rejected, days = 30
Set 45: accepted, days = 45
```

> **Hint:** Let the setter return a `boolean`. Check the range first, and store the value only when the check passes.

**Answer:** The field is private, so the setter is the only way to change it, and its range check keeps `days` valid after every call.

```java
class LockerRental {
    private int days = 30;

    public int getDays() {
        return days;
    }

    public boolean setDays(int newDays) {
        if (newDays < 1 || newDays > 90) {
            return false;
        }
        days = newDays;
        return true;
    }
}

public class LockerDesk {
    public static void main(String[] args) {
        LockerRental locker = new LockerRental();
        System.out.println("Start: " + locker.getDays() + " days");
        int[] requests = {0, 120, 45};
        for (int r : requests) {
            boolean ok = locker.setDays(r);
            System.out.println("Set " + r + ": "
                    + (ok ? "accepted" : "rejected")
                    + ", days = " + locker.getDays());
        }
    }
}
```

**Output:**

```text
Start: 30 days
Set 0: rejected, days = 30
Set 120: rejected, days = 30
Set 45: accepted, days = 45
```

### Medium: Spin Batch with a Seat Limit

A spin batch has 3 bikes. Write a `SpinBatch` class that keeps riders in a private `List`. Its `enroll(String name)` method refuses a duplicate name and refuses anyone once the batch is full. `getRiders()` must not let callers change the real list. Enrol Asha, Vikram, Asha, Leela and Omar in that order, print each result, print the riders, and then show that adding through the getter fails.

Expected output:

```text
Asha: enrolled
Vikram: enrolled
Asha: already in batch
Leela: enrolled
Omar: batch full
Riders: [Asha, Vikram, Leela]
Outside add blocked
Riders: [Asha, Vikram, Leela]
```

> **Hint:** Return a message from `enroll` instead of a boolean so you can tell the two refusals apart. Wrap the list with `Collections.unmodifiableList` in the getter.

**Answer:** The class owns the invariants "no duplicates" and "at most 3 riders", and because the getter gives out only a read-only view, no caller can break either rule.

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class SpinBatch {
    private static final int BIKES = 3;
    private final List<String> riders = new ArrayList<>();

    public String enroll(String name) {
        if (riders.contains(name)) {
            return "already in batch";
        }
        if (riders.size() == BIKES) {
            return "batch full";
        }
        riders.add(name);
        return "enrolled";
    }

    public List<String> getRiders() {
        return Collections.unmodifiableList(riders);
    }
}

public class SpinDesk {
    public static void main(String[] args) {
        SpinBatch batch = new SpinBatch();
        String[] names = {"Asha", "Vikram", "Asha", "Leela", "Omar"};
        for (String n : names) {
            System.out.println(n + ": " + batch.enroll(n));
        }
        System.out.println("Riders: " + batch.getRiders());
        try {
            batch.getRiders().add("Omar");
        } catch (UnsupportedOperationException e) {
            System.out.println("Outside add blocked");
        }
        System.out.println("Riders: " + batch.getRiders());
    }
}
```

**Output:**

```text
Asha: enrolled
Vikram: enrolled
Asha: already in batch
Leela: enrolled
Omar: batch full
Riders: [Asha, Vikram, Leela]
Outside add blocked
Riders: [Asha, Vikram, Leela]
```
