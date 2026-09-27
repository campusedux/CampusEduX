When you visit a hospital, the first thing the front desk gives you is a number: a token, a patient ID, a file number. That number is how the hospital finds you again among thousands of people. Two patients with the same number would be a disaster. A database table has the same need. Every row needs one value that is different from all others, and that value is the primary key.

Who creates that number? You can hand it out yourself, or you can let the database do it. The primary key generation strategies in JPA decide this. In this topic you will meet the main ones, see the ids they create in a real run, and learn how to choose.

## What are primary key generation strategies?

A primary key is the column that identifies each row. In an entity, you mark it with `@Id`. A generation strategy tells JPA how the value gets created when you save a new object. You choose it with `@GeneratedValue`.

> **Definition:** A primary key generation strategy is the rule, set with `@GeneratedValue`, that says how JPA gets a unique id for a new entity: from an identity column, from a database sequence, from a random UUID, or from your own code.

JPA offers these strategies through the `GenerationType` enum:

- `IDENTITY`: the database makes the id when the row is inserted, using an auto-increment column.
- `SEQUENCE`: the database keeps a counter object called a sequence, and Hibernate asks it for the next numbers.
- `UUID`: Hibernate creates a random 128-bit id in the application.
- `AUTO`: Hibernate picks a strategy that fits the id type and the database.
- No `@GeneratedValue` at all: your code sets the id (an assigned id).

## Why is it used?

Every row needs an id, and doing it by hand is risky. If two users create a row at the same moment and your code picks "last id plus one", both may get the same number. Letting the database or Hibernate create ids avoids that clash.

The choice also affects speed and design. Sequences let Hibernate reserve a block of ids and insert many rows in one batch. UUIDs can be created before the row reaches the database and never clash across servers, which helps when many systems create data. Assigned ids suit natural codes like a ward name or a country code, where the value already means something.

> **Tip:** When you are not sure, use `IDENTITY` for simple apps on MySQL, and `SEQUENCE` on PostgreSQL. Both are safe and common.

## How it works

The strategies differ in *when* the id becomes known.

```text
IDENTITY:
save() -> INSERT (no id)
       -> database makes id
       -> id returned to object

SEQUENCE:
save() -> ask sequence for id
       -> INSERT (with id)
```

With `IDENTITY`, Hibernate must run the `insert` right away to learn the id, because only the database can make it. With `SEQUENCE`, Hibernate asks the sequence for a number first, then inserts the row with the id already known. That lets it group inserts together.

UUID and assigned ids skip the database completely.

```text
UUID:
save() -> Hibernate makes a UUID
       -> INSERT (with id)

Assigned:
your code sets the id
save() -> INSERT (with your id)
```

For a UUID, Hibernate creates a random value in Java. For an assigned id, your own code provides it, and you must make sure it is unique.

## Real-Life Example

Think about how different places hand out numbers. A bank's queue machine prints the next ticket, and you cannot choose it. That is identity: the machine owns the counter. A cloakroom keeps a roll of numbered tokens and gives out a handful to each helper at the start of the day. That is a sequence with a block size: helpers hand out numbers from their own handful without asking every time. A courier company prints a long random tracking code, which nobody else can guess or repeat. That is a UUID. And a hostel that names its rooms A1, A2, B1 is using assigned ids: the number means something, and the manager decides it.

## Code Example

Let's build a small app for City Care Hospital that tries five ids: a patient with `IDENTITY`, a lab report with `SEQUENCE`, an appointment with `AUTO`, a receipt with `UUID`, and a ward with an assigned code.

```text
ids/
├─ pom.xml
└─ src/main/
   ├─ java/com/citycare/ids/
   │  ├─ IdsApplication.java
   │  ├─ Patient.java
   │  ├─ LabReport.java
   │  ├─ Appointment.java
   │  ├─ Receipt.java
   │  ├─ Ward.java
   │  ├─ Repositories.java
   │  └─ IdRunner.java
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

    <groupId>com.citycare</groupId>
    <artifactId>ids</artifactId>
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

**File:** `IdsApplication.java` in package `com.citycare.ids`

```java
package com.citycare.ids;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class IdsApplication {

    public static void main(String[] args) {
        SpringApplication.run(IdsApplication.class, args);
    }
}
```

**File:** `Patient.java` in package `com.citycare.ids`

```java
package com.citycare.ids;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    protected Patient() {
    }

    public Patient(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }
}
```

**File:** `LabReport.java` in package `com.citycare.ids`

```java
package com.citycare.ids;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;

