A library has a shelf of books and a list of writers. Look closely and you will see a puzzle. One writer can write many books. One book can have many writers. Neither side "owns" the other. If you tried to store this in one table, you would end up copying names again and again, or squeezing lists into a single cell. There is a cleaner way, and JPA gives it to you with one annotation.

Let's learn how many-to-many mapping works, why it needs a third table behind the scenes, and how to write it without falling into the usual traps.

## What is many-to-many mapping?

Think about a wedding invitation list. Every guest can be invited to many events, and every event has many guests. The caterer does not write guests inside the event, and does not write events inside the guest. They keep a separate sheet with two columns: guest and event. Each row says, "this guest comes to that event."

> **Definition:** A many-to-many mapping links two entities so that each row on one side can be related to many rows on the other side, and the other way round. In a relational database it is stored in a third table called a join table.

In JPA you write it with `@ManyToMany`. The join table is not a Java class you write. Hibernate creates and fills it for you.

## Why is it used?

Real data is full of these links:

- Books and authors in a library.
- Movies and actors in a cinema database.
- Doctors and patients in a hospital, when a patient sees several doctors.
- Recipes and tags in a cooking app.

You use `@ManyToMany` so that you can work with plain Java collections. You call `book.getAuthors()` and get a set of `Author` objects. You call `book.addAuthor(author)` and Hibernate inserts the right row in the join table. You never write the join SQL by hand.

## How it works

Every many-to-many link is really two one-to-many links glued to a small table. Here is the picture for one book with two authors.

```text
Book "Monsoon Diaries"
        |
        v
book_author (join table)
  book_id=1 -> author_id=1
  book_id=1 -> author_id=2
        |
        v
Author "Meera"   Author "Arjun"
```

The join table holds only two foreign keys. Each row is one link. To find the authors of book 1, the database reads the rows with `book_id=1` and follows the `author_id` values.

Here is the same design as an ER diagram, the kind you draw before writing any code.

```text
+-----------+     +-----------+
| BOOK      |     | AUTHOR    |
| PK id     |     | PK id     |
| title     |     | name      |
+-----------+     +-----------+
      1                 1
      |                 |
      *                 *
+-------------------------------+
| BOOK_AUTHOR (join table)      |
| FK book_id    FK author_id    |
+-------------------------------+
```

Each book and each author sit in their own table. The join table in the middle points to both. One book row can appear in many join rows, and so can one author row. That is what "many to many" means in practice.

| Entity | Table | Key columns |
|---|---|---|
| `Book` | `book` | `id` (primary key), `title` |
| `Author` | `author` | `id` (primary key), `name` |
| Join table | `book_author` | `book_id` and `author_id`, both foreign keys |

### Owning side and inverse side

A many-to-many link has two Java sides, but only one may control the join table. This is the **owning side**. It carries `@JoinTable`. The other side is the **inverse side**. It uses `mappedBy` to say, "the field on the other class already describes this link." Hibernate writes join rows only when the owning side changes. If you add a book to `author.getBooks()` but forget the owning side, nothing is saved.

> **Tip:** Write a small helper such as `addAuthor()` that updates both sides. Then your objects stay consistent in memory, and the database is always updated.

## Real-Life Example

Picture a school canteen coupon system. Each family gets a coupon card, and each stall accepts many cards. Nobody prints stall names on the card, and nobody writes card numbers on the stall board. The canteen manager keeps one register with two columns, card number and stall. When a stall stops accepting a card, the manager strikes out one line. The cards and stalls are untouched. The join table works exactly like that register.

## Code Example

Let's build a small app for Riverside Library. It has books, authors and a join table between them. We use the H2 in-memory database, so nothing needs to be installed.

