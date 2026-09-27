Imagine a tea stall owner. He makes wonderful tea, but he does not grow the tea leaves, milk the cow or mine the sugar. Every morning a supplier drops the leaves, milk and sugar at his stall. He just uses them. If a new supplier brings better leaves tomorrow, the owner still makes tea exactly the same way.

That is Dependency Injection. A class does its own job and receives everything else from outside. In this guide you will learn what it is, why Spring likes it so much, and how to build a small food delivery service that uses it, including a quick trick that shows why it makes testing easy.

## What is Dependency Injection?

A **dependency** is anything a class needs to do its work. A delivery service needs a payment gateway. A report needs a printer. The gateway and the printer are dependencies.

**Injection** means the dependency is handed to the class from outside, instead of the class creating it.

> **Definition:** Dependency Injection (DI) is a technique where an object receives the other objects it depends on, usually through its constructor, instead of creating them itself. In Spring, the container does the injecting.

In the last guide you learned that Inversion of Control moves the control of object creation to the container. DI is the way that control is used. The container looks at what each class asks for, finds or builds those things, and passes them in.

There are three main ways to inject:

- **Constructor injection.** The dependency arrives as a constructor parameter. This is the style Spring recommends.
- **Setter injection.** The dependency arrives through a setter method after the object is built.
- **Field injection.** The dependency is placed straight into a private field with `@Autowired`.

We use the constructor style here. A later guide compares all three in detail.

## Why is it used?

Consider a class that builds its own helper.

```java
public class DeliveryService {
    private final UpiGateway gateway = new UpiGateway();
}
```

Now the service can only ever use UPI. Want cards? Edit the class. Want to test it without touching a real bank? You cannot. DI removes these limits.

- **Loose coupling.** The service depends on an interface, `PaymentGateway`. It does not care which class sits behind it.
- **Easy testing.** In a test you can pass a fake gateway that never contacts a bank.
- **Easy change.** Move from UPI to another gateway by changing one class or one setting. The service stays untouched.
- **Less boilerplate.** You stop writing `new` and setup code again and again. The container does it once.
- **Clear needs.** A constructor lists exactly what the class needs. Anyone reading it knows at a glance.

## How it works

When Spring starts, it decides how to satisfy each constructor.

```text
+--------------------------------+
|  DeliveryService constructor   |
|  asks for a PaymentGateway     |
+--------------------------------+
                |
                v
+--------------------------------+
|  Container looks for a bean    |
|  of type PaymentGateway        |
+--------------------------------+
                |
                v
+--------------------------------+
|  Finds UpiGateway (a bean)     |
+--------------------------------+
                |
                v
+--------------------------------+
|  Calls new DeliveryService     |
|  with that UpiGateway          |
+--------------------------------+
```

Spring reads the constructor of `DeliveryService`. It sees the parameter type `PaymentGateway`. It searches its list of beans for one that fits, and finds `UpiGateway`, because that class implements the interface. Then it creates the service and passes the gateway in.

Here is the picture of who knows whom.

```text
DeliveryService
      |
      | knows only the interface
      v
PaymentGateway  <----  UpiGateway
   (contract)          (real work)
```

The service points at the contract, not at the worker. That is why you can replace the worker later without touching the service.

> **Tip:** If a class has exactly one constructor, you do not even need `@Autowired`. Spring uses that constructor automatically.

## Real-Life Example

A food delivery app such as the one on your phone has many moving parts. The order screen needs a payment method, a delivery partner and a notification sender. The screen itself does not go looking for them. When a customer opens the app, the platform gives the screen the right payment method for that customer's country and the right partner for that area. The screen just calls `pay()` and `assign()`.

The screen is your class. The payment method and the delivery partner are its dependencies. The platform that hands them over plays the role of the Spring container.

## Code Example

Let's build QuickBite, a small food ordering service. A `DeliveryService` takes an order and asks a `PaymentGateway` to collect the money. We will also create the service by hand with a fake gateway to see how easy testing becomes. Use the same `pom.xml` as the first CineGo example, changing only the groupId and artifactId.

```text
quickbite/
└─ src/main/java/
   └─ com/quickbite/orders/
      ├─ OrdersApplication.java
      ├─ PaymentGateway.java
      ├─ UpiGateway.java
      ├─ DeliveryService.java
      └─ OrderRunner.java
```

**File:** `OrdersApplication.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(OrdersApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `PaymentGateway.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

public interface PaymentGateway {

    String pay(int amount);
}
```

**File:** `UpiGateway.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

import org.springframework.stereotype.Component;

@Component
public class UpiGateway implements PaymentGateway {

    @Override
    public String pay(int amount) {
        return "Paid Rs " + amount + " by UPI";
    }
}
```

**File:** `DeliveryService.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

import org.springframework.stereotype.Service;

@Service
public class DeliveryService {

