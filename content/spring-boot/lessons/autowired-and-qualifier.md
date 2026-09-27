Picture the payment counter of an online shop. The customer can pay by UPI, by card or from a wallet. All three are payment methods, and the cashier, a class in our program, just says "take this payment". But what if the shop owner tells the cashier: "Use the UPI machine"? Then the cashier knows exactly which of the three machines to use.

That is what @Autowired and @Qualifier do in Spring. `@Autowired` says "please give me a bean". `@Qualifier` says "and I mean this particular one". In this guide you will learn how Spring picks a bean, what goes wrong when two beans match, and three ways to make the choice clear.

## What are @Autowired and @Qualifier?

> **Definition:** `@Autowired` asks Spring to inject a matching bean into a constructor, setter or field. `@Qualifier` narrows the choice by bean name when more than one bean matches the requested type.

Let's take them one by one.

- **`@Autowired`.** Spring looks at the type you asked for and searches the container for a bean of that type. If it finds exactly one, it injects it. On a class with a single constructor you can leave `@Autowired` out, because Spring already knows to use that constructor.
- **`@Qualifier`.** It carries the name of a bean, such as `@Qualifier("upi")`. Spring uses that name to choose one bean out of several candidates of the same type.

## Why is it used?

Injection by type works beautifully while there is one bean of each type. Real programs soon have several. One `PaymentMethod` interface may have UPI, card and wallet versions, each a bean. If a class asks only for `PaymentMethod`, Spring sees three matches and does not know which one you mean.

- **Ambiguity is a startup error.** Spring will not guess. It stops with an `UnsatisfiedDependencyException` that says it expected a single bean but found several, and it lists their names.
- **You stay in control.** `@Qualifier` puts the choice right where the dependency is used.
- **Easy to read.** Anyone who reads `@Qualifier("upi")` knows which method the class uses.
- **Flexible.** Different classes can use different beans of the same type.

## How it works

Spring follows a fixed order when it must pick a bean for a constructor parameter.

```text
+--------------------------------+
|  Find beans of the wanted type |
+--------------------------------+
                |
                v
+--------------------------------+
|  Exactly one? Inject it        |
+--------------------------------+
                |
       more than one
                v
+--------------------------------+
|  @Qualifier present? Pick the  |
|  bean with that name           |
+--------------------------------+
                |
                v
+--------------------------------+
|  @Primary present? Pick it     |
+--------------------------------+
                |
                v
+--------------------------------+
|  Parameter name equals a bean  |
|  name? Pick it                 |
+--------------------------------+
                |
                v
+--------------------------------+
|  Still unsure: stop with an    |
|  error                         |
+--------------------------------+
```

First, Spring collects all beans of the requested type. If there is one, the job is done. If there are several, it looks for a `@Qualifier` first, then for a bean marked `@Primary`, and then compares the parameter name with the bean names. If none of these settles it, startup fails.

So you have three ways to resolve a tie:

| Way | How it looks | Good when |
|---|---|---|
| `@Qualifier` | `@Qualifier("upi") PaymentMethod method` | One consumer needs one specific bean |
| Matching the name | `PaymentMethod card` (parameter named like the bean) | You want no extra annotation |
| `@Primary` | On one bean class | Most classes want the same default |

`@Primary` gets its own guide next. There is one more trick: you can ask for all the beans at once with `List<PaymentMethod>` or `Map<String, PaymentMethod>`. The map keys are the bean names.

> **Tip:** Prefer `@Qualifier` over relying on the parameter name. A parameter name can change during a rename, and the code quietly picks a different bean.

## Real-Life Example

A school office has three printers: one for black and white sheets, one for colour and one for photos. The teacher who prepares the exam paper writes a note on her print request: "Use the black and white printer." That note is the `@Qualifier`. The peon who prints notices for the display board always uses the printer near his desk, because it has the same name as his room. That is matching by name. If a request has no note at all, the office uses the one marked "default", which is `@Primary`.

## Code Example

