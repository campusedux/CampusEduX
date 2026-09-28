Every invoice a shop prints carries a number such as INV-1042. Once that invoice is sent to a customer, its number must never change, the tax rate printed on it must match the law of that day, and the layout of the footer must look the same on every copy. If any of those could be edited later, the accounts would stop matching and the auditor would start asking hard questions.

Java has one small keyword for "this must not change": `final`. You can put it on a variable, a method or a whole class, and it means something slightly different in each place. Here you will learn all three uses, the blank final that a constructor fills in, the difference between a final reference and an unchangeable object, and what "effectively final" means for lambdas.

## What is the final Keyword?

> **Definition:** `final` is a Java modifier that stops further change. A final variable can be assigned only once, a final method cannot be overridden, and a final class cannot be extended.

The three uses at a glance:

- **final variable:** its value, or the object it points to, is fixed after the first assignment. With `static`, it becomes a class-wide constant.
- **final method:** subclasses inherit it but cannot replace it.
- **final class:** no class can extend it. `String`, `Integer` and `Math` are all final.

## Why is the final Keyword used?

Some values are facts, not state. The GST rate for a report, the prefix of an invoice number and the maximum lines per page should be written once and trusted everywhere. Marking them `final` turns an accidental reassignment into a compile error instead of a bug found months later.

Final methods protect behaviour that a parent class relies on. If a billing class computes its tax in a final method, no subclass can quietly skip the tax. Final classes go further: nobody can subclass them and override anything at all, which is why security-sensitive classes like `String` are final.

`final` also documents intent. A reader who sees a final field knows it is set in the constructor and never touched again. That makes code easier to reason about and safer to share between threads, because final fields are guaranteed to be visible correctly once the constructor finishes.

## Real-Life Example

Think of a printed, signed invoice in a shop's file. The invoice number is written in ink at the moment it is created. That is a blank final set in the constructor: empty until the invoice is made, fixed forever after. The tax rate printed at the top of every invoice pad is a constant, the same for all of them, like a `static final` field.

The shop's rule "every invoice ends with the owner's signature" is a final method: each type of invoice may have its own heading, but none may drop the signature. And the official tax form handed out by the government is a final class: shops may fill it in, but they may not design their own variant of it.

## Syntax

```java
static final int GST_PERCENT = 18;   // constant
final int pages = 3;                 // local, set once
private final String number;         // blank final field

void print(final String copy) { }    // final parameter
final int tax(int amount) { ... }    // cannot be overridden
final class TaxForm { }              // cannot be extended
```

- `static final int GST_PERCENT = 18` is a constant. By convention its name uses capitals and underscores.
- `final int pages = 3` is a local variable that cannot be assigned again.
- `private final String number` has no value yet. It is a blank final, and every constructor must assign it exactly once.
- `final String copy` is a final parameter. The method cannot reassign it.
- `final int tax(...)` can be called and inherited but not overridden.
- `final class TaxForm` cannot appear after `extends` in any class.

## How the final Keyword Works

The compiler enforces almost every `final` rule before the program runs. It tracks each final variable and proves that it is assigned exactly once on every path through the code.

```text
final on a ...
variable -> assigned once
method   -> no override
class    -> no subclass
```

For a blank final field, the compiler checks every constructor. If one path forgets to set the field, or sets it twice, the build fails. For a `static final` field whose value is a literal, such as `18` or `"INV-"`, the compiler goes a step further and copies the value straight into every place that uses it. Such a value is called a compile-time constant.

The most important idea is what a final variable actually freezes. For a reference, `final` fixes the arrow, not the object at the other end.

```text
final List<String> items
        |
        | this arrow is fixed
        v
+-----------------------+
| [Ink, Paper]          |
| contents can change   |
+-----------------------+
items = new ArrayList<>()
  -> compile error
items.add("Pens")
  -> allowed
```

The variable `items` will point to this one list for its whole life, but the list itself is still an ordinary `ArrayList` whose contents can grow and shrink. To stop the contents from changing, you need an immutable object, such as one from `List.of(...)`. A final reference and an immutable object are two separate ideas, and you often need both.

Finally, Java 8 added **effectively final**. A local variable that is never reassigned after its first value counts as effectively final even without the keyword. Lambdas and anonymous classes can only capture local variables that are final or effectively final, because they keep a copy of the value.

## Example Programs

### Constants and blank finals on invoices

```java
class Invoice {
    static final String PREFIX = "INV-";
    static final int GST_PERCENT = 18;
    private static int nextNo = 1041;

    private final String number;
    private final int amount;

    Invoice(int amount) {
        this.number = PREFIX + nextNo++;
        this.amount = amount;
    }

    int total() {
        return amount + amount * GST_PERCENT / 100;
    }

    String line(final String customer) {
        return number + " " + customer + " Rs " + total();
    }
}

public class BillingDesk {
    public static void main(String[] args) {
        Invoice a = new Invoice(1000);
        Invoice b = new Invoice(2500);
        Invoice c = new Invoice(450);
        System.out.println(a.line("Mehta"));
        System.out.println(b.line("Rao"));
        System.out.println(c.line("Das"));
        System.out.println("GST: " + Invoice.GST_PERCENT + "%");
    }
}
```

