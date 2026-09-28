You walk up to an ATM, put in your card and ask for 2,000 rupees. Your account holds 1,500. The machine does not freeze, and it does not hand out money it does not have. It shows a clear message, returns your card and gets ready for the next person. Something went wrong, and the machine handled it calmly.

Java programs meet surprises like this all the time: a number typed with a letter O instead of a zero, a network that drops, a value that should never be zero. Java reports each surprise as an exception. In this guide you will learn what an exception is, how the family of exception classes is arranged, the difference between checked and unchecked exceptions, and what really happens inside the call stack when one is thrown.

## What is an Exception?

> **Definition:** An exception is an object that Java creates when something unexpected happens while a program runs. It interrupts the normal flow of statements and carries details about the problem, such as its type, a message and the list of method calls that led to it.

Two ideas hide in that sentence. First, an exception is an event: normal execution stops at that line. Second, it is also an ordinary object, an instance of some class that extends `Throwable`. Because it is an object, you can catch it, ask for its message and decide what to do next.

When your code creates such an object and hands it to the JVM, we say the code **throws** the exception. When some other code receives it and deals with it, we say that code **catches** it.

## Why is Exception handling used?

Without exceptions, every method would have to return special error codes, and every caller would have to check them. Programmers forget those checks, and bugs slip through quietly.

- **Errors cannot be ignored silently.** An exception that nobody catches stops the thread and prints a report, so problems surface early.
- **Clean main logic.** The normal path stays readable, and error handling lives in its own block.
- **Rich information.** The object carries a type, a message and a stack trace that points to the exact line.
- **Handling at the right level.** A low-level method can report the problem, and a higher-level method that knows what to tell the user can handle it.
- **Programs keep running.** A caught exception lets the program recover, like the ATM serving the next customer.

## Real-Life Example

Picture the chain of people behind that ATM request. The screen software asks the cash unit for notes. The cash unit asks the bank's account service for the balance. The account service notices the balance is too low.

The account service cannot fix this. It is not its job to talk to the customer. So it raises a flag, a written note saying "need 2,000, have 1,500", and passes it back up. The cash unit has no plan for that note either, so it stops what it was doing and passes it up again. Finally the screen software, which knows how to talk to customers, reads the note and shows a friendly message.

That note is the exception object. Raising the flag is `throw`. Each worker that passes it along without a plan is a method that does not catch it. The screen software is the method with a `catch` block.

## Syntax

```java
// throwing an exception
throw new IllegalStateException("message");

// declaring a checked exception a method may throw
void verify(String card) throws CardBlockedException {
    // ...
}

// catching an exception
try {
    // code that might throw
} catch (IllegalStateException e) {
    String text = e.getMessage();
}
```

- `throw` hands a new exception object to the JVM. The statements after it in that block do not run.
- `throws` in a method signature warns callers that this method may throw a checked exception.
- `try` wraps the code that might fail.
- `catch` names the exception type it can handle. The variable `e` holds the thrown object.
- `getMessage()` returns the text passed to the constructor. `getClass().getSimpleName()` gives the type name.

## How Exceptions Work

### The Throwable family

Every exception class sits in one family tree with `Throwable` at the top.

```text
Throwable
 |
 +-- Error  (unchecked)
 |    +-- OutOfMemoryError
 |    +-- StackOverflowError
 |
 +-- Exception  (checked)
      +-- IOException
      +-- InterruptedException
      +-- RuntimeException
          (unchecked)
          +-- ArithmeticException
          +-- NullPointerException
```

`Error` means the JVM itself is in serious trouble, such as running out of memory, and normal code should not try to catch it. `Exception` covers problems a program can reasonably handle. Everything under `Exception` is checked by the compiler, except the `RuntimeException` branch, whose members are unchecked. Anything under `Error` is unchecked too.

### Stack unwinding