```text
riverside-library/
├─ pom.xml
└─ src/main/
   ├─ java/com/riverside/library/
   │  ├─ LibraryApplication.java
   │  ├─ Book.java
   │  ├─ Author.java
   │  ├─ BookRepository.java
   │  ├─ AuthorRepository.java
   │  └─ LibraryService.java
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

    <groupId>com.riverside</groupId>
    <artifactId>library</artifactId>
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
spring.application.name=riverside-library
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `Book.java` in package `com.riverside.library`

```java
package com.riverside.library;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;

@Entity
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToMany
    @JoinTable(name = "book_author",
            joinColumns = @JoinColumn(name = "book_id"),
            inverseJoinColumns = @JoinColumn(name = "author_id"))
    private Set<Author> authors = new HashSet<>();

    protected Book() {
    }

    public Book(String title) {
        this.title = title;
    }

    public void addAuthor(Author author) {
        authors.add(author);
        author.getBooks().add(this);
    }

    public String getTitle() {
        return title;
    }

    public Set<Author> getAuthors() {
        return authors;
    }
}
```

**File:** `Author.java` in package `com.riverside.library`

```java
package com.riverside.library;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;

@Entity
public class Author {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToMany(mappedBy = "authors")
    private Set<Book> books = new HashSet<>();

    protected Author() {
    }

