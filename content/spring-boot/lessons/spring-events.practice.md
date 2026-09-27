Try each problem on your own first. Both are command line programs.

### Easy: Seat Booked at the Cinema

StarPlex Cinema wants two things to happen when a seat is booked: an SMS line `Ticket SMS sent for seat A5` and an offer line `Snack offer sent to Rhea`. Publish one `SeatBooked` event with the seat and the customer name, and let two listeners print the lines in that order.

> **Hint:** Make `SeatBooked` a record. Publish it with `ApplicationEventPublisher`, and put `@Order(1)` and `@Order(2)` on two `@EventListener` methods.

**Answer:** One publish call reaches both listeners. `@Order` makes the SMS listener run first.

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

    <groupId>com.starplex</groupId>
    <artifactId>booking</artifactId>
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

**File:** `SeatBooked.java` in package `com.starplex.booking`

```java
package com.starplex.booking;

public record SeatBooked(String seat, String customer) {}
```

**File:** `BookingListeners.java` in package `com.starplex.booking`

```java
package com.starplex.booking;

import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
public class BookingListeners {

    @EventListener
    @Order(1)
    public void sendTicket(SeatBooked event) {
        System.out.println("Ticket SMS sent for seat " + event.seat());
    }

    @EventListener
    @Order(2)
    public void sendOffer(SeatBooked event) {
        System.out.println("Snack offer sent to " + event.customer());
    }
}
```

**File:** `BookingApplication.java` in package `com.starplex.booking`

```java
package com.starplex.booking;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(ApplicationEventPublisher publisher) {
        return args -> publisher.publishEvent(new SeatBooked("A5", "Rhea"));
    }
}
```

**Output:**

```text
Ticket SMS sent for seat A5
Snack offer sent to Rhea
```

### Medium: Payment Chain and a Failing Listener

PayEasy publishes `PaymentReceived(id, amount)`. The first listener prints a line and returns a `ReceiptReady` event, which Spring publishes automatically. A second listener must reject amounts above 10000 by throwing `IllegalStateException("Fraud check offline")`. A third listener writes an audit line. The publisher must catch the exception and print it. Show what happens for payments of 900 and 20000.

> **Hint:** A listener method that returns an object publishes that object as a new event. Listener order is set with `@Order`. Remember that an exception from a normal listener stops the ones after it.

**Answer:** For 900 all listeners run, and the receipt event is heard. For 20000 the receipt is still created, because it ran first, but the exception stops the audit listener and reaches the publisher.

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

    <groupId>com.payeasy</groupId>
    <artifactId>payments</artifactId>
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

**File:** `PaymentReceived.java` in package `com.payeasy.payments`

```java
package com.payeasy.payments;

public record PaymentReceived(int id, int amount) {}
```

**File:** `ReceiptReady.java` in package `com.payeasy.payments`

```java
package com.payeasy.payments;

public record ReceiptReady(int paymentId) {}
```

**File:** `PaymentListeners.java` in package `com.payeasy.payments`

```java
package com.payeasy.payments;

import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
public class PaymentListeners {

    @EventListener
    @Order(1)
    public ReceiptReady makeReceipt(PaymentReceived event) {
        System.out.println("Receipt made for payment " + event.id());
        return new ReceiptReady(event.id());
    }

    @EventListener
    @Order(2)
    public void fraudCheck(PaymentReceived event) {
        if (event.amount() > 10000) {
            throw new IllegalStateException("Fraud check offline");
        }
        System.out.println("Fraud check passed for payment " + event.id());
    }

    @EventListener
    @Order(3)
    public void audit(PaymentReceived event) {
        System.out.println("Audit line written for payment " + event.id());
    }

    @EventListener
    public void onReceipt(ReceiptReady event) {
        System.out.println("Receipt event heard for " + event.paymentId());
    }
}
```

**File:** `PaymentsApplication.java` in package `com.payeasy.payments`

```java
package com.payeasy.payments;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class PaymentsApplication {

    public static void main(String[] args) {
        SpringApplication.run(PaymentsApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(ApplicationEventPublisher publisher) {
        return args -> {
            publisher.publishEvent(new PaymentReceived(1, 900));
            try {
                publisher.publishEvent(new PaymentReceived(2, 20000));
            } catch (IllegalStateException e) {
                System.out.println("Publisher caught: " + e.getMessage());
            }
        };
    }
}
```

**Output:**

```text
Receipt made for payment 1
Receipt event heard for 1
Fraud check passed for payment 1
Audit line written for payment 1
Receipt made for payment 2
Receipt event heard for 2
Publisher caught: Fraud check
offline
```

The last line is one line on screen. It is wrapped here to fit small screens. Notice that the receipt event is heard right after the receipt listener returns, before the next listener runs.