@Entity
public class LabReport {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "report_seq")
    @SequenceGenerator(name = "report_seq", sequenceName = "report_seq", allocationSize = 5)
    private Long id;

    private String testName;

    protected LabReport() {
    }

    public LabReport(String testName) {
        this.testName = testName;
    }

    public Long getId() {
        return id;
    }
}
```

**File:** `Appointment.java` in package `com.citycare.ids`

```java
package com.citycare.ids;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class Appointment {

    @Id
    @GeneratedValue
    private Long id;

    private String doctor;

    protected Appointment() {
    }

    public Appointment(String doctor) {
        this.doctor = doctor;
    }

    public Long getId() {
        return id;
    }
}
```

**File:** `Receipt.java` in package `com.citycare.ids`

```java
package com.citycare.ids;

import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private int amount;

    protected Receipt() {
    }

    public Receipt(int amount) {
        this.amount = amount;
    }

    public UUID getId() {
        return id;
    }
}
```

**File:** `Ward.java` in package `com.citycare.ids`

```java
package com.citycare.ids;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Ward {

    @Id
    private String code;

    private int beds;

    protected Ward() {
    }

    public Ward(String code, int beds) {
        this.code = code;
        this.beds = beds;
    }

    public String getCode() {
        return code;
    }
}
```

**File:** `Repositories.java` in package `com.citycare.ids`

```java
package com.citycare.ids;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface PatientRepository extends JpaRepository<Patient, Long> {
}

interface LabReportRepository extends JpaRepository<LabReport, Long> {
}

interface AppointmentRepository extends JpaRepository<Appointment, Long> {
}

interface ReceiptRepository extends JpaRepository<Receipt, UUID> {
}

