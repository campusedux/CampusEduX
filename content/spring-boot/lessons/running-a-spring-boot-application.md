A car can be started in different ways. You can turn the key, press a start button, or use a remote on a cold morning. Whichever you choose, the same engine comes to life. Spring Boot apps are like that. You can start one from your IDE, from Maven, or as a JAR file on a server, and every route ends at the same `main()` method.

This guide covers the three ways to run an app, how to pass settings such as the port at start time, which setting wins when several are given, how to run code right after startup, and how to stop an app cleanly.

## What is running a Spring Boot app?

> **Definition:** Running a Spring Boot app means starting a Java process that calls `SpringApplication.run()`. That call builds the application context, starts the embedded server and keeps the app alive until you stop it.

Every Spring Boot app has a main class with a `main()` method. The three ways of starting it differ only in who calls that method and how the classpath is built: your IDE, the Maven plugin, or the `java` command reading a packaged JAR.

## Why is it used?

You need different ways at different moments:

- **While coding,** the IDE's Run button is fastest, and debugging with breakpoints is one click away.
- **From the terminal,** `./mvnw spring-boot:run` builds and runs in one step, with no IDE needed. Many tutorials and build servers use it.
- **In production,** you build one JAR and start it with `java -jar`. The server needs only Java, not Maven or your source code.

Knowing all three also helps when something works in one place but not another, which is a very common beginner puzzle.

## How it works

All three ways end in the same place.

```text
IDE    spring-boot:run   java -jar
 |            |              |
 +------------+--------------+
              |
              v
     main() calls
     SpringApplication.run()
              |
              v
   Context + embedded server
              |
              v
   App runs until stopped
```

The IDE and the Maven plugin run your compiled classes straight from the `target` folder. `java -jar` runs the packaged JAR, which contains your classes and every library. That is why the JAR must be rebuilt after each code change, while the other two always pick up your latest compiled code.

## Real-Life Example

A bus company runs the same route three ways. On test days a driver takes the bus round the depot yard (your IDE). On practice days the bus runs the route empty (spring-boot:run). On service days it leaves with passengers and a fixed ticket list (the packaged JAR). The bus and the route are identical; only the setting around them changes.

## The Three Ways at a Glance

| Way | Command | Best for |
|---|---|---|
| IDE | Run the main class | Coding and debugging |
| Maven plugin | `./mvnw spring-boot:run` | Quick runs from a terminal |
| Packaged JAR | `./mvnw package`, then `java -jar` | Servers and production |

On Windows use `mvnw.cmd` instead of `./mvnw`.

## Code Example

BusGo, a city bus app, lists its routes and prints a short report once it has started. The report uses a `CommandLineRunner`, which Spring Boot calls right after startup.

**File:** `BusGoApplication.java` in package `com.busgo.routes`

```java
package com.busgo.routes;

import java.util.List;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class BusGoApplication {

    static final List<String> ROUTES = List.of("Station - Airport", "Market - University", "Harbour - Stadium");

    public static void main(String[] args) {
        SpringApplication.run(BusGoApplication.class, args);
    }

    @GetMapping("/routes")
    public List<String> routes() {
        return ROUTES;
    }
}
```

**File:** `StartupReport.java` in package `com.busgo.routes`

```java
package com.busgo.routes;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class StartupReport implements CommandLineRunner {

    @Override
    public void run(String... args) {
        System.out.println("BusGo is ready with " + BusGoApplication.ROUTES.size() + " routes");
    }
}
```

Package the app, start the JAR, then call it:

```bash
./mvnw package
java -jar target/routes-0.0.1-SNAPSHOT.jar
curl http://localhost:8080/routes
```

**Output:**

```text
BusGo is ready with 3 routes
```

That line appears in the log right after `Started BusGoApplication in ... seconds`, and curl then prints the three routes as a JSON array.

## Code Explained

- `main()` hands control to `SpringApplication.run()`, exactly as it would from the IDE or from Maven.
- `StartupReport` is a `@Component`, so component scan finds it. Because it implements `CommandLineRunner`, Spring Boot calls its `run()` method once, after the app has fully started.
- The `args` passed to `run()` are the same command-line arguments given to `main()`.
- `./mvnw package` produced the JAR in the `target` folder, named from the artifact and version in `pom.xml`.