Let's build ShopEasy's checkout. There are three payment methods. The `CheckoutService` uses `@Qualifier` to choose UPI. The `RefundService` picks the card bean by parameter name. A `PaymentDirectory` receives every method in a map. Use the same `pom.xml` as the first CineGo example, changing only the groupId and artifactId.

```text
shopeasy/
└─ src/main/java/
   └─ com/shopeasy/pay/
      ├─ PayApplication.java
      ├─ PaymentMethod.java
      ├─ UpiPayment.java
      ├─ CardPayment.java
      ├─ WalletPayment.java
      ├─ CheckoutService.java
      ├─ RefundService.java
      ├─ PaymentDirectory.java
      └─ PayRunner.java
```

**File:** `PayApplication.java` in package `com.shopeasy.pay`

```java
package com.shopeasy.pay;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PayApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(PayApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `PaymentMethod.java` in package `com.shopeasy.pay`

```java
package com.shopeasy.pay;

public interface PaymentMethod {

    String pay(int amount);
}
```

**File:** `UpiPayment.java` in package `com.shopeasy.pay`

```java
package com.shopeasy.pay;

import org.springframework.stereotype.Component;

@Component("upi")
public class UpiPayment implements PaymentMethod {

    @Override
    public String pay(int amount) {
        return "UPI: Rs " + amount;
    }
}
```

**File:** `CardPayment.java` in package `com.shopeasy.pay`

```java
package com.shopeasy.pay;

import org.springframework.stereotype.Component;

@Component("card")
public class CardPayment implements PaymentMethod {

    @Override
    public String pay(int amount) {
        return "Card: Rs " + amount;
    }
}
```

**File:** `WalletPayment.java` in package `com.shopeasy.pay`

```java
package com.shopeasy.pay;

import org.springframework.stereotype.Component;

@Component
public class WalletPayment implements PaymentMethod {

    @Override
    public String pay(int amount) {
        return "Wallet: Rs " + amount;
    }
}
```

**File:** `CheckoutService.java` in package `com.shopeasy.pay`

```java
package com.shopeasy.pay;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class CheckoutService {

    private final PaymentMethod method;

    public CheckoutService(@Qualifier("upi") PaymentMethod method) {
        this.method = method;
    }

    public String checkout(int amount) {
        return method.pay(amount);
    }
}
```

**File:** `RefundService.java` in package `com.shopeasy.pay`

```java
package com.shopeasy.pay;

import org.springframework.stereotype.Service;

@Service
public class RefundService {

    private final PaymentMethod method;

    public RefundService(PaymentMethod card) {
        this.method = card;
    }

    public String refund(int amount) {
        return method.pay(amount);
    }
}
```

**File:** `PaymentDirectory.java` in package `com.shopeasy.pay`

```java
package com.shopeasy.pay;

import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Component;

@Component
public class PaymentDirectory {

    private final Map<String, PaymentMethod> methods;

    public PaymentDirectory(Map<String, PaymentMethod> methods) {
        this.methods = new TreeMap<>(methods);
    }

    public String names() {
        return String.join(", ", methods.keySet());
    }
}
```

**File:** `PayRunner.java` in package `com.shopeasy.pay`

```java
package com.shopeasy.pay;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class PayRunner implements CommandLineRunner {

    private final CheckoutService checkout;
    private final RefundService refund;
    private final PaymentDirectory directory;

    public PayRunner(CheckoutService checkout, RefundService refund, PaymentDirectory directory) {
        this.checkout = checkout;
        this.refund = refund;
        this.directory = directory;
    }

    @Override
    public void run(String... args) {
        System.out.println("Checkout " + checkout.checkout(500));
        System.out.println("Refund " + refund.refund(200));
        System.out.println("Methods: " + directory.names());
    }
}
```

Build and run it:

```bash
mvn -q package
java -jar target/pay-0.0.1-SNAPSHOT.jar
```

**Output:**

```text
Checkout UPI: Rs 500
Refund Card: Rs 200
Methods: card, upi, walletPayment
```

Checkout used the UPI bean because of the qualifier. The refund used the card bean because the parameter is named `card`. The directory received all three beans, and their keys are the bean names, where the wallet has the default name `walletPayment`.

Now see what happens when Spring cannot choose. If `CheckoutService` asks for a plain `PaymentMethod method` with no qualifier, and no other rule helps, startup fails. The important part of the message, trimmed and split over lines, reads:

```text
APPLICATION FAILED TO START

