Try each problem on your own first. Both use the same `pom.xml` as the FitZone example; only change the `groupId` and `artifactId`.

### Easy: Cinema Prefix

StarPlex Cinema wants every endpoint under `/api/shows`. Build a controller with `@RequestMapping("/api/shows")` on the class. `GET /api/shows` returns the shows `Monsoon Express` and `Night Market`, and `GET /api/shows/count` returns the number of shows as text.

> **Hint:** The first method has no path of its own, so give `@RequestMapping` only `method = RequestMethod.GET`. The second method uses `path = "/count"`.

**Answer:** The class-level path is added in front of each method path, so `/count` becomes `/api/shows/count`.

**File:** `StarplexApplication.java` in package `com.starplex.cinema`

```java
package com.starplex.cinema;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StarplexApplication {

    public static void main(String[] args) {
        SpringApplication.run(StarplexApplication.class, args);
    }
}
```

**File:** `ShowController.java` in package `com.starplex.cinema`

```java
package com.starplex.cinema;

import java.util.List;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shows")
public class ShowController {

    private final List<String> shows = List.of("Monsoon Express", "Night Market");

    @RequestMapping(method = RequestMethod.GET)
    public List<String> all() {
        return shows;
    }

    @RequestMapping(path = "/count", method = RequestMethod.GET)
    public int count() {
        return shows.size();
    }
}
```

Run `mvn spring-boot:run`, then call the two addresses:

```bash
curl http://localhost:8080/api/shows
curl http://localhost:8080/api/shows/count
```

The first prints `["Monsoon Express","Night Market"]` and the second prints `2`.

### Medium: Pharmacy Orders Accept JSON Only

MediPlus Pharmacy has `POST /api/orders/refill`, and it must accept only JSON. Build:

- `GET /api/orders/status` returns the text `Open until 10 PM`.
- `POST /api/orders/refill` accepts only `application/json` and returns `Refill request received`.

Then find what a client gets when it sends the wrong content type, and when it calls `GET` on the refill address.

> **Hint:** Use `consumes = "application/json"` on the refill mapping. The wrong content type gives one status code, and the wrong method gives another. Check both with `curl -s -o /dev/null -w "%{http_code}"`.

**Answer:** The wrong content type is refused with `415`, and a GET on the POST-only path is refused with `405`.

**File:** `MediplusApplication.java` in package `com.mediplus.pharmacy`

```java
package com.mediplus.pharmacy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MediplusApplication {

    public static void main(String[] args) {
        SpringApplication.run(MediplusApplication.class, args);
    }
}
```

**File:** `OrderController.java` in package `com.mediplus.pharmacy`

```java
package com.mediplus.pharmacy;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @RequestMapping(path = "/status", method = RequestMethod.GET)
    public String status() {
        return "Open until 10 PM";
    }

    @RequestMapping(path = "/refill", method = RequestMethod.POST,
            consumes = "application/json")
    public String refill() {
        return "Refill request received";
    }
}
```

With `Content-Type: text/plain` the refill call answers `415`, and a GET on the refill address answers `405`.
