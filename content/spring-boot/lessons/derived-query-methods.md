Picture a bookshop assistant. A customer says, "Show me cooking books under 400 rupees, cheapest first." The assistant does not need a long form. The sentence itself is enough, and she walks to the right shelf. Derived query methods work the same way. You write a method name that reads like a sentence, and Spring Data JPA turns the name into a database query for you.

In this topic you will learn how to name methods so that Spring understands them, which keywords you can use, and where the limits are. We will build a small bookshop search that uses eight different methods and no SQL at all.

## What are derived query methods?

A derived query method is a method you declare in a repository interface. Spring Data reads its name, splits it into parts, and builds the query at startup. You never write a method body.

> **Definition:** A derived query method is a repository method whose query is derived from its name. Words such as `findBy`, `And`, `LessThan` and `OrderBy` tell Spring Data which fields to match and how to sort.

The name follows a pattern: a start word, then the property names of your entity, joined by keywords.

```java
List<Book> findByAuthor(String author);
List<Book> findByPriceLessThan(int price);
```

The first method means "find books where `author` equals the argument". The second means "find books where `price` is less than the argument". The property names must match the fields in your entity, with a capital letter at the start of each word.

## Why are they used?

Most searches in an app are simple: find by email, find by status, find the newest five. Writing SQL or JPQL for each one is slow and easy to get wrong. A derived method takes a single line, and it is checked when the app starts. If you misspell a field, the app refuses to start, so you find the mistake at once and not in front of a customer.

They also keep the code readable. A method name that spells out the genre and the stock flag tells any teammate exactly what it does. When a search grows too complex for a name, you switch to a written query, which is the next topic.

> **Tip:** If a method name grows longer than about five parts, stop and write a query with `@Query` instead. A name that strings together genre, author, price range and stock flag is hard to read.

## How it works

Spring Data splits the name and builds a query from the parts.

```text
findByGenreAndPriceLessThan
   |     |      |
   |     |      +-- operator
   |     +-- property (genre)
   +-- start word: find
```

The start word `findBy` says "select rows". Then come the property names and keywords. `And` joins two conditions, and `LessThan` is an operator applied to the property before it. Spring Data turns this into a `where genre = ? and price < ?` query and runs it through Hibernate.

Here is the journey from your call to the result.

```text
Call: findByGenre("COOKING")
        |
        v
Spring parses the method name
        |
        v
Builds query: where genre = ?
        |
        v
Hibernate runs the SQL
        |
        v
Rows become a List of entities
```

The parsing happens once at startup, so each call afterwards is fast. If a name cannot be matched to your entity, Spring stops the app with a clear error.

## Real-Life Example

Think about how you search on a shopping app. You tick "Cooking", set a price limit and choose "cheapest first". You never write a query. You pick from a menu of words: category, less than, sort by. Derived query methods are that menu for developers. The keywords `And`, `LessThan` and `OrderBy` are the tick boxes. The app turns your choices into the real database search behind the scenes.

## Code Example

Let's build the search for a shop called Turning Pages. The `Book` entity has a title, an author, a genre, a price and an in-stock flag. The repository has eight derived methods.

