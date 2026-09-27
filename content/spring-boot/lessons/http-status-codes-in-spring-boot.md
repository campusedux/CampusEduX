When you call a courier company, the first thing you hear tells you what happened. "Your parcel is on its way." "We could not find that address." "Our system is down, please call later." You do not need the whole story to know if things went well. The first sentence is enough.

HTTP status codes are that first sentence. Every reply from your Spring Boot app starts with one. In this topic you will learn what the codes mean, and the ways Spring lets you choose them.

## What are HTTP status codes?

> **Definition:** An HTTP status code is a three-digit number in every HTTP response that tells the client whether the request succeeded, failed because of the client, or failed because of the server.

The first digit tells the family.

- **2xx Success.** The request worked.
- **3xx Redirection.** The client should look somewhere else.
- **4xx Client error.** The request was wrong, so the client must change it.
- **5xx Server error.** The request was fine, but the server failed.

The most common codes in a Spring Boot API are these.

| Code | Name | Use it when |
|---|---|---|
| 200 | OK | A read or update worked |
| 201 | Created | A new item was made |
| 204 | No Content | Done, nothing to return |
| 400 | Bad Request | Data is wrong or missing |
| 401 | Unauthorized | The client is not logged in |
| 403 | Forbidden | Logged in, but not allowed |
| 404 | Not Found | The item does not exist |
| 409 | Conflict | It clashes with the current state |
| 500 | Internal Server Error | Our code failed |
| 503 | Service Unavailable | We cannot serve right now |

Spring Boot sends many of these on its own. A wrong HTTP method gives 405, unless your own handler catches it first. A bad JSON body gives 400. A missing address gives 404. For your own business rules, you choose the code.

## Why is it used?

A client program, like a mobile app, cannot read your mind. It looks at the status code first and decides what to do.

- **Show the right message.** On 404 the app says "not found". On 409 it says "already booked".
- **Retry or stop.** On 503 the app may try again later. On 400 retrying the same request is pointless.
- **Debugging.** A 4xx points at the request, and a 5xx points at the server. That tells you where to look.
- **Standard behaviour.** Browsers, caches and tools already understand these codes.

> **Tip:** Never return 200 with an error message inside the body. If something failed, say so with the status code.

## How it works

Spring gives you four ways to choose a status. They suit different situations.

- **Default.** A successful method returns 200 on its own.
- **`@ResponseStatus`.** Fixes one status on a method, or on an exception class.
- **`ResponseEntity`.** Chooses the status inside the method each time.
- **Exceptions.** Throw an exception, and a handler turns it into a status.

The exception route keeps controllers clean. Here is how it flows.

```text
Controller method runs
        |
        |  throws an exception
        v
+---------------------------+
| DispatcherServlet catches |
+---------------------------+
        |
        v
+---------------------------+
| Is there an               |
| @ExceptionHandler?        |
+---------------------------+
      |               |
     YES              NO
      |               |
      v               v
+-------------+  +-------------+
| Handler sets|  | Default     |
| status+body |  | error 500   |
+-------------+  +-------------+
```

A method that breaks a rule throws an exception, and the DispatcherServlet looks for a handler that knows it. A class marked `@RestControllerAdvice` holds those handlers for the whole app. If nobody handles the exception, Spring Boot sends a generic `500`.

Here is a quick way to think when choosing a code for your own rule.

```text
Did the request work?
     |            |
    YES           NO
     |            |
     v            v
 2xx family   Whose fault?
                 |        |
              client    server
                 |        |
                 v        v
              4xx       5xx
```

If it worked, use a 2xx code, and pick between 200, 201 and 204. If not, ask whose fault it was. Bad data, a missing item or a clash are client faults, so use 4xx. A crash, or a busy backend, is a server fault, so use 5xx.

## Real-Life Example

Think of a cab-booking app. You ask for a ride. If a driver is found, the app says "Booked" (201). If you type the same pickup and drop place, it says "Check your addresses" (400). If you look for a ride that was never made, it says "No such ride" (404). If no drivers are nearby, it says "No cabs right now, please try later" (503). If the app itself crashes, you see "Something went wrong" (500). Each message maps to a family of codes, and the app decides what to show from the code alone.

## Code Example

Let's build a small ride API for QuickCab. It uses `@ResponseStatus` for the common cases and a `@RestControllerAdvice` class to turn exceptions into clean error replies.

