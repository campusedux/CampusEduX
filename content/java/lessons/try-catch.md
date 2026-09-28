A busy restaurant kitchen gets order slips all evening. Most are fine. Now and then a waiter writes "two" instead of "2", or forgets the table number. A good head chef does not shut the whole kitchen because of one messy slip. She sets that slip aside, sorts it out, wipes the counter and moves on to the next order.

That is exactly the job of `try-catch` in Java. It lets your program attempt some work, handle the problem if one appears, and keep serving. Here you will follow the path the program takes through `try`, `catch` and `finally`, learn how to write several catch blocks in the right order, combine them with `|`, and close resources automatically with try-with-resources.

## What is try-catch?

> **Definition:** `try-catch` is a Java statement that runs a block of code and, if that block throws an exception of a named type, jumps to a matching `catch` block that handles it. An optional `finally` block runs afterwards in every case.

The `try` block holds the risky statements. Each `catch` block names one exception type, or several joined with `|`, and holds the recovery code. The `finally` block holds cleanup work that must happen whether things went well or badly.

A `try` must be followed by at least one `catch` or a `finally`. It can also have both.

## Why is try-catch used?

When an exception is not caught, it travels up the call stack and can end the whole program. `try-catch` gives you a place to stop it.

- **Keep the program alive.** One bad input should not end a service that is handling many others.
- **Give helpful feedback.** You can turn a raw `NumberFormatException` into a message the user understands.
- **Different fixes for different problems.** Separate catch blocks let you treat a missing value differently from a wrong number.
- **Guaranteed cleanup.** `finally` and try-with-resources make sure burners, connections and locks are released.
- **Readable code.** The happy path sits in `try`; the rescue code sits apart in `catch`.

## Real-Life Example

Go back to the kitchen. The `try` block is the chef's normal plan: read the slip, cook the dish, plate it. A `catch` block is a rescue routine for one kind of problem. One routine handles "quantity written in words". Another handles "table number missing". The chef checks the routines from top to bottom and uses the first one that fits.

The `finally` block is wiping the counter. Whether the dish went out perfectly or the slip was sent back, the counter gets wiped before the next order.

Try-with-resources is the gas burner with an automatic shut-off. The chef turns it on at the start of an order, and the burner switches itself off when the order ends, even if a pan slips and the order fails.

## Syntax

```java
try {
    // risky statements
} catch (FirstException e) {
    // handle one specific type
} catch (SecondException | ThirdException e) {
    // handle two unrelated types the same way
} finally {
    // cleanup that always runs
}

try (Resource r = new Resource()) {
    // use r; r.close() is called for you
}
```

- `try { ... }` wraps the statements that might throw.
- Each `catch (Type e)` handles that type and all its subclasses. Java checks them from top to bottom.
- `catch (A | B e)` is a multi-catch. It handles either type with one block. `A` and `B` must not be parent and child.
- `finally { ... }` runs after the try or catch finishes, no matter how they finish.
- `try (Resource r = ...)` is try-with-resources. The class must implement `AutoCloseable`, and `close()` runs automatically at the end.

## How try-catch Works

Here is the path the JVM takes through a `try-catch-finally` statement.

```text
          order arrives
                |
                v
     +--------------------+
     | run the try block  |
     +--------------------+
        |              |
    no error       exception
        |              |
        |              v
        |      matching catch?
        |        yes|    |no
        |           v    |
        |   run catch    |
        |           |    |
        v           v    v
     +--------------------+
     | run finally block  |
     +--------------------+
        |              |
        v              v
   code after     exception goes
   the statement  up to the caller
```

The try block runs line by line. If no exception appears, the catch blocks are skipped and finally runs. If an exception appears, the rest of the try block is skipped and Java walks down the catch list looking for the first type that matches. If one matches, its code runs, then finally, and the program continues after the whole statement. If none matches, finally still runs, and then the exception carries on up to the calling method.

One special case surprises many learners. When `try` contains a `return`, Java first works out the value to return, then runs `finally`, and only then leaves the method. So `finally` code still runs before the caller receives the value.

Try-with-resources adds one more step. Before any catch or finally block runs, Java calls `close()` on each resource, in the reverse order of opening.

## Example Programs

### Flow through try, catch and finally

```java
public class KitchenFlow {
    static void cook(String dish, String qtyText) {
        try {
            System.out.println("try: " + dish);
            int qty = Integer.parseInt(qtyText);
            System.out.println("try: cooking x" + qty);
        } catch (NumberFormatException e) {
            System.out.println("catch: bad qty " + qtyText);
        } finally {
            System.out.println("finally: wipe counter");
        }
        System.out.println("after: next order");
    }

    static String plate(String dish) {
        try {
            return "plated " + dish;
        } finally {
            System.out.println("finally runs before return");
        }
    }

    public static void main(String[] args) {
        cook("dosa", "2");
        System.out.println("--");
        cook("idli", "two");
        System.out.println("--");
        System.out.println(plate("vada"));
    }
}
```

**Output:**

```text
try: dosa
try: cooking x2
finally: wipe counter
after: next order
--
try: idli
catch: bad qty two
finally: wipe counter
after: next order
--
finally runs before return
plated vada
```

