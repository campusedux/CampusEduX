Think about a busy bakery. Every time a cake leaves the counter, someone must write it in the register, someone must check the stock, and someone must note the time. If the baker did all of this by hand for each cake, there would be no time left to bake. So the shop puts a small routine at the counter, and every order passes through it. The baker only thinks about cakes.

Spring AOP works the same way. It lets you put common jobs, such as logging or checks, in one place instead of copying them into every method.

In this guide you will learn what AOP is, the words that go with it, how Spring runs your extra code around a method, and how to build a working example.

## What is Spring AOP?

AOP stands for Aspect-Oriented Programming. Normal code is organised by what it does: orders, payments, stock. Some jobs cut across all of them, like logging, security checks and timing. These are called cross-cutting concerns.

> **Definition:** Spring AOP is a Spring feature that runs extra code, kept in one class called an aspect, before, after or around chosen methods, without changing those methods.

Here are the words you will meet:

| Term | Meaning | Bakery picture |
|---|---|---|
| Aspect | A class holding the extra code | The counter routine |
| Advice | The extra code itself and when it runs | Write in the register |
| Join point | A moment where advice can run; in Spring, a method call | One cake leaving |
| Pointcut | A rule that picks the join points | Every cake order |
| Target | The object being wrapped | The cake service |
| Proxy | A stand-in object Spring creates | The counter clerk |

## Why is it used?

Without AOP, the same lines appear everywhere:

- A log line at the start and end of fifty methods.
- The same "is the user allowed?" check in every service.
- Timing code wrapped around every slow call.

This copying makes code long and easy to break. Change the log format once and you must edit fifty places. With AOP, you write the job once, describe where it applies, and Spring does the rest. Your business methods stay short and focus on one task.

Spring itself uses AOP behind the scenes. `@Transactional`, `@Cacheable` and `@Async` all work through proxies, which is why understanding AOP explains many strange bugs later.

## How it works

Spring does not change your class. When the app starts, it notices that an aspect matches the `CakeService` bean. It then builds a proxy, a stand-in object with the same methods, and puts the proxy in the container instead of the real bean.

```text
Caller
  |
  v
+---------------------+
| Proxy (made by      |
| Spring)             |
+---------------------+
  |  1. run advice
  |  2. call real method
  v
+---------------------+
| CakeService         |
| (your real bean)    |
+---------------------+
  |
  v
  3. run advice, return
```

The caller thinks it is talking to `CakeService`, but it talks to the proxy first. The proxy runs your advice, forwards the call to the real bean, and runs more advice on the way back. That is all the magic there is.

There are five kinds of advice:

```text
@Before          runs first
@Around          wraps the call
@AfterReturning  only on success
@AfterThrowing   only on exception
@After           always, last
```

`@Around` is the strongest. It receives the call itself and decides whether to continue, and it can change the result. The others are simpler and cannot stop the method.

The two most common ways to write a pointcut are:

- `execution(...)` picks methods by their signature, for example every method of one class.
- `@annotation(Audited)` picks every method that carries your own annotation.

## Real-Life Example

A hospital reception writes down every patient file that leaves the records room: who took it, at what time, and who returned it. The doctors do not write this themselves. The records clerk does it for every file, whichever doctor asks. If the hospital wants to add a stamp to each file tomorrow, only the clerk's routine changes. The clerk is the aspect. The files are the method calls. The rule "every file leaving the room" is the pointcut.

## Code Example

Let's build SweetCrumb, a bakery service. We will log every call to the cake service, print the bill, report failures, and audit methods marked with our own `@Audited` annotation.

**File:** `pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.1.1</version>
        <relativePath/>
    </parent>

    <groupId>com.sweetcrumb</groupId>
    <artifactId>bakery</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aspectj</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `Audited.java` in package `com.sweetcrumb.bakery`

```java
package com.sweetcrumb.bakery;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {
}
```

**File:** `CakeService.java` in package `com.sweetcrumb.bakery`

```java
package com.sweetcrumb.bakery;

import org.springframework.stereotype.Service;

@Service
public class CakeService {

    private int stock = 10;

    @Audited
    public int orderCake(String flavour, int quantity) {
        if (quantity < 1) {
            throw new IllegalArgumentException("Order at least one cake");
        }
        stock -= quantity;
        return quantity * 450;
    }

    public int stockLeft() {
        return stock;
    }
}
```

**File:** `ShopAspect.java` in package `com.sweetcrumb.bakery`

```java
package com.sweetcrumb.bakery;

