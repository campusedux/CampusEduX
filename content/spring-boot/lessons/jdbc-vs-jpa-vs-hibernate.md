Imagine you run a bakery, and you need to send an order to the kitchen. You can walk in and shout every step yourself: take the flour, weigh it, mix it, bake for forty minutes. Or you can hand over a note that says "one chocolate cake, 1.5 kg" and let the kitchen worry about the steps. Talking to a database in Java works the same way. You can give it every instruction by hand, or you can hand over an object and let a tool write the instructions for you.

JDBC vs JPA vs Hibernate is a question every Java beginner asks, because the three names are easy to mix up. Let's sort them out one by one, and then use two of them side by side in one small bakery app.

## What are JDBC, JPA and Hibernate?

**JDBC** is the oldest and lowest layer. It is the standard Java way to talk to a relational database. You open a connection, write an SQL string, send it, and read the rows that come back.

> **Definition:** JDBC (Java Database Connectivity) is the standard Java API for sending SQL to a relational database and reading the results.

**JPA** is a set of rules for mapping Java objects to database tables. It is a specification, which means it is only a written contract. It contains no working code that saves anything. With JPA, you mark a class as an entity, and the tool turns `save(order)` into the right SQL.

> **Definition:** JPA (Jakarta Persistence API) is a specification that describes how Java objects are mapped to database tables and how they are stored, loaded and queried.

**Hibernate** is the worker that follows the JPA contract. It is a library that reads your annotations, writes the SQL and talks to the database through JDBC. In our bakery picture, JPA is the written menu, Hibernate is the kitchen that cooks from it, and JDBC is the pipe carrying the orders to the kitchen.

**Spring Data JPA** sits on top of all this. It gives you repository interfaces so that you write almost no code for common tasks. Spring Boot's data starter brings all four pieces together.

## Why is it used?

Plain JDBC is powerful, but it is also slow to write. For every table you repeat the same steps: open a connection, prepare a statement, set each parameter, loop over the rows, copy every column into an object, and close everything. A single forgotten `close()` leaks a connection.

JPA and Hibernate remove that repetition:

- You work with objects such as `CakeOrder`, not with rows and columns.
- Simple save, find and delete operations need no SQL at all.
- The same code can run on H2, MySQL or PostgreSQL, because Hibernate knows the SQL style of each one.
- Relations between tables become ordinary Java fields.

Still, hand-written SQL has a place. A large monthly sales report with many joins is often easier to write and tune as plain SQL. Good teams use both tools and pick the right one for each job.

> **Note:** In Spring Boot 4, `JdbcClient` is the friendly way to run SQL by hand. It comes with the JDBC starter, and the JPA starter includes it. It replaces most uses of the older `JdbcTemplate` for new code.

## How it works

Look at the layers between your code and the database.

```text
Your code (CakeOrderRepository)
        |
        v
Spring Data JPA
        |
        v
JPA rules (jakarta.persistence)
        |
        v
Hibernate writes the SQL
        |
        v
JDBC driver sends it
        |
        v
Database (H2, MySQL, ...)
```

Each layer only talks to the one below it. You call `save()`. Spring Data JPA passes the job to Hibernate. Hibernate builds an `insert` statement, and JDBC carries it to the database. The answer travels back up the same way, and Hibernate turns rows into objects.

Now compare what you write for one task, saving an order.

```text
JDBC way          JPA way
--------          -------
write SQL         call save()
set each ?        (Hibernate sets)
run update        (Hibernate runs)
map rows by hand  get objects back
you manage it     Spring does
```

With JDBC, every step is in your hands, which gives you full control and more typing. With JPA, you describe the object and Hibernate does the routine work. The price is that you must learn what Hibernate does behind the scenes, or it will surprise you later.

## Real-Life Example

Think about ordering food. When you cook at home, you choose every ingredient and control every step, and that is JDBC. When you order from a delivery app, you pick a dish and the app handles the kitchen, the rider and the payment. That is JPA with Hibernate. The app is faster for everyday dinners. But if you want a very special sauce, you go back to your own kitchen. That is why smart developers keep both options open.

## Code Example

Let's build a small app for a bakery called Bake & Co. It saves one order with JPA and one with JDBC, then reads all orders back both ways. It uses H2, a small database that lives in memory, so you need nothing installed.

```text
orders/
├─ pom.xml
└─ src/main/
   ├─ java/com/bakeco/orders/
   │  ├─ OrdersApplication.java
   │  ├─ CakeOrder.java
   │  ├─ CakeOrderRepository.java
   │  └─ OrderRunner.java
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

    <groupId>com.bakeco</groupId>
    <artifactId>orders</artifactId>
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

**File:** `OrdersApplication.java` in package `com.bakeco.orders`

```java
package com.bakeco.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }
}
```

**File:** `CakeOrder.java` in package `com.bakeco.orders`

```java
package com.bakeco.orders;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class CakeOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String flavour;
    private double weightKg;

    protected CakeOrder() {
    }

    public CakeOrder(String flavour, double weightKg) {
        this.flavour = flavour;
        this.weightKg = weightKg;
    }

    public Long getId() {
        return id;
    }

    public String getFlavour() {
        return flavour;
    }

    public double getWeightKg() {
        return weightKg;
    }

    @Override
    public String toString() {
        return "CakeOrder[" + id + ", " + flavour + ", " + weightKg + " kg]";
    }
}
```

**File:** `CakeOrderRepository.java` in package `com.bakeco.orders`

```java
package com.bakeco.orders;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CakeOrderRepository extends JpaRepository<CakeOrder, Long> {
}
```

**File:** `OrderRunner.java` in package `com.bakeco.orders`

```java
package com.bakeco.orders;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
public class OrderRunner implements CommandLineRunner {

