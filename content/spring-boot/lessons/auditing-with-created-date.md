A courier company gets a complaint: "My parcel was booked on Monday, but your system says Wednesday." Who is right? If the system never recorded when each parcel was created, and when it was last changed, nobody can prove anything. Good software keeps this diary automatically, so people do not forget to write it.

In Spring Boot, this diary is called auditing. Let's learn how `@CreatedDate` and its friends fill it for you, without a single line of date code in your services.

## What is auditing with @CreatedDate?

Think of a library register. Every time a book is issued, the librarian stamps the date and writes a name. Nobody asks the reader to write the date, because readers forget or lie. The stamp is applied by the system.

> **Definition:** Auditing in Spring Data JPA means that the framework fills special fields, such as the creation time, the last update time and the user who made the change, every time an entity is saved.

The main annotations are:

| Annotation | Filled with | When |
|---|---|---|
| `@CreatedDate` | Time of creation | Once, on first save |
| `@LastModifiedDate` | Time of the latest change | Every update |
| `@CreatedBy` | The user who created it | Once, on first save |
| `@LastModifiedBy` | The user who changed it last | Every update |

## Why is it used?

- **Proof.** You can answer "when was this order placed?" for every row.
- **Debugging.** When data looks wrong, the update time tells you when it changed.
- **Reports.** "Tickets created this week" becomes a simple query.
- **No forgotten code.** If each developer set dates by hand, some would forget. With auditing, every entity that opts in gets the same behaviour.

## How it works

Auditing has three parts: a switch, a listener and marked fields. You switch it on with `@EnableJpaAuditing`. You attach the listener `AuditingEntityListener` to your entity. You mark fields with `@CreatedDate` and friends.

```text
repository.save(ticket)
    |
    v
Hibernate: about to insert
    |
    v
AuditingEntityListener runs
    |
    v
createdAt = now
updatedAt = now
    |
    v
INSERT with both dates
```

On the first save, the listener sets both the creation and the update time. Your code never touches them.

```text
change a field, save again
    |
    v
Hibernate: about to update
    |
    v
AuditingEntityListener runs
    |
    v
updatedAt = now
createdAt stays the same
    |
    v
UPDATE row
```

On a later update, only the update time moves. To make sure the creation time never changes, mark its column `updatable = false`.

For `@CreatedBy` and `@LastModifiedBy`, Spring needs to know who the current user is. You provide one bean that implements `AuditorAware`, and Spring calls it at save time. In a real app it reads the logged-in user from Spring Security. In our demo, it returns a fixed name.

### Spring Data auditing or Hibernate timestamps?

Hibernate offers its own `@CreationTimestamp` and `@UpdateTimestamp`. Both approaches work, but they differ.

| Feature | Spring Data auditing | Hibernate timestamps |
|---|---|---|
| Creation and update time | Yes | Yes |
| User who made the change | Yes, with `AuditorAware` | No |
| Works beyond JPA | Yes, other Spring Data stores | No |
| Needs an enabling switch | Yes | No |

If you only need two dates, Hibernate's annotations are shorter. If you also need the user, or you may change the database later, Spring Data auditing is the better choice. In a school-sized project you can start with either, but stay consistent across all entities.

## Real-Life Example

A hospital keeps a file for every patient. The reception desk stamps "Opened: 3 March" on the cover once. Every time a nurse adds a note, she writes "Last updated: date, name" on the same cover. The opening date never changes, and the update line changes on every visit. `@CreatedDate` is the opening stamp. `@LastModifiedDate` is the update line.

## Code Example

Let's build the help desk of CampusCab, a shuttle booking service. A `SupportTicket` records when it was created, when it was last changed, and who did it. To avoid repeating those fields, we put them in a base class marked `@MappedSuperclass`.

```text
campuscab/
├─ pom.xml
└─ src/main/
   ├─ java/com/campuscab/helpdesk/
   │  ├─ HelpdeskApplication.java
   │  ├─ AuditConfig.java
   │  ├─ AuditedEntity.java
   │  ├─ SupportTicket.java
   │  └─ TicketRepository.java
   └─ resources/
      └─ application.properties
```

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

    <groupId>com.campuscab</groupId>
    <artifactId>helpdesk</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
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

**File:** `AuditConfig.java` in package `com.campuscab.helpdesk`

```java
package com.campuscab.helpdesk;

import java.util.Optional;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class AuditConfig {

    @Bean
    AuditorAware<String> auditorProvider() {
        return () -> Optional.of("desk-agent");
    }
}
```

**File:** `AuditedEntity.java` in package `com.campuscab.helpdesk`

```java
package com.campuscab.helpdesk;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditedEntity {

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }
}
```

**File:** `SupportTicket.java` in package `com.campuscab.helpdesk`

```java
package com.campuscab.helpdesk;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class SupportTicket extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String subject;
    private String status = "OPEN";

    protected SupportTicket() {
    }

    public SupportTicket(String subject) {
        this.subject = subject;
    }

    public String getSubject() {
        return subject;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
```

**File:** `TicketRepository.java` in package `com.campuscab.helpdesk`

```java
package com.campuscab.helpdesk;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<SupportTicket, Long> {
}
```

**File:** `HelpdeskApplication.java` in package `com.campuscab.helpdesk`

