Think about a new phone that comes with a travel kit: a charger, a cable, a case and earphones, all tested with that phone. You do not hunt for each item separately and hope they fit. You pick up one box and everything works together. Spring Boot starters are those kits. Instead of listing ten libraries and their versions, you add one starter and get a matched set.

In this guide you will see what a starter really contains, how to choose the right ones, how to swap one piece of a kit, and the naming rules that tell official starters apart from community ones.

## What is a Spring Boot starter?

> **Definition:** A starter is a small dependency that has almost no code of its own. Its job is to pull in a tested group of libraries for one task, such as building a web app or talking to a database.

When you add `spring-boot-starter-webmvc`, Maven reads that starter's own build file and downloads what it lists: the core Spring Boot starter, JSON support, the Tomcat server and the Spring MVC libraries. Each of those brings its own libraries in turn. One line in your `pom.xml` becomes more than thirty JAR files, and you never typed a version number.

## Why is it used?

Before starters, every project had the same painful chores:

- **Finding the right libraries.** Which JSON library? Which validation engine? Which logging bridge?
- **Matching versions.** A new Spring version needed a matching Hibernate version, which needed a matching driver version.
- **Copying setups.** Teams pasted long dependency lists from old projects and carried old mistakes along.

Starters fix all three. The Spring Boot team decides which libraries belong together and tests them as a set for every release. Combined with the starter parent, which fixes the versions, you get a working stack by naming a feature instead of a list of jars.

## How it works

Here is a simplified view of what one starter pulls in for a web app.

```text
spring-boot-starter-webmvc
  |
  +--> spring-boot-starter
  |      (logging, auto-config)
  |
  +--> spring-boot-starter-jackson
  |      (JSON in and out)
  |
  +--> spring-boot-starter-tomcat
  |      (embedded web server)
  |
  +--> spring-boot-webmvc
         (Spring MVC setup)
```

The web starter points at other starters, and those point at the real libraries. `spring-boot-starter` is the base that every other starter includes; it brings logging, YAML support and auto-configuration. Because the pieces arrive together, auto-configuration can safely assume that if Tomcat is present, it should start Tomcat.

## Real-Life Example

A food delivery kitchen buys spices as ready masala blends: one packet for biryani, one for chole, one for sambar. Each blend holds a dozen spices in the right amounts. The cook still controls the dish, and can even take one spice out of a blend if a customer is allergic. Starters are those blends, and later in this guide you will see how to take one ingredient out.

## Common Starters

| Starter | Use it for |
|---|---|
| `spring-boot-starter-webmvc` | REST APIs and web apps with Tomcat |
| `spring-boot-starter-data-jpa` | Databases through JPA and Hibernate |
| `spring-boot-starter-validation` | Checking input with annotations |
| `spring-boot-starter-security` | Login and access rules |
| `spring-boot-starter-actuator` | Health checks and metrics |
| `spring-boot-starter-mail` | Sending email |
| `spring-boot-starter-test` | JUnit 6, Mockito and AssertJ for tests |

In Spring Boot 4 most starters also have a matching test starter whose name ends in `-test`, such as the one that pairs with the web starter. Spring Initializr adds the right one for you.

> **Note:** Coming from Spring Boot 3? The old web starter, `spring-boot-starter-web`, still exists in Spring Boot 4.1 but is marked deprecated in favour of `spring-boot-starter-webmvc`. Use the new name in new projects.

## How to Choose Starters

Start from the features your app needs, not from a list of libraries. Ask simple questions. Does it serve a REST API? Add the web starter. Does it save data in a relational database? Add the JPA starter plus the driver for your database. Does it need a login? Add the security starter. The search box on Spring Initializr is a good way to discover the right name. Add only what you use today; adding a starter later takes one line. When in doubt, read `./mvnw dependency:tree` to see exactly what a starter brought in.

## Code Example

Let's build PageTurn, a small bookstore API, with two starters: one for the web layer and one for health checks.

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
    <artifactId>books</artifactId>
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
            <artifactId>spring-boot-starter-actuator</artifactId>
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

