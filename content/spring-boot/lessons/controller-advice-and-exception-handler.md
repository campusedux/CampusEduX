Imagine a pharmacy with ten counters. If each counter had its own way of telling a customer "sorry, that medicine is out of stock", one would shout, one would write on a slip and one would just shrug. The manager fixes this with one rule for the whole shop: every counter says the same sentence in the same way. In Spring Boot, `@ControllerAdvice` and `@ExceptionHandler` are that manager's rule. You write the error replies once, and every controller uses them.

Let's see what these two annotations do, how Spring finds the right handler, and how to build one shared error handler for a pharmacy API.

## What are @ControllerAdvice and @ExceptionHandler?

> **Definition:** `@ExceptionHandler` marks a method that handles one or more exception types and returns the reply. `@ControllerAdvice` marks a class whose handler methods apply to every controller in the application. Its sibling `@RestControllerAdvice` also writes the return values straight into the response body as JSON.

Think of them as two layers:

- **`@ExceptionHandler`** is the "what to do" part. The method receives the exception and returns the reply.
- **`@ControllerAdvice`** is the "where it applies" part. Put the handler methods in such a class, and they work for all controllers instead of one.

For REST APIs you almost always use `@RestControllerAdvice`, which is `@ControllerAdvice` plus `@ResponseBody`. In this guide, "the advice class" means that one.

## Why is it used?

With an exception handler inside each controller, you copy the same code into every class. With one advice class, you get:

- **One place for all error rules.** Change a message or a status in one file.
- **Clean controllers.** Controller methods only describe the happy path and throw exceptions when something is wrong.
- **The same reply shape everywhere.** Mobile and web clients can trust one format.
- **Safer replies.** A single catch-all handler makes sure that no stack trace or database text ever reaches a client.
- **Easy logging.** You log unexpected errors in one spot.

> **Tip:** Let services and controllers throw specific exceptions, such as `MedicineNotFoundException`. Decide the status code only in the advice class.

## How it works

Here is how Spring finds the right handler.

```text
Controller throws exception
  |
  v
Handler in the same
controller for this type?
  |  yes --> use it
  | no
  v
Advice classes, in order
  |  match on exception type
  v
Most specific match wins
  |
  v
Method returns the reply
  |
  v
JSON body + status to client
```

Spring first looks for a matching `@ExceptionHandler` inside the controller that threw the error. If there is none, it checks the advice classes. Among the handlers that can accept the exception, it picks the closest one by type. A handler for `OutOfStockException` beats a handler for `Exception`, because it is more specific. If you have several advice classes, add `@Order` to decide which is asked first.

## Real-Life Example

A hospital has a complaints desk at the entrance. Whatever ward has a problem, the patient's family goes to the same desk. The desk staff have printed replies for the common issues: "bed not available", "doctor on leave", "report not ready". For an issue nobody planned, they say "we are looking into it", and they write it in a register for the manager. Your advice class is the complaints desk. Each `@ExceptionHandler` is one printed reply, and the catch-all handler with the log line is the register.

## Code Example

Medico Pharmacy has an API to look up medicines, sell them and add new ones. Missing medicines give 404, low stock gives 409, and bad input gives 400 with a list of field errors. We need the web starter and the validation starter.

```text
medico-store/
├─ pom.xml
└─ src/main/java/com/medico/store/
├─ StoreApplication.java
├─ MedicineController.java
├─ MedicineNotFoundException.java
├─ OutOfStockException.java
├─ ApiMessage.java
└─ GlobalExceptionHandler.java
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

    <groupId>com.medico</groupId>
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
            <artifactId>spring-boot-starter-validation</artifactId>
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

**File:** `StoreApplication.java` in package `com.medico.store`

```java
package com.medico.store;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(StoreApplication.class, args);
    }
}
```

**File:** `MedicineNotFoundException.java` in package `com.medico.store`

```java
package com.medico.store;

