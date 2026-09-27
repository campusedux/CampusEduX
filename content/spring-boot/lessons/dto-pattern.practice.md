Try each problem on your own first. Both use the same `pom.xml` as the StayEasy example; only change the `groupId` and `artifactId`.

### Easy: Clinic Patient Card

Sunrise Clinic stores patients as `Patient(id, name, phone, diagnosis)`. Build `GET /patients/{id}` that returns a `PatientCard` DTO with only `id` and `name`. The phone and diagnosis must never appear in the reply. Keep one patient in memory: `1`, Kavita Rao, phone `98xxxxxx01`, diagnosis `Migraine`. An unknown id answers 404.

> **Hint:** Make two records, `Patient` and `PatientCard`. Convert with `new PatientCard(p.id(), p.name())` before returning.

**Answer:** The controller looks up the entity and returns a DTO built from it. The private fields never leave the method.

**File:** `ClinicApplication.java` in package `com.sunrise.clinic`

```java
package com.sunrise.clinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ClinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClinicApplication.class, args);
    }
}
```

**File:** `PatientController.java` in package `com.sunrise.clinic`

```java
package com.sunrise.clinic;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class PatientController {

    record Patient(int id, String name, String phone, String diagnosis) {}
    record PatientCard(int id, String name) {}

    private final Map<Integer, Patient> patients = Map.of(
            1, new Patient(1, "Kavita Rao", "98xxxxxx01", "Migraine"));

    @GetMapping("/patients/{id}")
    public PatientCard card(@PathVariable int id) {
        Patient p = patients.get(id);
        if (p == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such patient");
        }
        return new PatientCard(p.id(), p.name());
    }
}
```

Asking for patient 1 prints:

```json
{
  "id": 1,
  "name": "Kavita Rao"
}
```

### Medium: Bookshop Price with Discount

PageOne Bookshop keeps `Book(id, title, costPrice, sellingPrice)`. Build three DTOs and a mapper:

- `BookRequest(title, sellingPrice)` is what `POST /books` accepts. The cost price is always set by the shop at 60 percent of the selling price.
- `BookResponse(id, title, price, offerPrice)` is what is returned. The offer price is 10 percent off.
- `GET /books/{id}` returns a `BookResponse` too, or 404.

> **Hint:** Put both conversions in a `BookMapper` with static methods. Use integer math: `price * 90 / 100` for the offer and `price * 60 / 100` for the cost.

**Answer:** The client cannot send a cost price or an id. The mapper decides both, and the response holds a calculated offer price that is not stored anywhere.

**File:** `BookshopApplication.java` in package `com.pageone.shop`

```java
package com.pageone.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BookshopApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookshopApplication.class, args);
    }
}
```

**File:** `Book.java` in package `com.pageone.shop`

```java
package com.pageone.shop;

public record Book(int id, String title, int costPrice, int sellingPrice) {}
```

**File:** `BookRequest.java` in package `com.pageone.shop`

```java
package com.pageone.shop;

public record BookRequest(String title, int sellingPrice) {}
```

**File:** `BookResponse.java` in package `com.pageone.shop`

```java
package com.pageone.shop;

public record BookResponse(int id, String title, int price, int offerPrice) {}
```

**File:** `BookMapper.java` in package `com.pageone.shop`

```java
package com.pageone.shop;

public final class BookMapper {

    private BookMapper() {}

    public static Book toEntity(int id, BookRequest request) {
        return new Book(id, request.title(),
                request.sellingPrice() * 60 / 100, request.sellingPrice());
    }

    public static BookResponse toResponse(Book book) {
        return new BookResponse(book.id(), book.title(),
                book.sellingPrice(), book.sellingPrice() * 90 / 100);
    }
}
```

**File:** `BookController.java` in package `com.pageone.shop`

```java
package com.pageone.shop;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/books")
public class BookController {

    private final Map<Integer, Book> store = new ConcurrentHashMap<>();
    private final AtomicInteger nextId = new AtomicInteger(1);

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookResponse add(@RequestBody BookRequest request) {
        Book book = BookMapper.toEntity(nextId.getAndIncrement(), request);
        store.put(book.id(), book);
        return BookMapper.toResponse(book);
    }

    @GetMapping("/{id}")
    public BookResponse one(@PathVariable int id) {
        Book book = store.get(id);
        if (book == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such book");
        }
        return BookMapper.toResponse(book);
    }
}
```

Adding a book that sells at 500 rupees:

```bash
curl -X POST localhost:8080/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Salt and Stars","sellingPrice":500}'
```

The reply, spaced out for reading:

```json
{
  "id": 1,
  "title": "Salt and Stars",
  "price": 500,
  "offerPrice": 450
}
```
