Imagine a cinema that prints the ticket price on a big board at the counter. On a festival Friday the manager does not repaint the board. She sticks a small note over the old price, and everyone follows the note. The board is the default. The note is an override. Both live outside the projector room, and nobody has to rebuild the cinema to change a price.

Spring Boot works the same way. This guide on externalized configuration shows how one build of your app can run on a laptop, a test server and a production server, with different settings each time, and without changing a line of code.

## What is externalized configuration?

> **Definition:** Externalized configuration means keeping the settings of an application outside its compiled code, in files, environment variables and command line arguments, so that the same jar can behave differently in different places.

Spring Boot collects settings from many sources and puts them in one `Environment`. When two sources define the same key, the source with the higher priority wins. That priority list is the heart of this topic.

## Why is it used?

- **One build, many places.** You build the jar once and run the same file everywhere. Only the settings change.
- **Secrets stay out of the code.** A database password comes from an environment variable on the server, not from a file in the repository.
- **Quick fixes.** An operator can change a price or a port with a command line argument, without opening the project.
- **Safe defaults.** The file inside the jar holds working defaults, and each environment overrides only what differs.

## How it works

Spring Boot reads its sources in a fixed order of strength. A stronger source replaces the value from a weaker one. Here is the order for the sources you will use most, from strongest to weakest.

```text
strongest
  ^
  |  command line arguments
  |  SPRING_APPLICATION_JSON
  |  Java system properties (-D)
  |  OS environment variables
  |  config/ file next to the jar
  |  application.properties in jar
  |  defaults written in code
  |
weakest
```

Read the list from the bottom. Defaults in code are the weakest. The `application.properties` inside the jar comes next, and a file in a `config` folder beside the jar beats it. Environment variables beat both files. System properties, a JSON value and finally command line arguments each beat the source below them. So if you pass an argument on the command line, nothing else can override it.

## Where Spring Boot Looks for Files

| Location | When to use it |
|---|---|
| Inside the jar (classpath root) | Safe defaults shipped with the app |
| `config/` folder inside the jar | Defaults grouped in a folder |
| Current folder | A file placed next to the jar |
| `config/` folder in the current folder | The usual place for server settings |

Files in the later locations override files in the earlier ones. Most teams keep defaults in the jar and put one `config/application.properties` on the server.

## Real-Life Example

Riverside Cinema sells tickets at 200 rupees. The default price is written in the file inside the jar. On a festival weekend the manager wants 250 rupees on the live server, but the price on the test server must stay at 200. She sets an environment variable on the live server only. The jar is identical in both places. Later a special screening needs 300 rupees for one evening, so an operator starts the app with a command line argument, which beats everything else.

## Code Example

Let's build the Riverside Cinema ticket service. It has a default price and a small controller that prints it. We will then override the price in five different ways.

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

    <groupId>com.riverside</groupId>
    <artifactId>ticket</artifactId>
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
cinema.name=Riverside Cinema
cinema.ticket-price=200
```

**File:** `TicketApplication.java` in package `com.riverside.ticket`

```java
package com.riverside.ticket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TicketApplication {

    public static void main(String[] args) {
        SpringApplication.run(TicketApplication.class, args);
    }
}
```

**File:** `CinemaProperties.java` in package `com.riverside.ticket`

```java
package com.riverside.ticket;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cinema")
public record CinemaProperties(String name, int ticketPrice) {}
```

**File:** `TicketController.java` in package `com.riverside.ticket`

```java
package com.riverside.ticket;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TicketController {

    private final CinemaProperties cinema;

    public TicketController(CinemaProperties cinema) {
        this.cinema = cinema;
    }

    @GetMapping("/ticket")
    public String ticket() {
        return cinema.name() + ": Rs " + cinema.ticketPrice() + " a ticket";
    }
}
```

Build the jar once with `./mvnw package`. Then run the same jar six times, changing only how the price is supplied. The commands below assume the jar is named `ticket-0.0.1-SNAPSHOT.jar` and that each run is stopped before the next one. After each start, call `curl http://localhost:8080/ticket`.

