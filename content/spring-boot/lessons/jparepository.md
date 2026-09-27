Imagine a tiffin service that delivers lunch boxes to offices. The owner keeps a register of meals. Every day the staff do the same small jobs: add a new meal, look one up, change a price, remove a meal that is no longer cooked, and count what is left. If each cook wrote these steps again and again in their own style, the register would be a mess.

A `JpaRepository` is a ready-made helper that does these everyday jobs for you. You declare an empty interface, and Spring writes the working class. In this topic you will learn what a `JpaRepository` gives you, how it works, and how to use it for saving, finding, updating, deleting, sorting and paging.

## What is JpaRepository?

`JpaRepository` is an interface from Spring Data JPA. When your own interface extends it, Spring builds an implementation at startup, with methods for the common database jobs on one entity. You write no method bodies.

> **Definition:** `JpaRepository<T, ID>` is a Spring Data interface that gives you ready-made methods to save, find, update, delete, sort and page entities of type `T` whose primary key type is `ID`.

You give it two types: the entity class and the type of its primary key.

```java
public interface MealRepository extends JpaRepository<Meal, Long> {
}
```

That is the whole repository. It inherits its methods from a chain of interfaces, and each adds something:

- `CrudRepository` gives `save`, `findById`, `existsById`, `count`, `deleteById` and more.
- `ListCrudRepository` and `ListPagingAndSortingRepository` return lists instead of plain iterables, and add sorting and paging.
- `JpaRepository` itself adds JPA extras such as `flush` and `saveAndFlush`.

## Why is it used?

Without it, every entity needs a class full of code that opens an entity manager, runs a query and handles errors. Most of that code is the same for every table. A repository removes it, so you write no boilerplate and make fewer mistakes.

It also gives your code a clear home for database access. Your service classes talk to the repository, and the repository talks to Hibernate. When you need a special search, you add one method to the interface, as you will see in the next topics, and you still write no class body.

> **Note:** Spring Data JPA finds repository interfaces under your main package on its own. You do not need `@Repository` on the interface.

## How it works

Follow what happens when you call `save()` on your repository.

```text
mealRepository.save(meal)
        |
        v
Spring proxy (built at startup)
        |
        v
SimpleJpaRepository does the work
        |
        v
Hibernate writes the SQL
        |
        v
Database stores the row
```

At startup, Spring sees your empty interface and builds a proxy for it. The proxy passes each call to `SimpleJpaRepository`, a class inside Spring Data JPA that already knows how to do the common jobs with Hibernate. Each call is short, and a transaction is opened for you around it.

The methods you use most fall into a few groups.

```text
Create/Update  save, saveAll
Read one     findById, existsById
Read many    findAll, findAllById
Sort and page findAll(Sort),
              findAll(Pageable)
Delete        deleteById, delete
Count         count
```

Notice that `save` is used both for a new object and for a changed one. If the object has no id yet, Spring Data inserts it. If the id exists, it updates the row.

## Real-Life Example

Think about a bank counter. You do not tell the clerk how the vault works. You say "deposit this", "show my balance", "close this account". The counter offers a small, fixed set of services, and behind it a trained team does the real work. A repository is that counter for your table. You ask `save`, `findById` or `deleteById`, and the team behind it, meaning Spring Data and Hibernate, handles the vault.

## Code Example

Let's build the meal register for Dabba Express. The runner adds meals, finds one, updates a price, sorts, pages, and deletes.

```text
dabba/
├─ pom.xml
└─ src/main/
   ├─ java/com/dabbaexpress/meals/
   │  ├─ MealsApplication.java
   │  ├─ Meal.java
   │  ├─ MealRepository.java
   │  └─ MealRunner.java
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

    <groupId>com.dabbaexpress</groupId>
    <artifactId>meals</artifactId>
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

**File:** `MealsApplication.java` in package `com.dabbaexpress.meals`

```java
package com.dabbaexpress.meals;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MealsApplication {

    public static void main(String[] args) {
        SpringApplication.run(MealsApplication.class, args);
    }
}
```

**File:** `Meal.java` in package `com.dabbaexpress.meals`

```java
package com.dabbaexpress.meals;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Meal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int price;

    protected Meal() {
    }

    public Meal(String name, int price) {
        this.name = name;
        this.price = price;
    }

    public String getName() {
        return name;
    }

    public void setPrice(int price) {
        this.price = price;
    }

    @Override
    public String toString() {
        return id + " " + name + " Rs" + price;
    }
}
```

**File:** `MealRepository.java` in package `com.dabbaexpress.meals`

```java
package com.dabbaexpress.meals;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MealRepository extends JpaRepository<Meal, Long> {
}
```

**File:** `MealRunner.java` in package `com.dabbaexpress.meals`

```java
package com.dabbaexpress.meals;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
public class MealRunner implements CommandLineRunner {

    private final MealRepository repository;