```text
quickcab/
├─ pom.xml
└─ src/main/java/
   └─ com/quickcab/rides/
      ├─ RidesApplication.java
      ├─ RideController.java
      ├─ RideErrors.java
      └─ ErrorAdvice.java
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

    <groupId>com.quickcab</groupId>
    <artifactId>rides</artifactId>
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

**File:** `RidesApplication.java` in package `com.quickcab.rides`

```java
package com.quickcab.rides;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RidesApplication {

    public static void main(String[] args) {
        SpringApplication.run(RidesApplication.class, args);
    }
}
```

**File:** `RideErrors.java` in package `com.quickcab.rides`

```java
package com.quickcab.rides;

public class RideErrors {

    public static class RideNotFoundException extends RuntimeException {
        public RideNotFoundException(int id) {
            super("Ride " + id + " does not exist");
        }
    }

    public static class InvalidRideException extends RuntimeException {
        public InvalidRideException(String message) {
            super(message);
        }
    }

    public static class NoDriverException extends RuntimeException {
        public NoDriverException() {
            super("No drivers nearby, try again later");
        }
    }
}
```

**File:** `ErrorAdvice.java` in package `com.quickcab.rides`

```java
package com.quickcab.rides;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ErrorAdvice {

    record ApiError(int status, String error, String message) {}

    private ResponseEntity<ApiError> reply(HttpStatus status, String message) {
        return ResponseEntity.status(status)
                .body(new ApiError(status.value(), status.getReasonPhrase(), message));
    }

    @ExceptionHandler(RideErrors.RideNotFoundException.class)
    public ResponseEntity<ApiError> notFound(RideErrors.RideNotFoundException e) {
        return reply(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(RideErrors.InvalidRideException.class)
    public ResponseEntity<ApiError> invalid(RideErrors.InvalidRideException e) {
        return reply(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(RideErrors.NoDriverException.class)
    public ResponseEntity<ApiError> noDriver(RideErrors.NoDriverException e) {
        return reply(HttpStatus.SERVICE_UNAVAILABLE, e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> other(Exception e) {
        return reply(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
    }
}
```

**File:** `RideController.java` in package `com.quickcab.rides`

```java
package com.quickcab.rides;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/rides")
public class RideController {

    record Ride(int id, String pickup, String drop) {}
    record RideRequest(String pickup, String drop) {}

    private final Map<Integer, Ride> rides = new ConcurrentHashMap<>();
    private final AtomicInteger nextId = new AtomicInteger(1);

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Ride book(@RequestBody RideRequest request) {
        if (request.pickup().equals(request.drop())) {
            throw new RideErrors.InvalidRideException("Pickup and drop are the same");
        }
        if (request.pickup().equals("Outskirts")) {
            throw new RideErrors.NoDriverException();
        }
        Ride ride = new Ride(nextId.getAndIncrement(), request.pickup(), request.drop());
        rides.put(ride.id(), ride);
        return ride;
    }

    @GetMapping("/{id}")
    public Ride one(@PathVariable int id) {
        Ride ride = rides.get(id);
        if (ride == null) {
            throw new RideErrors.RideNotFoundException(id);
        }
        return ride;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable int id) {
        if (rides.remove(id) == null) {
            throw new RideErrors.RideNotFoundException(id);
        }
    }

    @GetMapping("/crash")
    public String crash() {
        throw new IllegalStateException("backend is down");
    }
}
```

Start the app and try a happy path and every error path. The `-w` flag prints the status after each body.

```bash
mvn spring-boot:run
curl -s -w " %{http_code}\n" -X POST localhost:8080/rides -H "Content-Type: application/json" -d '{"pickup":"Station","drop":"Airport"}'
curl -s -w " %{http_code}\n" -X POST localhost:8080/rides -H "Content-Type: application/json" -d '{"pickup":"Station","drop":"Station"}'
curl -s -w " %{http_code}\n" -X POST localhost:8080/rides -H "Content-Type: application/json" -d '{"pickup":"Outskirts","drop":"Mall"}'
curl -s -w " %{http_code}\n" localhost:8080/rides/9
curl -s -w " %{http_code}\n" localhost:8080/rides/crash
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE localhost:8080/rides/1
curl -s -o /dev/null -w "%{http_code}\n" -X PUT localhost:8080/rides/1
```

**Output:** the status codes in the order of the calls:

```text
201
400
503
404
500
204
500
```

The bodies of the error replies, spaced out for reading. Here is the 400 (the PUT call at the end shows 500, and the reason is explained below):

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Pickup and drop are the same"
}
```

The 404 reply has the same shape:

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Ride 9 does not exist"
}
```

## Code Explained

- `book()` uses `@ResponseStatus` with `HttpStatus.CREATED` for the happy path, so a new ride answers 201.
- `RideErrors` holds three small exception classes. Each name says what went wrong in plain words.
- `@RestControllerAdvice` marks `ErrorAdvice` as a helper that watches every controller.
- Each `@ExceptionHandler` maps one exception type to one status, and builds the same `ApiError` body. Clients always see `status`, `error` and `message`.
- The last handler catches any other `Exception` and answers 500 with a safe message. The real cause, "backend is down", never reaches the client.
- `cancel()` answers 204 on success and 404 when the ride is missing.
- The `PUT` call finds `/rides/1` but no PUT method. Spring would answer 405, but our catch-all `Exception` handler grabs that error first and turns it into 500. A handler this broad hides the codes Spring picks for you, so add it only if you accept that.

## Choosing Between the Options

| Situation | Best tool |
|---|---|
| One fixed status for a method | `@ResponseStatus` |
| Status decided inside the method | `ResponseEntity` |
| Same error in many places | Exception + `@RestControllerAdvice` |
| One quick error in one place | `ResponseStatusException` |

## Common Mistakes

> **Warning:** Do not put the real exception message from a crash into a 500 reply. It can leak table names, file paths or other private details. Send a safe message and log the details on the server.

- **200 with an error body.** Clients look at the status first. A failure hidden behind 200 breaks their logic.
- **404 for everything.** A wrong format is a 400, a clash is a 409, and a missing item is a 404. Pick the one that matches.
- **500 for user mistakes.** If the client sent bad data, that is a 4xx. A 500 says "our fault" and triggers alerts.
- **Catch-all handlers that hide real codes.** Our PUT call showed it: a 405 became a 500. Handle specific exceptions, and let the rest reach Spring's own handling.
- **Mixing 401 and 403.** 401 means "who are you?". 403 means "I know you, but you may not do this".

## Interview Questions

**What is the difference between 401 and 403?**
401 means the client is not authenticated. 403 means the client is known but is not allowed to do this.

**When would you return 201 instead of 200?**
When a new resource was created. Send the new item's address in a `Location` header as well.

**What does @RestControllerAdvice do?**
It holds `@ExceptionHandler` methods that apply to all controllers, so error handling lives in one place.

**What is a 409 Conflict?**
The request is valid, but it clashes with the current state of the data, such as booking a seat that is taken.

## Key Points to Remember

- Status codes are grouped: 2xx success, 3xx redirect, 4xx client error, 5xx server error.
- Use 201 for creation, 204 for empty success, 404 for missing items and 409 for clashes.
- `@ResponseStatus`, `ResponseEntity` and exceptions are the ways to set a status.
- `@RestControllerAdvice` turns exceptions into consistent error replies.
- Never hide a failure behind 200.
- Never leak internal details in a 500 reply.

## Frequently Asked Questions

### What is the default HTTP status code in Spring Boot?

A controller method that finishes normally answers 200 OK. If it returns `void`, the answer is also 200 unless you set another status.

### How do I return a custom HTTP status code in Spring Boot?

Use `@ResponseStatus` for a fixed code, return a `ResponseEntity` to choose in code, or throw an exception that a handler maps to the code you want.

### What does Spring Boot return for an unknown URL?

A `404 Not Found` with a small JSON body that holds the time, status, error and path.

### Should I use 400 or 422 for invalid data?

Both are seen in the wild. 400 is the simple and common choice. Pick one and use it the same way everywhere in your API.

## Related Topics

- [ResponseEntity](/learning/spring-boot-tutorial/responseentity): build a response with the status and headers you choose.
- [@RequestBody](/learning/spring-boot-tutorial/request-body): see where 400 and 415 come from for bad bodies.
- [DTO Pattern](/learning/spring-boot-tutorial/dto-pattern): shape the data that goes in and out.
- [Building a Complete CRUD REST API](/learning/spring-boot-tutorial/building-a-complete-crud-rest-api): apply status codes to all four actions.
