Try each problem on your own first. Run each app with `./mvnw spring-boot:run`, because DevTools does not run inside a packaged JAR.

### Easy: CityLibrary Notice Board

CityLibrary's app has `GET /notice`, returning `Library closes at 8 PM today`. Add DevTools, start the app once, then change the notice to `Library closes at 6 PM today` and see the new text without stopping the app.

> **Hint:** Add `spring-boot-devtools` with `runtime` scope and `optional` set to true. After editing the controller, compile it (build in your IDE, or run `./mvnw compile` in a second terminal).

**Answer:** With DevTools on the classpath, compiling the changed controller restarts the app automatically, and the next request returns the new text.

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

    <groupId>com.citylibrary</groupId>
    <artifactId>notices</artifactId>
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
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
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

**File:** `NoticesApplication.java` in package `com.citylibrary.notices`

```java
package com.citylibrary.notices;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class NoticesApplication {

    public static void main(String[] args) {
        SpringApplication.run(NoticesApplication.class, args);
    }

    @GetMapping("/notice")
    public String notice() {
        return "Library closes at 8 PM today";
    }
}
```

Start the app and call `/notice`. Change `8 PM` to `6 PM`, compile, and call it again: the reply is now `Library closes at 6 PM today`, and the log shows a restart on the `restartedMain` thread.

### Medium: TicketTrail Restarts Only on Request

TicketTrail, a travel agency, has a slow startup, so its developers want DevTools to restart only when they say so, not after every compile. Configure DevTools to restart only when a file named `.reloadtrigger` changes. `GET /offers` returns `Goa trip at 12,000 rupees`.

> **Hint:** The property is `restart.trigger-file` under `spring.devtools`. Put the trigger file in `src/main/resources`, so every compile copies it into `target/classes`, where DevTools watches it.

**Answer:** With a trigger file set, DevTools ignores ordinary class changes. Editing the trigger file and compiling copies it into `target/classes`, and that one change starts the restart.

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

    <groupId>com.tickettrail</groupId>
    <artifactId>offers</artifactId>
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
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
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
spring.devtools.restart.trigger-file=.reloadtrigger
```

**File:** `.reloadtrigger` in `src/main/resources`

```text
edit me to restart
```

**File:** `OffersApplication.java` in package `com.tickettrail.offers`

```java
package com.tickettrail.offers;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class OffersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OffersApplication.class, args);
    }

    @GetMapping("/offers")
    public String offers() {
        return "Goa trip at 12,000 rupees";
    }
}
```

Change the price to `11,500` and compile: `/offers` still says `12,000`, because nothing restarted. Now edit `.reloadtrigger` (any change will do) and compile again: the app restarts and `/offers` says `Goa trip at 11,500 rupees`.
