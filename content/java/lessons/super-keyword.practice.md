Try each problem on your own first, then compare with the solution.

### Easy: Showroom Price with Extras

A `Car` class returns an ex-showroom price of 800000 rupees from `price()`. Write a `LuxuryCar` subclass whose `price()` adds a 250000-rupee leather and sunroof pack to the parent's price, without writing 800000 a second time. Print the price of both cars.

Expected output:

```text
Car: Rs 800000
LuxuryCar: Rs 1050000
```

> **Hint:** Inside the override, call `super.price()` and add the pack price to whatever it returns.

**Answer:** `super.price()` asks the parent for its number, so if the base price ever changes, the luxury price follows automatically.

```java
class Car {
    int price() {
        return 800000;
    }
}

class LuxuryCar extends Car {
    static final int PACK = 250000;

    @Override
    int price() {
        return super.price() + PACK;
    }
}

public class Showroom {
    public static void main(String[] args) {
        Car[] cars = {new Car(), new LuxuryCar()};
        for (Car c : cars) {
            System.out.println(c.getClass().getSimpleName()
                    + ": Rs " + c.price());
        }
    }
}
```

**Output:**

```text
Car: Rs 800000
LuxuryCar: Rs 1050000
```

### Medium: A Taxi Built in Three Stages

Build three classes. `Vehicle(String vin)` stores a VIN. `Car(String vin, int seats)` extends it and stores seats. `Taxi(String vin, int seats, String permit)` extends `Car` and stores a permit number. Each constructor must pass its values up with `super(...)` and print one line. Each class also has `describe()`, and each override must reuse the parent's text with `super.describe()`. Create a taxi with VIN `KA05-7781`, 4 seats and permit `P-2291`, then print its description.

Expected output:

```text
Vehicle KA05-7781
Car with 4 seats
Taxi permit P-2291
VIN KA05-7781 | 4 seats
  | permit P-2291
```

> **Hint:** The constructors print in parent-first order because each one calls `super(...)` before its own print. Make `describe()` in `Taxi` add a line break and two spaces before its part.

**Answer:** Each class handles only its own field and hands the rest to its parent, both in the constructor chain and in `describe()`, so no class repeats another's work.

```java
class Vehicle {
    private final String vin;

    Vehicle(String vin) {
        this.vin = vin;
        System.out.println("Vehicle " + vin);
    }

    String describe() {
        return "VIN " + vin;
    }
}

class Car extends Vehicle {
    private final int seats;

    Car(String vin, int seats) {
        super(vin);
        this.seats = seats;
        System.out.println("Car with " + seats + " seats");
    }

    @Override
    String describe() {
        return super.describe() + " | " + seats + " seats";
    }
}

class Taxi extends Car {
    private final String permit;

    Taxi(String vin, int seats, String permit) {
        super(vin, seats);
        this.permit = permit;
        System.out.println("Taxi permit " + permit);
    }

    @Override
    String describe() {
        return super.describe() + "\n  | permit " + permit;
    }
}

public class TaxiDepot {
    public static void main(String[] args) {
        Taxi t = new Taxi("KA05-7781", 4, "P-2291");
        System.out.println(t.describe());
    }
}
```

**Output:**

```text
Vehicle KA05-7781
Car with 4 seats
Taxi permit P-2291
VIN KA05-7781 | 4 seats
  | permit P-2291
```
