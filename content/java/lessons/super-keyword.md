Visit a car showroom and ask about the new electric model. The salesperson does not start from scratch. She says, "It has everything the petrol version has, the same body, the same safety kit, and on top of that a 465 km battery." She points back to the older model and then adds only what is new. Child classes in Java talk the same way, and the word they use to point back at the parent is `super`.

You already know that a child class inherits from its parent. This page shows how the child reaches the parent's own field, the parent's own version of a method, and the parent's constructor. You will also see the full chain of constructors that runs every time you create an object, and how `super` differs from its close cousin `this`.

## What is the super Keyword?

> **Definition:** `super` is a Java keyword that refers to the parent-class part of the current object. A subclass uses it to call the parent's constructor, the parent's version of an overridden method, or a parent field hidden by one of its own.

It has three forms:

- `super(...)` calls a constructor of the direct parent class. It must be the first statement of a constructor.
- `super.method()` calls the parent's version of a method, even when the child overrides it.
- `super.field` reads the parent's field when the child declares a field with the same name.

`super` works only inside instance code, that is, constructors and non-static methods. A `static` method has no current object, so it has no `super`.

## Why is the super Keyword used?

Inheritance lets a child reuse its parent's code, but reuse is rarely all or nothing. Often the child wants to keep the parent's behaviour and add a little. Without `super`, an overriding method would have to copy the parent's code, and every later fix in the parent would need a matching fix in the copy.

Constructors raise a second need. A parent class may insist on certain values, such as a car's model name, before it will build an object. The child cannot set the parent's `private` fields directly, so it passes the values up with `super(...)` and lets the parent do its own setup and checks.

Finally, `super` settles naming clashes. When the child declares a field with the same name as the parent's, `super.field` still reaches the parent's copy.

## Real-Life Example

Think of how a car maker builds its range. The base platform is designed first: chassis, wheels, brakes. The sedan version starts from that platform and adds a body and seats. The electric sedan starts from the sedan and adds a battery pack and a motor.

On the factory floor, no electric sedan can skip the earlier stages. The platform must be finished before the body goes on, and the body must be on before the battery is fitted. That is the constructor chain, and `super(...)` is the instruction "finish the earlier stage first".

When a buyer asks for the spec sheet, the electric sedan's sheet reads "everything on the sedan's sheet, plus range and charging time". That is `super.spec()` followed by the extra lines.

## Syntax

```java
class Child extends Parent {
    Child(String name, int extra) {
        super(name);              // parent constructor, line one
        this.extra = extra;
    }

    @Override
    String describe() {
        return super.describe()   // parent's version
                + " " + extra;
    }

    void showHidden() {
        System.out.println(super.label);  // parent's field
    }
}
```

- `super(name)` runs the matching `Parent` constructor. Nothing may come before it in the constructor body.
- If a constructor starts with neither `super(...)` nor `this(...)`, the compiler inserts `super()` with no arguments.
- `super.describe()` calls the parent's method directly, skipping the child's override.
- `super.label` reads the parent's field when the child has hidden it with its own `label`.
- Only the direct parent is reachable. There is no `super.super`.

## How the super Keyword Works

Every constructor in Java begins by calling another constructor, either one in the same class with `this(...)` or one in the parent with `super(...)`. Follow `new` for an electric car whose class sits two levels below `Vehicle`.

```text
new ElectricCar("Zephyr", 465)
        |
        v
ElectricCar(...) -> super(model)
        |
        v
Car(model) -> super() inserted
        |
        v
Vehicle() -> super() inserted
        |
        v
Object()  runs first
Bodies then finish in order:
Object -> Vehicle -> Car -> EV
```

The calls climb up the class tree until they reach `Object`, the root of every class. The bodies then run on the way back down, so the parent's fields are always set before the child's constructor body uses them. That is why `super(...)` must be the first statement: the parent part of the object has to exist before the child touches anything.

For methods, `super.spec()` is resolved at compile time to the parent's version and does not use dynamic dispatch. A plain `spec()` call, or `this.spec()`, goes to the most specific override for the actual object. That difference is what lets an override call the parent and add to it without calling itself forever.

## Example Programs

### The constructor chain in action

```java
class Vehicle {
    Vehicle() {
        System.out.println("Vehicle: chassis ready");
    }
}

class Car extends Vehicle {
    protected final String model;

    Car(String model) {
        // javac inserts super() here
        this.model = model;
        System.out.println("Car: body for " + model);
    }
}

class ElectricCar extends Car {
    private final int rangeKm;

    ElectricCar(String model, int rangeKm) {
        super(model);
        this.rangeKm = rangeKm;
        System.out.println("EV: " + rangeKm + " km pack fitted");
    }
}

public class AssemblyLine {
    public static void main(String[] args) {
        new ElectricCar("Zephyr", 465);
    }
}
```

**Output:**

```text
Vehicle: chassis ready
Car: body for Zephyr
EV: 465 km pack fitted
```

`Car` never wrote `super()`, yet the `Vehicle` line printed first, because the compiler added the call. The output follows the diagram: the top of the tree finishes first.

### Extending a method with super.method()

