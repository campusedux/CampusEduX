When a cafe owner sketches a new menu, she does not print it on glossy paper. She writes it on a whiteboard first. Changing a price takes one wipe, and nothing is wasted. When she is happy, she orders the real printed menu. An in-memory database plays the whiteboard role for a developer. It is fast, it needs no setup, and it disappears when you are done.

The H2 in-memory database is the most popular choice for this job in Java. In this topic you will learn what it is, where it fits, how to fill it with starting data, and how to open its web console.

## What is the H2 in-memory database?

H2 is a small, fast relational database written in Java. It runs *inside* your application's own process. There is nothing to install and no server to start. In "in-memory mode", H2 keeps all tables in RAM, so everything is gone the moment the app stops.

> **Definition:** H2 is a lightweight, open-source relational database written in Java. In in-memory mode it stores its data in RAM and loses it when the application ends.

H2 can also work in "file mode", where it saves data to a file on disk, so it survives a restart. But most Spring Boot developers use the in-memory mode for learning, demos and tests.

## Why is it used?

- **Zero setup.** Add one dependency and the database exists. A new teammate can run the project in minutes.
- **Fast tests.** Tests start with a clean database every time, so they do not depend on each other.
- **Safe practice.** You cannot damage real data, because there is none.
- **Quick prototypes.** You can shape your entities first and choose the real database later.

But H2 is not meant for production. When the app restarts, the data vanishes. Its SQL also differs slightly from MySQL and PostgreSQL, so a query that works on H2 may fail on the real database. Use H2 for learning and tests, and use a server database for real users.

> **Note:** If H2 is on the classpath and you set no datasource URL, Spring Boot creates an embedded H2 database by itself. That is why the first topics in this section needed no database settings.

## How it works

Spring Boot notices H2 and builds everything around it.

```text
h2 jar found on classpath
        |
        v
No datasource URL set?
        |
        v
Spring Boot starts embedded H2
        |
        v
Hibernate creates the tables
        |
        v
data.sql adds starting rows
        |
        v
App runs; data lives in RAM
```

Because there is no URL, Spring Boot starts an embedded H2 database on its own and gives it a user called `sa`. Hibernate then creates your tables from the entities. If a `data.sql` file exists, its statements run next. When the app stops, the whole database disappears with it.

Now see how you can look inside while the app runs.

```text
Browser: /h2-console
        |
        v
H2 console page (in your app)
        |
        v
Login with the same JDBC URL
        |
        v
Read tables, run SQL
```

The H2 console is a small web page that lives inside your own app. You open it in a browser, log in with the same JDBC URL your app uses, and you can browse tables and run SQL. It is a handy microscope for development.

## Real-Life Example

Think about a driving school. Before students drive on real roads, they practise on a simulator. The simulator looks like a road and reacts like one, so students learn the controls. But if they crash, nobody is hurt, and the simulator resets in seconds. H2 is your simulator. You can crash it, reset it and try again. Just remember that a simulator is not a real road, so you still do a final test on the real database before your users arrive.

## Code Example

Let's build a menu service for a cafe called Brew Corner. The app uses H2, fills the menu from a `data.sql` file, shows it at `/menu`, and switches on the H2 console.

