Try each problem on your own first. Both are command line programs, like the Crumbs & Co. example.

### Easy: Lab Test Rates

City Lab has a slow `rate(testName)` lookup. Cache it, and prove the cache works by counting how many times the real lookup ran. Call `rate("CBC")` three times and `rate("Lipid Profile")` once, then print the number of real lookups.

> **Hint:** Put an `AtomicInteger` in the service and add one to it inside the cached method. Remember `@EnableCaching` and the cache starter.

**Answer:** Three calls for `CBC` cause only one lookup, and `Lipid Profile` adds a second one. So the counter ends at 2.

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

    <groupId>com.citylab</groupId>
    <artifactId>rates</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-cache</artifactId>
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

**File:** `RateService.java` in package `com.citylab.rates`

```java
package com.citylab.rates;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class RateService {

    private final AtomicInteger lookups = new AtomicInteger();

    @Cacheable("rates")
    public int rate(String testName) {
        lookups.incrementAndGet();
        return testName.equals("CBC") ? 350 : 600;
    }

    public int lookups() {
        return lookups.get();
    }
}
```

**File:** `RatesApplication.java` in package `com.citylab.rates`

```java
package com.citylab.rates;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableCaching
public class RatesApplication {

    public static void main(String[] args) {
        SpringApplication.run(RatesApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(RateService rates) {
        return args -> {
            System.out.println("CBC: " + rates.rate("CBC"));
            System.out.println("CBC: " + rates.rate("CBC"));
            System.out.println("CBC: " + rates.rate("CBC"));
            System.out.println("Lipid Profile: " + rates.rate("Lipid Profile"));
            System.out.println("Real lookups: " + rates.lookups());
        };
    }
}
```

**Output:**

```text
CBC: 350
CBC: 350
CBC: 350
Lipid Profile: 600
Real lookups: 2
```

### Medium: Timed Cache for Bus Fares

A bus app looks up `fare(route)` from a slow service. Cache each fare for only one second using Caffeine, so a change in the source shows up quickly. Do not cache a route that does not exist (the method returns `null`). Show that a call after the cache expires runs the real lookup again, and that an unknown route is looked up every time.

> **Hint:** Add the Caffeine dependency and set the Caffeine spec property to `expireAfterWrite=1s`. Use `unless = "#result == null"` on `@Cacheable`. Sleep for about 1.5 seconds in the demo.

**Answer:** Caffeine drops an entry one second after it was written, so the third call runs the lookup again. The `unless` rule keeps `null` results out of the cache, so unknown routes always go to the source.

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

    <groupId>com.busline</groupId>
    <artifactId>fares</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-cache</artifactId>
        </dependency>
        <dependency>
            <groupId>com.github.ben-manes.caffeine</groupId>
            <artifactId>caffeine</artifactId>
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
spring.cache.cache-names=fares
spring.cache.caffeine.spec=expireAfterWrite=1s
```

**File:** `FareService.java` in package `com.busline.fares`

```java
package com.busline.fares;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class FareService {

    private final Map<String, Integer> fares = Map.of("Pune-Mumbai", 450, "Pune-Nashik", 380);
    private final AtomicInteger lookups = new AtomicInteger();

    @Cacheable(value = "fares", unless = "#result == null")
    public Integer fare(String route) {
        lookups.incrementAndGet();
        return fares.get(route);
    }

    public int lookups() {
        return lookups.get();
    }
}
```

**File:** `FaresApplication.java` in package `com.busline.fares`

```java
package com.busline.fares;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableCaching
public class FaresApplication {

    public static void main(String[] args) {
        SpringApplication.run(FaresApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(FareService fares) {
        return args -> {
            fares.fare("Pune-Mumbai");
            fares.fare("Pune-Mumbai");
            System.out.println("Lookups after 2 calls: " + fares.lookups());

            Thread.sleep(1500);
            fares.fare("Pune-Mumbai");
            System.out.println("Lookups after expiry: " + fares.lookups());

            fares.fare("Pune-Goa");
            fares.fare("Pune-Goa");
            System.out.println("Lookups, unknown route x2: " + fares.lookups());
        };
    }
}
```

**Output:**

```text
Lookups after 2 calls: 1
Lookups after expiry: 2
Lookups, unknown route x2: 4
```
