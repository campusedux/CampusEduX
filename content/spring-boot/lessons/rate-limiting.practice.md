Try each problem on your own first. Both run from the console, so no web server is needed. Each has its own `pom.xml`.

### Easy: Gym Entry Limiter

FitZone gym allows each member to enter at most 2 times a day. Write a `EntryLimiter` component with a method `boolean allow(String member)` that returns `true` for the first two calls of a member and `false` after that. Members are counted separately. In a `CommandLineRunner`, call it 3 times for `Kabir` and once for `Sana`, and print each result.

> **Hint:** Keep a `ConcurrentHashMap<String, Integer>` and use `merge(member, 1, Integer::sum)`. The returned count tells you whether the member is within the limit.

**Answer:** `merge` adds one and returns the new count atomically. The call is allowed when the new count is 2 or less.

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

    <groupId>com.fitzone</groupId>
    <artifactId>gym</artifactId>
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
spring.main.web-application-type=none
logging.level.root=warn
```

**File:** `EntryLimiter.java` in package `com.fitzone.gym`

```java
package com.fitzone.gym;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class EntryLimiter {

    private static final int MAX_ENTRIES = 2;

    private final ConcurrentHashMap<String, Integer> entries = new ConcurrentHashMap<>();

    public boolean allow(String member) {
        int count = entries.merge(member, 1, Integer::sum);
        return count <= MAX_ENTRIES;
    }
}
```

**File:** `GymApplication.java` in package `com.fitzone.gym`

```java
package com.fitzone.gym;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class GymApplication {

    public static void main(String[] args) {
        SpringApplication.run(GymApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(EntryLimiter limiter) {
        return args -> {
            for (int i = 1; i <= 3; i++) {
                System.out.println("Kabir " + i + ": " + limiter.allow("Kabir"));
            }
            System.out.println("Sana 1: " + limiter.allow("Sana"));
        };
    }
}
```

The console prints:

```text
Kabir 1: true
Kabir 2: true
Kabir 3: false
Sana 1: true
```

### Medium: Token Bucket for a Ticket Counter

MovieMax lets a client make a burst of 3 booking requests, then refills 1 request every second. Write a `TokenBucket` class with `boolean tryTake()`. It should take the current time from a `LongSupplier` (milliseconds) so you can test it without waiting. In the runner, use a fake clock: make 4 quick calls, move the clock 2 seconds, and make 3 more calls. Print each result.

> **Hint:** Store the token count as a `double` and the time of the last refill. On each call, add `elapsedSeconds * refillPerSecond` tokens, cap at the capacity, then take one if at least one is available.

**Answer:** Refill first, then spend. With the fake clock, the first 3 calls pass and the 4th fails. After 2 seconds two tokens are back, so two more calls pass and the third fails.

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

    <groupId>com.moviemax</groupId>
    <artifactId>bucket</artifactId>
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
spring.main.web-application-type=none
logging.level.root=warn
```

**File:** `TokenBucket.java` in package `com.moviemax.bucket`

```java
package com.moviemax.bucket;

import java.util.function.LongSupplier;

public class TokenBucket {

    private final double capacity;
    private final double refillPerSecond;
    private final LongSupplier clock;
    private double tokens;
    private long lastRefill;

    public TokenBucket(double capacity, double refillPerSecond, LongSupplier clock) {
        this.capacity = capacity;
        this.refillPerSecond = refillPerSecond;
        this.clock = clock;
        this.tokens = capacity;
        this.lastRefill = clock.getAsLong();
    }

    public synchronized boolean tryTake() {
        long now = clock.getAsLong();
        double elapsedSeconds = (now - lastRefill) / 1000.0;
        tokens = Math.min(capacity, tokens + elapsedSeconds * refillPerSecond);
        lastRefill = now;
        if (tokens >= 1) {
            tokens -= 1;
            return true;
        }
        return false;
    }
}
```

**File:** `BucketApplication.java` in package `com.moviemax.bucket`

```java
package com.moviemax.bucket;

import java.util.concurrent.atomic.AtomicLong;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BucketApplication {

    public static void main(String[] args) {
        SpringApplication.run(BucketApplication.class, args);
    }

    @Bean
    CommandLineRunner demo() {
        return args -> {
            AtomicLong now = new AtomicLong(0);
            TokenBucket bucket = new TokenBucket(3, 1, now::get);
            for (int i = 1; i <= 4; i++) {
                System.out.println("t=0s call " + i + ": " + bucket.tryTake());
            }
            now.addAndGet(2000);
            for (int i = 1; i <= 3; i++) {
                System.out.println("t=2s call " + i + ": " + bucket.tryTake());
            }
        };
    }
}
```

The console prints:

```text
t=0s call 1: true
t=0s call 2: true
t=0s call 3: true
t=0s call 4: false
t=2s call 1: true
t=2s call 2: true
t=2s call 3: false
```
