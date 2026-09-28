Try each problem on your own first, then compare with the solution.

### Easy: Coffee Machine Drinks

A café machine makes different drinks, but every drink follows the same routine: heat the water, then do the drink-specific brewing. Write an abstract class `Drink` with an abstract method `String brew()` and a finished method `serve()` that prints `Heating water` and then the result of `brew()`. Create `Espresso` (`"Pressing 18 g shot"`) and `MasalaChai` (`"Boiling tea with spices"`) and serve one of each.

Expected output:

```text
Heating water
Pressing 18 g shot
Heating water
Boiling tea with spices
```

> **Hint:** `serve()` can call `brew()` even though `Drink` never defines its body. The real object supplies it at runtime.

**Answer:** The abstract class fixes the shared routine and leaves only the brewing detail to each subclass, so callers just call `serve()`.

```java
abstract class Drink {
    abstract String brew();

    void serve() {
        System.out.println("Heating water");
        System.out.println(brew());
    }
}

class Espresso extends Drink {
    @Override
    String brew() {
        return "Pressing 18 g shot";
    }
}

class MasalaChai extends Drink {
    @Override
    String brew() {
        return "Boiling tea with spices";
    }
}

public class CafeCounter {
    public static void main(String[] args) {
        Drink[] orders = { new Espresso(), new MasalaChai() };
        for (Drink d : orders) {
            d.serve();
        }
    }
}
```

**Output:**

```text
Heating water
Pressing 18 g shot
Heating water
Boiling tea with spices
```

### Medium: Ride Fare Estimator

A ride booking app offers autos, cabs and bike taxis. Create an interface `FareRule` with `String name()` and `int fare(int km)`. Implement it three times: an auto charges 30 base plus 15 per km, a cab charges 60 base plus 18 per km with a minimum fare of 150, and a bike taxi charges 10 per km. Then write a `BookingScreen` class whose `quote(FareRule[] rules, int km)` method prints one line per ride and finally the cheapest one. It must only use the interface. Quote a 6 km trip.

Expected output:

```text
Auto: Rs 120
Cab: Rs 168
Bike: Rs 60
Cheapest: Bike
```

> **Hint:** Track the lowest fare and its name while you loop. For the cab, use `Math.max(150, ...)`.

**Answer:** `BookingScreen` depends only on the `FareRule` contract, so each fare formula stays hidden inside its own class and a new ride type needs no change to the screen.

```java
interface FareRule {
    String name();
    int fare(int km);
}

class AutoFare implements FareRule {
    public String name() {
        return "Auto";
    }

    public int fare(int km) {
        return 30 + 15 * km;
    }
}

class CabFare implements FareRule {
    public String name() {
        return "Cab";
    }

    public int fare(int km) {
        return Math.max(150, 60 + 18 * km);
    }
}

class BikeFare implements FareRule {
    public String name() {
        return "Bike";
    }

    public int fare(int km) {
        return 10 * km;
    }
}

class BookingScreen {
    void quote(FareRule[] rules, int km) {
        FareRule best = rules[0];
        for (FareRule r : rules) {
            System.out.println(r.name() + ": Rs " + r.fare(km));
            if (r.fare(km) < best.fare(km)) {
                best = r;
            }
        }
        System.out.println("Cheapest: " + best.name());
    }
}

public class RideQuote {
    public static void main(String[] args) {
        FareRule[] rules = {
            new AutoFare(), new CabFare(), new BikeFare()
        };
        new BookingScreen().quote(rules, 6);
    }
}
```

**Output:**

```text
Auto: Rs 120
Cab: Rs 168
Bike: Rs 60
Cheapest: Bike
```
