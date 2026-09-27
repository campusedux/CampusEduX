Try each problem on your own first. Both use HTTP Basic login and the same pom shape as the Sunrise Multiplex example.

### Easy: Library Desk Rules

ReadWell Library has two users: `sunita` is a `LIBRARIAN` and `vikram` is a `MEMBER`. Build an API where `GET /books` works for any logged-in user, but `POST /books` (adding a book) works only for the librarian. Everything else must be closed.

> **Hint:** Use two `requestMatchers` rules with `HttpMethod`, one `hasAnyRole` and one `hasRole`, then finish with `anyRequest().denyAll()`.

**Answer:** `GET /books` needs `MEMBER` or `LIBRARIAN`, and `POST /books` needs `LIBRARIAN`. A member who tries to add a book gets `403`.

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

    <groupId>com.readwell</groupId>
    <artifactId>desk</artifactId>
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
            <artifactId>spring-boot-starter-security</artifactId>
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

**File:** `DeskApplication.java` in package `com.readwell.desk`

```java
package com.readwell.desk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(DeskApplication.class, args);
    }
}
```

**File:** `SecurityConfig.java` in package `com.readwell.desk`

```java
package com.readwell.desk;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/books").hasAnyRole("MEMBER", "LIBRARIAN")
                .requestMatchers(HttpMethod.POST, "/books").hasRole("LIBRARIAN")
                .anyRequest().denyAll())
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager(
            User.withUsername("sunita").password("{noop}stamp11").roles("LIBRARIAN").build(),
            User.withUsername("vikram").password("{noop}card22").roles("MEMBER").build());
    }
}
```

**File:** `BookController.java` in package `com.readwell.desk`

```java
package com.readwell.desk;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/books")
public class BookController {

    record Book(String title) {}

    private final List<Book> books = new CopyOnWriteArrayList<>(List.of(new Book("River Songs")));

    @GetMapping
    public List<Book> all() {
        return books;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Book add(@RequestBody Book book) {
        books.add(book);
        return book;
    }
}
```

**Output:**

```text
vikram GET     -> 200
  [{"title":"River Songs"}]
vikram POST    -> 403
sunita POST    -> 201
  {"title":"Tide Tables"}
```

### Medium: Bakery Roles with Friendly Errors

Golden Crust Bakery has roles `STAFF`, `BAKER` and `OWNER`, where each role includes the one below it (`OWNER` includes `BAKER`, and `BAKER` includes `STAFF`). Users: `latha` (`STAFF`), `bilal` (`BAKER`), `owner` (`OWNER`).

- `GET /orders` needs `STAFF`.
- `PUT /orders/{id}/ready` needs `BAKER`.
- `GET /reports/sales` needs `OWNER`.

Instead of an empty `401` or `403`, reply with JSON: `{"error":"Please log in"}` or `{"error":"Your role cannot do this"}`.

> **Hint:** Add a `RoleHierarchy` bean. In `exceptionHandling`, set an `authenticationEntryPoint` for the missing login and an `accessDeniedHandler` for the missing role. Both are lambdas that write JSON to the response.

**Answer:** The hierarchy means `bilal` can also read orders, and the owner can do everything. The two handlers replace Spring's empty error bodies with our own JSON.

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

    <groupId>com.goldencrust</groupId>
    <artifactId>shop</artifactId>
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
            <artifactId>spring-boot-starter-security</artifactId>
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

**File:** `ShopApplication.java` in package `com.goldencrust.shop`

```java
package com.goldencrust.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}
```

**File:** `SecurityConfig.java` in package `com.goldencrust.shop`

```java
package com.goldencrust.shop;

import java.io.IOException;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/orders").hasRole("STAFF")
                .requestMatchers(HttpMethod.PUT, "/orders/*/ready").hasRole("BAKER")
                .requestMatchers(HttpMethod.GET, "/reports/sales").hasRole("OWNER")
                .anyRequest().denyAll())
            .httpBasic(Customizer.withDefaults())
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, e) ->
                    writeJson(response, 401, "Please log in"))
                .accessDeniedHandler((request, response, e) ->
                    writeJson(response, 403, "Your role cannot do this")));
        return http.build();
    }

    private static void writeJson(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }

    @Bean
    RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.fromHierarchy("""
            ROLE_OWNER > ROLE_BAKER
            ROLE_BAKER > ROLE_STAFF
            """);
    }

    @Bean
    UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager(
            User.withUsername("latha").password("{noop}apron1").roles("STAFF").build(),
            User.withUsername("bilal").password("{noop}oven2").roles("BAKER").build(),
            User.withUsername("owner").password("{noop}till3").roles("OWNER").build());
    }
}
```

**File:** `ShopController.java` in package `com.goldencrust.shop`

```java
package com.goldencrust.shop;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ShopController {

    @GetMapping("/orders")
    public List<String> orders() {
        return List.of("Order 1: 2 loaves", "Order 2: 12 buns");
    }

    @PutMapping("/orders/{id}/ready")
    public Map<String, Object> ready(@PathVariable int id) {
        return Map.of("order", id, "status", "READY");
    }

    @GetMapping("/reports/sales")
    public Map<String, Object> sales() {
        return Map.of("todayInRupees", 18450);
    }
}
```

**Output:**

```text
no login GET /orders
  {"error":"Please log in"}  401
latha PUT ready
  {"error":"Your role cannot do
  this"}  403
bilal PUT ready -> 200
  {"status":"READY","order":1}
bilal GET sales -> 403
owner GET sales -> 200
  {"todayInRupees":18450}
```