public class MedicineNotFoundException extends RuntimeException {

    public MedicineNotFoundException(long id) {
        super("Medicine " + id + " not found");
    }
}
```

**File:** `OutOfStockException.java` in package `com.medico.store`

```java
package com.medico.store;

public class OutOfStockException extends RuntimeException {

    public OutOfStockException(String name, int left) {
        super(name + " has only " + left + " left");
    }
}
```

**File:** `ApiMessage.java` in package `com.medico.store`

```java
package com.medico.store;

public record ApiMessage(int status, String message) {
}
```

**File:** `GlobalExceptionHandler.java` in package `com.medico.store`

```java
package com.medico.store;

import java.util.Map;
import java.util.TreeMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MedicineNotFoundException.class)
    public ResponseEntity<ApiMessage> notFound(MedicineNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiMessage(404, ex.getMessage()));
    }

    @ExceptionHandler(OutOfStockException.class)
    public ResponseEntity<ApiMessage> outOfStock(OutOfStockException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiMessage(409, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> invalid(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new TreeMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiMessage> unexpected(Exception ex) {
        log.error("Unexpected failure", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiMessage(500, "Something went wrong. Please try again later."));
    }
}
```

**File:** `MedicineController.java` in package `com.medico.store`

```java
package com.medico.store;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MedicineController {

    record Medicine(String name, int stock) {}
    record NewMedicine(@NotBlank(message = "Name is required") String name,
                       @Min(value = 0, message = "Stock cannot be negative") int stock) {}

    private final Map<Long, Medicine> shelf = new ConcurrentHashMap<>(Map.of(
            1L, new Medicine("Paracetamol 500", 20),
            2L, new Medicine("Cough Syrup", 3)));

    @GetMapping("/medicines/{id}")
    public Medicine find(@PathVariable long id) {
        Medicine medicine = shelf.get(id);
        if (medicine == null) {
            throw new MedicineNotFoundException(id);
        }
        return medicine;
    }

    @PostMapping("/medicines/{id}/sell")
    public String sell(@PathVariable long id, @RequestParam int qty) {
        Medicine medicine = find(id);
        if (medicine.stock() < qty) {
            throw new OutOfStockException(medicine.name(), medicine.stock());
        }
        shelf.put(id, new Medicine(medicine.name(), medicine.stock() - qty));
        return "Sold " + qty + " of " + medicine.name();
    }

    @PostMapping("/medicines")
    public String add(@Valid @RequestBody NewMedicine request) {
        return "Added " + request.name();
    }

    @GetMapping("/medicines/audit")
    public String audit() {
        throw new IllegalStateException("Audit database is down: password=abc123");
    }
}
```

Start the app and call the endpoints in this order: a good lookup, an unknown id, selling five cough syrups when three are left, adding a medicine with bad fields, and the audit endpoint that fails on purpose.

```bash
mvn spring-boot:run
curl localhost:8080/medicines/1
curl localhost:8080/medicines/9
curl -X POST "localhost:8080/medicines/2/sell?qty=5"
curl -X POST localhost:8080/medicines \
  -H "Content-Type: application/json" \
  -d '{"name":"","stock":-1}'
curl localhost:8080/medicines/audit
```

**Output:**

```bash
{"name":"Paracetamol 500","stock":20} [200]
{"status":404,"message":"Medicine 9 not found"} [404]
{"status":409,"message":"Cough Syrup has only 3 left"} [409]
{"name":"Name is required","stock":"Stock cannot be negative"} [400]
{"status":500,"message":"Something went wrong. Please try again later."} [500]
{"status":500,"message":"Something went wrong. Please try again later."} [500]
```

The number in brackets is the HTTP status, added by curl's `-w` option. Look at the last reply. The audit method threw a message with a password in it, but the client only saw a safe sentence. The real message went to the server log.

## Code Explained

- `@RestControllerAdvice` on `GlobalExceptionHandler` makes every handler method inside it apply to all controllers, and turns the return value into JSON.
- `@ExceptionHandler` naming the not-found exception class says "this method handles that exception". The exception comes in as the method argument.
- `ResponseEntity<ApiMessage>` lets each handler choose both the status and the body.
- The handler for the argument-not-valid exception, which Bean Validation triggers, reads every failed field and returns a map of field to message, so the client learns everything that is wrong at once.
- The `Exception.class` handler is the safety net. It logs the full exception with `log.error` and returns a generic message. Because it is the least specific, it runs only when no other handler matches.
- The controller has no `try` or `catch`. It throws, and the advice replies.

## Limiting an Advice Class

By default the advice applies to every controller. You can narrow it. For example, to cover only controllers under one package:

```java
@RestControllerAdvice(basePackages = "com.medico.store.admin")
public class AdminExceptionHandler {
    // handlers for the admin API only
}
```

You can also use `assignableTypes` for named controller classes, or `annotations` for controllers with a given annotation. Use `@Order` when two advice classes could match the same exception.

## Common Mistakes

- **A catch-all that hides client errors.** Look at our own app. A call to `/medicines/abc` puts text where a number should be. That is a client mistake and deserves 400, but our `Exception` handler turned it into a 500. Add a handler for the type mismatch, or extend Spring's base handler class, which you will meet in the standard error response topic.
- **Returning `ex.getMessage()` for unknown errors.** It can leak internals. Log it, and reply with a fixed text.
- **Forgetting the log line.** A catch-all that does not log makes production bugs invisible.
- **Handling status inside the controller too.** Mixing both styles confuses readers. Decide the reply in the advice class only.

## Interview Questions

**What is the difference between @ControllerAdvice and @RestControllerAdvice?**
`@RestControllerAdvice` is `@ControllerAdvice` plus `@ResponseBody`, so handler return values are written as JSON without extra annotations.

**Which handler is chosen when several match?**
The most specific one by exception type. A handler for a subclass beats a handler for its parent.

**Can @ExceptionHandler handle more than one exception?**
Yes. Give a list, such as `@ExceptionHandler({A.class, B.class})`, and take a common parent as the method argument.

**What is the difference between a local and a global handler?**
A handler inside a controller works only for that controller and is checked first. A handler in an advice class works for all controllers.

## Key Points to Remember

- `@ExceptionHandler` turns one exception type into a reply.
- `@RestControllerAdvice` shares those handlers with every controller.
- The most specific handler wins.
- Throw specific exceptions in business code, and choose statuses in the advice class.
- Add a catch-all handler that logs the error and hides the details.
- Do not let the catch-all turn client mistakes into 500 replies.

## Frequently Asked Questions

### How do I use @ControllerAdvice for global exception handling in Spring Boot?

Create a class with `@RestControllerAdvice`, add methods with `@ExceptionHandler` for each exception type, and return a `ResponseEntity` or a body with `@ResponseStatus`. Spring finds it through component scan.

### Where should the advice class live?

In a package that component scan reaches, usually next to your main class or in a package named `exception`.

### Can I get the request path in a handler?

Yes. Add `HttpServletRequest` or `WebRequest` as a method argument, and read the URI from it.

### Does @ExceptionHandler catch exceptions from filters?

No. Filters run before the controller layer, so their errors do not reach these handlers.

## Related Topics

- [Exception Handling in Spring Boot](/learning/spring-boot-tutorial/exception-handling-in-spring-boot): see the default behaviour that these handlers replace.
- [Custom Exception Classes](/learning/spring-boot-tutorial/custom-exception-classes): design the exceptions your handlers catch.
- [Standard API Error Response](/learning/spring-boot-tutorial/standard-api-error-response): give every handler the same JSON shape.
- [Bean Validation](/learning/spring-boot-tutorial/bean-validation): produce the field errors that the invalid handler reports.
