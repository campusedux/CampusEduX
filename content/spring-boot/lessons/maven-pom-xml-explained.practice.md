Try each problem on your own first, then compare with the answer.

### Easy: TicketDesk Build Is Broken

A teammate wrote this `pom.xml` for a TicketDesk support service, which has `GET /tickets/open` returning `5`. Running `./mvnw package` stops with an error saying the version for `spring-boot-starter-webmvc` is missing. Fix the file.

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.ticketdesk</groupId>
    <artifactId>support</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
        </dependency>
    </dependencies>
</project>
```

> **Hint:** Who normally supplies the version of a Spring Boot starter? Also check how the app would be packaged and which Java version it targets.

**Answer:** The `spring-boot-starter-parent` is missing, so nothing supplies the starter's version. Add the parent, set `java.version`, and add `spring-boot-maven-plugin` so the JAR is runnable.

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

    <groupId>com.ticketdesk</groupId>
    <artifactId>support</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
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

**File:** `SupportApplication.java` in package `com.ticketdesk.support`

```java
package com.ticketdesk.support;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class SupportApplication {

    public static void main(String[] args) {
        SpringApplication.run(SupportApplication.class, args);
    }

    @GetMapping("/tickets/open")
    public int openTickets() {
        return 5;
    }
}
```

Now `./mvnw package` ends with `BUILD SUCCESS`, and calling `/tickets/open` prints `5`.

### Medium: FoodRush Health Check and JAR Name

FoodRush, a food delivery service, has `GET /orders/pending` returning `8`. The operations team asks for two changes in `pom.xml` only:

- The build must produce `target/foodrush.jar`, with no version in the file name.
- The app must answer health checks at `/actuator/health`.

> **Hint:** The JAR name comes from `finalName` inside `build`. Health checks come from the `spring-boot-starter-actuator` starter, which needs no version with the parent in place.

**Answer:** Add the Actuator starter to the dependencies and set `finalName`. No Java code changes are needed for the health endpoint.

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

    <groupId>com.foodrush</groupId>
    <artifactId>delivery</artifactId>
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
        <finalName>foodrush</finalName>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

**File:** `DeliveryApplication.java` in package `com.foodrush.delivery`

```java
package com.foodrush.delivery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class DeliveryApplication {

    public static void main(String[] args) {
        SpringApplication.run(DeliveryApplication.class, args);
    }

    @GetMapping("/orders/pending")
    public int pendingOrders() {
        return 8;
    }
}
```

After `./mvnw package`, run `java -jar target/foodrush.jar`, then call `/actuator/health`. It replies:

```json
{
  "groups": ["liveness", "readiness"],
  "status": "UP"
}
```

The important part is `"status": "UP"`, spaced out here for reading; the Actuator topic explains the groups.
