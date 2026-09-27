Try each problem on your own first. Both use the same `pom.xml` as the CineGo example; only change the `groupId` and `artifactId`. The programs switch off the web server so the console shows only your lines.

### Easy: A Fixed Clock for the Ticket Desk

RailPoint sells train tickets. `java.time.Clock` is a Java class, so you cannot annotate it. Create a `Clock` bean in a configuration class, fixed at `2026-01-26T10:00:00Z` in UTC, so tests always see the same date. A `TicketDesk` bean must receive the clock and print `Ticket date: 2026-01-26`.

> **Hint:** Write a `@Bean` method that returns a `Clock` made with the `fixed` method of `Clock`, an `Instant` and `ZoneOffset.UTC`. Ask for `Clock` in the constructor of `TicketDesk`, and use `LocalDate.now(clock)`.

**Answer:** The `@Bean` method builds the clock. Spring injects it into the desk, which reads the date from it instead of from the system.

**File:** `RailApplication.java` in package `com.railpoint.tickets`

```java
package com.railpoint.tickets;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RailApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(RailApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `ClockConfig.java` in package `com.railpoint.tickets`

```java
package com.railpoint.tickets;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.fixed(Instant.parse("2026-01-26T10:00:00Z"), ZoneOffset.UTC);
    }
}
```

**File:** `TicketDesk.java` in package `com.railpoint.tickets`

```java
package com.railpoint.tickets;

import java.time.Clock;
import java.time.LocalDate;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class TicketDesk implements CommandLineRunner {

    private final Clock clock;

    public TicketDesk(Clock clock) {
        this.clock = clock;
    }

    @Override
    public void run(String... args) {
        System.out.println("Ticket date: " + LocalDate.now(clock));
    }
}
```

Running the jar prints:

```text
Ticket date: 2026-01-26
```

### Medium: Full Mode and Lite Mode

A tea stall has a `Sugar` jar and two counters, `TeaCounter` and `SnackCounter`, that both take a `Sugar` in their constructors. Build the beans twice: once in a normal `@Configuration` class and once in a `@Configuration` class with `proxyBeanMethods` set to `false`. In each, the counter bean methods must call the `sugar()` method directly. Print whether the two counters share the same jar in each mode.

> **Hint:** Give the beans different method names in the two classes, for example `fullTea()` and `liteTea()`. With `proxyBeanMethods = false`, Spring does not proxy the class, so every call to `sugar()` runs the method again.

**Answer:** In full mode the proxy returns the existing `Sugar` bean, so both counters share it. In lite mode each call creates a new `Sugar`, so they do not.

**File:** `StallApplication.java` in package `com.chaistall.modes`

```java
package com.chaistall.modes;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StallApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(StallApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `Sugar.java` in package `com.chaistall.modes`

```java
package com.chaistall.modes;

public class Sugar {
}
```

**File:** `Counter.java` in package `com.chaistall.modes`

```java
package com.chaistall.modes;

public class Counter {

    private final Sugar sugar;

    public Counter(Sugar sugar) {
        this.sugar = sugar;
    }

    public Sugar sugar() {
        return sugar;
    }
}
```

**File:** `FullConfig.java` in package `com.chaistall.modes`

```java
package com.chaistall.modes;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FullConfig {

    @Bean
    public Sugar fullSugar() {
        return new Sugar();
    }

    @Bean
    public Counter fullTea() {
        return new Counter(fullSugar());
    }

    @Bean
    public Counter fullSnack() {
        return new Counter(fullSugar());
    }
}
```

**File:** `LiteConfig.java` in package `com.chaistall.modes`

```java
package com.chaistall.modes;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class LiteConfig {

    @Bean
    public Sugar liteSugar() {
        return new Sugar();
    }

    @Bean
    public Counter liteTea() {
        return new Counter(liteSugar());
    }

    @Bean
    public Counter liteSnack() {
        return new Counter(liteSugar());
    }
}
```

**File:** `ModeRunner.java` in package `com.chaistall.modes`

```java
package com.chaistall.modes;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class ModeRunner implements CommandLineRunner {

    private final ApplicationContext context;

    public ModeRunner(ApplicationContext context) {
        this.context = context;
    }

    @Override
    public void run(String... args) {
        Counter fullTea = context.getBean("fullTea", Counter.class);
        Counter fullSnack = context.getBean("fullSnack", Counter.class);
        Counter liteTea = context.getBean("liteTea", Counter.class);
        Counter liteSnack = context.getBean("liteSnack", Counter.class);
        System.out.println("Full mode same jar? " + (fullTea.sugar() == fullSnack.sugar()));
        System.out.println("Lite mode same jar? " + (liteTea.sugar() == liteSnack.sugar()));
    }
}
```

Running the jar prints:

```text
Full mode same jar? true
Lite mode same jar? false
```
