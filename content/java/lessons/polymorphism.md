At a busy checkout, the cashier says the same two words to every customer: "Please pay." One customer counts out notes, another taps a card, and a third scans a UPI code on the phone. The cashier does not need a separate script for each kind of payment. The request stays the same, and each payment method answers it in its own way.

That idea has a name in Java: polymorphism. It lets one method call behave differently depending on the object that receives it, or on the arguments you pass. Here you will learn the two kinds of polymorphism, how upcasting makes them possible, and how the JVM decides at runtime which method body to run.

## What is Polymorphism?

> **Definition:** Polymorphism is the ability of one method name or one reference type to take many forms. Java picks the code to run either at compile time, from the argument types (method overloading), or at runtime, from the actual object (method overriding).

The word comes from Greek and means "many shapes". In practice you meet it in two forms:

- **Compile-time polymorphism**, also called static binding. Several methods share a name but differ in their parameter lists. The compiler reads the arguments and locks in the right version before the program runs.
- **Runtime polymorphism**, also called dynamic binding. A subclass overrides a parent method, and a parent-type variable holds the child object. The JVM checks the real object while the program is running and calls its version.

## Why is Polymorphism used?

- **One piece of code for many types.** A checkout method that accepts a `Payment` works for cards, UPI and cash without an `if` for each one.
- **Easy extension.** Adding a new payment method, such as a gift card, means writing one new class. The checkout code does not change.
- **Cleaner APIs.** Overloading lets callers use one natural name, such as `charge`, with different kinds of input.
- **Loose coupling.** Code depends on the general type, not on concrete classes, so parts can be swapped or tested in isolation.

## Real-Life Example

Think of a wall socket. The socket offers one thing: power through the same two holes. Plug in a fan and it spins. Plug in a kettle and it boils water. Plug in a phone charger and the battery fills. The socket has no idea what is plugged in, and it does not need to.

In Java terms, the socket is a parent-type reference, such as `Payment p`. The appliance is the actual object stored in it, such as a `CardPayment`. Switching on the power is the method call `p.pay()`. What happens next depends entirely on the appliance, just as the JVM runs the method of the real object. And because every appliance follows the same plug shape, you can add new ones later without rewiring the house.

## Syntax

```java
// Compile-time: same name, different parameters
class Counter {
    void charge(double amount) { }
    void charge(double amount, double tip) { }
}

// Runtime: override + parent reference
class Parent {
    void act() { }
}
class Child extends Parent {
    @Override
    void act() { }
}

Parent ref = new Child();   // upcasting
ref.act();                  // Child's act() runs
```

Line by line:

- The two `charge` methods are overloads. They share a name but take different parameters, and the compiler picks one by looking at the call.
- `Child` overrides `act()` with the same signature. `@Override` asks the compiler to confirm that a parent method really exists.
- `Parent ref = new Child();` is upcasting. A child object is stored in a parent-type variable. It is always safe, so no cast is needed.
- `ref.act()` compiles because `Parent` declares `act()`. At runtime the JVM runs the version in `Child`, because that is the real object.

## How Polymorphism Works

Runtime polymorphism rests on a mechanism called dynamic method dispatch. The compiler and the JVM each do one part of the job.

```text
Payment p = new UpiPayment();
p.pay(500);
        |
        v
Compiler checks the type
Payment: has pay(double)?
Yes -> code compiles
        |
        v
At runtime the JVM reads
the real class of p:
UpiPayment
        |
        v
Looks up pay in UpiPayment's
method table
        |
        v
Override found -> run it
Not found -> use parent's
```

The compiler only knows the declared type, `Payment`, so it checks that `Payment` has a matching `pay` method and records the call. It does not decide which body will run. When the line executes, the JVM looks at the object on the heap, sees that it is a `UpiPayment`, and finds `pay` in that class's method table. If the class overrides the method, that version runs. If not, the table points to the inherited version from the parent. Overloaded methods skip this lookup, because the compiler already chose the exact method from the argument types.

## Example Programs

### Example 1: Compile-Time Polymorphism with Overloading

```java
class Checkout {
    String charge(double amount) {
        return "Paid " + amount;
    }

    String charge(double amount, double tip) {
        return "Paid " + (amount + tip) + " incl tip";
    }

    String charge(double amount, String coupon) {
        double off = coupon.equals("SAVE50") ? 50 : 0;
        return "Paid " + (amount - off) + " with " + coupon;
    }
}

public class OverloadCounter {
    public static void main(String[] args) {
        Checkout c = new Checkout();
        System.out.println(c.charge(400));
        System.out.println(c.charge(400, 40));
        System.out.println(c.charge(400, "SAVE50"));
    }
}
```

**Output:**

```text
Paid 400.0
Paid 440.0 incl tip
Paid 350.0 with SAVE50
```

The same name, `charge`, does three jobs. The compiler picks each version from the argument types; the int values are widened to `double` to fit.

### Example 2: Runtime Polymorphism with Upcasting

