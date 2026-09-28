When you check into a good hotel, the room is ready before you open the door. The bed is made, fresh towels are on the rack, the air conditioner is set and a key card is waiting at the desk. Nobody expects you to walk into an empty shell and arrange the furniture yourself.

Java objects deserve the same welcome. When your program creates an object, some code should run first to fill in its fields and make it ready for use. That code is the constructor. Here you will learn the kinds of constructors Java offers, how one constructor can call another, and what the JVM does, in order, between the word `new` and the moment your variable holds a finished object.

## What is a Constructor?

> **Definition:** A constructor is a special block of code that has the same name as its class and no return type. Java runs it automatically every time `new` creates an object, so the object starts life in a valid state.

A constructor looks a lot like a method, but it has three special traits. Its name must match the class name exactly. It has no return type, not even `void`. And you never call it by name like `room.HotelRoom()`; the `new` keyword calls it for you.

Java code works with three kinds of constructor:

- **Default constructor.** If you write no constructor at all, the compiler quietly adds an empty one with no parameters. It just calls the parent's constructor and leaves fields at their default values.
- **No-arg constructor.** A constructor you write yourself that takes no parameters but sets sensible starting values.
- **Parameterised constructor.** A constructor that takes arguments, so the caller decides the starting values.

## Why are Constructors used?

Without constructors, every object would begin with zeros and nulls, and the caller would have to remember to set each field by hand. Sooner or later someone forgets one, and a half-built object sneaks into the system.

Constructors fix this in several ways:

- **Guaranteed setup.** The code runs on every `new`, so no object can skip it.
- **Required values.** A parameterised constructor forces the caller to supply important data, such as a room number, at creation time.
- **Validation in one place.** You can reject bad input, like a negative price, before the object ever exists.
- **Immutable objects.** `final` fields can only be assigned once, and the constructor is the place to do it.
- **Less repeated code.** Constructor chaining lets several constructors share one block of setup logic.

## Real-Life Example

Think about housekeeping in a hotel. When a room is booked, the housekeeping team prepares it before the guest arrives. There is a standard routine for a walk-in guest: one bed, basic toiletries, the usual rate. That is the no-arg constructor. When a guest books ahead with special requests, such as an extra bed or a sea view, the team prepares the room to that order. That is the parameterised constructor.

The building itself must be in place before any room is prepared, just as a parent class is set up before its child class. And the key card is handed over only after the room is fully ready, the same way `new` hands your variable a reference only after the constructor has finished.

## Syntax

```java
class ClassName {
    Type field;

    ClassName() {                   // no-arg
        field = startingValue;
    }

    ClassName(Type field) {         // parameterised
        this.field = field;
    }

    ClassName(Type field, int x) {
        this(field);                // chain to another constructor
        // extra setup
    }
}

ClassName obj = new ClassName(value);
```

Read it line by line:

- `ClassName()` has the class name and no return type, which is what makes it a constructor.
- The first one takes no arguments and assigns fixed starting values.
- The second takes a parameter. `this.field` means the object's field, while plain `field` means the parameter with the same name.
- `this(field)` calls another constructor of the same class. It must be the very first statement.
- `new ClassName(value)` picks the constructor whose parameter list matches the arguments, exactly like method overloading.

## How Constructors Work

A lot happens between typing `new` and getting a usable object back. Here is the path the JVM follows.

```text
   new HotelRoom(305)
          |
          v
+--------------------------+
| Class loaded, if needed  |
+--------------------------+
          |
          v
+--------------------------+
| Heap memory reserved     |
+--------------------------+
          |
          v
+--------------------------+
| Fields set to defaults   |
| 0, 0.0, false, null      |
+--------------------------+
          |
          v
+--------------------------+
| this() or super() runs   |
+--------------------------+
          |
          v
+--------------------------+
| Field initialisers run   |
+--------------------------+
          |
          v
+--------------------------+
| Constructor body runs    |
+--------------------------+
          |
          v
+--------------------------+
| Reference returned       |
+--------------------------+
```

First the JVM makes sure the class is loaded. It then reserves space on the heap and fills every field with its default: numbers become zero, booleans become false and references become null. Next the constructor's first statement runs, which is either your `this(...)` call or a `super(...)` call, written by you or inserted by the compiler. Once the parent part of the object is ready, field initialisers such as `int beds = 1;` run, and then the rest of the constructor body. Only at the very end does the expression `new HotelRoom(305)` produce a reference that you can store in a variable.

This order explains a useful rule. You can never have both `this()` and `super()` in one constructor, because each one must be the first statement. A constructor that calls `this()` delegates the `super()` call to the constructor it chains into.

## Example Programs

### Example 1: No-Arg and Parameterised Constructors