    public MealRunner(MealRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        System.out.println("Saved: " + repository.save(new Meal("Dal Rice", 80)));
        repository.saveAll(List.of(
                new Meal("Chicken Thali", 150),
                new Meal("Paneer Thali", 120),
                new Meal("Veg Pulao", 90)));
        System.out.println("Count: " + repository.count());

        System.out.println("Found: " + repository.findById(2L).orElseThrow());
        System.out.println("Exists 9? " + repository.existsById(9L));

        Meal paneer = repository.findById(3L).orElseThrow();
        paneer.setPrice(130);
        System.out.println("Updated: " + repository.save(paneer));

        System.out.println("Cheapest first:");
        repository.findAll(Sort.by("price"))
                .forEach(m -> System.out.println("- " + m.getName()));

        Page<Meal> page = repository.findAll(PageRequest.of(0, 2, Sort.by("price")));
        System.out.println("Page 1 of " + page.getTotalPages()
                + ", items: " + page.getContent().size());

        repository.deleteById(2L);
        System.out.println("After delete: " + repository.count());
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.application.name=meals
```

Run it with `mvn spring-boot:run`.

**Output:**

```text
Saved: 1 Dal Rice Rs80
Count: 4
Found: 2 Chicken Thali Rs150
Exists 9? false
Updated: 3 Paneer Thali Rs130
Cheapest first:
- Dal Rice
- Veg Pulao
- Paneer Thali
- Chicken Thali
Page 1 of 2, items: 2
After delete: 3
```

## Code Explained

- `MealRepository` has no methods and no class body, yet `save`, `findById` and the others work. Spring Data creates the class for you.
- `saveAll` stores a list of new meals in one call.
- `findById` returns an `Optional`, because the row may not exist. `orElseThrow()` gives the meal or throws an error.
- `existsById(9L)` answers `false`, because no meal has that id.
- Changing the price and calling `save` updates the row. The id is set, so Spring Data does an update and not an insert.
- `Sort.by("price")` sorts by the `price` field of the entity. Use the Java field name, not the column name.
- `PageRequest.of(0, 2, ...)` asks for the first page (pages start at zero) with two items. The `Page` object also knows the total number of pages.
- `deleteById` removes the row, and `count` shows one fewer.

## Main Methods at a Glance

| Method | What it does | Returns |
|---|---|---|
| `save(entity)` | Inserts or updates | The saved entity |
| `findById(id)` | Loads one row | `Optional<T>` |
| `findAll()` | Loads all rows | `List<T>` |
| `findAll(Sort)` | Loads all rows, sorted | `List<T>` |
| `findAll(Pageable)` | Loads one page | `Page<T>` |
| `deleteById(id)` | Removes one row | nothing |
| `count()` | Counts rows | `long` |

## Common Mistakes

> **Warning:** Never call `findAll()` on a table with millions of rows in a web request. It loads everything into memory. Use `findAll(Pageable)` to fetch a small page at a time.

- **Calling `get()` on the Optional without checking.** If the row is missing, it throws an exception. Use `orElseThrow` with a clear message or `ifPresent`.
- **Sorting by a column name.** `Sort.by("unit_price")` fails. Use the Java field name, such as `unitPrice`.
- **Wrong id type in the generics.** If the entity id is `Long`, write `JpaRepository<Meal, Long>`. A mismatch causes confusing errors.
- **Thinking `save` always inserts.** With an existing id it updates. That is handy, but it can overwrite data if you send an old copy of an object.

## Interview Questions

**What is the difference between `CrudRepository` and `JpaRepository`?**
`JpaRepository` extends the list-based CRUD and paging interfaces and adds JPA methods such as `flush` and `saveAndFlush`. It is the usual choice for JPA projects.

**How does Spring create the repository implementation?**
At startup it builds a proxy for your interface. Calls go to `SimpleJpaRepository`, which uses Hibernate to run them.

**What does `save()` do for an entity that already has an id?**
It updates the existing row. For an entity without an id, it inserts a new row.

## Key Points to Remember

- Extend `JpaRepository<Entity, IdType>` and Spring builds the implementation for you.
- Use `save`, `findById`, `findAll`, `deleteById` and `count` for everyday jobs.
- `findById` returns an `Optional`, so handle the empty case.
- Use `Sort` and `Pageable` to sort and page results, and avoid loading whole tables.
- The same `save` method inserts new rows and updates existing ones.

## Frequently Asked Questions

### Do I need to annotate a JpaRepository with @Repository?

No. Spring Data JPA detects interfaces that extend `JpaRepository` on its own, as long as they sit under your main application package.

### What is the difference between save and saveAndFlush in JpaRepository?

`save` may keep changes in memory until the end of the transaction. `saveAndFlush` sends the SQL to the database at once. Most code needs plain `save`.

### Can I add my own methods to a JpaRepository?

Yes. You can add derived query methods by naming them well, or write your own query with an annotation. Both are covered in the next topics.

### Does JpaRepository work with any database?

Yes, it works with any database that Hibernate supports, such as H2, MySQL and PostgreSQL. Your repository code does not change.

## Related Topics

- [Derived Query Methods](/learning/spring-boot-tutorial/derived-query-methods): add searches just by naming methods.
- [Query with JPQL and Native SQL](/learning/spring-boot-tutorial/query-with-jpql-and-native-sql): write your own queries when names are not enough.
- [Pagination and Sorting](/learning/spring-boot-tutorial/pagination-and-sorting): send pages of data through a REST API.
- [Transactional](/learning/spring-boot-tutorial/transactional): understand the transactions that wrap each call.
