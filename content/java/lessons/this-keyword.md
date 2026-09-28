Call a pizza shop and say, "Add extra cheese to my order." The person at the counter knows which order you mean, because you are the one talking. You did not read out an order number. The word "my" was enough to point at your order among the dozens on the board.

Inside a Java object, the keyword `this` plays the role of "my". When a method runs, `this` points to the object that the method was called on. It sounds small, yet it solves several everyday problems: name clashes, repeated constructor code, method chaining and handing an object to a helper. By the end of this page you will know all six common uses and why `this` disappears inside static code.

## What is the this Keyword?

> **Definition:** `this` is a reference, available inside every constructor and instance method, that points to the current object: the object whose constructor is running or on which the method was called.

You never declare `this`. Java supplies it automatically. Its type is the class you are in, and it can never be `null`, because a method cannot run on an object that does not exist.

The six common uses are:

- `this.field` to reach a field hidden by a parameter with the same name.
- `this(...)` to call another constructor of the same class.
- `this.method()` to call another method on the same object.
- Passing `this` as an argument to a method.
- Passing `this` to the constructor of another class.
- `return this;` so calls can be chained on one line.

## Why is the this Keyword used?

Most of the time Java can guess which object you mean, so `this` stays invisible. It becomes necessary in a few clear situations.

- **Clear names.** Constructors read best when the parameter is called `size`, just like the field. `this.size = size` tells Java which one is which.
- **No repeated setup.** Several constructors can share one "main" constructor through `this(...)`, so the setup code lives in one place.
- **Self-introduction.** An object can hand itself to another object, for example an order registering itself with the kitchen.
- **Fluent code.** Setters that return `this` let you write `order.size("L").crust("thin")` instead of three separate lines.
- **Readability.** Some teams write `this.` before every field so fields and local variables are easy to tell apart.

## Real-Life Example

Picture the order board in a pizza kitchen. Each slip is a separate order, and the chef works on one slip at a time. When the chef says "this slip needs olives", everyone knows which slip is meant: the one in the chef's hand.

Nobody writes the slip number on every instruction, because the slip in hand is obvious from context. A Java method is the chef, and each object is a slip. The same method code is shared by every object of the class, just as one chef handles every slip. The word `this` is the slip currently in hand. When the chef moves to the next slip, "this" means the new slip, although the chef's routine has not changed at all.

## Syntax

```java
class ClassName {
    private String field;

    ClassName() {
        this("default");
    }

    ClassName(String field) {
        this.field = field;
    }

    ClassName change(String value) {
        this.field = value;
        return this;
    }

    void share(Helper h) {
        h.accept(this);
    }
}
```

Line by line:

- `this("default");` calls the other constructor. It must be the very first statement in the constructor.
- `this.field = field;` copies the parameter (right side) into the field (left side).
- `return this;` sends back the same object, so another call can follow with a dot.
- `h.accept(this);` passes the current object to a helper that expects a `ClassName`.

## How the this Keyword Works

Each instance method receives a hidden extra parameter. You never see it in your code, but the compiler adds it. When you call `orderA.addTopping("olive")`, the JVM quietly passes `orderA` as that hidden parameter, and inside the method it is named `this`.

```text
orderA.addTopping("olive")
            |
            v
 JVM passes the hidden value
 this   = orderA
 item   = "olive"
            |
            v
 this.toppings.add(item)
            |
            v
 orderA's own list changes
```

Because only one copy of the method code exists, the hidden reference is how the code knows whose fields to touch. Call the same method on `orderB`, and `this` now holds `orderB`. Static methods do not receive this hidden reference, since they are called on the class, not on an object. That is exactly why `this` cannot appear in a static method.

Here is a detail that surprises many learners: you use `this` far more often than you type it. When a method writes `toppings.add(item)` or calls `print()` with no object in front, the compiler reads it as `this.toppings.add(item)` or `this.print()`. The keyword is silently added for you. Typing it yourself changes nothing in the compiled code. You only must write it when a parameter or local variable shares the field's name, because the nearest name always wins, and the local one is nearer.

## Example Programs

### Field vs Parameter and this() Chaining

```java
class PizzaOrder {
    private final String size;
    private final String flavour;
    private final int quantity;

    PizzaOrder(String flavour) {
        this("Medium", flavour, 1);
        System.out.println("Quick order used");
    }

    PizzaOrder(String size, String flavour, int quantity) {
        this.size = size;
        this.flavour = flavour;
        this.quantity = quantity;
        System.out.println("Main constructor ran");
    }

    void show() {
        System.out.println(quantity + " x " + size
            + " " + flavour);
    }
}

public class PizzaCounter {
    public static void main(String[] args) {
        PizzaOrder a = new PizzaOrder("Large", "Paneer", 2);
        a.show();
        PizzaOrder b = new PizzaOrder("Farmhouse");
        b.show();
    }
}
```

