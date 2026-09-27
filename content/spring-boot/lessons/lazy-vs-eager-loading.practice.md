Try each problem on your own first. Both use the H2 in-memory database, so nothing needs to be installed.

### Easy: Bakery Cake Names

Sunrise Bakery stores each `Bakery` with many `Cake` rows. A developer loads a bakery and prints its cakes outside any transaction, and gets a `LazyInitializationException`. Build the app the right way: a service method takes a bakery id and returns the list of cake names, without changing the lazy mapping.

> **Hint:** The collection is lazy, so it must be read while the session is open. Put the loading and the mapping to names in one `@Transactional` method.

**Answer:** Do the whole job inside a transactional service method and return plain strings. The caller then never touches a lazy field.

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

    <groupId>com.sunrise</groupId>
    <artifactId>bakery</artifactId>
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

**File:** `Bakery.java` in package `com.sunrise.bakery`

```java
package com.sunrise.bakery;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
public class Bakery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "bakery", cascade = CascadeType.PERSIST)
    private List<Cake> cakes = new ArrayList<>();

    protected Bakery() {
    }

    public Bakery(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public List<Cake> getCakes() {
        return cakes;
    }
}
```

**File:** `Cake.java` in package `com.sunrise.bakery`

```java
package com.sunrise.bakery;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Cake {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String flavour;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bakery_id")
    private Bakery bakery;

    protected Cake() {
    }

    public Cake(String flavour, Bakery bakery) {
        this.flavour = flavour;
        this.bakery = bakery;
    }

    public String getFlavour() {
        return flavour;
    }
}
```

**File:** `BakeryRepository.java` in package `com.sunrise.bakery`

```java
package com.sunrise.bakery;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BakeryRepository extends JpaRepository<Bakery, Long> {
}
```

**File:** `BakeryService.java` in package `com.sunrise.bakery`

```java
package com.sunrise.bakery;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BakeryService {

    private final BakeryRepository bakeries;

    public BakeryService(BakeryRepository bakeries) {
        this.bakeries = bakeries;
    }

    @Transactional
    public Long seed() {
        Bakery bakery = new Bakery("Sunrise Bakery");
        bakery.getCakes().add(new Cake("Pineapple", bakery));
        bakery.getCakes().add(new Cake("Black Forest", bakery));
        return bakeries.save(bakery).getId();
    }

    @Transactional(readOnly = true)
    public List<String> cakeNames(Long bakeryId) {
        return bakeries.findById(bakeryId).orElseThrow()
                .getCakes().stream().map(Cake::getFlavour).toList();
    }
}
```

**File:** `BakeryApplication.java` in package `com.sunrise.bakery`

```java
package com.sunrise.bakery;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BakeryApplication {

    public static void main(String[] args) {
        SpringApplication.run(BakeryApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(BakeryService service) {
        return args -> {
            Long id = service.seed();
            System.out.println("Cakes: " + service.cakeNames(id));
        };
    }
}
```

Running the app prints:

```text
Cakes: [Pineapple, Black Forest]
```

### Medium: Library Shelf Query Count

A library has `Shelf` rows with many `Book` rows. Load one shelf and print how many books it has in two ways: with the plain `findById` and then touching the lazy list, and with a `JOIN FETCH` query. Print the number of SQL statements each way, using Hibernate statistics.

> **Hint:** Turn on `hibernate.generate_statistics`, get the `Statistics` from the `SessionFactory`, and call `clear()` before each way. Write the fetch query with `@Query` and `join fetch`.

**Answer:** The first way runs two statements: one for the shelf and one for its books. The `JOIN FETCH` query runs one statement for both.

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

    <groupId>com.citylib</groupId>
    <artifactId>shelves</artifactId>
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

**File:** `Shelf.java` in package `com.citylib.shelves`

```java
package com.citylib.shelves;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
public class Shelf {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String label;

    @OneToMany(mappedBy = "shelf", cascade = CascadeType.PERSIST)
    private List<Book> books = new ArrayList<>();

    protected Shelf() {
    }

    public Shelf(String label) {
        this.label = label;
    }

    public Long getId() {
        return id;
    }

    public List<Book> getBooks() {
        return books;
    }
}
```

**File:** `Book.java` in package `com.citylib.shelves`

```java
package com.citylib.shelves;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelf_id")
    private Shelf shelf;

    protected Book() {
    }

    public Book(String title, Shelf shelf) {
        this.title = title;
        this.shelf = shelf;
    }
}
```

**File:** `ShelfRepository.java` in package `com.citylib.shelves`

```java
package com.citylib.shelves;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShelfRepository extends JpaRepository<Shelf, Long> {

    @Query("select s from Shelf s join fetch s.books where s.id = :id")
    Optional<Shelf> findWithBooks(@Param("id") Long id);
}
```

**File:** `ShelfService.java` in package `com.citylib.shelves`

```java
package com.citylib.shelves;

import jakarta.persistence.EntityManagerFactory;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShelfService {

    private final ShelfRepository shelves;
    private final Statistics stats;

    public ShelfService(ShelfRepository shelves, EntityManagerFactory emf) {
        this.shelves = shelves;
        this.stats = emf.unwrap(SessionFactory.class).getStatistics();
    }

    @Transactional
    public Long seed() {
        Shelf shelf = new Shelf("Travel");
        shelf.getBooks().add(new Book("Coastal Roads", shelf));
        shelf.getBooks().add(new Book("Hill Trains", shelf));
        shelf.getBooks().add(new Book("Desert Nights", shelf));
        return shelves.save(shelf).getId();
    }

    @Transactional(readOnly = true)
    public void compare(Long id) {
        stats.clear();
        int plain = shelves.findById(id).orElseThrow().getBooks().size();
        System.out.println("Plain: " + plain + " books, "
                + stats.getPrepareStatementCount() + " queries");

        stats.clear();
        int fetched = shelves.findWithBooks(id).orElseThrow().getBooks().size();
        System.out.println("Fetch: " + fetched + " books, "
                + stats.getPrepareStatementCount() + " query");
    }
}
```

**File:** `ShelvesApplication.java` in package `com.citylib.shelves`

```java
package com.citylib.shelves;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ShelvesApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShelvesApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(ShelfService service) {
        return args -> service.compare(service.seed());
    }
}
```

Running the app prints:

```text
Plain: 3 books, 2 queries
Fetch: 3 books, 1 query
```
