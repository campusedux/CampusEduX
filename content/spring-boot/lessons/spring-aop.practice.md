Try each problem on your own first. Each one has its own `pom.xml` with the AspectJ starter.

### Easy: Doctor Visit Log

City Care Hospital wants a log line every time a method of `DoctorService` is called. The service has `consult(String patient)` which returns `"Consulted " + patient`. Write an aspect with `@Before` advice that prints `[log] consult called for Meera` when the app asks for Meera's consultation. Do not put any print statement inside `DoctorService`.

> **Hint:** Use `@Before` with an `execution(...)` pointcut and read the arguments from the `JoinPoint`.

**Answer:** The aspect matches every method of `DoctorService`. `jp.getArgs()[0]` is the first argument. The service stays clean.

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
    <artifactId>clinic</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aspectj</artifactId>
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

**File:** `DoctorService.java` in package `com.citycare.clinic`

```java
package com.citycare.clinic;

import org.springframework.stereotype.Service;

@Service
public class DoctorService {

    public String consult(String patient) {
        return "Consulted " + patient;
    }
}
```

**File:** `VisitLogAspect.java` in package `com.citycare.clinic`

```java
package com.citycare.clinic;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class VisitLogAspect {

    @Before("execution(* com.citycare.clinic.DoctorService.*(..))")
    public void log(JoinPoint jp) {
        System.out.println("[log] " + jp.getSignature().getName()
                + " called for " + jp.getArgs()[0]);
    }
}
```

**File:** `ClinicApplication.java` in package `com.citycare.clinic`

```java
package com.citycare.clinic;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ClinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClinicApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(DoctorService doctors) {
        return args -> System.out.println(doctors.consult("Meera"));
    }
}
```

The console prints:

```text
[log] consult called for Meera
Consulted Meera
```

### Medium: Cinema Booking Guard

StarPlex Cinema allows at most 4 seats in one booking. `TicketService.book(String movie, int seats)` returns `"Booked " + seats + " for " + movie`. Write one `@Around` aspect that:

- rejects a booking of more than 4 seats by throwing `IllegalArgumentException("Max 4 seats")` without calling the real method, and
- counts every accepted booking so the app can print the total.

> **Hint:** In `@Around` you decide whether to call `pjp.proceed()`. Read the seat count from `pjp.getArgs()[1]`. A `static AtomicInteger` or a field in the aspect can hold the counter.

**Answer:** The aspect checks the argument first. Only when it is valid does it call `proceed()`, then it increments the counter. The service has no rule inside it, so the limit can change in one place.

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
    <artifactId>booking</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aspectj</artifactId>
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

**File:** `TicketService.java` in package `com.starplex.booking`

```java
package com.starplex.booking;

import org.springframework.stereotype.Service;

@Service
public class TicketService {

    public String book(String movie, int seats) {
        return "Booked " + seats + " for " + movie;
    }
}
```

**File:** `BookingGuardAspect.java` in package `com.starplex.booking`

```java
package com.starplex.booking;

import java.util.concurrent.atomic.AtomicInteger;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class BookingGuardAspect {

    private final AtomicInteger accepted = new AtomicInteger();

    @Around("execution(* com.starplex.booking.TicketService.book(..))")
    public Object guard(ProceedingJoinPoint pjp) throws Throwable {
        int seats = (int) pjp.getArgs()[1];
        if (seats > 4) {
            throw new IllegalArgumentException("Max 4 seats");
        }
        Object result = pjp.proceed();
        accepted.incrementAndGet();
        return result;
    }

    public int acceptedCount() {
        return accepted.get();
    }
}
```

**File:** `BookingApplication.java` in package `com.starplex.booking`

```java
package com.starplex.booking;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(TicketService tickets, BookingGuardAspect guard) {
        return args -> {
            System.out.println(tickets.book("Leo", 3));
            try {
                tickets.book("Leo", 6);
            } catch (IllegalArgumentException e) {
                System.out.println("Rejected: " + e.getMessage());
            }
            System.out.println("Accepted: " + guard.acceptedCount());
        };
    }
}
```

The console prints:

```text
Booked 3 for Leo
Rejected: Max 4 seats
Accepted: 1
```
