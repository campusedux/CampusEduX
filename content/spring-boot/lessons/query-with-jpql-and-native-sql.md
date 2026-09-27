Think of a shop owner who wants to know one thing: "Which products cost more than 3000 and are running low?" The stock register has no such page. She must ask her assistant to look through the books and write down the answer. Derived query methods can answer simple questions, but sooner or later you meet a question that needs more. For those, you write the query yourself with `@Query`.

A query with JPQL and native SQL is how Spring Data JPA lets you do that. You use `@Query`, and you get two kinds: JPQL, which speaks in Java classes, and native SQL, which speaks in tables. In this topic you will learn both, when to choose each, and how to pass values safely.

## What is a query with JPQL and native SQL?

**JPQL** (Jakarta Persistence Query Language) looks like SQL, but you use your entity class names and field names instead of table and column names. It is independent of the database, and Hibernate translates it.

**Native SQL** is the plain SQL of your database. You use real table and column names, and you can use any feature your database offers.

> **Definition:** JPQL is an object-oriented query language that works on entities and their fields. Native SQL is the database's own SQL, written against tables and columns. Both are attached to a repository method with `@Query`.

Here is the same idea written both ways.

```java
@Query("select p from Product p where p.price > :min")
List<Product> expensiveThan(@Param("min") int min);

@Query(value = "select * from product where stock < :limit", nativeQuery = true)
List<Product> lowStock(@Param("limit") int limit);
```

The first query names the class `Product` and the field `price`. The second names the table `product` and the column `stock`, and it needs `nativeQuery = true`. Both use a named parameter, written with a colon.

## Why are they used?

Derived method names have limits. Long names are unreadable, and they cannot express joins with conditions, grouping, sums or database functions. With `@Query` you write exactly the search you need in a form everyone can read.

Choose JPQL for most queries, because it survives a change of database and Hibernate checks it at startup. Choose native SQL when you need something only your database offers, such as a special function, a window calculation or a tuned report. Native SQL is powerful, but it ties your code to one database.

> **Warning:** Never build a query by joining user text into a string. That opens the door to SQL injection. Always pass values as named parameters, as shown above. Spring sends them to the database separately from the query text.

## How it works

Both kinds of query travel the same path, with one small difference.

```text
Repository method with @Query
        |
        v
JPQL?  -> Hibernate translates
        |    it to database SQL
Native? -> sent as written
        |
        v
Database runs it
        |
        v
Rows become entities or values
```

At startup, Spring reads each `@Query`. A JPQL query is parsed and checked, so a wrong field name stops the app early. A native query is passed on as it is, so a mistake in it shows up only when you run it.

Now see how a value gets into the query safely.

```text
Call: expensiveThan(3000)
        |
        v
Query text: ... where price > :min
        |
        v
Value 3000 bound to :min
        |
        v
Database receives text and
value separately (safe)
```

The query text and the value travel apart. The database never mixes them, so a strange value cannot change the meaning of the query.

## Real-Life Example

Imagine a library with two ways to ask for help. At the front desk, you can say "show me all books by authors from Kerala that were borrowed twice this month", and the librarian understands the meaning and finds them, using her own system. That is JPQL: you ask in the language of your objects, and someone else knows how to search. But if you walk into the back office and use the shelf codes and the raw register yourself, you can do special things nobody offers at the desk. That is native SQL: more power, but you must know the building.

## Code Example

Let's build a small store app for Gadget Mart. It has a `Product` entity and a repository with four queries: two JPQL ones (one returns a record, one updates stock) and two native ones.

```text
gadgets/
├─ pom.xml
└─ src/main/
  ├─ resources/
  │ └─ application.properties
  └─ java/com/gadgetmart/shop/
    ├─ ShopApplication.java
    ├─ Product.java
    ├─ CategoryStock.java
    ├─ ProductRepository.java
    └─ QueryRunner.java
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

    <groupId>com.gadgetmart</groupId>
    <artifactId>shop</artifactId>
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

**File:** `ShopApplication.java` in package `com.gadgetmart.shop`

```java
package com.gadgetmart.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}
```

**File:** `Product.java` in package `com.gadgetmart.shop`

```java
package com.gadgetmart.shop;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String category;
    private int price;
    private int stock;

    protected Product() {
    }

    public Product(String name, String category, int price, int stock) {
        this.name = name;
        this.category = category;
        this.price = price;
        this.stock = stock;
    }

    public String getName() {
        return name;
    }
}
```

**File:** `CategoryStock.java` in package `com.gadgetmart.shop`

```java
package com.gadgetmart.shop;

