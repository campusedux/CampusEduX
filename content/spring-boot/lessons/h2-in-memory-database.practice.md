Try each problem on your own first. Each project has its own `pom.xml`, shown below.

### Easy: Film Club Seeded from data.sql

Riverside Film Club wants a small H2 database that starts with three films already inside. Build an app with an entity `Film` (a title and a year), a `data.sql` file with three inserts, and a runner that prints how many films exist and then their titles.

Use these films: Paper Boats (2019), Night Market (2021), The Last Ferry (2023).

> **Hint:** Turn on the deferred-initialization property in the `spring.jpa` group, or `data.sql` will run before the table exists. Hibernate names the table `film` and the column `release_year` if you call the field `releaseYear`.

**Answer:** Hibernate creates the table, then `data.sql` fills it. The runner only reads. It does not save anything.

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
    <artifactId>filmclub</artifactId>
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
spring.application.name=filmclub
spring.jpa.defer-datasource-initialization=true
```

**File:** `data.sql` in `src/main/resources`

```sql
INSERT INTO film (title, release_year) VALUES ('Paper Boats', 2019);
INSERT INTO film (title, release_year) VALUES ('Night Market', 2021);
INSERT INTO film (title, release_year) VALUES ('The Last Ferry', 2023);
```

**File:** `FilmClubApplication.java` in package `com.riverside.filmclub`

```java
package com.riverside.filmclub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FilmClubApplication {

    public static void main(String[] args) {
        SpringApplication.run(FilmClubApplication.class, args);
    }
}
```

**File:** `Film.java` in package `com.riverside.filmclub`

```java
package com.riverside.filmclub;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Film {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private int releaseYear;

    protected Film() {
    }

    public String getTitle() {
        return title;
    }
}
```

**File:** `FilmRepository.java` in package `com.riverside.filmclub`

```java
package com.riverside.filmclub;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FilmRepository extends JpaRepository<Film, Long> {
}
```

**File:** `FilmRunner.java` in package `com.riverside.filmclub`

```java
package com.riverside.filmclub;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class FilmRunner implements CommandLineRunner {

    private final FilmRepository repository;

    public FilmRunner(FilmRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        System.out.println("Films in database: " + repository.count());
        repository.findAll().forEach(f -> System.out.println("- " + f.getTitle()));
    }
}
```

The output is:

```text
Films in database: 3
- Paper Boats
- Night Market
- The Last Ferry
```

### Medium: Visitor Log that Survives a Restart

The reception desk at Green Valley Hospital keeps a visitor log. Use H2 in *file* mode so the log survives a restart. Each time the app starts, it saves one new visit and prints how many visits the file holds in total. Run the app twice to prove that the data stayed.

> **Hint:** Use the URL `jdbc:h2:file:./data/visitors` and `ddl-auto=update`. With the default `create-drop`, the table would be rebuilt at every start, and the old rows would go away.

**Answer:** File mode writes the database to a file in the `data` folder next to where you run the app. `update` keeps the existing table, so the count grows by one on each run. Delete the `data` folder to start again.

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

    <groupId>com.greenvalley</groupId>
    <artifactId>visitorlog</artifactId>
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
spring.application.name=visitorlog
spring.datasource.url=jdbc:h2:file:./data/visitors
spring.datasource.username=sa
spring.jpa.hibernate.ddl-auto=update
```

**File:** `VisitorApplication.java` in package `com.greenvalley.visitorlog`

```java
package com.greenvalley.visitorlog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class VisitorApplication {

    public static void main(String[] args) {
        SpringApplication.run(VisitorApplication.class, args);
    }
}
```

**File:** `Visit.java` in package `com.greenvalley.visitorlog`

```java
package com.greenvalley.visitorlog;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Visit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate visitDate;

    protected Visit() {
    }

    public Visit(LocalDate visitDate) {
        this.visitDate = visitDate;
    }
}
```

**File:** `VisitRepository.java` in package `com.greenvalley.visitorlog`

```java
package com.greenvalley.visitorlog;

import org.springframework.data.jpa.repository.JpaRepository;

public interface VisitRepository extends JpaRepository<Visit, Long> {
}
```

**File:** `VisitRunner.java` in package `com.greenvalley.visitorlog`

```java
package com.greenvalley.visitorlog;

import java.time.LocalDate;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class VisitRunner implements CommandLineRunner {

    private final VisitRepository repository;

    public VisitRunner(VisitRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.save(new Visit(LocalDate.now()));
        System.out.println("Visits so far: " + repository.count());
    }
}
```

Run `mvn spring-boot:run` twice. The first run prints `Visits so far: 1`, and the second run prints:

```text
Visits so far: 2
```
