Walk into any bike rental shop and look at the register on the counter. Each row has the same columns: frame number, model, daily rate, and whether the bike is free or out. The shop owner never invents a new layout for every bike. One layout, many rows. In JPA, an entity class is that layout, and the JPA entity is the first thing you learn. It tells the database what a bike looks like, and every object of the class becomes one row.

In this topic you will learn what an entity is, which annotations shape the table, and how Hibernate turns your class into SQL. We will build a bike rental register and watch the database enforce the rules you write.

## What is a JPA entity?

An entity is a plain Java class that is linked to a database table. Each object is one row, and each field is one column. You do this with annotations from the `jakarta.persistence` package.

> **Definition:** A JPA entity is a Java class marked with `@Entity`. It is mapped to a database table, its objects map to rows, and one field marked `@Id` is the primary key.

A valid entity needs only a few things:

- The `@Entity` annotation on the class.
- A field marked with `@Id`, which is the primary key that identifies each row.
- A constructor with no arguments, which can be `protected`. Hibernate uses it to create objects when it reads rows.
- A class that is not `final`, and fields that are not `final`, so Hibernate can fill them.

Everything else is optional. Without more annotations, Hibernate uses smart defaults: the table name comes from the class name, and the column names come from the field names.

## Why is it used?

Without entities, you would write SQL for every table and copy each column into an object by hand. An entity keeps the table layout and the Java class in one place. When a column changes, you change one class.

The extra annotations let you state rules close to the field: this column cannot be empty, this text may be at most 60 characters, this value must be unique. The database then refuses bad data, even if a bug in your code tries to save it.

> **Note:** In Spring Boot 4, entities use `jakarta.persistence`. Old tutorials use `javax.persistence`, which no longer compiles.

## How it works

At startup, Hibernate scans your classes and builds a map between them and the tables.

```text
@Entity classes found
        |
        v
Read annotations on fields
        |
        v
Build the table layout
        |
        v
CREATE TABLE (if ddl allows)
        |
        v
Objects become rows
```

Spring Boot finds every class with `@Entity` under your main package. Hibernate reads the annotations and works out the table name, the columns, their types and their rules. If schema generation is on, it sends a `CREATE TABLE` statement. From then on, saving an object writes a row, and loading a row builds an object.

Here is how one object relates to one row.

```text
Java object          Table row
-----------          ---------
Bike object  -->  1 row in bikes
  id                 id (PK)
  modelName          model_name
  frameNo            frame_no
  status             status
```

Each field maps to one column, and `@Id` marks the primary key. Names are changed from camelCase to snake_case, so `modelName` becomes `model_name`.

## Real-Life Example

Think about a form that a bike shop uses when a new bike arrives. The form has boxes: model name (at most 60 letters), frame number (must be different for every bike), daily rate (two decimals), and a status tick box with three choices. The staff cannot leave the model or frame box empty. That printed form is the entity. Every bike that arrives fills one copy, and each filled copy goes into the register as one row. The shop trusts the form, because it does not accept a copy that breaks the rules.

## Code Example

Let's build the register for a shop called Pedal Point. The bike entity has a table name, column rules, an enum status, a date, and one field that is not stored.

```text
rentals/
├─ pom.xml
└─ src/main/
   ├─ java/com/pedalpoint/rentals/
   │  ├─ RentalsApplication.java
   │  ├─ Bike.java
   │  ├─ BikeStatus.java
   │  ├─ BikeRepository.java
   │  └─ BikeRunner.java
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

    <groupId>com.pedalpoint</groupId>
    <artifactId>rentals</artifactId>
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

**File:** `RentalsApplication.java` in package `com.pedalpoint.rentals`

```java
package com.pedalpoint.rentals;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RentalsApplication {

    public static void main(String[] args) {
        SpringApplication.run(RentalsApplication.class, args);
    }
}
```

**File:** `BikeStatus.java` in package `com.pedalpoint.rentals`

```java
package com.pedalpoint.rentals;

public enum BikeStatus {
    AVAILABLE, RENTED, IN_REPAIR
}
```

**File:** `Bike.java` in package `com.pedalpoint.rentals`

```java
package com.pedalpoint.rentals;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "bikes")
public class Bike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "model_name", nullable = false, length = 60)
    private String modelName;

    @Column(name = "frame_no", nullable = false, unique = true, length = 20)
    private String frameNo;

    @Column(name = "daily_rate", nullable = false, precision = 8, scale = 2)
    private BigDecimal dailyRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private BikeStatus status;

    private LocalDate boughtOn;

    @Transient
    private String shopNote;

    protected Bike() {
    }

    public Bike(String modelName, String frameNo, String dailyRate, BikeStatus status) {
        this.modelName = modelName;
        this.frameNo = frameNo;
        this.dailyRate = new BigDecimal(dailyRate);
        this.status = status;
        this.boughtOn = LocalDate.of(2026, 1, 15);
    }

    public Long getId() {
        return id;
    }

    public String getShopNote() {
        return shopNote;
    }

    public void setShopNote(String shopNote) {
        this.shopNote = shopNote;
    }

    @Override
    public String toString() {
        return id + " " + modelName + " " + status + " Rs" + dailyRate;
    }
}
```

**File:** `BikeRepository.java` in package `com.pedalpoint.rentals`

```java
package com.pedalpoint.rentals;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BikeRepository extends JpaRepository<Bike, Long> {
}
```

**File:** `BikeRunner.java` in package `com.pedalpoint.rentals`

```java
package com.pedalpoint.rentals;

