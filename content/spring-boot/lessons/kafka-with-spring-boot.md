Think about a post office sorting room. Parcels arrive all day. The clerk who receives a parcel does not walk it to every department. He drops it on a conveyor belt with a label. The delivery team, the billing team and the tracking team each pick up what they need, at their own speed. If the billing team goes for lunch, the belt keeps the parcels waiting. Nothing is lost.

Apache Kafka is that conveyor belt for software. In this guide to Kafka with Spring Boot you will learn what Kafka is, its key words, how a message travels from a producer to a consumer, and how to write both sides in a Spring Boot app.

## What is Kafka?

> **Definition:** Apache Kafka is a distributed platform for sending and storing streams of messages, called events. Applications publish events to named topics, and other applications read them from those topics, each at its own pace.

Kafka runs as a cluster of servers called brokers. The events are stored on disk for a set time, so a slow or restarted reader can catch up and read them again. That is the big difference from a plain queue, where a message often disappears once it is read.

These are the words you need:

| Term | Meaning | Post office picture |
|---|---|---|
| Producer | Sends events | The clerk who receives parcels |
| Topic | A named stream of events | One conveyor belt |
| Partition | One ordered slice of a topic | One lane of the belt |
| Consumer | Reads events | A department |
| Consumer group | Consumers sharing the work | A team at one department |
| Offset | Position of an event in a partition | Serial number on the lane |
| Broker | A Kafka server | The sorting room itself |

## Why is it used?

Direct HTTP calls between services tie them together. If the billing service is down, the order service must wait or fail. Kafka breaks that link:

- **Loose coupling.** The producer does not know who reads its events.
- **Buffering.** Traffic spikes pile up in the topic while consumers catch up.
- **Many readers.** Billing, tracking and analytics can all read the same event.
- **Replay.** A new service can read old events from the start.
- **High volume.** Kafka handles very large numbers of events per second.

Typical uses are order events, payment notifications, activity logs and data pipelines. It is heavier than a simple queue, so use it when you truly need these strengths.

## How it works

Here is the path of one event.

```text
Producer (SwiftPost app)
  |
  |  key = P101
  v
Topic: parcel-events
  +-- partition 0 --> events
  +-- partition 1 --> events
  +-- partition 2 --> events
  |
  v
Consumer group "tracking"
```


The producer sends an event with a key, here the parcel id. Kafka hashes the key to choose a partition, so all events with the same key land in the same partition, in the order they were sent. That is how "Picked up" is always read before "Out for delivery" for one parcel. Across different partitions there is no order guarantee.

```text
Group tracking   Group billing
  C1 <- p0         B1 <- p0
  C2 <- p1         B1 <- p1
  C2 <- p2         B1 <- p2
```

Inside one consumer group, each partition is read by only one consumer, so the group shares the work. Two different groups each get a full copy of every event. That is how tracking and billing can both react to the same parcel event. Each group remembers its own offset, the last position it has read.

## Real-Life Example

A courier company scans a parcel at every stop. Each scan is an event on the topic `parcel-events`. The customer-notification team reads it to send an SMS. The finance team reads the same scans to bill delivery fees. The warehouse team reads it to update stock. The scanning app knows none of these teams. If the SMS team's software is down for an hour, the scans wait in Kafka, and when it comes back it continues from where it stopped.

## Setting Up Kafka with Spring Boot

Add the Kafka starter. In Spring Boot 4 its name is `spring-boot-starter-kafka`. It brings Spring for Apache Kafka, which gives you `KafkaTemplate` to send and `@KafkaListener` to receive. Point the app at the broker in `application.properties`. Then Spring Boot creates the producer and consumer settings for you.

## Code Example

Let's build SwiftPost tracking. The app creates a topic with 3 partitions, sends three events, and a listener prints each one. It expects a Kafka broker on `localhost:9092`.

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

    <groupId>com.swiftpost</groupId>
    <artifactId>parcels</artifactId>
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
spring.kafka.consumer.group-id=tracking
spring.kafka.consumer.auto-offset-reset=earliest
```

**File:** `ParcelsApplication.java` in package `com.swiftpost.parcels`

```java
package com.swiftpost.parcels;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;

@SpringBootApplication
public class ParcelsApplication {

    public static void main(String[] args) {
        SpringApplication.run(ParcelsApplication.class, args);
    }

    @Bean
    NewTopic parcelEvents() {
        return TopicBuilder.name("parcel-events").partitions(3).replicas(1).build();
    }