```java
class Car {
    protected String model;
    protected int priceLakh;

    Car(String model, int priceLakh) {
        this.model = model;
        this.priceLakh = priceLakh;
    }

    String spec() {
        return model + ", " + priceLakh + " lakh";
    }
}

class ElectricCar extends Car {
    protected int rangeKm;

    ElectricCar(String model, int priceLakh, int rangeKm) {
        super(model, priceLakh);
        this.rangeKm = rangeKm;
    }

    @Override
    String spec() {
        return super.spec() + ", " + rangeKm + " km";
    }
}

class LongRangeEV extends ElectricCar {
    LongRangeEV(String model, int priceLakh, int rangeKm) {
        super(model, priceLakh, rangeKm);
    }

    @Override
    String spec() {
        return super.spec() + ", DC fast";
    }
}

public class SpecSheet {
    public static void main(String[] args) {
        Car[] range = {
            new Car("Aria", 9),
            new ElectricCar("Zephyr", 16, 465),
            new LongRangeEV("Zephyr+", 21, 610)
        };
        for (Car c : range) {
            System.out.println(c.spec());
        }
    }
}
```

**Output:**

```text
Aria, 9 lakh
Zephyr, 16 lakh, 465 km
Zephyr+, 21 lakh, 610 km, DC fast
```

Each override calls `super.spec()` and appends one piece, so the text grows level by level without any line being copied. `LongRangeEV` reaches `Car` only through `ElectricCar`, because `super` always means the direct parent.

### super.field versus this.field

```java
class Car {
    String badge = "Standard";
}

class SportsCar extends Car {
    String badge = "GT";

    void showBadges() {
        Car asCar = this;
        System.out.println("badge       : " + badge);
        System.out.println("this.badge  : " + this.badge);
        System.out.println("super.badge : " + super.badge);
        System.out.println("as Car      : " + asCar.badge);
    }
}

public class BadgeCheck {
    public static void main(String[] args) {
        new SportsCar().showBadges();
    }
}
```

**Output:**

```text
badge       : GT
this.badge  : GT
super.badge : Standard
as Car      : Standard
```

The object holds two separate `badge` fields. Inside `SportsCar`, the plain name and `this.badge` pick the child's copy, while `super.badge` picks the parent's. Fields are not overridden, so a `Car` reference also sees "Standard". Hiding fields like this is legal but confusing, so real code avoids it.

## super vs this

| Point | super | this |
|---|---|---|
| Refers to | Parent part of the object | The current object |
| Field access | Parent's field, even if hidden | This class's field |
| Method call | Parent's version, no dispatch | Most specific override |
| Constructor call | `super(...)`, parent's | `this(...)`, same class |
| Position | First statement only | First statement only |
| In static code | Not allowed | Not allowed |

A constructor can begin with `super(...)` or with `this(...)`, never both. If it uses `this(...)`, the other constructor it calls will make the `super(...)` call instead.

## Common Mistakes

> **Common mistake:** Giving the parent only a constructor with parameters and then writing a child constructor that does not call it. The compiler inserts `super()`, finds no no-argument constructor in the parent, and reports "constructor Car in class Car cannot be applied to given types".

- **Putting code before `super(...)`.** Even a print statement above it is a compile error.
- **Calling a method recursively by mistake.** Writing `spec()` instead of `super.spec()` inside the override calls itself until the stack overflows.
- **Trying `super.super.method()`.** Java allows only the direct parent; add a method in the middle class if you need the grandparent's behaviour.
- **Using `super` in a `static` method.** There is no current object there, so there is no parent part to refer to.

## Interview Questions

**Why must super() be the first statement in a constructor?**
The parent part of the object must be fully set up before the child's code runs. Putting the call first guarantees that parent fields are ready and that no child code sees a half-built parent.

**What happens if a constructor does not call super() explicitly?**
The compiler inserts a call to the parent's no-argument constructor. If the parent does not have one, compilation fails, and the child must call a parent constructor with arguments itself.

**Can you use this() and super() in the same constructor?**
No. Both must be the first statement, so only one can appear. A constructor that calls `this(...)` hands the job to another constructor, which then calls `super(...)`.

**How is super.method() different from calling method() inside an override?**
`super.method()` goes straight to the parent's version at compile time. A plain `method()` call uses dynamic dispatch and lands on the most specific override, which inside that override means calling itself.

**Can super be used to reach a grandparent's method?**
Not directly. `super` refers only to the direct parent, and Java has no `super.super`. The parent can expose the grandparent's behaviour by calling `super.method()` in its own method.

## Summary

- `super` refers to the parent-class part of the current object.
- `super(...)` calls a parent constructor and must be the first statement.
- Without an explicit call, the compiler inserts `super()` with no arguments.
- Constructors run from `Object` down to the class you created.
- `super.method()` reuses the parent's code inside an override, and `super.field` reaches a hidden field.
- `super` reaches only the direct parent and cannot be used in static code.

## Related Topics

- [Inheritance](/learning/java-tutorial/inheritance): the parent-child link that `super` travels along.
- [this Keyword](/learning/java-tutorial/this-keyword): the current-object reference that `super` is often compared with.
- [Constructors](/learning/java-tutorial/constructors): how objects are set up before the chain begins.
- [Method Overriding](/learning/java-tutorial/method-overriding): where `super.method()` reuses a parent's behaviour.