```java
class Payment {
    String pay(int amount) {
        return "Generic payment of " + amount;
    }
}

class CardPayment extends Payment {
    @Override
    String pay(int amount) {
        return "Card tapped: Rs " + amount;
    }
}

class UpiPayment extends Payment {
    @Override
    String pay(int amount) {
        return "UPI scanned: Rs " + amount;
    }
}

class CashPayment extends Payment {
    @Override
    String pay(int amount) {
        return "Cash counted: Rs " + amount;
    }
}

public class Till {
    public static void main(String[] args) {
        Payment[] queue = {
            new CardPayment(), new UpiPayment(), new CashPayment()
        };
        int[] bills = {250, 90, 600};
        for (int i = 0; i < queue.length; i++) {
            System.out.println(queue[i].pay(bills[i]));
        }
    }
}
```

**Output:**

```text
Card tapped: Rs 250
UPI scanned: Rs 90
Cash counted: Rs 600
```

Every element of the array has the declared type `Payment`, yet each call runs a different method. The loop never checks which kind of payment it holds.

### Example 3: What Is and Is Not Polymorphic

```java
class Wallet {
    String label = "wallet";

    static String kind() {
        return "static in Wallet";
    }

    String describe() {
        return "Wallet.describe";
    }
}

class GiftCard extends Wallet {
    String label = "gift card";

    static String kind() {
        return "static in GiftCard";
    }

    @Override
    String describe() {
        return "GiftCard.describe";
    }

    String balance() {
        return "Balance: Rs 1500";
    }
}

public class BindingCheck {
    public static void main(String[] args) {
        Wallet w = new GiftCard();
        System.out.println(w.describe());
        System.out.println(w.label);
        System.out.println(w.kind());
        if (w instanceof GiftCard) {
            GiftCard g = (GiftCard) w;
            System.out.println(g.balance());
        }
    }
}
```

**Output:**

```text
GiftCard.describe
wallet
static in Wallet
Balance: Rs 1500
```

Only the instance method follows the real object. The field is chosen by the declared type, and `w.kind()` runs the `Wallet` version because static methods are hidden, not overridden. To call `balance()`, which `Wallet` does not declare, you must downcast after an `instanceof` check.

## Compile-Time vs Runtime Polymorphism

| Point | Compile-time | Runtime |
|---|---|---|
| Achieved by | Method overloading | Method overriding |
| Also called | Static binding | Dynamic binding |
| Decided by | The compiler | The JVM |
| Based on | Argument types | Actual object type |
| Inheritance needed | No | Yes |
| Methods involved | Same class, or inherited | Parent and child |
| Works for static | Yes | No, static is hidden |

## Common Mistakes

> **Warning:** Overloading cannot rely on the return type alone. Two methods named `charge(double)` that return `String` and `boolean` will not compile, because a call like `charge(10)` gives the compiler no way to choose.

- **Expecting fields to be polymorphic.** A field is read from the declared type, so `w.label` above printed `wallet`.
- **Calling a child-only method through a parent reference.** `w.balance()` does not compile, because `Wallet` has no such method.
- **Downcasting blindly.** Casting a `CardPayment` to `UpiPayment` throws a `ClassCastException`. Check with `instanceof` first.
- **Changing the parameter type by accident.** Writing `pay(long)` in the child creates an overload, not an override. Add `@Override` so the compiler catches it.
- **Assuming static methods override.** They are resolved from the reference type, so the parent version may run.

## Interview Questions

**What is dynamic method dispatch?**
It is the process by which the JVM decides, while the program runs, which overridden method to call. It looks at the actual object behind the reference, not the declared type, and runs that class's version.

**Is method overloading an example of polymorphism?**
Yes, it is compile-time polymorphism. One method name has several forms, and the compiler picks the right one from the number and types of arguments.

**What is upcasting, and is it safe?**
Upcasting stores a subclass object in a superclass variable, like `Payment p = new CardPayment()`. It is always safe and needs no cast, but through that variable you can only call methods the superclass declares.

**Can static or private methods be overridden?**
No. Static methods are bound to the class and are only hidden by a subclass method with the same signature. Private methods are not visible to the child, so a same-named method there is a new, unrelated method.

**Why are fields not polymorphic in Java?**
Field access is resolved at compile time from the declared type. Only instance methods go through dynamic dispatch, which is one more reason to keep fields private and expose them through methods.

## Summary

- Polymorphism means one name or one reference type with many forms.
- Compile-time polymorphism comes from overloading, and the compiler picks the method.
- Runtime polymorphism comes from overriding, and the JVM picks the method from the real object.
- Upcasting stores a child in a parent variable and is always safe.
- Fields, static methods and private methods do not take part in dynamic dispatch.
- Use `@Override` and `instanceof` checks to avoid silent overloads and bad casts.

## Related Topics

- [Method Overloading](/learning/java-tutorial/method-overloading): the rules behind compile-time polymorphism.
- [Method Overriding](/learning/java-tutorial/method-overriding): the rules behind runtime polymorphism.
- [Inheritance](/learning/java-tutorial/inheritance): the parent and child link that upcasting needs.
- [Interface](/learning/java-tutorial/interface): polymorphism without a shared parent class.
