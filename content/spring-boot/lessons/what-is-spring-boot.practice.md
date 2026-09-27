Try each problem on your own first. Both use the same `pom.xml` as the CineGo example; only change the `groupId` and `artifactId`.

### Easy: Hospital Welcome Desk

City Care Hospital wants a tiny service for its reception screen. Build a Spring Boot app where `GET /welcome` returns this plain text: `Welcome to City Care Hospital. OPD opens at 9 AM.`

> **Hint:** You need two classes: a main class with `@SpringBootApplication`, and a class marked `@RestController` with one `@GetMapping` method that returns a `String`.

**Answer:** Put both classes in the same package so component scan finds the controller. A `String` return value is sent back as plain text.

**File:** `DeskApplication.java` in package `com.citycare.desk`

```java
package com.citycare.desk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(DeskApplication.class, args);
    }
}
```

**File:** `WelcomeController.java` in package `com.citycare.desk`

```java
package com.citycare.desk;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WelcomeController {

    @GetMapping("/welcome")
    public String welcome() {
        return "Welcome to City Care Hospital. OPD opens at 9 AM.";
    }
}
```

Run `mvn spring-boot:run`, then `curl http://localhost:8080/welcome` prints the welcome line.

### Medium: TiffinBox Veg Menu on Port 9090

TiffinBox, a small food delivery kitchen, already runs another app on port 8080. Build a menu service that starts on port 9090 and has two endpoints:

- `GET /menu` returns every dish as JSON, with `name`, `priceInRupees` and `veg`.
- `GET /menu/veg` returns only the vegetarian dishes.

Use these dishes: Paneer Butter Masala (220, veg), Chicken Biryani (260, not veg), Masala Dosa (120, veg).

> **Hint:** Change the port in `application.properties`, which lives in `src/main/resources`. Keep the dishes in a `List` of records, and filter it with a stream for the veg endpoint.

**Answer:** One line in `application.properties` moves the server to port 9090. The controller keeps a fixed list of records and filters it with `stream().filter(Dish::veg)`.

**File:** `application.properties` in `src/main/resources`

```properties
spring.application.name=tiffinbox-menu
server.port=9090
```

**File:** `MenuApplication.java` in package `com.tiffinbox.menu`

```java
package com.tiffinbox.menu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MenuApplication {

    public static void main(String[] args) {
        SpringApplication.run(MenuApplication.class, args);
    }
}
```

**File:** `MenuController.java` in package `com.tiffinbox.menu`

```java
package com.tiffinbox.menu;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/menu")
public class MenuController {

    record Dish(String name, int priceInRupees, boolean veg) {}

    private final List<Dish> dishes = List.of(
            new Dish("Paneer Butter Masala", 220, true),
            new Dish("Chicken Biryani", 260, false),
            new Dish("Masala Dosa", 120, true));

    @GetMapping
    public List<Dish> allDishes() {
        return dishes;
    }

    @GetMapping("/veg")
    public List<Dish> vegDishes() {
        return dishes.stream().filter(Dish::veg).toList();
    }
}
```

Calling `curl http://localhost:9090/menu/veg` prints:

```json
[
  {
    "name": "Paneer Butter Masala",
    "priceInRupees": 220,
    "veg": true
  },
  {
    "name": "Masala Dosa",
    "priceInRupees": 120,
    "veg": true
  }
]
```

curl prints the JSON on one line; it is spaced out here so it is easy to read.
