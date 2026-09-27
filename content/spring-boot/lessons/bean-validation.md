A hospital reception desk has a form. The clerk will not accept it if the name is blank, the phone number has six digits, or the visit date is yesterday. She checks each field before the form goes into the file. Your API needs the same clerk. Bean Validation is that clerk for Spring Boot: you write the rules once, as annotations, and Spring checks every incoming request.

Let's see what Bean Validation is, which annotations you will use every week, and how to build an appointment API that refuses bad data with clear messages.

## What is Bean Validation?

> **Definition:** Bean Validation is a standard Java way to declare rules on fields with annotations, such as `@NotBlank` or `@Min`. A validator engine, Hibernate Validator, checks an object against those rules and reports every rule that is broken.

The rules live in the `jakarta.validation.constraints` package. You put them on the fields of a request class or record. Then you add `@Valid` in front of the controller parameter, and Spring Boot runs the check before your method body starts.

In Spring Boot 4 the starter is named `spring-boot-starter-validation`. It is not included in the web starter, so you add it yourself.

## Why is it used?

Never trust data that arrives from outside. Users make typing mistakes, and some people send bad data on purpose. If you skip validation, you meet these problems:

- **Bad data in the database.** A blank name or an age of minus five gets saved and breaks reports later.
- **Crashes.** A missing value becomes a `NullPointerException` deep inside your code.
- **Security holes.** Unchecked input is the start of many attacks.
- **Repeated `if` blocks.** Without annotations, every method begins with ten lines of checks.

With Bean Validation, the rules sit next to the fields they protect. Anyone reading the class sees the rules at once, and every endpoint that uses the class gets the same checks.

> **Tip:** Validate at the edge of your app, in the controller layer, so bad data is stopped early. Keep database constraints as a second safety net.

## How it works

Here is the path of a booking request.

```text
Client sends JSON
  |
  v
Jackson builds the record
  |
  v
@Valid triggers the validator
  |  checks every annotation
  v
Any rule broken?
  |            |
 yes           no
  |            |
  v            v
400 Bad     Controller method
Request     runs normally
```

Jackson first turns the JSON body into a Java object. Because the parameter has `@Valid`, Spring hands that object to the validator. If any rule fails, Spring throws an exception named in the next paragraph, and the controller method never runs. The reply is a 400 status. If all rules pass, your method runs as usual.

The exception has a long name, so here it is on its own line:

```java
MethodArgumentNotValidException
```

## Real-Life Example

At a railway ticket counter, the clerk looks at your form. Name present? Age between 1 and 120? Journey date not in the past? If a box is wrong, she hands the form back with a red circle on it. She does not wait for the train to leave before she finds the mistake. Bean Validation does that check at the counter, before your business code starts work.

## Code Example

CityCare Clinic lets patients book appointments. The request must have a name, a valid Indian mobile number, an email, a sensible age and a future visit date. We need the web starter and the validation starter.

```text
citycare-clinic/
├─ pom.xml
└─ src/main/java/
   com/citycare/clinic/
   ├─ ClinicApplication.java
   ├─ AppointmentRequest.java
   └─ AppointmentController.java
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
    <artifactId>clinic</artifactId>
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

**File:** `ClinicApplication.java` in package `com.citycare.clinic`

```java
package com.citycare.clinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ClinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClinicApplication.class, args);
    }
}
```

**File:** `AppointmentRequest.java` in package `com.citycare.clinic`

```java
package com.citycare.clinic;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AppointmentRequest(
        @NotBlank(message = "Patient name is required")
        @Size(min = 2, max = 40, message = "Name must be 2 to 40 characters")
        String patientName,

        @Pattern(regexp = "[6-9][0-9]{9}", message = "Phone must be a 10 digit Indian mobile number")
        String phone,

        @Email(message = "Email is not valid")
        String email,

        @Min(value = 1, message = "Age must be at least 1")
        @Max(value = 120, message = "Age must be at most 120")
        int age,

        @Future(message = "Visit date must be in the future")
        LocalDate visitDate) {
}
```

**File:** `AppointmentController.java` in package `com.citycare.clinic`

```java
package com.citycare.clinic;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

@RestController
public class AppointmentController {

    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public String book(@Valid @RequestBody AppointmentRequest request) {
        return "Booked " + request.patientName() + " for " + request.visitDate();
    }

