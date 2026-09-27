Try each problem on your own first. Both are command line programs that run for a few seconds and then close, like the MediQuick example.

### Easy: Oven Check Every Second

Sweet Oven Bakery wants a job that prints `Oven temperature OK` every second, starting one second after the app starts. Let the app run for 3.5 seconds and then close it.

> **Hint:** Use `@Scheduled(initialDelay = 1000, fixedRate = 1000)`, add `@EnableScheduling`, and close the context after `Thread.sleep(3500)`.

**Answer:** The job starts at second 1 and then repeats at seconds 2 and 3, so it prints three times before the app closes.

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

    <groupId>com.sweetoven</groupId>
    <artifactId>checks</artifactId>
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

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `ChecksApplication.java` in package `com.sweetoven.checks`

```java
package com.sweetoven.checks;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ChecksApplication {

    public static void main(String[] args) throws InterruptedException {
        ConfigurableApplicationContext context = SpringApplication.run(ChecksApplication.class, args);
        Thread.sleep(3500);
        context.close();
    }
}
```

**File:** `OvenCheck.java` in package `com.sweetoven.checks`

```java
package com.sweetoven.checks;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OvenCheck {

    @Scheduled(initialDelay = 1000, fixedRate = 1000)
    public void check() {
        System.out.println("Oven temperature OK");
    }
}
```

**Output:**

```text
Oven temperature OK
Oven temperature OK
Oven temperature OK
```

### Medium: Bus Tracker with a Bigger Pool

BusLine tracks two things: `Bus A` and `Bus B`. Each tracking job takes 0.8 seconds and runs every second, and the rate must come from `application.properties` (`busline.tracker-ms`). With the default single scheduler thread the two jobs would queue behind each other. Make them run side by side by setting the scheduler pool size to 2, and print how many different threads were used.

> **Hint:** Read the rate with `fixedRateString = "${busline.tracker-ms}"`. Set the scheduling pool size property to 2 (it is already in the properties file below). Save each thread name in a set made with `ConcurrentHashMap.newKeySet()`.

**Answer:** With a pool of two threads, both jobs can run at the same moment. The set ends with two thread names, which shows that the work was parallel.

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
    <artifactId>tracker</artifactId>
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

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
busline.tracker-ms=1000
spring.task.scheduling.pool.size=2
```

**File:** `TrackerApplication.java` in package `com.busline.tracker`

```java
package com.busline.tracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TrackerApplication {

    public static void main(String[] args) throws InterruptedException {
        ConfigurableApplicationContext context = SpringApplication.run(TrackerApplication.class, args);
        Thread.sleep(3500);
        System.out.println("Threads used: " + context.getBean(BusTracker.class).threadsUsed());
        context.close();
    }
}
```

**File:** `BusTracker.java` in package `com.busline.tracker`

```java
package com.busline.tracker;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BusTracker {

    private final Set<String> threads = ConcurrentHashMap.newKeySet();

    @Scheduled(initialDelay = 500, fixedRateString = "${busline.tracker-ms}")
    public void trackBusA() throws InterruptedException {
        threads.add(Thread.currentThread().getName());
        Thread.sleep(800);
    }

    @Scheduled(initialDelay = 500, fixedRateString = "${busline.tracker-ms}")
    public void trackBusB() throws InterruptedException {
        threads.add(Thread.currentThread().getName());
        Thread.sleep(800);
    }

    public int threadsUsed() {
        return threads.size();
    }
}
```

**Output:**

```text
Threads used: 2
```
