Walk through a large warehouse and every crate carries a label: "Hex Bolts", "Copper Wire", "Glass Jars". A picker who pulls a crate marked "Hex Bolts" does not open it to check. The label already promises what is inside. Before Java 5, Java collections had no labels. A list held plain `Object` values, and you only found out that a crate held the wrong thing when the program crashed. Generics added the labels.

Here you will learn how to write your own generic classes and methods, how to limit a type with `extends`, how the wildcards `? extends` and `? super` work, and what the compiler really does with your type labels through type erasure. You will also see why raw types are a trap.

## What are Generics?

> **Definition:** Generics let a class, interface or method take a type as a parameter, written in angle brackets such as `Crate<T>`. The compiler uses that type to check every use at compile time and to insert casts for you.

Some terms you will meet:

- **Type parameter:** the placeholder in the declaration, like `T` in `class Crate<T>`.
- **Type argument:** the real type you supply when using it, like `Bolt` in `Crate<Bolt>`.
- **Parameterized type:** the combination, such as `Crate<Bolt>` or `List<String>`.
- **Common names:** `T` for type, `E` for element, `K` and `V` for key and value, `N` for number.

## Why are Generics used?

Look at a list from the days before generics.

```java
List items = new ArrayList();
items.add("SKU-1042");
items.add(77);                 // compiles fine
String s = (String) items.get(1);  // crash here
```

Nothing stopped the number from going in, and the cast failed much later. Generics fix three problems at once:

- **Type safety.** `List<String>` refuses an `Integer` at compile time, so the error appears where the bug is, not in some distant place.
- **No casts.** `get` returns a `String` already, so your code is shorter and cleaner.
- **Reuse.** One `Crate<T>` class works for bolts, jars and wire. You write the logic once, and every use stays type-checked.

The whole Collections Framework, `Optional`, `Comparator` and the Stream API are built on generics.

## Real-Life Example

In the warehouse, the inspector at the loading dock reads every crate label. If someone tries to drop a glass jar into a crate labelled "Hex Bolts", the inspector stops them right there. Once the crates pass inspection and go onto the truck, the labels are peeled off to save time. The truck driver only knows he carries "crates", but because the inspector already checked everything, nothing wrong can come out at the other end.

Map it back to Java: the label is the type argument, the inspector is the compiler, and the peeled labels are type erasure. The truck is the JVM at run time, which sees only a plain `Crate` with no label.

## Syntax

```java
class Crate<T> {                       // generic class
    private T item;
    void put(T item) { this.item = item; }
    T take() { return item; }
}

static <T> Crate<T> pack(T item) {...}  // generic method

static <N extends Number> double total(List<N> xs)  // bound

double sum(List<? extends Number> xs)  // reads numbers
void fill(List<? super Integer> xs)    // writes Integers
```

- `class Crate<T>` declares a type parameter. Inside the class, `T` stands for whatever type the user picks.
- `static <T> Crate<T> pack(T item)` is a generic method. The `<T>` before the return type declares its own parameter, and Java infers it from the argument.
- `<N extends Number>` is a bounded type. `N` may be `Integer`, `Double` or any other `Number`, so you can call `doubleValue()` on it.
- `? extends Number` is a wildcard for a list you only read from. It accepts `List<Integer>` and `List<Double>`.
- `? super Integer` is a wildcard for a list you write into. It accepts `List<Integer>`, `List<Number>` and `List<Object>`.

The last two follow the rule known as **PECS**: Producer `extends`, Consumer `super`. If a list produces values for you, use `extends`. If it consumes values you put in, use `super`.

## How Generics Work

Generics exist only for the compiler. This process is called **type erasure**.

```text
Source code
Crate<Bolt> c = new Crate<>();
Bolt b = c.take();
        |
        v
javac checks the types
put(Bolt) ok, put(Jar) error
        |
        v
javac erases T -> Object
(or T -> its bound)
        |
        v
Bytecode
Crate c = new Crate();
Bolt b = (Bolt) c.take();
```

