Walk into any courier office and ask to send a parcel. The clerk weighs it, prints a label and hands you a receipt, no matter which service you pick. Only one thing changes between services: the price per kilo. Express costs more, economy costs less, but the counter routine stays the same. The office has a fixed plan for every parcel with a single blank that each service fills in.

That is exactly the job of an abstract class in Java. It lets you write the shared routine once and leave clearly marked blanks for subclasses. Here you will learn what an abstract class is, when to reach for one, how its constructor behaves, and how it compares with an interface.

## What is an Abstract Class?

> **Definition:** An abstract class is a class declared with the `abstract` keyword. It cannot be turned into an object with `new`, and it may contain abstract methods (methods with no body) that its subclasses must implement.

Think of it as a half-finished class. Some methods are complete and ready to use. Others are only promises: a name, parameters and a return type, ending with a semicolon instead of a body.

A few facts define it:

- You cannot write `new Shipment()` if `Shipment` is abstract. The compiler refuses.
- It can still have fields, constructors, static methods and normal methods.
- A class with even one abstract method must itself be marked `abstract`.
- A concrete subclass must implement every abstract method it inherits, or be declared abstract too.

## Why is an Abstract Class used?

Imagine three delivery services written as three separate classes. Each one repeats the same code for labels, weight checks and receipts. When the receipt format changes, you edit three files and hope you did not miss one. An abstract class removes that copying.

- **Shared code lives in one place.** Common fields and methods sit in the parent, and every child inherits them.
- **Required behaviour is enforced.** An abstract method is a rule the compiler checks. Forget to implement it and the code will not build.
- **Partial implementation.** Unlike an interface, the parent can keep state such as a tracking number and fill in most of the logic.
- **A fixed order of work.** The parent can define the sequence of a task and let children supply only the changing pieces. This is called the template method pattern.
- **Safer designs.** Nobody can create a vague "general shipment" object that has no real price.

## Real-Life Example

Picture a printed form at the courier counter. The top half is already filled: company name, office address, terms and conditions. The bottom half has empty boxes for weight, service type and rate. You cannot post the form as it is. Someone has to fill in the blanks first.

Map this back to Java. The printed form is the abstract class. The pre-filled top half is its concrete methods and fields. The empty boxes are the abstract methods. A completed form for an express parcel is a concrete subclass, and only a completed form can be used. That is why `new` works on the subclass but not on the abstract parent.

## Syntax

```java
abstract class ParentName {
    protected String field;

    ParentName(String field) {
        this.field = field;
    }

    abstract double pendingWork(int input);

    void sharedWork() {
        // complete code every child inherits
    }
}

class ChildName extends ParentName {
    ChildName(String value) {
        super(value);
    }

    @Override
    double pendingWork(int input) {
        return input * 2.0;
    }
}
```

Reading it line by line:

- `abstract class ParentName` marks the class as unfinished, so `new ParentName(...)` is not allowed.
- The field and constructor work as in any class. The constructor runs when a child object is built.
- `abstract double pendingWork(int input);` has no braces. It ends with a semicolon, which means "a subclass will write this".
- `sharedWork()` is a normal method with a body that children get for free.
- `ChildName` calls `super(value)` to run the parent constructor, then overrides the abstract method with real code.

## How an Abstract Class Works

The compiler and the JVM treat an abstract class as a normal class with two extra rules: no direct objects, and every abstract method must be filled somewhere down the family tree.

```text
  abstract class Shipment
  +--------------------------+
  | trackingId  (field)      |
  | Shipment()  (constructor)|
  | receipt()   (complete)   |
  | ratePerKg() (abstract)   |
  +--------------------------+
        |              |
        v              v
  +-----------+  +-----------+
  | Express   |  | Economy   |
  | ratePerKg |  | ratePerKg |
  +-----------+  +-----------+

  new Express("X1")
    -> Shipment() runs first
    -> Express() runs next
    -> receipt() calls
       Express.ratePerKg()
```

When you write `new Express("X1")`, Java allocates one object that holds both the parent fields and the child fields. The parent constructor runs first, then the child constructor finishes the job. Later, when `receipt()` inside the parent calls `ratePerKg()`, the JVM looks at the real object, finds the `Express` version and runs it. The parent code never needs to know which child it is dealing with.

## Example Programs

### Partial Implementation for Courier Services

```java
abstract class Shipment {
    protected double weightKg;

    Shipment(double weightKg) {
        this.weightKg = weightKg;
    }

    abstract double ratePerKg();

    double charge() {
        return weightKg * ratePerKg();
    }
}

class ExpressShipment extends Shipment {
    ExpressShipment(double kg) {
        super(kg);
    }

    @Override
    double ratePerKg() {
        return 120.0;
    }
}

class EconomyShipment extends Shipment {
    EconomyShipment(double kg) {
        super(kg);
    }

    @Override
    double ratePerKg() {
        return 45.0;
    }
}

public class CourierCharges {
    public static void main(String[] args) {
        Shipment[] parcels = {
            new ExpressShipment(2.5),
            new EconomyShipment(4.0),
            new ExpressShipment(1.0)
        };
        double total = 0;
        for (Shipment p : parcels) {
            System.out.println("Charge: Rs " + p.charge());
            total += p.charge();
        }
        System.out.println("Day total: Rs " + total);
    }
}
```

**Output:**

```text
Charge: Rs 300.0
Charge: Rs 180.0
Charge: Rs 120.0
Day total: Rs 600.0
```

The `charge()` method is written once in the parent. Each child supplies only its rate, and the array of type `Shipment` holds both kinds of parcel.

