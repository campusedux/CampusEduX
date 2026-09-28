A cricket scorer does not write a full letter every time a batter hits a four. He makes a quick mark in the right column and moves on, because the scoresheet already says what each column means. Before Java 8, passing a small piece of behaviour to a method was more like writing that letter: a whole anonymous class, braces, a method signature and `@Override`, all for one line of logic.

Lambda expressions are the quick mark. They let you hand a short function to a method in a single, readable line. Here you will learn the syntax, how a lambda connects to a functional interface, which built-in interfaces to reach for, and the rule about variables a lambda may use.

## What are Lambda Expressions?

> **Definition:** A lambda expression is a short, unnamed function that you can store in a variable or pass to a method. It provides the body of the single abstract method of a functional interface, and the compiler works out the parameter and return types from that interface.

A few points make this clearer:

- A lambda has parameters, an arrow `->` and a body, but no name and no return type written out.
- It can only be used where a **functional interface** is expected. That is an interface with exactly one abstract method, such as `Runnable`, `Comparator` or `Predicate`.
- Default and static methods do not count, so an interface may have several of those and still be functional.

## Why are Lambda Expressions used?

Lambdas exist to pass behaviour as easily as you pass data.

- **Much less code.** Five or six lines of anonymous class shrink to one.
- **Clearer intent.** The reader sees the logic, like `b.runs - a.runs`, instead of boilerplate.
- **Power for library methods.** `sort`, `removeIf`, `forEach`, `computeIfAbsent` and the whole Stream API take lambdas.
- **Flexible methods.** One method can filter by any rule the caller supplies, so you do not need one method per rule.
- **Lighter at run time.** A lambda does not create a separate `.class` file the way an anonymous class does.

## Real-Life Example

Think of a cricket team captain setting a field. The coaching manual has a fixed form: "Rule for choosing the next bowler: given the batter, return a bowler." That form is the functional interface. It says what goes in and what comes out, but not the thinking.

Before each over, the captain fills in the form with a quick rule of his own, such as "left-handed batter, bring on the off-spinner." That short rule is the lambda. He does not write a new manual each time; he just supplies the logic that fits the blank.

The umpire, who is the method receiving the rule, does not care who wrote it. He only knows it fits the form and calls it when needed.

## Syntax

```java
(parameters) -> expression
(parameters) -> { statements; return value; }

Runnable r = () -> System.out.println("Play!");
Predicate<Integer> big = runs -> runs >= 100;
Comparator<String> byLen = (a, b) -> a.length() - b.length();
```

- The parentheses hold the parameters. Leave them empty for none, and drop them for exactly one untyped parameter, as in `runs -> ...`.
- Parameter types are usually left out because the compiler reads them from the interface. You may write them, as in `(int a, int b) -> a + b`.
- The arrow `->` separates the parameters from the body.
- A single expression body returns its value automatically, with no `return` and no braces.
- A block body in braces needs a `return` statement when the method returns something.
- The target type on the left, such as `Predicate<Integer>`, tells Java which method the lambda implements.

## How Lambda Expressions Work

A lambda has no meaning on its own. It gets its meaning from the functional interface it is assigned to, which is called its target type.

```text
interface Scorer {
  int score(int runs, int balls);
}
        |
        v
(r, b) -> r * 100 / b
        |
        v
r, b  -> runs, balls
body  -> score() body
type  -> Scorer
        |
        v
JVM builds a Scorer object
(invokedynamic, no Outer$1)
```

The compiler looks at the target type, finds its only abstract method, and matches the lambda to it. The lambda's parameters line up with the method's parameters, and its body becomes the method body. Instead of writing a hidden class file, the compiler emits an `invokedynamic` instruction, and the JVM creates the object the first time that line runs. Calling `scorer.score(45, 30)` then simply runs your lambda body.

A lambda may use local variables from the surrounding method, but only if they are **effectively final**. That means the variable is never changed after its first assignment, even if you do not write `final`. The lambda captures the value, and the rule keeps that captured value from going out of date. Fields of the enclosing object are not limited in this way, and inside a lambda `this` refers to the enclosing object, not to the lambda.

## Example Programs

### From anonymous class to lambda

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

public class BattingOrder {
    static class Batter {
        String name; int runs;
        Batter(String n, int r) { name = n; runs = r; }
        public String toString() { return name + " " + runs; }
    }

    public static void main(String[] args) {
        List<Batter> card = new ArrayList<>(Arrays.asList(
                new Batter("Rohan", 34),
                new Batter("Imran", 88),
                new Batter("Kiran", 12)));

        card.sort(new Comparator<Batter>() {
            @Override
            public int compare(Batter a, Batter b) {
                return a.name.compareTo(b.name);
            }
        });
        System.out.println("By name:");
        System.out.println(card);

        card.sort((a, b) -> b.runs - a.runs);
        System.out.println("By runs:");
        System.out.println(card);
    }
}
```

**Output:**

```text
By name:
[Imran 88, Kiran 12, Rohan 34]
By runs:
[Imran 88, Rohan 34, Kiran 12]
```

Both calls pass a `Comparator` to `sort`. The anonymous class needs six lines; the lambda says the same thing in one, because the compiler already knows `compare` takes two batters and returns an `int`.

### Built-in functional interfaces

```java
import java.util.function.BiFunction;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier;

