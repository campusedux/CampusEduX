When you buy a new mixer grinder, it comes with a manual: what each button does, what the jar sizes are, and what to do if it stops. Without it, you would press buttons and hope. An API is the same. A mobile developer who wants to call your endpoints needs a manual: which addresses exist, what to send, and what comes back. Swagger and OpenAPI documentation gives your Spring Boot app a manual that writes itself from your code and even lets people try the calls in the browser.

In this guide you will add API documentation to a hotel rooms service, open the interactive page, describe endpoints with annotations, and look at the raw OpenAPI file behind it.

## What is Swagger and OpenAPI Documentation?

> **Definition:** OpenAPI is a standard file format that describes a REST API: its paths, inputs, outputs and error codes. Swagger is the family of tools around it, including Swagger UI, a web page that reads an OpenAPI file and shows it as clickable documentation with a "Try it out" button.

People often use the two names as one, so here is the clear picture:

- **OpenAPI** is the specification, the format of the manual.
- **Swagger UI** is the reader that draws the manual as a web page.
- **springdoc-openapi** is the library that scans your Spring code and produces the OpenAPI file for you.

You do not write the file by hand. Springdoc reads your controllers, request bodies and return types, and builds it while the app runs.

## Why is it used?

- **A manual that stays current.** It is created from the code, so it does not go out of date like a separate document.
- **Try before you code.** Frontend and mobile teams can call the API from the browser page and see real answers.
- **Fewer questions.** Testers and partners can find out what an endpoint expects without asking you.
- **Tool support.** From one OpenAPI file, tools can create client code, Postman collections and test cases.

## How it works

```text
Your controllers
(@RestController, records)
        |
        v
+------------------------+
| springdoc-openapi      |
| scans them at runtime  |
+------------------------+
        |
        v
+------------------------+
| /v3/api-docs           |
| the OpenAPI file, JSON |
+------------------------+
        |
        v
+------------------------+
| /swagger-ui.html       |
| the clickable page     |
+------------------------+
```

When the app starts, springdoc looks at your mapped endpoints and their types. It publishes the result as JSON at `/v3/api-docs`. Then Swagger UI, which is bundled in the starter, loads that JSON and draws the page. Anything you add with annotations, such as descriptions and example values, is merged into the same file.

## Real-Life Example

A restaurant prints a menu card with dish names, prices and notes like "contains nuts". The card is made from the kitchen's real list, so it always matches what the kitchen can cook. New waiters read the card instead of asking the chef. The OpenAPI file is that menu card, Swagger UI is the printed page, and the try-it button is a waiter who fetches a sample dish for you.

## Code Example

Let's document StayWell Hotels. The app has three endpoints for rooms. We use the springdoc starter for Spring MVC with the UI included. Spring Boot does not manage its version, so we give it ourselves. Version 3.1.1 built and ran with Spring Boot 4.1.1 here.

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

    <groupId>com.staywell</groupId>
    <artifactId>rooms</artifactId>
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
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>3.1.1</version>
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
spring.application.name=staywell-rooms
springdoc.swagger-ui.path=/docs
springdoc.swagger-ui.operations-sorter=method
```

**File:** `RoomsApplication.java` in package `com.staywell.rooms`

```java
package com.staywell.rooms;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class RoomsApplication {

    public static void main(String[] args) {
        SpringApplication.run(RoomsApplication.class, args);
    }

    @Bean
    OpenAPI staywellApi() {
        return new OpenAPI().info(new Info()
            .title("StayWell Rooms API")
            .version("1.0")
            .description("Search and manage hotel rooms."));
    }
}
```

**File:** `Room.java` in package `com.staywell.rooms`

```java
package com.staywell.rooms;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "A hotel room")
public record Room(
    @Schema(description = "Room number", example = "101") int number,
    @Schema(description = "Room type", example = "Deluxe") String type,
    @Schema(description = "Price per night in rupees", example = "3500") int pricePerNight) {}
```

**File:** `RoomController.java` in package `com.staywell.rooms`

```java
package com.staywell.rooms;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rooms")
@Tag(name = "Rooms", description = "Room search and management")
public class RoomController {

    private final List<Room> rooms = new CopyOnWriteArrayList<>(List.of(
        new Room(101, "Deluxe", 3500), new Room(102, "Standard", 2200)));

    @Operation(summary = "List all rooms")
    @GetMapping
    public List<Room> all() {
        return rooms;
    }

    @Operation(summary = "Find one room by its number")
    @ApiResponse(responseCode = "200", description = "Room found")
    @ApiResponse(responseCode = "404", description = "No room with that number", content = @io.swagger.v3.oas.annotations.media.Content)
    @GetMapping("/{number}")
    public ResponseEntity<Room> one(@PathVariable int number) {
        return rooms.stream().filter(r -> r.number() == number).findFirst()
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Add a new room")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public Room add(@RequestBody Room room) {
        rooms.add(room);
        return room;
    }
}
```

Run the app with `./mvnw spring-boot:run`, then open `http://localhost:8080/docs` in a browser for the interactive page. To see the raw OpenAPI file, open the address below.