    public Author(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public Set<Book> getBooks() {
        return books;
    }
}
```

**File:** `BookRepository.java` in package `com.riverside.library`

```java
package com.riverside.library;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {
}
```

**File:** `AuthorRepository.java` in package `com.riverside.library`

```java
package com.riverside.library;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthorRepository extends JpaRepository<Author, Long> {
}
```

**File:** `LibraryService.java` in package `com.riverside.library`

```java
package com.riverside.library;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LibraryService {

    private final BookRepository books;
    private final AuthorRepository authors;
    private final JdbcTemplate jdbc;

    public LibraryService(BookRepository books, AuthorRepository authors, JdbcTemplate jdbc) {
        this.books = books;
        this.authors = authors;
        this.jdbc = jdbc;
    }

    @Transactional
    public void loadSampleData() {
        Author meera = authors.save(new Author("Meera Nair"));
        Author arjun = authors.save(new Author("Arjun Rao"));
        Author kabir = authors.save(new Author("Kabir Shah"));

        Book diaries = new Book("Monsoon Diaries");
        diaries.addAuthor(meera);
        diaries.addAuthor(arjun);

        Book tea = new Book("Tea Garden Tales");
        tea.addAuthor(meera);

        Book train = new Book("Night Train to Pune");
        train.addAuthor(arjun);
        train.addAuthor(kabir);

        books.saveAll(List.of(diaries, tea, train));
    }

    @Transactional(readOnly = true)
    public void printCatalogue() {
        for (Book book : books.findAll()) {
            System.out.println(book.getTitle() + " -> " + book.getAuthors().size() + " author(s)");
        }
        Author meera = authors.findAll().stream()
                .filter(a -> a.getName().startsWith("Meera")).findFirst().orElseThrow();
        System.out.println(meera.getName() + " wrote " + meera.getBooks().size() + " book(s)");
        List<Map<String, Object>> rows = jdbc.queryForList(
                "select book_id, author_id from book_author order by book_id, author_id");
        System.out.println("Join table rows: " + rows.size());
        rows.forEach(System.out::println);
    }
}
```

**File:** `LibraryApplication.java` in package `com.riverside.library`

```java
package com.riverside.library;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class LibraryApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(LibraryService service) {
        return args -> {
            service.loadSampleData();
            service.printCatalogue();
        };
    }
}
```

Run it with Maven:

```bash
mvn spring-boot:run
```

**Output:**

```text
Monsoon Diaries -> 2 author(s)
Tea Garden Tales -> 1 author(s)
Night Train to Pune -> 2 author(s)
Meera Nair wrote 2 book(s)
Join table rows: 5
{BOOK_ID=1, AUTHOR_ID=1}
{BOOK_ID=1, AUTHOR_ID=2}
{BOOK_ID=2, AUTHOR_ID=1}
{BOOK_ID=3, AUTHOR_ID=2}
{BOOK_ID=3, AUTHOR_ID=3}
```

The app prints these lines and exits, because there is no web starter. Three books produced five rows in the join table.

## Code Explained

- `@ManyToMany` on `Book.authors` makes `Book` the owning side. `@JoinTable` names the join table and its two columns.
- `@ManyToMany(mappedBy = "authors")` on `Author.books` makes it the inverse side. It only reads the link.
- `addAuthor()` updates both collections, so the objects match the database.
- We use `Set`, not `List`. With a `List`, Hibernate may delete and re-insert every join row when one link changes. A `Set` avoids that.
- `@Transactional` keeps one database session open while we touch the lazy collections. The lazy loading topic explains why that matters.
- `JdbcTemplate` reads the raw join table, so you can see that Hibernate really wrote it.

## Common Mistakes

> **Warning:** Do not use `CascadeType.REMOVE` or `CascadeType.ALL` on a many-to-many link. Deleting one author could then delete books that other authors still share.

- **Forgetting the owning side.** Adding only to the inverse collection saves nothing. Always update the side that has `@JoinTable`, or use a helper that updates both.
- **Using `List` instead of `Set`.** Hibernate handles a `Set` much more efficiently when links are removed.
- **Printing both sides in `toString()`.** A book prints its authors, each author prints its books, and you get an endless loop. Keep `toString()` to simple fields.
- **Needing extra columns on the link.** If you want to store "role" or "date joined" on each link, `@ManyToMany` cannot hold it. Create a real entity, such as `BookContribution`, with two `@ManyToOne` fields.

## Interview Questions

**What is the difference between the owning side and the inverse side?**
The owning side declares `@JoinTable` and controls the join rows. The inverse side uses `mappedBy` and only mirrors the link. Hibernate saves changes made on the owning side.

**How does a database store a many-to-many relationship?**
It uses a third table, the join table, with a foreign key to each of the two tables.

**Why prefer Set over List in a many-to-many mapping?**
When one link is removed from a `List`, Hibernate can delete every join row for that entity and insert them again. A `Set` lets it remove just one row.

**How do you add extra data, such as a date, to the link?**
Replace `@ManyToMany` with a join entity that has its own fields and two `@ManyToOne` links.

## Key Points to Remember

- Use `@ManyToMany` when both sides can have many related rows.
- A join table with two foreign keys stores the links.
- Only the owning side, the one with `@JoinTable`, writes join rows.
- Prefer `Set` and keep both sides in sync with a helper method.
- Avoid cascade remove, and use a join entity when the link needs extra columns.

## Frequently Asked Questions

### Do I have to create the join table for a many-to-many mapping myself?

No. With `spring.jpa.hibernate.ddl-auto` set to create, as it is for the embedded H2 database, Hibernate builds the table from `@JoinTable`. In production you write it in a migration script instead.

### Can I make the mapping one-directional?

Yes. Keep `@ManyToMany` and `@JoinTable` on one class and leave the other class without any field. You can then navigate only from that side.

### What is the default fetch type for @ManyToMany?

It is lazy. Hibernate loads the related rows only when you first touch the collection. The lazy vs eager loading topic covers this in detail.

### What is the difference between one-to-many and many-to-many?

In one-to-many, each child row belongs to exactly one parent, and a foreign key on the child is enough. In many-to-many, a child can have many parents, so a join table is needed.

## Related Topics

- [One to Many and Many to One Mapping](/learning/spring-boot-tutorial/one-to-many-and-many-to-one-mapping): the building block behind every join table.
- [Lazy vs Eager Loading](/learning/spring-boot-tutorial/lazy-vs-eager-loading): control when related rows are loaded.
- [N+1 Problem](/learning/spring-boot-tutorial/n-plus-1-problem): avoid slow queries when reading collections.
- [JPA Entity and @Entity](/learning/spring-boot-tutorial/jpa-entity): revisit how a class becomes a table.
