Walk through any big airport and notice the doors. The check-in hall is open to anyone off the street. The gate area lets in only people with a boarding pass. The crew corridor opens for airline staff, and the cockpit opens for two pilots and nobody else. Nobody argues with those doors, and that is exactly why the airport runs safely.

Java classes need the same kind of doors. Some members should be open to every class in the program, some only to close neighbours, and some to no one outside the class itself. The keywords that set those doors are called access modifiers. Here you will learn all four levels, how they apply to classes and to members, how `protected` behaves across packages, and how the compiler enforces every rule before your program even runs.

## What are Access Modifiers?

> **Definition:** Access modifiers are keywords that decide which other code may use a class, field, method or constructor. Java has four levels: `private`, default (no keyword, also called package-private), `protected` and `public`.

A few facts to hold on to from the start:

- `private` means only code inside the same class can use the member.
- Default, written by leaving the keyword out, means any class in the same package can use it.
- `protected` adds subclasses in other packages on top of the default rule.
- `public` means any class anywhere can use it.
- A top-level class can only be `public` or default. Nested classes, fields, methods and constructors can use all four.

## Why are Access Modifiers used?

Every class has two faces. One face is the small set of operations it promises to the rest of the program. The other is the private machinery that makes those operations work. If other classes can reach into the machinery, they start to depend on it, and you can no longer change it without breaking them.

Access modifiers draw that line in code. Keeping a field `private` means only its own class can change it, so a bug that corrupts it can come from only one file. Keeping a helper method package-private lets classes that work closely together share it without advertising it to the whole program. Marking a method `public` is a promise that it will keep working, because other teams may call it.

There is a safety side too. A booking system should never let an outside class write straight into a seat count or read a crew PIN. With the right modifier, such code does not even compile.

## Real-Life Example

Go back to the airport. The check-in hall is `public`: travellers, visitors and drivers can all walk in. The staff canteen is open to anyone working in that terminal building, whatever their job. That is the default level, where "same building" means "same package".

The crew corridor is `protected`. Staff of this terminal can use it, and so can crew from a partner airline that trains under the same rules, even though they work from a different building. That partner crew is the subclass in another package. The cockpit is `private`: only the flight's own pilots enter, and everyone else must ask them through the intercom, which is a public method.

## Syntax

```java
public class Flight {            // visible everywhere
    public String number;        // any class
    protected int seatsLeft;     // package + subclasses
    String gate;                 // same package only
    private String crewPin;      // this class only

    private void checkPin() { }  // helper for this class
}

class FuelLog { }                // default top-level class
```

- `public class Flight` can be used from any package. The file must be named `Flight.java`.
- `public String number` can be read and written by any class that has a `Flight` object.
- `protected int seatsLeft` is open to the same package and to subclasses in other packages.
- `String gate` has no keyword, so only classes in the same package can see it.
- `private String crewPin` and `private void checkPin()` are visible only between the braces of `Flight`.
- `class FuelLog` has no keyword, so it is invisible outside its package. A file may hold many such classes but only one `public` one.

## How Access Modifiers Work

Picture the four levels as rings, each one wider than the one inside it.

```text
+--------------------------------+
| public: any class              |
|  +--------------------------+  |
|  | protected: + subclasses  |  |
|  |  +--------------------+  |  |
|  |  | default: package   |  |  |
|  |  |  +--------------+  |  |  |
|  |  |  | private:     |  |  |  |
|  |  |  | own class    |  |  |  |
|  |  |  +--------------+  |  |  |
|  |  +--------------------+  |  |
|  +--------------------------+  |
+--------------------------------+
```

Each ring includes everything inside it. A `protected` member is also visible in its package, and a `public` member is visible to everyone.

The check happens in `javac`, not while the program runs. Every time your code names a member, the compiler follows this path.

```text
code in class C uses member m
        |
        v
m private?  -> C is m's class?
        |
        v
m default?  -> same package?
        |
        v
m protected?-> same package,
               or C is a subclass
        |
        v
m public    -> always allowed
```

If the answer at the matching level is no, compilation stops with an error such as "crewPin has private access in Flight". Because the check is done once at compile time, access modifiers cost nothing at run time. They are a rule about source code, not a lock inside memory.

The `protected` rule has one twist. A subclass in another package may use an inherited `protected` member through `this` or through a reference of its own type. It may not use it through a plain parent reference, because that object might belong to some unrelated subclass.

```java
// file airline/Flight.java
package airline;
public class Flight {
    protected int seatsLeft = 3;
}

// file lounge/VipFlight.java
package lounge;
public class VipFlight extends airline.Flight {
    void check(VipFlight vip, airline.Flight plain) {
        int a = seatsLeft;        // OK, inherited
        int b = vip.seatsLeft;    // OK, own type
        int c = plain.seatsLeft;  // compile error
    }
}
```

The programs below keep every class in one file so that you can run them directly. All of them share one package, so the cross-package rule appears only in the sketch above.

## Example Programs

### Four doors on one flight

```java
class Flight {
    public String number;
    protected int seatsLeft;
    String gate;
    private String crewPin;

    Flight(String number, String gate, int seats, String pin) {
        this.number = number;
        this.gate = gate;
        this.seatsLeft = seats;
        this.crewPin = pin;
    }

    public boolean crewDoor(String pin) {
        return crewPin.equals(pin);
    }
}

public class AirportBoard {
    public static void main(String[] args) {
        Flight f = new Flight("AI-202", "B7", 3, "4471");
        System.out.println("Flight : " + f.number);
        System.out.println("Gate   : " + f.gate);
        System.out.println("Seats  : " + f.seatsLeft);
        // f.crewPin would not compile here
        System.out.println("PIN 1111 opens? " + f.crewDoor("1111"));
        System.out.println("PIN 4471 opens? " + f.crewDoor("4471"));
    }
}
```