    @Bean
    CommandLineRunner sender(KafkaTemplate<String, String> kafka) {
        return args -> {
            kafka.send("parcel-events", "P101", "Picked up");
            kafka.send("parcel-events", "P102", "Picked up");
            kafka.send("parcel-events", "P101", "Out for delivery");
        };
    }

    @KafkaListener(topics = "parcel-events")
    void onEvent(String status, @Header(KafkaHeaders.RECEIVED_KEY) String parcel) {
        System.out.println("Parcel " + parcel + ": " + status);
    }
}
```

**Output:**

```text
Parcel P101: Picked up
Parcel P102: Picked up
Parcel P101: Out for delivery
```

## Code Explained

- The only dependency is `spring-boot-starter-kafka`, and the parent supplies its version. The `web-application-type` setting keeps the app a plain console app.
- `bootstrap-servers` tells Spring where the broker is. `group-id` puts our listener in the group `tracking`. `auto-offset-reset=earliest` makes a new group start from the oldest event instead of only new ones.
- The `NewTopic` bean asks Kafka to create `parcel-events` with 3 partitions if it does not exist yet. One replica is fine for a laptop; production uses at least 3.
- `KafkaTemplate<String, String>` sends a text key and a text value. Spring Boot builds it for you, and text serializers are the default.
- `@KafkaListener` turns the method into a consumer of the topic. The key comes from the header `RECEIVED_KEY`, and the method argument is the event value.
- Both `P101` events go to the same partition, so "Picked up" is always printed before "Out for delivery". The line for `P102` may come before or after them, depending on which partition is read first.

> **Note:** We ran this code against a temporary in-process Kafka broker started for testing, since no Docker was available here. On your machine, start a real broker first, for example with the official Kafka Docker image.

## Common Mistakes

> **Warning:** Kafka guarantees order only inside one partition. If you need events of one order in sequence, give them the same key. Never assume order across the whole topic.

- **Forgetting the broker.** With no Kafka on the configured address, the app starts but cannot send or receive, and logs connection warnings.
- **Using a random key or no key.** Events of one entity then spread over partitions and arrive out of order.
- **Sharing one group id between different services.** They then split the events instead of each getting a copy. Use one group per service.
- **Handling an event twice.** Kafka may deliver the same event again after a failure. Make consumers safe to repeat.
- **Putting huge payloads in events.** Send a small event with an id, and keep large files elsewhere.

## Interview Questions

**What is Kafka?**
A distributed event streaming platform where producers write events to topics and consumers read them, with events kept on disk for a set time.

**What is a partition?**
An ordered slice of a topic. Partitions let Kafka spread a topic over brokers and let a consumer group read in parallel.

**What is a consumer group?**
A set of consumers that share the partitions of a topic. Each partition goes to one consumer in the group, and each group gets every event.

**How do you keep the order of related events?**
Send them with the same key, so they go to the same partition.

**Kafka versus a normal queue?**
A queue removes a message once read. Kafka keeps events, lets many groups read them, and allows replay.

## Key Points to Remember

- Producers write events to topics; consumers read them in groups.
- A topic is split into partitions, and order holds only within a partition.
- The same key always goes to the same partition.
- Each consumer group keeps its own offset and gets every event.
- Spring Boot 4 uses `spring-boot-starter-kafka`, `KafkaTemplate` and `@KafkaListener`.
- Design consumers to handle repeated events safely.

## Frequently Asked Questions

### Do I need Kafka with Spring Boot in every project?

No. Kafka suits systems with many services and heavy event traffic. For one small app, a simple method call or a Spring event is enough.

### How is Kafka different from RabbitMQ?

RabbitMQ is a message broker built around queues that remove messages after delivery. Kafka is a log that keeps events, which makes replay and many independent readers easy.

### Can I send Java objects with Kafka and Spring Boot?

Yes. Configure a JSON serializer and deserializer, or convert the object to text yourself. Keep the event small and stable, because other teams will depend on its shape.

### How do I run Kafka on my laptop?

The simplest way is Docker with the official Kafka image. You can also download Kafka and run it directly. Either way, set `spring.kafka.bootstrap-servers` to its address.

## Related Topics

- [Introduction to Microservices with Spring Boot](/learning/spring-boot-tutorial/introduction-to-microservices-with-spring-boot): why services exchange events.
- [Docker for Spring Boot](/learning/spring-boot-tutorial/docker-for-spring-boot): running the broker and your app in containers.
- [Spring Events](/learning/spring-boot-tutorial/spring-events): the in-app version of the same idea.
- [Async Processing with @Async](/learning/spring-boot-tutorial/async-processing-with-async): another way to avoid waiting.
