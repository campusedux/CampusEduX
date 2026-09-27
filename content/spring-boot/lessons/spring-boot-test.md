A car maker tests each part on a bench: the engine alone, the brakes alone. But before a car leaves the factory, someone also takes the whole car for a drive, with the engine, brakes, lights and steering all working together. Small tests tell you a part is good. The drive tells you the parts fit.

`@SpringBootTest` is that test drive. This guide on `@SpringBootTest` shows how to start the real Spring application inside a test, call it, and check that everything works together.

## What is @SpringBootTest?

> **Definition:** `@SpringBootTest` is an annotation that starts a full Spring application context for a test, with all your beans, settings and auto-configuration, so you can test the parts working together.

A normal unit test creates one class with `new`. A `@SpringBootTest` test asks Spring Boot to do what `main` does: find your `@SpringBootApplication` class, scan for beans, read `application.properties` and wire everything. Then you can inject any bean into the test with `@Autowired`.

It can also start a real web server on a random port, or a fake web layer, depending on how you configure it.

## Why is it used?

- **Integration testing.** It checks that controllers, services and settings work together, not just alone.
- **Catches wiring mistakes.** A missing bean or a wrong setting shows up when the context starts.
- **Tests real behaviour.** Requests go through the same filters and converters as in production.
- **Flexible.** You can override settings or replace one bean with a mock.

Because it starts everything, it is slower than a unit test. Use it for a few important checks, and use small tests for the rest.

## How it works

Before the test class runs, Spring Boot builds the application context once. Every test method that needs it receives beans from that context. If another test class asks for the same configuration, the built context is reused from a cache.

```text
test class starts
      |
      v
find @SpringBootApplication
      |
      v
build the context
(beans + settings)
      |
      v
inject into the test
      |
      v
run test methods
```

The cache is what keeps a big suite bearable. Two test classes with the same setup share one context. Change anything, such as a property or a mock bean, and Spring builds a new context for that class. In our run, the first test needed about ten seconds to build the context, and a class with a changed property built its own.

## Web Environments

| Setting | What happens |
|---|---|
| `MOCK` (default) | No real server. A mock web layer is used. |
| `RANDOM_PORT` | A real server starts on a free port |
| `DEFINED_PORT` | A real server starts on the configured port |
| `NONE` | No web environment at all |

With the default mock environment, you call the app through `MockMvc`. With `RANDOM_PORT` you make real HTTP calls, and the `@LocalServerPort` annotation gives you the port that was chosen.

## Real-Life Example

Regal Cinema has a small service that tells how many seats are left for a show. There are 100 seats in the settings file and 30 are already booked. A unit test can check the subtraction. But only a full test shows that the setting is really read from the file, that the controller is wired to the service, and that the web address works. That is the job of `@SpringBootTest`.

## Code Example

Let's build the seat service and test it four ways: the whole context, a changed setting, `MockMvc` and a real server.

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

    <groupId>com.regal</groupId>
    <artifactId>shows</artifactId>
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
            <artifactId>spring-boot-starter-webmvc-test</artifactId>
            <scope>test</scope>
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
cinema.total-seats=100
```

**File:** `ShowsApplication.java` in package `com.regal.shows`

```java
package com.regal.shows;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShowsApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShowsApplication.class, args);
    }
}
```

**File:** `ShowService.java` in package `com.regal.shows`

```java
package com.regal.shows;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ShowService {

    private final AtomicInteger booked = new AtomicInteger(30);
    private final int totalSeats;

    public ShowService(@Value("${cinema.total-seats}") int totalSeats) {
        this.totalSeats = totalSeats;
    }

    public int seatsLeft() {
        return totalSeats - booked.get();
    }
}
```

**File:** `ShowController.java` in package `com.regal.shows`

```java
package com.regal.shows;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ShowController {

    private final ShowService service;

    public ShowController(ShowService service) {
        this.service = service;
    }

    @GetMapping("/seats")
    public String seats() {
        return "Seats left: " + service.seatsLeft();
    }
}
```

**File:** `ShowContextTest.java` in `src/test/java/com/regal/shows`

```java
package com.regal.shows;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ShowContextTest {

    @Autowired
    private ShowService service;

    @Test
    void contextLoadsAndReadsTheRealSettings() {
        assertThat(service.seatsLeft()).isEqualTo(70);
    }
}
```

**File:** `ShowPropertyTest.java` in `src/test/java/com/regal/shows`

```java
package com.regal.shows;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "cinema.total-seats=50")
class ShowPropertyTest {

    @Autowired
    private ShowService service;

