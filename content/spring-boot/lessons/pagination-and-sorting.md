Imagine a library with twelve thousand books. A visitor asks, "Show me your books." Would the librarian carry every single book to the desk? Of course not. She would bring one trolley with a few books, and say, "Want the next trolley?" That trolley is a page. Your API should behave the same way.

That idea is called pagination, and sorting decides the order of the trolley. Let's see how Spring Boot splits big lists into pages, how sorting fits in, and how to build a small book catalog that answers with one page at a time.

## What is Pagination and Sorting?

> **Definition:** Pagination means returning a big list of records in small slices called pages, so the client asks for one slice at a time. Sorting means choosing the order in which the records come back, such as by title or by price.

Every page has two settings:

- **Page number.** Which slice you want. Spring counts from 0, so the first page is page 0.
- **Page size.** How many records sit on one page.

Sorting adds a third setting: the property name and the direction, `asc` for smallest first or `desc` for biggest first.

Spring Data gives these ideas three small types. `Pageable` describes the request (page, size, sort). `Page` holds one slice of results plus the totals. `Sort` describes the ordering. You will use all three in this guide.

## Why is it used?

Returning everything looks fine while you test with ten rows. In real life it hurts:

- **Slow replies.** The database reads every row and Jackson turns every row into JSON.
- **Big memory use.** A list of a million objects can crash your server.
- **Wasted data.** A phone screen shows twenty books. Why send twenty thousand?
- **Unfair load.** One careless client can slow down everyone else.

With pages, the database does `LIMIT` and `OFFSET` work for you, replies stay small, and clients get a clear "page 2 of 6" message that is easy to show as page buttons.

> **Tip:** Any endpoint that returns a list which can grow, such as orders, bookings or messages, should be paged from day one. Adding pages later breaks every client that expected a plain list.

## How it works

Here is the journey of a request for page 1, with two books per page, sorted by page count.

```text
Client
  |  ?page=1&size=2
  |  &sort=pages,desc
  v
Argument resolver
  builds a Pageable object
  |
  v
BookController.list(pageable)
  |
  v
BookRepository.findAll(pageable)
  |  SQL with ORDER BY, LIMIT
  v
Page<Book> (slice + totals)
  |
  v
PagedModel -> JSON response
```

Spring MVC reads the three query parameters and builds a `Pageable` before your method runs. You never parse `page` or `size` yourself. You hand the `Pageable` to the repository, and Spring Data writes the SQL with `ORDER BY` and a row limit. It also runs a second small query to count all rows, so the `Page` knows the total. Last, you wrap the `Page` in a `PagedModel`, which Jackson turns into clean JSON.

Why `PagedModel`? A raw `PageImpl` has no stable JSON shape, and Spring Data warns you about it. `PagedModel` always gives the same shape: a `content` array and a `page` object with the numbers.

## Real-Life Example

Think of a cinema's online booking page. It shows eight films per screen, sorted by release date with the newest first. You press "Next" and the site shows the next eight. Behind the scenes, the page asks the server for page 1, size 8, sorted by release date with the newest first. The server never sends all two hundred films. It also tells the page there are 25 pages in total, so the page can draw the buttons.

## Code Example

Let's build BookNest, a small library catalog. It stores twelve books in an H2 in-memory database and serves them page by page. Add the web starter, the JPA starter and the H2 driver.