```text
bookshop/
├─ pom.xml
└─ src/main/
   ├─ java/com/turningpages/shop/
   │  ├─ ShopApplication.java
   │  ├─ Book.java
   │  ├─ BookRepository.java
   │  └─ SearchRunner.java
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

    <groupId>com.turningpages</groupId>
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

**File:** `ShopApplication.java` in package `com.turningpages.shop`

```java
package com.turningpages.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}
```

**File:** `Book.java` in package `com.turningpages.shop`

```java
package com.turningpages.shop;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String author;
    private String genre;
    private int price;
    private boolean inStock;

    protected Book() {
    }

    public Book(String title, String author, String genre, int price, boolean inStock) {
        this.title = title;
        this.author = author;
        this.genre = genre;
        this.price = price;
        this.inStock = inStock;
    }

    public String getTitle() {
        return title;
    }

    @Override
    public String toString() {
        return title + " (Rs" + price + ")";
    }
}
```

**File:** `BookRepository.java` in package `com.turningpages.shop`

```java
package com.turningpages.shop;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {

    List<Book> findByAuthor(String author);

    List<Book> findByPriceLessThan(int price);

    List<Book> findByPriceBetween(int low, int high);

    List<Book> findByGenreAndInStockTrue(String genre);

    List<Book> findByTitleContainingIgnoreCase(String text);

    List<Book> findByGenreOrderByPriceAsc(String genre);

    List<Book> findTop2ByOrderByPriceDesc();

    long countByGenre(String genre);

    boolean existsByTitle(String title);
}
```

**File:** `SearchRunner.java` in package `com.turningpages.shop`

```java
package com.turningpages.shop;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SearchRunner implements CommandLineRunner {

    private final BookRepository repository;

    public SearchRunner(BookRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.saveAll(List.of(
                new Book("River of Stories", "Anita Rao", "FICTION", 350, true),
                new Book("Coastal Winds", "Dev Menon", "FICTION", 275, false),
                new Book("Kitchen Basics", "Meera Iyer", "COOKING", 420, true),
                new Book("Night Train to Pune", "Anita Rao", "FICTION", 199, true),
                new Book("Spice Trails", "Meera Iyer", "COOKING", 310, true),
                new Book("Garden Notes", "Dev Menon", "GARDENING", 150, true)));

        show("By author", repository.findByAuthor("Anita Rao"));
        show("Under 200", repository.findByPriceLessThan(200));
        show("Between 250 and 350", repository.findByPriceBetween(250, 350));
        show("Fiction in stock", repository.findByGenreAndInStockTrue("FICTION"));
        show("Title has 'TRA'", repository.findByTitleContainingIgnoreCase("TRA"));
        show("Cooking, cheapest first", repository.findByGenreOrderByPriceAsc("COOKING"));
        show("Top 2 by price", repository.findTop2ByOrderByPriceDesc());
        System.out.println("Fiction count: " + repository.countByGenre("FICTION"));
        System.out.println("Has Spice Trails? " + repository.existsByTitle("Spice Trails"));
    }

    private void show(String label, List<Book> books) {
        System.out.println(label + ":");
        books.forEach(b -> System.out.println("  " + b.getTitle()));
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.application.name=bookshop
```

Run it with `mvn spring-boot:run`.

**Output:**

```text
By author:
  River of Stories
  Night Train to Pune
Under 200:
  Night Train to Pune
  Garden Notes
Between 250 and 350:
  River of Stories
  Coastal Winds
  Spice Trails
Fiction in stock:
  River of Stories
  Night Train to Pune
Title has 'TRA':
  Night Train to Pune
  Spice Trails
Cooking, cheapest first:
  Spice Trails
  Kitchen Basics
Top 2 by price:
  Kitchen Basics
  River of Stories
Fiction count: 3
Has Spice Trails? true
```

## Code Explained

- `findByAuthor` compares `author` with the argument, so it finds all books by that writer.
- `findByPriceLessThan` builds `price < ?`, and `findByPriceBetween` takes two arguments for the low and high limits, both included.
- `findByGenreAndInStockTrue` joins two conditions with `And`. The `True` keyword tests a boolean field, so it needs no argument.
- The title search uses `Containing` and `IgnoreCase`, so it matches part of the title and ignores capital letters. It wraps the text as `%text%` for you.
- `OrderByPriceAsc` sorts the result. Write `Desc` for the other direction.
- `findTop2By...` limits the result to the first two rows. Here it gives the two most expensive books.
- `countByGenre` returns a number, and `existsByTitle` returns a boolean. Neither loads any book objects.
- The method arguments follow the same order as the words in the name.

## Common Keywords

| Keyword | Example | Meaning |
|---|---|---|
| `And`, `Or` | `findByGenreAndAuthor` | Combine conditions |
| `LessThan`, `GreaterThan` | `findByPriceLessThan` | Compare numbers |
| `Between` | `findByPriceBetween` | Value inside a range |
| `Containing`, `StartingWith` | `findByTitleContaining` | Match part of text |
| `IgnoreCase` | `findByGenreIgnoreCase` | Ignore capital letters |
| `OrderBy...Asc/Desc` | `findByGenreOrderByPriceAsc` | Sort the result |
| `Top`, `First` | `findTop3By...` | Limit the row count |
| `In` | `findByGenreIn` | Match any value in a list |

## Common Mistakes

> **Warning:** A misspelled property name stops the whole application at startup, with a message such as "No property 'authour' found for type 'Book'". Read the message. It names the exact word that failed.

- **Using column names in the method.** Write `findByInStock`, not `findByIn_stock`. Use the Java field names of the entity.
- **Wrong number of arguments.** `findByPriceBetween` needs two values. Each condition needs the matching number of arguments, in order.
- **Returning the wrong type.** A search that can return many rows should return a `List`. If it returns a single object and many rows match, Spring throws an error.
- **Very long names.** They are hard to read and easy to break. Switch to a written query when the name gets long.

## Interview Questions

**What is a derived query method?**
It is a repository method whose query Spring Data builds from its name, such as `findByAuthor`. You write no SQL and no method body.

**When does Spring check the method names?**
At application startup. A name that does not match an entity property makes startup fail, so mistakes show up early.

**What are the limits of derived queries?**
Long names become unreadable, and complex joins, groupings and custom SQL functions do not fit a name. For those, use a `@Query` written in JPQL or native SQL.

## Key Points to Remember

- Spring Data builds the query from the repository method name.
- The pattern is a start word such as `findBy`, then property names joined by keywords such as `And` or `LessThan`.
- Property names must match the entity field names, with capital letters between words.
- Misspelled names stop the app at startup, which helps you find errors early.
- For complex searches, use a written query instead of a long name.

## Frequently Asked Questions

### How do derived query methods find rows without SQL?

Spring Data splits the method name into parts and builds a query from them at startup. Hibernate then turns that query into SQL for your database.

### Can I search by a field in a related entity?

Yes. You can write `findByAuthorName` to reach into a related object. Spring walks the property path, and if the name is unclear, use an underscore such as `findByAuthor_Name`.

### Do derived query methods work with sorting and paging?

Yes. Add a `Sort` or a `Pageable` as the last argument, and the result is sorted or paged. Use `Page<Book>` as the return type for paging.

### Should I test derived query methods?

Yes. A small test with test data confirms that your method name means what you think, especially for `And` and `Or` combinations.

## Related Topics

- [JpaRepository](/learning/spring-boot-tutorial/jparepository): the base methods every repository already has.
- [Query with JPQL and Native SQL](/learning/spring-boot-tutorial/query-with-jpql-and-native-sql): write your own query when a name is not enough.
- [Pagination and Sorting](/learning/spring-boot-tutorial/pagination-and-sorting): return searches page by page.
- [Data JPA Test](/learning/spring-boot-tutorial/data-jpa-test): test your repository methods quickly.
