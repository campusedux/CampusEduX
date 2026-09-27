Picture a hospital reception. You walk in and say, "I am here to see Doctor 7." The receptionist does not ask a hundred questions. She reads the number, finds Doctor 7 and shows you the way. The number in your sentence is the key that opens the right door.

The web address works the same way. A URL such as `/doctors/7` carries the id inside the address itself, and `@PathVariable` is how your Spring Boot method reads it. This topic teaches you how.

## What is @PathVariable?

> **Definition:** `@PathVariable` is a Spring MVC annotation that binds a placeholder in the URL path, written in curly braces like `{id}`, to a method parameter.

Here is the idea in three lines.

- You write a mapping such as `@GetMapping("/doctors/{id}")`. The `{id}` is a **template variable**, a slot for any value.
- A client calls `GET /doctors/7`. The `7` fills the slot.
- Your method has a parameter marked `@PathVariable int id`, and Spring hands it the value `7`.

Spring also converts the text to the type you ask for. The address only carries text, but your parameter can be an `int`, a `long`, a `UUID` or a `String`. If the text cannot be converted, for example `/doctors/abc` for an `int`, Spring stops and answers `400 Bad Request` for you.

A path variable is a natural fit for identifying **one thing**: one doctor, one order, one ward.

## Why is it used?

A REST API describes resources with addresses. The address `/doctors/7` reads like a sentence: "the doctor whose id is 7". That is easy to understand, easy to bookmark and easy to share.

- **Clean addresses.** `/doctors/7` looks better than `/doctor?id=7`.
- **One resource, one address.** Each doctor has its own URL, so caches and tools can treat it as a separate item.
- **Automatic conversion.** You get a ready `int` or `UUID`, not a raw string to parse.
- **Built-in checking.** A bad value is rejected before your method runs.

> **Tip:** Use a path variable to say **which** item. Use a query parameter for optional filters like sorting or paging. The next topic on `@RequestParam` covers those.

## How it works

Spring compares the incoming address with the pattern in your mapping, piece by piece. Where the pattern has `{name}`, it takes whatever text sits there.

```text
Request:  GET /wards/B/beds/12

Pattern:  /wards/{ward}/beds/{bed}
                   |          |
                   v          v
            ward = B   bed = 12
```

The fixed words `wards` and `beds` must match exactly. The two slots capture `B` and `12`. If the client sends `/wards/B`, there is no match, because the pattern needs both slots.

After capturing, Spring converts each value.

```text
"12"  (text from the URL)
   |
   v
+---------------------------+
| Type conversion           |
| String -> int             |
+---------------------------+
   |               |
  ok              fails ("abc")
   |               |
   v               v
+-------------+  +-------------+
| Method runs |  | 400 Bad     |
| with 12     |  | Request     |
+-------------+  +-------------+
```

A value that converts cleanly reaches your method. A value that cannot be converted never reaches it, and the client gets a 400 error with no extra code from you.

## Real-Life Example

Think of the room numbers in a hotel. The corridor sign says "Floor 3, Room 12". Each part of the sign tells you a level of the address, and together they lead you to exactly one door. If someone gives you "Floor three, Room banana", you know at once that the directions are wrong. A path variable is that sign for a web address. The fixed words are the corridor signs, and the values are the floor and room numbers.

## Code Example

Let's build a small API for CityCare Hospital. It has doctors, beds in wards, patient files, and daily reports.