**Output:**

```text
INV-1041 Mehta Rs 1180
INV-1042 Rao Rs 2950
INV-1043 Das Rs 531
GST: 18%
```

Each invoice gets its number once, inside the constructor, and nothing can renumber it later. The two constants are shared by all invoices, and the final parameter `customer` cannot be reassigned inside `line`.

### A final reference is not a frozen object

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class InvoiceItems {
    public static void main(String[] args) {
        final List<String> items = new ArrayList<>();
        items.add("Ink");
        items.add("Paper");
        // items = new ArrayList<>(); would not compile
        System.out.println("Items : " + items);

        final int[] qty = {2, 5};
        qty[0] = 9;
        System.out.println("Qty   : " + Arrays.toString(qty));

        final List<String> fixed = List.of("Stapler", "Pins");
        try {
            fixed.add("Tape");
        } catch (UnsupportedOperationException e) {
            System.out.println("List.of refused Tape");
        }
        System.out.println("Fixed : " + fixed);
    }
}
```

**Output:**

```text
Items : [Ink, Paper]
Qty   : [9, 5]
List.of refused Tape
Fixed : [Stapler, Pins]
```

Both `items` and `qty` are final, yet their contents changed, because `final` only fixed which object each name points to. `List.of` built a truly immutable list, so adding to it failed at run time.

### Final methods, final classes and lambdas

```java
import java.util.function.Function;

class Document {
    final String footer() {
        return "Signed: Accounts";
    }

    String title() {
        return "Document";
    }

    String render() {
        return title() + " | " + footer();
    }
}

final class CreditNote extends Document {
    @Override
    String title() {
        return "Credit Note";
    }
}

public class PrintRoom {
    public static void main(String[] args) {
        Document d = new CreditNote();
        System.out.println(d.render());

        String currency = "Rs ";
        Function<Integer, String> fmt = amt -> currency + amt;
        System.out.println(fmt.apply(1180));
    }
}
```

**Output:**

```text
Credit Note | Signed: Accounts
Rs 1180
```

`CreditNote` changed the title but had to keep the final footer. Because `CreditNote` is final, no class can extend it. The lambda captures `currency`, which is effectively final; adding `currency = "USD ";` anywhere would make the lambda fail to compile.

## final vs finally vs finalize

| Point | final | finally | finalize |
|---|---|---|---|
| What it is | Keyword | Block after `try` | Method of `Object` |
| Used on | Variables, methods, classes | Exception handling | An object before GC |
| Purpose | Stop change | Always run cleanup | Last-chance cleanup |
| When it acts | Compile time | After `try`, always | Maybe never |
| Status | In daily use | In daily use | Deprecated since Java 9 |

The three only sound alike. For cleanup today, use `finally` or try-with-resources, never `finalize`.

## Common Mistakes

> **Warning:** A `final` field that holds a `List`, array or `Map` is not read-only. Other code can still change what is inside. Use an immutable collection such as `List.of(...)`, or return a copy.

- **Forgetting to set a blank final.** Every constructor must assign it, or the class does not compile.
- **Expecting `final` to make an object immutable.** It fixes the reference only; immutability needs a class designed for it.
- **Changing a captured variable.** A lambda cannot use a local variable that is reassigned anywhere in the method.
- **Making everything final by reflex.** Final classes and methods block subclassing and testing tricks, so use them where the design needs it.

## Interview Questions

**What happens if you try to reassign a final variable?**
The compiler rejects it with "cannot assign a value to final variable". The check happens at compile time, so the program never runs with the second assignment.

**What is a blank final variable?**
It is a final field declared without a value. It must be assigned exactly once in every constructor, or in an instance initializer block, and it stays fixed afterwards.

**Does final make an object immutable?**
No. A final reference always points to the same object, but that object's contents may still change. Immutability comes from the class design: final private fields, no setters and defensive copies.

**Why is the String class final?**
If `String` could be extended, a subclass could override methods and change how a string behaves after a security check. Making it final keeps every string predictable and safe to share and cache.

**What is effectively final?**
It is a local variable that is never reassigned after it gets its value, even without the `final` keyword. Lambdas and anonymous classes may capture only final or effectively final local variables.

## Summary

- `final` stops change: variables are assigned once, methods are not overridden, classes are not extended.
- `static final` fields are constants shared by every object of the class.
- A blank final field must be set exactly once in every constructor.
- A final reference fixes the arrow, not the contents of the object it points to.
- Lambdas can capture only final or effectively final local variables.
- `final`, `finally` and `finalize` are unrelated, and `finalize` is deprecated since Java 9.

## Related Topics

- [static Keyword](/learning/java-tutorial/static-keyword): pairs with `final` to create class-wide constants.
- [Encapsulation](/learning/java-tutorial/encapsulation): uses final fields to build immutable classes.
- [Method Overriding](/learning/java-tutorial/method-overriding): the rule that a final method switches off.
- [finally](/learning/java-tutorial/finally): the cleanup block that is often confused with `final`.
