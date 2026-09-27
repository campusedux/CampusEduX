Try each problem on your own first. Both use only the web starter. We test with curl by adding an `Origin` header, the way a browser does.

### Easy: PagePoint Bookshop Frontend

PagePoint's React page runs at `http://localhost:5173` and calls `GET /books` on the Spring Boot API. Allow only that origin, on that controller.

> **Hint:** Put `@CrossOrigin` with the `origins` value on the controller class.

**Answer:** The annotation on the class covers every method inside. The reply now carries the allow header for that origin.

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

    <groupId>com.pagepoint</groupId>
    <artifactId>books</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
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

**File:** `BooksApplication.java` in package `com.pagepoint.books`

```java
package com.pagepoint.books;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BooksApplication {

    public static void main(String[] args) {
        SpringApplication.run(BooksApplication.class, args);
    }
}
```

**File:** `BookController.java` in package `com.pagepoint.books`

```java
package com.pagepoint.books;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class BookController {

    @GetMapping("/books")
    public List<String> books() {
        return List.of("Monsoon Diaries", "Paper Boats");
    }
}
```

Send the request as the page would:

```bash
curl -i localhost:8080/books -H "Origin: http://localhost:5173"
```

The reply headers and body:

```bash
HTTP/1.1 200 
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json

["Monsoon Diaries","Paper Boats"]
```

### Medium: QuickBite Orders from Properties

QuickBite serves `/api/orders` to two frontends: `http://localhost:3000` and `https://app.quickbite.example`. Read the allowed origins from `application.properties` as a comma-separated list. Allow GET and POST, allow cookies to be sent, and let the browser read a custom `X-Total-Count` header. Any other origin must get 403.

> **Hint:** Inject `String[]` with `@Value`, which splits at commas. Use `allowCredentials(true)` and `exposedHeaders` in `addCorsMappings`. Return the header with `ResponseEntity`.

**Answer:** The properties file holds the origins, so each environment can use its own list. Because cookies are allowed, we must list exact origins and never `*`.

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

    <groupId>com.quickbite</groupId>
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
cors.allowed-origins=http://localhost:3000,https://app.quickbite.example
```

**File:** `OrdersApplication.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }
}
```

**File:** `CorsConfig.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String[] origins;

    public CorsConfig(@Value("${cors.allowed-origins}") String[] origins) {
        this.origins = origins;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST")
                .allowCredentials(true)
                .exposedHeaders("X-Total-Count");
    }
}
```

**File:** `OrderController.java` in package `com.quickbite.orders`

```java
package com.quickbite.orders;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @GetMapping
    public ResponseEntity<List<String>> orders() {
        List<String> orders = List.of("Veg Biryani", "Masala Dosa", "Cold Coffee");
        return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(orders.size()))
                .body(orders);
    }
}
```

Calling with the second origin:

```bash
curl -i localhost:8080/api/orders -H "Origin: https://app.quickbite.example"
```

prints:

```bash
HTTP/1.1 200 
Access-Control-Allow-Origin: https://app.quickbite.example
Access-Control-Expose-Headers: X-Total-Count
Access-Control-Allow-Credentials: true
X-Total-Count: 3
Content-Type: application/json

["Veg Biryani","Masala Dosa","Cold Coffee"]
```

The same call with `Origin: http://localhost:4000` prints status `403` and the text `Invalid CORS request`.
