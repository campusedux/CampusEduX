Join a gym and you get a membership card, not a key to the office. You cannot open the member register and write "unlimited visits" next to your name. You tap the card at the front desk, and the desk decides whether you still have visits left, subtracts one, and lets you in. The data about you is real and it changes every day, but you only ever touch it through the desk.

That front desk is encapsulation. In Java it means keeping an object's data private and letting the outside world change it only through methods that check every request. Below you will see how to write such classes, how validation protects the rules an object must always obey, how to build read-only and fully immutable classes, and why a private `List` field can still leak unless you copy it.

## What is Encapsulation?

> **Definition:** Encapsulation is the practice of keeping an object's fields `private` and exposing only methods that read or change them under the class's own rules. The data and the code that guards it live together in one class.

Three ideas sit at the heart of it:

- **Hidden state.** Fields are `private`, so no other class can read or write them directly.
- **Controlled access.** Getters return values, and setters or action methods such as `checkIn()` change them after checking the input.
- **Invariants.** An invariant is a rule that must be true for every object at all times, such as "visits left is never negative". Encapsulation is how a class keeps its invariants true.

## Why is Encapsulation used?

Suppose a `Membership` class had a public `visitsLeft` field. Any line anywhere in the program could set it to -40 or to a million. When the report shows a strange number, you would have to search every file to find the culprit.

With a private field, only the methods of `Membership` can change it. If those methods refuse bad values, a bad value can never exist, and a bug in the count can live in only one class.

Encapsulation also lets you change the inside freely. You might later store visits as a list of dates instead of a count. As long as `getVisitsLeft()` still returns the right number, no caller needs to change. Finally, it makes objects easier to trust across threads, test and reuse, because their state changes only in known, well-named ways.

## Real-Life Example

Think of the gym's front desk again. The member register behind the counter is the private field. The receptionist is the class's method. When you ask to check in, she looks at your record, confirms you have visits left and your plan has not expired, subtracts one, and hands you a towel. If you ask her to add fifty free visits, she politely refuses.

You can ask to see your remaining visits, and she reads them out, which is a getter. You can renew your plan, and she accepts only valid plans, which is a validating setter. You never hold the register itself. Map it back: register is data, receptionist is methods, her checks are validation, and the rule "never below zero" is the invariant.

## Syntax

```java
public class Membership {
    private int visitsLeft;             // hidden state

    public int getVisitsLeft() {        // read access
        return visitsLeft;
    }

    public void setVisitsLeft(int v) {  // guarded write
        if (v < 0) {
            throw new IllegalArgumentException("negative");
        }
        visitsLeft = v;
    }
}
```

- `private int visitsLeft` hides the field. Code outside the class gets a compile error if it names it.
- `getVisitsLeft()` is the getter. By convention it starts with `get`, or `is` for a `boolean`.
- `setVisitsLeft(int v)` is the setter. It checks the value before storing it.
- Throwing `IllegalArgumentException` rejects bad input loudly instead of storing it quietly.
- A field with a getter and no setter is read-only from outside. Adding `final` makes it fixed for life.

## How Encapsulation Works

Every change travels through a method, and the method is a gate that can say no.

```text
caller: m.setVisitsLeft(-5)
        |
        v
setVisitsLeft(int v)
        |
        v
v in 0..60? --no--> throw
        |           exception
       yes
        |
        v
visitsLeft = v  (private)
```

The caller cannot jump past the gate, because the field is `private` and the compiler blocks any direct access. So the only path to `visitsLeft` runs through the check. If the check fails, the method throws, the field keeps its old value, and the object is still valid.

Private fields have one weak spot: a field that holds a mutable object, such as an `ArrayList`. The field itself is private, but the list it points to is not.

```text
Leaky: store and return as is
caller list --> [Yoga, Spin]
field       --^
Safe: copy in, read-only out
caller list --> [Yoga, Spin]
field       --> [Yoga, Spin]
                 own copy
```

In the leaky version, the caller's variable and the private field point to the same list, so the caller can add or remove classes behind the object's back. The safe version makes its own copy in the constructor, which is called a defensive copy. Its getter returns a read-only view, so nobody outside can change the real list. The next programs show both cases running.

## Example Programs

### A membership that guards its visits

```java
class Membership {
    private final String memberId;
    private int visitsLeft;

    Membership(String memberId, int visits) {
        this.memberId = memberId;
        setVisitsLeft(visits);
    }

    public String getMemberId() { return memberId; }
    public int getVisitsLeft() { return visitsLeft; }

    public void setVisitsLeft(int visits) {
        if (visits < 0 || visits > 60) {
            throw new IllegalArgumentException(
                    "visits must be 0-60, got " + visits);
        }
        visitsLeft = visits;
    }

    public void checkIn() {
        if (visitsLeft == 0) {
            throw new IllegalStateException(
                    "no visits left for " + memberId);
        }
        visitsLeft--;
    }
}

public class FrontDesk {
    public static void main(String[] args) {
        Membership m = new Membership("GYM-081", 2);
        m.checkIn();
        m.checkIn();
        System.out.println("Left: " + m.getVisitsLeft());
        try {
            m.checkIn();
        } catch (IllegalStateException e) {
            System.out.println("Error: " + e.getMessage());
        }
        try {
            m.setVisitsLeft(-5);
        } catch (IllegalArgumentException e) {
            System.out.println("Error: " + e.getMessage());
        }
        m.setVisitsLeft(12);
        System.out.println("Renewed: " + m.getVisitsLeft());
    }
}
```

**Output:**

```text
Left: 0
Error: no visits left for GYM-081
Error: visits must be 0-60, got -5
Renewed: 12
```