    private final JdbcClient jdbc;
    private final CakeOrderRepository repository;

    public OrderRunner(JdbcClient jdbc, CakeOrderRepository repository) {
        this.jdbc = jdbc;
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        System.out.println("-- JPA: save an object --");
        repository.save(new CakeOrder("Chocolate", 1.5));

        System.out.println("-- JDBC: your own SQL --");
        jdbc.sql("insert into cake_order (flavour, weight_kg) values (?, ?)")
                .params("Pineapple", 1.0)
                .update();

        System.out.println("-- JDBC: read rows --");
        jdbc.sql("select id, flavour, weight_kg from cake_order")
                .query((rs, rowNum) -> new CakeOrder(rs.getString("flavour"), rs.getDouble("weight_kg")))
                .list()
                .forEach(o -> System.out.println(o.getFlavour() + " " + o.getWeightKg()));

        System.out.println("-- JPA: read objects --");
        repository.findAll().forEach(System.out::println);
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.application.name=orders
spring.jpa.show-sql=true
logging.level.root=WARN
```

Run it with `mvn spring-boot:run`. The app fills the table, prints the lines below, and stops.

**Output:**

```text
-- JPA: save an object --
-- JDBC: your own SQL --
-- JDBC: read rows --
Chocolate 1.5
Pineapple 1.0
-- JPA: read objects --
CakeOrder[1, Chocolate, 1.5 kg]
CakeOrder[2, Pineapple, 1.0 kg]
```

Because `show-sql` is on, Hibernate also prints the SQL it wrote. These lines are taken from the same run and are mixed in among the lines above on your screen.

```sql
Hibernate: create table cake_order (weight_kg float(53) not null, id bigint generated by default as identity, flavour varchar(255), primary key (id))
Hibernate: insert into cake_order (flavour,weight_kg,id) values (?,?,default)
Hibernate: select co1_0.id,co1_0.flavour,co1_0.weight_kg from cake_order co1_0
```

Notice that Hibernate even created the table. You never wrote a `create table` statement.

## Code Explained

- `@Entity` tells Hibernate that `CakeOrder` maps to a table. The table is named `cake_order`, and the field `weightKg` becomes the column `weight_kg`.
- `@Id` and `@GeneratedValue` mark the primary key and let the database create its value.
- The protected empty constructor is needed by Hibernate, which builds objects itself when it reads rows.
- `CakeOrderRepository` has no body. Spring Data JPA builds the class at startup, with `save`, `findAll` and more.
- `JdbcClient` runs plain SQL. You write the `insert`, pass the values in `params`, and copy each column by hand in the row mapper. That is the JDBC style.
- The `insert` through JDBC worked because Hibernate had already created the table before the runner started.

## JDBC vs JPA vs Hibernate at a Glance

| Point | JDBC | JPA | Hibernate |
|---|---|---|---|
| What it is | API for SQL | Specification (rules) | Library that follows JPA |
| You write | SQL and row mapping | Entities and annotations | Same as JPA |
| Best for | Reports, bulk SQL | Everyday save and find | Runs your JPA code |
| Effort | High | Low | Low |

## Common Mistakes

> **Warning:** JPA is only a set of rules. If you add no provider such as Hibernate, nothing can run. In Spring Boot the data starter brings Hibernate for you, so you seldom notice.

- **Saying "JPA and Hibernate are the same".** JPA is the contract. Hibernate is one worker that follows it. EclipseLink is another.
- **Forgetting the empty constructor.** Hibernate needs a no-argument constructor to create entity objects. It may be protected.
- **Trusting `ddl-auto` in production.** Letting Hibernate build tables is handy on H2. On a real database, use proper migration scripts.

## Interview Questions

**What is the difference between JDBC and JPA?**
JDBC sends SQL you write and returns rows. JPA maps objects to tables, so the provider writes most SQL for you.

**Is Hibernate the same as JPA?**
No. JPA is a specification. Hibernate is the most popular implementation, and Spring Boot uses it by default.

**Where does Spring Data JPA fit?**
It sits on top of JPA and Hibernate. It builds repository classes from interfaces, so you write far less code.

## Key Points to Remember

- JDBC is the low-level API that sends SQL to a database.
- JPA is a specification for mapping objects to tables. It holds rules, not working code.
- Hibernate is the JPA provider Spring Boot uses. It writes SQL and runs it through JDBC.
- Spring Data JPA gives you repositories, so common tasks need no code.
- You can mix `JdbcClient` and JPA in one app when a report needs hand-written SQL.

## Frequently Asked Questions

### Do I still need to learn SQL if I use JPA?

Yes. Hibernate writes SQL for you, but you must read it to find slow queries and wrong results. Reports and joins often need SQL you write yourself.

### Can I use JDBC and JPA in the same project?

Yes. Both share the same connection pool. Just remember that data saved through JDBC is invisible to Hibernate's cache until it reads the rows again.

### Is Hibernate the only JPA provider?

No, EclipseLink and OpenJPA also exist. Spring Boot picks Hibernate by default, and almost every Spring project uses it.

### Which is faster in the JDBC vs JPA vs Hibernate choice?

Raw JDBC has less overhead for a single simple query. For normal apps the difference is small, and JPA saves so much development time that it is the usual choice.

## Related Topics

- [Connecting Spring Boot to MySQL](/learning/spring-boot-tutorial/connecting-spring-boot-to-mysql): point the same app at a real MySQL server.
- [H2 In-Memory Database](/learning/spring-boot-tutorial/h2-in-memory-database): learn more about the tiny database used here.
- [JPA Entity](/learning/spring-boot-tutorial/jpa-entity): see every annotation that maps a class to a table.
- [JpaRepository](/learning/spring-boot-tutorial/jparepository): use the repository interface fully.