```java
package com.campuscab.helpdesk;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class HelpdeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(HelpdeskApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(TicketRepository tickets) {
        return args -> {
            SupportTicket ticket = tickets.save(new SupportTicket("Driver was late"));
            System.out.println("Created by: " + ticket.getCreatedBy());
            System.out.println("Created at: " + secs(ticket.getCreatedAt()));
            System.out.println("Updated at: " + secs(ticket.getUpdatedAt()));

            Thread.sleep(1000);
            ticket.setStatus("RESOLVED");
            SupportTicket saved = tickets.saveAndFlush(ticket);
            System.out.println("--- after the update");
            System.out.println("Created at: " + secs(saved.getCreatedAt()));
            System.out.println("Updated at: " + secs(saved.getUpdatedAt()));
            System.out.println("Same creation time: "
                    + saved.getCreatedAt().equals(ticket.getCreatedAt()));
        };
    }

    private static String secs(Instant time) {
        return time.truncatedTo(ChronoUnit.SECONDS).toString();
    }
}
```

Run it:

```bash
mvn spring-boot:run
```

**Output:**

```text
Created by: desk-agent
Created at: 2026-09-26T21:28:06Z
Updated at: 2026-09-26T21:28:06Z
--- after the update
Created at: 2026-09-26T21:28:06Z
Updated at: 2026-09-26T21:28:08Z
Same creation time: true
```

The exact times will differ on your machine, and we print them rounded to seconds so they fit on a small screen. What matters is the pattern: on the first save, both times are equal. After the update, the creation time stays and only the update time moves forward.

## Code Explained

- `@EnableJpaAuditing` switches the feature on. Without it, the annotated fields stay `null`.
- `AuditorAware<String>` tells Spring who the current user is. Here it always answers `desk-agent`. In a secured app it would read the login name.
- `@MappedSuperclass` lets many entities share the same audit fields without a table of its own.
- `@EntityListeners` naming `AuditingEntityListener` attaches the listener that fills the fields.
- `updatable = false` on the creation columns stops Hibernate from ever writing them again.
- We use `Instant`, a point on the timeline in UTC. It avoids time zone confusion. `LocalDateTime` and `Date` also work.

> **Tip:** Store times as `Instant` and convert to the user's time zone only when you display them. That keeps servers in different countries in agreement.

## Common Mistakes

> **Warning:** Forgetting `@EnableJpaAuditing` is the most common mistake. The code compiles, the app starts, and every audit field is silently `null`.

- **Missing `@EntityListeners`.** The switch is on, but the entity does not listen. Put the listener on the base class.
- **Setting dates by hand.** If you also write `setCreatedAt(now)`, you now have two sources of truth. Let the listener do it.
- **Bulk updates.** A JPQL `update` statement skips entity listeners, so `updatedAt` is not changed. Set it in the query if you need it.
- **No `AuditorAware` bean.** `@CreatedBy` then stays `null`. Add the bean, and return an empty `Optional` when nobody is logged in.
- **Old tutorials with `@Temporal`.** With `Instant` or `LocalDateTime` you do not need it.

## Interview Questions

**What is JPA auditing?**
It is a Spring Data feature that fills creation and modification fields automatically when an entity is saved.

**Which steps enable it?**
Add `@EnableJpaAuditing` to a configuration class, add `@EntityListeners` naming `AuditingEntityListener` to the entity or its base class, and mark the fields with `@CreatedDate` and `@LastModifiedDate`.

**How does Spring know the current user for `@CreatedBy`?**
Through a bean of type `AuditorAware`, whose `getCurrentAuditor()` method returns the user name.

**What does `@MappedSuperclass` do?**
It lets a class share its fields with child entities. Those fields become columns in each child's own table, and the base class has no table.

## Key Points to Remember

- Auditing fills date and user fields automatically on save.
- You need three things: `@EnableJpaAuditing`, the entity listener and marked fields.
- `@CreatedDate` is set once. `@LastModifiedDate` changes on every update.
- Put audit fields in a `@MappedSuperclass` and reuse them everywhere.
- Use `Instant` for times, and `AuditorAware` for the user.

## Frequently Asked Questions

### What is the difference between @CreatedDate and @LastModifiedDate?

`@CreatedDate` is written once, when the row is first inserted. `@LastModifiedDate` is written on the first insert and again on every update.

### Does auditing with @CreatedDate work with Hibernate's own annotations?

Hibernate has `@CreationTimestamp` and `@UpdateTimestamp`, which do a similar job. Spring's auditing adds the user fields and works across Spring Data stores, so many teams prefer it.

### Can I audit only some entities?

Yes. Only entities that carry the listener and the annotated fields are audited. Others are untouched.

### Why is my createdAt null?

Almost always because `@EnableJpaAuditing` is missing, or the entity does not have `@EntityListeners` naming `AuditingEntityListener`.

## Related Topics

- [JPA Entity and @Entity](/learning/spring-boot-tutorial/jpa-entity): revisit how a class becomes a table.
- [JpaRepository](/learning/spring-boot-tutorial/jparepository): the save method that triggers auditing.
- [Soft Delete](/learning/spring-boot-tutorial/soft-delete): keep history by marking rows instead of removing them.
- [Spring Security Basics](/learning/spring-boot-tutorial/spring-security-basics): the source of the current user.
