Try each problem on your own first. Both run from the command line, so they need only the core `spring-boot-starter` and no web server.

### Easy: Cinema Pass Store

Cineplex wants a small store for refresh values. Write a `RefreshStore` class with three methods: `issue(user)` returns a new random value, `owner(value)` returns the user who owns a value (or nothing), and `revoke(value)` deletes it. Then print what happens when you check a good value, a revoked value and an unknown value.

> **Hint:** Keep a `ConcurrentHashMap` from value to user. Make the value with `SecureRandom` and `Base64.getUrlEncoder()`, and return `Optional` from `owner`.

**Answer:** The map is the server's memory. Once a value is removed, `owner` returns an empty `Optional`, which is what makes real logout possible.

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

    <groupId>com.cineplex</groupId>
    <artifactId>pass</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
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

**File:** `RefreshStore.java` in package `com.cineplex.pass`

```java
package com.cineplex.pass;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class RefreshStore {

    private final Map<String, String> owners = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public String issue(String user) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String value = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        owners.put(value, user);
        return value;
    }

    public Optional<String> owner(String value) {
        return Optional.ofNullable(owners.get(value));
    }

    public void revoke(String value) {
        owners.remove(value);
    }
}
```

**File:** `PassApplication.java` in package `com.cineplex.pass`

```java
package com.cineplex.pass;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class PassApplication {

    public static void main(String[] args) {
        SpringApplication.run(PassApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(RefreshStore store) {
        return args -> {
            String value = store.issue("kabir");
            System.out.println("Good value belongs to: " + store.owner(value).orElse("nobody"));
            store.revoke(value);
            System.out.println("After logout: " + store.owner(value).orElse("nobody"));
            System.out.println("Unknown value: " + store.owner("made-up").orElse("nobody"));
        };
    }
}
```

**Output:**

```text
Good value belongs to: kabir
After logout: nobody
Unknown value: nobody
```

### Medium: Rotation with Expiry and Theft Check

Extend the idea. Build a `RotatingStore` where every refresh value works once and lasts 7 days. `rotate(value)` returns a new value and marks the old one used. If a used value comes back, remove all values of that user. If a value is older than 7 days, reject it. Use a `Clock` so you can move time forward in the demo.

> **Hint:** Store a small record with the user, the expiry time and a `used` flag. Inject a `Clock`, and in the demo use a tiny `Clock` subclass whose time you can push forward.

**Answer:** `rotate` checks four cases: unknown, expired, used (theft), and fresh. Only the fresh case marks the value as used and issues a new one.

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

    <groupId>com.cineplex</groupId>
    <artifactId>rotation</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
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

**File:** `RotatingStore.java` in package `com.cineplex.rotation`

```java
package com.cineplex.rotation;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class RotatingStore {

    private record Entry(String user, Instant expires, boolean used) {}

    private final Map<String, Entry> entries = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final Clock clock;
    private final Duration life;

    public RotatingStore(Clock clock, Duration life) {
        this.clock = clock;
        this.life = life;
    }

    public String issue(String user) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String value = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        entries.put(value, new Entry(user, clock.instant().plus(life), false));
        return value;
    }

    public Optional<String> rotate(String value) {
        Entry entry = entries.get(value);
        if (entry == null || entry.expires().isBefore(clock.instant())) {
            return Optional.empty();
        }
        if (entry.used()) {
            entries.values().removeIf(e -> e.user().equals(entry.user()));
            return Optional.empty();
        }
        entries.put(value, new Entry(entry.user(), entry.expires(), true));
        return Optional.of(issue(entry.user()));
    }
}
```

**File:** `RotationApplication.java` in package `com.cineplex.rotation`

```java
package com.cineplex.rotation;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class RotationApplication {

    static class PushableClock extends Clock {
        private Instant now = Instant.parse("2026-01-01T10:00:00Z");

        void advance(Duration by) {
            now = now.plus(by);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    public static void main(String[] args) {
        SpringApplication.run(RotationApplication.class, args);
    }

    @Bean
    CommandLineRunner demo() {
        return args -> {
            PushableClock clock = new PushableClock();
            RotatingStore store = new RotatingStore(clock, Duration.ofDays(7));

            String first = store.issue("kabir");
            String second = store.rotate(first).orElse(null);
            System.out.println("First rotate: " + (second != null ? "ok" : "rejected"));
            System.out.println("Old value again: " + (store.rotate(first).isPresent() ? "ok" : "rejected"));
            System.out.println("Newest value after theft: " + (store.rotate(second).isPresent() ? "ok" : "rejected"));

            String fresh = store.issue("kabir");
            clock.advance(Duration.ofDays(8));
            System.out.println("Value after 8 days: " + (store.rotate(fresh).isPresent() ? "ok" : "rejected"));
        };
    }
}
```

**Output:**

```text
First rotate: ok
Old value again: rejected
Newest value after theft: rejected
Value after 8 days: rejected
```
