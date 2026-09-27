A town library keeps a big register of books: who wrote them, which shelf they sit on, and whether they are out on loan. When the library grows to five branches, a simple file on one computer is not enough. The branches need one shared register that is always correct, even when many librarians update it at the same moment. PostgreSQL is a database that does this job very well.

Connecting Spring Boot to PostgreSQL is easy. It takes one dependency and a few settings, and the rest of your code stays the same as with any other database.

## What is a PostgreSQL connection in Spring Boot?

PostgreSQL, often called Postgres, is a free, open-source relational database server. Like MySQL, it runs as its own program and keeps data on disk. It listens on port 5432 by default. It is known for following the SQL standard closely and for handling complex queries, large data and strict rules about correct data.

> **Definition:** A PostgreSQL connection is a JDBC connection to a Postgres server. Spring Boot opens it with the PostgreSQL JDBC driver, using a URL that starts with `jdbc:postgresql:`, plus a user name and a password.

Your app needs three things, the same as for any server database:

- The **PostgreSQL JDBC driver**, a library named `postgresql` in the group `org.postgresql`.
- A **JDBC URL**. It starts with `jdbc:postgresql:` and names the host, the port and the database.
- A **user and password** with rights on that database.

Spring Boot then builds the connection pool and the Hibernate setup on its own.

## Why connect Spring Boot to PostgreSQL?

Many teams choose PostgreSQL for new projects. It has a strong record for keeping data correct, it supports advanced types such as JSON, arrays and full-text search, and it is free with no licence trouble. Cloud providers offer it as a managed service, so you do not need to look after the server yourself.

For a Spring Boot learner there is a second reason. Switching between databases is easy. If you know how to connect to MySQL or H2, you already know 90 percent of the PostgreSQL steps. You change the driver dependency and the URL, and Hibernate adjusts the SQL it writes.

> **Note:** Spring Boot chooses the Hibernate dialect from the URL, so `jdbc:postgresql:` is enough. You do not set a dialect property.

## How it works

The path from your code to the data goes through a few steady steps.

```text
Your code: repository.save()
        |
        v
Hibernate writes PostgreSQL SQL
        |
        v
HikariCP gives a free connection
        |
        v
PostgreSQL driver sends the SQL
        |
        v
PostgreSQL server, port 5432
        |
        v
Database "library"
```

You call `save()`. Hibernate knows it is talking to PostgreSQL, so it writes SQL in the Postgres style. HikariCP hands over a connection from its pool, the driver sends the statement over the network, and the server stores the row.

Startup has its own order.

```text
Read application.properties
        |
        v
Create the pool, open a link
        |
        v
Hibernate checks the tables
        |
        v
ddl-auto adds what is missing
        |
        v
App is ready
```

Spring Boot reads your URL and login, and the pool opens its first connection. If the server is not reachable, the app stops right here with an error, which is a good thing. Then Hibernate looks at the tables and, because of `ddl-auto`, adds any table or column that is missing.

## Real-Life Example

Think about a railway ticket counter across a big city. Every station has a booking window, but all windows read and write one common seat chart in the central office. When one window sells seat 12A, every other window sees it as sold at once. The central chart is PostgreSQL. The windows are your app instances, and the phone line between them is the connection. The office also has strict rules: a seat cannot be sold twice. That is the kind of data safety Postgres is loved for.

## Code Example

Let's build a catalogue app for CityLibrary. It saves two books in a PostgreSQL database named `library` and prints them. First create the user and database. Run this in `psql` as the admin user, with your own password.

```sql
CREATE USER library_app WITH PASSWORD '<your-password>';
CREATE DATABASE library OWNER library_app;
```

If you have Docker, you can start a throwaway server instead:

```bash
docker run --name pg-library -p 5432:5432 \
  -e POSTGRES_USER=library_app \
  -e POSTGRES_PASSWORD=<your-password> \
  -e POSTGRES_DB=library -d postgres:17
```

