Every morning a tea stall owner does the same small jobs without anyone asking: light the stove at six, check the milk stock at seven, and clear the old cups at nine. Nobody presses a button. The jobs just happen at their time. Real applications need the same thing: send a daily report, clear old records every night, or check a payment gateway every minute. Scheduling with @Scheduled lets Spring Boot run these jobs by itself, on a timetable you write.

In this guide you will build a pharmacy app with three timed jobs, learn the difference between fixed rate, fixed delay and cron, and see how to avoid the traps that make scheduled jobs silently stop.

## What is Scheduling with @Scheduled?

> **Definition:** `@Scheduled` is a Spring annotation that runs a method automatically at fixed times or intervals. You put it on a method of a Spring bean, switch scheduling on with `@EnableScheduling`, and Spring runs the method in the background with no controller or request needed.

A scheduled method must follow two rules. It must return `void` (any returned value is ignored), and it must take no arguments. Spring calls it for you, so there is nobody to give it arguments.

You choose the timing in one of three ways:

- `fixedRate` starts the method every N milliseconds, measured from the start of the last run.
- `fixedDelay` waits N milliseconds after the last run finished, then starts again.
- `cron` uses a calendar expression, like "every day at 2 AM".

## Why is it used?

- **Routine work.** Nightly clean-up, daily emails, weekly reports and monthly invoices need no human.
- **Polling.** Check a remote service or a folder every few seconds.
- **Keeping data fresh.** Reload a cache or refresh a rate list on a timer.
- **No extra tool.** For simple jobs you do not need a separate scheduler program. It is one annotation.

## How it works

Spring keeps a small scheduler running inside your app. At startup it finds every `@Scheduled` method and registers it with its timing.

```text
App starts
    |
    v
+------------------------+
| @EnableScheduling      |
| find @Scheduled methods|
+------------------------+
    |
    v
+------------------------+
| Task scheduler         |
| (a small thread pool)  |
+------------------------+
    |
    v  time reached
+------------------------+
| Run your method        |
+------------------------+
    |
    v  wait, then repeat
```

Once the app is up, the scheduler watches the clock. When a job's time arrives, it hands the method to a thread and runs it. By default Spring uses just one thread for all scheduled jobs. That means a slow job can make the other jobs wait, which we will see in the output below.

### Fixed rate, fixed delay and cron

| Setting | Meaning | Good for |
|---|---|---|
| `fixedRate = 1000` | Start every second | Heartbeats, quick polling |
| `fixedDelay = 5000` | Wait 5 seconds after each run ends | Jobs of unknown length |
| `initialDelay = 2000` | Wait before the first run | Letting the app warm up |
| `cron = "0 0 2 * * *"` | Seconds, minutes, hours, day, month, weekday | Daily or weekly jobs |

A cron expression in Spring has six fields, and the first one is seconds. So `0 0 2 * * *` means "at second 0, minute 0, hour 2, every day". The expression `*/2 * * * * *` means "every 2 seconds".

## Real-Life Example

A pharmacy must remove expired medicines from its shelves. The manager does not remember it each day. She sets three routines: a stock count every hour (fixed rate), a restock call that starts ten minutes after the last delivery is checked in (fixed delay), and an expiry sweep every morning at 8 (cron). The pharmacy app copies this plan exactly.

## Code Example

Let's build MediQuick Pharmacy, a plain app with three scheduled jobs. The `main` method lets it run for a few seconds and then closes it, so the output stays short.

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

    <groupId>com.mediquick</groupId>
    <artifactId>jobs</artifactId>
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
spring.application.name=mediquick-jobs
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `JobsApplication.java` in package `com.mediquick.jobs`

```java
package com.mediquick.jobs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class JobsApplication {

    public static void main(String[] args) throws InterruptedException {
        ConfigurableApplicationContext context = SpringApplication.run(JobsApplication.class, args);
        Thread.sleep(5500);
        context.close();
    }
}
```

**File:** `PharmacyJobs.java` in package `com.mediquick.jobs`

```java
package com.mediquick.jobs;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PharmacyJobs {

    private final AtomicInteger counts = new AtomicInteger();

    @Scheduled(fixedRate = 2000)
    public void stockCount() {
        System.out.println("Stock count #" + counts.incrementAndGet()
            + " on " + Thread.currentThread().getName());
    }

    @Scheduled(initialDelay = 1000, fixedDelay = 3000)
    public void restockCall() throws InterruptedException {
        System.out.println("Restock call started");
        Thread.sleep(500);
        System.out.println("Restock call finished");
    }

    @Scheduled(cron = "*/2 * * * * *")
    public void expirySweep() {
        System.out.println("Expiry sweep done");
    }
}
```

Run it with `./mvnw spring-boot:run`. Your lines may come in a slightly different order, because the jobs depend on the clock.

