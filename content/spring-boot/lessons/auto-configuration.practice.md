Try each problem on your own first. Both start from a Spring Boot 4.1.1 web project (`spring-boot-starter-webmvc`) with Java 21.

### Easy: MovieNight Promo Banner Switch

MovieNight, a cinema chain, wants a promo banner that marketing can switch on and off without a code change. When `promo.banner.enabled=true` is set, `GET /promo` returns `Free popcorn with every ticket this Friday`. Without it, the same endpoint returns `No offers today`.

> **Hint:** Create the banner bean with `@ConditionalOnProperty`, the same condition auto-configuration uses. In the controller, ask for an `ObjectProvider` of the banner, so the controller still works when the bean does not exist.

**Answer:** The bean is created only when the property is `true`, and `getIfAvailable()` on the `ObjectProvider` returns `null` when it is missing.

**File:** `PromoApplication.java` in package `com.movienight.promo`

```java
package com.movienight.promo;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class PromoApplication {

    private final ObjectProvider<PromoBanner> banner;

    public PromoApplication(ObjectProvider<PromoBanner> banner) {
        this.banner = banner;
    }

    public static void main(String[] args) {
        SpringApplication.run(PromoApplication.class, args);
    }

    @GetMapping("/promo")
    public String promo() {
        PromoBanner current = banner.getIfAvailable();
        return current == null ? "No offers today" : current.text();
    }
}
```

**File:** `PromoBanner.java` in package `com.movienight.promo`

```java
package com.movienight.promo;

public record PromoBanner(String text) {
}
```

**File:** `PromoConfig.java` in package `com.movienight.promo`

```java
package com.movienight.promo;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PromoConfig {

    @Bean
    @ConditionalOnProperty(name = "promo.banner.enabled", havingValue = "true")
    public PromoBanner promoBanner() {
        return new PromoBanner("Free popcorn with every ticket this Friday");
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
promo.banner.enabled=true
```

With the property set, `/promo` returns the popcorn offer. Delete the line or set it to `false`, restart, and `/promo` returns `No offers today`.

### Medium: RailGo Starts Without a Database

RailGo's train-ticket service shares a company parent POM, so it already has `spring-boot-starter-jdbc` and the H2 driver, and Spring Boot quietly creates an in-memory database. The team does not want any database until next month. Switch off the `DataSource` auto-configuration with a property, and add `GET /db/status` that replies `Database ready` when a `DataSource` exists and `No database configured` when it does not.

> **Hint:** Use `spring.autoconfigure.exclude` with the full class name. In Spring Boot 4 the class is `DataSourceAutoConfiguration`, in the `autoconfigure` package under `org.springframework.boot.jdbc`. Use `ObjectProvider<DataSource>` so the controller works either way.

**Answer:** The exclusion stops Spring Boot from creating the `DataSource`; the jdbc beans that depend on it are skipped too, and the app starts normally.

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

    <groupId>com.railgo</groupId>
    <artifactId>tickets</artifactId>
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
            <artifactId>spring-boot-starter-jdbc</artifactId>
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
spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration
```

**File:** `TicketsApplication.java` in package `com.railgo.tickets`

```java
package com.railgo.tickets;

import javax.sql.DataSource;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class TicketsApplication {

    private final ObjectProvider<DataSource> dataSource;

    public TicketsApplication(ObjectProvider<DataSource> dataSource) {
        this.dataSource = dataSource;
    }

    public static void main(String[] args) {
        SpringApplication.run(TicketsApplication.class, args);
    }

    @GetMapping("/db/status")
    public String databaseStatus() {
        return dataSource.getIfAvailable() == null ? "No database configured" : "Database ready";
    }
}
```

With the exclusion, `/db/status` returns `No database configured`, and the `--debug` report lists the class under Exclusions. Remove the property line and it returns `Database ready`, because Spring Boot creates an H2 database again.
