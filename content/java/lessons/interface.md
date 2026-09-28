Your phone can play music through headphones from almost any brand. A cheap pair from a street market and an expensive pair from a big company both connect, pair and play. The phone does not know how each headset works inside. It only relies on a shared standard, Bluetooth, that both sides agreed to follow.

A Java interface is that kind of standard for classes. It writes down a set of methods, and any class that promises to follow it can be used wherever the interface is expected. Here we will build parts of a music player to see how interfaces work, including default, static and private methods, constants, multiple interfaces and functional interfaces.

## What is an Interface?

> **Definition:** An interface is a reference type that declares a contract: a set of abstract methods, plus optional constants and, since Java 8 and 9, default, static and private methods. A class accepts the contract with `implements` and must then provide a body for every abstract method.

Think of an interface as a list of abilities. `Playable` says "this thing can play and stop". `Downloadable` says "this thing can be saved offline". A song can have both abilities, while a live radio stream has only the first.

An interface has a few fixed rules:

- Methods without a body are automatically `public abstract`.
- Fields are automatically `public static final`, so they are constants.
- You cannot create an interface object with `new`, but you can declare variables of the interface type.
- A class can implement many interfaces, and an interface can extend other interfaces.

## Why is an Interface used?

- **A clear contract.** Everyone knows exactly which methods an implementing class offers, so teams can work against the interface before the classes even exist.
- **Multiple roles.** A class has one parent class but can implement many interfaces, so it can be both `Playable` and `Downloadable`.
- **Loose coupling.** A player that accepts `Playable` works with songs, podcasts and audiobooks, including types written next year.
- **Easy testing.** You can swap a real implementation for a simple fake one that follows the same interface.
- **Evolving APIs.** Default methods let a library add new behaviour to an interface without breaking the classes that already implement it.

## Real-Life Example

Go back to Bluetooth. The standard lists what a device must do: announce itself, pair, receive audio and report its battery level. Each headphone maker builds these abilities in its own way, with its own chips and code. The phone talks only in the language of the standard, so it works with all of them.

Mapped to Java, the Bluetooth standard is the interface. Each headphone model is a class that implements it. The phone's code holds a variable of the interface type and calls its methods. Some features, such as a basic volume curve, come built into the standard so makers do not have to write them; those are like default methods. A single headset may also follow other standards, such as a charging standard, just as a class can implement several interfaces.

## Syntax

```java
interface Playable {
    int MAX_VOLUME = 100;            // public static final

    void play();                     // public abstract

    default String info() {          // Java 8
        return tag() + " track";
    }

    static Playable silence() {      // Java 8
        return () -> { };
    }

    private String tag() {           // Java 9
        return "[audio]";
    }
}

class Song implements Playable, Comparable<Song> {
    public void play() { /* body */ }
    public int compareTo(Song o) { return 0; }
}
```

Line by line:

- `MAX_VOLUME` is a constant. Every implementing class can read it, but no class can change it.
- `play()` has no body, so each class must write one, and it must be `public`.
- A `default` method has a body that implementing classes receive for free and may override.
- A `static` method belongs to the interface itself and is called as `Playable.silence()`.
- A `private` method is a helper that only the interface's own default and static methods can use.
- `implements Playable, Comparable<Song>` shows one class signing two contracts at once.

## How an Interface Works

When you call a method through an interface variable, the compiler and the JVM share the work, much like any overridden method call.

```text
Playable p = new Podcast();
p.info();
        |
        v
Compiler: does Playable
declare info()? Yes
        |
        v
Runtime: JVM checks the
real class -> Podcast
        |
        v
Podcast overrides info()?
        |
   yes  |  no
   v    |   v
Podcast  | default body
version  | in Playable
```

The compiler only checks that `Playable` declares the method, so the line compiles. At runtime the JVM uses a special bytecode instruction, `invokeinterface`, to find the method in the real object's class. If `Podcast` wrote its own `info()`, that version runs. If it did not, the JVM falls back to the default body in the interface. Abstract methods never need this fallback, because the compiler already forced every concrete class to implement them.

## Example Programs

### Example 1: One Class, Two Interfaces

```java
interface Playable {
    int MAX_VOLUME = 100;
    String play();
}

interface Downloadable {
    String download();
}

class Song implements Playable, Downloadable {
    private final String title;

    Song(String title) {
        this.title = title;
    }

    public String play() {
        return "Playing song: " + title;
    }

    public String download() {
        return "Saved offline: " + title;
    }
}

class RadioStream implements Playable {
    public String play() {
        return "Streaming FM 91.1";
    }
}

public class PlayerDemo {
    public static void main(String[] args) {
        Playable[] queue = { new Song("Monsoon"), new RadioStream() };
        for (Playable p : queue) {
            System.out.println(p.play());
        }
        Downloadable d = new Song("Rooftop");
        System.out.println(d.download());
        System.out.println("Max volume " + Playable.MAX_VOLUME);
    }
}
```

