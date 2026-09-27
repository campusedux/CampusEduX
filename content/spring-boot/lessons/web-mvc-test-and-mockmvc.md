A reception desk clerk who checks in patients does not need the whole hospital to practise. She needs the desk, a phone and a folder of forms. If a doctor is missing, a colleague pretends to be that doctor. The practice is faster, and it tests exactly what matters: how the desk handles visitors.

`@WebMvcTest` gives a controller the same kind of practice. This guide on `@WebMvcTest` and MockMvc shows how to test only the web layer of your app, send fake requests, and check status codes and JSON, without starting a server or a database.

## What is @WebMvcTest and MockMvc?

> **Definition:** `@WebMvcTest` starts only the web layer of a Spring Boot app: controllers, JSON conversion, validation and filters. `MockMvc` is the tool that sends fake HTTP requests to that layer and lets you check the responses.

This kind of test is called a slice test, because it loads one slice of the application. Your services and repositories are not loaded. If a controller needs a service, you supply a mock with `@MockitoBean`.

`MockMvc` does not open a network port. It calls Spring's request handling directly inside the test, so it is fast and still goes through the real mapping, conversion and validation.

## Why is it used?

- **Speed.** Only a few beans are created, so the test starts quickly.
- **Focus.** You test the address, the status code, the JSON shape and the validation rules of the controller.
- **Isolation.** A mocked service means a failure points to the controller.
- **Easy edge cases.** You can make the service return nothing or throw, to check the 404 and error paths.

## How it works

The test builds a small context with the controllers and the Spring MVC machinery. `MockMvc` creates a request, hands it to the dispatcher, and returns the response for your checks.

```text
MockMvc.perform(get(...))
        |
        v
+--------------------+
| Dispatcher         |
| mapping + JSON     |
| + validation       |
+--------------------+
        |
        v
+--------------------+
| Controller (real)  |
+--------------------+
        |
        v
+--------------------+
| Service (mock)     |
+--------------------+
```

The controller is real and the service is a Mockito mock. The response passes back through the same JSON conversion as in production. Then your `andExpect` lines compare the status and the body.

## Common MockMvc Checks

| Check | Meaning |
|---|---|
| `status().isOk()` | Status 200 |
| `status().isCreated()` | Status 201 |
| `status().isNotFound()` | Status 404 |
| `status().isBadRequest()` | Status 400 |
| `jsonPath("$.name").value("X")` | A JSON field has a value |
| `content().string("text")` | The plain body equals the text |

## Real-Life Example

City Care Hospital has an appointment API. A patient can look up an appointment by number and book a new one with a patient name and a doctor. The API returns 404 for an unknown number and 400 when the name is empty. These rules belong to the web layer, so a `@WebMvcTest` checks each of them in a moment, while the real service, which would need a database, is replaced by a mock.

## Code Example

Let's build the appointment API and test four cases: found, not found, booked and invalid.

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
            <artifactId>spring-boot-starter-validation</artifactId>
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

**File:** `AppointmentsApplication.java` in package `com.care.appt`

```java
package com.care.appt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AppointmentsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AppointmentsApplication.class, args);
    }
}
```

**File:** `Appointment.java` in package `com.care.appt`

```java
package com.care.appt;

public record Appointment(long id, String patient, String doctor) {}
```

**File:** `AppointmentService.java` in package `com.care.appt`

```java
package com.care.appt;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Service;

@Service
public class AppointmentService {

    private final Map<Long, Appointment> store = new ConcurrentHashMap<>();
    private final AtomicLong ids = new AtomicLong(100);

    public Optional<Appointment> find(long id) {
        return Optional.ofNullable(store.get(id));
    }

    public Appointment book(String patient, String doctor) {
        long id = ids.incrementAndGet();
        Appointment appointment = new Appointment(id, patient, doctor);
        store.put(id, appointment);
        return appointment;
    }
}
```

**File:** `AppointmentController.java` in package `com.care.appt`

```java
package com.care.appt;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AppointmentController {

    record BookingRequest(@NotBlank String patient, @NotBlank String doctor) {}

    private final AppointmentService service;

    public AppointmentController(AppointmentService service) {
        this.service = service;
    }

    @GetMapping("/appointments/{id}")
    public ResponseEntity<Appointment> get(@PathVariable long id) {
        return service.find(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/appointments")
    public ResponseEntity<Appointment> book(@Valid @RequestBody BookingRequest request) {
        Appointment created = service.book(request.patient(), request.doctor());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
```

**File:** `AppointmentControllerTest.java` in `src/test/java/com/care/appt`

