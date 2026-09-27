These problems need the JAR built with `mvn clean package` before `docker build`. Each has its own `pom.xml`.

### Easy: Bakery Hours in a Container

SweetCrumb Bakery has a tiny Spring Boot service with `GET /hours` returning `Open 7 AM to 9 PM`. Write a simple one-stage `Dockerfile` for it: start from a Java 21 runtime image, copy the JAR, expose port 8080 and start the app.

> **Hint:** You need four instructions: `FROM`, `COPY`, `EXPOSE` and `ENTRYPOINT`. The JAR name is the artifact id plus the version, `hours-0.0.1-SNAPSHOT.jar`.

**Answer:** A one-stage Dockerfile is enough when you do not need layers. Build with `docker build -t bakery-hours .` and run with `docker run -p 8080:8080 bakery-hours`.

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

    <groupId>com.sweetcrumb</groupId>
    <artifactId>hours</artifactId>
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

**File:** `HoursApplication.java` in package `com.sweetcrumb.hours`

```java
package com.sweetcrumb.hours;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class HoursApplication {

    public static void main(String[] args) {
        SpringApplication.run(HoursApplication.class, args);
    }

    @GetMapping("/hours")
    public String hours() {
        return "Open 7 AM to 9 PM";
    }
}
```

**File:** `Dockerfile`

```dockerfile
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/hours-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

After the container starts, `curl http://localhost:8080/hours` returns `Open 7 AM to 9 PM`.

### Medium: Festival Greeting with Compose

TiffinBox shows a greeting at `GET /greeting`. Normally it says `Welcome to TiffinBox`. When the Spring profile `diwali` is active it says `Happy Diwali from TiffinBox`. Write a `compose.yaml` that builds the image from the current folder, maps host port 9090 to container port 8080, and switches on the `diwali` profile through a variable set on the container. Reuse the same kind of `Dockerfile` as above.

> **Hint:** Put the greeting in `application.properties` and override it in `application-diwali.properties`. Spring Boot reads a variable named `SPRING_PROFILES_ACTIVE` as the active profile. In Compose, list it under the service's `environment` key.

**Answer:** The profile file overrides the default text when the profile is active. Compose sets the variable, so the same image says "Welcome" without it and "Happy Diwali" with it.

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

    <groupId>com.tiffinbox</groupId>
    <artifactId>greeting</artifactId>
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

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
greeting.text=Welcome to TiffinBox
```

**File:** `application-diwali.properties` in `src/main/resources`

```properties
greeting.text=Happy Diwali from TiffinBox
```

**File:** `GreetingApplication.java` in package `com.tiffinbox.greeting`

```java
package com.tiffinbox.greeting;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class GreetingApplication {

    @Value("${greeting.text}")
    private String text;

    public static void main(String[] args) {
        SpringApplication.run(GreetingApplication.class, args);
    }

    @GetMapping("/greeting")
    public String greeting() {
        return text;
    }
}
```

**File:** `Dockerfile`

```dockerfile
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/greeting-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**File:** `compose.yaml`

```yaml
services:
  greeting:
    build: .
    ports:
      - "9090:8080"
    environment:
      SPRING_PROFILES_ACTIVE: diwali
```

Start it with `docker compose up --build`. Then `curl http://localhost:9090/greeting` returns `Happy Diwali from TiffinBox`. Remove the `environment` lines and it returns `Welcome to TiffinBox`.
