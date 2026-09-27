Every country has its own rules for data. An Indian pincode has six digits and never starts with zero. A vehicle plate looks like MH12AB1234. A hotel stay cannot end before it begins. The built-in annotations such as `@NotBlank` and `@Min` know nothing about these business rules. So what do you do? You write your own annotation, and use it as easily as the built-in ones.

In this guide you will build a custom validation annotation for a hotel booking API. You will make a field rule for pincodes and a class rule that compares two dates.

## What is a Custom Validation Annotation?

> **Definition:** A custom validation annotation is an annotation you create yourself, marked with `@Constraint`, that points to a validator class holding your own check. You then place it on fields or classes exactly like `@NotBlank`.

It always has two pieces:

- **The annotation.** It carries the default error message and a link to the validator. It has no logic.
- **The validator.** A class that implements `ConstraintValidator` and contains the `isValid` method, where the real check lives.

If you have already used `@Valid` with the built-in annotations, this is the natural next step. The only new thing is that you supply the rule.

## Why is it used?

Built-in annotations cover general checks. Real apps have their own rules:

- **Business formats.** Pincodes, GST numbers, vehicle plates, roll numbers.
- **Rules across fields.** Check-out after check-in, or the password field equal to its confirmation.
- **Rules that need data.** An email that is not registered yet, or a coupon that has not expired.
- **Reuse.** Write the rule once, and use it on ten request classes.

Without a custom annotation, you copy the same `if` statements into every controller. With it, one class holds the rule, and every place that uses the annotation stays in sync.

> **Tip:** If a rule is only one regular expression, you may not need a custom annotation. Use `@Pattern`. Write a custom one when the rule needs code, needs several fields, or will be reused often.

## How it works

Here is what happens when a request with a custom annotation arrives.

```text
JSON body arrives
  |
  v
@Valid starts validation
  |
  v
Validator engine reads
@IndianPincode on the field
  |
  v
Finds PincodeValidator
  |  isValid(value, context)
  v
true = pass, false = violation
  |
  v
Violations become a 400 reply
```

The engine sees your annotation, follows the `@Constraint(validatedBy = ...)` link, and creates the validator class. It then calls `isValid` with the value. If the method returns false, the engine records a violation with your message. All violations together become the `MethodArgumentNotValid` failure, and the client gets a 400.

## Real-Life Example

Think of a bank's account opening desk. The general form checks are the same everywhere: name filled, age a number. But this bank also has its own rule: an account holder's PAN must match a special pattern, and the father's name must differ from the branch manager's. The bank prints a new stamp for this rule and gives it to every clerk. Your custom annotation is that stamp. Any clerk, on any form, can use it, and it always checks the same way.

## Code Example

StayWell is a small hotel chain. A booking has a guest name, a pincode and two dates. We write the field annotation `@IndianPincode` and a class annotation `@ValidStay`. We need the web starter and the validation starter.

