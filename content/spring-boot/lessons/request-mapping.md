Imagine a large gym with many rooms. A board at the entrance says: yoga in Room 1, zumba in Room 2, weights in Room 3. A visitor tells the desk what they want, and the desk sends them to the right room. If nobody has written a rule for a request, the visitor is turned away.

`@RequestMapping` is that board for your web app. It tells Spring which URL, and which kind of request, belongs to which method. Let's learn how to write those rules.

## What is @RequestMapping?

> **Definition:** `@RequestMapping` is the Spring MVC annotation that maps a web request to a controller class or method. It can match on the URL path, the HTTP method, request parameters, headers and content types.

You can place it in two spots.

- **On a class.** The path becomes a shared prefix for every method inside the class.
- **On a method.** The path, and other conditions, narrow down which requests reach that one method.

The class path and the method path are joined. If the class says `/api/classes` and the method says `/{id}`, the full address is `/api/classes/{id}`.

`@RequestMapping` has many settings. These are the ones you will use most.

- `path` (or `value`): the URL pattern, such as `"/api/classes"`.
- `method`: the HTTP method, such as `RequestMethod.GET` or `RequestMethod.POST`.
- `params`: a request parameter that must be present, such as `"level"`.
- `consumes`: the content type the method accepts in the request body.
- `produces`: the content type the method sends back.

## Why is it used?

A controller can have dozens of methods. Spring must know, for every incoming request, exactly which one to call.

- **No guessing.** The mapping rules make the choice clear, so two methods do not fight for the same request.
- **Shared prefixes.** Put `/api/classes` once on the class, and you do not repeat it on every method.
- **Precise matching.** You can accept only JSON, only GET, or only calls that carry a `level` parameter.
- **Clear errors.** A wrong method gives `405 Method Not Allowed`, and a wrong content type gives `415 Unsupported Media Type`. The client learns what went wrong.

> **Note:** For everyday work you will usually use the shortcuts `@GetMapping`, `@PostMapping`, `@PutMapping` and `@DeleteMapping`. They are `@RequestMapping` with the method already filled in. A later topic covers them. Use plain `@RequestMapping` on classes, and when you need the full set of conditions.

## How it works

When a request arrives, Spring checks each mapping like a series of gates. A method is chosen only if the request passes every gate.

```text
GET /api/classes?level=beginner
        |
        v
+---------------------------+
| Path matches?             |
| /api/classes              |
+---------------------------+
        | yes
        v
+---------------------------+
| HTTP method matches?      |
| GET                       |
+---------------------------+
        | yes
        v
+---------------------------+
| params, consumes, produces|
| all satisfied?            |
+---------------------------+
        | yes
        v
+---------------------------+
| Call the matching method  |
+---------------------------+
```

At each gate, a wrong answer stops the request. A wrong path gives 404. A right path with the wrong method gives 405. A right path and method with a wrong content type gives 415. Spring picks the most specific match if more than one method fits.

Here is how the class path and the method paths combine.

```text
Class path: /api/classes
        |
        +-- method ""
        |     => /api/classes
        |
        +-- method "/{id}"
        |     => /api/classes/{id}
        |
        +-- method "/summary"
        => /api/classes/summary
```

The class contributes the first part of the address. Each method adds its own ending. If you later rename `/api/classes` to `/api/sessions`, you change one line.

## Real-Life Example

Think of a railway station's help desk. A passenger asks about the "12:30 train to Pune". The clerk first checks the destination, which is the path. Then the type of request: booking, cancelling or asking for a status, which is the HTTP method. Some windows only take cash payments or only handle senior citizens, which is like `consumes` and `params`. Each request goes to exactly one window, and a request no window accepts gets a polite refusal.

## Code Example

Let's build a class schedule API for FitZone gym. It shows all classes, filters by level, gives a one-line text summary, and accepts a booking that must be sent as JSON.

```text
fitzone/
├─ pom.xml
└─ src/main/java/
   └─ com/fitzone/gym/
      ├─ GymApplication.java
      └─ ClassController.java
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

    <groupId>com.fitzone</groupId>
    <artifactId>gym</artifactId>
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

**File:** `GymApplication.java` in package `com.fitzone.gym`

```java
package com.fitzone.gym;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GymApplication {

    public static void main(String[] args) {
        SpringApplication.run(GymApplication.class, args);
    }
}
```

**File:** `ClassController.java` in package `com.fitzone.gym`

```java
package com.fitzone.gym;

import java.util.List;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/classes")
public class ClassController {

    record GymClass(int id, String name, String level) {}

    private final List<GymClass> classes = List.of(
            new GymClass(1, "Morning Yoga", "beginner"),
            new GymClass(2, "Power Zumba", "advanced"),
            new GymClass(3, "Core Stretch", "beginner"));

    @RequestMapping(method = RequestMethod.GET)
    public List<GymClass> all() {
        return classes;
    }

    @RequestMapping(method = RequestMethod.GET, params = "level")
    public List<GymClass> byLevel(String level) {
        return classes.stream()
                .filter(c -> c.level().equals(level))
                .toList();
    }

