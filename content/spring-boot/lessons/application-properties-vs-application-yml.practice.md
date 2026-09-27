Try each problem on your own first. Both use the same `pom.xml` as the SweetCrumbs code above; only change the `groupId` and `artifactId`.

### Easy: Library Rules in YAML

Lakeview Library keeps its rules in configuration. Write an `application.yml` with `library.name` set to `Lakeview Library`, `library.max-books` set to `4` and `library.loan-days` set to `14`. Then build `GET /rules` that returns one sentence built from these values.

> **Hint:** Group the three keys under one `library:` heading. Read them in the controller with `@Value`, or with the `Environment` as in the code above.

**Answer:** The YAML file holds the three values. The controller injects the `Environment` and builds the sentence from it.

**File:** `application.yml` in `src/main/resources`

```yaml
library:
  name: Lakeview Library
  max-books: 4
  loan-days: 14
```

**File:** `RulesApplication.java` in package `com.lakeview.rules`

```java
package com.lakeview.rules;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RulesApplication {

    public static void main(String[] args) {
        SpringApplication.run(RulesApplication.class, args);
    }
}
```

**File:** `RulesController.java` in package `com.lakeview.rules`

```java
package com.lakeview.rules;

import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RulesController {

    private final Environment env;

    public RulesController(Environment env) {
        this.env = env;
    }

    @GetMapping("/rules")
    public String rules() {
        return env.getProperty("library.name") + ": "
                + env.getProperty("library.max-books") + " books, "
                + env.getProperty("library.loan-days") + " days";
    }
}
```

Run it and call `curl http://localhost:8080/rules`. It prints:

```text
Lakeview Library: 4 books, 14 days
```

### Medium: Festival Season Profile

The SweetCrumbs owner wants a normal daily limit of 40 cakes and a festival limit of 100. Put both in one `application.yml`, using two YAML documents separated by `---`. The second document is active only for the profile `festival`. Build `GET /limit` that returns the limit, and show what it returns with and without the profile.

> **Hint:** Start the second document with the `on-profile` key under `spring.config.activate`. Turn the profile on with the `spring.profiles.active` argument when you start the jar.

**Answer:** The first document holds the default. The second overrides `bakery.daily-limit` only when the `festival` profile is on.

**File:** `application.yml` in `src/main/resources`

```yaml
bakery:
  daily-limit: 40
---
spring:
  config:
    activate:
      on-profile: festival
bakery:
  daily-limit: 100
```

**File:** `LimitApplication.java` in package `com.sweetcrumbs.limit`

```java
package com.sweetcrumbs.limit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LimitApplication {

    public static void main(String[] args) {
        SpringApplication.run(LimitApplication.class, args);
    }
}
```

**File:** `LimitController.java` in package `com.sweetcrumbs.limit`

```java
package com.sweetcrumbs.limit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LimitController {

    @Value("${bakery.daily-limit}")
    private int dailyLimit;

    @GetMapping("/limit")
    public String limit() {
        return "Cakes per day: " + dailyLimit;
    }
}
```

Started normally, `curl http://localhost:8080/limit` prints:

```text
Cakes per day: 40
```

Started with the festival profile switched on:

```bash
java -jar target/limit-0.0.1-SNAPSHOT.jar --spring.profiles.active=festival
```

Now `curl http://localhost:8080/limit` prints:

```text
Cakes per day: 100
```
