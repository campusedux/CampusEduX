Try each problem on your own first, then compare with the solution.

### Easy: Gym Membership Plans

A gym has a basic `Membership` with a `holder` name and a monthly fee of 1200. It has a `card()` method that returns the holder and fee. A `PremiumMembership` extends it and adds a `lockerNo` field and a `perks()` method. Create a premium member named `"Aarav"` with locker 17, and print the card line and the perks line.

Expected output:

```text
Aarav - Rs 1200/month
Perks: sauna, locker 17
```

> **Hint:** The child class does not need its own `card()` method. It already inherits one.

**Answer:** `PremiumMembership` inherits the name, the fee and `card()`, and it only adds what is new: the locker number and the perks.

```java
class Membership {
    String holder;
    int monthlyFee = 1200;

    String card() {
        return holder + " - Rs " + monthlyFee + "/month";
    }
}

class PremiumMembership extends Membership {
    int lockerNo;

    String perks() {
        return "Perks: sauna, locker " + lockerNo;
    }
}

public class GymDesk {
    public static void main(String[] args) {
        PremiumMembership m = new PremiumMembership();
        m.holder = "Aarav";
        m.lockerNo = 17;
        System.out.println(m.card());
        System.out.println(m.perks());
    }
}
```

**Output:**

```text
Aarav - Rs 1200/month
Perks: sauna, locker 17
```

### Medium: Cinema Seat Pricing

A cinema prices seats in three levels. `Seat` takes a seat code in its constructor and has a `price()` of 180. `ReclinerSeat` extends `Seat` and charges the parent price plus 170. `VipRecliner` extends `ReclinerSeat` and adds 250 more for food service. Each constructor must print one line so you can see the build order, and `price()` in each child must reuse the parent's price with `super.price()`. Create `new VipRecliner("J7")` and print its price.

Expected output:

```text
Seat J7 created
Recliner motor added
VIP food tray added
J7 costs Rs 600
```

> **Hint:** Only `Seat` has a field for the code, so both child constructors must pass it upwards with `super(code)`.

**Answer:** Each constructor calls `super(code)` first, so the build order runs from `Seat` downwards, and each `price()` adds its own charge on top of `super.price()`.

```java
class Seat {
    String code;

    Seat(String code) {
        this.code = code;
        System.out.println("Seat " + code + " created");
    }

    int price() {
        return 180;
    }
}

class ReclinerSeat extends Seat {
    ReclinerSeat(String code) {
        super(code);
        System.out.println("Recliner motor added");
    }

    @Override
    int price() {
        return super.price() + 170;
    }
}

class VipRecliner extends ReclinerSeat {
    VipRecliner(String code) {
        super(code);
        System.out.println("VIP food tray added");
    }

    @Override
    int price() {
        return super.price() + 250;
    }
}

public class SeatPricing {
    public static void main(String[] args) {
        VipRecliner seat = new VipRecliner("J7");
        System.out.println(seat.code + " costs Rs " + seat.price());
    }
}
```

**Output:**

```text
Seat J7 created
Recliner motor added
VIP food tray added
J7 costs Rs 600
```
