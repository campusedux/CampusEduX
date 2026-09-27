Every building project starts with a plan that lists the materials, where each one comes from, and the order the work happens in. Builders do not guess; they follow the plan. In a Spring Boot project that plan is `pom.xml`. It tells Maven what your project is called, which libraries it needs, which Java version to use, and how to package the final app.

The file looks long and full of angle brackets at first, but it has only a handful of parts. By the end of this guide you will be able to read any Spring Boot `pom.xml` and change it with confidence.

## What is pom.xml?

> **Definition:** `pom.xml` is the Project Object Model file. It is the single file where Maven reads your project's identity, its dependencies, its settings and its build plugins.

Maven is the build tool. It downloads libraries, compiles your code, runs your tests and creates the JAR. It does all of that by reading `pom.xml`, so the file is effectively the instruction sheet for your whole build.

## Why is it used?

Without a build file you would download every library by hand, keep track of its version, and type long `javac` commands. `pom.xml` fixes that:

- **Dependencies by name.** You write which library you want; Maven downloads it and every library it needs in turn.
- **One place for versions.** With the Spring Boot parent, you usually write no version numbers at all.
- **The same build everywhere.** Your laptop, your teammate's laptop and the build server all read the same file and get the same result.
- **Plugins.** Extra steps, such as making a runnable Spring Boot JAR, are switched on in the same file.

## How it works

Maven runs your build in a fixed order of phases called the lifecycle. When you ask for one phase, every phase before it runs first.

```text
validate  check pom.xml
    |
    v
compile   javac on src/main
    |
    v
test      run src/test tests
    |
    v
package   build the JAR
    |
    v
verify    run extra checks
    |
    v
install   copy JAR to ~/.m2
```

So `./mvnw package` validates, compiles, tests and then packages. Libraries are downloaded into a cache folder called `~/.m2/repository` on first use, which is why the first build is slow and later builds are fast.

## Real-Life Example

Think of ordering at a restaurant with a set menu. You say "Thali, please" and a full plate arrives with rice, dal, sabzi and roti that go well together. You do not choose each item's recipe. The Spring Boot parent is that set menu for library versions: you name a starter, and a matching set of libraries arrives. If you really want extra chilli, you can still ask for it, which is like overriding one version.

## Code Example

Here is the complete `pom.xml` for a hospital appointments service, with every part labelled below it.

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
    <artifactId>appointments</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>appointments</name>

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
            <artifactId>spring-boot-starter-webmvc-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <finalName>appointments</finalName>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

**File:** `AppointmentsApplication.java` in package `com.citycare.appointments`

```java
package com.citycare.appointments;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class AppointmentsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AppointmentsApplication.class, args);
    }

    @GetMapping("/slots/today")
    public int freeSlotsToday() {
        return 14;
    }
}
```

Build the JAR and run it:

```bash
./mvnw package
java -jar target/appointments.jar
curl http://localhost:8080/slots/today
```

**Output:**

```text
[INFO] BUILD SUCCESS
14
```

The first line comes from the build, and `14` is the curl reply. Because of `finalName`, the JAR is simply `target/appointments.jar` instead of the longer default name with the version in it.

## Code Explained

- **modelVersion** is always `4.0.0`. It is the version of the POM format, not of your app.
- **parent** makes your project inherit from `spring-boot-starter-parent`. This is where the version-free dependencies come from.
- **groupId, artifactId, version** are your project's coordinates, like a full postal address. Together they identify your JAR uniquely.
- **properties** holds settings. `java.version` tells the compiler to build for Java 21; the parent's default is 17.
- **dependencies** lists what you need. Notice there are no `<version>` tags; the parent supplies them.
- **scope test** means the test starter is only used to compile and run tests, and it is left out of the final JAR.
- **build** sets the JAR's `finalName` and switches on `spring-boot-maven-plugin`, which turns the normal JAR into a runnable one with every library inside.

## What the Parent Gives You

The starter parent quietly sets up a lot. It inherits from `spring-boot-dependencies`, which fixes the versions of about 195 libraries, including Spring Framework, Tomcat and Jackson, so they always match. It also sets UTF-8 encoding, passes your `java.version` to the compiler, configures the plugin's repackage step, and lets you use `@...@` placeholders inside `application.properties` that Maven fills in during the build.

