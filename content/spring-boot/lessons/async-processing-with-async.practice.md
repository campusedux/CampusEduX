Try each problem on your own first. Both are command line programs.

### Easy: Lab Report in the Background

City Lab takes two seconds to build a blood test report. Write an `@Async` method `buildReport(patient)` that returns a `CompletableFuture<String>`. In the runner, print `Report requested for Anil` right after calling it, then wait for the answer and print it.

> **Hint:** Add `@EnableAsync`, sleep two seconds inside the async method, and return a completed `CompletableFuture`. Call `join()` on the result in the runner.

**Answer:** The request line prints first because the caller does not wait. Then `join()` waits for the background thread and prints the finished report.

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
    <artifactId>reports</artifactId>
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

**File:** `ReportService.java` in package `com.citylab.reports`

```java
package com.citylab.reports;

import java.util.concurrent.CompletableFuture;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class ReportService {

    @Async
    public CompletableFuture<String> buildReport(String patient) {
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return CompletableFuture.completedFuture("Report ready for " + patient);
    }
}
```

**File:** `ReportsApplication.java` in package `com.citylab.reports`

```java
package com.citylab.reports;

import java.util.concurrent.CompletableFuture;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ReportsApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReportsApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(ReportService reports) {
        return args -> {
            CompletableFuture<String> report = reports.buildReport("Anil");
            System.out.println("Report requested for Anil");
            System.out.println(report.join());
        };
    }
}
```

**Output:**

```text
Report requested for Anil
Report ready for Anil
```

### Medium: Refund Pool with Error Handling

PayEasy processes refunds in the background on its own pool of two threads named `refund-1`, `refund-2`. A refund of a zero or negative amount must fail with the message `Amount must be positive`, and the caller must print `DONE` or `FAILED` with the reason, without the app crashing.

> **Hint:** Define a `ThreadPoolTaskExecutor` bean named `refundExecutor` with a thread name prefix `refund-`, and use `@Async("refundExecutor")`. Mark the threads as daemon so the demo can exit. Throw `IllegalArgumentException` for bad amounts, and use `handle(...)` on the `CompletableFuture`.

**Answer:** A named executor lets you control the pool. When an async method returns a `CompletableFuture` and throws, Spring completes the future with that error, and `handle` turns it into a message.

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

    <groupId>com.payeasy</groupId>
    <artifactId>refunds</artifactId>
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

**File:** `RefundApplication.java` in package `com.payeasy.refunds`

```java
package com.payeasy.refunds;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@SpringBootApplication
@EnableAsync
public class RefundApplication {

    public static void main(String[] args) {
        SpringApplication.run(RefundApplication.class, args);
    }

    @Bean(name = "refundExecutor")
    Executor refundExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(2);
        executor.setQueueCapacity(20);
        executor.setThreadNamePrefix("refund-");
        executor.setDaemon(true);
        executor.initialize();
        return executor;
    }

    @Bean
    CommandLineRunner demo(RefundService refunds) {
        return args -> {
            for (int amount : new int[] {500, -5}) {
                String result = refunds.refund(amount)
                    .handle((ok, error) -> error == null
                        ? "Refund " + amount + ": DONE on " + ok
                        : "Refund " + amount + ": FAILED (" + error.getMessage() + ")")
                    .join();
                System.out.println(result);
            }
        };
    }
}
```

**File:** `RefundService.java` in package `com.payeasy.refunds`

```java
package com.payeasy.refunds;

import java.util.concurrent.CompletableFuture;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class RefundService {

    @Async("refundExecutor")
    public CompletableFuture<String> refund(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        String pool = Thread.currentThread().getName().startsWith("refund-") ? "refund pool" : "other pool";
        return CompletableFuture.completedFuture(pool);
    }
}
```

**Output:**

```text
Refund 500: DONE on refund pool
Refund -5: FAILED (java.lang.
IllegalArgumentException: Amount
must be positive)
```

The failed line is one line on screen. It is wrapped here to fit small screens.
