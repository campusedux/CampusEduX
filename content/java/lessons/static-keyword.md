At a railway station, every ticket carries its own passenger name and seat number. Yet all tickets share certain things: the name of the railway, the rule for the next booking number, and the chart of base fares. Nobody prints a fresh fare chart for each passenger. There is one chart on the wall, and everyone reads from it.

Java has a word for "one shared copy for the whole class": `static`. Once you understand it, you will know why `main` looks the way it does, why some methods are called on a class name, and when a class quietly gets loaded into memory. Let's build a small ticket system and watch it all happen.

## What is the static Keyword?

> **Definition:** The `static` keyword marks a member as belonging to the class itself rather than to any object. A static member exists once per class, is created when the class is loaded, and can be used through the class name without creating an object.

You can apply `static` to four things:

- **Variables.** One copy shared by every object, such as a booking counter.
- **Methods.** Behaviour that needs no object data, such as a fare calculator.
- **Blocks.** Code that runs once when the class is loaded, used to prepare static data.
- **Nested classes.** A class inside another class that does not need an outer object.

Members without `static` are called instance members. Each object gets its own copy of instance variables.

## Why is the static Keyword used?

Some data simply does not belong to one object. If each ticket kept its own copy of the booking counter, every ticket would start counting from the same number and passengers would get duplicate booking numbers. A single shared counter fixes that.

- **Shared state.** Counters, settings and caches need exactly one copy.
- **Memory savings.** A constant like the railway name is stored once, not once per ticket.
- **Utility methods.** Methods such as `Math.max` work only on their inputs, so creating an object to call them would be wasteful.
- **One-time setup.** A static block can fill a lookup table once, before anything else uses the class.
- **Program entry.** The JVM must start your program before any object exists, which is why `main` is static.

## Real-Life Example

Think of a train coach. Every passenger has a personal seat, luggage and ticket. Those are instance variables: each passenger has a different value. The coach also has one clock on the wall and one chart listing the stations. Every passenger reads the same clock. If the guard sets it five minutes forward, everyone sees the new time at once.

That wall clock is a static variable. It belongs to the coach, not to any passenger. A passenger can look at it, but no passenger carries a private copy. Likewise, the announcement "next station is Nagpur" is made once for the whole coach, just as a static method acts for the whole class.

## Syntax

```java
class ClassName {
    static int sharedCount;

    static final String LABEL = "value";

    static {
        sharedCount = 1;
    }

    static int helper(int x) {
        return x + sharedCount;
    }

    static class Inner {
    }
}
```

Here is what each line means:

- `static int sharedCount;` declares a class variable. There is one copy, with a default value of 0.
- `static final String LABEL` is a constant. Pairing `static` with `final` is the usual way to write constants.
- `static { ... }` is a static initialiser block. It runs once, when the class is loaded.
- `static int helper(int x)` is a class method. You call it as `ClassName.helper(5)`.
- `static class Inner` is a static nested class. You create it with `new ClassName.Inner()`, with no outer object needed.

## How the static Keyword Works

The JVM loads a class the first time your program truly needs it: when you create an object, call a static method, or read a static field that is not a compile-time constant. At that moment, static variables get memory and static blocks run from top to bottom. This happens only once per class.

```text
CLASS DATA (one copy)
+------------------------------+
| TrainTicket                  |
|  static nextPnr = 5003       |
|  static railway = "SR"       |
+------------------------------+
               ^
               |
     shared by every object
               |
      +--------+--------+
      |                 |
+------------+  +------------+
| ticket A   |  | ticket B   |
|  Asha      |  |  Ravi      |
|  pnr 5001  |  |  pnr 5002  |
+------------+  +------------+
OBJECTS ON THE HEAP
```

Each object holds only its own instance fields, like the passenger name and the booking number it received. The static fields sit with the class data, so both tickets read and update the same `nextPnr`. When you write `ticket.nextPnr`, Java quietly turns it into `TrainTicket.nextPnr`. Because a static method runs without any object, it has no `this` to point at, and that is why it cannot touch instance fields directly.

## Example Programs

### Shared Booking Counter

```java
class TrainTicket {
    static String railway = "Sahyadri Rail";
    static int nextPnr = 5001;

    String passenger;
    int pnr;

    TrainTicket(String passenger) {
        this.passenger = passenger;
        this.pnr = nextPnr;
        nextPnr++;
    }

    void print() {
        System.out.println(pnr + " " + passenger
            + " / " + railway);
    }
}

public class BookingCounter {
    public static void main(String[] args) {
        TrainTicket a = new TrainTicket("Asha");
        TrainTicket b = new TrainTicket("Ravi");
        a.print();
        b.print();
        TrainTicket.railway = "SR";
        a.print();
        System.out.println("Next PNR: " + TrainTicket.nextPnr);
    }
}
```

