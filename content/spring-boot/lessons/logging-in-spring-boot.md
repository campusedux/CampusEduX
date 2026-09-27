A delivery rider phones the kitchen and says, "Order 42 is picked up." Later he says, "Customer not at home." If nobody writes these calls in a notebook, the shop cannot find out what went wrong when a customer complains. A log is that notebook. It records what your application did, when it did it, and how serious it was.

In this guide on logging in Spring Boot you will learn how to write log messages, what the levels mean, how to change what is shown, and how to keep a copy in a file.

## What is logging in Spring Boot?

> **Definition:** Logging is the practice of writing messages about what an application is doing, each with a level such as INFO or ERROR, so that developers can understand and fix problems later.

Spring Boot logs to the console out of the box, using the SLF4J interface with Logback behind it. The `spring-boot-starter` already includes both, so you add nothing. You ask for a logger, call a method such as `info`, and the message appears with a time, a level and the class name.

Think of the levels as the colour of a sticky note in the notebook. A white note says "all normal". A yellow note says "watch this". A red note says "something broke". Later you can choose to read only the red and yellow notes.

## Why is it used?

- **Finding bugs after they happen.** The customer complaint arrives tomorrow. The log shows what happened today.
- **Better than System.out.println.** A log message has a level, a time and a source class, and you can switch it off without editing code.
- **Control from settings.** You can show detailed messages on your laptop and only warnings on the live server.
- **Files for history.** The same messages can go to a file that rotates as it grows.

## How it works

Your class calls the SLF4J interface. Logback receives the call, checks the level against your settings, and writes the message to each place it is told to use.

```text
log.info("Order accepted")
        |
        v
+--------------------+
| SLF4J (interface)  |
+--------------------+
        |
        v
+--------------------+
| Logback (engine)   |
| level ok?          |
+--------------------+
      |          |
      v          v
   console      file
```

If the level of the message is below the level you allowed for that package, Logback throws the message away and it costs almost nothing. Otherwise it formats the message with your pattern and sends it to the console and the file.

## Log Levels

From the least serious to the most serious, the levels are:

| Level | Meaning | Example |
|---|---|---|
| TRACE | Tiny details | Every loop step |
| DEBUG | Details for developers | Stock check for an order |
| INFO | Normal events | Order accepted |
| WARN | Something odd, but continuing | Low stock |
| ERROR | Something failed | Payment declined |

When you set a level, you see that level and everything more serious. The default is INFO, so DEBUG and TRACE messages stay hidden until you ask for them.

## Real-Life Example

QuickBite is a food delivery kitchen. When an order arrives, the kitchen checks the stock, warns when the stock is low, accepts the order, and later records if the card payment was declined. Each event has a natural level. The developers want every detail while testing on a laptop, but on the live server they want only warnings and errors, so the log stays small and easy to read.

## Code Example

