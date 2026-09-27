A shopkeeper removes a shirt from the catalogue because it is out of stock. Two weeks later a customer complains, "I ordered that shirt, where is my order?" The order points to a product that no longer exists. If the row was really deleted, the record is gone forever, and so is the proof.

Soft delete solves this. Instead of erasing a row, you mark it as deleted and hide it. Let's see how soft delete works in Spring Boot with JPA, and how to build it with two Hibernate annotations.

## What is soft delete?

Think of a school library that never throws away a returned register. When a book is lost, the librarian does not tear out its page. She writes "WITHDRAWN" across it in red. The page still exists, so old records stay readable, but nobody issues that book any more.

> **Definition:** Soft delete means marking a row as deleted, usually with a boolean column or a timestamp, instead of removing it from the table. Normal queries then skip the marked rows. Removing the row for good is called a hard delete.

| Type | SQL used | Row afterwards | Can restore? |
|---|---|---|---|
| Hard delete | `delete from product` | Gone | No, only from a backup |
| Soft delete | `update product set deleted = true` | Stays, hidden | Yes |

## Why is it used?

- **Undo.** A customer removes something by mistake, and support can bring it back.
- **History.** Old orders and invoices still point to real rows.
- **Audit and law.** Some businesses must keep records for years.
- **Safer foreign keys.** Other tables that refer to the row do not break.

There is a cost. The table grows, every query must remember to hide the deleted rows, and unique columns can clash with hidden rows. Use soft delete for business data that matters, and hard delete for temporary data such as expired login tokens.

## How it works

You need two things: a column that says "deleted", and a rule that turns `delete` into an `update` and filters the rows on every read. Hibernate can do both for you.

```text
repo.delete(product)
    |
    v
@SQLDelete replaces the SQL
    |
    v
update product
set deleted = true
where id = ?
    |
    v
Row stays in the table
```

When you call `delete`, Hibernate runs your update statement instead of a `DELETE`. The row remains, with its flag set to true.

```text
repo.findAll()
    |
    v
@SQLRestriction adds a filter
    |
    v
select ... from product
where deleted = false
    |
    v
Only live rows come back
```

For every read, Hibernate adds `deleted = false` to the query. The hidden rows do not appear in `findAll()`, `findById()` or the queries you write in the repository.

Newer Hibernate versions also have a single annotation, `@SoftDelete`, that does both jobs and manages the column for you. You will meet it in the practice problem. The two-annotation form used here shows you exactly what happens, which makes it a good way to learn.

## Real-Life Example

A clothing shop keeps a paper catalogue in a binder. When a saree design is discontinued, the owner puts a red "DISCONTINUED" sticker on the page instead of cutting it out. Customers who browse the binder skip the red pages. Old bills can still say "see page 12" and the page is there. If the design returns next season, the owner peels off the sticker. Deleting the sticker is a restore.

## Code Example

Let's build the catalogue of ThreadHouse, a small clothing shop. We delete one product, show that normal queries no longer see it, prove with plain SQL that the row is still there, and then restore it.

