A traffic signal at a busy junction can show only three lights: red, yellow and green. The controller box will never flash purple, and no driver needs to wonder what a "light number 7" means. Early Java programs modelled such fixed choices with plain `int` constants like `RED = 0`, and nothing stopped someone from passing 7. Enums fix this by letting you list the only values that can ever exist.

Here you will see what an enum really is, how to give it fields, a constructor and methods, how `values()`, `valueOf()` and `ordinal()` behave, how to switch on it, and how the compiler turns a short enum into a full class. You will also meet `EnumMap`, the fastest map for enum keys.

## What is Enum?

> **Definition:** An enum is a special kind of class that declares a fixed set of named constants. Each constant is a real object of that enum type, created exactly once by the JVM, and no other instances can ever be made.

Key facts to remember:

- You declare it with the `enum` keyword instead of `class`.
- Every enum automatically extends `java.lang.Enum`, so it cannot extend any other class. It can still implement interfaces.
- Each constant has a name, like `RED`, and a position called its ordinal, starting at 0.
- Enum constants can hold fields and have methods, just like normal objects.

## Why is Enum used?

Picture a method `setLight(int light)` in a traffic controller. A caller can pass 0, 1, 2 or any other number, and the compiler cannot help. With `setLight(Signal light)`, only `Signal.RED`, `Signal.YELLOW` and `Signal.GREEN` are allowed. A wrong value will not even compile.

Enums bring more than safety:

- **Readable code.** `Signal.GREEN` says far more than `2`.
- **Behaviour in one place.** Each light can carry its own duration and know which light comes next.
- **Safe comparison.** Since each constant exists once, `==` is the right way to compare them.
- **Switch support.** You can switch on an enum and name the constants directly.
- **Fast collections.** `EnumMap` and `EnumSet` use arrays and bit masks inside, so they are quicker and smaller than hash-based collections.

## Real-Life Example

Think of the metal board inside a signal controller. It has exactly three bulb sockets, fixed at the factory. Each socket carries a small plate: "RED, 45 s", "YELLOW, 5 s", "GREEN, 40 s". Each plate also says which bulb to switch to next. Nobody can add a fourth socket while the signal is running.

Map it back to Java: the board is the enum type, each socket is a constant, the text on the plate is the constant's fields, and "switch to next" is a method. Being fixed at the factory is what the compiler guarantees: all instances are created when the class loads, and no one can create more later.

## Syntax

```java
enum Signal {
    RED(45), YELLOW(5), GREEN(40);   // the constants

    private final int seconds;       // a field

    Signal(int seconds) {            // private constructor
        this.seconds = seconds;
    }

    int getSeconds() {               // a method
        return seconds;
    }
}

Signal now = Signal.RED;             // use a constant
```

- The first line lists the constants. The numbers in brackets are passed to the constructor. A semicolon ends the list when more members follow.
- Fields hold data for each constant. Making them `final` keeps the constants immutable.
- The constructor is always private, even if you do not write `private`. You can never call `new Signal(...)`.
- Methods work like in any class. Each constant runs them with its own field values.
- You refer to a constant through the type name, `Signal.RED`.

## How Enum Works

An enum is a shortcut. The compiler expands it into a normal class with some generated parts.

```text
enum Signal {
  RED, YELLOW, GREEN }
        |
        v
javac generates:
final class Signal
  extends Enum<Signal>
        |
        v
public static final fields:
  RED, YELLOW, GREEN
private static final
  Signal[] $VALUES
        |
        v
static block, runs once:
RED = new Signal("RED", 0)
YELLOW = new Signal(..., 1)
GREEN = new Signal(..., 2)
        |
        v
values()  -> copy of $VALUES
valueOf() -> find by name
```

The compiler makes `Signal` a `final` class that extends `Enum<Signal>` (it drops `final` only when some constant has its own body). Each constant becomes a `public static final` field. A static block, which runs once when the class is first used, creates one object per constant and passes it the constant's name and ordinal, plus your own constructor arguments. The objects are also stored in a hidden array.

The compiler writes `values()` to return a fresh copy of that array, in declaration order, and `valueOf(String)` to find a constant by its exact name. When a constant has its own body with `{ }`, the compiler creates a small anonymous subclass for it, which is how each constant can override a method. The JVM also blocks reflection and deserialization from making extra copies, so the constants stay the only instances.

## Example Programs

### Signals with fields and built-in methods

```java
enum Signal {
    RED(45), YELLOW(5), GREEN(40);

    private final int seconds;

    Signal(int seconds) {
        this.seconds = seconds;
    }

    int getSeconds() {
        return seconds;
    }
}

public class JunctionTimer {
    public static void main(String[] args) {
        int cycle = 0;
        for (Signal s : Signal.values()) {
            System.out.println(s.ordinal() + " " + s.name()
                    + " for " + s.getSeconds() + " s");
            cycle += s.getSeconds();
        }
        System.out.println("Full cycle: " + cycle + " s");

        Signal parsed = Signal.valueOf("GREEN");
        System.out.println("Parsed: " + parsed
                + ", same object? " + (parsed == Signal.GREEN));

        try {
            Signal.valueOf("green");
        } catch (IllegalArgumentException e) {
            System.out.println("No constant named green");
        }
    }
}
```

**Output:**

```text
0 RED for 45 s
1 YELLOW for 5 s
2 GREEN for 40 s
Full cycle: 90 s
Parsed: GREEN, same object? true
No constant named green
```