```text
staywell-booking/
├─ pom.xml
└─ src/main/java/
   com/staywell/booking/
   ├─ BookingApplication.java
   ├─ IndianPincode.java
   ├─ PincodeValidator.java
   ├─ ValidStay.java
   ├─ StayValidator.java
   ├─ BookingRequest.java
   └─ BookingController.java
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

    <groupId>com.staywell</groupId>
    <artifactId>booking</artifactId>
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

**File:** `BookingApplication.java` in package `com.staywell.booking`

```java
package com.staywell.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingApplication.class, args);
    }
}
```

**File:** `IndianPincode.java` in package `com.staywell.booking`

```java
package com.staywell.booking;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Documented
@Constraint(validatedBy = PincodeValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface IndianPincode {

    String message() default "Pincode must be 6 digits and cannot start with 0";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
```

**File:** `PincodeValidator.java` in package `com.staywell.booking`

```java
package com.staywell.booking;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PincodeValidator implements ConstraintValidator<IndianPincode, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }
        return value.matches("[1-9][0-9]{5}");
    }
}
```

**File:** `ValidStay.java` in package `com.staywell.booking`

```java
package com.staywell.booking;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Documented
@Constraint(validatedBy = StayValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidStay {

    String message() default "Check-out must be after check-in";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
```

**File:** `StayValidator.java` in package `com.staywell.booking`

```java
package com.staywell.booking;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class StayValidator implements ConstraintValidator<ValidStay, BookingRequest> {

    @Override
    public boolean isValid(BookingRequest request, ConstraintValidatorContext context) {
        if (request.checkIn() == null || request.checkOut() == null) {
            return true;
        }
        if (request.checkOut().isAfter(request.checkIn())) {
            return true;
        }
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                .addPropertyNode("checkOut")
                .addConstraintViolation();
        return false;
    }
}
```

**File:** `BookingRequest.java` in package `com.staywell.booking`

```java
package com.staywell.booking;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@ValidStay
public record BookingRequest(
        @NotBlank(message = "Guest name is required") String guest,
        @IndianPincode String pincode,
        @NotNull(message = "Check-in date is required") LocalDate checkIn,
        @NotNull(message = "Check-out date is required") LocalDate checkOut) {
}
```

**File:** `BookingController.java` in package `com.staywell.booking`

```java
package com.staywell.booking;

import java.util.Map;
import java.util.TreeMap;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookingController {

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public String book(@Valid @RequestBody BookingRequest request) {
        return "Room booked for " + request.guest();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> onInvalid(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new TreeMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        ex.getBindingResult().getGlobalErrors()
                .forEach(e -> errors.put(e.getObjectName(), e.getDefaultMessage()));
        return errors;
    }
}
```

Send a good booking first:

```bash
mvn spring-boot:run
curl -X POST localhost:8080/bookings \
  -H "Content-Type: application/json" \
  -d '{"guest":"Neel Kumar","pincode":"411001","checkIn":"2030-03-01","checkOut":"2030-03-04"}'
```

**Output:**

```text
Room booked for Neel Kumar
```

The status is 201. Now a booking with a pincode that starts with zero and dates in the wrong order:

```bash
curl -X POST localhost:8080/bookings \
  -H "Content-Type: application/json" \
  -d '{"guest":"Neel Kumar","pincode":"012345","checkIn":"2030-03-04","checkOut":"2030-03-01"}'
```

**Output:**

```json
{
  "checkOut": "Check-out must be after check-in",
  "pincode": "Pincode must be 6 digits and cannot start with 0"
}
```

The reply has status 400 and is spaced out here so it is easy to read.

## Code Explained

- `@Constraint(validatedBy = PincodeValidator.class)` links the annotation to its checking class.
- `@Target` says where the annotation may sit. `IndianPincode` goes on fields and parameters. `ValidStay` goes on a type, which makes it a class-level rule.
- `@Retention(RUNTIME)` keeps the annotation alive when the app runs. Without it, the validator engine cannot see it.
- The three members `message`, `groups` and `payload` are required by the Bean Validation rules, so every constraint annotation declares them.
- The validator implements `ConstraintValidator` with two type arguments: the annotation, and the type it checks. Ours means "I check `IndianPincode` on `String` values".
- `PincodeValidator` returns true for null. That is the usual habit: a null field is the job of `@NotNull` or `@NotBlank`, and one annotation should check one thing.
- `StayValidator` receives the whole `BookingRequest`, so it can compare two fields. When the dates are wrong, it builds a violation and attaches it to the `checkOut` property, so the client sees the message next to the right field.
- The context call that disables the default violation removes the general class-level message, so only our field-level message appears.

## Field Rules and Class Rules

| Kind | Placed on | Validates | Good for |
|---|---|---|---|
| Field rule | A field or parameter | One value | Formats such as pincode or plate |
| Class rule | The type | The whole object | Two dates, password and confirmation |

> **Warning:** Do not let a validator call slow things, such as a remote service, on every request. Validators run on the request thread. Keep them fast and free of side effects.

## Common Mistakes

- **Missing `@Retention(RUNTIME)`.** The annotation exists in the source but the engine cannot see it, and nothing is validated.
- **Missing `message`, `groups` or `payload`.** The engine refuses to load the constraint.
- **Returning false for null.** Then an optional field can never be empty. Return true for null and add `@NotNull` where the field is required.
- **Forgetting `@Valid`.** As with built-in rules, custom ones run only when the controller parameter has `@Valid`.
- **One giant annotation.** A rule that checks five different things gives confusing messages. Write small annotations and combine them.

## Interview Questions

**What are the steps to create a custom validation annotation?**
Create an annotation marked with `@Constraint`, giving `message`, `groups` and `payload`. Create a class that implements `ConstraintValidator` with an `isValid` method. Then put the annotation on a field or class and use `@Valid`.

**How do you validate two fields together?**
Make a class-level annotation. Its validator receives the whole object and can compare the fields.

**Can a validator use Spring beans?**
Yes. Spring creates validator classes through its own factory, so you can inject a bean through the constructor. The practice section checks an email against a registry bean.

**Why should a validator return true for null?**
It keeps each annotation focused. Whether a value is required is decided by `@NotNull`, and the custom annotation only checks the format.

## Key Points to Remember

- A custom validation annotation is an annotation plus a validator class.
- The annotation needs `@Constraint`, `@Target`, `@Retention(RUNTIME)`, `message`, `groups` and `payload`.
- The validator implements `ConstraintValidator` and puts the logic in `isValid`.
- Class-level annotations can compare several fields.
- Return true for null and leave required-checks to `@NotNull`.
- Validators can receive Spring beans through the constructor.

## Frequently Asked Questions

### How do I create a custom validation annotation in Spring Boot?

Define the annotation with `@Constraint(validatedBy = ...)`, write a validator class with `isValid`, and place the annotation on a field. Add `@Valid` on the controller parameter.

### Can I show a different message for each use?

Yes. The `message` you give when using the annotation replaces the default one, for example `@IndianPincode(message = "Bad pincode")`.

### How do I compare two fields, such as password and confirm password?

Use a class-level annotation like `@ValidStay`, and inside the validator compare both values.

### Why is my custom annotation ignored?

Check three things: `@Retention(RUNTIME)` is present, the parameter has `@Valid`, and the validation starter is in your `pom.xml`.

## Related Topics

- [Bean Validation](/learning/spring-boot-tutorial/bean-validation): learn the built-in annotations first.
- [@ControllerAdvice and @ExceptionHandler](/learning/spring-boot-tutorial/controller-advice-and-exception-handler): return validation errors in one shared place.
- [Standard API Error Response](/learning/spring-boot-tutorial/standard-api-error-response): shape the JSON that carries your messages.
- [DTO Pattern](/learning/spring-boot-tutorial/dto-pattern): keep rules on request classes.
