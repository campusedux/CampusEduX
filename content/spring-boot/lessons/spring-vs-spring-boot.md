Imagine two ways to get a computer. You can buy a box of excellent parts: a motherboard, memory, a power supply and a case, and then spend a weekend fitting them together. Or you can buy a laptop built from those same kinds of parts, open the lid and press the power button. Spring is the box of parts. Spring Boot is the laptop. And just like a laptop, you can still open it up and swap a part when you need to.

Students often think Spring and Spring Boot are rivals, or that one replaces the other. Neither is true. Let's see how they fit together, what each one does, and when the difference matters.

## What is the difference between Spring and Spring Boot?

> **Definition:** The Spring Framework is a large Java framework that gives you the core building blocks: dependency injection, web MVC, data access and transactions. Spring Boot is a layer on top of Spring that sets those blocks up for you, so an app runs with almost no setup.

Here is how the layers stack up inside a typical web app.

```text
+--------------------------------+
|  Your code (controllers ...)   |
+--------------------------------+
|  Spring Boot                   |
|  starters, auto-config, server |
+--------------------------------+
|  Spring Framework              |
|  DI, MVC, data, transactions   |
+--------------------------------+
|  Java 21 + the JVM             |
+--------------------------------+
```

Your code sits on top and talks to Spring. Spring Boot sits between the two, choosing library versions, creating the objects Spring needs and starting the web server. Take Spring Boot away and Spring still works; you just have to do all of that setup yourself.

So the honest answer to "Spring or Spring Boot?" is usually "both". When you write a Spring Boot app, every annotation you use, such as `@RestController` or `@Transactional`, comes from the Spring Framework. Spring Boot's job is to get Spring ready so those annotations work.

## Why does Spring Boot exist?

Spring has been around since 2003 and it is powerful, but a plain Spring project asks a lot from you before you write a single feature:

- **Version matching.** You pick a version for Spring, for the JSON library, for the servlet API and for everything else, and make sure they all get along.
- **Wiring the web layer.** You register the DispatcherServlet, the class that receives every web request, and switch on Spring MVC yourself.
- **A separate server.** You package the app as a WAR file and deploy it into a Tomcat server that someone has installed and configured.
- **Repeating it all.** Every new project needs the same setup again, and every team does it a little differently.

Spring Boot was created in 2014 to remove that repeated work. Its starters fix the version puzzle, auto-configuration does the wiring, and the embedded server removes the separate install. The Spring underneath is the same Spring.

## How it works

Let's compare the steps for one small web app, first with plain Spring.

```text
Plain Spring web app
--------------------
Pick versions for every library
        |
        v
Write the servlet + MVC setup
        |
        v
Build a WAR file
        |
        v
Install and configure Tomcat
        |
        v
Copy the WAR into Tomcat
        |
        v
Start Tomcat, app is live
```

Most of these steps have nothing to do with your business idea. They are plumbing, and a mistake in any one of them stops the app from starting.

Now the same app with Spring Boot.

```text
Spring Boot web app
-------------------
Add the webmvc starter
        |
        v
Write your controller
        |
        v
Run main() or java -jar
        |
        v
Tomcat starts inside the app
```

The plumbing did not disappear. Spring Boot does it for you at startup, based on what it finds in your project. That is why the second picture is so much shorter.

## Real-Life Example

Think of a food delivery company launching in a new city. With plain Spring, it is like building a kitchen from nothing: buying stoves, checking the gas lines, hiring electricians. With Spring Boot, it is like renting a cloud kitchen that already has stoves, gas and fridges. The recipes, which are your features, are exactly the same in both kitchens. Only the setup time changes.

## Code Example

Here is the CineGo shows API from the first topic, written with plain Spring and no Spring Boot. It needs four files.

**File:** `pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.cinego</groupId>
    <artifactId>cinego-plain</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <packaging>war</packaging>

    <properties>
        <maven.compiler.release>21</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-webmvc</artifactId>
            <version>7.0.9</version>
        </dependency>
        <dependency>
            <groupId>tools.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>3.1.5</version>
        </dependency>
        <dependency>
            <groupId>jakarta.servlet</groupId>
            <artifactId>jakarta.servlet-api</artifactId>
            <version>6.1.0</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>

    <build>
        <finalName>cinego-plain</finalName>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-war-plugin</artifactId>
                <version>3.4.0</version>
            </plugin>
        </plugins>
    </build>
</project>
```

**File:** `WebConfig.java` in package `com.cinego.plain`

```java
package com.cinego.plain;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

@Configuration
@EnableWebMvc
@ComponentScan("com.cinego.plain")
public class WebConfig {
}
```

**File:** `AppInitializer.java` in package `com.cinego.plain`