```text
citycare/
├─ pom.xml
└─ src/main/java/
   └─ com/citycare/hospital/
      ├─ HospitalApplication.java
      └─ HospitalController.java
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

    <groupId>com.citycare</groupId>
    <artifactId>hospital</artifactId>
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

**File:** `HospitalApplication.java` in package `com.citycare.hospital`

```java
package com.citycare.hospital;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HospitalApplication {

    public static void main(String[] args) {
        SpringApplication.run(HospitalApplication.class, args);
    }
}
```

**File:** `HospitalController.java` in package `com.citycare.hospital`

```java
package com.citycare.hospital;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class HospitalController {

    record Doctor(int id, String name, String specialty) {}

    private final Map<Integer, Doctor> doctors = Map.of(
            1, new Doctor(1, "Dr. Nisha Patil", "Pediatrics"),
            2, new Doctor(2, "Dr. Rohan Kulkarni", "Orthopedics"));

    @GetMapping("/doctors/{id}")
    public Doctor doctor(@PathVariable int id) {
        Doctor doctor = doctors.get(id);
        if (doctor == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such doctor");
        }
        return doctor;
    }

    @GetMapping("/wards/{ward}/beds/{bed}")
    public String bed(@PathVariable String ward, @PathVariable int bed) {
        return "Ward " + ward + ", bed " + bed + " is free";
    }

    @GetMapping("/patients/{patientId}")
    public String patient(@PathVariable("patientId") String id) {
        return "Opening file for patient " + id;
    }

    @GetMapping({"/reports", "/reports/{date}"})
    public String report(@PathVariable(required = false) String date) {
        return date == null ? "Report for today" : "Report for " + date;
    }

    @GetMapping("/lab/{code:[A-Z]{2}[0-9]{3}}")
    public String lab(@PathVariable String code) {
        return "Lab test " + code;
    }
}
```

Start the app, then call the endpoints:

```bash
mvn spring-boot:run
curl localhost:8080/api/doctors/2
curl localhost:8080/api/wards/B/beds/12
curl localhost:8080/api/patients/P-77
curl localhost:8080/api/reports
curl localhost:8080/api/reports/2026-09-26
curl localhost:8080/api/lab/CB123
```

**Output:**

```text
Ward B, bed 12 is free
Opening file for patient P-77
Report for today
Report for 2026-09-26
Lab test CB123
```

The first call (doctor 2) returns JSON, shown below spaced out for reading. The other five calls print the lines above.

```json
{
  "id": 2,
  "name": "Dr. Rohan Kulkarni",
  "specialty": "Orthopedics"
}
```

Now three calls that fail. A doctor id that is not a number, a doctor who does not exist, and a lab code in the wrong format:

```bash
curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/api/doctors/abc
curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/api/doctors/99
curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/api/lab/cb1
```

**Output:**

```text
400
404
404
```

## Code Explained

- `{id}` in the mapping and `@PathVariable int id` in the method share the same name, so Spring links them. The names match because Spring Boot compiles your code with parameter names kept.
- `/wards/{ward}/beds/{bed}` has two slots, and each one has its own `@PathVariable`.
- `@PathVariable("patientId") String id` names the slot explicitly. Use this when your Java variable has a different name from the slot.
- `@GetMapping({"/reports", "/reports/{date}"})` maps two addresses to one method. `required = false` lets `date` be `null` when the slot is absent.
- `{code:[A-Z]{2}[0-9]{3}}` adds a regular expression after the colon. Only two capital letters followed by three digits match, so `cb1` gives a 404.
- For `/doctors/abc`, Spring fails to convert `abc` into an `int` and answers 400 before the method runs.
- For `/doctors/99`, the address is fine, but the doctor is missing, so our code throws a 404.

## Path Variable and Query Parameter

| Point | Path variable | Query parameter |
|---|---|---|
| Looks like | `/doctors/7` | `/doctors?id=7` |
| Best for | Identifying one item | Filters, sorting, paging |
| Usually required? | Yes | Often optional |
| Annotation | `@PathVariable` | `@RequestParam` |

## Common Mistakes

> **Warning:** Do not treat a missing item as a server error. A valid id that has no record should answer `404 Not Found`. Spring only handles the bad-format case (400) for you.

- **Slot name mismatch.** If the mapping says `{doctorId}` and the parameter is `int id` with no name given in the annotation, Spring cannot link them. Match the names, or write `@PathVariable("doctorId")`.
- **Using `int` for large ids.** If ids can be large, use `long` or `String`, or a big number will fail to convert.
- **Dots at the end of the value.** A value such as `report.pdf` may be cut at the dot in some setups. Test addresses that contain dots.
- **Sensitive data in the path.** Addresses end up in logs and browser history. Do not put passwords or tokens there.

## Interview Questions

**What is the difference between @PathVariable and @RequestParam?**
`@PathVariable` reads a value from the path, like `/doctors/7`. `@RequestParam` reads a value from the query string, like `?id=7`.

**What happens if the path variable cannot be converted to the parameter type?**
Spring answers `400 Bad Request`, and your method is not called.

**Can one mapping have more than one path variable?**
Yes. Each slot needs its own `@PathVariable` parameter, such as `/wards/{ward}/beds/{bed}`.

**How do you make a path variable optional?**
Map two addresses to the same method and set `required = false`, or use `Optional`.

## Key Points to Remember

- `{name}` in the mapping is a slot, and `@PathVariable` reads it.
- Spring converts the text into `int`, `long`, `String`, `UUID` and other types.
- A slot value that cannot be converted gives a 400 reply.
- Use `@PathVariable("slot")` when the Java name differs from the slot name.
- A regular expression after a colon limits what a slot accepts.
- Use path variables for identity, and query parameters for filters.

## Frequently Asked Questions

### What is @PathVariable used for in Spring Boot?

It reads a value from the URL path, such as the id in `/doctors/7`, and gives it to your controller method as a normal Java parameter.

### Can I use @PathVariable with POST or DELETE?

Yes. It works with every HTTP method. `DELETE /doctors/7` and `PUT /doctors/7` both read the id the same way.

### Do the names have to match?

They match by default. If they differ, write the slot name inside the annotation, like `@PathVariable("patientId")`.

### What is the difference between a 400 and a 404 here?

A 400 means the value was not in the right format, such as text for a number. A 404 means the format was fine, but no item exists for it.

## Related Topics

- [@RequestParam](/learning/spring-boot-tutorial/request-param): read optional filters from the query string.
- [@RequestMapping](/learning/spring-boot-tutorial/request-mapping): learn how addresses are mapped to methods.
- [GET POST PUT DELETE Mapping](/learning/spring-boot-tutorial/get-post-put-delete-mapping): use path variables with every HTTP verb.
- [HTTP Status Codes in Spring Boot](/learning/spring-boot-tutorial/http-status-codes-in-spring-boot): return the right 400 and 404 replies.
