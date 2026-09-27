You order a thali at a busy restaurant. The waiter takes your order, walks to the kitchen and stands there until the food is ready. Meanwhile, five other tables wait for him. That is a poor way to run a restaurant. A smart waiter hands the order to the kitchen and comes back at once to serve others. When the food is ready, the kitchen calls him. Async processing with @Async gives your Spring Boot code the same trick: hand slow work to another thread, and carry on with the next customer.

In this guide you will build a food delivery order flow where SMS and email run in the background, and you will learn how to get results back, how to size the thread pool, and where the common traps are.

## What is Async Processing with @Async?

> **Definition:** `@Async` is a Spring annotation that makes a method run on a separate thread. The caller does not wait for the method to finish. You switch the feature on with `@EnableAsync`, and Spring runs the method on a background thread pool.

Normally, Java runs one line after another on the same thread. If a method takes three seconds to send an email, the caller is stuck for three seconds. With `@Async`, the caller gets control back almost at once, and the slow method carries on in the background.

An async method can return:

- `void`, when you do not need an answer (fire and forget).
- `CompletableFuture<T>`, when you want the result later.

## Why is it used?

- **Faster responses.** A user placing an order should not wait for an SMS gateway.
- **Better use of time.** Two slow tasks that do not depend on each other can run together.
- **Slow partners.** Email servers, payment checks and reports often take seconds. Async keeps your request threads free.
- **Simple to add.** One annotation, not a hand-written thread pool.

Async does not make the work itself faster. It lets waiting happen in the background, so the caller does not wait too.

## How it works

Spring wraps your bean in a proxy, as it does for caching and security. When someone calls an `@Async` method, the proxy does not run it. It hands the call to a task executor, which is a pool of worker threads.

```text
Caller thread (main)
    |
    | sendSms(101)
    v
+------------------------+
| Async proxy            |
| submit to the pool     |
+------------------------+
    |                  \
    | returns at once   \
    v                    v
Caller carries on   +-----------+
                    | Worker    |
                    | task-1    |
                    | sends SMS |
                    +-----------+
```

The caller continues immediately. The worker thread runs the method body and, if the method returns a `CompletableFuture`, fills in the answer when done. Spring Boot creates the executor for you. Its threads are named with the prefix `task-`, which is handy when you read logs.

## Real-Life Example

A cloud kitchen gets an order on the app. The cashier confirms payment, and then three things must happen: tell the customer by SMS, email the receipt, and tell the rider. None of these need to finish before the cashier takes the next order. So the cashier starts all three helpers and moves on. The cashier only waits at the end of the day, when he counts how many messages went out.

## Code Example

Let's build QuickBite. Sending an SMS and an email each take one second. We run both in the background and measure the total time.

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

    <groupId>com.quickbite</groupId>
    <artifactId>orders</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
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

**File:** `OrdersApplication.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

import java.util.concurrent.CompletableFuture;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(NotificationService notifications) {
        return args -> {
            long start = System.currentTimeMillis();
            System.out.println("Order 101 placed on thread: " + Thread.currentThread().getName());

            CompletableFuture<String> sms = notifications.sendSms(101);
            CompletableFuture<String> email = notifications.sendEmail(101);
            System.out.println("Order accepted, customer is not waiting");

            System.out.println(sms.join());
            System.out.println(email.join());

            long took = System.currentTimeMillis() - start;
            System.out.println("Both finished in under 1800 ms: " + (took < 1800));
        };
    }
}
```

