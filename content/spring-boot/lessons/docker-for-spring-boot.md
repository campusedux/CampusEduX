Have you ever heard a developer say, "But it works on my machine"? On the test server there is Java 17, a missing file and a different port, and the app fails. It is like a cook who makes perfect biryani in his own kitchen but cannot repeat it in a rented one.

Docker fixes this by packing the app with everything it needs, so it runs the same everywhere. In this guide to Docker for Spring Boot you will learn what Docker is, how to write a Dockerfile for your app, how layers make builds fast, and how to run the container.

## What is Docker for Spring Boot?

> **Definition:** Docker is a tool that packages an application and everything it needs to run, such as the Java runtime, libraries and files, into a portable unit called an image. A running copy of an image is called a container.

Think of an image as a sealed tiffin box that already holds the cooked meal. A container is that box opened and served. You can serve a hundred boxes from the same recipe, and each is identical.

| Term | Meaning |
|---|---|
| Image | A read-only package: runtime, app and files |
| Container | A running instance of an image |
| Dockerfile | A text recipe that builds an image |
| Registry | A store for images, such as Docker Hub |
| Volume | Storage that outlives a container |
| Compose | A file that starts several containers together |

A container is not a full virtual machine. It shares the host's operating system kernel, so it starts in seconds and uses little memory.

## Why is it used?

- **Same everywhere.** The image that passes testing is the image that runs in production.
- **No install fights.** You do not need the right Java version on each server, because Java is inside the image.
- **Easy scaling.** Start ten containers from the same image when traffic grows.
- **Cloud ready.** Almost every cloud platform can run containers directly.

Spring Boot suits Docker well because your app is already one runnable JAR with an embedded server. You only need a Java runtime around it.

## How it works

Here is the path from your code to a running container.

```text
Source code + pom.xml
  |
  |  mvn package
  v
app.jar
  |
  |  docker build (Dockerfile)
  v
Image (freshcart:1.0)
  |
  |  docker run
  v
Container on port 8080
```

Maven turns your code into one JAR. The `docker build` command follows the Dockerfile and creates an image. The `docker run` command starts a container from that image.

A Dockerfile is a list of steps, and each step creates a layer. Docker caches layers. If a step and everything before it has not changed, Docker reuses the cached layer and skips the work. So put things that change rarely, like libraries, near the top, and things that change often, like your own code, at the bottom.

```text
Layer 4: your classes   (changes)
Layer 3: snapshot libs (sometimes)
Layer 2: loader
Layer 1: dependencies   (rarely)
```

A Spring Boot JAR is mostly libraries, and your own code is a small part. If you copy the whole JAR as one layer, any code change rebuilds and re-uploads all of it. Spring Boot can split the JAR into layers for you, which we use below. After the first build, a code change only rebuilds the small top layer.

## Real-Life Example

A shipping company moves goods in standard steel containers. It does not matter what the container carries. The crane, the ship and the truck all handle the same box. Docker does the same for software. The app is the cargo, and the container is the standard box. Any machine with Docker is a ship that can carry it.

## Code Example

Let's containerise FreshCart, a small grocery service with a product list and a health check. First the Spring Boot code, then the Dockerfile.

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

    <groupId>com.freshcart</groupId>
    <artifactId>store</artifactId>
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
            <artifactId>spring-boot-starter-actuator</artifactId>
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
server.port=${PORT:8080}
management.endpoints.web.exposure.include=health
```

**File:** `StoreApplication.java` in package `com.freshcart.store`

```java
package com.freshcart.store;

import java.util.List;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class StoreApplication {

    record Product(String name, int priceInRupees) {}

    public static void main(String[] args) {
        SpringApplication.run(StoreApplication.class, args);
    }

    @GetMapping("/products")
    public List<Product> products() {
        return List.of(new Product("Tomatoes 1kg", 40), new Product("Milk 1L", 62));
    }
}
```

**File:** `Dockerfile`

```dockerfile
FROM eclipse-temurin:21-jre AS builder
WORKDIR /builder
COPY target/store-0.0.1-SNAPSHOT.jar app.jar
RUN java -Djarmode=tools -jar app.jar extract --layers --destination extracted

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system appuser
COPY --from=builder /builder/extracted/dependencies/ ./
COPY --from=builder /builder/extracted/spring-boot-loader/ ./
COPY --from=builder /builder/extracted/snapshot-dependencies/ ./
COPY --from=builder /builder/extracted/application/ ./
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**File:** `.dockerignore`

```text
target/classes
.git
.idea
*.log
```

Build the JAR, build the image, and run the container:

```bash
mvn clean package
docker build -t freshcart:1.0 .
docker run -d --name freshcart -p 8080:8080 freshcart:1.0
curl http://localhost:8080/products
curl http://localhost:8080/actuator/health
```

