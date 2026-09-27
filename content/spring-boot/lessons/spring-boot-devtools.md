Imagine painting a wall and having to leave the room, lock the door and walk back in every time you want to see a new stroke. You would give up by lunch. That is what developing without DevTools feels like: change a line, stop the app, start it again, wait, test. Spring Boot DevTools removes the walk around the corridor. You change the code, and the running app picks it up by itself.

This guide shows what DevTools does, how its fast restart works inside, what else it changes while you develop, and why it never reaches your production server.

## What is Spring Boot DevTools?

> **Definition:** Spring Boot DevTools is an optional dependency for development only. It restarts your app automatically when compiled classes change, and it switches on settings that make debugging easier.

You add it once to `pom.xml`. After that, every time your IDE or Maven recompiles a class, DevTools notices the change in the `target/classes` folder and restarts the application inside the same Java process.

## Why is it used?

Small changes are the heart of learning and of daily work: fix a message, try another status code, adjust a query. Without DevTools, each try means a full stop and start. With it:

- **Restarts are automatic.** Save and compile, and the app reloads.
- **Restarts are fast.** In our test a cold start took 1.9 seconds, while a DevTools restart took 0.3 seconds.
- **Errors are easier to read.** Error responses include the message and stack trace while you develop.
- **Caches stay out of your way.** Template and static resource caching are switched off, so you always see your latest file.

## How it works

DevTools uses two class loaders. A class loader is the part of Java that loads classes into memory.

```text
You save and compile a class
        |
        v
target/classes changes
        |
        v
DevTools notices it
        |
        v
Drop the "restart" loader
(your own classes)
        |
        v
Keep the "base" loader
(all the libraries)
        |
        v
New restart loader starts
the app again, quickly
```

Libraries such as Spring and Tomcat rarely change, so they stay loaded in the base class loader. Only your own classes live in the restart class loader, which is thrown away and rebuilt on each change. Loading a few of your classes is far quicker than loading every library again, which is why the restart is so fast. In the log you can spot it by the thread name `restartedMain`.

## Real-Life Example

A theatre rehearsal works the same way. When the director changes one line of dialogue, the crew does not rebuild the stage, rehang the lights and repaint the backdrop. They keep the set (the libraries) and only rerun the scene with the new line (your classes). The scene restarts in seconds because the heavy parts never moved.

## Code Example

BookMyClinic's slot service starts with DevTools. Initializr adds it this way when you pick "Spring Boot DevTools":

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

    <groupId>com.bookmyclinic</groupId>
    <artifactId>slots</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
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

**File:** `SlotsApplication.java` in package `com.bookmyclinic.slots`

```java
package com.bookmyclinic.slots;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SlotsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SlotsApplication.class, args);
    }
}
```

**File:** `SlotController.java` in package `com.bookmyclinic.slots`

```java
package com.bookmyclinic.slots;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SlotController {

    @GetMapping("/slots/today")
    public String todaysSlots() {
        return "Dr. Kapoor has 4 free slots today";
    }
}
```

Start it with `./mvnw spring-boot:run` and call `/slots/today`. Now change `4` to `3` in the controller, save, and compile. Your IDE does this when you build the project; from a second terminal you can run `./mvnw compile`. Call the endpoint again without restarting anything.

**Output:**

```text
Dr. Kapoor has 4 free slots today
Dr. Kapoor has 3 free slots today
```

The first line is the reply before the change and the second is after it. In between, the log shows the app restarting on the `restartedMain` thread.

## Code Explained

- `<scope>runtime</scope>` means your code never compiles against DevTools; it is only present while the app runs.
- `<optional>true</optional>` stops DevTools from leaking into other projects that depend on this one.
- The Spring Boot Maven plugin leaves DevTools out of the packaged JAR. We checked: the built JAR contains no DevTools classes at all, so `java -jar` in production never restarts or exposes debug details.
- At startup DevTools logs "Devtools property defaults active!", which tells you its development settings are on.

## What Else DevTools Changes

Besides restarting, DevTools applies development defaults. Error responses include the message and the full stack trace, template and static resource caching are switched off, and resolved exceptions are logged. We compared the same failing endpoint both ways: under `spring-boot:run` the JSON error contained `"message": "No doctor assigned"` and a `trace`, while the packaged JAR returned only the status and error name.

Files under `static` and `templates` do not trigger a restart. They are served straight from the classpath, so a change there shows up on the next request.

## When a Restart Is Not Enough

A DevTools restart reloads your own classes and your settings. Editing `application.properties` and compiling triggers a restart too, so a new port or a new property value is picked up. It cannot, however, add new libraries. The base class loader was built when the app first started, and `spring-boot:run` fixed the classpath at that moment. So after you add or remove a dependency in `pom.xml`, stop the app with Ctrl+C and start it again. The same goes for changing the Java version or the Spring Boot version. As a simple rule: code and settings restart by themselves; the build file needs a fresh start.

## Common Mistakes

> **Warning:** DevTools restarts only after classes are compiled. If nothing happens when you save, switch on automatic building in your IDE or run `./mvnw compile` yourself.

- **Expecting data to survive a restart.** A restart creates a fresh application context, so anything held only in memory, such as an in-memory H2 database, starts empty again.
- **Being surprised by errors in production.** The detailed errors you see while developing come from DevTools. Production responses are shorter on purpose.
- **Removing `optional` and `runtime`.** Keep both, exactly as Initializr adds them.

## Interview Questions

**How does DevTools make restarts faster than a normal start?**
It uses two class loaders. Libraries stay in a base loader, and only the restart loader with your classes is recreated after a change.

**Is DevTools active in production?**
No. The Maven plugin leaves it out of the packaged JAR, so a production app built with `./mvnw package` does not contain it.

**Which changes do not trigger a restart?**
Files in `static`, `templates` and a few other folders are excluded, because they can be served without restarting.

## Key Points to Remember

- DevTools restarts the app automatically when compiled classes change.
- Its two class loaders make restarts much faster than cold starts.
- It adds development defaults such as detailed error responses and no caching.
- Add it with `runtime` scope and `optional` set to true; it is left out of the packaged JAR.
- Restart needs a compile: save alone is not enough unless your IDE builds automatically.

## Frequently Asked Questions

### Does DevTools support LiveReload in Spring Boot 4?

LiveReload is off by default in Spring Boot 4.1, and its settings are deprecated with no replacement. Refresh the browser yourself after a restart.

### Is a DevTools restart the same as hot swapping?

No. Hot swapping patches a class inside the running app without any restart and has many limits. DevTools restarts the application context, which handles almost any code change.

### Can I restart only when I decide to?

Yes. Under `spring.devtools`, set `restart.trigger-file` to a file name, and DevTools restarts only when that file changes. The practice problems show how.

### Does DevTools work with Gradle?

Yes. Add it as a `developmentOnly` dependency in Gradle; it behaves the same way.

## Related Topics

- [Running a Spring Boot Application](/learning/spring-boot-tutorial/running-a-spring-boot-application): the ways to start the app that DevTools restarts.
- [Spring Boot Project Structure](/learning/spring-boot-tutorial/spring-boot-project-structure): where `target/classes` and `static` fit in.
- [Maven pom.xml Explained](/learning/spring-boot-tutorial/maven-pom-xml-explained): scopes such as `runtime` and the build plugin.
