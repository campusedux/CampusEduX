Open a smart home app and tap "Good night". The bedroom lights dim, the front door locks, the air conditioner moves to 26 degrees and the geyser switches off. You pressed one button. You never saw the Wi-Fi packets, the motor inside the lock or the relay in the geyser. The app showed you *what* it can do and kept *how* it does it out of sight.

That is abstraction, and it is one of the four pillars of object-oriented programming. In Java you build it with abstract classes and interfaces. Below you will see what abstraction means, why large programs depend on it, how Java enforces it, and how it differs from encapsulation, a pillar that often gets confused with it.

## What is Abstraction?

> **Definition:** Abstraction is the principle of showing only the essential operations of an object, the *what*, while hiding the implementation details, the *how*. In Java it is achieved with abstract classes and interfaces, which declare methods that concrete classes must implement.

An abstract class is a class marked `abstract`. You cannot create objects of it directly, and it can contain abstract methods, which have a signature but no body. It can also hold normal fields, constructors and finished methods.

An interface is a pure contract. It lists methods a class promises to provide, and any class, from any family tree, can sign that contract with `implements`.

In both cases the caller works with the general type and calls methods like `turnOn()`. The details live in concrete classes, such as `SmartBulb` or `SmartLock`, which the caller never has to know about.

## Why is Abstraction used?

- **Simpler code for the caller.** A home hub calls `turnOn()` on any device. It does not care about dimmer circuits or lock motors.
- **Freedom to change internals.** A bulb maker can rewrite its firmware logic, and no caller breaks, because the `turnOn()` contract stays the same.
- **Easy to add new types.** A new smart curtain only has to implement the shared methods to work with the existing hub.
- **Enforced completeness.** The compiler refuses a concrete class that forgets to implement an abstract method, so no device ships half-finished.
- **Better teamwork.** One team can write the hub against the abstract type while other teams build the devices in parallel.

## Real-Life Example

Think of a lift in an apartment building. The panel shows buttons for floors, a door-open button and an alarm. That is the whole public view. You press 7, and some time later the doors open on the seventh floor.

Behind the panel sits a lot of machinery: a controller that queues requests from every floor, a motor, cables, counterweights, brakes and sensors that check the doors are clear. None of it appears on the panel, and you do not need it to use the lift. The lift company can even replace the motor with a newer model, and your way of using the lift stays exactly the same.

In Java, the panel is the abstract class or interface: the methods you are allowed to call. The machinery is the concrete class that implements those methods. Replacing the motor is like rewriting a method body without changing its signature.

## Syntax

```java
abstract class Device {
    String name;

    Device(String name) {
        this.name = name;
    }

    abstract void turnOn();        // what, no body

    void report() {                // shared, finished
        System.out.println(name + " is online");
    }
}

class Bulb extends Device {
    Bulb(String name) {
        super(name);
    }

    @Override
    void turnOn() {                // how
        // real details here
    }
}

interface Schedulable {
    void runAt(String time);       // abstract by default
}
```

Here is what each piece means:

- `abstract class Device` cannot be used with `new`. It exists to be extended.
- It can still have fields and a constructor, which child classes call through `super(name)`.
- `abstract void turnOn();` ends with a semicolon instead of a body. Every concrete subclass must supply one.
- `report()` is an ordinary method that all devices share without rewriting it.
- `Bulb` is concrete because it implements every abstract method it inherits.
- `interface Schedulable` declares a capability. Its methods are public and abstract unless you write a default or static body.

## How Abstraction Works

Abstraction has two sides: rules that the compiler checks, and a method call that the JVM completes at runtime.

```text
   HomeHub (caller)
          |
          | calls turnOn()
          v
+------------------------+
| SmartDevice (abstract) |
| turnOn();  the what    |
+------------------------+
          |
          | JVM finds the
          | real object
          v
+------------------------+
| SmartBulb              |
| turnOn() { ... }       |
| dim to 80%  the how    |
+------------------------+
```

At compile time, `HomeHub` sees only `SmartDevice`, so it can call only the methods declared there. The compiler also checks the other side of the deal: `SmartBulb` must implement `turnOn()`, or it must be marked `abstract` itself. When the program runs, the variable points to a real `SmartBulb` object on the heap, and the JVM runs that class's `turnOn()` through dynamic method dispatch. The caller stays unaware of the details, which is the whole point.

## Example Programs

### Example 1: An Abstract Class for Smart Devices

```java
abstract class SmartDevice {
    private final String room;

    SmartDevice(String room) {
        this.room = room;
    }

    abstract String turnOn();

    void activate() {
        System.out.println(room + ": " + turnOn());
    }
}

class SmartBulb extends SmartDevice {
    SmartBulb(String room) {
        super(room);
    }

    @Override
    String turnOn() {
        return "bulb glowing at 80%";
    }
}

class SmartLock extends SmartDevice {
    SmartLock(String room) {
        super(room);
    }

    @Override
    String turnOn() {
        return "lock armed, bolt out";
    }
}

public class NightMode {
    public static void main(String[] args) {
        SmartDevice[] devices = {
            new SmartBulb("Bedroom"),
            new SmartLock("Front door")
        };
        for (SmartDevice d : devices) {
            d.activate();
        }
    }
}
```

**Output:**

