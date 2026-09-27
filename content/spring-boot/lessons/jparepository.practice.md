Try each problem on your own first. Each project has its own `pom.xml`, shown below.

### Easy: Movie Watchlist

Night Owl Club keeps a watchlist of movies. Build an entity `Movie` (a title and a `watched` flag that starts as false) with a repository. Save three movies with `saveAll`, mark the second one as watched, delete the third one, and print the movies that are left with their status.

Use these titles: Paper Boats, Night Market, The Last Ferry.

> **Hint:** Load the second movie with `findById(2L)`, change it with a setter and call `save`. Delete the third with `deleteById(3L)`. Then use `findAll()`.

**Answer:** Update and insert both use `save`. The second `save` updates, because the loaded movie already has an id.

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

    <groupId>com.nightowl</groupId>
    <artifactId>watchlist</artifactId>
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

**File:** `WatchlistApplication.java` in package `com.nightowl.watchlist`

```java
package com.nightowl.watchlist;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WatchlistApplication {

    public static void main(String[] args) {
        SpringApplication.run(WatchlistApplication.class, args);
    }
}
```

**File:** `Movie.java` in package `com.nightowl.watchlist`

```java
package com.nightowl.watchlist;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private boolean watched;

    protected Movie() {
    }

    public Movie(String title) {
        this.title = title;
    }

    public void markWatched() {
        this.watched = true;
    }

    @Override
    public String toString() {
        return id + " " + title + (watched ? " [watched]" : " [to watch]");
    }
}
```

**File:** `MovieRepository.java` in package `com.nightowl.watchlist`

```java
package com.nightowl.watchlist;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieRepository extends JpaRepository<Movie, Long> {
}
```

**File:** `WatchlistRunner.java` in package `com.nightowl.watchlist`

```java
package com.nightowl.watchlist;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class WatchlistRunner implements CommandLineRunner {

    private final MovieRepository repository;

    public WatchlistRunner(MovieRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.saveAll(List.of(
                new Movie("Paper Boats"),
                new Movie("Night Market"),
                new Movie("The Last Ferry")));

        Movie second = repository.findById(2L).orElseThrow();
        second.markWatched();
        repository.save(second);

        repository.deleteById(3L);

        repository.findAll().forEach(System.out::println);
    }
}
```

The output is:

```text
1 Paper Boats [to watch]
2 Night Market [watched]
```

### Medium: Paged Book Catalogue

A library wants to show its books two at a time, sorted by title. Save five books, then use a `PageRequest` of size 2 and loop through every page. For each page, print the page number (starting from 1) and the titles on it. Stop when there is no next page.

Use these titles: River of Stories, Coastal Winds, Night Train to Pune, The Tea Garden, Monsoon Diary.

> **Hint:** Start with `PageRequest.of(0, 2, Sort.by("title"))`. A `Page` has `hasNext()` and `nextPageable()`. Use a `do ... while` loop.

**Answer:** Each call to `findAll(pageable)` returns a `Page`. The loop asks for the next pageable until `hasNext()` is false.

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

    <groupId>com.pageturn</groupId>
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

**File:** `CatalogueApplication.java` in package `com.pageturn.catalogue`

```java
package com.pageturn.catalogue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CatalogueApplication {

    public static void main(String[] args) {
        SpringApplication.run(CatalogueApplication.class, args);
    }
}
```

**File:** `Book.java` in package `com.pageturn.catalogue`

```java
package com.pageturn.catalogue;

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

    protected Book() {
    }

    public Book(String title) {
        this.title = title;
    }

    public String getTitle() {
        return title;
    }
}
```

**File:** `BookRepository.java` in package `com.pageturn.catalogue`

```java
package com.pageturn.catalogue;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {
}
```

**File:** `PageRunner.java` in package `com.pageturn.catalogue`

```java
package com.pageturn.catalogue;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
public class PageRunner implements CommandLineRunner {

    private final BookRepository repository;

    public PageRunner(BookRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.saveAll(List.of(
                new Book("River of Stories"),
                new Book("Coastal Winds"),
                new Book("Night Train to Pune"),
                new Book("The Tea Garden"),
                new Book("Monsoon Diary")));

        Pageable pageable = PageRequest.of(0, 2, Sort.by("title"));
        Page<Book> page;
        do {
            page = repository.findAll(pageable);
            System.out.println("Page " + (page.getNumber() + 1) + ":");
            page.getContent().forEach(b -> System.out.println("  " + b.getTitle()));
            pageable = page.nextPageable();
        } while (page.hasNext());
    }
}
```

The output is:

```text
Page 1:
  Coastal Winds
  Monsoon Diary
Page 2:
  Night Train to Pune
  River of Stories
Page 3:
  The Tea Garden
```
