Every traveller who flies abroad carries one passport, and every passport belongs to exactly one traveller. Nobody holds two passports of the same country at once, and no passport is shared between two people. This pairing, one to one, appears all over real life: a person and their Aadhaar record, a car and its registration certificate, a patient and their medical file.

In a database, you show this pairing with a link between two tables. In JPA, you show it with an annotation. In this topic you will learn one-to-one mapping: what it means, how the link is stored, who owns it, and how to use it in a Spring Boot app with real output.

## What is one-to-one mapping?

A one-to-one relationship means that one row in table A is linked to at most one row in table B, and the other way round. In JPA you write it with `@OneToOne`.

> **Definition:** A one-to-one mapping links two entities so that each instance of the first is connected to exactly one instance of the second. In JPA it is declared with `@OneToOne`, and the link is stored as a foreign key column in one of the two tables.

One table has to hold the link. That table is called the **owning side**. It has a foreign key column, such as `passport_id`, that points to the primary key of the other table. The other entity is the **inverse side**. It does not store anything. It only says "the link is already described over there" with `mappedBy`.

Here is how the two tables look.

```text
traveller          passport
---------          --------
PK id       1---1  PK id
   full_name       number
FK passport_id     expiry_date
```

The `traveller` table owns the link with the foreign key `passport_id`. The value in that column is the `id` of one row in `passport`.

| Table | Column | Meaning |
|---|---|---|
| `traveller` | `id` | Primary key |
| `traveller` | `full_name` | Name of the traveller |
| `traveller` | `passport_id` | Foreign key to `passport` |
| `passport` | `id` | Primary key |
| `passport` | `number` | Passport number |
| `passport` | `expiry_date` | Date the passport expires |

## Why is it used?

Sometimes two things belong together, but keeping them in one table would be clumsy. A passport has its own life: it has an expiry date and can be renewed. You may also want to load a traveller without loading the passport details every time, or keep sensitive details apart. A one-to-one link lets you split the data into two tables and still move between them from Java as if they were fields of one object.

The database also protects the rule for you. A unique constraint on the foreign key column stops two travellers from pointing at the same passport.

> **Note:** Do not split a table just because it has many columns. Use a one-to-one link when the two parts have separate meaning or a separate life cycle.

## How it works

At startup Hibernate reads `@OneToOne` and adds the foreign key column to the owning table. Then, when you save, it writes the rows in the right order.

```text
save(traveller)
     |
     v
Cascade: save passport first
     |
     v
INSERT passport  -> gets id 1
     |
     v
INSERT traveller (passport_id = 1)
```

Because the traveller row needs the passport's id, the passport must be stored first. With `cascade = CascadeType.ALL` on the owning side, saving the traveller saves the passport for you, in the correct order.

Reading works in the other direction.

```text
findById(traveller 1)
     |
     v
SELECT traveller + join passport
     |
     v
Traveller object with
its Passport inside
```

Hibernate loads the traveller and follows the foreign key to fetch the passport. You then call `traveller.getPassport()` like any Java field.

## Real-Life Example

Think about a hotel guest and their room key card. The front desk gives each guest exactly one key card, and each card opens only that guest's room. The desk register has a column "card number" next to the guest's name. That column is the foreign key. If the desk tried to write the same card number next to two guests, the manager would catch it at once. That is the unique rule that a one-to-one mapping puts on the database. And if the guest leaves, the card is deactivated with them. That is what cascading does when you delete the owner.

## Code Example

Let's build a small app for a travel agency called Wanderly. A `Traveller` owns the link to a `Passport`, and the passport can find its holder through the inverse side.

```text
travel/
├─ pom.xml
└─ src/main/
  ├─ resources/
  │ └─ application.properties
  └─ java/com/wanderly/travel/
    ├─ TravelApplication.java
    ├─ Passport.java
    ├─ Traveller.java
    ├─ Repositories.java
    └─ TravelRunner.java
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

    <groupId>com.wanderly</groupId>
    <artifactId>travel</artifactId>
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

**File:** `TravelApplication.java` in package `com.wanderly.travel`

```java
package com.wanderly.travel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TravelApplication {

    public static void main(String[] args) {
        SpringApplication.run(TravelApplication.class, args);
    }
}
```

**File:** `Passport.java` in package `com.wanderly.travel`

```java
package com.wanderly.travel;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;

@Entity
public class Passport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String number;
    private LocalDate expiryDate;

    @OneToOne(mappedBy = "passport")
    private Traveller holder;

    protected Passport() {
    }

    public Passport(String number, LocalDate expiryDate) {
        this.number = number;
        this.expiryDate = expiryDate;
    }

    public Long getId() {
        return id;
    }

    public String getNumber() {
        return number;
    }

    public Traveller getHolder() {
        return holder;
    }
}
```

**File:** `Traveller.java` in package `com.wanderly.travel`

```java
package com.wanderly.travel;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class Traveller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "passport_id")
    private Passport passport;

    protected Traveller() {
    }

    public Traveller(String fullName, Passport passport) {
        this.fullName = fullName;
        this.passport = passport;
    }

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public Passport getPassport() {
        return passport;
    }
}
```

**File:** `Repositories.java` in package `com.wanderly.travel`

```java
package com.wanderly.travel;

import org.springframework.data.jpa.repository.JpaRepository;

interface TravellerRepository extends JpaRepository<Traveller, Long> {
}

interface PassportRepository extends JpaRepository<Passport, Long> {
}
```

**File:** `TravelRunner.java` in package `com.wanderly.travel`

```java
package com.wanderly.travel;

import java.time.LocalDate;

import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Component
public class TravelRunner implements CommandLineRunner {

    private final TravellerRepository travellers;
    private final PassportRepository passports;
    private final TransactionTemplate tx;

