Open any mobile recharge app and you see a list of plans: Rs 199 for 28 days, Rs 299 with 2 GB a day, Rs 719 for 84 days. To show that list, the app keeps the prices in a `List`, the data limits in a `Map`, and some plans have no bonus data at all. Plain `int` values cannot do any of that. A `List<int>` does not even compile, and an `int` can never say "no value". Java solves this with wrapper classes.

Here you will meet the eight wrapper classes, see exactly what the compiler writes for you during autoboxing and unboxing, learn why `==` suddenly fails at 128, and handle the `NullPointerException` that hides inside a harmless-looking line.

## What are Wrapper Classes?

> **Definition:** A wrapper class is a class in `java.lang` that holds a single primitive value inside an object. Java has one wrapper for each of its eight primitive types, and every wrapper object is immutable.

The eight pairs are:

- `byte` → `Byte`, `short` → `Short`, `int` → `Integer`, `long` → `Long`
- `float` → `Float`, `double` → `Double`
- `char` → `Character`, `boolean` → `Boolean`

Only two names differ from their primitive: `Integer` and `Character`. The six numeric wrappers all extend the abstract class `Number`, which gives them methods like `intValue()` and `doubleValue()`.

## Why are Wrapper Classes used?

Primitives are fast and small, but they are not objects. Several parts of Java only work with objects.

- **Collections and generics.** `List`, `Set`, `Map` and `Optional` store objects, so a list of prices must be a `List<Integer>`.
- **A missing value.** A wrapper variable can be `null`, which is a natural way to say "this plan has no bonus data".
- **Handy tools.** The wrappers carry static helpers such as `Integer.parseInt`, `Integer.MAX_VALUE`, `Integer.compare` and `Character.isDigit`.
- **APIs that take `Object`.** Methods like `String.format` or reflection accept any object, and a wrapper lets a number travel through them.

## Real-Life Example

Think of an office mail tray that only accepts sealed envelopes. You cannot drop a loose coin into it, because the tray is built for envelopes. So you put the coin in an envelope, seal it and drop it in. At the other end, someone opens the envelope and takes the coin out.

Sometimes the envelope arrives empty. If the person opening it expects a coin and reaches in without looking, they grab nothing and the job fails.

Map it back to Java: the coin is a primitive `int`, the envelope is an `Integer` object, and the mail tray is a collection. Sealing is boxing, opening is unboxing, and the empty envelope is `null`. Reaching in blindly is unboxing a `null`, which throws `NullPointerException`.

## Syntax

```java
Integer price = 299;                 // autoboxing
int p = price;                       // auto-unboxing

Integer a = Integer.valueOf(299);    // explicit boxing
int b = a.intValue();                // explicit unboxing

int c = Integer.parseInt("599");     // text -> int
Integer d = Integer.valueOf("599");  // text -> Integer
String s = String.valueOf(719);      // int -> text
```

- The first line puts an `int` straight into an `Integer`. The compiler adds the boxing call for you.
- The second line does the reverse and takes the `int` out.
- `valueOf` and `intValue` are the real methods behind those two lines. You can call them yourself.
- `parseInt` turns text into a primitive `int`. It throws `NumberFormatException` if the text is not a number.
- `Integer.valueOf(String)` also parses text, but returns an `Integer` object.
- `String.valueOf` goes the other way, from number to text.

## How Wrapper Classes Work

Autoboxing is a compiler feature, not a JVM feature. The compiler rewrites your code before it runs.

```text
You write:
Integer price = 299;
int total = price + 50;
        |
        v
javac turns it into:
Integer.valueOf(299)
price.intValue() + 50
        |
        v
Integer.valueOf(n)
        |
 is n in -128..127 ?
   |            |
  yes           no
   |            |
   v            v
cached        new
object        Integer
```

Every time you box an `int`, the compiler writes a call to `Integer.valueOf`. Every time you unbox, it writes `intValue()`. Inside `valueOf` there is a small table called the Integer cache. When the `Integer` class loads, it creates 256 objects for the values -128 to 127 and keeps them in an array. Boxing a value in that range returns the same shared object every time. A value outside the range gets a brand new object.

That is why `==` is unreliable. The `==` operator compares object references. Two boxed 127s are the same cached object, so `==` says true. Two boxed 128s are two separate objects, so `==` says false, even though both hold 128. `Byte`, `Short`, `Long` and `Character` cache small values too, `Boolean` has only `TRUE` and `FALSE`, and `Float` and `Double` do not cache at all.

Unboxing a `null` is the other trap. The compiler writes `null.intValue()`, and calling a method on `null` throws `NullPointerException`.

## Example Programs

