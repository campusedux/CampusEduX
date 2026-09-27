Try each problem on your own first. Both use the web starter and the validation starter.

### Easy: CinePoint Seat Booking

CinePoint accepts `POST /bookings` with `movie` and `seats`. The movie must not be blank, and seats must be from 1 to 6. On a broken rule, reply 400 with the first message as plain text. Otherwise reply 201 with `<n> seats booked for <movie>`.

> **Hint:** Add a `BindingResult` parameter right after the `@Valid` one. Spring then does not throw an exception, and you can look at `result.getFieldErrors()` yourself.

**Answer:** The rules live on the record. The `BindingResult` after `@Valid @RequestBody` keeps control in the method, so we build the 400 reply by hand.

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

    <groupId>com.cinepoint</groupId>
    <artifactId>seats</artifactId>
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

**File:** `SeatsApplication.java` in package `com.cinepoint.seats`

```java
package com.cinepoint.seats;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SeatsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SeatsApplication.class, args);
    }
}
```

**File:** `BookingRequest.java` in package `com.cinepoint.seats`

```java
package com.cinepoint.seats;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record BookingRequest(
        @NotBlank(message = "Movie name is required") String movie,
        @Min(value = 1, message = "Book at least 1 seat")
        @Max(value = 6, message = "You can book at most 6 seats") int seats) {
}
```

**File:** `BookingController.java` in package `com.cinepoint.seats`

```java
package com.cinepoint.seats;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookingController {

    @PostMapping("/bookings")
    public ResponseEntity<String> book(@Valid @RequestBody BookingRequest request, BindingResult result) {
        if (result.hasErrors()) {
            String message = result.getFieldErrors().get(0).getDefaultMessage();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(request.seats() + " seats booked for " + request.movie());
    }
}
```

Sending nine seats:

```bash
curl -X POST localhost:8080/bookings \
  -H "Content-Type: application/json" \
  -d '{"movie":"Monsoon Express","seats":9}'
```

prints the message, with status 400:

```bash
You can book at most 6 seats [400]
```

### Medium: SweetOven Cake Order with Nested Lines

A bakery order has a customer name and a list of lines, and each line has a cake name and a quantity. Rules: the customer is required, the list has at least one line, every cake name is required and every quantity is positive. A bad request must return 400 with a map from field path, such as `lines[0].quantity`, to message. Also reject an order id that is zero or negative in `GET /orders/{id}`.

> **Hint:** Write `List<@Valid Line>` so that every line is checked. Add `@Positive` on the path variable. Collect errors in a `TreeMap` so the order in the reply is steady.

**Answer:** Nested checks only run when the nested type is marked with `@Valid`. The field path in each error tells the client exactly which line is wrong.

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

    <groupId>com.sweetoven</groupId>
    <artifactId>orders</artifactId>
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

**File:** `OrdersApplication.java` in package `com.sweetoven.orders`

```java
package com.sweetoven.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }
}
```

**File:** `CakeOrder.java` in package `com.sweetoven.orders`

```java
package com.sweetoven.orders;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;

public record CakeOrder(
        @NotBlank(message = "Customer name is required") String customer,
        @NotEmpty(message = "Add at least one cake") List<@Valid Line> lines) {

    public record Line(
            @NotBlank(message = "Cake name is required") String cake,
            @Positive(message = "Quantity must be positive") int quantity) {
    }
}
```

**File:** `OrderController.java` in package `com.sweetoven.orders`

```java
package com.sweetoven.orders;

import java.util.Map;
import java.util.TreeMap;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public String place(@Valid @RequestBody CakeOrder order) {
        return "Order for " + order.customer() + " has " + order.lines().size() + " line(s)";
    }

    @GetMapping("/orders/{id}")
    public String find(@PathVariable @Positive long id) {
        return "Order " + id;
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

Posting an order with a blank customer, a zero quantity and a blank cake name returns:

```json
{
  "customer": "Customer name is required",
  "lines[0].quantity": "Quantity must be positive",
  "lines[1].cake": "Cake name is required"
}
```

The JSON is spaced out here. A request to `/orders/-5` returns status 400.