    @Test
    void testCanOverrideASetting() {
        assertThat(service.seatsLeft()).isEqualTo(20);
    }
}
```

**File:** `ShowMockMvcTest.java` in `src/test/java/com/regal/shows`

```java
package com.regal.shows;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ShowMockMvcTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void seatsEndpointAnswers() throws Exception {
        mvc.perform(get("/seats"))
                .andExpect(status().isOk())
                .andExpect(content().string("Seats left: 70"));
    }
}
```

**File:** `ShowRandomPortTest.java` in `src/test/java/com/regal/shows`

```java
package com.regal.shows;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ShowRandomPortTest {

    @LocalServerPort
    private int port;

    @Test
    void realServerAnswersOnARandomPort() throws Exception {
        HttpRequest request = HttpRequest.newBuilder(
                URI.create("http://localhost:" + port + "/seats")).build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isEqualTo("Seats left: 70");
    }
}
```

Run the tests:

```bash
./mvnw test
```

**Output:**

```text
Tests run: 4
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```

Maven prints the four counts on one line; they are split here for reading. All four test classes passed, each with one test.

## Code Explained

- `@SpringBootTest` alone finds `ShowsApplication`, because the test sits in the same package or below it. The first test injects `ShowService` and proves that the setting 100 was read, with 30 booked leaving 70.
- `properties = "cinema.total-seats=50"` overrides one setting for this test class only. The answer becomes 20.
- `@AutoConfigureMockMvc` adds a `MockMvc` bean. We call `/seats` without any server and check the status and the body. In Spring Boot 4 this annotation lives in the package `webmvc.test.autoconfigure` under `org.springframework.boot`, and the web test starter (the webmvc one ending in `-test`) brings it.
- `RANDOM_PORT` starts a real Tomcat on a free port. `@LocalServerPort` injects that port. We call it with Java's own `HttpClient`, so the test needs no extra library.
- The test starter is added with `test` scope, so it never reaches the production jar.

## When to Choose It

Ask what could go wrong. If the risk is inside one method, write a unit test. If the risk is that two parts are joined wrongly, or that a setting is misread, or that a request is mapped to the wrong address, write a `@SpringBootTest`. A good suite has many small tests and a handful of these full ones, like a factory that checks every part on the bench but drives each model only once.

## Overriding and Replacing Things

You have three easy tools. Use `properties` for a single setting. Use `@ActiveProfiles("test")` to load `application-test.properties` on top of the defaults. Use `@MockitoBean` to replace one bean with a mock, for example a payment gateway. Each of these makes the context different, so Spring builds a fresh one. Keep the number of different setups small if you want your suite fast.

## Common Mistakes

> **Warning:** Do not use `@SpringBootTest` for everything. A test that starts the whole application to check one `if` statement wastes seconds on each class. Use plain unit tests for logic.

- **Test class in the wrong package.** If the test cannot find the `@SpringBootApplication` class, start-up fails. Keep tests in the same package tree as the main class.
- **Real database in tests.** A full context may connect to a real database. Use an in-memory or container database for tests.
- **Forgetting the web environment.** `@LocalServerPort` only works with `RANDOM_PORT` or `DEFINED_PORT`.
- **Many different contexts.** Every unique combination of properties, profiles and mock beans builds a new context.
- **Old imports.** In Spring Boot 4, `@AutoConfigureMockMvc` moved to a new package. Let your IDE fix imports from the new starter.

## Interview Questions

**What does `@SpringBootTest` do?**
It starts the full Spring application context for a test so you can test beans and settings working together.

**What is the difference between `MOCK` and `RANDOM_PORT`?**
`MOCK` uses a fake web layer with no server. `RANDOM_PORT` starts a real server on a free port.

**How do you replace one bean in a full test?**
Declare a field with `@MockitoBean` in the test class.

## Key Points to Remember

- `@SpringBootTest` runs the real application context inside a test.
- It is slower, so use it for integration checks, not for simple logic.
- The default web environment is a mock one, used with `MockMvc`.
- `RANDOM_PORT` starts a real server, and `@LocalServerPort` gives its port.
- `properties`, `@ActiveProfiles` and `@MockitoBean` change what the test sees.
- Identical setups share a cached context.

## Frequently Asked Questions

### What is @SpringBootTest used for?

It is used for integration tests that need the whole application, such as checking that a controller, service and settings file work together.

### Is @SpringBootTest slow?

It is slower than a unit test because it starts Spring. The context is cached, so classes with the same setup share it.

### Do I need @ExtendWith with @SpringBootTest?

No. `@SpringBootTest` already registers the Spring extension for JUnit.

### How is @SpringBootTest different from a slice test?

A slice test such as `@WebMvcTest` loads only one layer. `@SpringBootTest` loads everything.

## Related Topics

- [@WebMvcTest and MockMvc](/learning/spring-boot-tutorial/web-mvc-test-and-mockmvc): load only the web layer for faster tests.
- [@DataJpaTest](/learning/spring-boot-tutorial/data-jpa-test): load only the database layer.
- [Mockito in Spring Boot](/learning/spring-boot-tutorial/mockito-in-spring-boot): replace beans with mocks.
- [Spring Profiles](/learning/spring-boot-tutorial/spring-profiles): use a test profile with its own settings.