import java.util.Arrays;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class ShopAspect {

    @Before("execution(* com.sweetcrumb.bakery.CakeService.*(..))")
    public void logCall(JoinPoint jp) {
        System.out.println("[before] " + jp.getSignature().getName()
                + " " + Arrays.toString(jp.getArgs()));
    }

    @AfterReturning(pointcut = "execution(* com.sweetcrumb.bakery.CakeService.orderCake(..))",
            returning = "bill")
    public void logBill(Object bill) {
        System.out.println("[returned] bill " + bill);
    }

    @AfterThrowing(pointcut = "execution(* com.sweetcrumb.bakery.CakeService.*(..))",
            throwing = "ex")
    public void logFailure(Exception ex) {
        System.out.println("[failed] " + ex.getMessage());
    }

    @Around("@annotation(Audited)")
    public Object audit(ProceedingJoinPoint pjp) throws Throwable {
        System.out.println("[audit] start");
        try {
            return pjp.proceed();
        } finally {
            System.out.println("[audit] end");
        }
    }
}
```

**File:** `BakeryApplication.java` in package `com.sweetcrumb.bakery`

```java
package com.sweetcrumb.bakery;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BakeryApplication {

    public static void main(String[] args) {
        SpringApplication.run(BakeryApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(CakeService cakes) {
        return args -> {
            System.out.println("Bill: " + cakes.orderCake("Chocolate", 2));
            try {
                cakes.orderCake("Mango", 0);
            } catch (IllegalArgumentException e) {
                System.out.println("Caught: " + e.getMessage());
            }
            System.out.println("Stock: " + cakes.stockLeft());
        };
    }
}
```

Run it with `./mvnw spring-boot:run`:

**Output:**

```text
[audit] start
[before] orderCake [Chocolate, 2]
[returned] bill 900
[audit] end
Bill: 900
[audit] start
[before] orderCake [Mango, 0]
[failed] Order at least one cake
[audit] end
Caught: Order at least one cake
[before] stockLeft []
Stock: 8
```

## Code Explained

- `spring-boot-starter-aspectj` brings Spring AOP and the AspectJ annotations. In Spring Boot 3 this starter was called `spring-boot-starter-aop`.
- `@Aspect` marks the class as an aspect, and `@Component` lets Spring find it. Both are needed.
- The `execution` pointcut in `ShopAspect` means any return type, any method of `CakeService`, any arguments. That is why `stockLeft` also prints a `[before]` line.
- `@Audited` is our own annotation. The pointcut `@annotation(Audited)` matches only methods that carry it, so `stockLeft` is not audited.
- In the first call the order is `[audit] start`, `[before]`, the real method, `[returned]`, then `[audit] end`. The `@Around` advice is the outer layer and the others sit inside it.
- In the failing call `@AfterReturning` is skipped and `@AfterThrowing` runs. The `finally` block still prints `[audit] end`, and the exception then reaches the caller.
- The business method `orderCake` has no logging code at all.

> **Tip:** Prefer a custom annotation such as `@Audited` for pointcuts. Anyone reading the service can see which methods are affected, and moving a method does not break the rule.

## Common Mistakes

> **Warning:** Calling another method of the same class from inside it, `this.otherMethod()`, skips the proxy. Advice will not run on that inner call. Move the method to another bean, or inject the bean and call it through the proxy.

- **Forgetting `@Component` on the aspect.** The class then exists but Spring never uses it.
- **Forgetting `proceed()` in `@Around`.** The real method never runs and the caller gets `null` or an error.
- **Swallowing the exception in `@Around`.** If you catch it and do not rethrow, the caller thinks everything worked.
- **Expecting advice on `private` or `final` methods.** Proxies can only wrap public methods that can be overridden or delegated.
- **Using a pointcut that is too broad.** `execution(* *(..))` in the whole app slows everything and logs noise.

## Interview Questions

**What is AOP and why do we need it?**
It moves cross-cutting jobs such as logging, security and transactions out of business code into one place, so methods stay short and the job is written once.

**What are the types of advice?**
`@Before`, `@After`, `@AfterReturning`, `@AfterThrowing` and `@Around`.

**What is the difference between a join point and a pointcut?**
A join point is a moment when advice could run, for example a method call. A pointcut is the rule that selects which join points actually get advice.

**How does Spring AOP work internally?**
It creates a proxy around the target bean, using JDK dynamic proxies or CGLIB, and the proxy runs advice around each call.

**Why does self-invocation not trigger advice?**
Because the call goes from `this` to `this`, never through the proxy.

## Key Points to Remember

- AOP runs shared code around methods without editing them.
- An aspect holds advice; a pointcut chooses where the advice applies.
- Spring AOP uses proxies, so only calls that arrive through the proxy are advised.
- `@Around` can change arguments, results and exceptions; call `proceed()` exactly when you want the method to run.
- In Spring Boot 4 the starter is `spring-boot-starter-aspectj`.
- `@Transactional`, `@Cacheable` and `@Async` are built on the same idea.

## Frequently Asked Questions

### Is Spring AOP the same as AspectJ?

No. Spring AOP uses proxies and supports only method calls on Spring beans. Full AspectJ changes the compiled classes and can advise almost anything. Spring borrows AspectJ's annotations and pointcut language, which is why the imports start with `org.aspectj`.

### Does AOP slow down my application?

Slightly. Each advised call goes through the proxy and your advice code. For logging and simple checks the cost is tiny. Keep the advice light and the pointcut narrow.

### Can I have more than one aspect on a method?

Yes. All matching aspects run. Use `@Order` on the aspect classes to decide which one is outermost.

### Should I use AOP for business rules?

No. Use it for cross-cutting jobs that apply to many methods. A rule that belongs to one feature is easier to read as normal code in that feature.

## Related Topics

- [Interceptors and Filters](/learning/spring-boot-tutorial/interceptors-and-filters): the same idea applied to web requests.
- [@Transactional](/learning/spring-boot-tutorial/transactional): a famous feature built on AOP proxies.
- [Spring Beans](/learning/spring-boot-tutorial/spring-beans): the objects that proxies wrap.
- [Caching in Spring Boot](/learning/spring-boot-tutorial/caching-in-spring-boot): another feature that works through proxies.