First the compiler checks every use of `Crate<Bolt>` against the declaration and reports any mismatch. Then it erases the type parameter. Inside the class, `T` becomes `Object`, or its bound if it has one, so `<N extends Number>` becomes `Number`. Wherever a value comes out, such as `take()`, the compiler inserts a cast back to `Bolt`. The cast can never fail, because the checks already proved it safe.

This design kept new code compatible with old bytecode, but it has side effects you must know:

- At run time `Crate<Bolt>` and `Crate<Jar>` are the same class, `Crate`.
- You cannot write `new T()` or `new T[10]`, since `T` no longer exists.
- `obj instanceof Crate<Bolt>` does not compile. Use `instanceof Crate<?>`.
- Type arguments must be reference types, so you write `List<Integer>`, never `List<int>`.

## Example Programs

### A generic crate and a generic method

```java
class Crate<T> {
    private final String label;
    private T item;

    Crate(String label) { this.label = label; }

    void put(T item) { this.item = item; }
    T take() { return item; }
    String label() { return label; }
}

public class WarehouseCrates {
    static <T> Crate<T> pack(String label, T item) {
        Crate<T> c = new Crate<>(label);
        c.put(item);
        return c;
    }

    public static void main(String[] args) {
        Crate<String> wire = pack("Aisle 4", "Copper wire");
        Crate<Integer> bolts = pack("Aisle 9", 250);

        String what = wire.take();          // no cast
        int count = bolts.take() + 50;      // no cast

        System.out.println(wire.label() + ": " + what);
        System.out.println(bolts.label() + ": " + count
                + " bolts");
        System.out.println("Same class at run time? "
                + (wire.getClass() == bolts.getClass()));
        System.out.println("Class name: "
                + wire.getClass().getSimpleName());
    }
}
```

**Output:**

```text
Aisle 4: Copper wire
Aisle 9: 300 bolts
Same class at run time? true
Class name: Crate
```

One `Crate` class serves both text and numbers, and `take()` needs no cast. The last two lines prove erasure: both crates share one runtime class with no type label.

### Bounds and wildcards in the stockroom

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Stockroom {
    // bounded type: N must be a Number
    static <N extends Number> double total(List<N> weights) {
        double sum = 0;
        for (N w : weights) {
            sum += w.doubleValue();
        }
        return sum;
    }

    // producer: we only read from it
    static double heaviest(List<? extends Number> list) {
        double max = 0;
        for (Number n : list) {
            max = Math.max(max, n.doubleValue());
        }
        return max;
    }

    // consumer: we only write into it
    static void addEmptyPallets(List<? super Integer> sink) {
        sink.add(0);
        sink.add(0);
    }

    public static void main(String[] args) {
        List<Integer> boxesKg = Arrays.asList(12, 30, 8);
        List<Double> drumsKg = Arrays.asList(55.5, 61.25);

        System.out.println("Boxes total: " + total(boxesKg));
        System.out.println("Drums total: " + total(drumsKg));
        System.out.println("Heaviest drum: "
                + heaviest(drumsKg));

        List<Number> log = new ArrayList<>();
        log.add(4.5);
        addEmptyPallets(log);
        System.out.println("Log: " + log);
    }
}
```

**Output:**

```text
Boxes total: 50.0
Drums total: 116.75
Heaviest drum: 61.25
Log: [4.5, 0, 0]
```

`total` and `heaviest` accept lists of any `Number` subtype. `addEmptyPallets` happily writes into a `List<Number>`, because a list of `Number` can hold an `Integer`. With `? extends` instead, the `add` calls would not compile.

### Why raw types are risky

```java
import java.util.ArrayList;
import java.util.List;

public class RawShelf {
    @SuppressWarnings({"rawtypes", "unchecked"})
    static void careless(List shelf) {
        shelf.add(404);   // no check on a raw List
    }