Let's build the QuickBite order service. It logs at four levels and writes a copy to a file. To keep every line short on a phone, we set our own console pattern.

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
            <artifactId>spring-boot-starter-webmvc</artifactId>
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
logging.pattern.console=%-5level %logger{0}: %msg%n
logging.level.root=WARN
logging.level.com.quickbite=DEBUG
logging.file.name=quickbite.log
```

**File:** `OrdersApplication.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }
}
```

**File:** `Kitchen.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class Kitchen {

    private static final Logger log = LoggerFactory.getLogger(Kitchen.class);

    public String accept(int orderId, int stock) {
        log.debug("Stock check for {}", orderId);
        if (stock < 3) {
            log.warn("Low stock: {} left", stock);
        }
        log.info("Order {} accepted", orderId);
        return "Order " + orderId + " accepted";
    }

    public String pay(int orderId) {
        try {
            throw new IllegalStateException("Card declined");
        } catch (IllegalStateException ex) {
            log.error("Card declined for {}", orderId, ex);
            return "Payment failed for order " + orderId;
        }
    }
}
```

**File:** `OrderController.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {

    private final Kitchen kitchen;

    public OrderController(Kitchen kitchen) {
        this.kitchen = kitchen;
    }

    @GetMapping("/place")
    public String place() {
        return kitchen.accept(42, 2);
    }

    @GetMapping("/fail")
    public String fail() {
        return kitchen.pay(7);
    }
}
```

Run it, then call both addresses:

```bash
./mvnw spring-boot:run
curl http://localhost:8080/place
curl http://localhost:8080/fail
```

**Output:**

```text
DEBUG Kitchen: Stock check for 42
WARN  Kitchen: Low stock: 2 left
INFO  Kitchen: Order 42 accepted
ERROR Kitchen: Card declined for 7
```

Below the last line the console also prints the full stack trace of the exception, which we left out here. A file named `quickbite.log` appeared in the folder where we started the app, holding the same messages with a full timestamp and thread name.

## Code Explained

- The `getLogger` call with `Kitchen.class` creates a logger named after the class. It is `private static final`, created once.
- `{}` is a placeholder. SLF4J fills it with the argument, and it only builds the text if the level is enabled.
- In `log.error`, passing the exception as the last argument prints its stack trace. Without it you would lose the reason for the failure.
- `logging.level.root=WARN` hides all the noise from Spring itself. The level set for `com.quickbite` to DEBUG shows every detail from our own package.
- The `%-5level %logger{0}: %msg%n` pattern prints the level, the short class name and the message. The default pattern also adds the time, process id and thread, which is more useful on a server but too wide for this page.
- `logging.file.name` adds a file next to the console output.

We also started the jar with the level for our package changed to WARN on the command line. Only the WARN and ERROR lines remained. The Java code was the same. Only the setting changed.

## Log Groups and File Rolling

You can set the level of one class or one whole package, for example a `logging.level` entry for a `payment` package set to TRACE. Spring Boot also has ready groups such as `web` and `sql`, which switch on many related loggers at once. For files, Logback rolls the log by size and date, so a file does not grow forever. You can tune this with the `rollingpolicy` settings under `logging.logback`.

## Choosing What to Log

Good logs answer a question later. Log the start and end of important actions, such as an order accepted or a payment result, and include the id, so you can search for it. Do not log inside a tight loop that runs a million times. One line per business event is enough. Write messages a tired teammate can understand at night, such as "Card declined for 7", not "error 5".

Also keep the levels honest. A missing optional setting is not an ERROR, and a crash is not an INFO. If everything is ERROR, nobody trusts the log.

## Common Mistakes

> **Warning:** Never write passwords, card numbers or full personal details to a log. Logs are copied, emailed and stored for a long time, and many people can read them.

- **Using `System.out.println`.** It has no level, no time and no switch. Use a logger.
- **Building strings by hand.** `log.debug("Stock " + stock)` builds the text even when DEBUG is off. Use `{}` placeholders.
- **Logging an exception as text.** `log.error(ex.getMessage())` loses the stack trace. Pass the exception itself.
- **Leaving DEBUG on in production.** Logs become huge and slow, and may show private data.

## Interview Questions

**Which logging library does Spring Boot use by default?**
SLF4J as the interface and Logback as the engine.

**What is the default log level?**
INFO. So DEBUG and TRACE messages are not shown unless you lower the level.

**How do you send logs to a file?**
Set `logging.file.name` or `logging.file.path` in the configuration file.

## Key Points to Remember

- Use an SLF4J logger, not `System.out.println`.
- Levels from low to high are TRACE, DEBUG, INFO, WARN and ERROR.
- Set levels per package with `logging.level` entries.
- Use `{}` placeholders and pass exceptions as the last argument.
- Add `logging.file.name` to keep a file copy.
- Never log secrets.

## Frequently Asked Questions

### Why is logging in Spring Boot better than System.out.println?

A logger adds time, level and class name, can be filtered by level, and can write to files. `System.out.println` can do none of these.

### How do I change the log level without changing code?

Set `logging.level` for a package in `application.properties`, or pass it on the command line, as we did with the WARN run.

### Does Spring Boot use Log4j?

Not by default. It uses Logback. You can switch to Log4j 2 by excluding the logging starter and adding the Log4j 2 starter.

### Where is the log file created?

In the folder where you start the app, unless you give a full path in `logging.file.name`.

## Related Topics

- [Spring Boot Actuator](/learning/spring-boot-tutorial/spring-boot-actuator): change log levels of a running app through an endpoint.
- [Externalized Configuration](/learning/spring-boot-tutorial/externalized-configuration): set log levels from the command line or environment.
- [Spring Profiles](/learning/spring-boot-tutorial/spring-profiles): use DEBUG in development and WARN in production.
- [Exception Handling in Spring Boot](/learning/spring-boot-tutorial/exception-handling-in-spring-boot): log the errors you catch.
