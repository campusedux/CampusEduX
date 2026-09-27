A shopkeeper sends a boy to the market with a list of ten customers. Instead of buying everything in one trip, the boy walks back and forth: one trip to check the list, then one trip for each customer's order. Eleven trips for a job that needed one or two. Your database code can behave exactly like that boy, and it does so quietly, with no error message at all.

This is the N+1 problem in Spring Boot and JPA. Let's find out what it is, how to spot it with real numbers, and three ways to fix it.

## What is the N+1 problem?

Think of a hospital reception desk. You ask for the list of wards, and you get four names. Then, for each ward, you walk back to the desk to ask which patients are in it. That is one question for the list, plus one question for each of the four wards. Five trips for data that could arrive in a single trip.

> **Definition:** The N+1 problem happens when your code runs one query to load a list of N parent rows, and then runs one more query for each parent to load its children. The total is N+1 queries instead of one or two.

The problem is not a bug in JPA. It is a side effect of lazy loading. A lazy collection loads itself the first time you touch it, and if you touch it inside a loop, it loads once per parent.

## Why does it matter?

With 4 wards you will never notice it. With 500 wards, the same page sends 501 queries. Each query has a small cost, and each trip to the database has a bigger cost: network time, connection use and locking. Pages that were fast in development become slow in production, and nobody understands why, because the code looks innocent.

N+1 is one of the most common performance problems in Spring Boot projects, and interviewers love to ask about it. Knowing how to see it and fix it puts you ahead of many beginners.

## How it works

Here is what happens when you load every ward and print how many patients each one has.

```text
wardRepository.findAll()
    |
    v
Query 1: select all wards
    |
    v
for each ward in the list
    |
    v
ward.getPatients().size()
    |
    v
Query 2: patients of ward 1
Query 3: patients of ward 2
Query 4: patients of ward 3
Query 5: patients of ward 4
```

The first query returns four wards, and each ward carries a lazy placeholder for its patients. The loop touches the placeholder of each ward in turn, and every touch runs its own query. With N wards you get 1 + N queries in total.

The fix is to ask for the wards and their patients together. This is what the picture looks like after the fix.

```text
wards.findAllWithPatients()
    |
    v
Query 1: select wards
         join their patients
    |
    v
Wards with patients already loaded
    |
    v
Loop reads memory only: no query
```

One query brings back every ward with its patients. The loop now reads objects that are already in memory, so the database is not touched again.

| Approach | Queries for 4 wards | When to use it |
|---|---|---|
| Plain `findAll()` and a loop | 5 | Never on collections you loop over |
| `JOIN FETCH` query | 1 | One clear use case |
| `@EntityGraph` | 1 | Same, without writing JPQL |
| `@BatchSize` | 2 | Many places touch the collection |

## Real-Life Example

Picture a tiffin service that delivers 30 boxes a day. Version one of the plan: the manager reads the customer list, then phones the kitchen once for every customer to ask what to pack. That is 31 calls. Version two: the manager phones once and asks for the full packing sheet. One call. Same food, far less talking. `JOIN FETCH` is the packing sheet. Batch fetching is a middle way: the manager phones once for every ten customers, and 30 customers need only three calls.

## Code Example

Let's build a small app for City Care Hospital. We create four wards, each with patients, and we count the SQL statements in each approach using Hibernate statistics. The `Nurse` collection shows the batch approach.

```text
citycare/
├─ pom.xml
└─ src/main/
   ├─ java/com/citycare/wards/
   │  ├─ WardsApplication.java
   │  ├─ Ward.java
   │  ├─ Patient.java
   │  ├─ Nurse.java
   │  ├─ WardRepository.java
   │  └─ WardService.java
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
    <artifactId>wards</artifactId>
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
spring.jpa.properties.hibernate.generate_statistics=true
```