public class ScoreboardTools {
    public static void main(String[] args) {
        Predicate<Integer> isFifty = runs -> runs >= 50;
        Function<Integer, String> label =
                runs -> runs >= 100 ? "century" : "innings";
        Consumer<String> announce =
                msg -> System.out.println(">> " + msg);
        Supplier<String> venue = () -> "Eden Gardens";
        BiFunction<Integer, Integer, Integer> strikeRate =
                (runs, balls) -> runs * 100 / balls;

        System.out.println(isFifty.test(62));
        System.out.println(label.apply(104));
        announce.accept("Drinks break");
        System.out.println(venue.get());
        System.out.println(strikeRate.apply(45, 30));
    }
}
```

**Output:**

```text
true
century
>> Drinks break
Eden Gardens
150
```

The `java.util.function` package already has interfaces for the common shapes: a test that returns `boolean`, a converter, an action with no result, a value maker and a two-input function. Each lambda runs only when its interface method, such as `test` or `apply`, is called.

### Your own interface and captured values

```java
public class BonusPoints {
    @FunctionalInterface
    interface BonusRule {
        int bonus(int runs);
    }

    static void show(String name, int runs, BonusRule rule) {
        System.out.println(name + ": +" + rule.bonus(runs));
    }

    public static void main(String[] args) {
        int milestone = 50;
        int reward = 10;
        // milestone++;  // would break the lambda below

        BonusRule rule = runs -> {
            if (runs >= milestone) {
                return reward;
            }
            return 0;
        };

        show("Anaya", 73, rule);
        show("Vikram", 18, rule);
        show("Sara", 50, runs -> runs / 10);
    }
}
```

**Output:**

```text
Anaya: +10
Vikram: +0
Sara: +5
```

`@FunctionalInterface` asks the compiler to check that `BonusRule` has exactly one abstract method. The lambda reads `milestone` and `reward` from `main`, which works because neither is changed. The last call passes a different rule to the same method, showing how behaviour travels as an argument.

## Common Mistakes

> **Common mistake:** Changing a local variable that a lambda uses. Even `count++` on a captured local causes the compile error "local variables referenced from a lambda expression must be final or effectively final". Use a field, an `AtomicInteger`, or better, a stream operation that returns the count.

- **Using a lambda without a functional interface.** `Object o = () -> {};` does not compile, because `Object` gives no target method.
- **Adding a second abstract method.** A lambda cannot implement an interface with two abstract methods. `@FunctionalInterface` catches this early.
- **Forgetting `return` in a block body.** With braces, a value-returning lambda must say `return`; without braces, it must not.
- **Writing long lambdas.** If the body grows beyond a few lines, move it into a named method and use a method reference.

## Interview Questions

**What is a functional interface, and how does it relate to a lambda?**
A functional interface has exactly one abstract method, such as `Runnable` or `Comparator`. A lambda is always an implementation of that one method, so it can only be assigned or passed where such an interface is expected.

**What does effectively final mean?**
A local variable is effectively final if it is never reassigned after it is first given a value. Lambdas and anonymous classes may read such variables, which keeps the captured value from changing under them.

**How is a lambda different from an anonymous class?**
A lambda is shorter, can only implement a functional interface, and does not create its own `this` or a separate class file. An anonymous class can implement interfaces with many methods, extend classes and hold its own state.

**Which built-in functional interfaces are used most, and what are their methods?**
`Predicate<T>` has `test` and returns a `boolean`. `Function<T, R>` has `apply` and converts T to R. `Consumer<T>` has `accept` and returns nothing. `Supplier<T>` has `get` and takes no input.

**Is the @FunctionalInterface annotation required?**
No, any interface with one abstract method works with lambdas. The annotation is a safety check that makes the compiler reject the interface if someone adds a second abstract method.

## Summary

- A lambda is a short, unnamed function written as parameters, an arrow and a body.
- It always implements the single abstract method of a functional interface, its target type.
- Parameter and return types come from that interface, so they are usually left out.
- `java.util.function` supplies ready interfaces like `Predicate`, `Function`, `Consumer` and `Supplier`.
- Captured local variables must be effectively final.
- Lambdas power sorting, `removeIf`, `forEach` and the Stream API.

## Related Topics

- [Functional Interfaces](/learning/java-tutorial/functional-interfaces): the target types every lambda needs.
- [Method References](/learning/java-tutorial/method-references): an even shorter form when a method already exists.
- [Stream API](/learning/java-tutorial/stream-api): where lambdas do most of their daily work.
- [Comparator](/learning/java-tutorial/comparator): the sorting interface lambdas replaced anonymous classes for.
