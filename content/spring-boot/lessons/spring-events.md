In a school, when the principal rings the bell for the end of the day, she does not visit every class. She rings once, and everyone reacts in their own way. Teachers pack their bags, the bus driver starts the engine, the gatekeeper opens the gate. The bell does not know who is listening. Spring Events work the same way. One part of your app announces that something happened, and other parts, which the sender knows nothing about, react.

In this guide you will build an online bookshop where placing an order publishes one event and three listeners react. You will learn how to publish and listen, how to control the order, and when a listener runs on the same thread and when it does not.

## What are Spring Events?

> **Definition:** A Spring event is a message that one bean publishes and any number of other beans can listen to, inside the same application. The publisher does not call the listeners directly, so the two sides stay independent of each other.

There are three pieces:

- **The event.** A plain Java object, usually a record, that carries the facts: "order 7 was placed by Meera for 1200 rupees".
- **The publisher.** Any bean that calls `publishEvent` on an `ApplicationEventPublisher`.
- **The listeners.** Methods marked with `@EventListener` whose parameter type is the event.

Since Spring 4.2, an event can be any object. You do not need to extend a special base class.

## Why is it used?

- **Loose coupling.** The order service does not need to know about invoices, stock or loyalty points. It just announces the order.
- **Easy to extend.** To add an SMS after each order, write one new listener. The order code stays untouched.
- **Cleaner code.** Each listener has one small job and can be tested alone.
- **A step towards messaging.** The same thinking, "announce, do not command", is what Kafka and other message systems use between apps.

Events do have limits. They live inside one running application, and by default listeners run one after the other on the caller's thread. They are not a message queue.

## How it works

```text
OrderService
    |
    | publishEvent(OrderPlaced)
    v
+------------------------+
| Application context    |
| (the event bus)        |
+------------------------+
    |        |        |
    v        v        v
 Invoice   Stock    Loyalty
 listener  listener listener
```

`OrderService` gives the event to the application context. The context looks for every listener whose parameter matches the event's type, and calls them one by one. When the last listener finishes, `publishEvent` returns, and the order service continues. Because the calls happen on the same thread, an exception in a listener travels back to the publisher. This is useful if the listener must be able to stop the action, and a surprise if it should not.

Use `@Order` on listeners to set their sequence. A smaller number runs first.

## Real-Life Example

At a railway station, when the announcer says "Train 12345 has arrived on platform 3", many people react. Porters move to the platform, the tea stall fills flasks, the ticket checker takes position, and passengers pick up their bags. The announcer does not phone each person. He says it once. If a new tea stall opens tomorrow, the announcer does not change his announcement.

## Code Example

Let's build BookNook, an online bookshop. When an order is placed, one event goes out. Three listeners react: the invoice, the stock and a loyalty listener that only cares about big orders.

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

    <groupId>com.booknook</groupId>
    <artifactId>shop</artifactId>
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

**File:** `OrderPlaced.java` in package `com.booknook.shop`

```java
package com.booknook.shop;

public record OrderPlaced(int orderId, String customer, int amountInRupees) {}
```

**File:** `OrderService.java` in package `com.booknook.shop`

```java
package com.booknook.shop;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    private final ApplicationEventPublisher publisher;

    public OrderService(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    public void placeOrder(int orderId, String customer, int amountInRupees) {
        System.out.println("Order " + orderId + " saved for " + customer);
        publisher.publishEvent(new OrderPlaced(orderId, customer, amountInRupees));
        System.out.println("Order " + orderId + " finished");
    }
}
```

**File:** `OrderListeners.java` in package `com.booknook.shop`

```java
package com.booknook.shop;

import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
public class OrderListeners {

    @EventListener
    @Order(1)
    public void createInvoice(OrderPlaced event) {
        System.out.println("  Invoice created for order " + event.orderId());
    }

    @EventListener
    @Order(2)
    public void reduceStock(OrderPlaced event) {
        System.out.println("  Stock reduced for order " + event.orderId());
    }

    @EventListener(condition = "#event.amountInRupees() >= 1000")
    @Order(3)
    public void addLoyaltyPoints(OrderPlaced event) {
        System.out.println("  Loyalty points added for " + event.customer());
    }
}
```

**File:** `ShopApplication.java` in package `com.booknook.shop`

```java
package com.booknook.shop;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(OrderService orders) {
        return args -> {
            orders.placeOrder(1, "Meera", 1200);
            orders.placeOrder(2, "Arjun", 350);
        };
    }
}
```