For "dosa" the catch is skipped. For "idli" the second try line never runs, the catch does, and finally still wipes the counter. In `plate`, the finally message prints before `main` receives and prints the returned text.

### Several catch blocks and multi-catch

```java
public class OrderCatches {
    static String[] menu = {"paneer", "dal", "naan"};

    static String take(String table, String qtyText, int item) {
        try {
            String tag = table.toUpperCase();
            int qty = Integer.parseInt(qtyText);
            if (qty <= 0) {
                throw new IllegalArgumentException("qty must be > 0");
            }
            return tag + ": " + qty + " x " + menu[item];
        } catch (NullPointerException
                | ArrayIndexOutOfBoundsException e) {
            return "slip error:\n  "
                    + e.getClass().getSimpleName();
        } catch (NumberFormatException e) {
            return "qty is not a number: " + qtyText;
        } catch (RuntimeException e) {
            return "other: " + e.getMessage();
        }
    }

    public static void main(String[] args) {
        System.out.println(take("t4", "2", 1));
        System.out.println(take(null, "1", 0));
        System.out.println(take("t7", "3", 5));
        System.out.println(take("t2", "x", 2));
        System.out.println(take("t9", "0", 0));
    }
}
```

**Output:**

```text
T4: 2 x dal
slip error:
  NullPointerException
slip error:
  ArrayIndexOutOfBoundsException
qty is not a number: x
other: qty must be > 0
```

The multi-catch handles a missing table and a dish number outside the menu with one block. `NumberFormatException` is a child of `IllegalArgumentException`, so it must come before the broad `RuntimeException` block, which catches everything else.

### try-with-resources and a home-made resource

```java
class Burner implements AutoCloseable {
    private final String name;

    Burner(String name) {
        this.name = name;
        System.out.println(name + " on");
    }

    void cook(String dish) {
        if (dish.isEmpty()) {
            throw new IllegalArgumentException("empty order");
        }
        System.out.println(name + " cooks " + dish);
    }

    @Override
    public void close() {
        System.out.println(name + " off");
    }
}

public class BurnerDemo {
    static void serve(String dish) {
        try (Burner front = new Burner("front");
             Burner back = new Burner("back")) {
            front.cook(dish);
            back.cook("rice");
        } catch (IllegalArgumentException e) {
            System.out.println("caught: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        serve("biryani");
        System.out.println("--");
        serve("");
    }
}
```

**Output:**

```text
front on
back on
front cooks biryani
back cooks rice
back off
front off
--
front on
back on
back off
front off
caught: empty order
```

Both burners switch off in reverse order, even when the order fails. Notice that `close()` runs before the catch block prints its message.

## Common Mistakes

> **Common mistake:** Putting a parent type before its child, such as `catch (Exception e)` above `catch (NumberFormatException e)`. The child block can never be reached, and the compiler rejects the code with an "already been caught" error.

- **Wrapping too much.** A giant try block around a whole method hides which line actually failed. Keep the try block small.
- **Returning from `finally`.** A `return` inside finally replaces the try's return value and even swallows a pending exception. Keep finally for cleanup only.
- **Related types in a multi-catch.** `catch (IOException | Exception e)` does not compile, because one type is a subclass of the other.
- **Closing resources by hand.** Forgetting `close()` on one path leaks the resource. Let try-with-resources do it.
- **Empty catch blocks.** Catching and ignoring means nobody ever learns the order failed.

## Interview Questions

**Can a try block exist without a catch block?**
Yes, if it has a `finally` block, or if it is a try-with-resources statement. A plain `try` with neither catch nor finally does not compile.

**Why must catch blocks go from specific to general?**
Java tests catch blocks from top to bottom and uses the first match. A general type placed first would catch everything, so the compiler reports the later, more specific block as unreachable.

**Does finally run if the try block contains a return?**
Yes. The return value is computed, then finally runs, and only then does the method return. Finally is skipped only in rare cases such as `System.exit()` or the JVM itself dying.

**What is multi-catch?**
It is a single catch block that handles several exception types joined with `|`, introduced in Java 7. The types must not be related by inheritance, and the variable is implicitly final.

**What does try-with-resources need from a class?**
The class must implement `AutoCloseable` or its child `Closeable`. Java calls `close()` automatically at the end of the block, in reverse order of creation, even when an exception is thrown.

## Summary

- `try` holds risky code; `catch` handles a named exception type; `finally` always runs for cleanup.
- When an exception occurs, the rest of the try block is skipped and the first matching catch runs.
- Order catch blocks from the most specific type to the most general.
- Use multi-catch with `|` when unrelated exceptions need the same handling.
- Finally runs even when the try block returns, just before the method exits.
- Try-with-resources closes every `AutoCloseable` resource automatically, in reverse order.

## Related Topics

- [Exception](/learning/java-tutorial/exception): what exceptions are and how they travel up the stack.
- [finally](/learning/java-tutorial/finally): more detail on the block that always runs.
- [throw](/learning/java-tutorial/throw): how to raise your own exceptions for try-catch to handle.
- [Exception Handling Best Practices](/learning/java-tutorial/exception-handling-best-practices): habits that keep error handling clear and safe.
