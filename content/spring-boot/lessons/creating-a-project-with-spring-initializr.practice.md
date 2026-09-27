Try each problem on your own first. Generate the projects with Initializr (the website or curl), then add the code.

### Easy: Sunrise Clinic Status Endpoint

Sunrise Clinic wants a service called `appointments`. Generate a Maven project with Group `com.sunriseclinic`, Artifact `appointments`, Java 21 and Spring Web. Then add `GET /status` that returns this plain text: `Sunrise Clinic appointments service is running`.

> **Hint:** Use the curl command from this topic and change `groupId` and `artifactId`. The main class will be `AppointmentsApplication` in `com.sunriseclinic.appointments`; put your controller in the same package.

**Answer:** Generate the project, add one `@RestController` next to the main class, and return a `String` from a `@GetMapping("/status")` method.

```bash
curl https://start.spring.io/starter.zip \
  -d type=maven-project -d javaVersion=21 \
  -d groupId=com.sunriseclinic -d artifactId=appointments \
  -d dependencies=web -o appointments.zip
```

**File:** `AppointmentsApplication.java` in package `com.sunriseclinic.appointments`

```java
package com.sunriseclinic.appointments;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AppointmentsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AppointmentsApplication.class, args);
    }
}
```

**File:** `StatusController.java` in package `com.sunriseclinic.appointments`

```java
package com.sunriseclinic.appointments;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StatusController {

    @GetMapping("/status")
    public String status() {
        return "Sunrise Clinic appointments service is running";
    }
}
```

Run `./mvnw spring-boot:run`; then `curl http://localhost:8080/status` prints the status line.

### Medium: ShopKart Products and Orders

Generate a project with Group `com.shopkart` and Artifact `store` (Spring Web, Java 21). Keep each feature in its own sub-package:

- `com.shopkart.store.products` has `GET /products`, returning the product names Wireless Mouse, USB-C Cable and Laptop Stand as a JSON array.
- `com.shopkart.store.orders` has `GET /orders/count`, returning the number `3`.

> **Hint:** Sub-packages of `com.shopkart.store` are scanned automatically, because the main class sits in `com.shopkart.store`. Returning a `List<String>` gives a JSON array, and returning an `int` gives a plain number.

**Answer:** Create two packages under the main package, one controller in each. No extra configuration is needed.

**File:** `StoreApplication.java` in package `com.shopkart.store`

```java
package com.shopkart.store;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(StoreApplication.class, args);
    }
}
```

**File:** `ProductController.java` in package `com.shopkart.store.products`

```java
package com.shopkart.store.products;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductController {

    @GetMapping("/products")
    public List<String> products() {
        return List.of("Wireless Mouse", "USB-C Cable", "Laptop Stand");
    }
}
```

**File:** `OrderController.java` in package `com.shopkart.store.orders`

```java
package com.shopkart.store.orders;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {

    @GetMapping("/orders/count")
    public int orderCount() {
        return 3;
    }
}
```

Calling `/products` prints the three names as a JSON array, and `/orders/count` prints `3`.
