Try each problem on your own first. Both use the same `pom.xml` as the QuickCab example; only change the `groupId` and `artifactId`.

### Easy: Ticket Counter Statuses

FunPark sells tickets. Build `POST /tickets` that accepts `{"visitor":"Asha","count":2}`. It must answer `201` with the ticket as JSON. Then build `DELETE /tickets/{id}` that answers `204`, whatever the id is.

> **Hint:** Put `@ResponseStatus` on both methods, with `HttpStatus.CREATED` and `HttpStatus.NO_CONTENT`. The delete method can return `void`.

**Answer:** The status is fixed per method, so `@ResponseStatus` is enough here.

**File:** `FunparkApplication.java` in package `com.funpark.tickets`

```java
package com.funpark.tickets;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FunparkApplication {

    public static void main(String[] args) {
        SpringApplication.run(FunparkApplication.class, args);
    }
}
```

**File:** `TicketController.java` in package `com.funpark.tickets`

```java
package com.funpark.tickets;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TicketController {

    record TicketRequest(String visitor, int count) {}
    record Ticket(int id, String visitor, int count) {}

    private final AtomicInteger nextId = new AtomicInteger(1);

    @PostMapping("/tickets")
    @ResponseStatus(HttpStatus.CREATED)
    public Ticket buy(@RequestBody TicketRequest request) {
        return new Ticket(nextId.getAndIncrement(), request.visitor(), request.count());
    }

    @DeleteMapping("/tickets/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable int id) {
    }
}
```

Buying tickets prints the JSON below with status 201:

```bash
curl -X POST localhost:8080/tickets \
  -H "Content-Type: application/json" \
  -d '{"visitor":"Asha","count":2}'
```

```json
{
  "id": 1,
  "visitor": "Asha",
  "count": 2
}
```

### Medium: Pharmacy Stock with Advice

MediPlus keeps stock counts. Build `POST /stock/{item}/sell?qty=N` on a map that starts with `Paracetamol=10`. Rules:

- Unknown item throws an `ItemNotFoundException`, answered `404`.
- `qty` of 0 or less throws `BadQuantityException`, answered `400`.
- `qty` above the stock throws `OutOfStockException`, answered `409`.
- Otherwise reduce the stock and return `{"item":..., "left":...}` with 200.

Use a `@RestControllerAdvice` class, with one handler per exception, returning `{"message": ...}`. Do not add a catch-all handler.

> **Hint:** Give each exception a message, and let each handler return `ResponseEntity.status(...)` with a small record body.

**Answer:** Three specific handlers keep the codes exact, and because there is no catch-all, Spring still chooses codes like 405 on its own.

**File:** `StockApplication.java` in package `com.mediplus.stock`

```java
package com.mediplus.stock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StockApplication {

    public static void main(String[] args) {
        SpringApplication.run(StockApplication.class, args);
    }
}
```

**File:** `StockErrors.java` in package `com.mediplus.stock`

```java
package com.mediplus.stock;

public class StockErrors {

    public static class ItemNotFoundException extends RuntimeException {
        public ItemNotFoundException(String item) {
            super("No such item: " + item);
        }
    }

    public static class BadQuantityException extends RuntimeException {
        public BadQuantityException() {
            super("Quantity must be at least 1");
        }
    }

    public static class OutOfStockException extends RuntimeException {
        public OutOfStockException(int left) {
            super("Only " + left + " left");
        }
    }
}
```

**File:** `StockAdvice.java` in package `com.mediplus.stock`

```java
package com.mediplus.stock;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class StockAdvice {

    record Problem(String message) {}

    @ExceptionHandler(StockErrors.ItemNotFoundException.class)
    public ResponseEntity<Problem> notFound(StockErrors.ItemNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new Problem(e.getMessage()));
    }

    @ExceptionHandler(StockErrors.BadQuantityException.class)
    public ResponseEntity<Problem> bad(StockErrors.BadQuantityException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new Problem(e.getMessage()));
    }

    @ExceptionHandler(StockErrors.OutOfStockException.class)
    public ResponseEntity<Problem> out(StockErrors.OutOfStockException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new Problem(e.getMessage()));
    }
}
```

**File:** `StockController.java` in package `com.mediplus.stock`

```java
package com.mediplus.stock;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StockController {

    record Sale(String item, int left) {}

    private final Map<String, Integer> stock = new ConcurrentHashMap<>(Map.of("Paracetamol", 10));

    @PostMapping("/stock/{item}/sell")
    public Sale sell(@PathVariable String item, @RequestParam int qty) {
        Integer have = stock.get(item);
        if (have == null) {
            throw new StockErrors.ItemNotFoundException(item);
        }
        if (qty <= 0) {
            throw new StockErrors.BadQuantityException();
        }
        if (qty > have) {
            throw new StockErrors.OutOfStockException(have);
        }
        stock.put(item, have - qty);
        return new Sale(item, have - qty);
    }
}
```

Selling 4 strips, then asking for 20 more:

```bash
curl -s -w " %{http_code}\n" -X POST "localhost:8080/stock/Paracetamol/sell?qty=4"
curl -s -w " %{http_code}\n" -X POST "localhost:8080/stock/Paracetamol/sell?qty=20"
```

The first shows 6 left with status 200. The second shows the message below with status 409:

```json
{
  "message": "Only 6 left"
}
```
