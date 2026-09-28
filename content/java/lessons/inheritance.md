A courier company runs bikes, vans and refrigerated trucks. Every one of them has a registration number, a driver and a fuel level, and every one can start a trip and log a delivery. If you write a separate class for each vehicle, you type those same fields and methods three times. Then a bug appears in the trip logic, and you have to fix it in three places and hope you did not miss one.

Inheritance solves this. You write the shared part once in a parent class, and each vehicle class takes it over and adds only what makes it different. Below you will see how `extends` works, what a child class does and does not receive, the order in which constructors run up the chain, and why Java lets a class have only one parent.

## What is Inheritance?

> **Definition:** Inheritance is the mechanism by which one class, the subclass, acquires the fields and methods of another class, the superclass, using the `extends` keyword. It models an IS-A relationship: a `DeliveryVan` IS-A `Vehicle`.

The class that gives is called the parent, superclass or base class. The class that receives is called the child, subclass or derived class. A child can use everything it inherits as if it had written it, add new fields and methods, and replace inherited methods with its own versions, which is called overriding.

A quick test tells you whether inheritance fits: say the sentence "a child is a parent" out loud. "A van is a vehicle" sounds right. "A van is an engine" does not, so a van should *have* an engine field instead of extending an engine class. That HAS-A link is called composition.

## Why is Inheritance used?

- **Code reuse.** Shared fields and methods live in one class, so you write and test them once.
- **Easy extension.** A new vehicle type needs only its extra details; the common behaviour is already there.
- **One place to fix.** A correction in the parent reaches every child automatically.
- **Clear modelling.** The class tree mirrors real categories, which makes large code bases easier to read.
- **A base for polymorphism.** Because a van IS-A vehicle, a `Vehicle` variable can hold a van, and one loop can handle every kind of vehicle.

## Real-Life Example

Think of a restaurant franchise. Head office writes the standard menu, the kitchen rules and the billing system. When a new outlet opens, it gets all of that on day one, without redesigning anything. The outlet may add a few local dishes, and it may change how one standard dish is served in its city. Some things stay locked at head office, such as the secret spice recipe; the outlet benefits from the result but never sees the recipe itself.

Map it back to Java. Head office is the superclass. Each outlet is a subclass created with `extends`. The standard menu is the inherited methods, local dishes are new methods, and the changed dish is an overridden method. The secret recipe is a `private` member: it exists inside every object, but the child class cannot touch it directly.

## Syntax

```java
class Parent {
    protected String shared;

    void commonAction() {
        // used by every child
    }
}

class Child extends Parent {
    int extraField;

    void newAction() {
        // only in Child
    }

    @Override
    void commonAction() {
        super.commonAction();   // optional: reuse parent code
        // then add Child's own steps
    }
}
```

Here is what each part does:

- `class Child extends Parent` declares the relationship. A class can extend only one other class.
- `protected` members are visible to subclasses, even ones in other packages.
- `newAction()` exists only in the child, so a plain `Parent` object does not have it.
- `@Override` marks a method that replaces the parent's version. The compiler checks that the signature really matches.
- `super.commonAction()` runs the parent's version from inside the override, so you can extend behaviour instead of rewriting it.

Not everything passes down. Public and protected fields and methods are inherited, and package-private ones are too when both classes share a package. Private members are part of the object in memory, but the child can reach them only through inherited public or protected methods, such as getters. Constructors are never inherited; each class writes its own and calls the parent's with `super(...)`.

## How Inheritance Works

When you create a child object, Java builds it from the top of the family tree downwards. Every constructor first calls its parent's constructor, either with your own `super(...)` or with a hidden `super()` the compiler inserts.

```text
new ColdChainTruck()
        |
        v
ColdChainTruck() called
 -> super() first
        |
        v
DeliveryVan() called
 -> super() first
        |
        v
Carrier() called
 -> super() first
        |
        v
Object() runs and returns
        |
        v
Carrier body finishes
        |
        v
DeliveryVan body finishes
        |
        v
ColdChainTruck body finishes
```

The calls travel up the chain until they reach `Object`, the root of every Java class. Then the bodies finish in the reverse direction, from the top parent down to the class you named in `new`. This way a child constructor can safely use inherited fields, because the parent has already set them. Only one object is created in the end, and it holds the fields of all three levels together in one block of heap memory.

## Example Programs

### Example 1: Reusing a Parent Class

```java
class Vehicle {
    String regNo;
    int fuel = 100;

    void startTrip(String area) {
        fuel -= 10;
        System.out.println(regNo + " heading to " + area);
    }
}

class DeliveryBike extends Vehicle {
    int boxLitres;

    void showBox() {
        System.out.println("Box size: " + boxLitres + " L");
    }
}

public class FleetStart {
    public static void main(String[] args) {
        DeliveryBike bike = new DeliveryBike();
        bike.regNo = "KA01-7741";
        bike.boxLitres = 40;
        bike.startTrip("Indiranagar");
        bike.showBox();
        System.out.println("Fuel left: " + bike.fuel);
    }
}
```

**Output:**

```text
KA01-7741 heading to Indiranagar
Box size: 40 L
Fuel left: 90
```