import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

@Component
public class BikeRunner implements CommandLineRunner {

    private final BikeRepository repository;

    public BikeRunner(BikeRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        Bike trail = new Bike("Trail Rider", "FR-1001", "450.00", BikeStatus.AVAILABLE);
        trail.setShopNote("fresh paint");
        repository.save(trail);
        repository.save(new Bike("City Glide", "FR-1002", "300.00", BikeStatus.IN_REPAIR));
        repository.findAll().forEach(System.out::println);

        try {
            repository.save(new Bike("Copy Cat", "FR-1001", "100.00", BikeStatus.RENTED));
        } catch (DataIntegrityViolationException e) {
            System.out.println("Duplicate frame no rejected");
        }

        Bike reloaded = repository.findById(trail.getId()).orElseThrow();
        System.out.println("Note after reload: " + reloaded.getShopNote());
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.application.name=rentals
spring.jpa.show-sql=true
```

Run it with `mvn spring-boot:run`. Hibernate also writes a warning about the duplicate row to the console. It is expected here, and the output below leaves it out.

**Output:**

```text
1 Trail Rider AVAILABLE Rs450.00
2 City Glide IN_REPAIR Rs300.00
Duplicate frame no rejected
Note after reload: null
```

`show-sql` also prints the table that Hibernate built from the annotations. Compare it with the class above. H2 shows the enum column as a list of the three allowed names.

```sql
create table bikes (bought_on date, daily_rate numeric(8,2) not null, id bigint generated by default as identity, frame_no varchar(20) not null unique, model_name varchar(60) not null, status enum ('AVAILABLE','IN_REPAIR','RENTED') not null, primary key (id))
```

## Code Explained

- `@Table(name = "bikes")` sets the table name. Without it, the table would be called `bike`.
- `@Column(nullable = false, length = 60)` makes the column `not null` with at most 60 characters. `name = "model_name"` sets the column name.
- `unique = true` on `frame_no` creates a unique constraint. The duplicate `FR-1001` was rejected by the database, and Spring turned the error into a data-integrity exception, which the runner catches.
- `precision = 8, scale = 2` is for money. Eight digits in total, two after the point, which suits `BigDecimal`.
- `@Enumerated(EnumType.STRING)` stores the enum name, such as `AVAILABLE`, instead of its position number. Names stay correct even if you reorder the enum.
- `@Transient` says "do not store this field". The note printed as `null` after reload, because it never reached the database.
- `boughtOn` has no annotation, so Hibernate uses the default column name `bought_on` and a date type.

## Common Column Annotations

| Annotation | Purpose |
|---|---|
| `@Entity` | Maps the class to a table |
| `@Table(name = "...")` | Chooses the table name |
| `@Id` | Marks the primary key |
| `@Column(...)` | Sets name, length, null and unique rules |
| `@Enumerated` | Stores an enum as text or number |
| `@Transient` | Leaves a field out of the table |

## Common Mistakes

> **Warning:** Never use `EnumType.ORDINAL`, which stores 0, 1, 2. If someone later adds a new value in the middle of the enum, all old rows silently change meaning. Use `EnumType.STRING`.

- **Making the entity a `record` or a `final` class.** Hibernate must create and fill entity objects, so it needs a normal class it can extend.
- **Forgetting the no-argument constructor.** Reading rows then fails at runtime.
- **Using `double` for money.** Decimals like 0.10 are not exact in `double`. Use `BigDecimal`.
- **Trusting `@Column(length)` as the only check.** It protects the database, but validate user input earlier too, so people get friendly error messages.

## Interview Questions

**What is the minimum needed to make a class an entity?**
The `@Entity` annotation, an `@Id` field and a no-argument constructor. The class must not be final.

**What does `@Transient` do?**
It tells JPA not to store the field. The field lives only in memory.

**Why prefer `EnumType.STRING` over `ORDINAL`?**
The string stays correct if the enum order changes. Ordinal stores positions, which break when values move.

## Key Points to Remember

- An entity is a class mapped to a table, and its objects are rows.
- `@Entity` and `@Id` are required, and a no-argument constructor is needed for Hibernate.
- `@Column` states rules such as not null, length and unique, and the database enforces them.
- Use `BigDecimal` for money and `EnumType.STRING` for enums.
- `@Transient` keeps a field out of the table.

## Frequently Asked Questions

### Do I have to write getters and setters in a JPA entity?

Hibernate can read private fields directly, so it does not need them. You add getters when other code needs the values, for example when Jackson turns the object into JSON.

### Can two entities share the same table name?

Not in one database. Each entity needs its own table, so pick different names with `@Table` if the class names clash.

### What is the difference between `@Entity` and `@Table`?

`@Entity` says the class is stored in the database. `@Table` is optional and only sets details such as the table name.

### Can I use Lombok on entities?

Yes, but be careful with `@Data`, which creates `equals` and `hashCode` over all fields and can cause trouble with relations. Plain getters and setters are safer.

## Related Topics

- [Primary Key Generation Strategies](/learning/spring-boot-tutorial/primary-key-generation-strategies): choose how the `@Id` value is created.
- [JpaRepository](/learning/spring-boot-tutorial/jparepository): save and load these entities without SQL.
- [Bean Validation](/learning/spring-boot-tutorial/bean-validation): check input before it reaches the database.
- [One-to-One Mapping](/learning/spring-boot-tutorial/one-to-one-mapping): connect two entities together.