    public TravelRunner(TravellerRepository travellers, PassportRepository passports,
                        TransactionTemplate tx) {
        this.travellers = travellers;
        this.passports = passports;
        this.tx = tx;
    }

    @Override
    public void run(String... args) {
        Passport passport = new Passport("P1234567", LocalDate.of(2032, 5, 1));
        Traveller riya = travellers.save(new Traveller("Riya Sen", passport));
        System.out.println("Saved traveller " + riya.getId()
                + ", passport " + riya.getPassport().getId());

        Traveller loaded = travellers.findById(riya.getId()).orElseThrow();
        System.out.println("Traveller: " + loaded.getFullName()
                + ", " + loaded.getPassport().getNumber());

        Passport found = passports.findById(1L).orElseThrow();
        System.out.println("Holder of passport 1: " + found.getHolder().getFullName());

        try {
            tx.executeWithoutResult(status -> {
                Passport same = passports.findById(1L).orElseThrow();
                travellers.save(new Traveller("Copy Cat", same));
            });
        } catch (DataIntegrityViolationException e) {
            System.out.println("One passport, one traveller");
        }

        travellers.deleteById(riya.getId());
        System.out.println("Passports after delete: " + passports.count());
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.application.name=travel
spring.jpa.show-sql=true
```

Run it with `mvn spring-boot:run`. Hibernate logs a warning when the database refuses the duplicate link. It is expected, and the output below leaves it out.

**Output:**

```text
Saved traveller 1, passport 1
Traveller: Riya Sen, P1234567
Holder of passport 1: Riya Sen
One passport, one traveller
Passports after delete: 0
```

Hibernate also prints the table it built for the owning side. The foreign key column carries a unique rule:

```sql
create table traveller (id bigint generated by default as identity, passport_id bigint unique, full_name varchar(255), primary key (id))
```

## Code Explained

- `Traveller` is the owning side. `@JoinColumn(name = "passport_id")` names the foreign key column in the `traveller` table.
- `@OneToOne(cascade = CascadeType.ALL)` passes save and delete operations from the traveller to the passport. That is why saving the traveller stored the passport too, and deleting the traveller removed it.
- `Passport` is the inverse side. `mappedBy = "passport"` names the field on `Traveller` that owns the link. It creates no column of its own.
- `found.getHolder()` reads the link from the passport side. It works because the inverse side is loaded together with the passport.
- In the unique check, a second traveller pointed at passport 1. The database refused the insert, because the foreign key column has a unique constraint, and Spring reported a data-integrity exception.
- The unique check runs inside a `TransactionTemplate`, so the passport stays attached to the session while the new traveller is saved.

## Owning Side and Inverse Side

| Point | Owning side | Inverse side |
|---|---|---|
| Example | `Traveller` | `Passport` |
| Holds the foreign key | Yes | No |
| Annotation | `@OneToOne` with `@JoinColumn` | `@OneToOne(mappedBy = "...")` |
| Changes to it are saved | Yes | No, ignored |

## Common Mistakes

> **Warning:** Only the owning side writes the link. If you set `passport.holder = traveller` but never set `traveller.passport`, nothing is saved. Always set the owning side.

- **Forgetting `mappedBy` on the inverse side.** Then both entities try to own the link, and Hibernate creates two foreign key columns.
- **Saving without cascade.** Without `cascade`, saving a traveller with an unsaved passport fails, because the foreign key would point to nothing.
- **Cascading delete by accident.** With `CascadeType.ALL`, deleting the traveller also deletes the passport. Use it only when the passport cannot live without its owner.
- **Printing both sides in `toString`.** If both classes print each other, you get an endless loop. Print only ids or simple fields.

## Interview Questions

**What is a one-to-one relationship?**
Each row of one table matches at most one row of another table, and the reverse is also true. JPA models it with `@OneToOne`.

**Which side owns a one-to-one relationship?**
The side with the foreign key column and `@JoinColumn`. The other side uses `mappedBy` and only mirrors the link.

**What does `cascade = CascadeType.ALL` do?**
It passes operations such as save and delete from the owner to the related entity, so you do not handle both separately.

## Key Points to Remember

- `@OneToOne` links two entities so each pairs with exactly one other.
- The owning side holds the foreign key, usually named with `@JoinColumn`.
- The inverse side uses `mappedBy` and adds no column.
- The foreign key is unique, so the database blocks a second link to the same row.
- Use `cascade` to save or delete both entities together, and only when that is what you want.

## Frequently Asked Questions

### What is one-to-one mapping in Spring Boot JPA?

It is a link between two entities where each one has exactly one partner, declared with `@OneToOne`. One table stores a foreign key to the other.

### Do I need both sides of a one-to-one mapping?

No. A one-directional link, with `@OneToOne` only on the owning side, is often enough. Add the inverse side only when you need to navigate the other way.

### Can I share the primary key instead of using a foreign key column?

Yes, with `@MapsId`. The child then uses the parent's id as its own primary key. It saves a column, but it is a bit harder to read for beginners.

### Should I expose entities with one-to-one links in a REST API?

Better not. Copy the data into a small DTO first, so you control the output and avoid endless loops between the two sides.

## Related Topics

- [One-to-Many and Many-to-One Mapping](/learning/spring-boot-tutorial/one-to-many-and-many-to-one-mapping): the most common relationship between tables.
- [Many-to-Many Mapping](/learning/spring-boot-tutorial/many-to-many-mapping): link entities that both have many partners.
- [Lazy vs Eager Loading](/learning/spring-boot-tutorial/lazy-vs-eager-loading): decide when related data is loaded.
- [DTO Pattern](/learning/spring-boot-tutorial/dto-pattern): send flat objects from your API, not entities.