```text
Bedroom: bulb glowing at 80%
Front door: lock armed, bolt out
```

`activate()` is written once in the abstract class, yet each line shows the details of a different device. Writing `new SmartDevice("Hall")` here would not compile.

### Example 2: Abstraction Through an Interface

```java
interface Switchable {
    String on();
    String off();
}

class Geyser implements Switchable {
    public String on() {
        return "Geyser heating to 45 C";
    }

    public String off() {
        return "Geyser idle";
    }
}

class Curtain implements Switchable {
    public String on() {
        return "Curtain opening";
    }

    public String off() {
        return "Curtain closed";
    }
}

class HomeHub {
    void morning(Switchable[] items) {
        for (Switchable s : items) {
            System.out.println(s.on());
        }
    }
}

public class MorningRoutine {
    public static void main(String[] args) {
        Switchable[] items = { new Geyser(), new Curtain() };
        new HomeHub().morning(items);
        System.out.println(items[0].off());
    }
}
```

**Output:**

```text
Geyser heating to 45 C
Curtain opening
Geyser idle
```

`HomeHub` only knows the `Switchable` contract. A new device class can join the morning routine without a single change to the hub.

### Example 3: Abstraction and Encapsulation Together

```java
abstract class DoorLock {
    abstract boolean unlock(String pin);
}

class KeypadLock extends DoorLock {
    private String pin = "4821";
    private int failedTries = 0;

    @Override
    boolean unlock(String attempt) {
        if (failedTries >= 2) {
            return false;
        }
        if (pin.equals(attempt)) {
            failedTries = 0;
            return true;
        }
        failedTries++;
        return false;
    }
}

public class LockTest {
    public static void main(String[] args) {
        DoorLock lock = new KeypadLock();
        System.out.println("1111 -> " + lock.unlock("1111"));
        System.out.println("4821 -> " + lock.unlock("4821"));
        System.out.println("0000 -> " + lock.unlock("0000"));
        System.out.println("9999 -> " + lock.unlock("9999"));
        System.out.println("4821 -> " + lock.unlock("4821"));
    }
}
```

**Output:**

```text
1111 -> false
4821 -> true
0000 -> false
9999 -> false
4821 -> false
```

The abstract `unlock` method is the abstraction: callers know only that a lock can be unlocked with a PIN. The private `pin` and `failedTries` fields are the encapsulation: no caller can read the PIN or reset the counter, so the lock stays shut after two wrong tries.

## Abstraction vs Encapsulation

| Point | Abstraction | Encapsulation |
|---|---|---|
| Hides | How a task is done | The object's data |
| Focus | Design, the contract | Protection, the state |
| Java tools | Abstract classes, interfaces | Private fields, getters |
| Question | What can it do? | Who can touch its data? |

The two work together. Abstraction decides which operations the outside world sees, and encapsulation guards the data those operations use.

## Common Mistakes

> **Common mistake:** Trying to create an object of an abstract class with `new SmartDevice("Hall")`. The compiler rejects it. Create a concrete subclass, or use an anonymous class if you need a quick one-off version.

- **Forgetting to implement an abstract method.** The subclass then fails to compile unless it is also marked `abstract`.
- **Writing a body for an abstract method.** `abstract void turnOn() { }` is a compile error; an abstract method ends with a semicolon.
- **Leaking details through the abstract type.** Methods like `setPwmDutyCycle()` on a general `SmartDevice` expose the *how* and defeat the purpose.
- **Weakening access in an interface implementation.** Interface methods are public, so the implementing method must be `public` too.
- **Mixing up the two pillars.** Making fields private is encapsulation; on its own it does not give you abstraction.

## Interview Questions

**What is abstraction in Java?**
It is the practice of exposing only what an object does while hiding how it does it. Java supports it with abstract classes and interfaces, which define methods that concrete classes implement.

**Can an abstract class have a constructor?**
Yes. You cannot call it with `new` directly, but subclasses call it through `super(...)` to set up the shared fields, as `SmartDevice` does with the room name.

**Can an abstract class exist without any abstract methods?**
Yes. Marking a class `abstract` simply prevents direct instances. This is useful for a base class that should only ever be used through its subclasses.

**How is abstraction different from encapsulation?**
Abstraction hides implementation complexity behind a simple contract and is about design. Encapsulation hides the internal state behind access control and is about protecting data. A well-built class uses both.

**When would you choose an interface over an abstract class for abstraction?**
Use an interface when unrelated classes need to share a capability, or when a class needs several such roles, since a class can implement many interfaces. Use an abstract class when related classes share state or common code.

## Summary

- Abstraction shows the *what* and hides the *how*.
- Java achieves it with abstract classes and interfaces.
- An abstract class cannot be instantiated and may mix abstract and finished methods.
- Concrete subclasses must implement every abstract method, and the compiler checks it.
- At runtime the JVM runs the real object's implementation through the abstract reference.
- Encapsulation protects data, abstraction simplifies use, and they work best together.

## Related Topics

- [Abstract Class](/learning/java-tutorial/abstract-class): every rule of abstract classes in detail.
- [Interface](/learning/java-tutorial/interface): contracts that any class can implement.
- [Encapsulation](/learning/java-tutorial/encapsulation): the pillar that protects an object's data.
