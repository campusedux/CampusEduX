Try each problem on your own first. Both use the same `pom.xml` as the Starlight example; only change the `groupId` and `artifactId`.

### Easy: Parcel Tracking

SwiftPost wants `GET /parcels/{code}`. For code `SP101` it returns 200 with JSON holding `code` and `status` (`Out for delivery`). For code `SP202` it returns 200 with status `Delivered`. Any other code returns 404 with an empty body.

> **Hint:** Return `ResponseEntity<Parcel>`. Use `ResponseEntity.ok(parcel)` when the map has the code, and `notFound().build()` when it does not.

**Answer:** One method returns two different answers, and both are the same `ResponseEntity<Parcel>` type.

**File:** `SwiftApplication.java` in package `com.swiftpost.tracking`

```java
package com.swiftpost.tracking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SwiftApplication {

    public static void main(String[] args) {
        SpringApplication.run(SwiftApplication.class, args);
    }
}
```

**File:** `ParcelController.java` in package `com.swiftpost.tracking`

```java
package com.swiftpost.tracking;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ParcelController {

    record Parcel(String code, String status) {}

    private final Map<String, Parcel> parcels = Map.of(
            "SP101", new Parcel("SP101", "Out for delivery"),
            "SP202", new Parcel("SP202", "Delivered"));

    @GetMapping("/parcels/{code}")
    public ResponseEntity<Parcel> track(@PathVariable String code) {
        Parcel parcel = parcels.get(code);
        if (parcel == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(parcel);
    }
}
```

Tracking a known parcel, then an unknown one:

```bash
curl localhost:8080/parcels/SP101
curl -s -o /dev/null -w "%{http_code}" localhost:8080/parcels/SP999
```

The first prints the JSON below, spaced out, and the second prints `404`:

```json
{
  "code": "SP101",
  "status": "Out for delivery"
}
```

### Medium: Library Loans with Location and Header

CityLibrary lends books through `POST /loans`. The body has `member` and `title`. Build:

- A new loan returns `201`, a `Location` header of `/loans/<id>`, a custom header `X-Due-In-Days: 14`, and the loan as JSON.
- If the same title is already on loan, return `409` with a JSON message.
- `GET /loans/{id}` returns the loan or `404`.

> **Hint:** Chain `created(uri)`, then `header(...)`, then `body(loan)`. Check for a clash with `anyMatch` on the stored loans. Return `ResponseEntity<?>` from the POST method, since the body type differs.

**Answer:** The builder chain sets the status, the `Location`, the custom header and the body in one expression. The conflict case uses `status(HttpStatus.CONFLICT)`.

**File:** `LoansApplication.java` in package `com.citylibrary.loans`

```java
package com.citylibrary.loans;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LoansApplication {

    public static void main(String[] args) {
        SpringApplication.run(LoansApplication.class, args);
    }
}
```

**File:** `LoanController.java` in package `com.citylibrary.loans`

```java
package com.citylibrary.loans;

import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/loans")
public class LoanController {

    record Loan(int id, String member, String title) {}
    record LoanRequest(String member, String title) {}
    record Message(String text) {}

    private final Map<Integer, Loan> loans = new ConcurrentHashMap<>();
    private final AtomicInteger nextId = new AtomicInteger(1);

    @PostMapping
    public ResponseEntity<?> lend(@RequestBody LoanRequest request) {
        boolean onLoan = loans.values().stream()
                .anyMatch(l -> l.title().equals(request.title()));
        if (onLoan) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new Message("Book is already on loan"));
        }
        Loan loan = new Loan(nextId.getAndIncrement(), request.member(), request.title());
        loans.put(loan.id(), loan);
        return ResponseEntity.created(URI.create("/loans/" + loan.id()))
                .header("X-Due-In-Days", "14")
                .body(loan);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Loan> one(@PathVariable int id) {
        Loan loan = loans.get(id);
        return loan == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(loan);
    }
}
```

Lending a book and reading only the interesting lines of the reply:

```bash
curl -si -X POST localhost:8080/loans \
  -H "Content-Type: application/json" \
  -d '{"member":"Asha","title":"Salt and Stars"}' \
  | grep -E "^(HTTP|Location|X-Due)"
```

It prints:

```text
HTTP/1.1 201
Location: /loans/1
X-Due-In-Days: 14
```