```text
brew-menu/
├─ pom.xml
└─ src/main/
   ├─ java/com/brewcorner/menu/
   │  ├─ MenuApplication.java
   │  ├─ MenuItem.java
   │  ├─ MenuItemRepository.java
   │  └─ MenuController.java
   └─ resources/
      ├─ application.properties
      └─ data.sql
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

    <groupId>com.brewcorner</groupId>
    <artifactId>menu</artifactId>
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
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-h2console</artifactId>
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

Spring Boot 4 moved the console into its own library, `spring-boot-h2console`, so it must be added on purpose.

**File:** `MenuApplication.java` in package `com.brewcorner.menu`

```java
package com.brewcorner.menu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MenuApplication {

    public static void main(String[] args) {
        SpringApplication.run(MenuApplication.class, args);
    }
}
```

**File:** `MenuItem.java` in package `com.brewcorner.menu`

```java
package com.brewcorner.menu;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int price;

    protected MenuItem() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getPrice() {
        return price;
    }
}
```

**File:** `MenuItemRepository.java` in package `com.brewcorner.menu`

```java
package com.brewcorner.menu;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
}
```

**File:** `MenuController.java` in package `com.brewcorner.menu`

```java
package com.brewcorner.menu;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MenuController {

    private final MenuItemRepository repository;

    public MenuController(MenuItemRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/menu")
    public List<MenuItem> menu() {
        return repository.findAll();
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.application.name=brew-menu
spring.datasource.url=jdbc:h2:mem:cafe
spring.datasource.username=sa
spring.jpa.defer-datasource-initialization=true
spring.h2.console.enabled=true
```

**File:** `data.sql` in `src/main/resources`

```sql
INSERT INTO menu_item (name, price) VALUES ('Filter Coffee', 60);
INSERT INTO menu_item (name, price) VALUES ('Masala Chai', 30);
INSERT INTO menu_item (name, price) VALUES ('Veg Sandwich', 90);
```

Start the app, then call the menu from a second terminal:

```bash
mvn spring-boot:run
curl http://localhost:8080/menu
```

**Output:**

```json
[
  {
    "id": 1,
    "name": "Filter Coffee",
    "price": 60
  },
  {
    "id": 2,
    "name": "Masala Chai",
    "price": 30
  },
  {
    "id": 3,
    "name": "Veg Sandwich",
    "price": 90
  }
]
```

The reply comes back on one line. It is spaced out here so it is easy to read. Open the `/h2-console` path of your running app in a browser, enter the JDBC URL `jdbc:h2:mem:cafe` and user `sa` with an empty password, and you can run `SELECT * FROM menu_item`.

## Code Explained

- The `h2` dependency has runtime scope. Spring Boot needs it on the classpath, and your code never imports it.
- The datasource URL `jdbc:h2:mem:cafe` names the in-memory database `cafe`. A fixed name lets you type the same URL into the console.
- The deferred-initialization property in the `spring.jpa` group tells Spring Boot to run `data.sql` after Hibernate has created the tables. Without it, the inserts run first and fail, because the table does not exist yet.
- `data.sql` sits in `src/main/resources`, and Spring Boot runs it at every startup.
- `spring.h2.console.enabled=true` switches on the web console, and `spring-boot-h2console` supplies it.
- Hibernate creates the table `menu_item` from the entity, because an embedded database gets `create-drop` by default.

## Choosing an H2 URL

| Mode | URL | Data after restart |
|---|---|---|
| In memory | `jdbc:h2:mem:cafe` | Lost |
| File on disk | `jdbc:h2:file:./data/cafe` | Kept |
| In memory, MySQL style | `jdbc:h2:mem:cafe;MODE=MySQL` | Lost |

## Common Mistakes

> **Warning:** Never switch the H2 console on in production, and never open it to the internet. Anyone who reaches it can run SQL against your data.

- **`data.sql` fails with "table not found".** Turn on the deferred-initialization property in the `spring.jpa` group, so Hibernate builds the tables first.
- **Console cannot find the database.** The URL in the login page must be exactly the URL in your properties. With a random name, copy it from the startup log.
- **Trusting H2 as a full copy of production.** Test important queries on the real database too, because the SQL dialects differ.
- **Console page missing.** In Spring Boot 4, the `spring-boot-h2console` library must be on the classpath, along with the web starter.

## Interview Questions

**What is an in-memory database, and when do you use one?**
It keeps data in RAM and loses it on shutdown. Developers use it for learning, demos and fast automated tests.

**What does Spring Boot do when H2 is on the classpath and no URL is given?**
It starts an embedded H2 database, creates a default user `sa`, and lets Hibernate create the tables.

**Why does `data.sql` sometimes fail?**
It can run before Hibernate creates the tables. Turning on the deferred-initialization property in the `spring.jpa` group fixes the order.

## Key Points to Remember

- H2 is a Java database that runs inside your app. In memory mode it forgets everything at shutdown.
- Spring Boot configures an embedded H2 by itself when no datasource URL is set.
- `data.sql` adds starting rows, and it needs the deferred-initialization property when Hibernate builds the tables.
- The console needs the `spring-boot-h2console` library in Spring Boot 4 and a property to enable it.
- H2 suits practice and tests. Use MySQL or PostgreSQL for production.

## Frequently Asked Questions

### Why does my data disappear from the H2 in-memory database on restart?

That is how in-memory mode works. To keep data, use a file URL like `jdbc:h2:file:./data/cafe`, or move to a real database server.

### Can I use H2 for tests and MySQL for the real app?

Yes, and many teams do. Keep the H2 driver on the test scope, but remember to check key queries against the real database as well.

### What is the default H2 username and password?

The user is `sa` and the password is empty. That is fine for a throwaway local database and never for anything real.

### Is H2 the same as SQLite?

No. Both are small databases, but H2 is written in Java and runs inside your JVM, while SQLite is a C library that stores data in one file.

## Related Topics

- [Connecting Spring Boot to MySQL](/learning/spring-boot-tutorial/connecting-spring-boot-to-mysql): move from H2 to a real server.
- [JPA Entity](/learning/spring-boot-tutorial/jpa-entity): shape the classes that become tables.
- [Data JPA Test](/learning/spring-boot-tutorial/data-jpa-test): use an in-memory database in fast repository tests.
- [Spring Profiles](/learning/spring-boot-tutorial/spring-profiles): switch databases per environment.
