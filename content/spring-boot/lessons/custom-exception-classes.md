A gym front desk says the same thing to every member who cannot join a class: "Sorry, it did not work." Is the class full? Has the membership expired? Does the class not exist? The member has no idea what to do next. A good desk gives a precise reason each time. In Java, that precision comes from custom exception classes. Each exception carries its own name, message and even a status code.

Let's see what custom exception classes are, why they make an API easier to use, and how to build a small family of them for a gym booking service.

## What are Custom Exception Classes?

> **Definition:** A custom exception class is a class you write by extending `RuntimeException` (or `Exception`) so that one specific kind of failure has its own name, message and extra data, such as an error code or an HTTP status.

Java already has general exceptions such as `IllegalStateException`. They work, but the name says very little about your business. `ClassFullException` says exactly what happened, in the language of your gym. When another developer reads `throw new ClassFullException("yoga")`, no comment is needed.

There are two families in Java:

- **Checked exceptions** extend `Exception`. The compiler forces every caller to catch them or declare them.
- **Unchecked exceptions** extend `RuntimeException`. Callers are not forced to catch them.

In Spring Boot apps, custom exceptions are almost always **unchecked**. They can travel from a service up to the advice class without adding `throws` to every method along the way.

## Why is it used?

- **Clear meaning.** The class name explains the failure.
- **Separate handling.** Your advice class can treat "not found" and "class full" differently, through their types.
- **Carry data.** An exception can hold an error code, the id that was missing, or how much money was short.
- **Clean services.** Services throw business exceptions. Controllers stay free of `if` and `try` code.
- **A stable contract.** Clients can rely on error codes such as `CLASS_FULL`, even if the message text is later reworded.

> **Tip:** Name exceptions after the business problem, not after the technology. `MembershipLapsedException` is better than `MemberCheckFailedException`.

## How it works

Here is how a custom exception travels through the layers.

```text
Controller
  |  calls service
  v
ClubService
  |  rule broken?
  |  throw ClassFullException
  v
Exception rises up
  |
  v
@RestControllerAdvice
  |  handler for ApiException
  v
Status from exception (409)
Body: code + message
```

The service checks a business rule and throws the matching exception. It does not know anything about HTTP replies. The exception rises through the controller without any `try` code, and reaches the advice class. Because all our business exceptions extend one base class, `ApiException`, a single handler method covers all of them. The status and the error code come from the exception object itself.

## Real-Life Example

Think of a railway enquiry office. When a passenger cannot get a ticket, the officer stamps a reason on the form: "Train full", "Wrong date", or "Station closed". Each stamp has a short code that the passenger can quote later at any counter. Custom exceptions are these stamps. A base class gives every stamp the same layout (a code and a message), and each subclass is one specific stamp.

## Code Example

GymFit has classes such as yoga and zumba, and members with active or expired memberships. Joining a class can fail in three business ways, and exporting a report can fail for a technical reason. We need only the web starter.

```text
gymfit-club/
├─ pom.xml
└─ src/main/java/com/gymfit/club/
├─ ClubApplication.java
├─ ApiException.java
├─ ResourceNotFoundException.java
├─ ClassFullException.java
├─ MembershipLapsedException.java
├─ ReportExportException.java
├─ ClubService.java
├─ ClubController.java
├─ ErrorBody.java
└─ ClubExceptionHandler.java
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

    <groupId>com.gymfit</groupId>
    <artifactId>club</artifactId>
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

**File:** `ClubApplication.java` in package `com.gymfit.club`

```java
package com.gymfit.club;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ClubApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClubApplication.class, args);
    }
}
```

**File:** `ApiException.java` in package `com.gymfit.club`

```java
package com.gymfit.club;

import org.springframework.http.HttpStatus;

public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    protected ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
```

**File:** `ResourceNotFoundException.java` in package `com.gymfit.club`

```java
package com.gymfit.club;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends ApiException {

    public ResourceNotFoundException(String resource, Object id) {
        super(HttpStatus.NOT_FOUND, "NOT_FOUND", resource + " " + id + " was not found");
    }
}
```

**File:** `ClassFullException.java` in package `com.gymfit.club`

```java
package com.gymfit.club;

import org.springframework.http.HttpStatus;

public class ClassFullException extends ApiException {