public record CategoryStock(String category, long units) {
}
```

**File:** `ProductRepository.java` in package `com.gadgetmart.shop`

```java
package com.gadgetmart.shop;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("select p from Product p where p.price > :min order by p.price")
    List<Product> expensiveThan(@Param("min") int min);

    @Query("select new com.gadgetmart.shop.CategoryStock(p.category, sum(p.stock)) "
            + "from Product p group by p.category order by p.category")
    List<CategoryStock> stockPerCategory();

    @Modifying
    @Transactional
    @Query("update Product p set p.stock = p.stock + :extra where p.category = :category")
    int addStock(@Param("category") String category, @Param("extra") int extra);

    @Query(value = "select * from product where stock < :limit order by name",
            nativeQuery = true)
    List<Product> lowStock(@Param("limit") int limit);

    @Query(value = "select name from product "
            + "where lower(name) like lower(concat('%', :text, '%'))",
            nativeQuery = true)
    List<String> searchNames(@Param("text") String text);
}
```

**File:** `QueryRunner.java` in package `com.gadgetmart.shop`

```java
package com.gadgetmart.shop;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class QueryRunner implements CommandLineRunner {

    private final ProductRepository repository;

    public QueryRunner(ProductRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.saveAll(List.of(
                new Product("Laptop", "Computers", 55000, 5),
                new Product("Mouse", "Accessories", 500, 40),
                new Product("Keyboard", "Accessories", 1500, 3),
                new Product("Monitor", "Computers", 12000, 8),
                new Product("Headphones", "Audio", 2500, 2),
                new Product("Speaker", "Audio", 3500, 15)));

        System.out.println("Price above 3000:");
        repository.expensiveThan(3000).forEach(p -> System.out.println("  " + p.getName()));

        System.out.println("Units per category:");
        repository.stockPerCategory().forEach(c ->
                System.out.println("  " + c.category() + " " + c.units()));

        System.out.println("Stock below 5:");
        repository.lowStock(5).forEach(p -> System.out.println("  " + p.getName()));

        System.out.println("Name has 'PHONE': " + repository.searchNames("PHONE"));

        System.out.println("Rows updated: " + repository.addStock("Audio", 10));
        System.out.println("Stock below 5 now:");
        repository.lowStock(5).forEach(p -> System.out.println("  " + p.getName()));
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.application.name=gadgets
```

Run it with `mvn spring-boot:run`.

**Output:**

```text
Price above 3000:
  Speaker
  Monitor
  Laptop
Units per category:
  Accessories 43
  Audio 17
  Computers 13
Stock below 5:
  Headphones
  Keyboard
Name has 'PHONE': [Headphones]
Rows updated: 2
Stock below 5 now:
  Keyboard
```

## Code Explained

- `expensiveThan` is JPQL. It says `Product p` (the class) and `p.price` (the field). The `:min` parameter is filled from the method argument marked `@Param("min")`.
- `stockPerCategory` uses a constructor expression, `select new ...CategoryStock(...)`. JPQL builds a record for each group, so you get typed results and not raw arrays. The full class name is required inside the query.
- `addStock` is an update. It needs `@Modifying`, and it needs a transaction, so `@Transactional` sits on the method. It returns the number of rows changed.
- `lowStock` is native SQL, so it says `from product` and `stock`, the table and the column, and `nativeQuery = true` is set.
- `searchNames` is also native. It uses `lower` and `concat`, and it returns plain `String` values, not entities.
- After `addStock`, the two Audio products have more stock. That is why only the keyboard remains in the last list.

## JPQL and Native SQL Compared

| Point | JPQL | Native SQL |
|---|---|---|
| Names used | Entity classes and fields | Tables and columns |
| Database independent | Yes | No |
| Checked at startup | Yes | No |
| Best for | Most queries | Database-specific features |
| Flag needed | None | `nativeQuery = true` |

## Common Mistakes

> **Warning:** Do not put table names in JPQL. `select * from product` fails in JPQL, because JPQL knows entities, not tables. Write `select p from Product p`.

- **Forgetting `@Modifying` on an update or delete.** Spring then expects a result set, and the call fails.
- **Forgetting the transaction.** An update query needs a transaction. Put `@Transactional` on the method or on the calling service.
- **Mixing up names.** In JPQL use field names such as `dailyRate`. In native SQL use column names such as `daily_rate`.
- **Using string concatenation for values.** It invites SQL injection. Use `:name` parameters.
- **Stale objects after a bulk update.** A bulk update changes the database but not entities already loaded. Reload them, or set `clearAutomatically = true` on `@Modifying`.

## Interview Questions

**What is the difference between JPQL and native SQL?**
JPQL queries entities and fields and is translated by Hibernate. Native SQL is written for the database, with tables and columns.

**Why do update queries need `@Modifying`?**
It tells Spring Data that the query changes data and returns a row count, not a list of results.

**How do you avoid SQL injection in `@Query`?**
Pass values as named or positional parameters. Never join user text into the query string.

## Key Points to Remember

- `@Query` lets you write your own query on a repository method.
- JPQL uses entity and field names. Native SQL uses table and column names and needs `nativeQuery = true`.
- Use named parameters with `@Param`, for safety and clarity.
- Update and delete queries need `@Modifying` and a transaction.
- Prefer JPQL, and use native SQL only for features that JPQL lacks.

## Frequently Asked Questions

### What is the difference between JPQL and native SQL in Spring Data JPA?

JPQL is checked by Hibernate and is portable between databases. Native SQL goes straight to the database, so it can use any feature but ties you to that database.

### Can I return a custom result from a query with JPQL or native SQL?

Yes. In JPQL use a constructor expression that builds a record, as in the example. You can also use interface projections, or return single values such as `String`.

### Do I always need `@Param`?

You need it when the query uses named parameters, so Spring knows which argument goes to which name. With positional parameters like `?1`, you can skip it.

### Should I write queries in the repository or the service?

Keep them in the repository. It is the home of data access, and services stay clean and easy to test.

## Related Topics

- [Derived Query Methods](/learning/spring-boot-tutorial/derived-query-methods): the simple way to search, by naming methods.
- [JpaRepository](/learning/spring-boot-tutorial/jparepository): the base methods your repository already has.
- [Transactional](/learning/spring-boot-tutorial/transactional): why update queries need a transaction.
- [Pagination and Sorting](/learning/spring-boot-tutorial/pagination-and-sorting): return query results page by page.
