Try each problem on your own first, then compare with the solution.

### Easy: Parking Lot Fees

A mall parking lot charges by the hour. Create an abstract class `ParkedVehicle` that stores the plate number and hours parked, has an abstract method `hourlyRate()`, and a complete method `fee()` that multiplies hours by the rate. Add `Car` (Rs 40 per hour) and `Scooter` (Rs 15 per hour). Park car `MH12AB` for 3 hours and scooter `MH14XY` for 5 hours, then print each fee.

Expected output:

```text
MH12AB pays Rs 120
MH14XY pays Rs 75
```

> **Hint:** Keep the plate and hours in the abstract parent and set them through its constructor. Each child only returns a number from `hourlyRate()`.

**Answer:** The parent owns the data and the fee formula, and each child fills the one blank, its rate.

```java
abstract class ParkedVehicle {
    protected String plate;
    protected int hours;

    ParkedVehicle(String plate, int hours) {
        this.plate = plate;
        this.hours = hours;
    }

    abstract int hourlyRate();

    int fee() {
        return hours * hourlyRate();
    }
}

class Car extends ParkedVehicle {
    Car(String plate, int hours) {
        super(plate, hours);
    }

    @Override
    int hourlyRate() {
        return 40;
    }
}

class Scooter extends ParkedVehicle {
    Scooter(String plate, int hours) {
        super(plate, hours);
    }

    @Override
    int hourlyRate() {
        return 15;
    }
}

public class ParkingFees {
    public static void main(String[] args) {
        ParkedVehicle[] slots = {
            new Car("MH12AB", 3),
            new Scooter("MH14XY", 5)
        };
        for (ParkedVehicle v : slots) {
            System.out.println(v.plate + " pays Rs " + v.fee());
        }
    }
}
```

**Output:**

```text
MH12AB pays Rs 120
MH14XY pays Rs 75
```

### Medium: Coffee Machine Template

An office coffee machine makes every drink in the same order: heat water, add the drink base, add milk if needed, pour into a cup. Write an abstract class `Beverage` with a `final` method `prepare()` that runs this order. The base and the milk choice are abstract methods: `addBase()` returns a String and `needsMilk()` returns a boolean. Make `Espresso` (base "espresso shot", no milk) and `Latte` (base "espresso shot", with milk), then prepare one of each.

Expected output:

```text
[Espresso]
Heat water
Add espresso shot
Pour into cup
[Latte]
Heat water
Add espresso shot
Add steamed milk
Pour into cup
```

> **Hint:** Inside `prepare()`, print the class name with `getClass().getSimpleName()`, then call the abstract methods at the right places. An `if` on `needsMilk()` decides the optional line.

**Answer:** This is the template method pattern: the parent's `final` method fixes the order, and the children answer only the questions that differ.

```java
abstract class Beverage {
    final void prepare() {
        System.out.println("[" + getClass().getSimpleName() + "]");
        System.out.println("Heat water");
        System.out.println("Add " + addBase());
        if (needsMilk()) {
            System.out.println("Add steamed milk");
        }
        System.out.println("Pour into cup");
    }

    abstract String addBase();

    abstract boolean needsMilk();
}

class Espresso extends Beverage {
    @Override
    String addBase() {
        return "espresso shot";
    }

    @Override
    boolean needsMilk() {
        return false;
    }
}

class Latte extends Beverage {
    @Override
    String addBase() {
        return "espresso shot";
    }

    @Override
    boolean needsMilk() {
        return true;
    }
}

public class CoffeeCorner {
    public static void main(String[] args) {
        Beverage[] orders = { new Espresso(), new Latte() };
        for (Beverage b : orders) {
            b.prepare();
        }
    }
}
```

**Output:**

```text
[Espresso]
Heat water
Add espresso shot
Pour into cup
[Latte]
Heat water
Add espresso shot
Add steamed milk
Pour into cup
```
