Picture this. You want to open a small cinema. You could buy land, pour concrete, wire the lights, bolt down every seat and fix the projector yourself. Or you could rent a hall that already has seats, power and a screen, and spend your time choosing good films. Spring Boot is that ready-made hall for Java developers. You bring the idea. It brings most of the setup.

Let's see what Spring Boot is, why teams pick it, what happens when an app starts, and how to build a tiny movie ticket API that runs with one command.

## What is Spring Boot?

> **Definition:** Spring Boot is a free, open-source Java framework, built on top of the Spring Framework, that helps you create stand-alone, production-ready applications with very little setup.

Let's unpack that sentence.

- **Built on top of Spring.** Spring is a big, powerful framework for Java. Spring Boot does not replace it. It sits on top of Spring and makes it much easier to start with.
- **Stand-alone.** Your app runs by itself with `java -jar`. You do not install a separate web server and copy files into it.
- **Production-ready.** Logging, health checks and settings for different environments are already there when you need them.
- **Very little setup.** Spring Boot makes sensible choices for you, so you spend your time on features instead of long configuration files.

People often call Spring Boot "opinionated". That only means it comes with default opinions. Add a web library and it assumes you want a web server on port 8080. If you disagree, you change one line and your choice wins.

## Why is it used?

Before Spring Boot arrived in 2014, starting a new Spring project could eat a whole day. You had to pick dozens of library versions that worked together, write XML or Java classes to wire objects, and install a server. One wrong version number and nothing would start.

Spring Boot takes most of that pain away:

- **Starters** bundle the libraries you need for one job. Add `spring-boot-starter-webmvc` and you get Spring MVC, JSON support and an embedded Tomcat server, all in versions tested together.
- **Auto-configuration** looks at the libraries in your project and sets them up for you. It sees Tomcat, so it starts Tomcat. It sees a database driver, so it prepares a connection pool.
- **An embedded server** lives inside your app. You ship one JAR file and run it on any machine that has Java.
- **External configuration** lets the same JAR talk to a test database on your laptop and the real database in production. You only change a properties file or an environment variable.
- **Actuator** adds ready-made endpoints for health and metrics once the app is live.

That is why you find Spring Boot behind bank systems, shopping sites, hospital software and thousands of small services. For you as a student, it is also one of the most asked-about skills in Java backend interviews.

> **Note:** This course uses Spring Boot 4.1 with Java 21. Spring Boot 4 needs Java 17 or newer and uses `jakarta.*` packages. Coming from Spring Boot 3? The web starter is now named `spring-boot-starter-webmvc`.

## How it works

A lot happens in the few seconds after you press Run. Here is the startup journey, from `main()` to an app that is ready for visitors.

```text
+--------------------------------+
|  You run main()                |
+--------------------------------+
                |
                v
+--------------------------------+
|  SpringApplication.run()       |
|  creates the app context       |
+--------------------------------+
                |
                v
+--------------------------------+
|  Load application.properties   |
+--------------------------------+
                |
                v
+--------------------------------+
|  Component scan finds your     |
|  classes (@RestController...)  |
+--------------------------------+
                |
                v
+--------------------------------+
|  Auto-configuration adds beans |
|  for libraries it detects      |
+--------------------------------+
                |
                v
+--------------------------------+
|  Embedded Tomcat starts        |
|  on port 8080: app is ready    |
+--------------------------------+
```

Read it from top to bottom. Your `main()` method hands control to `SpringApplication.run()`. Spring creates a container called the application context, reads your settings, finds your own classes, then fills in everything else your libraries need. The last step starts the web server, and the app waits for requests.

Now let's follow one request after startup.

```text
Browser or curl
     |   GET /shows
     v
Embedded Tomcat (port 8080)
     |
     v
DispatcherServlet (front desk)
     |
     v
ShowController.todaysShows()
     |   returns List<Show>
     v
Jackson turns objects into JSON
     |
     v
Response: 200 OK + JSON body
```

Tomcat receives the request and hands it to the DispatcherServlet, a front desk that checks the path and calls the right controller method. Your method returns plain Java objects, and Jackson, a JSON library from the web starter, turns them into JSON for the reply.

## Real-Life Example

Think about cooking dinner. Cooking from scratch means buying every spice, measuring each one, and hoping they suit each other. A meal kit arrives with the right ingredients already measured (those are the starters) and a recipe card with sensible default steps (that is auto-configuration). You can still add extra chilli if you like it hot, which is like overriding a default setting. You get dinner on the table faster, and you still decide how it tastes.

## Code Example

Let's build the smallest useful app: a service for a cinema called CineGo that lists today's shows as JSON. Here is the folder layout.

```text
cinego-tickets/
├─ pom.xml
└─ src/main/java/
   └─ com/cinego/tickets/
      ├─ TicketsApplication.java
      └─ ShowController.java
```

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

    <groupId>com.cinego</groupId>
    <artifactId>cinego-tickets</artifactId>
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

**File:** `TicketsApplication.java` in package `com.cinego.tickets`

```java
package com.cinego.tickets;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TicketsApplication {

    public static void main(String[] args) {
        SpringApplication.run(TicketsApplication.class, args);
    }
}
```

