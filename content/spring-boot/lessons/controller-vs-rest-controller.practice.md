Try each problem on your own first. Both use the same `pom.xml` as the Golden Crust example; only change the `groupId` and `artifactId`.

### Easy: Riverside Library Notice Board

Riverside Library wants two endpoints. `GET /notice` returns the plain text `Library closes at 8 PM today.` and must be written inside a class marked `@Controller`. `GET /api/timings` returns JSON with the `day` and `opensAt` values for Monday (`09:00`) and Sunday (`10:00`) from a `@RestController`.

> **Hint:** A `@Controller` method returns a view name by default. Add `@ResponseBody` to the notice method so the text is sent as the response.

**Answer:** The notice method needs `@ResponseBody`, while the API class gets the same behaviour from `@RestController`.

**File:** `LibraryApplication.java` in package `com.riverside.library`

```java
package com.riverside.library;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

**File:** `NoticeController.java` in package `com.riverside.library`

```java
package com.riverside.library;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class NoticeController {

    @GetMapping("/notice")
    @ResponseBody
    public String notice() {
        return "Library closes at 8 PM today.";
    }
}
```

**File:** `TimingsController.java` in package `com.riverside.library`

```java
package com.riverside.library;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TimingsController {

    record Timing(String day, String opensAt) {}

    @GetMapping("/api/timings")
    public List<Timing> timings() {
        return List.of(
                new Timing("Monday", "09:00"),
                new Timing("Sunday", "10:00"));
    }
}
```

Run `mvn spring-boot:run`. Then `curl http://localhost:8080/notice` prints the notice line, and the timings call prints:

```json
[
  {
    "day": "Monday",
    "opensAt": "09:00"
  },
  {
    "day": "Sunday",
    "opensAt": "10:00"
  }
]
```

curl prints the JSON on one line; it is spaced out here so it is easy to read.

### Medium: StayWell Hotel Redirect and Forward

StayWell Hotel has an old address `/lobby` that must send guests to the new address `/rooms`. Build:

- `GET /lobby` in a `@Controller` redirects to `/rooms`.
- `GET /rooms` in a `@RestController` returns two rooms as JSON: `101` (`Deluxe`, 4500 rupees) and `202` (`Suite`, 8200 rupees), with the keys `number`, `type` and `priceInRupees`.
- `GET /welcome` in a `@Controller` forwards to a static page `welcome.html` that shows the heading `Welcome to StayWell`.

> **Hint:** Return `"redirect:/rooms"` for the redirect and `"forward:/welcome.html"` for the forward. The static file goes in `src/main/resources/static`.

**Answer:** A redirect answers `302` and asks the browser to call `/rooms`, while the forward keeps the address and serves the file from inside the server.

**File:** `StaywellApplication.java` in package `com.staywell.hotel`

```java
package com.staywell.hotel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StaywellApplication {

    public static void main(String[] args) {
        SpringApplication.run(StaywellApplication.class, args);
    }
}
```

**File:** `LobbyController.java` in package `com.staywell.hotel`

```java
package com.staywell.hotel;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LobbyController {

    @GetMapping("/lobby")
    public String oldAddress() {
        return "redirect:/rooms";
    }

    @GetMapping("/welcome")
    public String welcome() {
        return "forward:/welcome.html";
    }
}
```

**File:** `RoomController.java` in package `com.staywell.hotel`

```java
package com.staywell.hotel;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RoomController {

    record Room(int number, String type, int priceInRupees) {}

    @GetMapping("/rooms")
    public List<Room> rooms() {
        return List.of(
                new Room(101, "Deluxe", 4500),
                new Room(202, "Suite", 8200));
    }
}
```

**File:** `welcome.html` in `src/main/resources/static`

```html
<!DOCTYPE html>
<html>
<head><title>StayWell Hotel</title></head>
<body>
  <h1>Welcome to StayWell</h1>
</body>
</html>
```

Calling the old address with curl and its redirect flag shows the status and the new place:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}" http://localhost:8080/lobby
```

It prints `302 http://localhost:8080/rooms`, where the second part is the address the browser is sent to.
