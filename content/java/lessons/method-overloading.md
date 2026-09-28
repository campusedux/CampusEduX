Open a fitness tracker app and tap "Log workout". Sometimes you enter just the minutes. Sometimes you add the distance too. On a hiking day you may also type the height you climbed. It is still one button with one name, yet it quietly accepts three different sets of details.

Java lets you design methods the same way. You can give several methods one shared name, as long as each takes a different set of parameters. This is called method overloading. In this guide you will learn the rules, see how the compiler chooses the right version, and learn the tricky cases that interviewers love to ask about.

## What is Method Overloading?

> **Definition:** Method overloading means declaring two or more methods with the same name in the same class, where each method has a different parameter list. The compiler picks which one to call by looking at the arguments.

The parameter lists must differ in at least one of these ways:

- **Count.** `log(int)` and `log(int, double)` take one and two values.
- **Type.** `log(int)` and `log(double)` take different kinds of values.
- **Order.** `log(int, String)` and `log(String, int)` list the same types in a different order.

The return type does not count. Two methods that differ only in what they return cause a compile error, because a call like `log(30);` gives Java no way to tell them apart. Parameter names do not count either. Access modifiers and thrown exceptions may differ, but they never make an overload on their own.

## Why is Method Overloading used?

Without overloading you would invent a new name for every small variation: `logMinutes`, `logMinutesAndKm`, `logMinutesKmAndClimb`. That becomes hard to remember and messy to read.

- **One clear name for one idea.** Callers remember `log`, and the right version is chosen for them.
- **Sensible defaults.** A short version can call the fuller version and fill in default values.
- **Support for many types.** The JDK itself does this. `System.out.println` has separate versions for `int`, `double`, `char`, `String` and more.
- **Flexible constructors.** Constructors are overloaded all the time, so objects can be built with more or fewer details.
- **No runtime cost.** The choice is made while compiling, so the running program pays nothing extra.

## Real-Life Example

Think of a gym reception desk with a single "Check in" service. A member can check in by showing a card. A guest can check in by giving a name and a phone number. A trainer can check in with a staff ID and a shift time. The receptionist hears "check in" every time, but looks at what you hand over to decide which process to follow.

In Java, "check in" is the method name, the things you hand over are the arguments, and the receptionist is the compiler. It inspects the number, types and order of the arguments and sends the call to the matching version. Note that the receptionist decides before you walk in, based on what you are carrying, not while you are inside. That is why overloading is called compile-time polymorphism.

## Syntax

```java
class ClassName {
    returnType name(TypeA a) {
        // version one
    }

    returnType name(TypeA a, TypeB b) {
        // more parameters
    }

    returnType name(TypeB b, TypeA a) {
        // same types, different order
    }

    returnType name(TypeA... many) {
        // any number of values
    }
}
```

Here is how to read it:

- All four methods share `name`, so they are overloads of each other.
- The first two differ in how many parameters they take.
- The second and third take the same two types in a different order, which is allowed.
- The last one uses varargs (`...`), which accepts zero or more values as an array.
- The return type may be the same or different, but it is never what separates them.

## How Method Overloading Works

The compiler, not the JVM, resolves an overloaded call. It collects every method with the right name, then tries to match the arguments in three phases. It stops at the first phase that finds a match.

```text
 call: steps(900)  (int)
            |
            v
 Phase 1: exact type, then
 widening (int -> long)
 no boxing, no varargs
            |  nothing fits?
            v
 Phase 2: allow boxing
 (int -> Integer)
            |  nothing fits?
            v
 Phase 3: allow varargs
 (int -> int...)
            |  nothing fits?
            v
 compile error
```

In the first phase an exact type match is the most specific choice, so it wins. If there is no exact match, primitive widening such as `int` to `long` or `double` is accepted. Only when nothing fits does Java try boxing an `int` into an `Integer`, and varargs is the last resort. If two methods fit equally well in the same phase, the compiler reports an "ambiguous" error instead of guessing.

## Example Programs

### Count, Type and Order

```java
class FitnessTracker {
    void log(int minutes) {
        System.out.println("Walk " + minutes + " min");
    }

    void log(int minutes, double km) {
        System.out.println("Run " + minutes + " min, "
            + km + " km");
    }

    void log(String sport, int minutes) {
        System.out.println(sport + " " + minutes + " min");
    }

    void log(int minutes, String sport) {
        System.out.println(minutes + " min of " + sport);
    }
}

public class WorkoutLog {
    public static void main(String[] args) {
        FitnessTracker band = new FitnessTracker();
        band.log(30);
        band.log(25, 4.2);
        band.log("Yoga", 40);
        band.log(15, "Skipping");
    }
}
```

**Output:**

```text
Walk 30 min
Run 25 min, 4.2 km
Yoga 40 min
15 min of Skipping
```

Four calls, one name, four different methods. The last two prove that the order of parameter types is enough to tell overloads apart.

### How the Compiler Picks a Version

