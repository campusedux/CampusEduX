Your app works on your laptop. The classroom demo went well. Now the shop owner says, "Great, when can my customers use it?" Until the app runs on a machine that stays switched on, connected to the internet, nobody but you can see it. Getting it there is called deploying a Spring Boot application.

Think of a bakery that has perfected a new cake in a home kitchen. To sell it, the baker must move to a shop with a proper oven, fixed timings and a signboard. The recipe stays the same, but the place, the settings and the way it is looked after change. In this guide to deploying a Spring Boot application, you will learn how to package your app, run it with production settings, keep it running, and choose where to host it.

## What is Deployment?

> **Definition:** Deployment means taking a built version of your application and running it on a server or platform where real users can reach it, with settings that suit that place.

For a Spring Boot app, the steps are usually the same:

1. Build the app into one executable JAR.
2. Copy the JAR to the target machine, or put it inside a Docker image.
3. Start it with the right settings for that environment.
4. Keep it running, watch its health, and restart it if it stops.

Your laptop is the dev environment. A shared test server is for testing. The live site is production. The same JAR runs in all three, but each has its own port, database address and logging level.

## Why is it done this way?

Spring Boot was designed for simple deployment. The JAR already has an embedded Tomcat server inside, so you do not install a web server on the target machine. You only need Java 21.

Older applications were WAR files copied into a separately installed server, which someone had to configure and patch. An executable JAR carries its own server, so deployment is repeatable: the file you tested is the file that runs.

The second idea is one build, many places. You do not rebuild the JAR for production. You keep the code the same and change only the settings from outside, using profiles, command-line options and environment variables.

## How it works

Here is the usual path from code to a running service.

```text
Your code
  |
  |  mvn clean package
  v
app.jar (server inside)
  |
  |  copy to server / image
  v
java -jar app.jar
  |
  |  + profile + settings
  v
Running app for users
```

Maven creates one runnable JAR in the `target` folder. You copy it to the machine and start it with `java -jar`. On the way in, Spring Boot reads settings from many places and picks the strongest one.

```text
Strongest wins:
  1. Command-line options
  2. Environment variables
  3. Profile file (prod)
  4. application.properties
```

So a value in `application.properties` is only the default. A profile file can override it for production, an environment variable can override that, and a command-line option beats everything. This order lets you ship one JAR and steer it from outside.

## Real-Life Example

A hospital moves its patient-booking app from the test room to the live server. The staff do not rewrite the software. They copy the same program, switch on the "live" mode, point it at the real appointment records and open the real phone lines. If the app crashes at night, an automatic supervisor restarts it. The program is the JAR. "Live mode" is the profile. The supervisor is the service manager on the server.

## Code Example

Let's prepare CityBus, a service that shows a welcome line for the bus depot. The default line is for developers, and a profile file replaces it for production.

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

    <groupId>com.citybus</groupId>
    <artifactId>depot</artifactId>
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
spring.main.banner-mode=off
logging.level.root=warn
app.welcome=CityBus dev
```

**File:** `application-prod.properties` in `src/main/resources`

```properties
app.welcome=CityBus live
```

**File:** `DepotApplication.java` in package `com.citybus.depot`

```java
package com.citybus.depot;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class DepotApplication {

    @Value("${app.welcome}")
    private String welcome;

    private final Environment env;

    public DepotApplication(Environment env) {
        this.env = env;
    }

    public static void main(String[] args) {
        SpringApplication.run(DepotApplication.class, args);
    }

    @GetMapping("/depot")
    public String depot() {
        return welcome + " | profiles=" + Arrays.toString(env.getActiveProfiles());
    }
}
```

Build the JAR once, then start it three ways. We use ports 9001 to 9003 here:

```bash
mvn clean package
java -jar target/depot-0.0.1-SNAPSHOT.jar --server.port=9001
java -jar target/depot-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --server.port=9002
APP_WELCOME="Pune depot" java -jar target/depot-0.0.1-SNAPSHOT.jar --server.port=9003
```

Calling `/depot` on each port returns:

**Output:**

```text
CityBus dev | profiles=[]
CityBus live | profiles=[prod]
Pune depot | profiles=[]
```

## Code Explained

- `mvn clean package` builds `depot-0.0.1-SNAPSHOT.jar` in `target`. The Spring Boot Maven plugin makes it executable, with Tomcat inside.
- The first start uses only `application.properties`, so we see the dev line and no active profile.
- `--spring.profiles.active=prod` switches on the profile. Spring Boot then also reads `application-prod.properties`, and its value replaces the default. The active profile appears in the reply.
- `APP_WELCOME` is an environment variable. Spring Boot maps it to the property `app.welcome`: capital letters, and an underscore in place of the dot. It beats the file value. That is how deployment tools set values without touching the JAR.
- `--server.port` is a command-line option, the strongest source. The same JAR ran on three different ports.

## Keeping the App Running

Starting with `java -jar` in a terminal is fine for a test. In production the app must start when the server boots and restart after a crash. On Linux, the standard tool is a systemd service. A typical unit file looks like this. We did not run it on our test machine, so treat it as a template:

```text
[Unit]
Description=CityBus depot