**File:** `ShowController.java` in package `com.cinego.tickets`

```java
package com.cinego.tickets;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ShowController {

    record Show(String movie, String time, int seatsLeft) {}

    @GetMapping("/shows")
    public List<Show> todaysShows() {
        return List.of(
                new Show("The Silent Orbit", "18:30", 42),
                new Show("Monsoon Express", "21:15", 7));
    }
}
```

Start the app from the project folder, then call the endpoint from a second terminal:

```bash
mvn spring-boot:run
curl http://localhost:8080/shows
```

**Output:**

```json
[
  {
    "movie": "The Silent Orbit",
    "time": "18:30",
    "seatsLeft": 42
  },
  {
    "movie": "Monsoon Express",
    "time": "21:15",
    "seatsLeft": 7
  }
]
```

This is the curl reply, spaced out here so it is easy to read; curl prints it on one line. Near the end of the startup log you will also see `Tomcat started on port 8080` and `Started TicketsApplication in 4.062 seconds`, though your timing will differ.

## Code Explained

- `@SpringBootApplication` is three annotations in one: `@Configuration` (this class can define beans), `@EnableAutoConfiguration` (switch on the smart defaults) and `@ComponentScan` (look for my classes in this package and below).
- `SpringApplication.run(...)` builds the application context and starts the embedded Tomcat server.
- `@RestController` marks the class as a web controller whose return values go straight into the response body.
- `@GetMapping("/shows")` connects the path `/shows` to the `todaysShows()` method for GET requests.
- `record Show(...)` is a compact Java class for data. Jackson reads its fields and uses their names as JSON keys.

Notice what is missing. There is no web.xml file, no server to install and no JSON setup. Spring Boot handled all of that.

## Plain Spring vs Spring Boot at a Glance

| Task | Plain Spring setup | With Spring Boot |
|---|---|---|
| Library versions | You match each version by hand | Starters bring tested versions |
| Web server | Install Tomcat and deploy a WAR file | Tomcat is embedded in your JAR |
| Configuration | Write config for almost everything | Auto-configuration with defaults you can override |
| Running the app | Copy the WAR to a server and restart it | `java -jar app.jar` |
| Health checks | Build them yourself | Add the Actuator starter |

## Common Mistakes

> **Warning:** If your controller sits in a package outside the main application class's package, component scan will not find it, and every request returns 404. Keep `com.cinego.tickets.web` under `com.cinego.tickets`, not in `com.other`.

- **Port already in use.** If another app holds port 8080, startup stops with "Port 8080 was already in use". Close the other app or set `server.port=8081` in `application.properties`.
- **Copying old `javax` imports.** Many older blog posts use `javax.persistence` or `javax.validation`. Spring Boot 3 and 4 need the `jakarta` versions, or the code will not compile.

## Interview Questions

**What is Spring Boot, in two lines?**
It is a framework on top of Spring that gives you starters, auto-configuration and an embedded server, so you can build stand-alone, production-ready Java apps with very little setup.

**What does @SpringBootApplication do?**
It combines `@Configuration`, `@EnableAutoConfiguration` and `@ComponentScan`, so one annotation marks the main class, turns on auto-configuration and scans for components.

**What is an embedded server, and why does it help?**
The web server runs inside your application's JAR. You deploy a single file, and every environment runs the same server version.

## Key Points to Remember

- Spring Boot is built on the Spring Framework. It makes Spring faster to start with; it does not replace it.
- Starters give you a tested set of libraries for one job, such as building a web app.
- Auto-configuration sets up beans based on what it finds in your project, and you can override any default.
- The embedded Tomcat server means your whole app ships as one runnable JAR.
- `@SpringBootApplication` plus `SpringApplication.run()` is all it takes to boot an app.

## Frequently Asked Questions

### Is Spring Boot a framework or a library?

It is a framework. A library is code you call when you need it. A framework calls your code: Spring Boot starts the app, creates your objects and sends requests to your methods.

### Is Spring Boot used for frontend or backend?

Backend. It runs on the server, talks to databases and sends data out, usually as JSON. A React, Angular or mobile app can then show that data to users.

### Do I need to learn Spring before Spring Boot?

No. Most learners start with Spring Boot directly. You will pick up core Spring ideas such as beans and dependency injection along the way, and this course teaches them in order.

### Is Spring Boot free to use?

Yes. Spring Boot is open source under the Apache 2.0 license, so you can use it in personal and commercial projects without paying.

## Related Topics

- [Spring vs Spring Boot](/learning/spring-boot-tutorial/spring-vs-spring-boot): see exactly what Spring Boot adds on top of Spring.
- [Installing JDK and IDE for Spring Boot](/learning/spring-boot-tutorial/installing-jdk-and-ide-for-spring-boot): get Java 21 and an editor ready.
- [Creating a Project with Spring Initializr](/learning/spring-boot-tutorial/creating-a-project-with-spring-initializr): generate your first project in a minute.
- [Auto Configuration](/learning/spring-boot-tutorial/auto-configuration): learn how the smart defaults are chosen.