Run it with `./mvnw spring-boot:run`.

**Output:**

```text
Order 1 saved for Meera
  Invoice created for order 1
  Stock reduced for order 1
  Loyalty points added for Meera
Order 1 finished
Order 2 saved for Arjun
  Invoice created for order 2
  Stock reduced for order 2
Order 2 finished
```

## Code Explained

- `OrderPlaced` is a record. Records are perfect for events because they are small, fixed after creation and easy to read.
- `OrderService` depends only on `ApplicationEventPublisher`. It knows nothing about invoices, stock or loyalty. That is the whole point.
- Each `@EventListener` method takes the event type as its parameter. Spring calls it when an event of that type is published.
- `@Order` sets the sequence: invoice, then stock, then loyalty. Without it the order is not something to rely on.
- The `condition` uses SpEL to look at the event. Arjun's order was 350 rupees, so the loyalty listener was skipped for him, and only Meera got points.
- "Order 1 finished" appears after all three listeners. That shows a normal listener runs on the caller's thread and the publisher waits for it.

## Sync, Async and Transactional Listeners

| Kind | How | Behaviour |
|---|---|---|
| Normal | `@EventListener` | Runs on the publisher's thread, and the publisher waits |
| Async | `@EventListener` plus `@Async` | Runs on a pool thread, and the publisher does not wait |
| Transactional | `@TransactionalEventListener` | Runs only after the database transaction commits (or rolls back) |

The last one matters in real shops. If you send a "your order is confirmed" email from a normal listener inside a transaction and the transaction then fails, the customer gets an email for an order that does not exist. A `@TransactionalEventListener` waits for the commit, so the email is sent only when the order really saved.

An async listener needs `@EnableAsync`. Its errors do not come back to the publisher, so handle them inside.

## Common Mistakes

> **Warning:** A normal listener that throws an exception breaks the publisher too, and the listeners after it never run. Catch exceptions inside listeners that must not stop the main action.

- **Expecting a fixed order without `@Order`.** Listeners have no promised order by default.
- **Slow work in a normal listener.** The publisher waits. Move slow work to an async listener.
- **Publishing before saving.** Listeners may read data that is not saved yet. Publish after the save, or use a transactional listener.
- **Too many events.** If a simple call would do, use a simple call. Events make the flow harder to follow.
- **Expecting events across apps.** Spring events stay inside one application. Use a message broker between services.

## Interview Questions

**How do you publish an event in Spring?**
Inject `ApplicationEventPublisher` and call `publishEvent` with any object.

**How do you listen for an event?**
Put `@EventListener` on a method that takes the event type as its parameter.

**Are Spring events synchronous?**
Yes, by default. Listeners run on the publisher's thread, one after another. Add `@Async` for background listeners.

**What is `@TransactionalEventListener`?**
A listener that runs at a chosen phase of a transaction, usually after commit, so side effects happen only when data is saved.

**How do you run listeners in a fixed order?**
Add `@Order` to the listener methods. Smaller numbers run first.

## Key Points to Remember

- An event is any object, and listeners are methods marked `@EventListener`.
- Publish with `ApplicationEventPublisher`.
- Publisher and listeners stay loosely coupled.
- Listeners are synchronous by default, so exceptions travel back to the publisher.
- Use `@Async` for background work and `@TransactionalEventListener` for after-commit work.

## Frequently Asked Questions

### Do Spring events need to extend ApplicationEvent?

No. Since Spring 4.2, any object can be an event. A record works well.

### Can one event have many listeners?

Yes. Every matching listener is called. That is the strength of Spring events.

### Are Spring events the same as Kafka messages?

No. Spring events live inside one running app and vanish if it stops. Kafka delivers messages between apps and keeps them safely.

### Can a listener publish another event?

Yes. A listener can call the publisher again, or return a new event object, and Spring publishes it for you.

## Related Topics

- [Async Processing with @Async](/learning/spring-boot-tutorial/async-processing-with-async): make listeners run in the background.
- [Transactional](/learning/spring-boot-tutorial/transactional): the transaction that `@TransactionalEventListener` waits for.
- [Sending Email](/learning/spring-boot-tutorial/sending-email): a typical thing to trigger from a listener.
- [Kafka with Spring Boot](/learning/spring-boot-tutorial/kafka-with-spring-boot): events between separate applications.
