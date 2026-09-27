Try each problem on your own first. Both projects use the same `pom.xml` shape as the appointment code above, with the web, validation and web test starters, so each brings its own copy.

### Easy: Cake Price Lookup

SweetCrumbs has `GET /cakes/{name}` that returns the price as JSON with `name` and `price`. A `CakeService` provides `Cake find(String name)`. Write a `@WebMvcTest` that mocks the service to return Black Forest at 550 and checks the status and both JSON fields.

> **Hint:** Add a `@MockitoBean` for the service, stub `find("blackforest")`, and use two `jsonPath` checks.

**Answer:** The controller returns the record from the mocked service, and `jsonPath` reads each field.

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

    <groupId>com.sweetcrumbs</groupId>
    <artifactId>cakes</artifactId>
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
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc-test</artifactId>
            <scope>test</scope>
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

**File:** `CakesApplication.java` in package `com.crumbs.cakes`

```java
package com.crumbs.cakes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CakesApplication {

    public static void main(String[] args) {
        SpringApplication.run(CakesApplication.class, args);
    }
}
```

**File:** `Cake.java` in package `com.crumbs.cakes`

```java
package com.crumbs.cakes;

public record Cake(String name, int price) {}
```

**File:** `CakeService.java` in package `com.crumbs.cakes`

```java
package com.crumbs.cakes;

import org.springframework.stereotype.Service;

@Service
public class CakeService {

    public Cake find(String name) {
        return new Cake(name, 500);
    }
}
```

**File:** `CakeController.java` in package `com.crumbs.cakes`

```java
package com.crumbs.cakes;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CakeController {

    private final CakeService service;

    public CakeController(CakeService service) {
        this.service = service;
    }

    @GetMapping("/cakes/{name}")
    public Cake cake(@PathVariable String name) {
        return service.find(name);
    }
}
```

**File:** `CakeControllerTest.java` in `src/test/java/com/crumbs/cakes`

```java
package com.crumbs.cakes;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CakeController.class)
class CakeControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private CakeService service;

    @Test
    void returnsTheCakeAsJson() throws Exception {
        when(service.find("blackforest")).thenReturn(new Cake("Black Forest", 550));

        mvc.perform(get("/cakes/blackforest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Black Forest"))
                .andExpect(jsonPath("$.price").value(550));
    }
}
```

Run `./mvnw test`. Maven reports (the counts are split over lines here):

```text
Tests run: 1
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```

### Medium: Tiffin Orders with Validation

TiffinBox accepts `POST /orders` with JSON `{"dish":"Thali","quantity":2}`. The dish must not be blank and the quantity must be at least 1. A valid order returns 201 with the order id from `OrderService.place(dish, quantity)`. Write tests for a valid order, a quantity of 0 (400), and check that the service is never called for the invalid one.

> **Hint:** Use `@Valid` on the request, `@NotBlank` and `@Min(1)` on the record. In the invalid test, use `verifyNoInteractions(service)`.

**Answer:** Validation rejects the bad request before the controller body runs, so the mock service sees no call.

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
    <artifactId>tiffin</artifactId>
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
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc-test</artifactId>
            <scope>test</scope>
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

**File:** `TiffinApplication.java` in package `com.tiffin.box`

```java
package com.tiffin.box;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TiffinApplication {

    public static void main(String[] args) {
        SpringApplication.run(TiffinApplication.class, args);
    }
}
```

**File:** `OrderService.java` in package `com.tiffin.box`

```java
package com.tiffin.box;

import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Service;

@Service
public class OrderService {

    private final AtomicLong ids = new AtomicLong(500);

    public long place(String dish, int quantity) {
        return ids.incrementAndGet();
    }
}
```

**File:** `OrderController.java` in package `com.tiffin.box`

```java
package com.tiffin.box;

import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {

    record OrderRequest(@NotBlank String dish, @Min(1) int quantity) {}

    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @PostMapping("/orders")
    public ResponseEntity<Map<String, Long>> place(@Valid @RequestBody OrderRequest request) {
        long id = service.place(request.dish(), request.quantity());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("orderId", id));
    }
}
```

**File:** `OrderControllerTest.java` in `src/test/java/com/tiffin/box`

```java
package com.tiffin.box;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private OrderService service;

    @Test
    void validOrderIsCreated() throws Exception {
        when(service.place("Thali", 2)).thenReturn(501L);

        mvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dish\":\"Thali\",\"quantity\":2}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value(501));
    }

    @Test
    void zeroQuantityIsRejected() throws Exception {
        mvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dish\":\"Thali\",\"quantity\":0}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(service);
    }
}
```

Run `./mvnw test`. Maven reports (the counts are split over lines here):

```text
Tests run: 2
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```