**File:** `Ward.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

import org.hibernate.annotations.BatchSize;

@Entity
public class Ward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "ward", cascade = CascadeType.PERSIST)
    private Set<Patient> patients = new HashSet<>();

    @OneToMany(mappedBy = "ward", cascade = CascadeType.PERSIST)
    @BatchSize(size = 10)
    private Set<Nurse> nurses = new HashSet<>();

    protected Ward() {
    }

    public Ward(String name) {
        this.name = name;
    }

    public Set<Patient> getPatients() {
        return patients;
    }

    public Set<Nurse> getNurses() {
        return nurses;
    }
}
```

**File:** `Patient.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    protected Patient() {
    }

    public Patient(String name, Ward ward) {
        this.name = name;
        this.ward = ward;
    }
}
```

**File:** `Nurse.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Nurse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    protected Nurse() {
    }

    public Nurse(String name, Ward ward) {
        this.name = name;
        this.ward = ward;
    }
}
```

**File:** `WardRepository.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface WardRepository extends JpaRepository<Ward, Long> {

    @Query("select distinct w from Ward w join fetch w.patients")
    List<Ward> findAllWithPatients();

    @EntityGraph(attributePaths = "patients")
    List<Ward> findAllBy();
}
```

**File:** `WardService.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import java.util.List;

import jakarta.persistence.EntityManagerFactory;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WardService {

    private final WardRepository wards;
    private final Statistics stats;

    public WardService(WardRepository wards, EntityManagerFactory emf) {
        this.wards = wards;
        this.stats = emf.unwrap(SessionFactory.class).getStatistics();
    }

    @Transactional
    public void seed() {
        String[] names = {"Cardiology", "Pediatrics", "Orthopedics", "Maternity"};
        for (String name : names) {
            Ward ward = new Ward(name);
            ward.getPatients().add(new Patient(name + " patient A", ward));
            ward.getPatients().add(new Patient(name + " patient B", ward));
            ward.getNurses().add(new Nurse(name + " nurse", ward));
            wards.save(ward);
        }
    }

    @Transactional(readOnly = true)
    public void naive() {
        stats.clear();
        int patients = 0;
        for (Ward ward : wards.findAll()) {
            patients += ward.getPatients().size();
        }
        report("Plain loop", patients);
    }

    @Transactional(readOnly = true)
    public void joinFetch() {
        stats.clear();
        report("Join fetch", count(wards.findAllWithPatients()));
    }

    @Transactional(readOnly = true)
    public void entityGraph() {
        stats.clear();
        report("Entity graph", count(wards.findAllBy()));
    }

    @Transactional(readOnly = true)
    public void batch() {
        stats.clear();
        int nurses = 0;
        for (Ward ward : wards.findAll()) {
            nurses += ward.getNurses().size();
        }
        System.out.println("Batch size 10, nurses: " + nurses);
        System.out.println("  queries: " + stats.getPrepareStatementCount());
    }

    private int count(List<Ward> list) {
        return list.stream().mapToInt(w -> w.getPatients().size()).sum();
    }

    private void report(String label, int patients) {
        System.out.println(label + ", patients: " + patients);
        System.out.println("  queries: " + stats.getPrepareStatementCount());
    }
}
```

**File:** `WardsApplication.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class WardsApplication {

    public static void main(String[] args) {
        SpringApplication.run(WardsApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(WardService service) {
        return args -> {
            service.seed();
            service.naive();
            service.joinFetch();
            service.entityGraph();
            service.batch();
        };
    }
}
```

Run it:

```bash
mvn spring-boot:run
```

**Output:**

```text
Plain loop, patients: 8
  queries: 5
Join fetch, patients: 8
  queries: 1
Entity graph, patients: 8
  queries: 1
Batch size 10, nurses: 4
  queries: 2
```

The plain loop sends five statements: one for the four wards, and one for each ward's patients. Both the `JOIN FETCH` query and the entity graph need only one. The batch version loads the nurses of all four wards with a single extra query, because they fit in one batch of ten.

## Code Explained

