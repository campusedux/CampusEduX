A tiffin service gets an order for a plan that does not exist, a tiffin that is already being cooked, and a customer who types "x" where a number should be. Things go wrong every day. A good kitchen does not shut down when one order is wrong. It says a clear sentence to the customer and carries on. Exception handling in Spring Boot is how your API does the same.

Let's look at what happens when your code throws an exception, what Spring Boot does by default, and the main tools you can use to give clients a clear answer.

## What is Exception Handling in Spring Boot?

> **Definition:** Exception handling in Spring Boot means catching errors thrown while a request is processed, and turning them into a proper HTTP response with the right status code and a helpful body, instead of letting the client see a crash.

An exception is Java's way of saying "something went wrong here". If nobody catches it, it travels up through your controller, into Spring MVC, and finally to the web server. Spring Boot catches it at the very end and produces a default error reply.

Your job is to decide two things for each kind of failure: which **status code** the client should see, and which **message** helps them fix the problem.

## Why is it used?

Without a plan for errors, your API shows these problems:

- **Wrong status codes.** A missing record should be 404, but a crash gives 500. Clients then think your server is broken, when they only asked for something that does not exist.
- **Silent failures.** The default reply says only "Internal Server Error". The client does not know what to change.
- **Leaked details.** A raw Java message such as a database error can show table names or code paths to strangers.
- **Messy code.** Every method fills up with `try` and `catch` blocks.

Good handling gives clients a clear contract, keeps internal details private, and keeps your business code clean.

> **Warning:** Never send a stack trace or a database error text to the client. Log it on the server, and send a short, safe message.

## How it works

Here is what happens when a controller method throws an exception.

```text
Controller method
  |  throws an exception
  v
DispatcherServlet catches it
  |
  v
Handler exception resolvers
  |  @ExceptionHandler?
  |  @ResponseStatus?
  |
  +--> match found: your reply
  |
  v  no match
Spring Boot /error page
  |
  v
Default JSON: status, error, path
```

The DispatcherServlet asks a chain of exception resolvers whether any of them knows this exception. The first one checks for an `@ExceptionHandler` method in the same controller, or in a shared advice class. Another one checks for `@ResponseStatus` on the exception class, and another handles `ResponseStatusException`. If none matches, the error goes to Spring Boot's own `/error` mapping, which creates the default JSON.

## Real-Life Example

Think of a bank branch. A customer asks for a form the bank does not have. The clerk does not faint. She says, "Sorry, we do not have that form, please try the next counter." If a clerk cannot solve a problem, she calls the manager, who deals with it and tells the customer in polite words. Nobody sees the messy office. Your exception handlers are the clerks and the manager. Small, known problems get a quick specific answer, and unknown problems go to a general handler that says "something went wrong" and logs the details.

## Code Example

TiffinBox runs a daily meal service. We build a kitchen API that fails in five different ways, and look at what the client sees each time. We need only the web starter.

