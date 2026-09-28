Try each problem on your own first, then compare with the solution.

### Easy: Parking Kiosk PIN

A parking kiosk has an admin PIN of `5520`. Write a `ParkingKiosk` class that keeps the PIN and a count of wrong tries in `private` fields. Its only public method, `unlock(String pin)`, returns a message. After three wrong tries the kiosk stays locked, even for the right PIN. Try the PINs `0000`, `1234`, `9999` and `5520` in that order.

Expected output:

```text
0000: wrong (1 of 3)
1234: wrong (2 of 3)
9999: locked
5520: locked
```

> **Hint:** Check the lock first, then compare the PIN, then raise the counter. Because the counter is `private`, no outside code can reset it to zero.

**Answer:** The PIN and the counter are hidden, so the public method is the only door, and it enforces the three-try rule for every caller.

```java
class ParkingKiosk {
    private final String adminPin;
    private int wrongTries;

    ParkingKiosk(String adminPin) {
        this.adminPin = adminPin;
    }

    public String unlock(String pin) {
        if (wrongTries >= 3) {
            return "locked";
        }
        if (adminPin.equals(pin)) {
            return "open";
        }
        wrongTries++;
        return wrongTries >= 3
                ? "locked"
                : "wrong (" + wrongTries + " of 3)";
    }
}

public class KioskTest {
    public static void main(String[] args) {
        ParkingKiosk kiosk = new ParkingKiosk("5520");
        String[] tries = {"0000", "1234", "9999", "5520"};
        for (String pin : tries) {
            System.out.println(pin + ": " + kiosk.unlock(pin));
        }
    }
}
```

**Output:**

```text
0000: wrong (1 of 3)
1234: wrong (2 of 3)
9999: locked
5520: locked
```

### Medium: Seat Prices with a Protected Hook

A theatre keeps base ticket prices per row: 3000, 2500, 2000 and 1500 rupees for rows 1 to 4. Write a `SeatMap` class that keeps the prices in a `private` array, offers a `protected` method `surcharge(int row)` that returns 0, and a `public` method `quote(int row)` that adds the two. Then write `PremiumSeatMap`, which overrides only `surcharge` to add 500 for rows 1 and 2. Print the quote of every row for both maps.

Expected output:

```text
Standard
Row 1: Rs 3000
Row 2: Rs 2500
Row 3: Rs 2000
Row 4: Rs 1500
Premium
Row 1: Rs 3500
Row 2: Rs 3000
Row 3: Rs 2000
Row 4: Rs 1500
```

> **Hint:** The subclass never touches the price array. It only answers the `protected` question "how much extra for this row?", and the parent's public method does the rest.

**Answer:** The array stays `private`, the extension point is `protected` so only subclasses (and the package) can change it, and callers see just the `public` quote.

```java
class SeatMap {
    private final int[] basePrice = {3000, 2500, 2000, 1500};

    protected int surcharge(int row) {
        return 0;
    }

    public int quote(int row) {
        return basePrice[row - 1] + surcharge(row);
    }

    public int rows() {
        return basePrice.length;
    }
}

class PremiumSeatMap extends SeatMap {
    @Override
    protected int surcharge(int row) {
        return row <= 2 ? 500 : 0;
    }
}

public class TheatrePrices {
    static void show(String name, SeatMap map) {
        System.out.println(name);
        for (int r = 1; r <= map.rows(); r++) {
            System.out.println("Row " + r + ": Rs " + map.quote(r));
        }
    }

    public static void main(String[] args) {
        show("Standard", new SeatMap());
        show("Premium", new PremiumSeatMap());
    }
}
```

**Output:**

```text
Standard
Row 1: Rs 3000
Row 2: Rs 2500
Row 3: Rs 2000
Row 4: Rs 1500
Premium
Row 1: Rs 3500
Row 2: Rs 3000
Row 3: Rs 2000
Row 4: Rs 1500
```