**Output:**

```text
Playing song: Monsoon
Streaming FM 91.1
Saved offline: Rooftop
Max volume 100
```

`Song` fits into both a `Playable` array and a `Downloadable` variable, while `RadioStream` signs only one contract. The constant is read through the interface name.

### Example 2: Default, Static and Private Methods

```java
interface Equalizer {
    String preset();

    default String describe() {
        return label() + " preset " + preset();
    }

    static Equalizer flat() {
        return new FlatEq();
    }

    private String label() {
        return "EQ";
    }
}

class FlatEq implements Equalizer {
    public String preset() {
        return "Flat";
    }
}

class BassBoost implements Equalizer {
    public String preset() {
        return "Bass +6";
    }

    @Override
    public String describe() {
        return "Custom: " + preset();
    }
}

public class EqualizerDemo {
    public static void main(String[] args) {
        Equalizer a = Equalizer.flat();
        Equalizer b = new BassBoost();
        System.out.println(a.describe());
        System.out.println(b.describe());
    }
}
```

**Output:**

```text
EQ preset Flat
Custom: Bass +6
```

`FlatEq` never wrote `describe()`, so it got the default body, which used the private helper. `BassBoost` overrode the default, and the JVM ran its version instead.

### Example 3: A Functional Interface with Lambdas

```java
import java.util.ArrayList;
import java.util.List;

@FunctionalInterface
interface TrackFilter {
    boolean keep(String title, int seconds);
}

public class PlaylistFilter {
    static List<String> apply(String[] titles, int[] secs,
                              TrackFilter f) {
        List<String> out = new ArrayList<>();
        for (int i = 0; i < titles.length; i++) {
            if (f.keep(titles[i], secs[i])) {
                out.add(titles[i]);
            }
        }
        return out;
    }

    public static void main(String[] args) {
        String[] titles = {"Dawn", "Highway", "Lullaby", "Drift"};
        int[] secs = {185, 320, 140, 260};
        TrackFilter shortOnes = (t, s) -> s < 200;
        TrackFilter startsWithD = (t, s) -> t.startsWith("D");
        System.out.println(apply(titles, secs, shortOnes));
        System.out.println(apply(titles, secs, startsWithD));
    }
}
```

**Output:**

```text
[Dawn, Lullaby]
[Dawn, Drift]
```

`TrackFilter` has exactly one abstract method, so a lambda can stand in for a whole implementing class. `@FunctionalInterface` makes the compiler enforce that single-method rule.

## Common Mistakes

> **Warning:** Leaving out `public` when you implement an interface method. Interface methods are public, and an implementation with default package access narrows that, so the class fails to compile with an "attempting to assign weaker access privileges" error.

- **Trying to change a constant.** `Playable.MAX_VOLUME = 80;` does not compile, because interface fields are final.
- **Calling a static interface method through an object.** Write `Equalizer.flat()`, not `a.flat()`; static interface methods are not inherited by implementing classes.
- **Ignoring a default method clash.** If two interfaces give the same default method, the class must override it, and it can pick one with `Playable.super.info()`.
- **Adding a second abstract method to a functional interface.** Every lambda written for it breaks at once.

## Interview Questions

**Can an interface have method bodies?**
Yes, since Java 8 it can have default and static methods with bodies, and since Java 9 it can have private methods. Abstract methods still have no body and must be implemented by the class.

**Why were default methods added in Java 8?**
They let library authors add new methods to existing interfaces without breaking every class that already implements them. The collections framework used this to add methods such as `forEach` to `Iterable`.

**How does Java resolve a call made through an interface reference?**
The compiler checks that the interface declares the method. At runtime the JVM finds the method in the real object's class; if the class does not override a default method, the interface's default body runs.

**What happens if a class implements two interfaces with the same default method?**
The code does not compile until the class overrides that method. Inside the override it can call a specific version with `InterfaceName.super.method()`.

**What is a functional interface?**
It is an interface with exactly one abstract method, such as `Runnable` or `Comparator`. Its instances can be written as lambdas or method references, and `@FunctionalInterface` asks the compiler to check the rule.

## Summary

- An interface is a contract that classes accept with `implements`.
- Abstract methods are public, and fields are public static final constants.
- Java 8 added default and static methods; Java 9 added private helpers.
- A class can implement many interfaces, which gives Java multiple inheritance of type.
- Calls through an interface reference run the real object's method, or the default body.
- A functional interface has one abstract method and can be implemented with a lambda.

## Related Topics

- [Abstraction](/learning/java-tutorial/abstraction): the design idea that interfaces put into practice.
- [Abstract Class](/learning/java-tutorial/abstract-class): the other tool for sharing a contract.
- [Functional Interfaces](/learning/java-tutorial/functional-interfaces): the built-in ones in java.util.function.
- [Lambda Expressions](/learning/java-tutorial/lambda-expressions): short syntax for one-method interfaces.