[Service]
User=citybus
ExecStart=/usr/bin/java \
  -Dspring.profiles.active=prod \
  -jar /opt/citybus/depot.jar
Restart=always

[Install]
WantedBy=multi-user.target
```

With `Restart=always` the system starts the app again after a crash. The `User` line runs it as a normal user, not as root. Other options are the same idea: Docker with a restart policy, or a platform that restarts crashed apps for you.

## Deploying a Spring Boot Application: Where to Host

| Option | Good for | You manage |
|---|---|---|
| Your own VM or server | Full control | Java, updates, restarts |
| Docker on a VM | Repeatable setup | Docker and the host |
| Platform as a service | Small teams, quick launch | Almost nothing |
| Kubernetes | Many services at scale | A lot |

For a first project, a small cloud VM or a platform that accepts a JAR or a Docker image is enough.

## Production Checklist

- Set the profile to `prod` and keep production values out of the JAR.
- Turn on the health endpoint from Actuator so a load balancer can check the app.
- Log to a place that survives restarts, and set the level to `info` or `warn`.
- Put the app behind HTTPS, usually through a reverse proxy or the platform.
- Keep the previous JAR so you can roll back in minutes.

> **Tip:** Test the exact JAR you will deploy. Run it locally with `java -jar` and the `prod` profile before you copy it to the server.

## Common Mistakes

> **Warning:** Do not commit production database addresses or logins into `application.properties` in your repository. Give them to the app from outside when it starts.

- **Deploying with `spring-boot:run`.** That command is for development. Use the packaged JAR.
- **Wrong Java version on the server.** A JAR built for Java 21 fails on Java 17.
- **Port already in use.** Another process holds the port, so the app fails to start. Change the port or stop the other process.
- **Leaving dev settings on.** A test database in production is risky.
- **No restart plan.** An app started by hand in a terminal dies when you close the terminal.

## Interview Questions

**How do you deploy a Spring Boot application?**
Build an executable JAR with Maven or Gradle, copy it to a server or put it in a Docker image, and run it with `java -jar` using production settings.

**JAR or WAR?**
A JAR has an embedded server and runs alone. A WAR is placed in an external server. Spring Boot prefers JAR.

**How do you use different settings in production?**
With profiles such as `application-prod.properties`, environment variables and command-line options, without rebuilding.

**Which setting wins when the same property is set in several places?**
Command-line options beat environment variables, which beat profile files, which beat the default `application.properties`.

**How do you keep the app running after a crash?**
Run it as a service with a restart rule, for example systemd with `Restart=always`, or in a container platform.

## Key Points to Remember

- Deployment means running a built app where users can reach it.
- Spring Boot builds one executable JAR with the server inside.
- Build once, then change behaviour with profiles, variables and options.
- Command-line options beat environment variables, profile files and defaults, in that order.
- Use a service manager or platform to restart the app after a crash.
- Test the same JAR you deploy, with the production profile.

## Frequently Asked Questions

### How do I go about deploying a Spring Boot application to a server?

Build the JAR with `mvn clean package`, copy it to the server, install Java 21, and start it with `java -jar` and the `prod` profile. Then set up a service so it survives reboots.

### Do I need to install Tomcat to deploy a Spring Boot application?

No. Tomcat is inside the JAR. You only need a Java runtime on the server.

### Can I run two Spring Boot apps on one server?

Yes. Give each app its own port with `server.port`, and put a reverse proxy in front if they share one address.

### What is the difference between deployment and a release?

A release is a named, tested version of the software. Deployment is the act of putting a version onto a server. You can deploy the same release to test first and production later.

## Related Topics

- [Docker for Spring Boot](/learning/spring-boot-tutorial/docker-for-spring-boot): ship the JAR inside an image.
- [Spring Profiles](/learning/spring-boot-tutorial/spring-profiles): the switch between dev and production settings.
- [Externalized Configuration](/learning/spring-boot-tutorial/externalized-configuration): the full order of setting sources.
- [Spring Boot Actuator](/learning/spring-boot-tutorial/spring-boot-actuator): health checks for your live app.
