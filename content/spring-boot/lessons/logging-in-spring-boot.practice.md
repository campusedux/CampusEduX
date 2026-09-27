Try each problem on your own first. Both use the same `pom.xml` as the QuickBite code above; only change the `groupId` and `artifactId`.

### Easy: Clinic Token Log

City Care Clinic wants every new token written to the log at INFO level. Build `GET /token` that hands out token 15 and logs `Token 15 issued`. Use a short console pattern so each line stays narrow.

> **Hint:** Create a logger with `LoggerFactory.getLogger` and call `info` with a `{}` placeholder. Set `logging.pattern.console` in `application.properties`, and keep Spring's own noise away with `logging.level.root=WARN`.

**Answer:** The service logs through SLF4J. The pattern prints the level, the short class name and the message.

**File:** `application.properties` in `src/main/resources`

```properties
logging.pattern.console=%-5level %logger{0}: %msg%n
logging.level.root=WARN
logging.level.com.citycare=INFO
```

**File:** `TokenApplication.java` in package `com.citycare.token`

```java
package com.citycare.token;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TokenApplication {

    public static void main(String[] args) {
        SpringApplication.run(TokenApplication.class, args);
    }
}
```

**File:** `TokenDesk.java` in package `com.citycare.token`

```java
package com.citycare.token;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TokenDesk {

    private static final Logger log = LoggerFactory.getLogger(TokenDesk.class);

    @GetMapping("/token")
    public String token() {
        int token = 15;
        log.info("Token {} issued", token);
        return "Token " + token;
    }
}
```

After `curl http://localhost:8080/token`, the console shows this line, among the startup lines that the main class also logs:

```text
INFO  TokenDesk: Token 15 issued
```

### Medium: Library Fines with Levels

Lakeview Library logs at three levels. When a book is returned on time, log INFO. When it is 1 to 7 days late, log WARN. When it is more than 7 days late, log ERROR. Build `GET /return/{days}` that returns the fine of 2 rupees a day and logs at the right level. Show the log for 0, 3 and 10 days, then show it again with the package level raised to ERROR.

> **Hint:** Use a `@PathVariable` for the days and an `if` chain to choose the log method. Change the level for `com.lakeview` by passing a `--logging.level` argument when starting the jar.

**Answer:** One if chain picks the level. Raising the package level to ERROR hides the INFO and WARN lines without any code change.

**File:** `application.properties` in `src/main/resources`

```properties
logging.pattern.console=%-5level %logger{0}: %msg%n
logging.level.root=WARN
logging.level.com.lakeview=INFO
```

**File:** `FinesApplication.java` in package `com.lakeview.fines`

```java
package com.lakeview.fines;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FinesApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinesApplication.class, args);
    }
}
```

**File:** `FineDesk.java` in package `com.lakeview.fines`

```java
package com.lakeview.fines;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FineDesk {

    private static final Logger log = LoggerFactory.getLogger(FineDesk.class);

    @GetMapping("/return/{days}")
    public String bookReturn(@PathVariable int days) {
        int fine = days * 2;
        if (days == 0) {
            log.info("Returned on time");
        } else if (days <= 7) {
            log.warn("Late by {} days", days);
        } else {
            log.error("Very late: {} days", days);
        }
        return "Fine: Rs " + fine;
    }
}
```

Calling `/return/0`, `/return/3` and `/return/10` writes:

```text
INFO  FineDesk: Returned on time
WARN  FineDesk: Late by 3 days
ERROR FineDesk: Very late: 10 days
```

```bash
java -jar target/fines-0.0.1-SNAPSHOT.jar --logging.level.com.lakeview=ERROR
```

With that argument, the same three calls write:

```text
ERROR FineDesk: Very late: 10 days
```
