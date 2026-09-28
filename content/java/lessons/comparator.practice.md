Try each problem on your own first, then compare with the solution.

### Easy: Heaviest Bags First

The baggage team must load the heaviest bags first. The bags are tagged BG-11 (18.5 kg), BG-12 (23.0 kg), BG-13 (7.2 kg) and BG-14 (19.8 kg). Sort them by weight from heaviest to lightest with a `Comparator`, without adding any ordering code to the `Bag` class.

Expected output:

```text
BG-12 23.0 kg
BG-14 19.8 kg
BG-11 18.5 kg
BG-13 7.2 kg
```

> **Hint:** Build the order with `comparingDouble` on the weight getter, then call `reversed()`.

**Answer:** `comparingDouble` compares the weights in ascending order, and `reversed()` flips it so the heaviest bag comes first.

```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

class Bag {
    private final String tag;
    private final double kg;

    Bag(String tag, double kg) {
        this.tag = tag;
        this.kg = kg;
    }

    String getTag() { return tag; }
    double getKg() { return kg; }
}

public class BaggageLoad {
    public static void main(String[] args) {
        List<Bag> hold = new ArrayList<>();
        hold.add(new Bag("BG-11", 18.5));
        hold.add(new Bag("BG-12", 23.0));
        hold.add(new Bag("BG-13", 7.2));
        hold.add(new Bag("BG-14", 19.8));

        hold.sort(Comparator.comparingDouble(Bag::getKg)
                .reversed());
        for (Bag b : hold) {
            System.out.println(b.getTag() + " " + b.getKg() + " kg");
        }
    }
}
```

**Output:**

```text
BG-12 23.0 kg
BG-14 19.8 kg
BG-11 18.5 kg
BG-13 7.2 kg
```

### Medium: Upgrade Waitlist

Two business class seats are free, and three passengers get offered upgrades. Rank the waitlist by tier level (1 is the highest; `null` means no tier and goes last), then by miles from highest to lowest, then by name A to Z. The travellers are Farida (tier 2, 30000 miles), Tomas (no tier, 99000), Keiko (tier 1, 15000), Bilal (tier 2, 30000) and Uma (tier 2, 54000). Print the top three.

Expected output:

```text
1. Keiko (tier 1, 15000)
2. Uma (tier 2, 54000)
3. Bilal (tier 2, 30000)
```

> **Hint:** Start with `comparing(getter, nullsLast(...))` for the tier, add `thenComparing` for the miles with `reverseOrder()`, and finish with the name.

**Answer:** Each `thenComparing` is a tie-breaker, so miles only matter within a tier and names only matter when miles also match. Reversing just the miles key keeps the tier and name orders ascending.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

class Flyer {
    private final String name;
    private final Integer tier;
    private final int miles;

    Flyer(String name, Integer tier, int miles) {
        this.name = name;
        this.tier = tier;
        this.miles = miles;
    }

    String getName() { return name; }
    Integer getTier() { return tier; }
    int getMiles() { return miles; }
}

public class UpgradeWaitlist {
    public static void main(String[] args) {
        List<Flyer> list = new ArrayList<>(Arrays.asList(
                new Flyer("Farida", 2, 30000),
                new Flyer("Tomas", null, 99000),
                new Flyer("Keiko", 1, 15000),
                new Flyer("Bilal", 2, 30000),
                new Flyer("Uma", 2, 54000)));

        Comparator<Flyer> rank = Comparator
                .comparing(Flyer::getTier,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Flyer::getMiles,
                        Comparator.reverseOrder())
                .thenComparing(Flyer::getName);
        list.sort(rank);

        for (int i = 0; i < 3; i++) {
            Flyer f = list.get(i);
            System.out.println((i + 1) + ". " + f.getName()
                    + " (tier " + f.getTier() + ", "
                    + f.getMiles() + ")");
        }
    }
}
```

**Output:**

```text
1. Keiko (tier 1, 15000)
2. Uma (tier 2, 54000)
3. Bilal (tier 2, 30000)
```