**File:** `BooksApplication.java` in package `com.pageturn.books`

```java
package com.pageturn.books;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class BooksApplication {

    record Book(String title, int copiesLeft) {}

    public static void main(String[] args) {
        SpringApplication.run(BooksApplication.class, args);
    }

    @GetMapping("/books/bestseller")
    public Book bestseller() {
        return new Book("Letters from the Hill Station", 12);
    }
}
```

Run it and call both addresses:

```bash
./mvnw spring-boot:run
curl http://localhost:8080/books/bestseller
curl http://localhost:8080/actuator/health
```

**Output:**

```json
{
  "title": "Letters from the Hill Station",
  "copiesLeft": 12
}
```

The first call returns the book above, spaced out here for reading. The second returns a health reply containing `"status":"UP"`, although we wrote no code for it at all.

## Code Explained

- The two `<dependency>` entries are the only libraries we asked for, and neither has a version. The parent supplies matching versions.
- `spring-boot-starter-webmvc` brought Tomcat, Spring MVC and Jackson, which is why the record turns into JSON.
- `spring-boot-starter-actuator` brought the health endpoint. Adding a starter is often all it takes to switch a feature on.
- Run `./mvnw dependency:tree` in this project and you will see every library each starter pulled in, indented under it.

## Swapping a Piece of a Starter

Sometimes you want a kit minus one item. The classic case is replacing Tomcat with the Jetty server. You exclude Tomcat's starter from the web starter and add Jetty's starter instead. Spring Boot notices Jetty on the classpath and starts it, with no Java code changes. The practice problems below walk you through it.

## Common Mistakes

> **Warning:** Do not add the libraries a starter already brings, such as Jackson or Tomcat, as separate dependencies with their own versions. You end up with two versions of the same library and confusing runtime errors.

- **Adding a starter "just in case".** Every starter can switch on auto-configuration. An unused data starter may even stop your app from starting because it expects a database.
- **Using a community starter without checking it.** Starters named `something-spring-boot-starter` come from other projects, not the Spring team. Check that they support Spring Boot 4.
- **Forgetting the test starter.** Without it, `@SpringBootTest` and Mockito are missing when you write tests.

## Interview Questions

**What is a Spring Boot starter?**
A dependency descriptor that pulls in a tested group of libraries for one purpose, so you add one dependency instead of many.

**How do you tell an official starter from a third-party one?**
Official starters are named `spring-boot-starter-*`. Third-party ones put their project name first, like `mybatis-spring-boot-starter`.

**How would you use Jetty instead of Tomcat?**
Exclude `spring-boot-starter-tomcat` from the web starter and add `spring-boot-starter-jetty`.

## Key Points to Remember

- A starter is a small dependency that brings a matched set of libraries for one task.
- `spring-boot-starter` is the base; the other starters include it.
- Starters need no version with the Spring Boot parent in place.
- In Spring Boot 4 the web starter is `spring-boot-starter-webmvc`.
- Exclusions let you remove one part of a starter, such as swapping Tomcat for Jetty.

## Frequently Asked Questions

### How many starters does Spring Boot have?

Dozens. Spring Boot 4.1 manages well over a hundred starter artifacts once you count the matching test starters. In daily work you will use about ten of them.

### Can I create my own starter?

Yes. Companies often build an internal starter that bundles their common libraries and settings, so every service starts from the same base.

### Why is my project so large when I added only two starters?

Each starter brings everything its feature needs, including a web server. That is the trade-off for not managing dozens of libraries yourself.

### Does adding a starter change my code?

Usually not. Most starters only add libraries, and auto-configuration sets them up with sensible defaults.

## Related Topics

- [Auto Configuration](/learning/spring-boot-tutorial/auto-configuration): how Spring Boot sets up what your starters brought in.
- [Maven pom.xml Explained](/learning/spring-boot-tutorial/maven-pom-xml-explained): where starters are declared.
- [Spring Boot Actuator](/learning/spring-boot-tutorial/spring-boot-actuator): the health and metrics starter in depth.
