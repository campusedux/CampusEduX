Try each problem on your own first. Each project has its own `pom.xml`, shown below.

### Easy: Bookshop Catalogue on MySQL

Lakeview Books wants its catalogue in a MySQL database named `bookshop` on the local server. Build a Spring Boot app with an entity `Book` (title and price), a repository, and a runner that saves two books and prints them all. Read the user and password from the environment variables `DB_USER` and `DB_PASSWORD`.

> **Hint:** Add `mysql-connector-j` with runtime scope. Put the `jdbc:mysql:` URL for the local server on port 3306, and two placeholders, `${DB_USER}` and `${DB_PASSWORD}`, in `application.properties`.

**Answer:** Only the driver and three datasource properties are MySQL-specific. The entity and repository look the same as for any other database.

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

    <groupId>com.lakeview</groupId>
    <artifactId>bookshop</artifactId>
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
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
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
spring.application.name=bookshop
spring.datasource.url=jdbc:mysql://localhost:3306/bookshop
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
```

**File:** `BookshopApplication.java` in package `com.lakeview.bookshop`

```java
package com.lakeview.bookshop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BookshopApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookshopApplication.class, args);
    }
}
```

**File:** `Book.java` in package `com.lakeview.bookshop`

```java
package com.lakeview.bookshop;

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
    private int price;

    protected Book() {
    }

    public Book(String title, int price) {
        this.title = title;
        this.price = price;
    }

    @Override
    public String toString() {
        return id + ": " + title + " Rs " + price;
    }
}
```

**File:** `BookRepository.java` in package `com.lakeview.bookshop`

```java
package com.lakeview.bookshop;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {
}
```

**File:** `CatalogueRunner.java` in package `com.lakeview.bookshop`

```java
package com.lakeview.bookshop;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CatalogueRunner implements CommandLineRunner {

    private final BookRepository repository;

    public CatalogueRunner(BookRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.save(new Book("River of Stories", 350));
        repository.save(new Book("Night Train to Pune", 275));
        repository.findAll().forEach(System.out::println);
    }
}
```

With MySQL running and the two variables set, typical output on a fresh database is below. It was not run against MySQL here, only built.

```text
1: River of Stories Rs 350
2: Night Train to Pune Rs 275
```

### Medium: H2 for Development, MySQL for Production

Mithai Mahal, a sweet shop, wants to develop on H2 but deploy on MySQL. Build one app that keeps both drivers, picks its database with a Spring profile, and starts with the `dev` profile by default. The runner should save two sweets, print them, and print which database type is in use.

> **Hint:** Use `application-dev.properties` for H2 and `application-prod.properties` for MySQL. In `application.properties`, set `spring.profiles.active=dev`. Read the URL with an `@Value` parameter in the constructor, and split it at the colon.

**Answer:** Spring loads `application.properties` first, then the file for the active profile. To go live, start the app with `--spring.profiles.active=prod`, and the MySQL file takes over.

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

    <groupId>com.mithai</groupId>
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
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
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
spring.application.name=sweetshop
spring.profiles.active=dev
```

**File:** `application-dev.properties` in `src/main/resources`

```properties
spring.datasource.url=jdbc:h2:mem:sweets
spring.datasource.username=sa
spring.jpa.hibernate.ddl-auto=create-drop
```

**File:** `application-prod.properties` in `src/main/resources`

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/sweets
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
```

**File:** `ShopApplication.java` in package `com.mithai.shop`

```java
package com.mithai.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}
```

**File:** `Sweet.java` in package `com.mithai.shop`

```java
package com.mithai.shop;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Sweet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int pricePerKg;

    protected Sweet() {
    }

    public Sweet(String name, int pricePerKg) {
        this.name = name;
        this.pricePerKg = pricePerKg;
    }

    @Override
    public String toString() {
        return id + ": " + name + " Rs " + pricePerKg + "/kg";
    }
}
```

**File:** `SweetRepository.java` in package `com.mithai.shop`

```java
package com.mithai.shop;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SweetRepository extends JpaRepository<Sweet, Long> {
}
```

**File:** `SweetRunner.java` in package `com.mithai.shop`

```java
package com.mithai.shop;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SweetRunner implements CommandLineRunner {

    private final SweetRepository repository;
    private final String url;

    public SweetRunner(SweetRepository repository,
                       @Value("${spring.datasource.url}") String url) {
        this.repository = repository;
        this.url = url;
    }

    @Override
    public void run(String... args) {
        repository.save(new Sweet("Kaju Katli", 900));
        repository.save(new Sweet("Jalebi", 320));
        repository.findAll().forEach(System.out::println);
        System.out.println("Database type: " + url.split(":")[1]);
    }
}
```

Run `mvn spring-boot:run` and the dev profile uses H2:

```text
1: Kaju Katli Rs 900/kg
2: Jalebi Rs 320/kg
Database type: h2
```

With MySQL running and the two variables set, start it with `--spring.profiles.active=prod` and the last line becomes `Database type: mysql`.
