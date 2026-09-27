These two problems are small projects in the same style as BookNook. Try each on your own first. Each has its own `pom.xml`.

### Easy: Clinic Token Counter

City Care Clinic gives every visitor a token number. Build an API where `POST /tokens` creates the next token (starting at 1) and replies with status 201 and the body `{"token":1}`, and `GET /tokens/current` replies with the last token issued as `{"token":1}`. Before any token is issued, `GET /tokens/current` replies with status 404.

> **Hint:** Keep an `AtomicInteger` in a service class. Use `@ResponseStatus` for the 201. For the 404, return a `ResponseEntity` from its `notFound()` builder.

**Answer:** A service holds the counter, so two visitors at the same moment never get the same number. The controller only translates the service result into HTTP.

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
    <artifactId>tokens</artifactId>
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
```

**File:** `TokenService.java` in package `com.citycare.tokens`

```java
package com.citycare.tokens;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Service;

@Service
public class TokenService {

    private final AtomicInteger last = new AtomicInteger();

    public int next() {
        return last.incrementAndGet();
    }

    public int current() {
        return last.get();
    }
}
```

**File:** `TokenController.java` in package `com.citycare.tokens`

```java
package com.citycare.tokens;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tokens")
public class TokenController {

    public record TokenView(int token) {}

    private final TokenService service;

    public TokenController(TokenService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TokenView issue() {
        return new TokenView(service.next());
    }

    @GetMapping("/current")
    public ResponseEntity<TokenView> current() {
        int current = service.current();
        if (current == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new TokenView(current));
    }
}
```

**File:** `TokensApplication.java` in package `com.citycare.tokens`

```java
package com.citycare.tokens;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TokensApplication {

    public static void main(String[] args) {
        SpringApplication.run(TokensApplication.class, args);
    }
}
```

The four calls return statuses 404, 201, 201 and 200. The bodies of the last three are:

```json
{"token":1}
{"token":2}
{"token":2}
```

### Medium: Cinema Seat Booking API

StarPlex Cinema needs a seat booking API with a database. `GET /seats` lists all seats with a `booked` flag. `POST /seats/{label}/book` books a seat: 200 with the seat when it was free, 409 with `{"error":"Seat A2 is already booked"}` when taken, and 404 with `{"error":"Seat Z9 not found"}` for an unknown label. Seed three free seats, A1, A2 and A3, at start-up.

> **Hint:** Use an entity `Seat` and a repository method `Optional<Seat> findByLabel(String label)`. Put the booking rule in a `@Transactional` service method and throw an exception with a status code. Handle it in a `@RestControllerAdvice`.

**Answer:** The derived query finds a seat by its label. The service checks the flag, sets it and saves in one transaction. One exception class and one handler keep the status codes in a single place.

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

    <groupId>com.starplex</groupId>
    <artifactId>seats</artifactId>
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

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
spring.datasource.url=jdbc:h2:mem:seats
spring.jpa.open-in-view=false
```

**File:** `Seat.java` in package `com.starplex.seats`

```java
package com.starplex.seats;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String label;
    private boolean booked;

    protected Seat() {}

    public Seat(String label) {
        this.label = label;
    }

    public String getLabel() { return label; }
    public boolean isBooked() { return booked; }
    public void book() { this.booked = true; }
}
```

**File:** `SeatRepository.java` in package `com.starplex.seats`

```java
package com.starplex.seats;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    Optional<Seat> findByLabel(String label);
}
```

**File:** `SeatException.java` in package `com.starplex.seats`

```java
package com.starplex.seats;

public class SeatException extends RuntimeException {

    private final int status;

    public SeatException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
```

**File:** `SeatService.java` in package `com.starplex.seats`

```java
package com.starplex.seats;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SeatService {

    public record SeatView(String label, boolean booked) {}

    private final SeatRepository seats;

    public SeatService(SeatRepository seats) {
        this.seats = seats;
    }

    @Transactional(readOnly = true)
    public List<SeatView> all() {
        return seats.findAll().stream()
                .map(s -> new SeatView(s.getLabel(), s.isBooked()))
                .toList();
    }

    @Transactional
    public SeatView book(String label) {
        Seat seat = seats.findByLabel(label)
                .orElseThrow(() -> new SeatException(404, "Seat " + label + " not found"));
        if (seat.isBooked()) {
            throw new SeatException(409, "Seat " + label + " is already booked");
        }
        seat.book();
        return new SeatView(seat.getLabel(), seat.isBooked());
    }
}
```

**File:** `SeatController.java` in package `com.starplex.seats`

```java
package com.starplex.seats;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SeatController {

    private final SeatService service;

    public SeatController(SeatService service) {
        this.service = service;
    }

    @GetMapping("/seats")
    public List<SeatService.SeatView> seats() {
        return service.all();
    }

    @PostMapping("/seats/{label}/book")
    public SeatService.SeatView book(@PathVariable String label) {
        return service.book(label);
    }
}
```

**File:** `SeatExceptionHandler.java` in package `com.starplex.seats`

```java
package com.starplex.seats;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class SeatExceptionHandler {

    public record ErrorBody(String error) {}

    @ExceptionHandler(SeatException.class)
    public ResponseEntity<ErrorBody> handle(SeatException ex) {
        return ResponseEntity.status(ex.getStatus()).body(new ErrorBody(ex.getMessage()));
    }
}
```

**File:** `SeatsApplication.java` in package `com.starplex.seats`

```java
package com.starplex.seats;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class SeatsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SeatsApplication.class, args);
    }

    @Bean
    CommandLineRunner seed(SeatRepository seats) {
        return args -> {
            seats.save(new Seat("A1"));
            seats.save(new Seat("A2"));
            seats.save(new Seat("A3"));
        };
    }
}
```

Booking A2 twice, then Z9, returns these bodies, with statuses 200, 409 and 404:

```json
{"label":"A2","booked":true}
{"error":"Seat A2 is already booked"}
{"error":"Seat Z9 not found"}
```
