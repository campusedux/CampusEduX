Try each problem on your own first, then compare with the solution.

### Easy: Bakery Cake Order

A bakery takes cake orders. Write a `CakeOrder` class with the fields `flavour` and `kg`. Give it a no-arg constructor that sets `"Vanilla"` and `1.0`, and a parameterised constructor that takes both values. In `main`, create one order with each constructor (use `"Chocolate"` and `2.5` for the second) and print both.

Expected output:

```text
Vanilla cake, 1.0 kg
Chocolate cake, 2.5 kg
```

> **Hint:** Overload the constructor, and use `this.flavour = flavour` so the field is not hidden by the parameter.

**Answer:** Two constructors with different parameter lists let `new` pick the right setup, and a `label()` method builds the line to print.

```java
class CakeOrder {
    String flavour;
    double kg;

    CakeOrder() {
        flavour = "Vanilla";
        kg = 1.0;
    }

    CakeOrder(String flavour, double kg) {
        this.flavour = flavour;
        this.kg = kg;
    }

    String label() {
        return flavour + " cake, " + kg + " kg";
    }
}

public class BakeryCounter {
    public static void main(String[] args) {
        CakeOrder quick = new CakeOrder();
        CakeOrder custom = new CakeOrder("Chocolate", 2.5);
        System.out.println(quick.label());
        System.out.println(custom.label());
    }
}
```

**Output:**

```text
Vanilla cake, 1.0 kg
Chocolate cake, 2.5 kg
```

### Medium: Railway Ticket with Chaining

A railway booking app creates `Ticket` objects in three ways: with only a train name (class `"Sleeper"`, 1 passenger), with a train name and class (1 passenger), or with all three values. Put the real setup in the three-argument constructor only, and make the other two chain to it with `this()`. That constructor must also reject a passenger count below 1 by using 1 instead, and give each ticket a running ticket number starting at 5001. Create tickets for `"Deccan Express"`, `"Rajdhani"` in `"AC-2"`, and `"Shatabdi"` in `"Chair"` with 0 passengers.

Expected output:

```text
#5001 Deccan Express Sleeper x1
#5002 Rajdhani AC-2 x1
#5003 Shatabdi Chair x1
```

> **Hint:** Keep a `static int nextNumber` in the class and read it inside the full constructor, so every chain ends up there.

**Answer:** Each short constructor forwards its values plus defaults to the full one, so the validation and numbering are written once and run for every ticket.

```java
class Ticket {
    static int nextNumber = 5001;

    final int number;
    final String train;
    final String travelClass;
    final int passengers;

    Ticket(String train) {
        this(train, "Sleeper");
    }

    Ticket(String train, String travelClass) {
        this(train, travelClass, 1);
    }

    Ticket(String train, String travelClass, int passengers) {
        this.number = nextNumber++;
        this.train = train;
        this.travelClass = travelClass;
        this.passengers = passengers < 1 ? 1 : passengers;
    }

    String print() {
        return "#" + number + " " + train + " "
                + travelClass + " x" + passengers;
    }
}

public class BookingOffice {
    public static void main(String[] args) {
        Ticket a = new Ticket("Deccan Express");
        Ticket b = new Ticket("Rajdhani", "AC-2");
        Ticket c = new Ticket("Shatabdi", "Chair", 0);
        System.out.println(a.print());
        System.out.println(b.print());
        System.out.println(c.print());
    }
}
```

**Output:**

```text
#5001 Deccan Express Sleeper x1
#5002 Rajdhani AC-2 x1
#5003 Shatabdi Chair x1
```