```java
package com.cinego.plain;

import org.springframework.web.servlet.support.AbstractAnnotationConfigDispatcherServletInitializer;

public class AppInitializer extends AbstractAnnotationConfigDispatcherServletInitializer {

    @Override
    protected Class<?>[] getRootConfigClasses() {
        return new Class<?>[0];
    }

    @Override
    protected Class<?>[] getServletConfigClasses() {
        return new Class<?>[] { WebConfig.class };
    }

    @Override
    protected String[] getServletMappings() {
        return new String[] { "/" };
    }
}
```

**File:** `ShowController.java` in package `com.cinego.plain`

```java
package com.cinego.plain;

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

Build the WAR, copy it into a Tomcat 11 server you installed yourself, start Tomcat, then call the API:

```bash
mvn package
cp target/cinego-plain.war $CATALINA_HOME/webapps/
$CATALINA_HOME/bin/startup.sh
curl http://localhost:8080/cinego-plain/shows
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

The reply is the same as the Spring Boot version, spaced out here for reading. Notice the `/cinego-plain` part of the address: Tomcat names the app after the WAR file.

## Code Explained

- **pom.xml** lists three libraries, and you must pick a version for each one that matches the others. There is no parent to manage versions for you.
- **WebConfig** switches on Spring MVC with `@EnableWebMvc` and tells Spring where to look for controllers with `@ComponentScan`.
- **AppInitializer** registers the DispatcherServlet with Tomcat and maps it to `/`, so it receives every request.
- **ShowController** is exactly the same class as in the Spring Boot version. Your feature code does not change at all.

With Spring Boot, the `WebConfig` and `AppInitializer` classes disappear, the three versions are replaced by one starter, and the WAR plus Tomcat install becomes a single runnable JAR.

## Spring vs Spring Boot Comparison

| Point | Spring Framework | Spring Boot |
|---|---|---|
| What it is | The core framework | A layer that sets up Spring |
| Setup | You configure most things | Auto-configuration with defaults |
| Library versions | You choose each one | Starters bring matched sets |
| Web server | External, deploy a WAR | Embedded, run a JAR |
| Getting started | Slower | Minutes |
| Control | Full, but manual | Full, override any default |
| Production checks | Build your own | Actuator ready to add |

## When Plain Spring Still Makes Sense

Plain Spring is still a fair choice when a company must deploy into a shared application server that runs many WAR files, or when a large old project was built before Spring Boot existed. For almost every new project, teams pick Spring Boot.

## Common Mistakes

> **Warning:** Do not mix version numbers by hand in a Spring Boot project. If you add a version to a Spring library that the parent already manages, you can end up with two versions that do not work together.

- **Calling Spring Boot a replacement for Spring.** It is built on Spring and needs it.
- **Thinking annotations belong to Spring Boot.** `@RestController`, `@Service` and `@Transactional` all come from the Spring Framework.

## Interview Questions

**Is Spring Boot a replacement for the Spring Framework?**
No. Spring Boot is built on Spring. It configures Spring automatically, but the container, MVC and data features still come from the Spring Framework.

**What does Spring Boot remove from a plain Spring project?**
Hand-picked library versions, the DispatcherServlet and MVC setup classes, and the separate server install, because starters, auto-configuration and the embedded server cover them.

**Can you still customise Spring when using Spring Boot?**
Yes. Every default can be overridden with properties or with your own beans, and Spring Boot then steps back.

## Key Points to Remember

- Spring is the core framework; Spring Boot is a layer that sets Spring up for you.
- Your controllers and services are the same code in both.
- Plain Spring needs manual version picking, MVC setup and an external server.
- Spring Boot uses starters, auto-configuration and an embedded server instead.
- Most new projects use Spring Boot, but knowing plain Spring explains what Spring Boot does behind the scenes.

## Frequently Asked Questions

### Should I learn Spring or Spring Boot first?

Start with Spring Boot. You get a working app quickly, and you still learn core Spring ideas such as beans and dependency injection along the way.

### Is Spring Boot slower than plain Spring?

Not in any way you will notice for normal apps. Both run the same Spring code. Spring Boot only does extra setup work while the app starts.

### Can I convert a Spring project to Spring Boot?

Yes. You add the Spring Boot parent and starters, create a main class with `@SpringBootApplication`, and remove the setup classes that auto-configuration now handles.

### Do companies still use plain Spring?

Some older systems do, especially those deployed as WAR files to shared servers. New services are mostly written with Spring Boot.

## Related Topics

- [What is Spring Boot](/learning/spring-boot-tutorial/what-is-spring-boot): the full picture of what Spring Boot gives you.
- [Spring Boot Starters](/learning/spring-boot-tutorial/spring-boot-starters): how one dependency brings a matched set of libraries.
- [Auto Configuration](/learning/spring-boot-tutorial/auto-configuration): how Spring Boot does the wiring for you.
- [Inversion of Control](/learning/spring-boot-tutorial/inversion-of-control): the core Spring idea that both share.
