Try each problem on your own first. Both use the same `pom.xml` as the MediPlus example; only change the `groupId` and `artifactId`.

### Easy: Swim Club Registration

BlueWave Swim Club puts new swimmers in a batch by age. Build `POST /swimmers` that accepts JSON with `name` and `age`, and replies with `id`, `name` and `batch`. Swimmers under 12 go to `Kids`, all others to `Adults`. Ids start at 1 and count up. Answer with status 201.

> **Hint:** Make a record `SwimmerRequest(String name, int age)` for the body and a record `Registration(int id, String name, String batch)` for the reply. Use an `AtomicInteger` for ids.

**Answer:** `@RequestBody` builds the request record from the JSON. The controller picks the batch and returns a new record, which Jackson writes back as JSON.

**File:** `SwimApplication.java` in package `com.bluewave.swim`

```java
package com.bluewave.swim;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SwimApplication {

    public static void main(String[] args) {
        SpringApplication.run(SwimApplication.class, args);
    }
}
```

**File:** `SwimmerController.java` in package `com.bluewave.swim`

```java
package com.bluewave.swim;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SwimmerController {

    record SwimmerRequest(String name, int age) {}
    record Registration(int id, String name, String batch) {}

    private final AtomicInteger nextId = new AtomicInteger(1);

    @PostMapping("/swimmers")
    @ResponseStatus(HttpStatus.CREATED)
    public Registration register(@RequestBody SwimmerRequest request) {
        String batch = request.age() < 12 ? "Kids" : "Adults";
        return new Registration(nextId.getAndIncrement(), request.name(), batch);
    }
}
```

Registering a nine-year-old:

```bash
curl -X POST localhost:8080/swimmers \
  -H "Content-Type: application/json" \
  -d '{"name":"Riya","age":9}'
```

The reply, spaced out for reading:

```json
{
  "id": 1,
  "name": "Riya",
  "batch": "Kids"
}
```

### Medium: Cloud Kitchen Order with Items

SpiceBox Cloud Kitchen takes orders with several dishes. Build `POST /orders` that accepts:

```json
{"customer":"Kavita","items":[{"dish":"Dal Rice","quantity":2,"price":120}]}
```

It replies with the customer, the number of dishes and the total price (sum of `quantity * price`). Add a second endpoint, `POST /notes`, that takes the raw text body and replies `Note saved (N characters)`.

> **Hint:** Create a nested record `Item(String dish, int quantity, int price)` and put a `List<Item>` inside the order record. For the note, write `@RequestBody String text`.

**Answer:** Nested JSON objects become nested records. A `String` body is passed through as it is, with no conversion.

**File:** `SpiceboxApplication.java` in package `com.spicebox.kitchen`

```java
package com.spicebox.kitchen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SpiceboxApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpiceboxApplication.class, args);
    }
}
```

**File:** `KitchenController.java` in package `com.spicebox.kitchen`

```java
package com.spicebox.kitchen;

import java.util.List;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class KitchenController {

    record Item(String dish, int quantity, int price) {}
    record OrderRequest(String customer, List<Item> items) {}
    record OrderSummary(String customer, int dishes, int total) {}

    @PostMapping("/orders")
    public OrderSummary order(@RequestBody OrderRequest request) {
        int total = request.items().stream()
                .mapToInt(i -> i.quantity() * i.price())
                .sum();
        return new OrderSummary(request.customer(), request.items().size(), total);
    }

    @PostMapping("/notes")
    public String note(@RequestBody String text) {
        return "Note saved (" + text.length() + " characters)";
    }
}
```

Sending an order with two dishes:

```bash
curl -X POST localhost:8080/orders \
  -H "Content-Type: application/json" \
  -d '{"customer":"Kavita","items":[{"dish":"Dal Rice","quantity":2,"price":120},{"dish":"Lassi","quantity":1,"price":60}]}'
```

The reply, spaced out for reading:

```json
{
  "customer": "Kavita",
  "dishes": 2,
  "total": 300
}
```

Sending the note `no onions` as plain text with `curl -X POST localhost:8080/notes -H "Content-Type: text/plain" -d "no onions"` prints `Note saved (9 characters)`.