**Output:**

```text
Flight : AI-202
Gate   : B7
Seats  : 3
PIN 1111 opens? false
PIN 4471 opens? true
```

`AirportBoard` sits in the same package, so it can read the public, protected and default fields. The PIN is private, so the only way to test it is through the public `crewDoor` method.

### Private belongs to the class

```java
class BoardingPass {
    private final String holder;
    private final String seat;

    BoardingPass(String holder, String seat) {
        this.holder = holder;
        this.seat = seat;
    }

    boolean sameHolder(BoardingPass other) {
        return holder.equals(other.holder);
    }

    private String banner() {
        return "Standard pass";
    }

    public String print() {
        return banner() + " | seat " + seat;
    }
}

class LoungePass extends BoardingPass {
    LoungePass(String holder, String seat) {
        super(holder, seat);
    }

    public String banner() {
        return "Lounge pass";
    }
}

public class PassCheck {
    public static void main(String[] args) {
        BoardingPass a = new BoardingPass("Ishaan", "14C");
        BoardingPass b = new BoardingPass("Ishaan", "2A");
        System.out.println("Same holder? " + a.sameHolder(b));

        LoungePass lp = new LoungePass("Noor", "1A");
        System.out.println(lp.print());
        System.out.println(lp.banner());
    }
}
```

**Output:**

```text
Same holder? true
Standard pass | seat 1A
Lounge pass
```

`sameHolder` reads `other.holder` even though it belongs to another object, because `private` is checked per class, not per object. `LoungePass` cannot see the parent's private `banner()`, so its own `banner()` is a new method, not an override, and `print()` still calls the parent's version.

### Widening access in an override

```java
class Ticket {
    protected int fare() {
        return 4500;
    }

    public String label() {
        return getClass().getSimpleName() + ": Rs " + fare();
    }
}

class BusinessTicket extends Ticket {
    @Override
    public int fare() {
        return super.fare() * 3;
    }
}

public class FareDesk {
    public static void main(String[] args) {
        Ticket[] tickets = {new Ticket(), new BusinessTicket()};
        for (Ticket t : tickets) {
            System.out.println(t.label());
        }
        BusinessTicket bt = new BusinessTicket();
        System.out.println("Public fare: " + bt.fare());
    }
}
```

**Output:**

```text
Ticket: Rs 4500
BusinessTicket: Rs 13500
Public fare: 13500
```

An override may keep the same access or open it wider, so turning `protected` into `public` is legal. Writing the override with no keyword would narrow it, and `javac` would refuse with "attempting to assign weaker access privileges".

## Access Modifiers Compared

| Modifier | Same class | Same package | Subclass elsewhere | Any class |
|---|---|---|---|---|
| `private` | Yes | No | No | No |
| default | Yes | Yes | No | No |
| `protected` | Yes | Yes | Yes | No |
| `public` | Yes | Yes | Yes | Yes |

Start every member at `private` and open it only when another class truly needs it. Most fields stay private for life, while methods that form the class's promise become public.

## Common Mistakes

> **Warning:** Do not make fields `public` just to get rid of a compile error. Any class can then set them to nonsense values, and you lose the one place where you could check them. Keep the field private and add a method that validates the change.

- **Thinking `protected` means "subclasses only".** It also opens the member to every class in the same package, which is wider than many people expect.
- **Narrowing access in an override.** A `public` method in the parent cannot become `protected` or default in the child.
- **Expecting a private method to be overridden.** The child cannot see it, so a method with the same name in the child is a separate method.
- **Two public classes in one file.** Only one top-level class per file may be `public`, and the file must carry its name.

## Interview Questions

**What are the four access levels in Java, from most to least restrictive?**
They are `private`, default (package-private), `protected` and `public`. Private allows only the same class, default adds the same package, protected adds subclasses in other packages, and public allows every class.

**Can a top-level class be private or protected?**
No. A top-level class can only be `public` or default. Nested classes can use all four levels, because they are members of another class.

**How does protected access work for a subclass in a different package?**
The subclass can use the inherited member through `this` or a reference of its own type. It cannot use the member through a reference of the parent type, since that object may belong to a different family of subclasses.

**Can a private method be overridden?**
No. A private method is invisible to subclasses, so a method with the same signature in the child is a brand new method. Calls inside the parent still go to the parent's own private version.

**Can an overriding method change the access modifier?**
It can keep the same level or make it wider, such as `protected` to `public`. It cannot make it narrower, because code that called the parent method through a parent reference must still be able to call the child's version.

## Summary

- Java has four access levels: `private`, default, `protected` and `public`.
- Each level includes everything the narrower level allows.
- Top-level classes are only `public` or default; members and nested classes can use all four.
- `protected` covers the same package plus subclasses elsewhere, through their own type.
- The compiler checks access, so there is no run-time cost.
- Overrides may widen access but never narrow it, and private methods are never overridden.

## Related Topics

- [Encapsulation](/learning/java-tutorial/encapsulation): private fields and validated methods built on these rules.
- [Packages](/learning/java-tutorial/packages): how classes are grouped, which decides default access.
- [Inheritance](/learning/java-tutorial/inheritance): where `protected` members are passed down.
- [Method Overriding](/learning/java-tutorial/method-overriding): why an override may widen access but not narrow it.