The constructor calls the setter, so even a brand new object passes the same check. The third check-in and the negative renewal are both refused, and the count never leaves the range 0 to 60.

### Defensive copies of a List field

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

class LeakyPlan {
    private final List<String> classes;
    LeakyPlan(List<String> classes) { this.classes = classes; }
    public List<String> getClasses() { return classes; }
}

class SafePlan {
    private final List<String> classes;
    SafePlan(List<String> classes) {
        this.classes = new ArrayList<>(classes);
    }
    public List<String> getClasses() {
        return Collections.unmodifiableList(classes);
    }
}

public class ClassPlans {
    public static void main(String[] args) {
        List<String> picks =
                new ArrayList<>(Arrays.asList("Yoga", "Spin"));
        LeakyPlan leaky = new LeakyPlan(picks);
        SafePlan safe = new SafePlan(picks);

        picks.add("Boxing");
        System.out.println("Leaky: " + leaky.getClasses());
        System.out.println("Safe : " + safe.getClasses());

        leaky.getClasses().clear();
        System.out.println("Leaky: " + leaky.getClasses());
        try {
            safe.getClasses().add("Zumba");
        } catch (UnsupportedOperationException e) {
            System.out.println("Safe plan refused the change");
        }
        System.out.println("Safe : " + safe.getClasses());
    }
}
```

**Output:**

```text
Leaky: [Yoga, Spin, Boxing]
Safe : [Yoga, Spin]
Leaky: []
Safe plan refused the change
Safe : [Yoga, Spin]
```

`LeakyPlan` has a `private final` field and still lost control of its data, because it shared the caller's list. `SafePlan` copied the list on the way in and handed out a read-only view on the way out.

### An immutable gym pass

```java
final class GymPass {
    private final String owner;
    private final String plan;
    private final int months;

    GymPass(String owner, String plan, int months) {
        if (months < 1 || months > 24) {
            throw new IllegalArgumentException("months 1-24");
        }
        this.owner = owner;
        this.plan = plan;
        this.months = months;
    }

    public String getPlan() { return plan; }

    public GymPass withPlan(String newPlan) {
        return new GymPass(owner, newPlan, months);
    }

    @Override
    public String toString() {
        return owner + " / " + plan + " / " + months + "m";
    }
}

public class PassUpgrade {
    public static void main(String[] args) {
        GymPass basic = new GymPass("Rhea", "Basic", 6);
        GymPass gold = basic.withPlan("Gold");
        System.out.println("Before: " + basic);
        System.out.println("After : " + gold);
        System.out.println("Same object? " + (basic == gold));
    }
}
```

**Output:**

```text
Before: Rhea / Basic / 6m
After : Rhea / Gold / 6m
Same object? false
```

An immutable class has `private final` fields, no setters, and is itself `final` so no subclass can add a setter. A "change" such as `withPlan` returns a new object, and the old pass stays exactly as it was.

## Encapsulation vs Abstraction

| Point | Encapsulation | Abstraction |
|---|---|---|
| Hides | The object's data | How a task is done |
| Focus | Protection, the state | Design, the contract |
| Java tools | Private fields, getters | Abstract classes, interfaces |
| Question | Who can touch its data? | What can it do? |

They support each other. Abstraction chooses which operations a type offers, and encapsulation makes sure the data behind those operations stays valid.

## Common Mistakes

> **Common mistake:** Writing a private field with a getter and a setter that store anything without checks. That is a public field with extra typing. A setter earns its place only when it protects a rule, or when there is no setter at all.

- **Returning a mutable field directly.** Giving out the real `List`, array or `Date` lets callers change it. Return a copy or a read-only view.
- **Storing the caller's object as is.** Copy mutable arguments in the constructor, or the caller can still change them later.
- **Skipping validation in the constructor.** Call the same checks there, or an invalid object can be born.
- **Adding a setter for every field by habit.** Many fields, like an ID, should never change after creation.

## Interview Questions

**What is encapsulation in Java?**
It is bundling data with the methods that work on it and hiding the data behind `private` access. Other classes change the state only through methods, which can check every request and keep the object valid.

**Is a class encapsulated just because its fields are private?**
Not fully. If a getter returns a mutable object such as a `List`, or the constructor stores a caller's list, outsiders can still change the state. Defensive copies and read-only views close that gap.

**What is a class invariant?**
It is a condition that must hold for every object of the class after every public method call, for example "visits left is between 0 and 60". Encapsulation lets one class enforce it, because no other code can touch the fields.

**How do you make a class immutable?**
Make the class `final`, make every field `private final`, set them all in the constructor, and provide no setters. Copy mutable inputs on the way in and return copies or read-only views on the way out.

**How is encapsulation different from abstraction?**
Encapsulation protects an object's data and asks who may change it. Abstraction hides how an operation is done and asks what a type can do. Private fields serve the first, while interfaces and abstract classes serve the second.

## Summary

- Encapsulation keeps fields `private` and exposes methods that follow the class's rules.
- Setters and action methods should validate input and throw on bad values.
- Invariants stay true because only the class itself can change its fields.
- A getter with no setter gives read-only access; `final` fields fix the value for life.
- Copy mutable fields on the way in and out, or a private `List` can still leak.
- Immutable classes are `final`, have only `private final` fields and return new objects for changes.

## Related Topics

- [Access Modifiers](/learning/java-tutorial/access-modifiers): the `private` and `public` keywords that make hiding possible.
- [Abstraction](/learning/java-tutorial/abstraction): the partner principle that hides how work is done.
- [final Keyword](/learning/java-tutorial/final-keyword): fixed fields and final classes for immutable objects.
- [Constructors](/learning/java-tutorial/constructors): where validation and defensive copies begin.
