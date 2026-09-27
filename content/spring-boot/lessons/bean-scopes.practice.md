Try each problem on your own first. Both use the same `pom.xml` as the CineGo example; only change the `groupId` and `artifactId`. The programs switch off the web server so the console shows only your lines.

### Easy: Toll Booth Receipts

RoadRun Toll runs one `TollBooth` bean that every car uses, and a `Receipt` bean that must be new for every car. Number each receipt using a counter. In a runner, check that two `getBean(TollBooth.class)` calls return the same object, and print the numbers of two receipts.

> **Hint:** Leave `TollBooth` with the default scope. Add `@Scope("prototype")` to `Receipt` and use a static `AtomicInteger` to number them.

**Answer:** The booth is a singleton, so the check prints `true`. The receipt is a prototype, so each request gets a new number.

**File:** `TollApplication.java` in package `com.roadrun.toll`

```java
package com.roadrun.toll;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TollApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(TollApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `TollBooth.java` in package `com.roadrun.toll`

```java
package com.roadrun.toll;

import org.springframework.stereotype.Component;

@Component
public class TollBooth {
}
```

**File:** `Receipt.java` in package `com.roadrun.toll`

```java
package com.roadrun.toll;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")
public class Receipt {

    private static final AtomicInteger COUNTER = new AtomicInteger(100);

    private final int number = COUNTER.incrementAndGet();

    public int number() {
        return number;
    }
}
```

**File:** `TollRunner.java` in package `com.roadrun.toll`

```java
package com.roadrun.toll;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class TollRunner implements CommandLineRunner {

    private final ApplicationContext context;

    public TollRunner(ApplicationContext context) {
        this.context = context;
    }

    @Override
    public void run(String... args) {
        boolean same = context.getBean(TollBooth.class) == context.getBean(TollBooth.class);
        System.out.println("Booth same object? " + same);
        System.out.println("Receipt " + context.getBean(Receipt.class).number());
        System.out.println("Receipt " + context.getBean(Receipt.class).number());
    }
}
```

Running the jar prints:

```text
Booth same object? true
Receipt 101
Receipt 102
```

### Medium: Gym Visitor Cards

FitZone Gym has a singleton `FrontDesk`. Every visitor must get a brand new `VisitorCard`, which is a prototype with a running id. The desk must not keep one card forever. Print the ids of three cards handed out by `checkIn()`.

> **Hint:** Inject `ObjectProvider<VisitorCard>` into the desk and call `getObject()` inside `checkIn()`. Do not inject `VisitorCard` directly.

**Answer:** The provider asks the container for a new card on each call, so the ids are 1, 2 and 3. Injecting the card directly would print the same id three times.

**File:** `GymApplication.java` in package `com.fitzone.gym`

```java
package com.fitzone.gym;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GymApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(GymApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `VisitorCard.java` in package `com.fitzone.gym`

```java
package com.fitzone.gym;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Component
@Scope("prototype")
public class VisitorCard {

    private static final AtomicInteger COUNTER = new AtomicInteger();

    private final int id = COUNTER.incrementAndGet();

    public int id() {
        return id;
    }
}
```

**File:** `FrontDesk.java` in package `com.fitzone.gym`

```java
package com.fitzone.gym;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

@Component
public class FrontDesk {

    private final ObjectProvider<VisitorCard> cards;

    public FrontDesk(ObjectProvider<VisitorCard> cards) {
        this.cards = cards;
    }

    public VisitorCard checkIn() {
        return cards.getObject();
    }
}
```

**File:** `GymRunner.java` in package `com.fitzone.gym`

```java
package com.fitzone.gym;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class GymRunner implements CommandLineRunner {

    private final FrontDesk desk;

    public GymRunner(FrontDesk desk) {
        this.desk = desk;
    }

    @Override
    public void run(String... args) {
        for (int i = 0; i < 3; i++) {
            System.out.println("Card id " + desk.checkIn().id());
        }
    }
}
```

Running the jar prints:

```text
Card id 1
Card id 2
Card id 3
```