interface WardRepository extends JpaRepository<Ward, String> {
}
```

**File:** `IdRunner.java` in package `com.citycare.ids`

```java
package com.citycare.ids;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class IdRunner implements CommandLineRunner {

    private final PatientRepository patients;
    private final LabReportRepository reports;
    private final AppointmentRepository appointments;
    private final ReceiptRepository receipts;
    private final WardRepository wards;

    public IdRunner(PatientRepository patients, LabReportRepository reports,
                    AppointmentRepository appointments, ReceiptRepository receipts,
                    WardRepository wards) {
        this.patients = patients;
        this.reports = reports;
        this.appointments = appointments;
        this.receipts = receipts;
        this.wards = wards;
    }

    @Override
    public void run(String... args) {
        System.out.println("IDENTITY: " + patients.save(new Patient("Riya")).getId()
                + ", " + patients.save(new Patient("Imran")).getId());
        System.out.println("SEQUENCE: " + reports.save(new LabReport("CBC")).getId()
                + ", " + reports.save(new LabReport("X-Ray")).getId());
        System.out.println("AUTO: " + appointments.save(new Appointment("Dr. Rao")).getId()
                + ", " + appointments.save(new Appointment("Dr. Sen")).getId());
        System.out.println("UUID length: "
                + receipts.save(new Receipt(500)).getId().toString().length());
        System.out.println("Assigned: " + wards.save(new Ward("ICU", 12)).getCode());
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.application.name=ids
spring.jpa.show-sql=true
```

Run it with `mvn spring-boot:run`.

**Output:**

```text
IDENTITY: 1, 2
SEQUENCE: 1, 2
AUTO: 1, 2
UUID length: 36
Assigned: ICU
```

With `show-sql` on, Hibernate prints how it prepared the database. These are some of the lines from the same run:

```sql
create sequence appointment_seq start with 1 increment by 50
create sequence report_seq start with 1 increment by 5
create table patient (id bigint generated by default as identity, name varchar(255), primary key (id))
create table receipt (amount integer not null, id uuid not null, primary key (id))
```

## Code Explained

- `Patient` uses `IDENTITY`. In the SQL its id column is `generated by default as identity`, and the database hands out 1, then 2.
- `LabReport` uses `SEQUENCE` with a named `@SequenceGenerator`. The `allocationSize = 5` value means Hibernate asks the sequence once and then uses five ids before it asks again.
- `Appointment` uses a bare `@GeneratedValue`, which means `AUTO`. For a `Long` id on H2, Hibernate chose a sequence named after the entity.
- `Receipt` uses `GenerationType.UUID` with a `UUID` field. The id is created in Java, and its text form is 36 characters long.
- `Ward` has no `@GeneratedValue`, so the code supplies `"ICU"` itself. Saving two wards with the same code would clash on the primary key.
- The `Repositories.java` file holds five small interfaces. They are package-private, which is fine, because only the runner in the same package uses them.

## Which Strategy Should I Choose?

| Strategy | Who makes the id | Good for | Watch out |
|---|---|---|---|
| `IDENTITY` | The database | Simple apps, MySQL | Inserts cannot be batched well |
| `SEQUENCE` | A database sequence | PostgreSQL, batch inserts | Needs a sequence object |
| `UUID` | Hibernate | Many systems, hard-to-guess ids | Bigger and slower to index |
| `AUTO` | Hibernate decides | Quick starts | Choice may change with the database |
| Assigned | Your code | Natural codes | You must keep them unique |

## Common Mistakes

> **Warning:** Do not expose sequential database ids in public links when the data is private. A user who sees `/orders/41` may try `/orders/42`. Check ownership on the server, and use UUIDs where guessing must be hard.

- **Using `AUTO` and expecting the same ids everywhere.** On MySQL it may behave differently from PostgreSQL, so state your strategy when it matters.
- **Mismatched sequence names.** The `sequenceName` must match the sequence in the database. If you manage tables with migration scripts, create the sequence there.
- **Setting the id yourself on a generated entity.** If you call `save()` on an object that already has an id, Spring Data treats it as an update, not an insert.
- **Using `String` for random ids without care.** Use the `UUID` type, which stores in a compact form on databases that support it.

## Interview Questions

**What is the difference between `IDENTITY` and `SEQUENCE`?**
`IDENTITY` lets the database create the id at insert time. `SEQUENCE` asks a database sequence for ids in advance, so Hibernate can batch inserts.

**When would you use a UUID as a primary key?**
When ids must be created outside the database, must not clash across servers, or must be hard to guess. The cost is bigger indexes.

**What does `GenerationType.AUTO` do?**
It lets the persistence provider pick a strategy that suits the id type and the database.

## Key Points to Remember

- Every entity needs a primary key marked with `@Id`.
- `@GeneratedValue` sets how the id is created: `IDENTITY`, `SEQUENCE`, `UUID` or `AUTO`.
- Without `@GeneratedValue`, your code must set a unique id.
- `IDENTITY` needs an immediate insert. `SEQUENCE` can reserve ids and batch inserts.
- Never assume ids are secret. Check access rights on the server.

## Frequently Asked Questions

### Which primary key generation strategy is best for MySQL?

`IDENTITY` is the usual choice, because MySQL has auto-increment columns and no sequence objects. It is simple and works well.

### Why are my generated ids not 1, 2, 3?

Sequences can skip numbers, for example when a transaction rolls back or when Hibernate reserves a block. Gaps are normal. Never depend on ids being continuous.

### Should I use Long or UUID for the primary key?

Use `Long` for most apps because it is small and fast. Choose `UUID` when ids must be created in many places or must be hard to guess.

### Can I change the strategy after the table has data?

It is possible but needs care. The new strategy must continue after the highest existing id, or new rows will clash with old ones.

## Related Topics

- [JPA Entity](/learning/spring-boot-tutorial/jpa-entity): see the rest of the annotations on an entity.
- [JpaRepository](/learning/spring-boot-tutorial/jparepository): save and load entities by their id.
- [Connecting Spring Boot to PostgreSQL](/learning/spring-boot-tutorial/connecting-spring-boot-to-postgresql): sequences and identity on a real server.
- [Database Migration with Flyway](/learning/spring-boot-tutorial/database-migration-with-flyway): create tables and sequences with scripts.