**File:** `NotificationService.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

import java.util.concurrent.CompletableFuture;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Async
    public CompletableFuture<String> sendSms(int orderId) {
        pause();
        return CompletableFuture.completedFuture(
            "SMS for order " + orderId + " ran on a pool thread: " + onPoolThread());
    }

    @Async
    public CompletableFuture<String> sendEmail(int orderId) {
        pause();
        return CompletableFuture.completedFuture(
            "Email for order " + orderId + " ran on a pool thread: " + onPoolThread());
    }

    private boolean onPoolThread() {
        return Thread.currentThread().getName().startsWith("task-");
    }

    private void pause() {
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

Run it with `./mvnw spring-boot:run`.

**Output:**

```text
Order 101 placed on thread: main
Order accepted, customer is
not waiting
SMS for order 101 ran on a pool
thread: true
Email for order 101 ran on a pool
thread: true
Both finished in under 1800 ms:
true
```

Some lines are longer on screen. They are wrapped here to fit small screens.

## Code Explained

- `@EnableAsync` switches the feature on. Without it, the methods run on the caller's thread and the app behaves as if `@Async` was not there.
- The first line shows the order was placed on `main`. The SMS and email ran on pool threads. The `true` in each message means the thread name started with `task-`, which is the name Spring Boot gives its default async pool.
- Each method sleeps one second, so running one after the other would take two seconds. Together they finished in under 1800 ms, which proves they ran side by side.
- `CompletableFuture<String>` is the box that holds the answer. `join()` waits for the answer when we finally need it. The method returns `completedFuture(...)` because the work is already done inside the background thread.
- The line "Order accepted, customer is not waiting" printed before the SMS finished. That shows the caller was free.
- If a method only returns `void`, the caller has no way to wait for it or to see its result.

## Sizing the Thread Pool

Spring Boot's default pool is fine for learning. In a busy app, tune it in `application.properties`.

```properties
spring.task.execution.pool.core-size=4
spring.task.execution.pool.max-size=16
spring.task.execution.pool.queue-capacity=100
spring.task.execution.thread-name-prefix=quickbite-
```

The pool keeps four threads ready. When they are busy, new tasks wait in a queue of 100. Only when the queue is full does the pool grow towards 16 threads. If everything is full, new tasks are rejected, so set the numbers with real traffic in mind.

## Common Mistakes

> **Warning:** A method marked `@Async` that is called from another method in the same class runs on the caller's thread. The call skips the proxy, so nothing becomes async. Put the async method in a separate bean.

- **Forgetting `@EnableAsync`.** Everything runs in the foreground and no error appears.
- **Expecting a returned value from `void`.** Use `CompletableFuture` when the caller needs the result.
- **Lost exceptions.** In a `void` async method, an exception is only logged. Handle errors inside the method, or use an `AsyncUncaughtExceptionHandler`.
- **Using it on private methods.** Only public calls from other beans go through the proxy.
- **Assuming the security user or transaction follows.** The new thread does not share the caller's transaction, and by default it does not carry the login either.
- **No pool limits.** An unbounded flood of tasks can use all your memory. Set a queue size.

## Interview Questions

**What does `@Async` do?**
It runs the method on a separate thread from a task executor, so the caller does not wait.

**What can an `@Async` method return?**
`void` or a `CompletableFuture`. Older code also uses `Future`.

**Why does `@Async` sometimes not work?**
`@EnableAsync` is missing, the method is called from the same class, or the method is not public.

**Does an async method share the caller's transaction?**
No. It runs on another thread, so it gets its own transaction if it needs one.

**How do you control the number of async threads?**
Set the task execution pool properties, or define your own `Executor` bean.

## Key Points to Remember

- `@Async` runs a method in the background, and `@EnableAsync` turns it on.
- Return `CompletableFuture` when you need a result, and `void` for fire and forget.
- Calls inside the same class skip the proxy and stay synchronous.
- Errors in `void` async methods need special handling.
- Set pool size and queue size for real traffic.

## Frequently Asked Questions

### Is async processing with @Async the same as multithreading?

It uses threads, but Spring manages them for you. You write a normal method and the framework runs it on a pool.

### When should I not use @Async?

When the caller needs the result right away to continue, or when the work must happen in the same transaction.

### How is @Async different from @Scheduled?

`@Scheduled` decides when a method runs. `@Async` decides which thread runs it. They can be combined, so a timed job does not block others.

### Do I need Kafka or a queue instead?

For simple background work inside one app, `@Async` is enough. If work must survive a restart or cross services, use a real message queue.

## Related Topics

- [Scheduling with @Scheduled](/learning/spring-boot-tutorial/scheduling-with-scheduled): timed jobs that pair well with async work.
- [Spring Events](/learning/spring-boot-tutorial/spring-events): announce something happened, and let listeners react in the background.
- [Sending Email](/learning/spring-boot-tutorial/sending-email): a classic slow task to move off the request thread.
- [Spring AOP](/learning/spring-boot-tutorial/spring-aop): the proxy idea behind `@Async`.