### Recharge plans in collections

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RechargePlans {
    public static void main(String[] args) {
        List<Integer> prices = new ArrayList<>();
        prices.add(199);          // boxed by the compiler
        prices.add(299);
        prices.add(Integer.parseInt("719"));

        int total = 0;
        for (int p : prices) {    // unboxed
            total += p;
        }
        System.out.println("Plans: " + prices);
        System.out.println("Sum: Rs " + total);

        Map<Integer, Double> dataGb = new HashMap<>();
        dataGb.put(299, 2.0);
        dataGb.put(719, 1.5);
        double daily = dataGb.get(299);   // unboxed
        System.out.println("Rs 299 gives " + daily
                + " GB a day");

        System.out.println("compare(199, 299) = "
                + Integer.compare(199, 299));
        System.out.println("Int max: " + Integer.MAX_VALUE);
        System.out.println("'7' is digit? "
                + Character.isDigit('7'));
    }
}
```

**Output:**

```text
Plans: [199, 299, 719]
Sum: Rs 1217
Rs 299 gives 2.0 GB a day
compare(199, 299) = -1
Int max: 2147483647
'7' is digit? true
```

Plain `int` values went into the list and map, and came back out, with no calls written by hand. The static helpers on `Integer` and `Character` did the parsing and checks.

### The Integer cache and ==

```java
public class PlanCodes {
    public static void main(String[] args) {
        Integer basicA = 127;
        Integer basicB = 127;
        System.out.println("127 == 127: " + (basicA == basicB));

        Integer premiumA = 128;
        Integer premiumB = 128;
        System.out.println("128 == 128: "
                + (premiumA == premiumB));
        System.out.println("128 equals: "
                + premiumA.equals(premiumB));
        System.out.println("128 unboxed: "
                + (premiumA.intValue() == premiumB.intValue()));

        Long pack = 5L;
        System.out.println("Long equals int 5: "
                + pack.equals(5));
    }
}
```

**Output:**

```text
127 == 127: true
128 == 128: false
128 equals: true
128 unboxed: true
Long equals int 5: false
```

Both 127s came from the cache, so `==` matched. The 128s were separate objects. `equals` compares the values and works for both. The last line is false because `5` is boxed to an `Integer`, and a `Long` never equals an `Integer`.

### Unboxing a missing value

```java
import java.util.HashMap;
import java.util.Map;

public class BonusData {
    public static void main(String[] args) {
        Map<String, Integer> bonusMb = new HashMap<>();
        bonusMb.put("PLAN-299", 500);

        try {
            int extra = bonusMb.get("PLAN-199");
            System.out.println("Extra: " + extra);
        } catch (NullPointerException e) {
            System.out.println("PLAN-199: NPE on unboxing");
        }

        int safe = bonusMb.getOrDefault("PLAN-199", 0);
        System.out.println("PLAN-199 bonus: " + safe + " MB");

        Integer maybe = bonusMb.get("PLAN-199");
        System.out.println("Checked first: "
                + (maybe == null ? "none" : maybe + " MB"));
    }
}
```

**Output:**

```text
PLAN-199: NPE on unboxing
PLAN-199 bonus: 0 MB
Checked first: none
```

`get` returned `null` for the missing plan, and assigning it to an `int` made the compiler call `intValue()` on `null`. Using `getOrDefault` or checking for `null` before unboxing avoids the crash.

## Primitive vs Wrapper

| Aspect | Primitive (`int`) | Wrapper (`Integer`) |
|---|---|---|
| What it is | A raw value | An object on the heap |
| Can be null | No | Yes |
| Field default | `0` | `null` |
| Size | 4 bytes | About 16 bytes |
| In collections | Not allowed | Allowed |
| `==` compares | Values | References |
| Methods | None | `compareTo`, `equals`, ... |

Use primitives for counters, loops and maths, where speed matters. Use wrappers when you need a collection, a generic type or a way to say "no value".

## Common Mistakes

> **Warning:** Never compare two wrapper objects with `==`. It checks references, so it works by luck for small values and fails from 128 upward. Use `equals`, or unbox with `intValue()` first.

- **Unboxing `null`.** `int x = map.get(key);` throws `NullPointerException` when the key is missing. Use `getOrDefault` or a `null` check.
- **Boxing inside hot loops.** `Long sum = 0L; sum += i;` creates a new object on almost every pass. Use a primitive `long` for totals.
- **Parsing text with extra characters.** `Integer.parseInt("2GB")` throws `NumberFormatException`. Clean the text first.
- **Using the old constructors.** `new Integer(5)` is deprecated. Call `Integer.valueOf(5)` so the cache can be used.

## Interview Questions

**What does the compiler insert for autoboxing and unboxing?**
For boxing it inserts a call to the wrapper's `valueOf`, such as `Integer.valueOf(299)`. For unboxing it inserts the matching value method, such as `intValue()`. The JVM itself knows nothing about autoboxing.

**Why does Integer a = 127, b = 127; a == b give true, but the same code with 128 gives false?**
`Integer.valueOf` returns cached objects for -128 to 127, so both 127s share one object. Values outside that range get new objects each time, and `==` compares references, so the two 128s are different.

**What is the difference between Integer.parseInt and Integer.valueOf?**
`parseInt` returns a primitive `int`. `valueOf` returns an `Integer` object and may reuse a cached one. Both throw `NumberFormatException` for text that is not a valid number.

**When can unboxing throw NullPointerException?**
Whenever the wrapper reference is `null` and Java needs the primitive value, for example assigning it to an `int`, doing arithmetic with it, or using it in a condition. The generated `intValue()` call is made on `null`.

**Why are wrapper classes immutable?**
Immutability makes it safe to share cached objects between all callers. If a boxed 100 could change, every variable pointing to the cached 100 would change too. It also makes wrappers safe as `HashMap` keys.

## Summary

- Each of the eight primitives has a wrapper class in `java.lang`.
- Collections and generics store objects, so they use wrappers.
- Autoboxing compiles to `valueOf`, and unboxing to methods like `intValue()`.
- `Integer.valueOf` caches -128 to 127, so `==` fails from 128 upward.
- Compare wrappers with `equals`, and guard against unboxing `null`.
- Prefer primitives for maths and loops, and wrappers when you need objects or `null`.

## Related Topics

- [Data Types](/learning/java-tutorial/data-types): the eight primitive types that each wrapper holds.
- [Generics](/learning/java-tutorial/generics): why type arguments must be wrapper classes.
- [ArrayList](/learning/java-tutorial/arraylist): a common place where autoboxing happens every day.
