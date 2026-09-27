Try each problem on your own first. Both use the web starter and the validation starter.

### Easy: Wheelo Vehicle Number

Wheelo rents bikes. Create an annotation `@VehicleNumber` that accepts numbers like `MH12AB1234`: two capital letters, two digits, one to three capital letters, then four digits. Use it in `POST /rentals`. A wrong number returns 400 with the message `Use a number like MH12AB1234`.

> **Hint:** Write the annotation and a validator class that implements `ConstraintValidator` for that annotation and `String`, using `String.matches`. Return true for null.

**Answer:** The annotation only carries the message and the link. The regular expression lives in the validator, and a small handler returns the first message.

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

    <groupId>com.wheelo</groupId>
    <artifactId>rentals</artifactId>
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

**File:** `RentalsApplication.java` in package `com.wheelo.rentals`

```java
package com.wheelo.rentals;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RentalsApplication {

    public static void main(String[] args) {
        SpringApplication.run(RentalsApplication.class, args);
    }
}
```

**File:** `VehicleNumber.java` in package `com.wheelo.rentals`

```java
package com.wheelo.rentals;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Constraint(validatedBy = VehicleNumberValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface VehicleNumber {

    String message() default "Use a number like MH12AB1234";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
```

**File:** `VehicleNumberValidator.java` in package `com.wheelo.rentals`

```java
package com.wheelo.rentals;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class VehicleNumberValidator implements ConstraintValidator<VehicleNumber, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || value.matches("[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}");
    }
}
```

**File:** `RentalRequest.java` in package `com.wheelo.rentals`

```java
package com.wheelo.rentals;

import jakarta.validation.constraints.NotBlank;

public record RentalRequest(
        @NotBlank(message = "Rider name is required") String rider,
        @VehicleNumber String vehicleNumber) {
}
```

**File:** `RentalController.java` in package `com.wheelo.rentals`

```java
package com.wheelo.rentals;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RentalController {

    @PostMapping("/rentals")
    @ResponseStatus(HttpStatus.CREATED)
    public String rent(@Valid @RequestBody RentalRequest request) {
        return request.vehicleNumber() + " rented to " + request.rider();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String onInvalid(MethodArgumentNotValidException ex) {
        return ex.getBindingResult().getFieldErrors().get(0).getDefaultMessage();
    }
}
```

Posting `MH12AB1234` gives status 201 and `MH12AB1234 rented to Vikram`. Posting `mh12-1234` gives:

```bash
Use a number like MH12AB1234 [400]
```

### Medium: PagePoint New Member Email

A library app registers members with `POST /members`. The email must be valid and must not already be in the member list. Write `@NewEmail`, whose validator asks a Spring bean, `MemberRegistry`, whether the email exists. The check should ignore letter case. Show errors as a map from field name to message.

> **Hint:** Mark `MemberRegistry` with `@Component` and take it in the validator's constructor. Compare in lower case. Combine `@Email` and `@NewEmail` on the same field.

**Answer:** Spring builds the validator, so constructor injection works. The registry starts with one member, `asha@example.com`, and saves each new email after a successful join.

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

    <groupId>com.pagepoint</groupId>
    <artifactId>members</artifactId>
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

**File:** `MembersApplication.java` in package `com.pagepoint.members`

```java
package com.pagepoint.members;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MembersApplication {

    public static void main(String[] args) {
        SpringApplication.run(MembersApplication.class, args);
    }
}
```

**File:** `MemberRegistry.java` in package `com.pagepoint.members`

```java
package com.pagepoint.members;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class MemberRegistry {

    private final Set<String> emails = ConcurrentHashMap.newKeySet();

    public MemberRegistry() {
        emails.add("asha@example.com");
    }

    public boolean exists(String email) {
        return emails.contains(email.toLowerCase());
    }

    public void add(String email) {
        emails.add(email.toLowerCase());
    }
}
```

**File:** `NewEmail.java` in package `com.pagepoint.members`

```java
package com.pagepoint.members;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Constraint(validatedBy = NewEmailValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface NewEmail {

    String message() default "This email is already registered";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
```

**File:** `NewEmailValidator.java` in package `com.pagepoint.members`

```java
package com.pagepoint.members;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class NewEmailValidator implements ConstraintValidator<NewEmail, String> {

    private final MemberRegistry registry;

    public NewEmailValidator(MemberRegistry registry) {
        this.registry = registry;
    }

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        return email == null || !registry.exists(email);
    }
}
```

**File:** `MemberRequest.java` in package `com.pagepoint.members`

```java
package com.pagepoint.members;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record MemberRequest(
        @NotBlank(message = "Name is required") String name,
        @Email(message = "Email is not valid") @NewEmail String email) {
}
```

**File:** `MemberController.java` in package `com.pagepoint.members`

```java
package com.pagepoint.members;

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
public class MemberController {

    private final MemberRegistry registry;

    public MemberController(MemberRegistry registry) {
        this.registry = registry;
    }

    @PostMapping("/members")
    @ResponseStatus(HttpStatus.CREATED)
    public String join(@Valid @RequestBody MemberRequest request) {
        registry.add(request.email());
        return "Welcome, " + request.name();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> onInvalid(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new TreeMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
        return errors;
    }
}
```

Registering `meera@example.com` works the first time. Registering `ASHA@example.com` fails, and so does a second `meera@example.com`, each with status 400:

```bash
{"email":"This email is already registered"} [400]
```
