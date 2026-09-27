Try each problem on your own first. Both use the web starter, the JPA starter and the H2 driver.

### Easy: CinePoint Newest Movies First

CinePoint, a cinema chain, wants `GET /movies` to return four movies per page, newest release year first, with no parameters needed. Store seven movies in H2 and make the second page reachable with `?page=1`.

> **Hint:** Put `@PageableDefault` on the `Pageable` argument and set `size`, `sort` and `direction`. Return the result inside a `PagedModel`.

**Answer:** The defaults live on the method argument, so a plain `GET /movies` already gives page 0 with four movies. The repository is just an empty `JpaRepository`.

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

    <groupId>com.cinepoint</groupId>
    <artifactId>movies</artifactId>
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

**File:** `MoviesApplication.java` in package `com.cinepoint.movies`

```java
package com.cinepoint.movies;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MoviesApplication {

    public static void main(String[] args) {
        SpringApplication.run(MoviesApplication.class, args);
    }

    @Bean
    CommandLineRunner seed(MovieRepository movies) {
        return args -> {
            movies.save(new Movie("Monsoon Express", 2021));
            movies.save(new Movie("The Silent Orbit", 2024));
            movies.save(new Movie("Clay Dreams", 2019));
            movies.save(new Movie("Last Show", 2023));
            movies.save(new Movie("Golden Hour", 2022));
            movies.save(new Movie("Kite Season", 2020));
            movies.save(new Movie("Harbor Lights", 2025));
        };
    }
}
```

**File:** `Movie.java` in package `com.cinepoint.movies`

```java
package com.cinepoint.movies;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class Movie {

    @Id
    @GeneratedValue
    private Long id;
    private String title;
    private int releaseYear;

    protected Movie() {
    }

    public Movie(String title, int releaseYear) {
        this.title = title;
        this.releaseYear = releaseYear;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public int getReleaseYear() { return releaseYear; }
}
```

**File:** `MovieRepository.java` in package `com.cinepoint.movies`

```java
package com.cinepoint.movies;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieRepository extends JpaRepository<Movie, Long> {
}
```

**File:** `MovieController.java` in package `com.cinepoint.movies`

```java
package com.cinepoint.movies;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MovieController {

    private final MovieRepository movies;

    public MovieController(MovieRepository movies) {
        this.movies = movies;
    }

    @GetMapping("/movies")
    public PagedModel<Movie> list(
            @PageableDefault(size = 4, sort = "releaseYear", direction = Sort.Direction.DESC) Pageable pageable) {
        return new PagedModel<>(movies.findAll(pageable));
    }
}
```

Call the second page:

```bash
curl "localhost:8080/movies?page=1"
```

It prints the last three movies:

```json
{
  "content": [
    {
      "title": "Monsoon Express",
      "releaseYear": 2021,
      "id": 1
    },
    {
      "title": "Kite Season",
      "releaseYear": 2020,
      "id": 6
    },
    {
      "title": "Clay Dreams",
      "releaseYear": 2019,
      "id": 3
    }
  ],
  "page": {
    "size": 4,
    "number": 1,
    "totalElements": 7,
    "totalPages": 2
  }
}
```

The JSON is spaced out here; curl prints it on one line.

### Medium: Medico Pharmacy Search

A pharmacy app needs `GET /medicines` with these query parameters: `keyword` (part of the name, any case), `page` (default 0), `size` (default 3, never more than 10), `sortBy` (only `name` or `priceInRupees`) and `direction` (`asc` or `desc`). An unknown `sortBy` must return status 400.

> **Hint:** Add a derived query to the repository that finds names containing the keyword, ignoring case. In the controller build the request with `PageRequest.of(page, size, Sort.by(direction, sortBy))`, and throw `ResponseStatusException` for a bad `sortBy`.

**Answer:** Keep the allowed sort names in a `Set`. Check the name first, clamp `page` and `size` into safe values, then build the `PageRequest` yourself.

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

    <groupId>com.medico</groupId>
    <artifactId>pharmacy</artifactId>
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

**File:** `PharmacyApplication.java` in package `com.medico.pharmacy`

```java
package com.medico.pharmacy;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class PharmacyApplication {

    public static void main(String[] args) {
        SpringApplication.run(PharmacyApplication.class, args);
    }

    @Bean
    CommandLineRunner seed(MedicineRepository medicines) {
        return args -> {
            medicines.save(new Medicine("Paracetamol 500", 18));
            medicines.save(new Medicine("Paracetamol Syrup", 42));
            medicines.save(new Medicine("Cough Syrup", 65));
            medicines.save(new Medicine("Vitamin C Tablets", 90));
            medicines.save(new Medicine("Antacid Syrup", 55));
            medicines.save(new Medicine("Bandage Roll", 30));
            medicines.save(new Medicine("Ibuprofen 400", 25));
        };
    }
}
```

**File:** `Medicine.java` in package `com.medico.pharmacy`

```java
package com.medico.pharmacy;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class Medicine {

    @Id
    @GeneratedValue
    private Long id;
    private String name;
    private int priceInRupees;

    protected Medicine() {
    }

    public Medicine(String name, int priceInRupees) {
        this.name = name;
        this.priceInRupees = priceInRupees;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public int getPriceInRupees() { return priceInRupees; }
}
```

**File:** `MedicineRepository.java` in package `com.medico.pharmacy`

```java
package com.medico.pharmacy;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    Page<Medicine> findByNameContainingIgnoreCase(String keyword, Pageable pageable);
}
```

**File:** `MedicineController.java` in package `com.medico.pharmacy`

```java
package com.medico.pharmacy;

import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class MedicineController {

    private static final Set<String> SORTABLE = Set.of("name", "priceInRupees");

    private final MedicineRepository medicines;

    public MedicineController(MedicineRepository medicines) {
        this.medicines = medicines;
    }

    @GetMapping("/medicines")
    public PagedModel<Medicine> search(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "3") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {

        if (!SORTABLE.contains(sortBy)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot sort by " + sortBy);
        }
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        PageRequest request = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 10), sort);
        return new PagedModel<>(medicines.findByNameContainingIgnoreCase(keyword, request));
    }
}
```

Ask for the two dearest syrups:

```bash
curl "localhost:8080/medicines?keyword=syrup&size=2&sortBy=priceInRupees&direction=desc"
```

The reply is below. Trying `sortBy=id` gives status 400.

**Output:**

```json
{
  "content": [
    {
      "name": "Cough Syrup",
      "priceInRupees": 65,
      "id": 3
    },
    {
      "name": "Antacid Syrup",
      "priceInRupees": 55,
      "id": 5
    }
  ],
  "page": {
    "size": 2,
    "number": 0,
    "totalElements": 3,
    "totalPages": 2
  }
}
```

The JSON is spaced out here; curl prints it on one line.
