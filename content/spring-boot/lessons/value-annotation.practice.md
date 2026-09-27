Try each problem on your own first. Both use the same `pom.xml` as the GreenLeaf code above; only change the `groupId` and `artifactId`.

### Easy: Cinema Notice Board

Star Talkies wants a `GET /board` endpoint that returns one line of text. The cinema name and the number of screens come from `application.properties`. The late show time is optional: when the key `cinema.late-show` is missing, show `10:30 PM`.

> **Hint:** Use `@Value` on constructor parameters. Put the fallback after a colon inside the placeholder.

**Answer:** Two keys are in the file, and the third is missing on purpose, so the default in the placeholder is used.

**File:** `application.properties` in `src/main/resources`

```properties
cinema.name=Star Talkies
cinema.screens=4
```

**File:** `BoardApplication.java` in package `com.startalkies.board`

```java
package com.startalkies.board;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BoardApplication {

    public static void main(String[] args) {
        SpringApplication.run(BoardApplication.class, args);
    }
}
```

**File:** `BoardController.java` in package `com.startalkies.board`

```java
package com.startalkies.board;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BoardController {

    private final String line;

    public BoardController(
            @Value("${cinema.name}") String name,
            @Value("${cinema.screens}") int screens,
            @Value("${cinema.late-show:10:30 PM}") String lateShow) {
        this.line = name + ", " + screens + " screens, " + lateShow;
    }

    @GetMapping("/board")
    public String board() {
        return line;
    }
}
```

`curl http://localhost:8080/board` prints:

```text
Star Talkies, 4 screens, 10:30 PM
```

### Medium: Weekend Price and Snack Count

Star Talkies charges the normal ticket price on weekdays and adds a surcharge on weekends. Keep `cinema.ticket-price=200`, `cinema.weekend-surcharge=50` and `cinema.snacks=Popcorn, Nachos, Samosa` in the file. Build `GET /prices` that returns the weekday price, the weekend price (calculated, not typed) and the number of snacks on the menu.

> **Hint:** Use `#{...}` with a placeholder inside for the weekend price. For the snack count, inject the comma separated line as a `List<String>` and call `size()`.

**Answer:** The weekend price is a SpEL sum of two placeholders. Spring splits the snack line at the commas and trims the spaces, so the list has three items.

**File:** `application.properties` in `src/main/resources`

```properties
cinema.ticket-price=200
cinema.weekend-surcharge=50
cinema.snacks=Popcorn, Nachos, Samosa
```

**File:** `PricesApplication.java` in package `com.startalkies.prices`

```java
package com.startalkies.prices;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PricesApplication {

    public static void main(String[] args) {
        SpringApplication.run(PricesApplication.class, args);
    }
}
```

**File:** `PricesController.java` in package `com.startalkies.prices`

```java
package com.startalkies.prices;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PricesController {

    record Prices(int weekday, int weekend, int snackCount, List<String> snacks) {}

    private final Prices prices;

    public PricesController(
            @Value("${cinema.ticket-price}") int weekday,
            @Value("#{${cinema.ticket-price} + ${cinema.weekend-surcharge}}") int weekend,
            @Value("${cinema.snacks}") List<String> snacks) {
        this.prices = new Prices(weekday, weekend, snacks.size(), snacks);
    }

    @GetMapping("/prices")
    public Prices prices() {
        return prices;
    }
}
```

`curl http://localhost:8080/prices` prints:

```json
{
  "weekday": 200,
  "weekend": 250,
  "snackCount": 3,
  "snacks": ["Popcorn", "Nachos", "Samosa"]
}
```

curl prints the JSON on one line; it is spaced out here for reading.
