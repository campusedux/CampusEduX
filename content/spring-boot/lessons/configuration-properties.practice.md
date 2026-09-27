Try each problem on your own first. The Easy problem uses the same `pom.xml` as the Sunrise Clinic code above; only change the `groupId` and `artifactId`. The Medium problem brings its own `pom.xml` because it needs the validation starter.

### Easy: Library Rules Record

Lakeview Library keeps `library.max-books=4`, `library.loan-days=14` and `library.fine-per-day=2` in `application.properties`. Bind them to a record with the prefix `library`. Build `GET /rules` that returns the rules and the fine for a book that is 5 days late.

> **Hint:** Create a record with three fields, put `@ConfigurationProperties` on it with the prefix `library`, and add `@ConfigurationPropertiesScan` to the main class. The fine is `finePerDay * 5`.

**Answer:** The record is registered by the scan. The controller multiplies the fine per day by 5.

**File:** `application.properties` in `src/main/resources`

```properties
library.max-books=4
library.loan-days=14
library.fine-per-day=2
```

**File:** `RulesApplication.java` in package `com.lakeview.rules`

```java
package com.lakeview.rules;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class RulesApplication {

    public static void main(String[] args) {
        SpringApplication.run(RulesApplication.class, args);
    }
}
```

**File:** `LibraryProperties.java` in package `com.lakeview.rules`

```java
package com.lakeview.rules;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "library")
public record LibraryProperties(int maxBooks, int loanDays, int finePerDay) {}
```

**File:** `RulesController.java` in package `com.lakeview.rules`

```java
package com.lakeview.rules;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RulesController {

    record Rules(int maxBooks, int loanDays, int fineFor5DaysLate) {}

    private final LibraryProperties props;

    public RulesController(LibraryProperties props) {
        this.props = props;
    }

    @GetMapping("/rules")
    public Rules rules() {
        return new Rules(props.maxBooks(), props.loanDays(), props.finePerDay() * 5);
    }
}
```

`curl http://localhost:8080/rules` prints:

```json
{
  "maxBooks": 4,
  "loanDays": 14,
  "fineFor5DaysLate": 10
}
```

### Medium: TiffinBox Order Limits with Validation

TiffinBox, a tiffin service, limits its kitchen. Bind these settings with the prefix `tiffin`: `name`, `max-orders-per-day` (must be at least 1), a nested `delivery` group with `fee` and `radius-km`, and an `order-cutoff` duration that defaults to `2h` when missing. Validate the record so a value of 0 for the daily orders stops the app at startup. Build `GET /tiffin` that returns a summary.

> **Hint:** Add the validation starter, put `@Validated` on the record, and use `@Min(1)`. Use `@DefaultValue("2h")` on the `Duration`. Use a nested record for `delivery`.

**Answer:** The record carries the constraints, the nested record binds the delivery group and the default fills the missing cutoff.

**File:** `pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.1.1</version>
        <relativePath/>
    </parent>

    <groupId>com.tiffinbox</groupId>
    <artifactId>orders</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

**File:** `application.yml` in `src/main/resources`

```yaml
tiffin:
  name: TiffinBox
  max-orders-per-day: 120
  delivery:
    fee: 25
    radius-km: 6
```

**File:** `OrdersApplication.java` in package `com.tiffinbox.orders`

```java
package com.tiffinbox.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }
}
```

**File:** `TiffinProperties.java` in package `com.tiffinbox.orders`

```java
package com.tiffinbox.orders;

import java.time.Duration;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "tiffin")
@Validated
public record TiffinProperties(
        @NotBlank String name,
        @Min(1) int maxOrdersPerDay,
        Delivery delivery,
        @DefaultValue("2h") Duration orderCutoff) {

    public record Delivery(int fee, int radiusKm) {}
}
```

**File:** `TiffinController.java` in package `com.tiffinbox.orders`

```java
package com.tiffinbox.orders;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TiffinController {

    record Summary(String name, int maxOrders, int deliveryFee,
                   int radiusKm, long cutoffHours) {}

    private final TiffinProperties props;

    public TiffinController(TiffinProperties props) {
        this.props = props;
    }

    @GetMapping("/tiffin")
    public Summary tiffin() {
        return new Summary(props.name(), props.maxOrdersPerDay(),
                props.delivery().fee(), props.delivery().radiusKm(),
                props.orderCutoff().toHours());
    }
}
```

`curl http://localhost:8080/tiffin` prints:

```json
{
  "name": "TiffinBox",
  "maxOrders": 120,
  "deliveryFee": 25,
  "radiusKm": 6,
  "cutoffHours": 2
}
```

curl prints the JSON on one line; it is spaced out here for reading. The cutoff was not in the file, so the default of 2 hours is used. We also set `max-orders-per-day: 0` and started again. The app stopped at startup with a binding error for the property `tiffin.maxOrdersPerDay`.
