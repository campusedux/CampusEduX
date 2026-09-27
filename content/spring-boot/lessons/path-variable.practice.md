Try each problem on your own first. Both use the same `pom.xml` as the CityCare example; only change the `groupId` and `artifactId`.

### Easy: City Bus Route Finder

MetroLine runs city buses. Build `GET /routes/{number}` that returns the route as JSON with `number`, `from` and `to`. Keep two routes in memory: `21` from Central Station to Airport, and `45` from Old Market to Lake Garden. An unknown number answers `404`.

> **Hint:** Store the routes in a `Map<Integer, Route>`. Read the number with `@PathVariable int number`, and throw `ResponseStatusException` with `HttpStatus.NOT_FOUND` when the map has no entry.

**Answer:** The slot `{number}` is converted to an `int`. A number like `abc` gives 400 automatically, and a valid but unknown number gives the 404 that we throw ourselves.

**File:** `MetrolineApplication.java` in package `com.metroline.buses`

```java
package com.metroline.buses;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MetrolineApplication {

    public static void main(String[] args) {
        SpringApplication.run(MetrolineApplication.class, args);
    }
}
```

**File:** `RouteController.java` in package `com.metroline.buses`

```java
package com.metroline.buses;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class RouteController {

    record Route(int number, String from, String to) {}

    private final Map<Integer, Route> routes = Map.of(
            21, new Route(21, "Central Station", "Airport"),
            45, new Route(45, "Old Market", "Lake Garden"));

    @GetMapping("/routes/{number}")
    public Route route(@PathVariable int number) {
        Route route = routes.get(number);
        if (route == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such route");
        }
        return route;
    }
}
```

Run `mvn spring-boot:run`, then ask for route 21:

```bash
curl localhost:8080/routes/21
```

The reply, spaced out for reading:

```json
{
  "number": 21,
  "from": "Central Station",
  "to": "Airport"
}
```

### Medium: Cinema Seat Check

StarPlex Cinema wants one address to answer with the text `Seat A12 on screen 2 in Pune is available`. The address pattern is:

```text
GET /cinemas/{city}
    /screens/{screen}
    /seats/{seat}
```

(It is one address, broken into three lines here for narrow screens.) Use these rules:

- `screen` is a number.
- `seat` must be one letter from `A` to `J` followed by one or two digits, checked with a regular expression in the mapping.
- Read the `city` slot into a Java parameter named `town`.

A seat like `Z99` or `12A` must not match any address.

> **Hint:** Write the slot as `{seat:[A-J][0-9]{1,2}}`. For the renamed variable use `@PathVariable("city") String town`.

**Answer:** The regular expression keeps bad seat codes out of the method, and they fall through to a 404. The name inside the annotation links `{city}` to the `town` parameter.

**File:** `SeatApplication.java` in package `com.starplex.seats`

```java
package com.starplex.seats;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SeatApplication {

    public static void main(String[] args) {
        SpringApplication.run(SeatApplication.class, args);
    }
}
```

**File:** `SeatController.java` in package `com.starplex.seats`

```java
package com.starplex.seats;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SeatController {

    @GetMapping("/cinemas/{city}/screens/{screen}/seats/{seat:[A-J][0-9]{1,2}}")
    public String seat(@PathVariable("city") String town,
                       @PathVariable int screen,
                       @PathVariable String seat) {
        return "Seat " + seat + " on screen " + screen
                + " in " + town + " is available";
    }
}
```

Checking a good seat and a bad one:

```bash
curl localhost:8080/cinemas/Pune/screens/2/seats/A12
curl -s -o /dev/null -w "%{http_code}" localhost:8080/cinemas/Pune/screens/2/seats/Z99
```

The first prints `Seat A12 on screen 2 in Pune is available` and the second prints `404`.