```text
booknest-catalog/
├─ pom.xml
└─ src/main/
   ├─ java/com/booknest/catalog/
   │  ├─ CatalogApplication.java
   │  ├─ Book.java
   │  ├─ BookRepository.java
   │  └─ BookController.java
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

    <groupId>com.booknest</groupId>
    <artifactId>catalog</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
        </dependency>
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

**File:** `CatalogApplication.java` in package `com.booknest.catalog`

```java
package com.booknest.catalog;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class CatalogApplication {

    public static void main(String[] args) {
        SpringApplication.run(CatalogApplication.class, args);
    }

    @Bean
    CommandLineRunner loadBooks(BookRepository books) {
        return args -> {
            books.save(new Book("Monsoon Diaries", "Asha Rao", 320));
            books.save(new Book("The Tea Estate", "Neel Kumar", 280));
            books.save(new Book("River Songs", "Asha Rao", 210));
            books.save(new Book("Night Train to Pune", "Vikram Sen", 350));
            books.save(new Book("The Lost Lighthouse", "Meera Iyer", 400));
            books.save(new Book("Clay and Fire", "Neel Kumar", 190));
            books.save(new Book("A Winter in Shimla", "Meera Iyer", 260));
            books.save(new Book("Salt Road", "Vikram Sen", 300));
            books.save(new Book("Paper Boats", "Asha Rao", 150));
            books.save(new Book("The Last Ferry", "Neel Kumar", 330));
            books.save(new Book("Mango Summers", "Meera Iyer", 240));
            books.save(new Book("Temple Bells", "Vikram Sen", 275));
        };
    }
}
```

**File:** `Book.java` in package `com.booknest.catalog`

```java
package com.booknest.catalog;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class Book {

    @Id
    @GeneratedValue
    private Long id;
    private String title;
    private String author;
    private int pages;

    protected Book() {
    }

    public Book(String title, String author, int pages) {
        this.title = title;
        this.author = author;
        this.pages = pages;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public int getPages() { return pages; }
}
```

**File:** `BookRepository.java` in package `com.booknest.catalog`

```java
package com.booknest.catalog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {

    Page<Book> findByAuthor(String author, Pageable pageable);
}
```

**File:** `BookController.java` in package `com.booknest.catalog`

```java
package com.booknest.catalog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/books")
public class BookController {

    private final BookRepository books;

    public BookController(BookRepository books) {
        this.books = books;
    }

    @GetMapping
    public PagedModel<Book> list(@PageableDefault(size = 5, sort = "title") Pageable pageable) {
        Page<Book> page = books.findAll(pageable);
        return new PagedModel<>(page);
    }

    @GetMapping("/by-author")
    public PagedModel<Book> byAuthor(@RequestParam String author, Pageable pageable) {
        return new PagedModel<>(books.findByAuthor(author, pageable));
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.data.web.pageable.max-page-size=20
spring.jpa.open-in-view=false
```

Start the app and ask for the second page, two books per page:

```bash
mvn spring-boot:run
curl "http://localhost:8080/books?size=2&page=1"
```

**Output:**

```json
{
  "content": [
    {
      "title": "Mango Summers",
      "author": "Meera Iyer",
      "pages": 240,
      "id": 11
    },
    {
      "title": "Monsoon Diaries",
      "author": "Asha Rao",
      "pages": 320,
      "id": 1
    }
  ],
  "page": {
    "size": 2,
    "number": 1,
    "totalElements": 12,
    "totalPages": 6
  }
}
```

The reply is spaced out here so it is easy to read; curl prints it on one line. The default sort is by title, so page 1 holds the third and fourth titles. Now sort by page count, biggest first:

```bash
curl "http://localhost:8080/books?size=2&sort=pages,desc"
```

**Output:**

```json
{
  "content": [
    {
      "title": "The Lost Lighthouse",
      "author": "Meera Iyer",
      "pages": 400,
      "id": 5
    },
    {
      "title": "Night Train to Pune",
      "author": "Vikram Sen",
      "pages": 350,
      "id": 4
    }
  ],
  "page": {
    "size": 2,
    "number": 0,
    "totalElements": 12,
    "totalPages": 6
  }
}
```

## Code Explained

- `@Entity` and `@Id` turn `Book` into a table row. Hibernate creates the table in H2 at startup.
- `BookRepository` extends `JpaRepository`, so `findAll(Pageable)` already exists. We add `findByAuthor(String, Pageable)`, and Spring Data writes the query from the method name.
- `@PageableDefault(size = 5, sort = "title")` sets defaults for when the client sends nothing. Without it, the default size is 20.
- `Pageable` as a method argument is filled by Spring MVC from `page`, `size` and `sort`.
- `new PagedModel<>(page)` wraps the `Page` in a stable JSON shape.
- The `max-page-size` setting in the `spring.data.web.pageable` group caps the size. A client asking for `size=100` quietly gets 20.
- `CommandLineRunner` in `CatalogApplication` saves twelve books once at startup so you have data to page through.

## Pageable at a Glance

| Request | Meaning |
|---|---|
| `?page=0&size=5` | First five records |
| `?page=2&size=5` | Records 11 to 15 |
| `?sort=title` | Sort by title, ascending |
| `?sort=pages,desc` | Sort by pages, biggest first |
| `?sort=author&sort=title` | Sort by author, then title |
| No parameters | Uses `@PageableDefault`, else page 0 and size 20 |

Inside the reply, `totalElements` is the count of all records and `totalPages` is how many pages that makes. A page number past the end is not an error. You get an empty `content` array, as shown here for `page=9`:

```json
{
  "content": [],
  "page": {
    "size": 2,
    "number": 9,
    "totalElements": 12,
    "totalPages": 6
  }
}
```

## Building Pageable by Hand

Sometimes you want your own parameter names, or you must check them first. Then build the request yourself with `PageRequest.of(page, size, sort)`. The practice section below does exactly that, with a list of allowed sort fields.

> **Warning:** Never pass a `sort` value straight from the client into a database query that you built yourself. With Spring Data it is safe from SQL injection, but an unknown property still fails. Ask for `?sort=price` on our catalog and the server answers with an error instead of a nice message.

That failure looks like this:

```json
{
  "timestamp": "2026-09-26T16:42:55.716Z",
  "status": 500,
  "error": "Internal Server Error",
  "path": "/books"
}
```

The log says `No property 'price' found for type 'Book'`. In a real API, allow only known property names and return a 400 for the rest.

## Common Mistakes

- **Starting at page 1.** Spring counts from 0. Asking for `page=1` gives the second page, and your first page will look missing.
- **Returning `Page` directly.** It works, but the JSON shape can change between versions. Wrap it in `PagedModel` or your own DTO.
- **No maximum size.** A client sending `size=1000000` defeats the point of paging. Set `max-page-size`.
- **Sorting a page after loading it.** Sort in the database through `Pageable`. If you sort a list in Java, only the current page gets sorted.
- **Unstable order.** Sorting by a column that has many equal values, such as `author`, can show the same book on two pages. Add a second sort, for example `author` and then `title`.

## Interview Questions

**What is the difference between Page and Slice?**
A `Page` also knows the total number of records, so it runs an extra count query. A `Slice` only knows whether a next slice exists, so it is cheaper. Use `Slice` for "load more" lists.

**How does Spring Boot build a Pageable from the URL?**
A built-in argument resolver reads `page`, `size` and `sort` from the query string and creates a `Pageable` before your controller method runs.

**Is page numbering zero-based or one-based?**
Zero-based by default. You can change that by setting `one-indexed-parameters` to `true` in the same `spring.data.web.pageable` group.

**Why can deep pages become slow?**
Offset paging makes the database skip many rows before it returns the slice. On huge tables, keyset paging (filtering by the last seen id) is faster.

## Key Points to Remember

- Return big lists in pages; never send every record.
- `Pageable` carries page, size and sort. `Page` carries the slice and the totals.
- Pages start at 0, and `sort=field,desc` sets the direction.
- Wrap a `Page` in `PagedModel` for a steady JSON shape.
- Cap the page size and allow only known sort fields.
- Sorting belongs in the database, not in Java code after loading.

## Frequently Asked Questions

### Can I use pagination without a database?

Yes. The `Pageable` type comes from Spring Data Commons, so it works with any Spring Data store. For a plain list in memory, build a `PageRequest` yourself and cut the list with `subList`.

### How do I sort by more than one field?

Repeat the parameter in the URL:

```bash
curl "localhost:8080/books?sort=author,asc&sort=title,desc"
```

In code, chain the sorts:

```java
Sort sort = Sort.by("author").ascending()
        .and(Sort.by("title").descending());
```

### What does the total count cost?

One extra `COUNT` query per request. If the table is huge and you do not need totals, return a `Slice` instead.

### Can the page size be changed by the client?

Yes, through `size`, but always set a maximum. Spring Boot's `max-page-size` setting keeps clients honest.

## Related Topics

- [Building a Complete CRUD REST API](/learning/spring-boot-tutorial/building-a-complete-crud-rest-api): put pages on top of a full create, read, update and delete API.
- [@RequestParam](/learning/spring-boot-tutorial/request-param): see how query parameters such as page and size are read.
- [JpaRepository](/learning/spring-boot-tutorial/jparepository): learn the repository methods behind findAll and derived queries.
- [DTO Pattern](/learning/spring-boot-tutorial/dto-pattern): shape the records you send back in each page.