Each method call gets a frame on the call stack. When an exception is thrown, the JVM looks for a matching `catch` in the current frame. If there is none, it removes that frame and tries the caller.

```text
+--------------+
| checkBalance | <- thrown here
+--------------+    no catch: pop
| dispense     |    no catch: pop
+--------------+
| startSession |    no catch: pop
+--------------+
| main         | <- catch found
+--------------+
```

This popping is called stack unwinding. The leftover statements in each popped method never run. If the JVM pops every frame, even `main`, and finds no handler, the thread dies and the default handler prints the stack trace. That is the "crash" beginners see.

## Example Programs

### Watching the stack unwind

```java
public class AtmUnwind {
    static int balance = 1500;

    static void checkBalance(int amount) {
        System.out.println("  in checkBalance");
        if (amount > balance) {
            throw new IllegalStateException(
                    "need " + amount + ", have " + balance);
        }
        System.out.println("  balance ok");
    }

    static void dispense(int amount) {
        System.out.println(" in dispense");
        checkBalance(amount);
        System.out.println(" notes counted");
    }

    static void startSession(int amount) {
        System.out.println("in startSession");
        dispense(amount);
        System.out.println("session closed");
    }

    public static void main(String[] args) {
        try {
            startSession(2000);
        } catch (IllegalStateException e) {
            System.out.println("caught in main");
            System.out.println("type: "
                    + e.getClass().getSimpleName());
            System.out.println("msg : " + e.getMessage());
            System.out.println("stack, top first:");
            for (StackTraceElement f : e.getStackTrace()) {
                System.out.println("  " + f.getMethodName());
            }
        }
        System.out.println("ATM ready for next card");
    }
}
```

**Output:**

```text
in startSession
 in dispense
  in checkBalance
caught in main
type: IllegalStateException
msg : need 2000, have 1500
stack, top first:
  checkBalance
  dispense
  startSession
  main
ATM ready for next card
```

None of "balance ok", "notes counted" or "session closed" appear, because those frames were popped. The stack trace lists the frames in the same order as the diagram.

### A checked and an unchecked exception

```java
class CardBlockedException extends Exception {
    CardBlockedException(String message) {
        super(message);
    }
}

public class CardCheck {
    static void verifyCard(String card) throws CardBlockedException {
        if (card.endsWith("0000")) {
            throw new CardBlockedException("card " + card + " blocked");
        }
        System.out.println("card " + card + " ok");
    }

    static int readAmount(String typed) {
        return Integer.parseInt(typed);
    }

    public static void main(String[] args) {
        String[] cards = {"4111-2222", "5500-0000"};
        for (String card : cards) {
            try {
                verifyCard(card);
            } catch (CardBlockedException e) {
                System.out.println("checked: " + e.getMessage());
            }
        }

        String[] typed = {"500", "5OO"};
        for (String t : typed) {
            try {
                System.out.println("amount " + readAmount(t));
            } catch (NumberFormatException e) {
                System.out.println("unchecked: "
                        + e.getClass().getSimpleName());
            }
        }
    }
}
```

**Output:**

```text
card 4111-2222 ok
checked: card 5500-0000 blocked
amount 500
unchecked: NumberFormatException
```

`CardBlockedException` extends `Exception`, so the compiler forces `verifyCard` to declare it and forces the caller to catch it. `readAmount` needs no `throws` clause, because `NumberFormatException` is a `RuntimeException`.

### Sorting faults into families

```java
import java.io.IOException;

public class FaultSorter {
    static String family(Throwable t) {
        if (t instanceof Error) {
            return "Error";
        } else if (t instanceof RuntimeException) {
            return "unchecked";
        } else {
            return "checked";
        }
    }

    public static void main(String[] args) {
        Throwable[] faults = {
            new ArithmeticException("split by 0"),
            new IOException("receipt printer offline"),
            new StackOverflowError(),
            new IllegalArgumentException("bad PIN"),
            new InterruptedException("session stopped")
        };
        for (Throwable t : faults) {
            String name = t.getClass().getSimpleName();
            System.out.println(name);
            System.out.println("  = " + family(t));
        }
    }
}
```