**Output:**

```json
[
  {"name": "Tomatoes 1kg", "priceInRupees": 40},
  {"name": "Milk 1L", "priceInRupees": 62}
]
```

The second call returns this health reply:

```json
{"groups":["liveness","readiness"],"status":"UP"}
```

> **Note:** Docker is not installed on the machine where this guide was tested, so the `docker` commands were not run there. We built the JAR, ran the same layer extraction that the Dockerfile uses, and started the app from the extracted files. The two replies above come from that real run, spaced out here for reading. Inside the container you get the same replies, because it runs the same files.

## Code Explained

- The `pom.xml` has the web starter and the Actuator starter. The properties file exposes the health endpoint and reads the port from a variable named `PORT`, with 8080 as the default.
- **Stage one** (`AS builder`) copies the JAR and runs Spring Boot's `tools` mode. That splits the JAR into four folders: `dependencies`, `spring-boot-loader`, `snapshot-dependencies` and `application`. The loader and snapshot folders can be empty for a simple app, and Docker copies an empty folder without complaint.
- **Stage two** starts from a fresh image and copies the folders in order, from the least to the most changing. Docker turns each `COPY` into a layer, so a change in your code touches only the last one.
- Only the second stage ends up in the final image. The extra files from stage one are thrown away, which keeps the image smaller.
- `useradd` and `USER` make the app run as a normal user, not as root. A break-in then has fewer rights.
- `EXPOSE 8080` documents the port. The real mapping is `-p 8080:8080`: host port first, container port second.
- `ENTRYPOINT` starts the app with `java -jar app.jar`, the same command you use on your laptop.

> **Tip:** Spring Boot can also build an image without a Dockerfile, using `mvn spring-boot:build-image`. It uses Cloud Native Buildpacks and needs Docker running. A Dockerfile gives you more control and is easier to read for beginners.

## Common Mistakes

> **Warning:** Do not copy your whole project folder into the image with `COPY . .` and no `.dockerignore`. Build folders, local files and anything private in that folder end up inside the image, and anyone who gets the image can read them.

- **Forgetting to build the JAR first.** The `COPY target/...` step fails if `mvn package` has not run.
- **Mapping the wrong port.** The app listens on 8080 inside the container. If you forget `-p`, nothing on your laptop can reach it.
- **Running as root.** Add a normal user, as we did.
- **Using a full JDK image at runtime.** A JRE image is smaller and enough to run a JAR.
- **Writing settings into the Dockerfile.** Values that change between test and production belong outside the image, given when the container starts.
- **Using the `latest` tag.** Pin versions such as `21-jre` so your build does not change by surprise.

## Interview Questions

**What is the difference between an image and a container?**
An image is the read-only package. A container is a running instance made from it.

**What is a Dockerfile?**
A text file with the steps to build an image, such as choosing a base image, copying the JAR and setting the start command.

**Why use a multi-stage build?**
To keep build-time files out of the final image, so it is smaller and cleaner.

**How do layers help a Spring Boot image?**
Libraries change rarely and your code changes often. Separate layers let Docker reuse the cached library layers and rebuild only the code layer.

**How do you pass configuration to a container?**
With the `-e` option of `docker run`, for example a profile name or your own `PORT` value.

## Key Points to Remember

- An image is the package; a container is a running copy.
- A Dockerfile lists build steps, and each step is a cached layer.
- Put rarely changing files first for faster builds.
- Spring Boot's layered JAR splits libraries from your own code.
- Publish ports with `-p host:container` and run as a non-root user.
- Keep settings that change per server outside the image.

## Frequently Asked Questions

### Do I need Docker for Spring Boot development?

No. You can learn everything else without it. Docker helps when you deploy, or when your app needs a database or broker you do not want to install by hand.

### What is the difference between Docker and a virtual machine?

A virtual machine carries a full operating system. A container shares the host's kernel, so it is lighter and starts faster.

### How do I connect a Spring Boot container to a database container?

Put both in one Docker Compose file. Compose gives each service a name, and your app uses that name as the host in its database URL instead of `localhost`.

### Which base image should I use for Docker with Spring Boot?

A small Java 21 runtime image, such as a Temurin JRE image, matches the Java version in your `pom.xml`. Always use the same major version you built with.

## Related Topics

- [Deploying Spring Boot Application](/learning/spring-boot-tutorial/deploying-spring-boot-application): taking your app to a real server.
- [Introduction to Microservices with Spring Boot](/learning/spring-boot-tutorial/introduction-to-microservices-with-spring-boot): why each service ships as its own container.
- [Spring Boot Actuator](/learning/spring-boot-tutorial/spring-boot-actuator): the health endpoint we used.
- [Externalized Configuration](/learning/spring-boot-tutorial/externalized-configuration): how the app reads settings from outside.