`values()` returned the constants in the order they were declared, and `ordinal()` gave their positions. `valueOf` returned the same single `GREEN` object, but it is case-sensitive, so "green" failed.

### Switch and a method per constant

```java
enum Light {
    RED {
        Light next() { return GREEN; }
    },
    YELLOW {
        Light next() { return RED; }
    },
    GREEN {
        Light next() { return YELLOW; }
    };

    abstract Light next();
}

public class SignalCycle {
    static String advice(Light light) {
        switch (light) {
            case RED:
                return "Stop";
            case YELLOW:
                return "Slow down";
            case GREEN:
                return "Go";
            default:
                return "Unknown";
        }
    }

    public static void main(String[] args) {
        Light current = Light.RED;
        for (int tick = 1; tick <= 4; tick++) {
            System.out.println(tick + ": " + current + " -> "
                    + advice(current));
            current = current.next();
        }
    }
}
```

**Output:**

```text
1: RED -> Stop
2: GREEN -> Go
3: YELLOW -> Slow down
4: RED -> Stop
```

Each constant overrides the abstract `next()` method in its own body, so the cycle logic lives with the light itself. Inside the `switch`, the case labels use the bare names `RED`, `YELLOW` and `GREEN`, without the `Light.` prefix.

### Counting red-light jumps with EnumMap

```java
import java.util.EnumMap;
import java.util.Map;

enum Lamp { RED, YELLOW, GREEN }

public class CameraLog {
    public static void main(String[] args) {
        Lamp[] crossings = {Lamp.GREEN, Lamp.RED, Lamp.GREEN,
                Lamp.YELLOW, Lamp.RED, Lamp.GREEN, Lamp.RED};

        Map<Lamp, Integer> count = new EnumMap<>(Lamp.class);
        for (Lamp l : crossings) {
            count.merge(l, 1, Integer::sum);
        }
        System.out.println("Log: " + count);
        System.out.println("Red jumps: " + count.get(Lamp.RED));
        System.out.println("RED before GREEN? "
                + (Lamp.RED.compareTo(Lamp.GREEN) < 0));
    }
}
```

**Output:**

```text
Log: {RED=3, YELLOW=1, GREEN=3}
Red jumps: 3
RED before GREEN? true
```

`EnumMap` stores its values in an array indexed by ordinal, so it always prints keys in declaration order, whatever order the cars arrived in. Enums also implement `Comparable`, and they compare by ordinal.

## Enum vs int Constants

| Point | `int` constants | `enum` |
|---|---|---|
| Wrong value | Any number compiles | Compile error |
| Printing | Shows `0`, `1`, `2` | Shows `RED`, `GREEN` |
| Extra data | Separate arrays | Fields on each constant |
| Listing all | Written by hand | `values()` |
| Behaviour | `if` chains elsewhere | Methods on the constant |

Plain `int` constants are fine for real numbers such as a speed limit. For a closed set of choices, an enum is safer and easier to read.

## Common Mistakes

> **Common mistake:** Saving `ordinal()` values in a file or database. If someone later adds a constant in the middle of the list, every stored number now points to a different constant. Save `name()` instead.

- **Wrong case in `valueOf`.** `Signal.valueOf("red")` throws `IllegalArgumentException`, because names must match exactly. Convert the input with `toUpperCase()` first.
- **Qualified case labels.** `case Signal.RED:` does not compile in Java 11. Write `case RED:`.
- **Comparing by name text.** `s.name().equals("RED")` works but is slow and fragile. Use `s == Signal.RED`.
- **Mutable fields.** A setter on an enum changes a constant shared by the whole program. Keep enum fields `final`.

## Interview Questions

**Can an enum extend another class?**
No. Every enum already extends `java.lang.Enum`, and Java allows only one parent class. An enum can implement any number of interfaces, though, and each constant can provide its own implementation.

**Why is an enum constructor private?**
The set of constants must stay fixed. If code outside the enum could call the constructor, it could create new instances, and the guarantee of exactly one object per constant would break. So the compiler treats every enum constructor as private.

**Where do values() and valueOf() come from?**
The compiler generates them for each enum. `values()` returns a new copy of the internal array of constants in declaration order, and `valueOf(String)` returns the constant with that exact name or throws `IllegalArgumentException`.

**Is it safe to compare enum values with ==?**
Yes. Each constant is a single object created once, so `==` is correct, fast and even `null`-safe. `equals` gives the same answer, but `==` also catches type mistakes at compile time.

**Why is EnumMap faster than HashMap for enum keys?**
`EnumMap` knows the full set of keys in advance, so it stores values in a plain array indexed by `ordinal()`. There is no hashing and no collision handling, and the keys always stay in declaration order.

## Summary

- An enum is a class with a fixed set of named constant objects.
- Constants can have fields, a private constructor and methods.
- `values()`, `valueOf()`, `name()` and `ordinal()` come built in.
- The compiler makes the enum a final class with `static final` instances.
- Switch on enums with bare names, and compare constants with `==`.
- Use `EnumMap` and `EnumSet` for fast, ordered collections of enum keys.

## Related Topics

- [Switch](/learning/java-tutorial/switch): how `switch` statements work with enums and other types.
- [Final Keyword](/learning/java-tutorial/final-keyword): what `final` means for classes and fields like enum constants.
- [Static Keyword](/learning/java-tutorial/static-keyword): how the `static` fields behind each constant are created.
