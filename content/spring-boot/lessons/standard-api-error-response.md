Picture a courier company that sends you a slip when a delivery fails. One day the slip says "Address not found" in red ink. The next day another slip says only "Error 7". A third arrives as a phone call. You would never build a reliable process on that. You need every failed delivery to come with the same slip, with the same boxes filled in. A standard API error response does this for your API. Every error, from every endpoint, has the same JSON shape.

Let's see what a standard API error response should contain, how to build one in Spring Boot, and how it helps the mobile and web apps that call your API.

## What is a Standard API Error Response?

> **Definition:** A standard API error response is one fixed JSON structure that your API returns for every failure, such as `status`, `code`, `message`, `path` and, for validation, a list of field errors. Clients can then handle any error with the same code.

Compare two replies from two endpoints of a badly designed API:

- Endpoint A returns `{"error": "not found"}`.
- Endpoint B returns `{"message": "Bad input", "errors": ["name"]}`.

The frontend developer must write two parsers, and will need a third for the next endpoint. With a standard response, one parser handles everything.

A good error response answers four questions for the client:

- **What happened?** The HTTP status and a short error name.
- **What exactly?** A stable machine-readable `code`, such as `PRODUCT_NOT_FOUND`.
- **What should I tell the user?** A human message.
- **Where?** The request path, and the field names for validation problems.

## Why is it used?

- **One parser for all errors.** Mobile and web apps handle failures in one place.
- **Stable codes.** A message may be reworded later, but `VALIDATION_FAILED` stays the same, so the app's logic does not break.
- **Better support.** A support person can ask the user for the timestamp and the path, and find the log line.
- **Safe replies.** Because you build the body yourself, you decide what leaves the server. No stack traces.

> **Note:** Spring Boot already returns a small default error JSON with `timestamp`, `status`, `error` and `path`. It has no message or code, so it is a good starting point but not enough for a real API.

## How it works

Every error takes the same road, and the same builder method makes the reply.

```text
Any layer throws an exception
  |
  v
@RestControllerAdvice
  |  picks handler by type
  v
Handler calls build(...)
  |  status, code, message
  |  path from the request
  v
ApiError record filled in
  |
  v
Jackson writes JSON
  |
  v
Client always sees one shape
```

Controllers and services throw exceptions. The advice class catches them and calls one private `build` method. That method creates the same `ApiError` object each time, so the shape never changes. Jackson turns the object into JSON, and the client gets the same layout whether the problem is a missing product or a bad form.

## Real-Life Example

A hospital gives every patient the same discharge slip: name, date, reason, doctor's note and next steps. It does not matter which ward you were in. The reception, the pharmacy and the insurance office all know where to look on that slip. Your error response is that slip. Every client, whether an Android app, a React page or another server, knows exactly where to read the reason.

## Code Example

FreshCart is a grocery shop. We define an `ApiError` record, and a global handler that fills it for four situations: a missing product, invalid input, a wrong parameter type, and any unexpected failure. We need the web starter and the validation starter.

```text
freshcart-shop/
├─ pom.xml
└─ src/main/java/
   com/freshcart/shop/
  ├─ ShopApplication.java
  ├─ ApiError.java
  ├─ ProductNotFoundException.java
  ├─ GlobalExceptionHandler.java
  └─ ProductController.java
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

    <groupId>com.freshcart</groupId>
    <artifactId>shop</artifactId>
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

**File:** `ShopApplication.java` in package `com.freshcart.shop`

```java
package com.freshcart.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}
```

**File:** `ApiError.java` in package `com.freshcart.shop`

```java
package com.freshcart.shop;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String code,
        String message,
        String path,
        List<FieldIssue> fieldErrors) {

    public record FieldIssue(String field, String message) {}
}
```

**File:** `ProductNotFoundException.java` in package `com.freshcart.shop`

```java
package com.freshcart.shop;

public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(long id) {
        super("Product " + id + " was not found");
    }
}
```

**File:** `GlobalExceptionHandler.java` in package `com.freshcart.shop`

```java
package com.freshcart.shop;