```text
threadhouse/
├─ pom.xml
└─ src/main/
   ├─ java/com/threadhouse/shop/
   │  ├─ CatalogueApplication.java
   │  ├─ Product.java
   │  └─ ProductRepository.java
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

    <groupId>com.threadhouse</groupId>
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

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `Product.java` in package `com.threadhouse.shop`

```java
package com.threadhouse.shop;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@SQLDelete(sql = "update product set deleted = true where id = ?")
@SQLRestriction("deleted = false")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private boolean deleted = false;

    protected Product() {
    }

    public Product(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
```

**File:** `ProductRepository.java` in package `com.threadhouse.shop`

```java
package com.threadhouse.shop;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}
```

**File:** `CatalogueApplication.java` in package `com.threadhouse.shop`

```java
package com.threadhouse.shop;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class CatalogueApplication {

    public static void main(String[] args) {
        SpringApplication.run(CatalogueApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(ProductRepository products, JdbcTemplate jdbc) {
        return args -> {
            Product shirt = products.save(new Product("Linen Shirt"));
            products.save(new Product("Cotton Kurta"));
            products.save(new Product("Denim Jacket"));

            products.delete(shirt);
            System.out.println("After delete:");
            System.out.println("  visible: " + products.findAll().size());
            System.out.println("  findById: " + products.findById(shirt.getId()));
            System.out.println("  rows in table: " + count(jdbc, "1 = 1"));
            System.out.println("  marked deleted: " + count(jdbc, "deleted = true"));

            jdbc.update("update product set deleted = false where id = ?", shirt.getId());
            System.out.println("After restore:");
            System.out.println("  visible: " + products.findAll().size());
        };
    }

    private static Integer count(JdbcTemplate jdbc, String condition) {
        return jdbc.queryForObject("select count(*) from product where " + condition,
                Integer.class);
    }
}
```

Run it:

```bash
mvn spring-boot:run
```

**Output:**

```text
After delete:
  visible: 2
  findById: Optional.empty
  rows in table: 3
  marked deleted: 1
After restore:
  visible: 3
```

Look at the three counts. After the delete, the app sees two products (the count on the `visible` line), yet the table still has three rows, and one of them is marked deleted. The restore is one plain SQL update, and the shirt returns.

## Code Explained

- `@SQLDelete` swaps the `delete` statement for the `update` you write. The `?` receives the id.
- `@SQLRestriction("deleted = false")` adds that condition to every query Hibernate builds for this entity.
- `private boolean deleted = false;` is the flag column. New rows start visible.
- `products.delete(shirt)` looks like a normal delete. The change is hidden inside the entity, so services and controllers need no changes.
- `JdbcTemplate` talks to the table directly, so it is not filtered. It shows the truth about what is stored.
- The restore uses plain SQL, because the entity filter hides deleted rows from JPA. Real apps put this in an admin-only method.

> **Tip:** Store a `deletedAt` timestamp instead of a boolean if you also need to know when the row was hidden. A null value then means "alive".

## Common Mistakes

> **Warning:** Native SQL and `JdbcTemplate` queries do not get the `@SQLRestriction` filter. If you write your own SQL, add `deleted = false` yourself, or deleted rows will leak into reports.

- **Forgetting the restriction.** With only `@SQLDelete`, the row is marked, but it still shows in `findAll()`.
- **Unique columns.** A deleted product named "Linen Shirt" still holds that name. Creating a new "Linen Shirt" may violate a unique constraint. Include the flag in the unique rule, or free the name on delete.
- **Cascades.** Deleting a parent does not soft delete its children unless they have the same setup. Plan each entity.
- **Never cleaning up.** Deleted rows pile up. Decide on a schedule to purge very old ones for good.
- **Leaking private data.** People often expect "delete" to mean gone. For privacy requests, a hard delete or anonymising may still be required.

## Interview Questions

**What is soft delete?**
It marks a row as deleted, using a flag or a timestamp, instead of removing it. Normal queries filter those rows out.

**How do you implement it in Hibernate?**
Add a `deleted` column, use `@SQLDelete` to turn delete into an update, and use `@SQLRestriction` to hide the deleted rows from reads. Newer Hibernate also offers `@SoftDelete`.

**What are the downsides?**
The table grows, queries need the filter, unique constraints can clash and native SQL bypasses the filter.

**When should you use a hard delete instead?**
For temporary or sensitive data, such as expired tokens, or when a law requires the data to be erased.

## Key Points to Remember

- Soft delete hides a row instead of removing it, so it can be restored and history stays intact.
- `@SQLDelete` changes what `delete` does. `@SQLRestriction` hides deleted rows on reads.
- Native queries and `JdbcTemplate` are not filtered.
- Watch unique constraints and cascades.
- Plan how to purge old deleted rows.

## Frequently Asked Questions

### What is soft delete in Spring Boot?

It is a pattern where `delete` marks a row as deleted, with a boolean or timestamp column, rather than removing it. In Spring Boot with JPA you usually build it with Hibernate's `@SQLDelete` and `@SQLRestriction`.

### How do I restore a soft-deleted row?

Update the flag back to false. Because JPA hides deleted rows, use a native update query or plain SQL for this, ideally in an admin-only method.

### Does `findById` return a soft-deleted row?

Not with `@SQLRestriction`. The filter applies to it as well, so you get an empty `Optional`.

### Should I use a boolean or a timestamp for soft delete?

A timestamp, such as `deletedAt`, carries more information because it tells you when the row was hidden. A boolean is simpler and enough for many projects.

## Related Topics

- [JpaRepository](/learning/spring-boot-tutorial/jparepository): the repository whose delete method we changed.
- [Auditing with @CreatedDate](/learning/spring-boot-tutorial/auditing-with-created-date): record who and when along with deletions.
- [Database Migration with Flyway](/learning/spring-boot-tutorial/database-migration-with-flyway): add the deleted column safely.
- [@Transactional](/learning/spring-boot-tutorial/transactional): keep delete and related changes together.