    public static void main(String[] args) {
        List<String> skus = new ArrayList<>();
        skus.add("JAR-88");
        careless(skus);
        System.out.println("Size: " + skus.size());

        try {
            for (String sku : skus) {
                System.out.println(sku.toLowerCase());
            }
        } catch (ClassCastException e) {
            System.out.println("Read failed: "
                    + e.getClass().getSimpleName());
        }
    }
}
```

**Output:**

```text
Size: 2
jar-88
Read failed: ClassCastException
```

The raw `List` turned off every check, so an `Integer` slipped into a list of strings. The program only crashed later, inside the loop, where the hidden cast to `String` failed. This is called heap pollution.

## Wildcards at a Glance

| Form | Accepts | Can read as | Can add |
|---|---|---|---|
| `List<Number>` | Only `List<Number>` | `Number` | Any `Number` |
| `List<?>` | Any list | `Object` | Only `null` |
| `? extends Number` | `Number` or subtypes | `Number` | Only `null` |
| `? super Integer` | `Integer` or supertypes | `Object` | `Integer` |

## Common Mistakes

> **Warning:** `List<Integer>` is not a subtype of `List<Number>`, even though `Integer` is a subtype of `Number`. If it were, you could add a `Double` to a list of integers through the `Number` view. Use `List<? extends Number>` when you need a method to accept both.

- **Using raw types.** `List` without `<...>` silences the compiler and moves errors to run time. Always give a type argument, or use `<?>` when you truly do not care.
- **Primitive type arguments.** `Crate<int>` does not compile. Use the wrapper, `Crate<Integer>`.
- **Creating a `T`.** `new T()` and `new T[5]` are illegal because `T` is erased. Pass a `Supplier<T>` or a `Class<T>` instead.
- **Overloads that erase alike.** `void load(List<String>)` and `void load(List<Integer>)` both erase to `load(List)`, so the class does not compile.

## Interview Questions

**What is type erasure?**
It is how Java implements generics. The compiler checks all generic types, then replaces each type parameter with `Object` or its bound and adds casts where values come out. The JVM never sees the type arguments, which kept generic code compatible with older bytecode.

**Why is List<Integer> not a subtype of List<Number>?**
Generics are invariant. If a `List<Integer>` could be used as a `List<Number>`, code could add a `Double` to it and break the integer list. Wildcards like `List<? extends Number>` give safe, read-only flexibility instead.

**What does PECS mean?**
It stands for Producer Extends, Consumer Super. Use `? extends T` for a collection you read `T` values from, and `? super T` for one you write `T` values into. `Collections.copy(dest, src)` follows this rule exactly.

**What is a bounded type parameter?**
It limits which types can be used, as in `<N extends Number>`. Inside the method you may call any `Number` method on `N`, and after erasure `N` becomes `Number` rather than `Object`.

**Why can't generics use primitive types?**
After erasure, a type parameter becomes `Object` or its bound, and a primitive like `int` is not an object. So you use wrapper classes such as `Integer`, and autoboxing converts values in and out.

## Summary

- Generics add a type parameter to classes, interfaces and methods.
- The compiler checks types at compile time and removes the need for casts.
- `<T extends X>` bounds a type, so you can call `X`'s methods on it.
- Use `? extends` to read, `? super` to write: Producer Extends, Consumer Super.
- Type erasure replaces `T` with `Object` or its bound and inserts casts.
- Raw types switch off all checks and lead to `ClassCastException` later.

## Related Topics

- [Collection Framework](/learning/java-tutorial/collection-framework): every list, set and map is a generic type.
- [ArrayList](/learning/java-tutorial/arraylist): the most common generic class in daily Java code.
- [Wrapper Classes](/learning/java-tutorial/wrapper-classes): why `List<Integer>` is used instead of `List<int>`.
