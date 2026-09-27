Try each problem on your own first. Both use only the web starter.

### Easy: CinePoint Sold Out Shows

CinePoint has two shows. Show 1 has 40 seats and show 2 has none. Build `GET /shows/{id}` that returns `Show 1 has 40 seats left` and status 404 for an unknown id. Build `POST /shows/{id}/book` that returns 404 for an unknown id and 409 when the show has no seats. Use `ResponseStatusException` for the 404 and a custom exception marked with `@ResponseStatus` for the 409.

> **Hint:** Create `SoldOutException` extending `RuntimeException` and annotate the class with `@ResponseStatus` and the value `HttpStatus.CONFLICT`.

**Answer:** The 404 is thrown in place with a reason. The sold-out case has its own exception class, so any other method that throws it also gives 409.

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

    <groupId>com.cinepoint</groupId>
    <artifactId>shows</artifactId>
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

**File:** `ShowsApplication.java` in package `com.cinepoint.shows`

```java
package com.cinepoint.shows;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShowsApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShowsApplication.class, args);
    }
}
```

**File:** `SoldOutException.java` in package `com.cinepoint.shows`

```java
package com.cinepoint.shows;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class SoldOutException extends RuntimeException {

    public SoldOutException(String message) {
        super(message);
    }
}
```

**File:** `ShowController.java` in package `com.cinepoint.shows`

```java
package com.cinepoint.shows;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ShowController {

    private final Map<Integer, Integer> seatsLeft = Map.of(1, 40, 2, 0);

    @GetMapping("/shows/{id}")
    public String show(@PathVariable int id) {
        Integer seats = seatsLeft.get(id);
        if (seats == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No show with id " + id);
        }
        return "Show " + id + " has " + seats + " seats left";
    }

    @PostMapping("/shows/{id}/book")
    public String book(@PathVariable int id) {
        Integer seats = seatsLeft.get(id);
        if (seats == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No show with id " + id);
        }
        if (seats == 0) {
            throw new SoldOutException("Show " + id + " is sold out");
        }
        return "Booked one seat for show " + id;
    }
}
```

The three calls `GET /shows/1`, `GET /shows/7` and `POST /shows/2/book` printed:

```bash
Show 1 has 40 seats left [200]
{"timestamp":"2026-09-26T21:41:36.707Z","status":404,"error":"Not Found","path":"/shows/7"} [404]
{"timestamp":"2026-09-26T21:41:36.816Z","status":409,"error":"Conflict","path":"/shows/2/book"} [409]
```

### Medium: CityCare Ward Admission Handlers

CityCare's `GET /wards/{name}/admit` should behave like this. An unknown ward gives 404. A ward with no free bed gives 409. A real bug inside the method gives 500 with a safe generic message, while the real exception is logged. Every reply is a JSON object with `status` and `message`. Put the three handlers in the controller.

> **Hint:** Write one record `ErrorBody(int status, String message)`. Add `@ExceptionHandler` methods for `IllegalArgumentException`, `IllegalStateException` and, last, `Exception`. Spring picks the most specific handler.

**Answer:** The most specific handler wins, so the general `Exception` handler catches only what is left. It logs the full exception and returns a fixed text, so nothing internal leaks. In the code, the `general` ward has a deliberate bug: it calls a method on null.

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
    <artifactId>wards</artifactId>
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

**File:** `WardsApplication.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WardsApplication {

    public static void main(String[] args) {
        SpringApplication.run(WardsApplication.class, args);
    }
}
```

**File:** `WardController.java` in package `com.citycare.wards`

```java
package com.citycare.wards;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WardController {

    private static final Logger log = LoggerFactory.getLogger(WardController.class);

    record ErrorBody(int status, String message) {}

    private final Map<String, Integer> freeBeds = Map.of("general", 12, "icu", 0);

    @GetMapping("/wards/{name}/admit")
    public String admit(@PathVariable String name) {
        Integer beds = freeBeds.get(name);
        if (beds == null) {
            throw new IllegalArgumentException("No ward called " + name);
        }
        if (beds == 0) {
            throw new IllegalStateException("No free bed in " + name);
        }
        if (name.equals("general")) {
            Object broken = null;
            broken.toString();
        }
        return "Patient admitted to " + name;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorBody notFound(IllegalArgumentException ex) {
        return new ErrorBody(404, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorBody full(IllegalStateException ex) {
        return new ErrorBody(409, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorBody unexpected(Exception ex) {
        log.error("Unexpected failure", ex);
        return new ErrorBody(500, "Something went wrong. Please try again later.");
    }
}
```

Asking for the wards `icu`, `nowhere` and `general` printed:

```bash
{"status":409,"message":"No free bed in icu"} [409]
{"status":404,"message":"No ward called nowhere"} [404]
{"status":500,"message":"Something went wrong. Please try again later."} [500]
```
