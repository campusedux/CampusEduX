Try each problem on your own first, then compare with the solution.

### Easy: Clear Out Expired Packets

A spice shop's store room holds packets labelled with a name and a best-before year: Pepper-2025, Cardamom-2027, Turmeric-2024 and Clove-2026. It is now 2026. Walk the list with an `Iterator`, remove every packet whose year is before 2026, and print how many were removed and what is left.

Expected output:

```text
Removed: 2
Left: [Cardamom-2027, Clove-2026]
```

> **Hint:** Split each label on `-`, turn the year into an `int`, and call `it.remove()` when it is below 2026.

**Answer:** The iterator's own `remove()` keeps its count in step with the list, so there is no ConcurrentModificationException while the loop carries on.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;

public class ExpiredPackets {
    public static void main(String[] args) {
        List<String> packets = new ArrayList<>(Arrays.asList(
                "Pepper-2025", "Cardamom-2027",
                "Turmeric-2024", "Clove-2026"));
        int removed = 0;
        Iterator<String> it = packets.iterator();
        while (it.hasNext()) {
            int year = Integer.parseInt(it.next().split("-")[1]);
            if (year < 2026) {
                it.remove();
                removed++;
            }
        }
        System.out.println("Removed: " + removed);
        System.out.println("Left: " + packets);
    }
}
```

**Output:**

```text
Removed: 2
Left: [Cardamom-2027, Clove-2026]
```

### Medium: A Spice Rack That Skips Empty Slots

A spice rack has six slots stored in a plain array, and empty slots hold `null`: Hing, empty, Kokum, empty, empty, Nigella. Write a `SpiceRack` class that implements `Iterable<String>` so it works in a for-each loop, and make its iterator skip the empty slots. Print each spice, then show that calling `next()` after the last spice throws `NoSuchElementException`.

Expected output:

```text
Hing
Kokum
Nigella
Past end: NoSuchElementException
```

> **Hint:** Keep an index in the iterator. In `hasNext()`, move the index forward past any `null` slots, then check if it is still inside the array.

**Answer:** Any class that returns an `Iterator` from `iterator()` can be used in a for-each loop. Skipping the `null` slots inside `hasNext()` means callers never see the gaps.

```java
import java.util.Iterator;
import java.util.NoSuchElementException;

class SpiceRack implements Iterable<String> {
    private final String[] slots;

    SpiceRack(String[] slots) {
        this.slots = slots;
    }

    public Iterator<String> iterator() {
        return new Iterator<String>() {
            private int index = 0;

            public boolean hasNext() {
                while (index < slots.length
                        && slots[index] == null) {
                    index++;
                }
                return index < slots.length;
            }

            public String next() {
                if (!hasNext()) {
                    throw new NoSuchElementException();
                }
                return slots[index++];
            }
        };
    }
}

public class RackWalk {
    public static void main(String[] args) {
        SpiceRack rack = new SpiceRack(new String[] {
                "Hing", null, "Kokum", null, null, "Nigella"});
        for (String spice : rack) {
            System.out.println(spice);
        }

        Iterator<String> it = rack.iterator();
        while (it.hasNext()) {
            it.next();
        }
        try {
            it.next();
        } catch (NoSuchElementException e) {
            System.out.println("Past end: "
                    + e.getClass().getSimpleName());
        }
    }
}
```

**Output:**

```text
Hing
Kokum
Nigella
Past end: NoSuchElementException
```
