Try each problem on your own first. Both start from a Spring Boot 4.1.1 project with Java 21.

### Easy: FreshCart Picks Its Starters

FreshCart, an online grocery shop, needs a REST API that stores data with JPA in an H2 in-memory database. Choose the dependencies, then add `GET /db` that replies `Connected to H2`, using the database product name from the connection.

> **Hint:** You need the web starter, the JPA starter and the H2 driver. The driver is only needed while the app runs, so give it the `runtime` scope. Spring Boot creates a `DataSource` bean you can ask for in a constructor.

**Answer:** Two starters plus the H2 driver are enough; Spring Boot creates the in-memory database and the `DataSource` for you, with no settings.

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

    <groupId>com.freshcart</groupId>
    <artifactId>store</artifactId>
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

**File:** `StoreApplication.java` in package `com.freshcart.store`

```java
package com.freshcart.store;

import java.sql.Connection;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class StoreApplication {

    private final DataSource dataSource;

    public StoreApplication(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public static void main(String[] args) {
        SpringApplication.run(StoreApplication.class, args);
    }

    @GetMapping("/db")
    public String database() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            return "Connected to " + connection.getMetaData().getDatabaseProductName();
        }
    }
}
```

Calling `/db` prints `Connected to H2`. In the startup log you will also see Hibernate and the HikariCP connection pool start, both brought in by the JPA starter.

### Medium: ParkEasy Runs on Jetty

ParkEasy, a parking app, must run on the Jetty server instead of Tomcat because its hosting team only supports Jetty. It has one endpoint, `GET /lots/free`, returning `27`. Change `pom.xml` so Jetty starts instead of Tomcat, without changing any Java code.

> **Hint:** Use an `<exclusions>` block inside the web starter to remove `spring-boot-starter-tomcat`, then add `spring-boot-starter-jetty`. Check the startup log for the server name.

**Answer:** Exclude Tomcat's starter from the web starter and add Jetty's starter. Auto-configuration finds Jetty on the classpath and starts it.

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

    <groupId>com.parkeasy</groupId>
    <artifactId>lots</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-starter-tomcat</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jetty</artifactId>
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

**File:** `LotsApplication.java` in package `com.parkeasy.lots`

```java
package com.parkeasy.lots;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class LotsApplication {

    public static void main(String[] args) {
        SpringApplication.run(LotsApplication.class, args);
    }

    @GetMapping("/lots/free")
    public int freeSpots() {
        return 27;
    }
}
```

The startup log now says `Jetty started on port 8080` instead of Tomcat, and `/lots/free` still returns `27`. If you look at `./mvnw dependency:tree`, the Tomcat server is gone; one small Tomcat library, `tomcat-embed-el`, remains because the Jetty starter itself uses it for expressions.