**Output:**

```text
Main constructor ran
2 x Large Paneer
Main constructor ran
Quick order used
1 x Medium Farmhouse
```

The one-argument constructor hands its work to the full constructor through `this(...)`, so the field setup exists in one place. Inside that constructor, `this.size` is the field and plain `size` is the parameter.

### Method Chaining with return this

```java
import java.util.ArrayList;
import java.util.List;

class CustomPizza {
    private String crust = "regular";
    private final List<String> toppings = new ArrayList<>();

    CustomPizza crust(String crust) {
        this.crust = crust;
        return this;
    }

    CustomPizza add(String topping) {
        this.toppings.add(topping);
        return this;
    }

    void print() {
        System.out.println(crust + " crust");
        System.out.println("Toppings: " + toppings);
    }
}

public class ChainedOrder {
    public static void main(String[] args) {
        new CustomPizza()
            .crust("thin")
            .add("olive")
            .add("corn")
            .print();
    }
}
```

**Output:**

```text
thin crust
Toppings: [olive, corn]
```

Every setter returns the same object, so each dot continues working on it. This is the style used by `StringBuilder` and many builder classes.

### Passing the Current Object

```java
class Kitchen {
    void accept(TableOrder order) {
        System.out.println("Kitchen got table "
            + order.getTable());
    }
}

class Bill {
    private final TableOrder order;

    Bill(TableOrder order) {
        this.order = order;
    }

    int total() {
        return order.getPizzas() * 250;
    }
}

class TableOrder {
    private final int table;
    private final int pizzas;

    TableOrder(int table, int pizzas) {
        this.table = table;
        this.pizzas = pizzas;
    }

    int getTable() { return table; }

    int getPizzas() { return pizzas; }

    void send(Kitchen k) {
        k.accept(this);
    }

    Bill makeBill() {
        return new Bill(this);
    }

    boolean isSame(TableOrder other) {
        return this == other;
    }
}

public class TableService {
    public static void main(String[] args) {
        TableOrder t7 = new TableOrder(7, 3);
        t7.send(new Kitchen());
        System.out.println("Bill: Rs " + t7.makeBill().total());
        System.out.println("Same object? " + t7.isSame(t7));
    }
}
```

**Output:**

```text
Kitchen got table 7
Bill: Rs 750
Same object? true
```

The order passes itself to a method (`k.accept(this)`) and to a constructor (`new Bill(this)`). The last line proves that `this` inside the method is the very same object as `t7` in `main`.

## Common Mistakes

> **Common mistake:** Writing `size = size;` in a constructor. Both names refer to the parameter, so the parameter is assigned to itself and the field stays `null` or 0. Write `this.size = size;`.

- **Placing `this(...)` after other code.** The call must be the first statement, or the compiler reports an error.
- **Using `this` in a static method.** Code such as `this.show()` inside `main` fails with "non-static variable this cannot be referenced from a static context".
- **Creating a constructor loop.** If two constructors call each other through `this(...)`, the compiler rejects it as recursive invocation.
- **Letting `this` escape too early.** Passing `this` to another object inside the constructor shares an object that is not fully built yet.

## Interview Questions

**What does `this` refer to in Java?**
It refers to the current object, the one whose instance method or constructor is running. Java passes it in automatically, and it is never `null`.

**Why can't `this` be used inside a static method?**
A static method belongs to the class and runs without any object. There is no current object to point to, so the compiler does not allow `this` there.

**Can we call both `this()` and `super()` in the same constructor?**
No. Each must be the first statement, and only one statement can be first. A constructor that calls `this(...)` reaches the parent constructor through the constructor it calls.

**What is method chaining and how does `this` help?**
Method chaining means calling several methods one after another on the same object in a single statement. Each method returns `this`, so the next call works on the same object.

**Is it necessary to write `this.` before every field?**
No. It is only required when a local variable or parameter has the same name as the field. Many teams still use it for clarity, but the compiled result is identical.

## Summary

- `this` is a reference to the current object inside constructors and instance methods.
- `this.field` separates a field from a parameter of the same name.
- `this(...)` calls another constructor and must come first.
- An object can pass `this` to methods and to other constructors.
- Returning `this` enables method chaining.
- Static methods have no current object, so they cannot use `this`.

## Related Topics

- [Constructors](/learning/java-tutorial/constructors): where `this(...)` chaining happens.
- [super Keyword](/learning/java-tutorial/super-keyword): the parent-class partner of `this`.
- [static Keyword](/learning/java-tutorial/static-keyword): why static code has no `this`.
- [StringBuilder](/learning/java-tutorial/stringbuilder): a real class that uses method chaining.