**Output:**

```text
Stock count #1 on scheduling-1
Restock call started
Restock call finished
Expiry sweep done
Stock count #2 on scheduling-1
Expiry sweep done
Stock count #3 on scheduling-1
Restock call started
Restock call finished
```

## Code Explained

- `@EnableScheduling` starts the scheduler. Without it, `@Scheduled` is ignored and no error appears.
- `stockCount` uses `fixedRate = 2000`, so it starts every two seconds. The thread name shows it runs on a scheduler thread, not on `main`.
- `restockCall` waits one second (`initialDelay`), runs for half a second, and then waits three seconds before the next run. That wait counts from the end of the last run, which is `fixedDelay`.
- `expirySweep` uses a cron expression that fires on every even second of the clock, whatever time the app started.
- All three jobs share one thread by default. While `restockCall` sleeps, the other jobs wait for their turn, so a late job usually means a busy scheduler, not a broken clock.
- The `main` method closes the context after 5.5 seconds so the demo ends. A real web app keeps running, and the jobs go on for as long as it lives.

## Making Timings Configurable

Hard-coded numbers are hard to change. Move them into `application.properties`, and read them with `fixedRateString` or `cron`.

```java
@Scheduled(fixedRateString = "${pharmacy.stock-ms:60000}")
public void stockCount() { }

@Scheduled(cron = "${pharmacy.sweep-cron:0 0 8 * * *}")
public void expirySweep() { }
```

The part after the colon is a default value. Now operations can change the timing in each environment without touching the code. You can also add `zone = "Asia/Kolkata"` to a cron job so it runs on Indian time, whatever the server's own time zone is.

## Common Mistakes

> **Warning:** If a scheduled method throws an exception, Spring logs it and tries again at the next time. It does not stop the job. But an endless loop or a very long run inside the method does block the single scheduler thread.

- **Forgetting `@EnableScheduling`.** Nothing runs, and nothing tells you why.
- **Running many servers.** If you start three copies of the app, every copy runs the job. A nightly email goes out three times. Use a lock such as ShedLock, or run the job on one instance only.
- **Using `fixedRate` for slow jobs.** If a run takes longer than the rate, runs pile up behind each other. `fixedDelay` is safer when the length is not known.
- **Wrong cron order.** Spring cron starts with seconds. Copying a five-field Linux cron line gives an error or a wrong time.
- **Long jobs on the shared thread.** Give the scheduler a bigger pool with the scheduling pool size property (the practice problem shows it).

## Interview Questions

**What do you need to run a `@Scheduled` method?**
`@EnableScheduling` on a configuration class, and a method on a Spring bean that returns `void` and takes no arguments.

**What is the difference between `fixedRate` and `fixedDelay`?**
`fixedRate` measures from the start of one run to the start of the next. `fixedDelay` measures from the end of one run to the start of the next.

**How many fields does a Spring cron expression have?**
Six: second, minute, hour, day of month, month and day of week.

**What happens if two instances of the app run the same scheduled job?**
Both run it. You need a distributed lock or a single scheduler instance to avoid duplicates.

**How can you run scheduled jobs in parallel?**
Increase the scheduler pool size in the properties, or combine `@Scheduled` with `@Async`.

## Key Points to Remember

- `@Scheduled` runs a method on a timetable, and `@EnableScheduling` turns it on.
- Use `fixedRate`, `fixedDelay` or `cron` to set the timing.
- The method must be `void` and take no arguments.
- The scheduler uses one thread by default, so a slow job can delay the others.
- With several app instances, each instance runs every job.

## Frequently Asked Questions

### Does scheduling with @Scheduled work in a web app?

Yes. The scheduler runs beside the web server. Once the app starts, the jobs run on their own, whether or not anyone calls an endpoint.

### Can I change a schedule while the app is running?

Not with the plain annotation. Move the values into properties and restart, or use a `SchedulingConfigurer` for dynamic schedules.

### Is @Scheduled good enough for important jobs?

It is fine for simple, repeatable jobs. For jobs that must survive restarts, keep history, or run once across many servers, use a tool like Quartz.

### Why did my scheduled job not run?

Check `@EnableScheduling`, check that the class is a Spring bean, and check that the method is `void` with no arguments.

## Related Topics

- [Async Processing with @Async](/learning/spring-boot-tutorial/async-processing-with-async): run slow work on other threads so jobs do not block each other.
- [Caching in Spring Boot](/learning/spring-boot-tutorial/caching-in-spring-boot): refresh or clear caches on a timer.
- [Spring Events](/learning/spring-boot-tutorial/spring-events): let a job announce its result to other parts of the app.
- [Sending Email](/learning/spring-boot-tutorial/sending-email): send the daily report a job builds.