**Output:**

```text
5001 Asha / Sahyadri Rail
5002 Ravi / Sahyadri Rail
5001 Asha / SR
Next PNR: 5003
```

Each ticket got its own booking number because the shared counter moved forward after every booking. Changing `railway` once through the class name changed it for every ticket.

### When a Static Block Runs

```java
class FareChart {
    static int sleeperPerKm;

    static {
        System.out.println("FareChart loaded");
        sleeperPerKm = 2;
    }

    static int fare(int km) {
        return km * sleeperPerKm;
    }
}

public class ChartLoading {
    static {
        System.out.println("ChartLoading loaded");
    }

    public static void main(String[] args) {
        System.out.println("main starts");
        System.out.println("Pune-Nagpur: Rs "
            + FareChart.fare(700));
        System.out.println("Pune-Goa: Rs "
            + FareChart.fare(450));
    }
}
```

**Output:**

```text
ChartLoading loaded
main starts
FareChart loaded
Pune-Nagpur: Rs 1400
Pune-Goa: Rs 900
```

The class holding `main` loads before `main` runs, so its static block prints first. `FareChart` loads only when the program first calls `fare`, and its block never runs a second time.

### Static Method and Static Nested Class

```java
class Train {
    private static int trainsCreated = 0;
    private final String name;

    Train(String name) {
        this.name = name;
        trainsCreated++;
    }

    static int count() {
        return trainsCreated;
    }

    static class Coach {
        private final String code;
        private final int seats;

        Coach(String code, int seats) {
            this.code = code;
            this.seats = seats;
        }

        String info() {
            return code + " has " + seats + " seats";
        }
    }
}

public class YardReport {
    public static void main(String[] args) {
        Train.Coach s1 = new Train.Coach("S1", 72);
        System.out.println(s1.info());
        System.out.println("Trains: " + Train.count());
        new Train("Coastal Mail");
        new Train("Hill Express");
        System.out.println("Trains: " + Train.count());
    }
}
```

**Output:**

```text
S1 has 72 seats
Trains: 0
Trains: 2
```

A `Coach` was built without creating any `Train`, because a static nested class does not need an outer object. The static method `count()` is called on the class name and reports the shared total.

## Static vs Instance Members

| Point | static member | Instance member |
|---|---|---|
| Belongs to | The class | Each object |
| Copies | One | One per object |
| Created | When the class loads | When `new` runs |
| Accessed by | Class name | Object reference |
| Can use `this` | No | Yes |

## Common Mistakes

> **Warning:** A static method cannot read an instance field or call an instance method directly. Code like `System.out.println(passenger);` inside a static method fails with "non-static variable cannot be referenced from a static context". Create an object first, or pass the value in.

- **Using static for per-object data.** Making `passenger` static means every ticket shows the last name assigned.
- **Calling statics through an object.** `a.nextPnr` compiles, but it hides the fact that the value is shared. Use `TrainTicket.nextPnr`.
- **Expecting a static block to run on every `new`.** It runs only once, when the class is loaded.
- **Heavy mutable static state.** Static fields live as long as the class, so a growing static list can hold memory for the whole run of the program.

## Interview Questions

**Why is the main method static?**
The JVM needs to call `main` before any object of your class exists. Because `main` is static, the JVM can call it on the class directly without creating an instance first.

**When does a static block run?**
It runs once, when the class is initialised. That happens on the first active use, such as creating an object, calling a static method or reading a non-constant static field.

**Can a static method use `this` or `super`?**
No. Both refer to an object, and a static method runs with no object at all. The compiler rejects them in a static context.

**Can we override a static method?**
No. If a child declares a static method with the same signature, it hides the parent method instead of overriding it. The call is chosen by the reference type at compile time, not by the object.

**What is the difference between a static nested class and an inner class?**
A static nested class does not hold a link to an outer object, so you can create it on its own. A non-static inner class always belongs to an instance of the outer class and can read that instance's fields.

## Summary

- `static` members belong to the class, and there is exactly one copy of each.
- Static variables suit shared counters, settings and constants.
- Static methods need no object and cannot use `this` or instance fields directly.
- Static blocks run once, when the JVM first initialises the class.
- A static nested class can be created without an outer object.
- `main` is static so the JVM can start the program before any object exists.

## Related Topics

- [Class](/learning/java-tutorial/class): the blueprint that owns every static member.
- [this Keyword](/learning/java-tutorial/this-keyword): the object reference that static code does not have.
- [Final Keyword](/learning/java-tutorial/final-keyword): combine it with static to make constants.
- [Class Loading](/learning/java-tutorial/class-loading): what the JVM does before static blocks run.