    private final PaymentGateway gateway;

    public DeliveryService(PaymentGateway gateway) {
        this.gateway = gateway;
    }

    public String placeOrder(String dish, int amount) {
        return dish + ": " + gateway.pay(amount);
    }
}
```

**File:** `OrderRunner.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class OrderRunner implements CommandLineRunner {

    private final DeliveryService service;

    public OrderRunner(DeliveryService service) {
        this.service = service;
    }

    @Override
    public void run(String... args) {
        System.out.println(service.placeOrder("Biryani", 450));

        // no Spring here: we inject a fake by hand
        PaymentGateway fake = amount -> "Fake pay Rs " + amount;
        DeliveryService testService = new DeliveryService(fake);
        System.out.println(testService.placeOrder("Biryani", 450));
    }
}
```

Build and run it:

```bash
mvn -q package
java -jar target/orders-0.0.1-SNAPSHOT.jar
```

**Output:**

```text
Biryani: Paid Rs 450 by UPI
Biryani: Fake pay Rs 450
```

The first line came from the service that Spring built and wired with `UpiGateway`. The second line came from a service we built by hand with a fake gateway. Same class, different helper, and no edits to `DeliveryService`.

## Code Explained

- `PaymentGateway` is the contract. It says what a gateway can do, but not how.
- `UpiGateway` is one real worker. `@Component` makes it a bean, so the container can inject it.
- `DeliveryService` lists `PaymentGateway` in its constructor. That is its only dependency, and it stores it in a `final` field so it can never change.
- `@Service` is a special kind of `@Component` that tells readers this class holds business logic.
- In `OrderRunner`, the fake gateway is written as a lambda, because the interface has only one method. We pass it in with plain Java. This shows that constructor injection needs no Spring at all in tests.

## Constructor Injection at a Glance

| Point | Constructor injection |
|---|---|
| Where the dependency arrives | As a constructor parameter |
| Can the field be `final`? | Yes |
| Can you create the object without Spring? | Yes, just call `new` with a fake |
| What if a dependency is missing? | The app fails at startup, not later |
| Recommended by Spring? | Yes, for required dependencies |

## Common Mistakes

> **Warning:** Do not create a dependency with `new` inside a bean and call it injection. If `DeliveryService` writes `new UpiGateway()` itself, Spring is not involved, and you lose the ability to swap it.

- **Depending on the concrete class.** Asking for `UpiGateway` instead of `PaymentGateway` ties the service to one worker again. Prefer the interface.
- **Two beans of one type.** If two classes implement `PaymentGateway` and both are beans, Spring cannot choose. You will fix this with `@Primary` or `@Qualifier`, covered soon.
- **Circular dependencies.** If `A` needs `B` and `B` needs `A`, constructor injection cannot build either. Spring Boot stops with an error. Redesign so the dependency runs one way.

## Interview Questions

**What is Dependency Injection?**
It is a technique where a class receives the objects it needs from outside, usually in its constructor, instead of creating them. Spring's container performs the injection.

**What are the types of injection in Spring?**
Constructor injection, setter injection and field injection. Constructor injection is the recommended choice for required dependencies.

**How does DI help unit testing?**
You can build the class with a fake or mock dependency by calling its constructor, so the test needs no database, bank or network.

## Key Points to Remember

- A dependency is any object a class needs. Injection means it is handed in from outside.
- Spring injects by looking for a bean whose type matches the constructor parameter.
- Depend on interfaces so the real worker can be changed without touching the caller.
- Constructor injection lets you use `final` fields and build the object by hand in tests.
- Missing or circular dependencies are caught when the app starts.

## Frequently Asked Questions

### Do I need @Autowired on the constructor?

Not when the class has a single constructor. Spring uses it automatically. You add `@Autowired` only when a class has several constructors and you need to mark the one to use.

### What is the difference between Inversion of Control and Dependency Injection?

Inversion of Control is the principle that a framework controls object creation. Dependency Injection is the technique of passing dependencies into a class. Spring uses DI to achieve IoC.

### Can I inject values like numbers and text?

Yes, but not through bean lookup. You use `@Value` or configuration properties for that, and both are covered later in the course.

### What happens if Spring cannot find a dependency?

The app refuses to start and prints a message saying that no bean of the needed type is available. It is better to learn this at startup than in front of a customer.

## Related Topics

- [Inversion of Control](/learning/spring-boot-tutorial/inversion-of-control): understand the principle behind injection.
- [Constructor vs Setter vs Field Injection](/learning/spring-boot-tutorial/constructor-vs-setter-vs-field-injection): compare the three ways to inject.
- [Autowired and Qualifier](/learning/spring-boot-tutorial/autowired-and-qualifier): choose between beans of the same type.
- [Spring Beans](/learning/spring-boot-tutorial/spring-beans): learn what the container is really holding.