```bash
# 1. defaults inside the jar
java -jar target/ticket-0.0.1-SNAPSHOT.jar

# 2. a config folder next to the jar
mkdir config
echo "cinema.ticket-price=220" > config/application.properties
java -jar target/ticket-0.0.1-SNAPSHOT.jar

# 3. an environment variable
CINEMA_TICKET_PRICE=250 java -jar target/ticket-0.0.1-SNAPSHOT.jar

# 4. a Java system property
java -Dcinema.ticket-price=260 -jar target/ticket-0.0.1-SNAPSHOT.jar

# 5. SPRING_APPLICATION_JSON
SPRING_APPLICATION_JSON='{"cinema":{"ticket-price":275}}' \
  java -jar target/ticket-0.0.1-SNAPSHOT.jar

# 6. a command line argument
java -jar target/ticket-0.0.1-SNAPSHOT.jar --cinema.ticket-price=300
```

**Output:**

```text
Riverside Cinema: Rs 200 a ticket
Riverside Cinema: Rs 220 a ticket
Riverside Cinema: Rs 250 a ticket
Riverside Cinema: Rs 260 a ticket
Riverside Cinema: Rs 275 a ticket
Riverside Cinema: Rs 300 a ticket
```

The six lines are the answers of the six runs, in order. In our test, runs 3 to 6 also kept the config file from run 2 in place, and each stronger source still won.

## Code Explained

- The `cinema.ticket-price` key exists in the jar with the value 200. That is the default, and it was used in run 1.
- The file in `config/` beside the jar beat the file inside the jar, so run 2 printed 220.
- `CINEMA_TICKET_PRICE` is an environment variable. Spring Boot maps upper case names with underscores to the key `cinema.ticket-price`, so it beat both files.
- `-D` sets a Java system property, and in a run where an environment variable was also set to 250, the system property 260 won.
- `SPRING_APPLICATION_JSON` carries settings as JSON. It beat the environment variable.
- The command line argument won every time. We even tried it together with all the other sources, and the result was still 300.
- The Java code did not change at all. The record only reads the final value from the `Environment`.

## Naming Rules for Environment Variables

Operating systems do not allow dots or hyphens in variable names, so Spring Boot uses a simple rule: upper case the key, and replace dots and hyphens with underscores. The key `cinema.ticket-price` becomes `CINEMA_TICKET_PRICE`. A list item such as `cinema.shows[0]` becomes `CINEMA_SHOWS_0`.

## Common Mistakes

> **Warning:** Never commit passwords or API keys in `application.properties`. Put them in environment variables or a secrets store on the server, and keep only harmless defaults in the repository.

- **Editing the file inside the jar.** A jar is a sealed package. Put overrides in a `config` folder beside it instead.
- **Wrong working folder.** The `config` folder is found relative to where you start the app. Starting from another folder means the file is not found.
- **Using dots in the variable name.** Many shells reject a name like `cinema.ticket-price`. Write `CINEMA_TICKET_PRICE` instead.
- **Forgetting the priority.** If a value refuses to change, a stronger source is probably overriding your edit.

## Interview Questions

**Which wins, a command line argument or an environment variable?**
The command line argument. It is one of the strongest sources.

**How do you change a setting without rebuilding the jar?**
Pass it as a command line argument, set an environment variable, or place a file in a `config` folder next to the jar.

**How is `cinema.ticket-price` written as an environment variable?**
`CINEMA_TICKET_PRICE`: upper case, with dots and hyphens changed to underscores.

## Key Points to Remember

- Externalized configuration lets one jar run with different settings in different places.
- All sources merge into one `Environment`, and the stronger source wins.
- Command line arguments beat environment variables, and environment variables beat files.
- A `config` folder beside the jar overrides the file inside the jar.
- Environment variable names are upper case with underscores.
- Keep secrets out of the repository.

## Frequently Asked Questions

### What is externalized configuration in Spring Boot?

It is the practice of keeping settings outside your compiled code so that the same jar can be configured differently for each environment.

### Which source has the highest priority?

Among the common ones, command line arguments. Only a few test-only sources rank higher.

### Can I use both a config file and environment variables?

Yes, and most real projects do. The file holds defaults and the environment variables override what is different on that server.

### Do I need to restart the app after changing a setting?

Yes. Settings are read at startup, so restart the app for a change to take effect.

## Related Topics

- [Spring Profiles](/learning/spring-boot-tutorial/spring-profiles): switch whole groups of settings by environment name.
- [@ConfigurationProperties](/learning/spring-boot-tutorial/configuration-properties): read the final values into a typed record.
- [application.properties vs application.yml](/learning/spring-boot-tutorial/application-properties-vs-application-yml): the files that sit at the bottom of the priority list.
- [Running a Spring Boot Application](/learning/spring-boot-tutorial/running-a-spring-boot-application): the different ways to start an app and pass arguments.
