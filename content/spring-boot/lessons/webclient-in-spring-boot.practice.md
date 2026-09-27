Try each problem on your own first. Both use the web starter and the WebClient starter, and call an API in the same app.

### Easy: CityCare Bed Desk

CityCare Hospital has a ward system at `/wards/{ward}/beds` that returns `ward` and `free`. Build a desk endpoint `GET /desk/{ward}` that calls it with WebClient and replies like `2 beds free in icu`.

> **Hint:** Create the client with `WebClient.create(baseUrl)`. Chain `get`, `uri`, `retrieve`, `bodyToMono` and `block`.

**Answer:** One controller owns a `WebClient`, built once in the constructor. `block()` gives us the plain `Beds` record so we can build the text.

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

    <groupId>com.citycare</groupId>
    <artifactId>beds</artifactId>
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
            <artifactId>spring-boot-starter-webclient</artifactId>
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

**File:** `application.properties` in `src/main/resources`

```properties
wards.url=http://localhost:${server.port:8080}
```

**File:** `BedsApplication.java` in package `com.citycare.beds`

```java
package com.citycare.beds;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BedsApplication {

    public static void main(String[] args) {
        SpringApplication.run(BedsApplication.class, args);
    }
}
```

**File:** `WardController.java` in package `com.citycare.beds`

```java
package com.citycare.beds;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** Pretend this is the ward system of another department. */
@RestController
public class WardController {

    record Beds(String ward, int free) {}

    @GetMapping("/wards/{ward}/beds")
    public Beds beds(@PathVariable String ward) {
        return new Beds(ward, ward.equals("icu") ? 2 : 11);
    }
}
```

**File:** `DeskController.java` in package `com.citycare.beds`

```java
package com.citycare.beds;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

@RestController
public class DeskController {

    record Beds(String ward, int free) {}

    private final WebClient client;

    public DeskController(@Value("${wards.url}") String url) {
        this.client = WebClient.create(url);
    }

    @GetMapping("/desk/{ward}")
    public String desk(@PathVariable String ward) {
        Beds beds = client.get()
                .uri("/wards/{ward}/beds", ward)
                .retrieve()
                .bodyToMono(Beds.class)
                .block();
        return beds.free() + " beds free in " + beds.ward();
    }
}
```

Asking for the ICU:

```bash
curl localhost:8080/desk/icu
```

prints:

```text
2 beds free in icu
```

### Medium: TiffinBox Order Preview with Retry

The TiffinBox kitchen system has two endpoints: `/kitchen/menu`, which fails with 503 on its first two calls, and `/kitchen/eta`, which returns the delivery time in minutes. Build `GET /order/preview` that calls both at the same time, retries the menu up to two more times with a 200 millisecond pause, and replies `Today: Dal Rice, Paneer Thali. Delivery in 35 minutes.`

> **Hint:** Use `retryWhen(Retry.fixedDelay(2, Duration.ofMillis(200)))` on the menu chain, read the list with a `ParameterizedTypeReference`, then join with `Mono.zip`.

**Answer:** The first two menu calls fail, the third succeeds, so the retry rule hides the trouble from the caller. The two calls start together because we only subscribe once, at `block()`.

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
    <artifactId>preview</artifactId>
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
            <artifactId>spring-boot-starter-webclient</artifactId>
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

**File:** `application.properties` in `src/main/resources`

```properties
kitchen.url=http://localhost:${server.port:8080}/kitchen
```

**File:** `PreviewApplication.java` in package `com.tiffinbox.preview`

```java
package com.tiffinbox.preview;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PreviewApplication {

    public static void main(String[] args) {
        SpringApplication.run(PreviewApplication.class, args);
    }
}
```

**File:** `KitchenController.java` in package `com.tiffinbox.preview`

```java
package com.tiffinbox.preview;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Pretend this is the kitchen system. The menu fails on its first two calls. */
@RestController
@RequestMapping("/kitchen")
public class KitchenController {

    private final AtomicInteger menuCalls = new AtomicInteger();

    @GetMapping("/menu")
    public List<String> menu() {
        if (menuCalls.incrementAndGet() <= 2) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Kitchen busy");
        }
        return List.of("Dal Rice", "Paneer Thali");
    }

    @GetMapping("/eta")
    public int etaInMinutes() {
        return 35;
    }
}
```

**File:** `PreviewController.java` in package `com.tiffinbox.preview`

```java
package com.tiffinbox.preview;

import java.time.Duration;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

@RestController
public class PreviewController {

    private final WebClient kitchen;

    public PreviewController(WebClient.Builder builder, @Value("${kitchen.url}") String url) {
        this.kitchen = builder.baseUrl(url).build();
    }

    @GetMapping("/order/preview")
    public String preview() {
        Mono<List<String>> menu = kitchen.get().uri("/menu")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<String>>() {})
                .retryWhen(Retry.fixedDelay(2, Duration.ofMillis(200)));
        Mono<Integer> eta = kitchen.get().uri("/eta")
                .retrieve()
                .bodyToMono(Integer.class);

        return Mono.zip(menu, eta)
                .map(pair -> "Today: " + String.join(", ", pair.getT1())
                        + ". Delivery in " + pair.getT2() + " minutes.")
                .block();
    }
}
```

Calling the endpoint once, on a fresh start, printed status 200 and:

```bash
Today: Dal Rice, Paneer Thali. Delivery in 35 minutes.
```
