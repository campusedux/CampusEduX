Try each problem on your own first. Each project has its own `pom.xml`, shown below. Create the databases `cinema` and `hospital` in PostgreSQL first, and let your user own them.

### Easy: Cinema Shows on PostgreSQL

Star Screen cinema wants its show timings stored in PostgreSQL. Build an app with an entity `Show` (movie name and start time as text), a repository, and a runner that saves two shows and prints all shows back. The database is called `cinema`, on the local server and the default port.

> **Hint:** `Show` is not a reserved word in Hibernate, but call the table class `Show` and the fields `movie` and `startTime`. Read the login from `DB_USER` and `DB_PASSWORD`.

**Answer:** The driver and the URL are the only PostgreSQL parts. The rest is a normal entity, repository and runner.

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

    <groupId>com.starscreen</groupId>
    <artifactId>cinema</artifactId>
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
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
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
spring.application.name=cinema
spring.datasource.url=jdbc:postgresql://localhost:5432/cinema
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
```

**File:** `CinemaApplication.java` in package `com.starscreen.cinema`

```java
package com.starscreen.cinema;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CinemaApplication {

    public static void main(String[] args) {
        SpringApplication.run(CinemaApplication.class, args);
    }
}
```

**File:** `Show.java` in package `com.starscreen.cinema`

```java
package com.starscreen.cinema;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Show {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String movie;
    private String startTime;

    protected Show() {
    }

    public Show(String movie, String startTime) {
        this.movie = movie;
        this.startTime = startTime;
    }

    @Override
    public String toString() {
        return id + ": " + movie + " at " + startTime;
    }
}
```

**File:** `ShowRepository.java` in package `com.starscreen.cinema`

```java
package com.starscreen.cinema;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ShowRepository extends JpaRepository<Show, Long> {
}
```

**File:** `ShowRunner.java` in package `com.starscreen.cinema`

```java
package com.starscreen.cinema;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ShowRunner implements CommandLineRunner {

    private final ShowRepository repository;

    public ShowRunner(ShowRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.save(new Show("The Silent Orbit", "18:30"));
        repository.save(new Show("Monsoon Express", "21:15"));
        repository.findAll().forEach(System.out::println);
    }
}
```

On a fresh database the output is:

```text
1: The Silent Orbit at 18:30
2: Monsoon Express at 21:15
```

### Medium: Hospital Connection Check and Pool Size

City Care Hospital wants a health check at startup. Connect to a PostgreSQL database named `hospital`, limit the connection pool to 5 connections, and print the database product name, its major version, and the pool size that is really in use.

> **Hint:** In the `spring.datasource.hikari` group, set `maximum-pool-size` to 5. Inject the `DataSource`, open a connection with try-with-resources, and call `getMetaData()`. The pool object is a `HikariDataSource`.

**Answer:** Spring Boot creates a `HikariDataSource`, so a pattern-matching `instanceof` gives you its settings. Your major version may differ from the one printed below.

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

    <groupId>com.citycare</groupId>
    <artifactId>healthcheck</artifactId>
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
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
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
spring.application.name=healthcheck
spring.datasource.url=jdbc:postgresql://localhost:5432/hospital
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.hikari.maximum-pool-size=5
```

**File:** `HealthApplication.java` in package `com.citycare.healthcheck`

```java
package com.citycare.healthcheck;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HealthApplication {

    public static void main(String[] args) {
        SpringApplication.run(HealthApplication.class, args);
    }
}
```

**File:** `ConnectionCheck.java` in package `com.citycare.healthcheck`

```java
package com.citycare.healthcheck;

import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ConnectionCheck implements CommandLineRunner {

    private final DataSource dataSource;

    public ConnectionCheck(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            var meta = connection.getMetaData();
            System.out.println("Database: " + meta.getDatabaseProductName());
            System.out.println("Major version: " + meta.getDatabaseMajorVersion());
        }
        if (dataSource instanceof HikariDataSource pool) {
            System.out.println("Pool size: " + pool.getMaximumPoolSize());
        }
    }
}
```

The output is:

```text
Database: PostgreSQL
Major version: 17
Pool size: 5
```