    @RequestMapping(path = "/summary", method = RequestMethod.GET,
            produces = "text/plain")
    public String summary() {
        return classes.size() + " classes this week";
    }

    @RequestMapping(path = "/book", method = RequestMethod.POST,
            consumes = "application/json")
    public String book() {
        return "Booking accepted";
    }
}
```

Start the app, then try these calls:

```bash
mvn spring-boot:run
curl http://localhost:8080/api/classes
curl "http://localhost:8080/api/classes?level=beginner"
curl http://localhost:8080/api/classes/summary
curl -X POST http://localhost:8080/api/classes/book \
  -H "Content-Type: application/json"
```

**Output:** all classes (spaced out for reading):

```json
[
  {
    "id": 1,
    "name": "Morning Yoga",
    "level": "beginner"
  },
  {
    "id": 2,
    "name": "Power Zumba",
    "level": "advanced"
  },
  {
    "id": 3,
    "name": "Core Stretch",
    "level": "beginner"
  }
]
```

**Output:** the beginner filter:

```json
[
  {
    "id": 1,
    "name": "Morning Yoga",
    "level": "beginner"
  },
  {
    "id": 3,
    "name": "Core Stretch",
    "level": "beginner"
  }
]
```

**Output:** summary and booking:

```text
3 classes this week
Booking accepted
```

Now two calls that break the rules. A DELETE on the list, and a POST with the wrong content type:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:8080/api/classes
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8080/api/classes/book \
  -H "Content-Type: text/plain"
```

**Output:**

```text
405
415
```

## Code Explained

- The class-level mapping `/api/classes` gives every method the same prefix.
- The first method has no path of its own, so it answers `/api/classes`. It accepts only GET.
- The second method has the same path and method, plus `params = "level"`. A request that carries `?level=...` matches both, and Spring picks this one because it is more specific.
- The parameter `String level` is filled from the query string. A later topic covers `@RequestParam` in depth.
- `produces = "text/plain"` on `summary()` means the reply is sent as plain text.
- `consumes = "application/json"` on `book()` means only requests with a JSON `Content-Type` are accepted. Others get 415.
- Sending DELETE to `/api/classes` finds the path but no DELETE method, so the answer is 405.

## Common Attributes at a Glance

| Attribute | What it checks | Failure status |
|---|---|---|
| `path` | The URL | 404 Not Found |
| `method` | GET, POST, PUT, DELETE | 405 Method Not Allowed |
| `params` | A query parameter exists | 400 Bad Request |
| `consumes` | Request `Content-Type` | 415 Unsupported Media Type |
| `produces` | Response type the client accepts | 406 Not Acceptable |

## Common Mistakes

> **Warning:** If you forget the `method` attribute, a plain `@RequestMapping` on a method matches every HTTP method. A visitor can then call your "read" method with DELETE. Always set the method, or use `@GetMapping` and its friends.

- **Duplicate mappings.** Two methods with the same path, method and conditions stop the app from starting with an "Ambiguous mapping" error.
- **Missing or doubled slashes.** Write `"/summary"` with one leading slash. Spring joins class and method paths, so `"/api/classes"` plus `"summary"` also works, but be consistent.
- **Forgetting the class prefix in tests.** When you call an endpoint, use the full path, prefix included.

## Interview Questions

**Can @RequestMapping be used on a class and a method together?**
Yes. The class path is a prefix, and the method path is added to it.

**What is the default HTTP method for @RequestMapping?**
There is none. Without a `method` attribute it matches all HTTP methods.

**What does the consumes attribute do?**
It limits the method to requests whose `Content-Type` header matches, and other types get 415.

**What status is returned for a path that exists with the wrong HTTP method?**
405 Method Not Allowed.

## Key Points to Remember

- `@RequestMapping` connects a request to a class or a method.
- A class-level path is a prefix for all its methods.
- Always set `method`, or use the shortcut annotations.
- `params`, `consumes` and `produces` narrow the match further.
- Wrong path gives 404, wrong method 405, wrong content type 415.
- The most specific matching method wins.

## Frequently Asked Questions

### Is @RequestMapping the same as @GetMapping?

`@GetMapping` is a shortcut for `@RequestMapping(method = RequestMethod.GET)`. It does the same job with less typing.

### Should I put the path on the class or the method?

Use both. Put the shared part, such as `/api/classes`, on the class, and the ending on each method.

### Can one method handle two paths?

Yes. Give it an array, like `@RequestMapping({"/a", "/b"})`, and both addresses call the same method.

### What happens when no mapping matches?

Spring answers 404 Not Found with a small JSON error body, so the client knows the address is unknown.

## Related Topics

- [Spring MVC Architecture](/learning/spring-boot-tutorial/spring-mvc-architecture): see where the mapping lookup fits in the request journey.
- [GET POST PUT DELETE Mapping](/learning/spring-boot-tutorial/get-post-put-delete-mapping): use the shortcut annotations for each HTTP method.
- [@PathVariable](/learning/spring-boot-tutorial/path-variable): read values out of the URL path.
- [@RequestParam](/learning/spring-boot-tutorial/request-param): read query parameters from the address.