`DeliveryBike` declares only `boxLitres` and `showBox()`, yet it also has `regNo`, `fuel` and `startTrip()` because it extends `Vehicle`.

### Example 2: Constructor Order up the Chain

```java
class Carrier {
    Carrier() {
        System.out.println("1. Carrier ready");
    }
}

class DeliveryVan extends Carrier {
    DeliveryVan() {
        System.out.println("2. Van body fitted");
    }
}

class ColdChainTruck extends DeliveryVan {
    int tempC;

    ColdChainTruck(int tempC) {
        super();
        this.tempC = tempC;
        System.out.println("3. Cooling set to " + tempC + " C");
    }
}

public class BuildOrder {
    public static void main(String[] args) {
        new ColdChainTruck(4);
    }
}
```

**Output:**

```text
1. Carrier ready
2. Van body fitted
3. Cooling set to 4 C
```

Even though we only wrote `super()` in the truck, the van's constructor also calls its parent automatically. The printout follows the diagram: the top parent finishes first.

### Example 3: Private Fields, Overriding and super

```java
class Courier {
    private int deliveries;

    void logDelivery() {
        deliveries++;
    }

    int getDeliveries() {
        return deliveries;
    }

    String status() {
        return "Deliveries: " + deliveries;
    }
}

class DroneCourier extends Courier {
    int batteryPct = 90;

    @Override
    String status() {
        return super.status() + ", battery " + batteryPct + "%";
    }
}

public class DroneReport {
    public static void main(String[] args) {
        DroneCourier drone = new DroneCourier();
        drone.logDelivery();
        drone.logDelivery();
        System.out.println(drone.status());
        System.out.println("Count via getter: " + drone.getDeliveries());
        System.out.println(drone instanceof Courier);
    }
}
```

**Output:**

```text
Deliveries: 2, battery 90%
Count via getter: 2
true
```

`DroneCourier` cannot write `deliveries++` itself, because the field is private, but the inherited methods update it just fine. The override reuses the parent's text with `super.status()`, and `instanceof` confirms the IS-A link.

## Why Java Allows Only One Parent Class

Imagine two parent classes that both define `charge()` with different code, and a third class that extends both.

```text
        Charger
        /     \
  FastCharger  SolarCharger
        \     /
      HybridCharger
```

If `HybridCharger` calls `charge()`, which version should run? This is the diamond problem. It also raises harder questions, such as which parent constructor runs first and whether the shared grandparent's fields exist once or twice. Java's designers avoided all of it by allowing only one superclass per class. When you need a class to play several roles, you implement several interfaces instead, and if two interfaces clash on a default method, the compiler forces the class to choose.

## Common Mistakes

> **Common mistake:** Using inheritance only to borrow a few methods. If the IS-A sentence sounds wrong, such as "a van is a GPS unit", use a field instead. Forced inheritance creates fragile class trees that are hard to change.

- **Expecting private fields to be directly visible.** A child cannot write `parent.privateField`. Use protected members or getters.
- **Forgetting that the parent needs a constructor to call.** If the parent has only `Vehicle(String reg)`, every child constructor must call `super(reg)` itself, or the code fails to compile.
- **Missing `@Override`.** Without it, a small typo in the method name creates a brand new method, and the parent's version keeps running.
- **Trying to extend two classes.** `class A extends B, C` is a compile error in Java.
- **Extending a `final` class.** Classes such as `String` are final and cannot have subclasses.

## Interview Questions

**What is the IS-A relationship?**
It is the relationship that inheritance creates between a child and its parent. If `Van extends Vehicle`, then every van is a vehicle, so a `Vehicle` variable can hold a van and the `instanceof Vehicle` check returns true.

**Are private members inherited in Java?**
They are present inside the child object, because the parent part of the object is built too. However, the child cannot access them by name. It reaches them only through inherited public or protected methods.

**In what order do constructors run in a multilevel hierarchy?**
Each constructor first calls its parent's constructor, so the calls climb up to `Object`. The bodies then complete from the top parent down to the class named in `new`.

**Why does Java not support multiple inheritance of classes?**
To avoid the diamond problem, where two parents provide conflicting code or state and the compiler cannot tell which to use. Java allows multiple interfaces instead, where conflicts must be resolved explicitly.

**Can a subclass constructor call a specific parent constructor?**
Yes, by writing `super(arguments)` as its first statement. If it does not, the compiler inserts a call to the parent's no-arg constructor, which must exist.

## Summary

- Inheritance lets a subclass reuse and extend a superclass with `extends`.
- It models an IS-A relationship; use composition for HAS-A links.
- Public, protected and same-package members are inherited; private members and constructors are not directly usable.
- Constructors run from the top parent down, because each one calls `super()` first.
- A class can extend only one class, which avoids the diamond problem.
- `@Override` and `super.method()` let you change or extend inherited behaviour safely.

## Related Topics

- [Types of Inheritance](/learning/java-tutorial/types-of-inheritance): single, multilevel and hierarchical trees.
- [super Keyword](/learning/java-tutorial/super-keyword): reaching parent constructors and methods.
- [Method Overriding](/learning/java-tutorial/method-overriding): replacing inherited behaviour correctly.
- [Polymorphism](/learning/java-tutorial/polymorphism): using one parent type for many children.