```java
class Sensor {
    void pulse(int v)   { System.out.println("pulse: int"); }
    void pulse(long v)  { System.out.println("pulse: long"); }

    void steps(long v)    { System.out.println("steps: long"); }
    void steps(Integer v) { System.out.println("steps: Integer"); }

    void kcal(Integer v) { System.out.println("kcal: Integer"); }
    void kcal(int... v)  { System.out.println("kcal: varargs"); }

    void laps(int... v) {
        System.out.println("laps: " + v.length + " values");
    }
}

public class OverloadPicker {
    public static void main(String[] args) {
        Sensor s = new Sensor();
        s.pulse(72);
        s.steps(900);
        s.kcal(250);
        s.laps(1, 2, 3);
        s.laps();
    }
}
```

**Output:**

```text
pulse: int
steps: long
kcal: Integer
laps: 3 values
laps: 0 values
```

Every argument here is an `int`. An exact match beats widening, widening to `long` beats boxing to `Integer`, and boxing beats varargs. A varargs method even accepts zero arguments.

### Overloaded Constructors with Defaults

```java
class Workout {
    private final String type;
    private final int minutes;
    private final int climbMetres;

    Workout(String type) {
        this(type, 20);
    }

    Workout(String type, int minutes) {
        this(type, minutes, 0);
    }

    Workout(String type, int minutes, int climbMetres) {
        this.type = type;
        this.minutes = minutes;
        this.climbMetres = climbMetres;
    }

    int points() {
        return minutes * 2 + climbMetres / 10;
    }

    String card() {
        return type + " " + minutes + "m +" + climbMetres
            + " = " + points() + " pts";
    }
}

public class DailyPoints {
    public static void main(String[] args) {
        System.out.println(new Workout("Stretch").card());
        System.out.println(new Workout("Cycle", 45).card());
        System.out.println(new Workout("Hike", 90, 400).card());
    }
}
```

**Output:**

```text
Stretch 20m +0 = 40 pts
Cycle 45m +0 = 90 pts
Hike 90m +400 = 220 pts
```

The shorter constructors fill in default values and pass the work to the full one. Callers give only the details they have.

## Method Overloading vs Method Overriding

These two names sound alike but solve different problems.

| Point | Overloading | Overriding |
|---|---|---|
| Where | Same class (or inherited) | Parent and child class |
| Method name | Same | Same |
| Parameters | Must differ | Must be identical |
| Return type | Any | Same or a subtype |
| Decided at | Compile time | Runtime |
| Static methods | Can be overloaded | Cannot be overridden |
| Also called | Static polymorphism | Dynamic polymorphism |

A handy way to remember the difference: overloading adds new versions side by side, while overriding replaces an old version from the parent. The fitness tracker above has four `log` methods living together. In an overriding example, a child class would swap out the single `log` it inherited.

## Common Mistakes

> **Warning:** Changing only the return type does not create an overload. `int total(int a)` and `double total(int a)` in the same class fail with "method total(int) is already defined".

- **Relying on parameter names.** `log(int minutes)` and `log(int steps)` have the same signature, so the second one is a duplicate.
- **Creating ambiguous pairs.** With `fee(int, long)` and `fee(long, int)`, the call `fee(5, 5)` fits both equally, and the compiler refuses it.
- **Passing `null` to two reference overloads.** If both `show(String)` and `show(Integer)` exist, `show(null)` is ambiguous. Cast it, as in `show((String) null)`.
- **Expecting runtime choice.** The compiler chooses by the declared type of the argument, not the real object it holds at runtime.

## Interview Questions

**Can we overload a method by changing only its return type?**
No. The compiler identifies a method by its name and parameter list, which together form its signature. Two methods with the same signature are duplicates, whatever they return.

**Can the main method be overloaded?**
Yes. You can add `main(int x)` or any other version. The JVM still starts the program only from `public static void main(String[] args)`.

**Which is preferred: widening, boxing or varargs?**
Widening comes first, then boxing, then varargs. This order was kept so that code written before Java 5 behaves the same after boxing and varargs were added.

**Can static methods be overloaded?**
Yes. Overloading only needs a different parameter list, so static methods, instance methods and constructors can all be overloaded.

**Why is overloading called compile-time polymorphism?**
One name takes many forms, and the compiler fixes which form each call uses while compiling. The chosen method is written into the bytecode, so nothing is decided while the program runs.

## Summary

- Overloading means one method name with different parameter lists in the same class.
- Parameters must differ in count, type or order.
- Return type and parameter names never distinguish overloads.
- The compiler tries exact or widening first, then boxing, then varargs.
- Equally good matches cause an ambiguity error at compile time.
- Constructors and static methods can be overloaded too.

## Related Topics

- [Methods](/learning/java-tutorial/methods): parameters, return types and signatures explained.
- [Method Overriding](/learning/java-tutorial/method-overriding): the runtime cousin compared in the table.
- [Polymorphism](/learning/java-tutorial/polymorphism): where both techniques fit in the bigger picture.
- [Wrapper Classes](/learning/java-tutorial/wrapper-classes): the boxing step behind the second phase.
