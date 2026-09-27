Try each problem on your own first. Both use the H2 in-memory database, so nothing needs to be installed.

### Easy: Retire a Movie

CineGo retires old movies with a soft delete. Save three movies, delete one, and print how many `findAll()` returns and how many rows the table still has.

> **Hint:** Add a `deleted` boolean field, `@SQLDelete` with an update statement, and `@SQLRestriction("deleted = false")`. Count the table rows with `JdbcTemplate`.

**Answer:** The entity carries both annotations. `delete` becomes an update, so the table keeps all three rows while `findAll()` shows two.

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

    <groupId>com.cinego</groupId>
    <artifactId>movies</artifactId>
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

**File:** `Movie.java` in package `com.cinego.movies`

```java
package com.cinego.movies;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@SQLDelete(sql = "update movie set deleted = true where id = ?")
@SQLRestriction("deleted = false")
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private boolean deleted = false;

    protected Movie() {
    }

    public Movie(String title) {
        this.title = title;
    }
}
```

**File:** `MovieRepository.java` in package `com.cinego.movies`

```java
package com.cinego.movies;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieRepository extends JpaRepository<Movie, Long> {
}
```

**File:** `MoviesApplication.java` in package `com.cinego.movies`

```java
package com.cinego.movies;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class MoviesApplication {

    public static void main(String[] args) {
        SpringApplication.run(MoviesApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(MovieRepository movies, JdbcTemplate jdbc) {
        return args -> {
            Movie old = movies.save(new Movie("Old Classic"));
            movies.save(new Movie("The Silent Orbit"));
            movies.save(new Movie("Monsoon Express"));
            movies.delete(old);
            System.out.println("Visible: " + movies.findAll().size());
            System.out.println("In table: " + jdbc.queryForObject(
                    "select count(*) from movie", Integer.class));
        };
    }
}
```

Running the app prints:

```text
Visible: 2
In table: 3
```

### Medium: Hide and Restore Comments

A blog hides comments that break the rules. Use Hibernate's single `@SoftDelete` annotation on a `Comment` entity. Save two comments, delete one, print the visible count, then restore it with a native update and print the count again.

> **Hint:** `@SoftDelete` comes from `org.hibernate.annotations`. By default it adds a boolean column named `deleted`, so you do not declare the field yourself. Restore with `update comment set deleted = false where id = ?`.

**Answer:** One annotation replaces both `@SQLDelete` and `@SQLRestriction`, and Hibernate manages the column. The native update flips the hidden flag back.

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

    <groupId>com.storynest</groupId>
    <artifactId>blog</artifactId>
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

**File:** `Comment.java` in package `com.storynest.blog`

```java
package com.storynest.blog;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import org.hibernate.annotations.SoftDelete;

@Entity
@SoftDelete
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String text;

    protected Comment() {
    }

    public Comment(String text) {
        this.text = text;
    }

    public Long getId() {
        return id;
    }
}
```

**File:** `CommentRepository.java` in package `com.storynest.blog`

```java
package com.storynest.blog;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
}
```

**File:** `BlogApplication.java` in package `com.storynest.blog`

```java
package com.storynest.blog;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class BlogApplication {

    public static void main(String[] args) {
        SpringApplication.run(BlogApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(CommentRepository comments, JdbcTemplate jdbc) {
        return args -> {
            Comment rude = comments.save(new Comment("Rude remark"));
            comments.save(new Comment("Nice story"));
            comments.delete(rude);
            System.out.println("Visible: " + comments.findAll().size());

            jdbc.update("update comment set deleted = false where id = ?", rude.getId());
            System.out.println("Restored: " + comments.findAll().size());
        };
    }
}
```

Running the app prints:

```text
Visible: 1
Restored: 2
```
