Both problems need a Kafka broker on `localhost:9092`. To use another address, change the `bootstrap-servers` setting in `application.properties`.

### Easy: Two Teams, One Event

MovieMax publishes a message to the topic `booking-events` when a ticket is booked. The SMS team and the email team must each receive every message. Send the text `Booking B1 confirmed` once and print it in two different listeners, `[sms] ...` and `[email] ...`.

> **Hint:** Two listeners with different `groupId` values each get a full copy of every event. Set `groupId` on `@KafkaListener`.

**Answer:** Each group keeps its own offset, so both listeners receive the event. Listeners in the same group would instead split the work.

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

    <groupId>com.moviemax</groupId>
    <artifactId>booking</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-kafka</artifactId>
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
spring.main.web-application-type=none
logging.level.root=warn
spring.kafka.bootstrap-servers=localhost:9092
spring.kafka.consumer.auto-offset-reset=earliest
```

**File:** `BookingApplication.java` in package `com.moviemax.booking`

```java
package com.moviemax.booking;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;

@SpringBootApplication
public class BookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingApplication.class, args);
    }

    @Bean
    NewTopic bookingEvents() {
        return TopicBuilder.name("booking-events").partitions(1).replicas(1).build();
    }

    @Bean
    CommandLineRunner sender(KafkaTemplate<String, String> kafka) {
        return args -> kafka.send("booking-events", "Booking B1 confirmed");
    }

    @KafkaListener(topics = "booking-events", groupId = "sms")
    void sms(String message) {
        System.out.println("[sms] " + message);
    }

    @KafkaListener(topics = "booking-events", groupId = "email")
    void email(String message) {
        System.out.println("[email] " + message);
    }
}
```

Both lines appear, in either order, because the two groups read independently:

```text
[sms] Booking B1 confirmed
[email] Booking B1 confirmed
```

### Medium: Booking API with a Counter

Expose `POST /bookings/{seat}` that sends the seat number to the topic `seat-events` and replies `Queued seat A1`. A listener counts the events it receives, and `GET /bookings/count` returns the count as text. Add both the web and Kafka starters.

> **Hint:** Inject `KafkaTemplate<String, String>` into a `@RestController`. Keep the counter in an `AtomicInteger` field of a listener component, and inject that component into the controller.

**Answer:** The controller only sends. A separate listener bean counts. The count is updated when the listener receives an event, a moment after the POST returns, so the count is eventually correct.

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

    <groupId>com.moviemax</groupId>
    <artifactId>seats</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-kafka</artifactId>
        </dependency>
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
spring.main.banner-mode=off
logging.level.root=warn
spring.kafka.bootstrap-servers=localhost:9092
spring.kafka.consumer.group-id=counter
spring.kafka.consumer.auto-offset-reset=earliest
```

**File:** `SeatCounter.java` in package `com.moviemax.seats`

```java
package com.moviemax.seats;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class SeatCounter {

    private final AtomicInteger count = new AtomicInteger();

    @KafkaListener(topics = "seat-events")
    void onSeat(String seat) {
        count.incrementAndGet();
    }

    public int count() {
        return count.get();
    }
}
```

**File:** `SeatController.java` in package `com.moviemax.seats`

```java
package com.moviemax.seats;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/bookings")
public class SeatController {

    private final KafkaTemplate<String, String> kafka;
    private final SeatCounter counter;

    public SeatController(KafkaTemplate<String, String> kafka, SeatCounter counter) {
        this.kafka = kafka;
        this.counter = counter;
    }

    @PostMapping("/{seat}")
    public String book(@PathVariable String seat) {
        kafka.send("seat-events", seat);
        return "Queued seat " + seat;
    }

    @GetMapping("/count")
    public String count() {
        return String.valueOf(counter.count());
    }
}
```

**File:** `SeatsApplication.java` in package `com.moviemax.seats`

```java
package com.moviemax.seats;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.config.TopicBuilder;

@SpringBootApplication
public class SeatsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SeatsApplication.class, args);
    }

    @Bean
    NewTopic seatEvents() {
        return TopicBuilder.name("seat-events").partitions(1).replicas(1).build();
    }
}
```

After posting seats `A1`, `A2` and `A3`, `GET /bookings/count` returns `3`.