### Constructor of an Abstract Class

```java
abstract class Consignment {
    private static int counter = 100;
    protected final String trackingId;

    Consignment(String city) {
        counter++;
        trackingId = city + "-" + counter;
        System.out.println("Parent sets id " + trackingId);
    }

    abstract String mode();
}

class AirConsignment extends Consignment {
    AirConsignment(String city) {
        super(city);
        System.out.println("Child ready for air");
    }

    @Override
    String mode() {
        return "Air";
    }
}

public class TrackingDemo {
    public static void main(String[] args) {
        Consignment c = new AirConsignment("PUNE");
        System.out.println(c.trackingId + " by " + c.mode());
        Consignment d = new AirConsignment("GOA");
        System.out.println(d.trackingId + " by " + d.mode());
    }
}
```

**Output:**

```text
Parent sets id PUNE-101
Child ready for air
PUNE-101 by Air
Parent sets id GOA-102
Child ready for air
GOA-102 by Air
```

An abstract class cannot be instantiated, yet its constructor still runs. It fires first, every time a child object is built, which makes it the right place to set shared fields like the tracking id.

### Template Method for Dispatch

```java
abstract class DispatchRoutine {
    final void dispatch(String parcel) {
        System.out.println("Weigh " + parcel);
        pack(parcel);
        System.out.println("Label " + parcel);
        handOver(parcel);
    }

    abstract void pack(String parcel);

    abstract void handOver(String parcel);
}

class FragileDispatch extends DispatchRoutine {
    @Override
    void pack(String parcel) {
        System.out.println("Bubble wrap " + parcel);
    }

    @Override
    void handOver(String parcel) {
        System.out.println("Van with care");
    }
}

class DocumentDispatch extends DispatchRoutine {
    @Override
    void pack(String parcel) {
        System.out.println("Seal envelope " + parcel);
    }

    @Override
    void handOver(String parcel) {
        System.out.println("Bike rider");
    }
}

public class DispatchCenter {
    public static void main(String[] args) {
        new FragileDispatch().dispatch("Vase");
        System.out.println("--");
        new DocumentDispatch().dispatch("Deed");
    }
}
```

**Output:**

```text
Weigh Vase
Bubble wrap Vase
Label Vase
Van with care
--
Weigh Deed
Seal envelope Deed
Label Deed
Bike rider
```

The parent fixes the order of work in a `final` method, so no child can reorder it. Children fill only the two changing pieces.

## Abstract Class vs Interface

Both describe behaviour that others must supply, so beginners often mix them up. This table uses Java 11 rules.

| Point | Abstract class | Interface |
|---|---|---|
| Keyword to use | `extends` | `implements` |
| How many per class | Only one | Many |
| Instance fields | Allowed | Not allowed |
| Constant fields | Allowed | Always `public static final` |
| Constructors | Yes | No |
| Method bodies | Any method | `default`, `static`, `private` |
| Method access | Any modifier | `public` or `private` |
| Best for | Related classes sharing state | A skill many classes can have |

A quick rule: choose an abstract class when the children are truly the same kind of thing and share data. Choose an interface when unrelated classes need a common ability, such as `Comparable`.

## Common Mistakes

> **Common mistake:** Writing braces on an abstract method, like `abstract double rate() {}`. An abstract method must end with a semicolon. Braces mean "here is a body", which contradicts `abstract`.

- **Trying `new` on the abstract class.** `new Shipment(2.0)` fails to compile. Create a concrete child instead, or use an anonymous class.
- **Forgetting one abstract method.** If a child skips even one, the compiler says the class "is not abstract and does not override" it.
- **Mixing `abstract` with `final`, `private` or `static`.** A final method cannot be overridden and a private one is invisible to children, so neither can be abstract.
- **Calling an overridable method from the parent constructor.** The child's fields are not set yet at that moment, so the child version may see zeros or `null`.

## Interview Questions

**Can an abstract class have a constructor?**
Yes. It cannot be called with `new` directly, but it runs through `super(...)` whenever a subclass object is created. It is used to set up the fields shared by all children.

**Can an abstract class exist without any abstract method?**
Yes. Marking such a class `abstract` simply stops people from creating objects of it. This is handy for a base class that makes sense only when extended.

**Can an abstract method be static or final?**
No. A static method belongs to the class and is not overridden, and a final method cannot be overridden. Both clash with the idea of a method that a child must implement.

**When would you pick an abstract class over an interface?**
Pick it when related classes share fields or constructor logic, or when you want a template method that fixes the order of work. If you only need a contract that unrelated classes can adopt, an interface is lighter.

**What happens if a subclass does not implement all abstract methods?**
The subclass must then be declared `abstract` itself, or the code will not compile. The duty to implement passes further down the family tree.

## Summary

- An abstract class is declared with `abstract` and cannot be created with `new`.
- Abstract methods have no body and must be implemented by concrete subclasses.
- It can hold fields, constructors and complete methods, giving partial implementation.
- Its constructor runs through `super(...)` before the child constructor.
- A `final` method that calls abstract steps creates the template method pattern.
- A class extends only one abstract class but can implement many interfaces.

## Related Topics

- [Abstraction](/learning/java-tutorial/abstraction): the bigger idea that abstract classes help you apply.
- [Interface](/learning/java-tutorial/interface): the other tool for defining contracts, compared above.
- [Method Overriding](/learning/java-tutorial/method-overriding): how children replace the abstract methods.
- [Inheritance](/learning/java-tutorial/inheritance): the `extends` link every abstract class depends on.
