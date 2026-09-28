Every bank branch follows the head office rulebook. One rule says, "Pay interest to accounts at the end of each month." A savings account and a fixed deposit both obey that rule, yet they calculate the amount in very different ways. The instruction has one name, while each kind of account carries its own way of doing it.

Java models this with method overriding. A child class keeps the parent's method name and parameters but supplies its own body. The surprising part is that Java decides which body to run only while the program is running, by looking at the real object. Below you will learn the rules, the role of `@Override` and `super`, how runtime dispatch works, and which methods can never be overridden.

## What is Method Overriding?

> **Definition:** Method overriding happens when a subclass declares an instance method with the same name and the same parameter list as a method it inherits, so that the subclass version replaces the parent version for objects of the subclass.

For a method to count as an override, it must follow these rules:

- **Same signature.** The name and the parameter types must match exactly. Different parameters make it an overload instead.
- **Compatible return type.** It must be the same type or, for objects, a subtype. A subtype return is called a covariant return type.
- **Access not narrower.** A `public` method stays `public`. A `protected` one can become `public`, but never `private`.
- **Checked exceptions not broader.** The child may throw fewer or narrower checked exceptions, never new or wider ones. Unchecked exceptions are free.
- **Inherited and instance level.** The parent method must be visible to the child and must not be `static`, `private` or `final`.

Why so many rules? They all protect one promise. Any code that works with a parent reference must keep working when a child object is plugged in. If a child could hide a public method, throw a surprise checked exception or return an unrelated type, the caller holding an `Account` reference would suddenly break. The rules make sure a child can change how a job is done, but never break the contract the parent already offered.

## Why is Method Overriding used?

Inheritance gives a child everything the parent has. Often that inherited behaviour is almost right, but not quite. Overriding lets the child fix just that piece.

- **Specialised behaviour.** Each account type calculates interest its own way while keeping one method name.
- **Polymorphism.** Code can hold an `Account` reference and call `monthlyInterest()` without knowing the exact type. The right version runs automatically.
- **Open for extension.** A new account type can be added later without editing the code that loops over accounts.
- **Reuse with extras.** Through `super.method()` a child can run the parent logic and then add its own lines.
- **Framework hooks.** Methods like `toString()`, `equals()` and `run()` exist to be overridden by your classes.

## Real-Life Example

Think of the rule "prepare the monthly statement". The head office defines a basic statement: account number and balance. A branch serving business customers keeps that statement but adds a section of GST details. A branch serving senior citizens keeps it too and adds the pension credit.

The head office rule is the parent method. Each branch's version is an override. When a branch staff member adds sections after printing the basic part, that is `super.statement()` followed by extra lines. And when an auditor asks any branch for "the monthly statement", the branch that receives the request decides which version is printed. In Java terms, the object decides, not the variable that refers to it.

## Syntax

```java
class Parent {
    protected ReturnType action(ParamType p) {
        // parent behaviour
    }
}

class Child extends Parent {
    @Override
    public ReturnType action(ParamType p) {
        super.action(p);
        // extra or different behaviour
    }
}
```

Reading it line by line:

- The parent declares `action` as a normal instance method.
- `Child extends Parent`, so `action` is inherited.
- `@Override` asks the compiler to confirm that this really overrides something. If you misspell the name, compilation fails.
- The access widens from `protected` to `public`, which is allowed.
- `super.action(p)` runs the parent version first. It is optional and can go anywhere in the method.

## How Method Overriding Works

Overriding is resolved in two stages. The compiler checks that the call is legal using the reference type. The JVM then picks the body using the real object type. This is called dynamic method dispatch.

```text
Account acc = new Savings();
acc.monthlyInterest();
            |
            v
 COMPILER: does Account
 declare monthlyInterest()?
 yes -> call is allowed
            |
            v
 JVM: real object is Savings
            |
            v
 search Savings first
 found -> run Savings code
 not found -> go up to Account
```

Each class keeps a method table listing which body to use for every overridable method. When `Savings` overrides `monthlyInterest()`, its table entry points to the new body, while entries it did not override still point to the parent. At runtime the JVM follows the object's own table, so the same line of code can run different methods for different objects. Static, private and final methods skip this lookup: the compiler binds them directly, which is why they cannot be overridden.

## Example Programs

### Runtime Dispatch Across Account Types

```java
class Account {
    protected final String id;
    protected final double balance;

    Account(String id, double balance) {
        this.id = id;
        this.balance = balance;
    }

    double monthlyInterest() {
        return 0;
    }
}

class SavingsAccount extends Account {
    SavingsAccount(String id, double balance) {
        super(id, balance);
    }

    @Override
    double monthlyInterest() {
        return balance * 0.03 / 12;
    }
}

class FixedDeposit extends Account {
    FixedDeposit(String id, double balance) {
        super(id, balance);
    }

    @Override
    double monthlyInterest() {
        return balance * 0.072 / 12;
    }
}

public class BranchInterest {
    public static void main(String[] args) {
        Account[] book = {
            new Account("CUR-1", 50000),
            new SavingsAccount("SAV-2", 40000),
            new FixedDeposit("FD-3", 100000)
        };
        for (Account a : book) {
            long rupees = Math.round(a.monthlyInterest());
            System.out.println(a.id + ": Rs " + rupees);
        }
    }
}
```