```java
package com.care.appt;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AppointmentController.class)
class AppointmentControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private AppointmentService service;

    @Test
    void returnsAnExistingAppointment() throws Exception {
        when(service.find(101L)).thenReturn(Optional.of(new Appointment(101, "Meera", "Dr. Rao")));

        mvc.perform(get("/appointments/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patient").value("Meera"))
                .andExpect(jsonPath("$.doctor").value("Dr. Rao"));
    }

    @Test
    void unknownIdGives404() throws Exception {
        when(service.find(999L)).thenReturn(Optional.empty());

        mvc.perform(get("/appointments/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void bookingReturns201() throws Exception {
        when(service.book("Arjun", "Dr. Sen")).thenReturn(new Appointment(102, "Arjun", "Dr. Sen"));

        mvc.perform(post("/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"patient\":\"Arjun\",\"doctor\":\"Dr. Sen\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(102));
    }

    @Test
    void blankPatientGives400() throws Exception {
        mvc.perform(post("/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"patient\":\"\",\"doctor\":\"Dr. Sen\"}"))
                .andExpect(status().isBadRequest());
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

Maven prints the four counts on one line; they are split here for reading. All four tests passed.

## Code Explained

- `@WebMvcTest` with the controller class loads only that controller and the web machinery. In Spring Boot 4 the annotation lives in the package `webmvc.test.autoconfigure` under `org.springframework.boot`, and the web test starter brings it.
- `@Autowired MockMvc` is provided by the annotation. No server starts.
- `@MockitoBean` puts a fake `AppointmentService` into the small context. We tried removing it, and the test failed at start-up with `No qualifying bean of type` for the service, because the slice does not scan services.
- The first test stubs `find(101L)` and checks the status and two JSON fields with `jsonPath`. The path `$` means the root of the JSON.
- The second stubs an empty result, so the controller answers 404.
- The third posts a JSON body with `contentType` and `content`, and expects 201 and the new id.
- The last test posts an empty patient name. The service is never called, because `@Valid` stops the request with 400 first. That shows validation working in the web layer.
- The project has the validation starter for the `@NotBlank` rule, and the web test starter with `test` scope.

## Reading a MockMvc Test Like a Sentence

Every MockMvc test has the same rhythm. First you set the stage: stub the mock service so it returns what you need. Then you perform a request, with a method, an address and maybe a body. Finally you write what you expect, one `andExpect` at a time. Read the first test aloud: "when the service finds appointment 101, a GET request to that address answers OK, and the patient is Meera." If your test reads like a sentence, the next developer will understand it.

Name each test after the outcome, for example `unknownIdGives404`. When a test fails, its name already tells you which promise of the API was broken.

## Slice Tests Versus a Full Test

A slice test is cheap and specific. A full `@SpringBootTest` proves that everything is wired together. Use slices for the many small checks on status codes and JSON, and keep only a few full tests for the important journeys. If your controller needs another bean, such as a filter or converter you wrote, add it with `@Import` or a mock.

## Common Mistakes

> **Warning:** Do not forget `@MockitoBean` for every service the controller needs. A missing one stops the whole test with a start-up error, not a helpful assertion.

- **Expecting real data.** The service is a mock. Unless you stub it, it returns null or empty values.
- **Missing content type.** A POST with JSON needs a JSON `contentType`, or you get 415.
- **Testing service logic here.** A web slice test checks the web behaviour, not business rules.
- **Using the old package.** Many blog posts use an older import for `@WebMvcTest`. In Spring Boot 4 use the new one shown above.
- **Forgetting security.** If Spring Security is on the classpath, requests may get 401 or 403 in a slice test.

## Interview Questions

**What is a slice test?**
A test that loads only one layer of the application, such as the web layer with `@WebMvcTest`, instead of the whole context.

**Does `MockMvc` start a real server?**
No. It calls Spring's request handling directly, so no port is opened.

**How do you provide a service to a controller in `@WebMvcTest`?**
Declare a `@MockitoBean` field for it and stub its methods with Mockito.

## Key Points to Remember

- `@WebMvcTest` loads only controllers and the web machinery.
- `MockMvc` sends fake requests without a server.
- Fake the services with `@MockitoBean`.
- Use `status()` and `jsonPath()` to check responses.
- Validation, 404 and other web rules are easy to test here.
- Keep full tests for the few journeys that need everything.

## Frequently Asked Questions

### What is @WebMvcTest and MockMvc used for?

It is used to test controllers quickly, including status codes, JSON and validation, without starting a server or a database.

### What is the difference between @WebMvcTest and @SpringBootTest?

`@WebMvcTest` loads only the web layer. `@SpringBootTest` loads the whole application, so it is slower but tests more.

### Why does my @WebMvcTest say no qualifying bean?

The controller needs a service that the slice does not load. Add a `@MockitoBean` field for it.

### Can MockMvc test JSON bodies?

Yes. Use `jsonPath` to read fields, or `content().json(...)` to compare a whole JSON text.

## Related Topics

- [@SpringBootTest](/learning/spring-boot-tutorial/spring-boot-test): test the whole application.
- [Mockito in Spring Boot](/learning/spring-boot-tutorial/mockito-in-spring-boot): the mocks used behind the controller.
- [Bean Validation](/learning/spring-boot-tutorial/bean-validation): the rules that gave us the 400 answer.
- [ResponseEntity](/learning/spring-boot-tutorial/responseentity): how the controller sets status codes.