    public ClassFullException(String className) {
        super(HttpStatus.CONFLICT, "CLASS_FULL", "The " + className + " class is full");
    }
}
```

**File:** `MembershipLapsedException.java` in package `com.gymfit.club`

```java
package com.gymfit.club;

import org.springframework.http.HttpStatus;

public class MembershipLapsedException extends ApiException {

    public MembershipLapsedException(String member) {
        super(HttpStatus.FORBIDDEN, "MEMBERSHIP_EXPIRED", member + "'s membership has expired");
    }
}
```

**File:** `ReportExportException.java` in package `com.gymfit.club`

```java
package com.gymfit.club;

public class ReportExportException extends RuntimeException {

    public ReportExportException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

**File:** `ClubService.java` in package `com.gymfit.club`

```java
package com.gymfit.club;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class ClubService {

    record Member(String name, boolean active) {}

    private final Map<Integer, Member> members = Map.of(
            1, new Member("Asha", true),
            2, new Member("Neel", false));

    private final Map<String, Integer> seats = new HashMap<>(Map.of("yoga", 1, "zumba", 0));

    public String join(int memberId, String className) {
        Member member = members.get(memberId);
        if (member == null) {
            throw new ResourceNotFoundException("Member", memberId);
        }
        Integer left = seats.get(className);
        if (left == null) {
            throw new ResourceNotFoundException("Class", className);
        }
        if (!member.active()) {
            throw new MembershipLapsedException(member.name());
        }
        if (left == 0) {
            throw new ClassFullException(className);
        }
        seats.put(className, left - 1);
        return member.name() + " joined " + className;
    }

    public String exportReport() {
        try {
            throw new IOException("Disk /reports is not writable");
        } catch (IOException e) {
            throw new ReportExportException("Could not export the monthly report", e);
        }
    }
}
```

**File:** `ClubController.java` in package `com.gymfit.club`

```java
package com.gymfit.club;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ClubController {

    private final ClubService service;

    public ClubController(ClubService service) {
        this.service = service;
    }

    @PostMapping("/classes/{name}/join")
    public String join(@PathVariable String name, @RequestParam int memberId) {
        return service.join(memberId, name);
    }

    @GetMapping("/reports/export")
    public String export() {
        return service.exportReport();
    }
}
```

**File:** `ErrorBody.java` in package `com.gymfit.club`

```java
package com.gymfit.club;

public record ErrorBody(String code, String message) {
}
```

**File:** `ClubExceptionHandler.java` in package `com.gymfit.club`

```java
package com.gymfit.club;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ClubExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ClubExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorBody> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(new ErrorBody(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(ReportExportException.class)
    public ResponseEntity<ErrorBody> handleExport(ReportExportException ex) {
        log.error("Export failed, root cause: {}", ex.getCause().getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorBody("EXPORT_FAILED", ex.getMessage()));
    }
}
```

Start the app and try the cases. Yoga has one seat, zumba has none, member 2 has an expired membership, and the report export always fails on purpose:

```bash
mvn spring-boot:run
curl -X POST "localhost:8080/classes/yoga/join?memberId=1"
curl -X POST "localhost:8080/classes/yoga/join?memberId=1"
curl -X POST "localhost:8080/classes/yoga/join?memberId=2"
curl -X POST "localhost:8080/classes/yoga/join?memberId=8"
curl localhost:8080/reports/export
```

**Output:**

```bash
POST /classes/yoga/join?memberId=1
Asha joined yoga [200]
POST /classes/yoga/join?memberId=1
{"code":"CLASS_FULL","message":"The yoga class is full"} [409]
POST /classes/zumba/join?memberId=1
{"code":"CLASS_FULL","message":"The zumba class is full"} [409]
POST /classes/yoga/join?memberId=2
{"code":"MEMBERSHIP_EXPIRED","message":"Neel's membership has expired"} [403]
POST /classes/yoga/join?memberId=8
{"code":"NOT_FOUND","message":"Member 8 was not found"} [404]
POST /classes/boxing/join?memberId=1
{"code":"NOT_FOUND","message":"Class boxing was not found"} [404]
GET /reports/export
{"code":"EXPORT_FAILED","message":"Could not export the monthly report"} [500]
```

The number in brackets is the HTTP status. The first call took the last yoga seat, so the second call for yoga found the class full.

## Code Explained

- `ApiException` is an abstract base class. It stores the HTTP status and a short error code, and passes the message to `RuntimeException`. Every business exception extends it.
- `ResourceNotFoundException` takes the resource name and id, and builds a message such as `Member 8 was not found`. One class serves all "not found" cases.
- `ClassFullException` and `MembershipLapsedException` fix their own status (409 and 403) and their own code. The service does not choose a status. The exception does.
- `ClubService` holds the business rules and only throws. It has no idea what HTTP is.
- `ClubExceptionHandler` has one method for `ApiException`, so a new subclass needs no new handler. It builds an `ErrorBody` with the code and message.
- `ReportExportException` shows **wrapping**. The service catches a low-level `IOException` and throws our own exception with the original as the cause. The client sees only a safe sentence, while the log keeps the real reason.

The server log for the export call contains the line `Export failed, root cause: Disk /reports is not writable`, followed by the full stack trace with `Caused by: java.io.IOException`. That is exactly what a developer needs to fix the problem, and the client never sees it.

## Designing Good Exception Classes

| Choice | Advice |
|---|---|
| Parent class | `RuntimeException` (unchecked) for business errors |
| Naming | Business problem plus `Exception`, such as `ClassFullException` |
| Constructors | Take the data needed to build a clear message |
| Extra fields | Add error code, status or values the client may need |
| Base class | One shared base makes one handler enough |
| Cause | Pass the original exception when you wrap another error |

> **Warning:** Do not put private data, such as passwords or card numbers, in an exception message. Messages travel to logs and often to clients.

## Common Mistakes

- **One exception for everything.** A single `BusinessException` with a text message forces clients to read English to learn what happened. Use separate types and error codes.
- **Too many classes.** Do not create a class for every tiny case. Group similar failures, as `ResourceNotFoundException` does with a resource name.
- **Losing the cause.** If you wrap an exception and forget to pass the original, the real reason disappears from your logs.
- **Using checked exceptions for business rules.** They force `throws` clauses everywhere and clutter your service layer.
- **Choosing statuses inside services.** Keep HTTP knowledge in the exception's status field or the advice class, not spread through business code.

## Interview Questions

**How do you create a custom exception in Java?**
Extend `RuntimeException` for an unchecked one, or `Exception` for a checked one, and add constructors that pass a message, and optionally a cause, to the parent.

**Checked or unchecked for a Spring Boot API?**
Unchecked. They do not force `throws` clauses, and Spring rolls back transactions on them by default.

**Why create a base exception class?**
It gives all business exceptions the same fields, such as status and code, so one `@ExceptionHandler` can reply for all of them.

**What does it mean to wrap an exception?**
You catch a low-level exception and throw your own, giving the original as the cause. The client gets a clean message, while logs keep the whole chain.

## Key Points to Remember

- A custom exception names one business failure clearly.
- Extend `RuntimeException`, so services do not need `throws` clauses.
- A shared base class can hold a status and an error code.
- One handler for the base class covers every subclass.
- Wrap technical exceptions and keep the cause for the logs.
- Never place secrets in exception messages.

## Frequently Asked Questions

### How do I create custom exception classes in Spring Boot?

Write a class that extends `RuntimeException`, add a constructor taking the message, throw it from your service, and handle it in a `@RestControllerAdvice` class.

### Should custom exceptions be checked or unchecked?

Unchecked, in almost every Spring Boot project.

### Can a custom exception carry extra data?

Yes. Add fields and getters, such as a missing id or an amount. The medium practice problem returns how many rupees were short.

### Do I need `@ResponseStatus` on the exception?

Not if you use an advice class. `@ResponseStatus` is a shortcut for tiny apps. Our base class stores the status instead, which the handler reads.

## Related Topics

- [@ControllerAdvice and @ExceptionHandler](/learning/spring-boot-tutorial/controller-advice-and-exception-handler): the class that catches your custom exceptions.
- [Exception Handling in Spring Boot](/learning/spring-boot-tutorial/exception-handling-in-spring-boot): see the tools that turn exceptions into replies.
- [Standard API Error Response](/learning/spring-boot-tutorial/standard-api-error-response): pick one JSON shape for all errors.
- [HTTP Status Codes in Spring Boot](/learning/spring-boot-tutorial/http-status-codes-in-spring-boot): choose the right status for each exception.