## Reading the Dependency Tree

You added two starters, but your app uses dozens of libraries. `./mvnw dependency:tree` shows where each one comes from. Here is a simplified slice for this project:

```text
appointments
└─ starter-webmvc
   ├─ starter-jackson
   │  └─ jackson-databind 3.1.5
   └─ starter-tomcat
      └─ tomcat-embed-core 11.0.24
```

Each level is brought in by the one above it. These indirect libraries are called transitive dependencies. When a strange library shows up in your project, the tree tells you which starter pulled it in.

## Overriding a Managed Version

Sometimes a security fix is released for one library before a new Spring Boot version is out. With the starter parent, you override the version through a property rather than by adding a `<version>` tag:

```xml
<properties>
    <java.version>21</java.version>
    <tomcat.version>11.0.26</tomcat.version>
</properties>
```

This one line moves every Tomcat JAR, core, websocket and expression language, to the same version together, which a single `<version>` tag would not do. Use it only when you have a clear reason, and remove it when you upgrade Spring Boot.

## Dependency Scopes

| Scope | Available when | Typical example |
|---|---|---|
| compile (default) | Everywhere, and packaged | spring-boot-starter-webmvc |
| test | Only in tests, not packaged | spring-boot-starter-webmvc-test |
| runtime | When running, not when compiling | A database driver |
| provided | Compiling only; the server supplies it at runtime | The servlet API in a WAR |

## Common Mistakes

> **Warning:** Do not add a `<version>` to a dependency that the parent already manages unless you have a real reason. You override the tested version and can create conflicts that only show up at runtime.

- **Removing the parent.** Every Spring Boot starter then needs a version, and Maven stops with a "version is missing" error.
- **Editing but not reloading.** After changing `pom.xml`, reload the Maven project in your IDE so it downloads the new libraries.
- **Forgetting the plugin.** Without `spring-boot-maven-plugin` you get a tiny JAR without its libraries, and `java -jar` stops with "no main manifest attribute".

## Interview Questions

**What is the purpose of spring-boot-starter-parent?**
It gives version management for Spring Boot's libraries, sensible build defaults such as UTF-8 and the Java version, and plugin configuration, so your `pom.xml` stays short.

**What is the difference between compile, runtime, test and provided scopes?**
They decide when a dependency is on the classpath: always, only when running, only in tests, or only when compiling because the server provides it.

**What does spring-boot-maven-plugin do?**
It repackages the normal JAR into an executable one containing your code and all libraries, and it adds goals such as `spring-boot:run`.

## Key Points to Remember

- `pom.xml` holds your project's coordinates, dependencies, properties and build plugins.
- The Spring Boot parent manages library versions, so starters need no `<version>`.
- Set `java.version` in properties; the parent's default is 17.
- Use `test` scope for test-only libraries so they stay out of the JAR.
- `spring-boot-maven-plugin` builds the runnable JAR; `finalName` sets its file name.

## Frequently Asked Questions

### Where does Maven store downloaded libraries?

In a local cache, `~/.m2/repository` in your home folder. Every project on your computer shares it, so a library is downloaded only once.

### How do I see every library my project really uses?

Run `./mvnw dependency:tree`. It prints each dependency and, indented under it, the libraries it brought in.

### What does SNAPSHOT mean in my project version?

It marks a version that is still in development. When you publish a finished release you usually drop it, for example `1.0.0`.

### Can I use Spring Boot without the starter parent?

Yes. You can import `spring-boot-dependencies` as a BOM in `dependencyManagement` instead, which is useful when your company already has its own parent POM.

## Related Topics

- [Spring Boot Starters](/learning/spring-boot-tutorial/spring-boot-starters): what the starters in your dependencies bring in.
- [Spring Boot Project Structure](/learning/spring-boot-tutorial/spring-boot-project-structure): the folders Maven builds from.
- [Running a Spring Boot Application](/learning/spring-boot-tutorial/running-a-spring-boot-application): run the JAR this file produces.
