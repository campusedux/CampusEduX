Try each problem on your own first. Both use only the web starter.

### Easy: PagePoint Missing Book

PagePoint's `GET /books/{isbn}` returns a title for ISBN 111 or 222, and throws `BookNotFoundException` for anything else. Move the handling out of the controller. Write a `@RestControllerAdvice` class that turns the exception into status 404 and a JSON body with the key `error`.

> **Hint:** Put `@ExceptionHandler` and `@ResponseStatus` on one method of the advice class, and return a `Map` with the message.

**Answer:** The controller only throws. The advice class decides the status and body for the whole app.

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
    <artifactId>library</artifactId>
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

**File:** `LibraryApplication.java` in package `com.pagepoint.library`

```java
package com.pagepoint.library;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

**File:** `BookNotFoundException.java` in package `com.pagepoint.library`

```java
package com.pagepoint.library;

public class BookNotFoundException extends RuntimeException {

    public BookNotFoundException(String isbn) {
        super("No book with ISBN " + isbn);
    }
}
```

**File:** `LibraryAdvice.java` in package `com.pagepoint.library`

```java
package com.pagepoint.library;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class LibraryAdvice {

    @ExceptionHandler(BookNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> notFound(BookNotFoundException ex) {
        return Map.of("error", ex.getMessage());
    }
}
```

**File:** `BookController.java` in package `com.pagepoint.library`

```java
package com.pagepoint.library;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookController {

    private final Map<String, String> books = Map.of("111", "Monsoon Diaries", "222", "Paper Boats");

    @GetMapping("/books/{isbn}")
    public String find(@PathVariable String isbn) {
        String title = books.get(isbn);
        if (title == null) {
            throw new BookNotFoundException(isbn);
        }
        return title;
    }
}
```

Asking for books `111` and `999` printed:

```bash
Monsoon Diaries [200]
{"error":"No book with ISBN 999"} [404]
```

### Medium: TiffinBox Two Not-Found Exceptions and a Bad Id

TiffinBox has `GET /orders/{id}` with an integer id, and `GET /customers/{phone}`. Order 1 exists. Any other order throws `OrderNotFoundException`, and every customer lookup throws `CustomerNotFoundException`. Write one advice class where a single method handles both not-found exceptions with status 404. Add a handler so that `/orders/abc` gives 400, not 500, and keep a catch-all that logs and returns a generic message.

> **Hint:** Use `@ExceptionHandler({A.class, B.class})` with `RuntimeException` as the argument type. A text value where a number is expected raises the argument type mismatch exception, and its `getName()` method gives the parameter name. Look for it in the `web.method.annotation` package.

**Answer:** The catch-all handler stays last in importance, because Spring chooses the most specific match. Without the mismatch handler, `abc` would fall into the catch-all and become a 500.

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

**File:** `OrdersApplication.java` in package `com.tiffinbox.orders`

```java
package com.tiffinbox.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }
}
```

**File:** `OrderNotFoundException.java` in package `com.tiffinbox.orders`

```java
package com.tiffinbox.orders;

public class OrderNotFoundException extends RuntimeException {

    public OrderNotFoundException(int id) {
        super("Order " + id + " not found");
    }
}
```

**File:** `CustomerNotFoundException.java` in package `com.tiffinbox.orders`

```java
package com.tiffinbox.orders;

public class CustomerNotFoundException extends RuntimeException {

    public CustomerNotFoundException(String phone) {
        super("No customer with phone " + phone);
    }
}
```

**File:** `OrderAdvice.java` in package `com.tiffinbox.orders`

```java
package com.tiffinbox.orders;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class OrderAdvice {

    private static final Logger log = LoggerFactory.getLogger(OrderAdvice.class);

    @ExceptionHandler({OrderNotFoundException.class, CustomerNotFoundException.class})
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, String> notFound(RuntimeException ex) {
        return Map.of("error", ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> wrongType(MethodArgumentTypeMismatchException ex) {
        return Map.of("error", "Parameter " + ex.getName() + " has the wrong type");
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, String> unexpected(Exception ex) {
        log.error("Unexpected failure", ex);
        return Map.of("error", "Something went wrong");
    }
}
```

**File:** `OrderController.java` in package `com.tiffinbox.orders`

```java
package com.tiffinbox.orders;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {

    @GetMapping("/orders/{id}")
    public String order(@PathVariable int id) {
        if (id != 1) {
            throw new OrderNotFoundException(id);
        }
        return "Order 1: Dal Rice Thali";
    }

    @GetMapping("/customers/{phone}")
    public String customer(@PathVariable String phone) {
        throw new CustomerNotFoundException(phone);
    }
}
```

Calling `/orders/1`, `/orders/7`, `/customers/9370000000` and `/orders/abc` printed:

```bash
Order 1: Dal Rice Thali [200]
{"error":"Order 7 not found"} [404]
{"error":"No customer with phone 9370000000"} [404]
{"error":"Parameter id has the wrong type"} [400]
```