**Output:**

```text
ArithmeticException
  = unchecked
IOException
  = checked
StackOverflowError
  = Error
IllegalArgumentException
  = unchecked
InterruptedException
  = checked
```

Creating an exception object does not throw it, so this program just inspects each one. The `instanceof` checks follow the tree: `Error` first, then the `RuntimeException` branch, and everything else is checked.

## Checked vs Unchecked Exceptions

| Point | Checked | Unchecked |
|---|---|---|
| Parent class | `Exception`, not runtime | `RuntimeException` or `Error` |
| Compiler check | Must catch or declare | Not forced |
| Usual cause | Outside world: files, network | Bugs in code, bad input |
| Examples | `IOException`, `InterruptedException` | `NullPointerException`, `ArithmeticException` |
| Typical fix | Handle and recover | Fix the code or validate input |

A good rule: use checked exceptions for problems a caller can realistically recover from, and unchecked ones for programming mistakes.

## Common Mistakes

> **Warning:** Never write an empty `catch` block. Swallowing an exception hides the problem completely, and the program carries on with wrong data. At the very least, log the message or rethrow.

- **Catching `Exception` everywhere.** A broad catch also traps bugs such as `NullPointerException` that you would rather see and fix.
- **Catching `Error` or `Throwable`.** An `OutOfMemoryError` cannot be fixed by your code, so let it stop the program.
- **Using exceptions as normal control flow.** Throwing is slow compared with an `if` check. Check for a zero or a null first when you can.
- **Losing the cause.** When wrapping one exception in another, pass the original as the cause so the first stack trace is not lost.
- **Vague messages.** "Error occurred" helps nobody. Include the values involved, like "need 2000, have 1500".

## Interview Questions

**What is the difference between an Error and an Exception?**
Both extend `Throwable`. An `Error` signals a serious JVM-level problem, such as running out of memory, that applications should not try to handle. An `Exception` signals a condition a program can catch and recover from.

**What is the difference between checked and unchecked exceptions?**
Checked exceptions extend `Exception` but not `RuntimeException`, and the compiler forces you to catch or declare them. Unchecked exceptions extend `RuntimeException` or `Error`, and the compiler does not force any handling.

**What happens when an exception is not caught anywhere?**
The JVM unwinds the stack frame by frame looking for a handler. If it reaches the bottom of the thread's stack without one, the thread ends and the default handler prints the exception type, message and stack trace. When that thread is `main` and no other threads are running, the program stops.

**What is stack unwinding?**
It is the process of removing method frames from the call stack while searching for a matching `catch` block. The remaining statements of every removed method are skipped.

**What is the difference between `throw` and `throws`?**
`throw` is a statement that actually throws one exception object. `throws` appears in a method signature and lists the checked exceptions that method may pass to its caller.

## Summary

- An exception is an object that describes an unexpected event and interrupts normal flow.
- All exception classes descend from `Throwable`, which splits into `Error` and `Exception`.
- `RuntimeException` and `Error` are unchecked; other `Exception` types are checked.
- The compiler forces you to catch or declare checked exceptions.
- An uncaught exception unwinds the stack, skipping the rest of each method on the way.
- Use `getMessage()` and the class name to report problems clearly.

## Related Topics

- [try-catch](/learning/java-tutorial/try-catch): how to catch exceptions and control what runs next.
- [Checked vs Unchecked Exceptions](/learning/java-tutorial/checked-vs-unchecked-exceptions): deeper rules for choosing between the two.
- [Custom Exceptions](/learning/java-tutorial/custom-exceptions): build your own exception classes like `CardBlockedException`.
- [throws](/learning/java-tutorial/throws): declaring the exceptions a method passes to its caller.