import java.time.Instant;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ApiError> notFound(ProductNotFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", ex.getMessage(), request, List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> invalid(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ApiError.FieldIssue> issues = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new ApiError.FieldIssue(e.getField(), e.getDefaultMessage()))
                .sorted((a, b) -> a.field().compareTo(b.field()))
                .toList();
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Some fields are not valid", request, issues);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> wrongType(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "WRONG_PARAMETER_TYPE",
                "Parameter " + ex.getName() + " has the wrong type", request, List.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> unexpected(Exception ex, HttpServletRequest request) {
        log.error("Unexpected failure on {}", request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "Something went wrong. Please try again later.", request, List.of());
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String code, String message,
                                           HttpServletRequest request, List<ApiError.FieldIssue> issues) {
        ApiError body = new ApiError(Instant.now(), status.value(), status.getReasonPhrase(),
                code, message, request.getRequestURI(), issues);
        return ResponseEntity.status(status).body(body);
    }
}
```

**File:** `ProductController.java` in package `com.freshcart.shop`

```java
package com.freshcart.shop;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductController {

    record NewProduct(@NotBlank(message = "Name is required") String name,
                      @Min(value = 1, message = "Price must be at least 1") int priceInRupees) {}

    @GetMapping("/products/{id}")
    public String find(@PathVariable long id) {
        if (id != 1) {
            throw new ProductNotFoundException(id);
        }
        return "Basmati Rice 5 kg";
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public String add(@Valid @RequestBody NewProduct product) {
        return "Added " + product.name();
    }

    @GetMapping("/products/report")
    public String report() {
        throw new IllegalStateException("Stock table is locked");
    }
}
```

Start the app and trigger a missing product:

```bash
mvn spring-boot:run
curl localhost:8080/products/9
```

**Output:**

```json
{
  "timestamp": "2026-09-26T21:52:17.247685849Z",
  "status": 404,
  "error": "Not Found",
  "code": "PRODUCT_NOT_FOUND",
  "message": "Product 9 was not found",
  "path": "/products/9"
}
```

The reply is spaced out here; curl prints it on one line, and your timestamp will differ. Now post a product with a blank name and a price of zero:

```bash
curl -X POST localhost:8080/products \
  -H "Content-Type: application/json" \
  -d '{"name":"","priceInRupees":0}'
```

**Output:**

```json
{
  "timestamp": "2026-09-26T21:52:17.847803242Z",
  "status": 400,
  "error": "Bad Request",
  "code": "VALIDATION_FAILED",
  "message": "Some fields are not valid",
  "path": "/products",
  "fieldErrors": [
    {
      "field": "name",
      "message": "Name is required"
    },
    {
      "field": "priceInRupees",
      "message": "Price must be at least 1"
    }
  ]
}
```

Same shape, plus a list of `fieldErrors`. A text where a number is expected, and a method that throws by surprise, give the same layout:

```bash
curl localhost:8080/products/abc
curl localhost:8080/products/report
```

**Output:**

```json
{
  "timestamp": "2026-09-26T21:52:17.896623968Z",
  "status": 400,
  "error": "Bad Request",
  "code": "WRONG_PARAMETER_TYPE",
  "message": "Parameter id has the wrong type",
  "path": "/products/abc"
}
```

```json
{
  "timestamp": "2026-09-26T21:52:17.993745548Z",
  "status": 500,
  "error": "Internal Server Error",
  "code": "INTERNAL_ERROR",
  "message": "Something went wrong. Please try again later.",
  "path": "/products/report"
}
```

## Code Explained

- `ApiError` is a Java record with the fields of the standard reply. `@JsonInclude(NON_EMPTY)` leaves out empty fields, which is why the not-found reply has no `fieldErrors`. Jackson 3 still keeps its annotations in the old `fasterxml` package name.
- `FieldIssue` is a small nested record for one field and its message.
- `GlobalExceptionHandler` is a `@RestControllerAdvice`. Each `@ExceptionHandler` method only says which status, code and message to use. The private `build` method makes the object, so every reply has the same fields.
- `HttpServletRequest` as a handler argument gives the request path for the `path` field.
- The validation handler turns each failed field into a `FieldIssue`, and sorts them by name so the order is steady.
- The last handler catches everything else, logs the exception and returns a generic message. The client never sees `Stock table is locked`, the real message thrown by the report method.
- The `code` values are constants for the client's program. The `message` is for people.

## Choosing the Fields

| Field | Purpose | Example |
|---|---|---|
| `timestamp` | When it happened | `2026-09-26T21:52:17Z` |
| `status` | HTTP status number | `404` |
| `error` | Standard reason phrase | `Not Found` |
| `code` | Stable code for programs | `PRODUCT_NOT_FOUND` |
| `message` | Text for people | `Product 9 was not found` |
| `path` | The request that failed | `/products/9` |
| `fieldErrors` | Problems per field | name and message pairs |

## A Standard Already Exists: ProblemDetail

You do not have to invent your own layout. **RFC 9457**, called Problem Details for HTTP APIs, defines a standard JSON error with the fields `type`, `title`, `status`, `detail` and `instance`. Spring has a class for it, `ProblemDetail`, and can return it with the media type `application/problem+json`.

You can extend Spring's base class `ResponseEntityExceptionHandler` in your advice. It already handles many built-in exceptions, such as wrong method, wrong type and unreadable body, in that format. You add your own handlers on top. The practice section builds this version and shows the real replies.

Which should you pick? A custom record such as `ApiError` gives full control and a `code` field. `ProblemDetail` follows a public standard that other tools understand. Either is good. Pick one for the whole API, and never mix them.

## Common Mistakes

- **Handling only your own exceptions.** In our own app, a DELETE call to `/products/1`, a path that only allows GET, is refused by Spring with 405. Our catch-all handler turned it into a 500 with `INTERNAL_ERROR`:

```json
{
  "timestamp": "2026-09-26T21:52:48.192351029Z",
  "status": 500,
  "error": "Internal Server Error",
  "code": "INTERNAL_ERROR",
  "message": "Something went wrong. Please try again later.",
  "path": "/products/1"
}
```

That is a client mistake shown as a server error. Fix it by extending `ResponseEntityExceptionHandler`, or by adding handlers for the framework's exceptions.

- **Different shapes in different places.** One controller returns a map, another a record. Keep one type.
- **Using the message as the contract.** Clients that compare message text break when you fix a typo. Use `code`.
- **Leaking internals.** Do not return stack traces, SQL, file paths or the raw message of an unknown exception.

## Interview Questions

**What should a good API error response contain?**
The HTTP status, a stable error code, a readable message, the request path, a timestamp, and field details for validation errors.

**What is ProblemDetail?**
It is Spring's class for RFC 9457 Problem Details. It gives a standard JSON error with `type`, `title`, `status`, `detail` and `instance`, and you can add extra properties such as a `code`.

**Why keep an error code besides the message?**
Programs need a value that never changes. Messages are written for people and may change.

**How do you get one error format for the whole application?**
Write one `@RestControllerAdvice` that builds every error reply from the same class, and extend `ResponseEntityExceptionHandler` to cover the framework's own exceptions.

## Key Points to Remember

- A standard API error response is one fixed JSON shape for every failure.
- Include status, code, message, path and, for validation, field errors.
- Build the reply in one place, inside a `@RestControllerAdvice`.
- Use a stable `code` for programs and a `message` for people.
- Keep internals out of the reply, and log them on the server.
- `ProblemDetail` follows RFC 9457, the public standard for this.
- Cover framework errors too, so a 405 does not become a 500.

## Frequently Asked Questions

### What is the best format for a standard API error response in Spring Boot?

Either a custom record with status, code, message, path and field errors, or the standard `ProblemDetail`. What matters most is that every error uses the same one.

### Should the HTTP status be in the body as well?

Yes, it is common. The real HTTP status still matters most, and the body copy must match it.

### How do I show validation errors in the response?

Read the field errors from the exception in your handler and put them in a list of field and message pairs, as `fieldErrors` does above.

## Related Topics

- [@ControllerAdvice and @ExceptionHandler](/learning/spring-boot-tutorial/controller-advice-and-exception-handler): the class where the standard reply is built.
- [Custom Exception Classes](/learning/spring-boot-tutorial/custom-exception-classes): carry a status and code inside your exceptions.
- [Bean Validation](/learning/spring-boot-tutorial/bean-validation): the source of field errors in the reply.
- [HTTP Status Codes in Spring Boot](/learning/spring-boot-tutorial/http-status-codes-in-spring-boot): match each error to the right status.