    @GetMapping("/appointments/slots")
    public String slots(@RequestParam @Min(1) @Max(10) int count) {
        return count + " slots shown";
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> onInvalidBody(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        return errors;
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public List<String> onInvalidParam(HandlerMethodValidationException ex) {
        return ex.getAllErrors().stream().map(MessageSourceResolvable::getDefaultMessage).toList();
    }
}
```

First send a good request, then a bad one:

```bash
mvn spring-boot:run
curl -X POST localhost:8080/appointments \
  -H "Content-Type: application/json" \
  -d '{"patientName":"Asha Rao","phone":"9876543210","email":"asha@example.com","age":34,"visitDate":"2030-01-15"}'
```

**Output:**

```text
Booked Asha Rao for 2030-01-15
```

The reply status is 201. Now send a request where every field is wrong:

```bash
curl -X POST localhost:8080/appointments \
  -H "Content-Type: application/json" \
  -d '{"patientName":" ","phone":"12345","email":"not-an-email","age":0,"visitDate":"2020-01-01"}'
```

**Output:**

```json
{
  "age": "Age must be at least 1",
  "phone": "Phone must be a 10 digit Indian mobile number",
  "patientName": "Name must be 2 to 40 characters",
  "email": "Email is not valid",
  "visitDate": "Visit date must be in the future"
}
```

The reply has status 400 and is spaced out here. The name broke two rules, `@NotBlank` and `@Size`, but this small handler keeps one message per field, so you see one. Field order in the reply may differ on your machine.

## Code Explained

- `AppointmentRequest` is a record. The annotations sit on its components, and each one carries a `message` that the user will read.
- `@NotBlank` fails for null, empty and spaces-only text. `@Size` limits the length. `@Pattern` matches a regular expression. `@Email` checks the email shape.
- `@Min` and `@Max` limit numbers, and `@Future` needs a date after today.
- `@Valid @RequestBody` in the controller is what switches the check on. Without `@Valid` the annotations do nothing.
- `@RequestParam @Min(1) @Max(10) int count` puts rules on a single query value. In Spring 7 this works without any class-level annotation.
- The two `@ExceptionHandler` methods turn the failures into readable JSON. Without them, the client gets only a bare 400, as you will see below. The next topics cover better ways to do this for the whole app.

Calling `slots?count=50` returns:

```json
["must be less than or equal to 10"]
```

## What Happens Without a Handler?

Spring Boot's default error reply for a failed validation is short. It has the status, but it does not say which field was wrong:

```json
{
  "timestamp": "2026-09-26T21:31:36.652Z",
  "status": 400,
  "error": "Bad Request",
  "path": "/appointments"
}
```

So your handler, or a global one, decides how helpful the reply is.

> **Note:** A wrong JSON type is a different failure. If `visitDate` is `"tomorrow"`, Jackson cannot even build the record, so the request stops with 400 before validation starts.

## Common Constraint Annotations

| Annotation | Checks | Works on |
|---|---|---|
| `@NotNull` | Value is not null | Any object |
| `@NotBlank` | Not null, and has a non-space character | Text |
| `@NotEmpty` | Not null and not empty | Text, lists, maps |
| `@Size(min, max)` | Length or item count | Text, lists |
| `@Min` and `@Max` | Number range | Numbers |
| `@Positive` | Greater than zero | Numbers |
| `@Email` | Looks like an email | Text |
| `@Pattern` | Matches a regex | Text |
| `@Past` and `@Future` | Date is before or after now | Dates |

Most constraints treat null as valid. Only `@NotNull`, `@NotBlank` and `@NotEmpty` reject it, so add one of them for required fields.

## Common Mistakes

- **Forgetting the validation starter.** With only the web starter, the validation library is not on the classpath, so the annotations do not even compile.
- **Forgetting `@Valid`.** The annotations on your class are silent until the parameter has `@Valid`.
- **Using `@NotNull` on text.** A string of spaces passes `@NotNull`. Use `@NotBlank` for text.
- **Nested objects not checked.** To validate a list of items inside a request, mark the list items or the field with `@Valid` too, as the practice section shows.
- **Trusting the frontend.** A React form may validate, but any client can skip it. Always validate on the server.

## Interview Questions

**What is the difference between @NotNull, @NotEmpty and @NotBlank?**
`@NotNull` rejects null only. `@NotEmpty` also rejects an empty text or collection. `@NotBlank` is for text and also rejects text made only of spaces.

**What does @Valid do?**
It tells Spring to run the validator on that object, and on nested objects that are also marked, before the method body runs.

**Which exception is thrown when a request body fails validation?**
It is the argument-not-valid exception. It holds a `BindingResult` with every broken rule.

**Where does the validation engine come from?**
Bean Validation is a specification. Hibernate Validator is the implementation that comes with the validation starter.

## Key Points to Remember

- Put rules on fields with annotations from `jakarta.validation.constraints`.
- Add the validation starter, and add `@Valid` on the parameter to turn the checks on.
- A failed body check throws the argument-not-valid exception, and the reply is 400.
- Use `@NotBlank` for required text and `@Positive` or `@Min` for numbers.
- Give each rule a clear `message`.
- Validate on the server even if the frontend validates too.

## Frequently Asked Questions

### Why is my Bean Validation not working in Spring Boot?

The usual causes are a missing validation starter or a missing `@Valid` on the controller parameter. Check both first.

### Can I validate query parameters and path variables?

Yes. Put the constraint next to the parameter, for example `@PathVariable @Positive long id`. A broken rule gives a 400 reply.

### How do I show all errors and not only the first?

Read every field error from the `BindingResult` in a handler, as we did with a map of field names to messages.

### Do I write the error messages in the annotation?

You can, with the `message` attribute. Larger apps keep them in a message file so they can be translated.

## Related Topics

- [Custom Validation Annotation](/learning/spring-boot-tutorial/custom-validation-annotation): write your own rule when the built-in ones are not enough.
- [@RequestBody](/learning/spring-boot-tutorial/request-body): see how the JSON body reaches your method.
- [Exception Handling in Spring Boot](/learning/spring-boot-tutorial/exception-handling-in-spring-boot): learn the ways to turn failures into replies.
- [DTO Pattern](/learning/spring-boot-tutorial/dto-pattern): keep validation rules on request classes, not on entities.