**Output:**

```text
CUR-1: Rs 0
SAV-2: Rs 100
FD-3: Rs 600
```

The loop variable is always of type `Account`, yet each object runs its own `monthlyInterest()`. That choice happens at runtime.

### super.method() and a Covariant Return

```java
class Statement {
    protected final String accountNo;

    Statement(String accountNo) {
        this.accountNo = accountNo;
    }

    void print() {
        System.out.println("Account " + accountNo);
    }

    Statement copy() {
        return new Statement(accountNo);
    }
}

class BusinessStatement extends Statement {
    private final String gstin;

    BusinessStatement(String accountNo, String gstin) {
        super(accountNo);
        this.gstin = gstin;
    }

    @Override
    public void print() {
        super.print();
        System.out.println("GSTIN " + gstin);
    }

    @Override
    BusinessStatement copy() {
        return new BusinessStatement(accountNo, gstin);
    }
}

public class MonthlyStatements {
    public static void main(String[] args) {
        BusinessStatement s = new BusinessStatement("778", "27AB9");
        BusinessStatement dup = s.copy();
        dup.print();
        System.out.println("Same object? " + (s == dup));
    }
}
```

**Output:**

```text
Account 778
GSTIN 27AB9
Same object? false
```

The child's `print()` reuses the parent lines through `super.print()` and widens access to `public`. Its `copy()` returns the narrower type `BusinessStatement`, so no cast is needed in `main`.

### What Cannot Be Overridden

```java
class HeadOffice {
    static String bankName() {
        return "Head office bank";
    }

    private String secretCode() {
        return "HO-SECRET";
    }

    String reportCode() {
        return secretCode();
    }

    String greet() {
        return "Welcome from HO";
    }
}

class CityBranch extends HeadOffice {
    static String bankName() {
        return "City branch bank";
    }

    String secretCode() {
        return "CITY-CODE";
    }

    @Override
    String greet() {
        return "Welcome from City";
    }
}

public class BindingCheck {
    public static void main(String[] args) {
        HeadOffice ref = new CityBranch();
        System.out.println(ref.greet());
        System.out.println(HeadOffice.bankName());
        System.out.println(CityBranch.bankName());
        System.out.println(ref.reportCode());
    }
}
```

**Output:**

```text
Welcome from City
Head office bank
City branch bank
HO-SECRET
```

Only `greet()` is truly overridden. The static `bankName()` in the child hides the parent one, so the class named in the call decides. The parent's private `secretCode()` is invisible to the child, so `reportCode()` still calls the parent version.

## Common Mistakes

> **Common mistake:** Changing a parameter type by accident, for example `monthlyInterest(int months)` in the child. That creates a new overload, and the parent version keeps running through an `Account` reference. Always add `@Override` so the compiler catches it.

- **Narrowing access.** Overriding a `public` method as `protected` fails with "attempting to assign weaker access privileges".
- **Throwing a broader checked exception.** If the parent method throws nothing, the child cannot add `throws Exception`.
- **Trying to override a `final` method.** The compiler reports "overridden method is final". Final exists to lock a method.
- **Expecting fields to be overridden.** Fields are chosen by the reference type. Only methods take part in runtime dispatch.

## Interview Questions

**What is dynamic method dispatch?**
It is the process where the JVM chooses which overridden method to run based on the real object type at runtime. The reference type only decides whether the call compiles.

**Can we override a static method?**
No. Declaring the same static method in a child hides the parent one. Which one runs depends on the class or reference type used in the call, not on the object.

**What is a covariant return type?**
An overriding method may return a subtype of the parent method's return type. For example, a parent returning `Statement` can be overridden by a child returning `BusinessStatement`.

**Why should we use the @Override annotation?**
It tells the compiler that the method must override something in a parent type. If the signature is wrong, you get a compile error instead of a silent new method.

**Can a constructor be overridden?**
No. Constructors are not inherited, and each class's constructor carries that class's own name. A child can only call a parent constructor through `super(...)`.

## Summary

- Overriding replaces an inherited instance method using the same name and parameters.
- The return type may be a subtype, access cannot be narrower and checked exceptions cannot be broader.
- `@Override` makes the compiler verify the override.
- `super.method()` runs the parent version from inside the child.
- The JVM picks the body at runtime from the real object type.
- Static, private and final methods cannot be overridden.

## Related Topics

- [Inheritance](/learning/java-tutorial/inheritance): the parent-child link that overriding builds on.
- [Method Overloading](/learning/java-tutorial/method-overloading): same name with different parameters, decided at compile time.
- [super Keyword](/learning/java-tutorial/super-keyword): calling the parent version from an override.
- [Polymorphism](/learning/java-tutorial/polymorphism): the bigger idea that runtime dispatch makes possible.