- `naive()` is the N+1 shape: `findAll()` runs first, and touching `getPatients()` inside the loop runs one query per ward.
- `findAllWithPatients()` uses `join fetch` in JPQL. The word `distinct` removes duplicate wards created by the join.
- `@EntityGraph(attributePaths = "patients")` gives the same result without writing a query. Spring Data builds it from the method name.
- `@BatchSize(size = 10)` tells Hibernate to load the collections of up to ten wards in one query, using an `in` list.
- `getPrepareStatementCount()` from Hibernate statistics is the number you watch. It is a good habit to check it before you trust a data-heavy page.

> **Tip:** To see N+1 in your own project, turn on `spring.jpa.show-sql=true` in development and look for the same select repeated many times with different ids.

## Common Mistakes

> **Warning:** Do not fix N+1 by switching the collection to `FetchType.EAGER`. Eager loading still runs one query per parent when you use `findAll()`, and it also loads the children in places where you never needed them.

- **Not looking at the queries.** N+1 never throws an error. Check the SQL in development or count statements in tests.
- **Fetching two collections at once.** A `JOIN FETCH` on two `List` collections in one query can cause a `MultipleBagFetchException` or a huge result. Fetch one, and use `@BatchSize` for the other.
- **Combining `JOIN FETCH` with paging.** Hibernate then pages in memory. For paged lists, use `@BatchSize` or fetch the ids first.
- **Forgetting `distinct`.** With older Hibernate habits, people worry about duplicates. Keep `distinct` for clarity.
- **Returning entities to the web layer.** Jackson touches every getter and triggers a query per row. Map to DTOs and load exactly what the DTO needs.

## Interview Questions

**What is the N+1 problem?**
One query loads N parent rows, and then N more queries load the children, one per parent. It usually comes from lazy loading inside a loop.

**How do you detect it?**
Turn on SQL logging or Hibernate statistics and look for the same query repeated with different ids. A test that asserts the statement count also catches it.

**How do you fix it?**
Fetch the children together with the parents using `JOIN FETCH` or `@EntityGraph`, or reduce the number of queries with `@BatchSize` or a global batch fetch size.

**Why is switching to EAGER not a real fix?**
With a query such as `findAll()`, Hibernate still loads the children with extra queries, and it now does so everywhere, even when the data is not needed.

## Key Points to Remember

- N+1 means one query for the list plus one query for each row's children.
- It comes from lazy loading inside a loop, and it never shows an error.
- Count the statements to see it. Do not guess.
- Fix it with `JOIN FETCH`, `@EntityGraph` or `@BatchSize`.
- Do not fix it with `FetchType.EAGER`.

## Frequently Asked Questions

### How do I find the N+1 problem in my Spring Boot project?

Set `spring.jpa.show-sql=true` while developing and read the console. If one select for the list is followed by many similar selects that differ only by an id, you have N+1. Hibernate statistics give you an exact count.

### Does N+1 happen with `@ManyToOne` too?

Yes. Loading 100 dishes whose restaurant is eager can load 100 restaurants one by one. Mark the link lazy and fetch the restaurant only where you need it.

### Is JOIN FETCH always the best fix for the N+1 problem?

It is the simplest for one collection and one use case. For several collections, or for paged lists, batch fetching is often safer.

### Can I set a batch size for the whole application?

Yes. Add this line to `application.properties`:

```properties
spring.jpa.properties.hibernate.default_batch_fetch_size=10
```

It applies a batch size to every lazy association, which is a cheap way to reduce the N+1 problem across a project.

## Related Topics

- [Lazy vs Eager Loading](/learning/spring-boot-tutorial/lazy-vs-eager-loading): understand the fetch types that cause the problem.
- [One to Many and Many to One Mapping](/learning/spring-boot-tutorial/one-to-many-and-many-to-one-mapping): the relationships where N+1 shows up.
- [JpaRepository](/learning/spring-boot-tutorial/jparepository): the repository methods used in this example.
- [@Query with JPQL and Native SQL](/learning/spring-boot-tutorial/query-with-jpql-and-native-sql): write the `JOIN FETCH` query yourself.