Parameter 0 of constructor in
CheckoutService required a
single bean, but 3 were found:
  - card
  - upi
  - walletPayment
```

## Code Explained

- `@Component("upi")` and `@Component("card")` give the two beans short, clear names. `WalletPayment` keeps its default name.
- `@Qualifier("upi")` on the constructor parameter tells Spring to use the bean named `upi`, ignoring the other two.
- `RefundService` has no annotation on its parameter. Spring sees three candidates, notices that the parameter is named `card`, and chooses the bean with that name. Spring Boot's Maven setup keeps parameter names in the compiled classes, which makes this work.
- `Map<String, PaymentMethod>` asks for every bean of that type, with the bean names as keys. We copy it into a `TreeMap` so the names print in sorted order.
- Neither service uses `@Autowired`, because each has one constructor.

## Common Mistakes

> **Warning:** A wrong name in `@Qualifier` does not fall back to another bean. Spring stops at startup with "no qualifying bean". Check that the name matches the bean name exactly, including letter case.

- **Relying on parameter names by accident.** Renaming the parameter silently changes the chosen bean. Use `@Qualifier` when the choice matters.
- **Putting `@Qualifier` on the wrong place.** For constructor injection it goes on the parameter, not on the constructor or the class.
- **Forgetting that the default name starts with a lower case letter.** The bean for `WalletPayment` is `walletPayment`.
- **Using `@Autowired` on a field and calling it a day.** It still fails when two beans match. Injection style does not solve ambiguity, a qualifier does.

## Interview Questions

**What does `@Autowired` do?**
It asks Spring to inject a matching bean by type into a constructor, setter or field.

**When do you need `@Qualifier`?**
When more than one bean of the required type exists and you must say which one to inject.

**What happens if two beans match and nothing resolves the tie?**
Spring stops at start-up with an error that says it expected a single matching bean but found several, and it lists their names.

## Key Points to Remember

- `@Autowired` injects by type, and it is optional on a class with a single constructor.
- If several beans match, Spring needs help: `@Qualifier`, `@Primary` or a matching name.
- `@Qualifier("name")` picks the bean with that exact name.
- `List<T>` and `Map<String, T>` inject all the beans of a type.
- Ambiguity is caught when the app starts, not when a customer pays.

## Frequently Asked Questions

### What is the difference between @Autowired and @Qualifier?

`@Autowired` asks for a bean by type. `@Qualifier` adds a name to make that request precise when there are several beans of the type. They are often used together.

### Do I still need @Autowired in Spring Boot 4?

Not on a class with one constructor. You still write it on setters and fields, and on one constructor when there are several.

### Can I use @Qualifier on a class?

Yes. Putting `@Qualifier("fast")` on a bean class gives it a qualifier label, and injection points can ask for that label. Most projects simply use the bean name.

### What is the difference between @Primary and @Qualifier?

`@Primary` sets a default bean for everyone. `@Qualifier` is chosen by each consumer, and it wins over `@Primary` when both are present.

## Related Topics

- [Primary Annotation](/learning/spring-boot-tutorial/primary-annotation): set a default bean when several match.
- [Dependency Injection](/learning/spring-boot-tutorial/dependency-injection): the basics behind injection.
- [Constructor vs Setter vs Field Injection](/learning/spring-boot-tutorial/constructor-vs-setter-vs-field-injection): where `@Autowired` goes.
- [Configuration and Bean](/learning/spring-boot-tutorial/configuration-and-bean): create several beans of one type.