```text
catalogue/
├─ pom.xml
└─ src/main/
  ├─ resources/
  │ └─ application.properties
  └─ java/com/citylibrary/...
    ├─ CatalogueApplication.java
    ├─ LibraryBook.java
    ├─ LibraryBookRepository.java
    └─ CatalogueRunner.java
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

    <groupId>com.citylibrary</groupId>
    <artifactId>catalogue</artifactId>
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
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
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

**File:** `CatalogueApplication.java` in package `com.citylibrary.catalogue`

```java
package com.citylibrary.catalogue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CatalogueApplication {

    public static void main(String[] args) {
        SpringApplication.run(CatalogueApplication.class, args);
    }
}
```

**File:** `LibraryBook.java` in package `com.citylibrary.catalogue`

```java
package com.citylibrary.catalogue;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class LibraryBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String author;
    private boolean available;

    protected LibraryBook() {
    }

    public LibraryBook(String title, String author, boolean available) {
        this.title = title;
        this.author = author;
        this.available = available;
    }

    @Override
    public String toString() {
        return id + ": " + title + (available ? "" : " (on loan)");
    }
}
```

**File:** `LibraryBookRepository.java` in package `com.citylibrary.catalogue`

```java
package com.citylibrary.catalogue;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LibraryBookRepository extends JpaRepository<LibraryBook, Long> {
}
```

**File:** `CatalogueRunner.java` in package `com.citylibrary.catalogue`

```java
package com.citylibrary.catalogue;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CatalogueRunner implements CommandLineRunner {

    private final LibraryBookRepository repository;

    public CatalogueRunner(LibraryBookRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.save(new LibraryBook("The Tea Garden", "Anita Rao", true));
        repository.save(new LibraryBook("Coastal Winds", "Dev Menon", false));
        repository.findAll().forEach(System.out::println);
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.application.name=catalogue
spring.datasource.url=jdbc:postgresql://localhost:5432/library
spring.datasource.username=${DB_USER:library_app}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

Set the password variable in your terminal, then run the app:

```bash
export DB_PASSWORD='<your-password>'
mvn spring-boot:run
```

**Output:**

```text
1: The Tea Garden
2: Coastal Winds (on loan)
```

This output comes from a real run against a local PostgreSQL 17 server. That test server listened on another port, so the URL was overridden with the environment variable `SPRING_DATASOURCE_URL`. Spring Boot lets any property be replaced this way, without touching the file. Hibernate also printed the table it created:

```sql
create table library_book (id bigint generated by default as identity, author varchar(255), available boolean not null, title varchar(255), primary key (id))
```

Checking the table from `psql` shows the same two rows that the app printed:

```text
 id |     title      |  author
----+----------------+-----------
  1 | The Tea Garden | Anita Rao
  2 | Coastal Winds  | Dev Menon
(2 rows)
```

## Code Explained

- The `postgresql` driver has runtime scope, and no version is written, because the Spring Boot parent manages it.
- The URL starts with `jdbc:postgresql:` and then names the host, the port and the database. The default port is 5432.
- `${DB_PASSWORD}` reads the password from the environment, so it never sits in your source code or Git history.
- `ddl-auto=update` creates the `library_book` table on the first run and keeps data on later runs.
- `GenerationType.IDENTITY` becomes a Postgres identity column, shown in the SQL as `generated by default as identity`.
- The entity and repository are plain JPA. Nothing in them says PostgreSQL, so the same classes work on H2 or MySQL.

## Connecting Spring Boot to PostgreSQL vs MySQL at a Glance

| Point | PostgreSQL | MySQL |
|---|---|---|
| Driver artifact | `org.postgresql:postgresql` | `com.mysql:mysql-connector-j` |
| URL prefix | `jdbc:postgresql:` | `jdbc:mysql:` |
| Default port | 5432 | 3306 |
| Strong points | Standards, JSON, complex queries | Simple setup, wide hosting |

## Common Mistakes

> **Warning:** Do not put the real password in `application.properties` and commit it. Read it from an environment variable, and keep it out of Git.

- **Wrong port or server down.** The error "Connection refused" means nothing is listening at that address. Check that Postgres runs and that the port matches.
- **Password authentication failed.** The user or password differs from what Postgres has. Fix `DB_PASSWORD`, or reset the password in `psql`.
- **Database does not exist.** Postgres does not create the database for you. Run `CREATE DATABASE` first.
- **Permission denied for schema public.** Newer PostgreSQL versions do not let every user create tables in the public schema. Make your user the owner of the database, as the setup above does.
- **Keeping both `h2` and `postgresql` without a plan.** With two drivers and no URL, Spring Boot can pick the wrong one. Always write the URL.

## Interview Questions

**How do you connect Spring Boot to PostgreSQL?**
Add the `postgresql` driver with runtime scope and a starter such as data JPA, then set the datasource URL, username and password in `application.properties`.

**What is the default PostgreSQL port and URL format?**
Port 5432. The URL starts with `jdbc:postgresql:` and ends with the host, the port and the database name.

**Do I change my entities when I move from H2 to PostgreSQL?**
Usually not. Entities use JPA annotations that work on every database. Only the driver and the connection settings change.

## Key Points to Remember

- PostgreSQL is a separate server on port 5432. Your app connects to it through the JDBC driver.
- The driver artifact is `postgresql`, and the version is managed by Spring Boot.
- The URL starts with `jdbc:postgresql:` and names the host, the port and the database.
- Keep the password in an environment variable, not in a file you commit.
- Any property can be overridden from outside, for example with `SPRING_DATASOURCE_URL`.

## Frequently Asked Questions

### Which is better for Spring Boot, MySQL or PostgreSQL?

Both work well. PostgreSQL is stronger on standards and advanced features, while MySQL is very common on shared hosting. Pick the one your team or hosting already uses.

### Do I need a dialect property when connecting Spring Boot to PostgreSQL?

No. Spring Boot and Hibernate detect PostgreSQL from the connection. Set a dialect only in rare cases where detection fails.

### Can I use Supabase or another cloud Postgres?

Yes. A managed service gives you a host, port, database name and login. You put them in the same three datasource properties, often with SSL turned on in the URL.

### Should I use `ddl-auto=update` in production?

No. It is handy while learning. In production, use migration scripts so every change to the tables is planned, reviewed and repeatable.

## Related Topics

- [Connecting Spring Boot to MySQL](/learning/spring-boot-tutorial/connecting-spring-boot-to-mysql): the same steps with a different driver.
- [H2 In-Memory Database](/learning/spring-boot-tutorial/h2-in-memory-database): practise with no server at all.
- [Database Migration with Flyway](/learning/spring-boot-tutorial/database-migration-with-flyway): manage table changes safely in production.
- [Externalized Configuration](/learning/spring-boot-tutorial/externalized-configuration): learn every way to override a property.