```bash
curl http://localhost:8080/v3/api-docs
```

**Output:**

```text
openapi: 3.1.0
title: StayWell Rooms API
version: 1.0

GET /rooms
  summary: List all rooms
  responses: 200
POST /rooms
  summary: Add a new room
  responses: 201
GET /rooms/{number}
  summary: Find one room by
    its number
  responses: 200, 404

schema Room: number, type,
  pricePerNight
```

The real reply is one long line of JSON. The text above is a short summary of it. When we ran the app, `/docs` and `/swagger-ui/index.html` both answered with status `200`.

## Code Explained

- The single springdoc starter brings both the scanner and the Swagger UI files. Spring Boot does not manage its version, so it must be written in the `pom.xml`. Pick the release that matches your Spring Boot line, as listed in the springdoc documentation.
- With no code at all, springdoc already lists the three endpoints, their paths and the `Room` shape. The annotations only make the manual friendlier.
- The `OpenAPI` bean sets the title, version and description shown at the top of the page.
- `@Schema` on the record describes each field and gives an example value. Those examples are what "Try it out" pre-fills in the request body.
- `@Tag` groups the endpoints under the heading "Rooms". `@Operation(summary = ...)` gives each one a short, readable title.
- `@ApiResponse` documents the status codes an endpoint can return, such as the `404` for a missing room.
- The property `springdoc.swagger-ui.path` moves the page to `/docs`. The raw file stays at `/v3/api-docs`.

## Hiding the Docs in Production

The manual lists every endpoint, which is helpful for you and for attackers who want to explore your API. Turn it off where it should not be public.

```properties
springdoc.api-docs.enabled=false
springdoc.swagger-ui.enabled=false
```

Put these in the production profile, for example `application-prod.properties`, so local and test environments keep the docs. If the docs stay on, put them behind a login.

## Common Mistakes

> **Warning:** Leaving Swagger UI open on a public production server shows every endpoint to the world. Disable it, or protect it, in production.

- **Forgetting the version.** The springdoc starter is not managed by Spring Boot, so a missing `<version>` fails the build.
- **Using the wrong springdoc line for your Spring Boot.** Old 1.x and 2.x releases target older Spring Boot versions. Check the compatibility table.
- **Blocking the docs with Spring Security.** If you use security, allow `/v3/api-docs/**` and the Swagger UI paths, or log in first.
- **Returning `Map` or `Object` everywhere.** The manual can only describe what it can see. Use records for requests and responses.
- **Over-annotating.** Long descriptions on every field slow you down. Add the notes that help a reader, and skip the rest.
- **Treating the docs as a test.** The page shows what the code does, not whether it is right.

## Interview Questions

**What is the difference between Swagger and OpenAPI?**
OpenAPI is the specification for describing a REST API. Swagger is the set of tools around it, such as Swagger UI.

**Which library generates OpenAPI docs in Spring Boot?**
springdoc-openapi. It scans your controllers at runtime and serves the OpenAPI file and Swagger UI.

**Where is the raw OpenAPI file served?**
At `/v3/api-docs` by default.

**How do you document a status code on an endpoint?**
Add `@ApiResponse(responseCode = "404", description = "...")` to the method.

**Should Swagger UI be enabled in production?**
Usually not. Disable it or protect it behind a login, because it exposes the full API surface.

## Key Points to Remember

- OpenAPI describes an API, and Swagger UI shows it as a web page.
- One springdoc starter gives you both, with the version set in your `pom.xml`.
- The file is built from your code, so it stays in step with it.
- `@Tag`, `@Operation`, `@Schema` and `@ApiResponse` add clear notes.
- Turn the docs off or protect them in production.

## Frequently Asked Questions

### Is Swagger and OpenAPI documentation automatic in Spring Boot?

Mostly. Springdoc creates a working manual from your controllers with no annotations. You add annotations only to improve it.

### What URL opens Swagger UI?

By default `/swagger-ui.html` (or `/swagger-ui/index.html`). In our example we changed it to `/docs` with a property.

### Can I use Swagger with Spring Security?

Yes. Allow the docs paths in your security rules, or add a login button using a security scheme in the OpenAPI bean.

### Can I generate a client from the OpenAPI file?

Yes. Tools such as OpenAPI Generator read the file and create client code for Java, TypeScript and many other languages.

## Related Topics

- [Building a Complete CRUD REST API](/learning/spring-boot-tutorial/building-a-complete-crud-rest-api): the kind of API this page documents.
- [Standard API Error Response](/learning/spring-boot-tutorial/standard-api-error-response): document your error shape too.
- [Spring Security Basics](/learning/spring-boot-tutorial/spring-security-basics): keep the docs page safe.
- [DTO Pattern](/learning/spring-boot-tutorial/dto-pattern): clear request and response types make clear documentation.
