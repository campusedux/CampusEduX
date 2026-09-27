Try each problem on your own first. Both use the same springdoc starter and version as the StayWell example, so the `pom.xml` shows it again.

### Easy: Documented Show List

StarPlex Cinema has `GET /shows`, which returns a list of shows (title and start time). Add Swagger documentation so the page shows the API title `StarPlex Shows API`, a tag named `Shows`, and the summary `List today's shows` for the endpoint. Check `/v3/api-docs` for them.

> **Hint:** Add the `OpenAPI` bean with an `Info` title. Put `@Tag(name = "Shows")` on the controller and `@Operation(summary = ...)` on the method.

**Answer:** The starter documents the endpoint by itself. The bean, the tag and the summary only add readable names.

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

    <groupId>com.starplex</groupId>
    <artifactId>shows</artifactId>
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
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>3.1.1</version>
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

**File:** `ShowsApplication.java` in package `com.starplex.shows`

```java
package com.starplex.shows;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ShowsApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShowsApplication.class, args);
    }

    @Bean
    OpenAPI showsApi() {
        return new OpenAPI().info(new Info().title("StarPlex Shows API").version("1.0"));
    }
}
```

**File:** `ShowController.java` in package `com.starplex.shows`

```java
package com.starplex.shows;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Shows")
public class ShowController {

    record Show(String title, String startsAt) {}

    @Operation(summary = "List today's shows")
    @GetMapping("/shows")
    public List<Show> shows() {
        return List.of(new Show("Monsoon Express", "18:30"), new Show("Chai at Midnight", "21:00"));
    }
}
```

**Output:**

```text
title: StarPlex Shows API
tag: Shows
GET /shows
  summary: List today's shows
  responses: 200
schemas: Show
```

This is a short summary read from the JSON that `/v3/api-docs` returns.

### Medium: Bakery Orders with an Error Shape and a Hidden Endpoint

Golden Crust Bakery has `POST /orders` (returns `201` with the order, or `400` with an error body `{"message": "..."}`) and an internal `POST /internal/reset` used by staff scripts. Document the `400` with its error shape, and make sure the internal endpoint does not appear in the documentation.

> **Hint:** Use `@ApiResponse(responseCode = "400", content = @Content(schema = @Schema(implementation = ErrorBody.class)))` for the error, and `@Hidden` on the internal method.

**Answer:** `@ApiResponse` with a schema puts the `ErrorBody` shape into the file. `@Hidden` removes the internal endpoint, so it is not listed, although it still works when called.

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

    <groupId>com.goldencrust</groupId>
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
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>3.1.1</version>
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

**File:** `OrdersApplication.java` in package `com.goldencrust.orders`

```java
package com.goldencrust.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }
}
```

**File:** `ErrorBody.java` in package `com.goldencrust.orders`

```java
package com.goldencrust.orders;

public record ErrorBody(String message) {}
```

**File:** `OrderController.java` in package `com.goldencrust.orders`

```java
package com.goldencrust.orders;

import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {

    record Order(String item, int quantity) {}

    @Operation(summary = "Place an order")
    @ApiResponse(responseCode = "201", description = "Order placed")
    @ApiResponse(responseCode = "400", description = "Invalid order",
        content = @Content(schema = @Schema(implementation = ErrorBody.class)))
    @PostMapping("/orders")
    public ResponseEntity<?> place(@RequestBody Order order) {
        if (order.quantity() <= 0) {
            return ResponseEntity.badRequest().body(new ErrorBody("Quantity must be positive"));
        }
        return ResponseEntity.status(201).body(order);
    }

    @Hidden
    @PostMapping("/internal/reset")
    public String reset() {
        return "reset done";
    }
}
```

**Output:**

```text
POST /orders
  summary: Place an order
  responses: 201, 400
schemas: Order, ErrorBody
/internal/reset: not listed
```

This is a short summary read from the JSON that `/v3/api-docs` returns. The hidden endpoint is missing from it.
