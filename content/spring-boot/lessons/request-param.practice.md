Try each problem on your own first. Both use the same `pom.xml` as the TechMart example; only change the `groupId` and `artifactId`.

### Easy: Library Late Fee

Riverside Library charges a late fee for every day a book is overdue. Build `GET /fees` that needs a `days` parameter and accepts an optional `ratePerDay` that defaults to 2 rupees. It answers with the text `Late fee: 10 rupees` for 5 days at the default rate.

> **Hint:** `days` is required, so use a plain `@RequestParam int days`. For the rate write `@RequestParam(defaultValue = "2") int ratePerDay`.

**Answer:** The required parameter is checked by Spring, and the default fills in when the client skips the rate. The controller only multiplies.

**File:** `FeesApplication.java` in package `com.riverside.fees`

```java
package com.riverside.fees;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FeesApplication {

    public static void main(String[] args) {
        SpringApplication.run(FeesApplication.class, args);
    }
}
```

**File:** `FeeController.java` in package `com.riverside.fees`

```java
package com.riverside.fees;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FeeController {

    @GetMapping("/fees")
    public String fee(@RequestParam int days,
                      @RequestParam(defaultValue = "2") int ratePerDay) {
        return "Late fee: " + (days * ratePerDay) + " rupees";
    }
}
```

Two calls, one with the default rate and one with a rate of 3:

```bash
curl "localhost:8080/fees?days=5"
curl "localhost:8080/fees?days=5&ratePerDay=3"
```

They print `Late fee: 10 rupees` and `Late fee: 15 rupees`. A call without `days` answers `400`.

### Medium: Dish Finder with Optional Filters

FreshBite restaurant has four dishes: Paneer Tikka (veg, 240), Chicken Curry (non-veg, 320), Veg Thali (veg, 180), Fish Fry (non-veg, 350). Build:

- `GET /dishes` with an optional `veg` filter (`true` keeps only vegetarian dishes) and a `sort` parameter that defaults to `name` and can be `price`.
- `GET /debug` that returns every query parameter it received, using a `Map`.

> **Hint:** Use `@RequestParam Optional<Boolean> veg` so a missing value is an empty `Optional`. Pick the sort order with a `Comparator`. The debug endpoint takes `@RequestParam Map<String, String> all`.

**Answer:** `Optional` is a clean way to say "this parameter may be missing", and the `Map` captures whatever names the client sends.

**File:** `FreshbiteApplication.java` in package `com.freshbite.menu`

```java
package com.freshbite.menu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FreshbiteApplication {

    public static void main(String[] args) {
        SpringApplication.run(FreshbiteApplication.class, args);
    }
}
```

**File:** `DishController.java` in package `com.freshbite.menu`

```java
package com.freshbite.menu;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DishController {

    record Dish(String name, boolean veg, int priceInRupees) {}

    private final List<Dish> dishes = List.of(
            new Dish("Paneer Tikka", true, 240),
            new Dish("Chicken Curry", false, 320),
            new Dish("Veg Thali", true, 180),
            new Dish("Fish Fry", false, 350));

    @GetMapping("/dishes")
    public List<Dish> dishes(@RequestParam Optional<Boolean> veg,
                             @RequestParam(defaultValue = "name") String sort) {
        Comparator<Dish> order = sort.equals("price")
                ? Comparator.comparingInt(Dish::priceInRupees)
                : Comparator.comparing(Dish::name);
        return dishes.stream()
                .filter(d -> veg.isEmpty() || d.veg() == veg.get())
                .sorted(order)
                .toList();
    }

    @GetMapping("/debug")
    public Map<String, String> debug(@RequestParam Map<String, String> all) {
        return all;
    }
}
```

Asking for vegetarian dishes sorted by price:

```bash
curl "localhost:8080/dishes?veg=true&sort=price"
```

The reply, spaced out for reading:

```json
[
  {
    "name": "Veg Thali",
    "veg": true,
    "priceInRupees": 180
  },
  {
    "name": "Paneer Tikka",
    "veg": true,
    "priceInRupees": 240
  }
]
```

And the debug call `curl "localhost:8080/debug?a=1&b=2"` prints `{"a":"1","b":"2"}`.