```java
class HotelRoom {
    int number;
    String type;
    double rate;

    HotelRoom() {
        number = 101;
        type = "Standard";
        rate = 2500.0;
    }

    HotelRoom(int number, String type, double rate) {
        this.number = number;
        this.type = type;
        this.rate = rate;
    }

    String describe() {
        return "Room " + number + " " + type + " Rs " + rate;
    }
}

public class RoomDesk {
    public static void main(String[] args) {
        HotelRoom walkIn = new HotelRoom();
        HotelRoom booked = new HotelRoom(305, "Suite", 7800.0);
        System.out.println(walkIn.describe());
        System.out.println(booked.describe());
    }
}
```

**Output:**

```text
Room 101 Standard Rs 2500.0
Room 305 Suite Rs 7800.0
```

Both objects come from the same class, but `new` chose a different constructor for each, based on the arguments passed.

### Example 2: The Compiler's Default Constructor

```java
class Minibar {
    int bottles;
    boolean restocked;
    String brand;
}

public class MinibarCheck {
    public static void main(String[] args) {
        Minibar bar = new Minibar();
        System.out.println("bottles   = " + bar.bottles);
        System.out.println("restocked = " + bar.restocked);
        System.out.println("brand     = " + bar.brand);
    }
}
```

**Output:**

```text
bottles   = 0
restocked = false
brand     = null
```

`Minibar` declares no constructor, yet `new Minibar()` compiles, because the compiler added a default one. The printed values are the defaults the JVM wrote into memory before any constructor code ran.

### Example 3: Chaining with this() and super()

```java
class Floor {
    String name;

    Floor(String name) {
        this.name = name;
        System.out.println("Floor ready: " + name);
    }
}

class GuestRoom extends Floor {
    int beds;

    GuestRoom() {
        this(1);
        System.out.println("No-arg: default single bed");
    }

    GuestRoom(int beds) {
        super("Second");
        this.beds = beds;
        System.out.println("GuestRoom with " + beds + " bed(s)");
    }
}

public class ChainDemo {
    public static void main(String[] args) {
        new GuestRoom();
        System.out.println("---");
        new GuestRoom(2);
    }
}
```

**Output:**

```text
Floor ready: Second
GuestRoom with 1 bed(s)
No-arg: default single bed
---
Floor ready: Second
GuestRoom with 2 bed(s)
```

The no-arg constructor hands its work to the one-argument constructor with `this(1)`. That constructor first calls `super("Second")`, so the parent's line always prints before anything from `GuestRoom`.

## Constructor vs Method

| Point | Constructor | Method |
|---|---|---|
| Name | Same as the class | Any valid name |
| Return type | None, not even void | Must declare one |
| Called by | `new`, automatically | Your code, by name |
| Inherited | No | Yes, if accessible |
| Purpose | Set up a new object | Perform an action |

## Common Mistakes

> **Warning:** Adding a return type, even `void`, turns a constructor into an ordinary method. `void HotelRoom() {}` compiles without complaint, but `new` never runs it, so your fields silently stay at their defaults.

- **Losing the default constructor.** As soon as you write any constructor, the compiler stops adding the empty one. Code that still calls `new HotelRoom()` will fail to compile until you write a no-arg version yourself.
- **Forgetting `this.` on shadowed names.** Writing `rate = rate;` assigns the parameter to itself, and the field stays at 0.0.
- **Putting `this()` or `super()` second.** Either call must be the first line of the constructor, or the code does not compile.
- **Chaining in a circle.** If two constructors call each other with `this()`, the compiler reports a recursive constructor invocation.
- **Calling overridable methods from a constructor.** A subclass version may run before the subclass fields are set, and it will see zeros and nulls.

## Interview Questions

**Can a constructor have a return type?**
No. If you add one, Java treats the block as a normal method that happens to share the class name. It will not run when the object is created.

**When does the compiler add a default constructor?**
Only when the class declares no constructor at all. The generated constructor has no parameters, has the same access level as the class, and simply calls `super()`.

**What is the difference between this() and super() in a constructor?**
`this()` calls another constructor of the same class, which helps you reuse setup code. `super()` calls a constructor of the parent class. Both must be the first statement, so a single constructor can use only one of them.

**Can a constructor be private?**
Yes. A private constructor stops outside code from calling `new`. It is used in singletons, in classes that offer static factory methods, and in utility classes that should never be instantiated.

**Are constructors inherited or overridden?**
Neither. A subclass does not inherit its parent's constructors and cannot override them. It can overload its own constructors and reach the parent's constructors through `super()`.

## Summary

- A constructor has the class name, no return type, and runs automatically on `new`.
- Java has default, no-arg and parameterised constructors, and you can overload them.
- The compiler adds a default constructor only when you write none.
- `this()` chains to another constructor of the same class, and `super()` chains to the parent.
- The JVM reserves memory, sets field defaults, runs the chained call, runs field initialisers and then the body.
- Constructors are the right place for validation and for assigning `final` fields.

## Related Topics

- [Object](/learning/java-tutorial/object): how objects are created and used once they exist.
- [this Keyword](/learning/java-tutorial/this-keyword): more uses of `this`, beyond constructor chaining.
- [super Keyword](/learning/java-tutorial/super-keyword): calling parent constructors and methods.
- [Inheritance](/learning/java-tutorial/inheritance): why a parent is always built before its child.