```text
tiffinbox-kitchen/
├─ pom.xml
└─ src/main/java/
   com/tiffinbox/kitchen/
   ├─ KitchenApplication.java
   ├─ TiffinLockedException.java
   └─ TiffinController.java
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

    <groupId>com.tiffinbox</groupId>
    <artifactId>kitchen</artifactId>
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

**File:** `KitchenApplication.java` in package `com.tiffinbox.kitchen`

```java
package com.tiffinbox.kitchen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class KitchenApplication {

    public static void main(String[] args) {
        SpringApplication.run(KitchenApplication.class, args);
    }
}
```

**File:** `TiffinLockedException.java` in package `com.tiffinbox.kitchen`

```java
package com.tiffinbox.kitchen;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class TiffinLockedException extends RuntimeException {

    public TiffinLockedException(String message) {
        super(message);
    }
}
```

**File:** `TiffinController.java` in package `com.tiffinbox.kitchen`

```java
package com.tiffinbox.kitchen;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class TiffinController {

    private final Map<Integer, String> tiffins = Map.of(1, "Dal Rice Thali", 2, "Paneer Thali");

    @GetMapping("/tiffins/{id}")
    public String find(@PathVariable int id) {
        String name = tiffins.get(id);
        if (name == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tiffin " + id + " not found");
        }
        return name;
    }

    @GetMapping("/tiffins/{id}/cancel")
    public String cancel(@PathVariable int id) {
        throw new TiffinLockedException("Tiffin " + id + " is already being cooked");
    }

    @GetMapping("/tiffins/{id}/plan")
    public String plan(@PathVariable int id, @RequestParam int days) {
        if (days < 1) {
            throw new IllegalArgumentException("A plan needs at least 1 day");
        }
        return "Plan for " + days + " days";
    }

    @GetMapping("/tiffins/crash")
    public String crash() {
        throw new IllegalStateException("Gas cylinder data is missing");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> onBadArgument(IllegalArgumentException ex) {
        return Map.of("message", ex.getMessage());
    }
}
```

Start the app and try each case:

```bash
mvn spring-boot:run
curl -i localhost:8080/tiffins/9
curl -i localhost:8080/tiffins/1/cancel
curl -i "localhost:8080/tiffins/1/plan?days=0"
curl -i localhost:8080/tiffins/crash
```

Here are the four replies we got, in order, each followed by its status in brackets. The timestamps will differ on your machine.

**Output:**

```bash
{"timestamp":"2026-09-26T21:40:41.232Z","status":404,"error":"Not Found","path":"/tiffins/9"} [404]
{"timestamp":"2026-09-26T21:40:41.332Z","status":409,"error":"Conflict","path":"/tiffins/1/cancel"} [409]
{"message":"A plan needs at least 1 day"} [400]
{"timestamp":"2026-09-26T21:40:41.429Z","status":500,"error":"Internal Server Error","path":"/tiffins/crash"} [500]
```

## Code Explained

- `ResponseStatusException` is the quick way. You throw it with a status and a reason, right where the problem is found. Our `find` method uses it for status 404.
- `@ResponseStatus` with the value `CONFLICT`, placed on `TiffinLockedException`, links the exception class to a status. Whenever it is thrown, the client sees 409. This is neat for exceptions that always mean the same thing.
- The `@ExceptionHandler` method inside the controller handles `IllegalArgumentException` for this controller only. It returns a small JSON with the message and status 400.
- The `crash` method throws an exception that nobody handles. Spring Boot's default handler turns it into a 500. The message is not shown to the client, which is a safe default.
- A missing path such as `/nothing` gets the default 404 reply, from the same `/error` mechanism.

Notice something about the default replies for 404, 409 and 500. They carry the status, the error name and the path, but they do not carry your message. The message stays hidden on purpose, so that internal text does not leak. If you want the client to read your text, you write the reply yourself, as the local handler does.

> **Note:** A browser asking for HTML gets Spring Boot's "Whitelabel Error Page" instead of JSON. That page is a fallback and is not meant for real users.

## Ways to Handle Exceptions

| Tool | Scope | Best for |
|---|---|---|
| `try` and `catch` | One block of code | Errors you can recover from |
| `ResponseStatusException` | One place in code | Quick one-off errors |
| `@ResponseStatus` on a class | Everywhere the class is thrown | Fixed status per exception |
| `@ExceptionHandler` in a controller | That controller | Local special cases |
| Shared advice class | Whole application | The main, tidy solution |

The last row is the topic of the next guides.

## Common Mistakes

- **Catching `Exception` everywhere.** A broad `catch` hides real bugs. Catch only what you can handle.
- **Swallowing the error.** An empty `catch` block means nobody will ever know what failed. Log it or rethrow it.
- **Wrong status codes.** Do not return 200 with the words "error" in the body. Clients read the status first.
- **A handler that is too wide.** In our kitchen, sending `days=x` also ended up in the `IllegalArgumentException` handler, with a raw Java message: `For input string: "x"`. Broad handlers catch framework errors too, and the message may reveal internals.
- **Leaking details.** Do not return `ex.getMessage()` for unknown exceptions. Log the exception, and return a fixed friendly text.

## Interview Questions

**What happens if a controller throws an exception nobody handles?**
The exception reaches Spring MVC's resolvers. If none handles it, Spring Boot's `/error` mapping produces a default JSON reply, usually with status 500.

**What is the difference between @ResponseStatus and ResponseStatusException?**
`@ResponseStatus` is put on an exception class and gives every throw of it the same status. `ResponseStatusException` is an exception you create with any status at the point of the problem.

**Which HTTP status should a missing resource return?**
404 Not Found. A validation problem is 400, a conflict with the current state is 409, and an unexpected crash is 500.

**Should you show the exception message to clients?**
Only for errors you designed, such as "Show 2 is sold out". For unexpected errors, log the details and send a generic message.

## Key Points to Remember

- Uncaught exceptions become Spring Boot's default error reply, with no message.
- Pick a status code that matches the failure: 400, 404, 409 or 500.
- `ResponseStatusException` and `@ResponseStatus` are the fastest ways to set a status.
- `@ExceptionHandler` lets you write the whole reply for chosen exceptions.
- Log the details on the server and keep client messages safe.
- A shared advice class is the clean way to handle exceptions for the whole app.

## Frequently Asked Questions

### How do I keep exception handling in Spring Boot clean?

Throw clear exceptions from your services, and handle them in one shared advice class with `@ExceptionHandler` methods. The next topics show how.

### Why does Spring Boot not show my exception message?

By default it hides the message from the error JSON so that internal details do not leak. Return your own body from a handler when you want the message shown.

### What is the difference between checked and unchecked exceptions here?

Spring rolls back transactions on unchecked exceptions by default, and unchecked ones are easier to throw from controllers. Most Spring Boot code uses unchecked exceptions.

### Should I use try and catch in controllers?

Only when you can recover, such as trying a fallback. For everything else let the exception travel to a handler.

## Related Topics

- [@ControllerAdvice and @ExceptionHandler](/learning/spring-boot-tutorial/controller-advice-and-exception-handler): handle errors for every controller in one class.
- [Custom Exception Classes](/learning/spring-boot-tutorial/custom-exception-classes): design your own exceptions that carry the status and a code.
- [HTTP Status Codes in Spring Boot](/learning/spring-boot-tutorial/http-status-codes-in-spring-boot): pick the right code for each failure.
- [Standard API Error Response](/learning/spring-boot-tutorial/standard-api-error-response): give every error the same JSON shape.