## Passing Settings When You Start

You can change a setting such as the port without editing any file:

```bash
java -jar target/routes-0.0.1-SNAPSHOT.jar --server.port=8084
java -Dserver.port=8083 -jar target/routes-0.0.1-SNAPSHOT.jar
SERVER_PORT=8082 java -jar target/routes-0.0.1-SNAPSHOT.jar
./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8085
```

When the same setting comes from several places, the higher one wins:

```text
--server.port=8084    (argument)
        |  beats
        v
-Dserver.port=8083    (JVM option)
        |  beats
        v
SERVER_PORT=8082      (env var)
        |  beats
        v
application.properties
```

We tested this by giving all four at once: the app started on 8084. Removing the argument gave 8083, then 8082, then the file's value.

## Debugging a Running App

To pause the app and look inside, start the main class in Debug mode from your IDE instead of Run mode. Put a breakpoint on a line in a controller method, call the endpoint with curl or a browser, and the app stops on that line so you can inspect every variable. You can also attach the IDE to a JAR that is already running. Start it with the standard Java debug agent:

```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar target/routes-0.0.1-SNAPSHOT.jar
```

Then create a "Remote JVM Debug" or "Attach" configuration in your IDE for port 5005. Do not leave this port open on a public server.

## Stopping the App

Press Ctrl+C in the terminal. Spring Boot shuts down gracefully: the log says `Commencing graceful shutdown. Waiting for active requests to complete` and then `Graceful shutdown complete`, so requests already in progress can finish first.

## Common Mistakes

> **Warning:** `java -jar` runs the JAR as it was when you last packaged it. After changing code, run `./mvnw package` again, or you will be testing old code and wondering why nothing changed.

- **Passing app arguments straight to Maven.** `./mvnw spring-boot:run --server.port=9091` fails with "Unrecognized option", because Maven tries to read it. Put them in the `spring-boot.run.arguments` property with `-D`, as shown above.
- **Running from the wrong folder.** `./mvnw` must be run from the folder that holds `pom.xml`.
- **Two copies running.** A second start fails with "Port 8080 was already in use". Stop the first copy or choose another port.

## Interview Questions

**What are the ways to run a Spring Boot application?**
From the IDE's main class, with `mvn spring-boot:run`, or by packaging a JAR and running `java -jar`.

**How do you change the port without editing application.properties?**
Pass `--server.port=...` as an argument, use `-Dserver.port=...`, or set the `SERVER_PORT` environment variable.

**How do you run code right after the application starts?**
Implement `CommandLineRunner` or `ApplicationRunner` in a bean; Spring Boot calls it once startup is complete.

## Key Points to Remember

- Every way of running ends in `main()` calling `SpringApplication.run()`.
- Use the IDE while coding, `spring-boot:run` from a terminal, and `java -jar` on servers.
- Rebuild the JAR after code changes before running it with `java -jar`.
- Command-line arguments beat JVM options, which beat environment variables, which beat `application.properties`.
- Ctrl+C triggers a graceful shutdown that lets active requests finish.

## Frequently Asked Questions

### How do I run a Spring Boot app in the background on a Linux server?

Most teams run it as a system service or inside a container, which restarts it automatically. The Docker and deployment topics later in this course cover both.

### Can I run the app on a random free port?

Yes. Set `server.port=0` and Spring Boot picks a free port, printing it in the startup log. This is handy for tests.

### What is the difference between CommandLineRunner and ApplicationRunner?

Both run after startup. `CommandLineRunner` receives the raw argument strings, while `ApplicationRunner` receives `ApplicationArguments`, which splits options like `--city=Pune` for you.

### Why does my app start and then stop immediately?

Usually because it has no web server, for example when the web starter is missing. A non-web app finishes as soon as its runners are done.

## Related Topics

- [Spring Boot DevTools](/learning/spring-boot-tutorial/spring-boot-devtools): restart the running app automatically while coding.
- [Externalized Configuration](/learning/spring-boot-tutorial/externalized-configuration): every place settings can come from.
- [Maven pom.xml Explained](/learning/spring-boot-tutorial/maven-pom-xml-explained): how the JAR you run is built.
