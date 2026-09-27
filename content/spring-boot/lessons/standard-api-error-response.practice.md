Try each problem on your own first. The first uses the web starter. The second adds the validation starter.

### Easy: CinePoint Error Reply

CinePoint's `GET /movies/{id}` knows only movie 1. For any other id, throw `MovieNotFoundException`. Create an `ErrorReply` record with `status`, `code`, `message` and `path`, and an advice class that returns it with status 404 and the code `MOVIE_NOT_FOUND`.

> **Hint:** Take `HttpServletRequest` as a second argument in the handler and call `getRequestURI()` for the path.

**Answer:** The record is the standard shape, and the handler fills it. Any later handler would fill the same record.

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

    <groupId>com.cinepoint</groupId>
    <artifactId>movies</artifactId>
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

**File:** `MoviesApplication.java` in package `com.cinepoint.movies`

```java
package com.cinepoint.movies;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MoviesApplication {

    public static void main(String[] args) {
        SpringApplication.run(MoviesApplication.class, args);
    }
}
```

**File:** `MovieNotFoundException.java` in package `com.cinepoint.movies`

```java
package com.cinepoint.movies;

public class MovieNotFoundException extends RuntimeException {

    public MovieNotFoundException(int id) {
        super("Movie " + id + " is not on our list");
    }
}
```

**File:** `ErrorReply.java` in package `com.cinepoint.movies`

```java
package com.cinepoint.movies;

public record ErrorReply(int status, String code, String message, String path) {
}
```

**File:** `MovieAdvice.java` in package `com.cinepoint.movies`

```java
package com.cinepoint.movies;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class MovieAdvice {

    @ExceptionHandler(MovieNotFoundException.class)
    public ResponseEntity<ErrorReply> notFound(MovieNotFoundException ex, HttpServletRequest request) {
        ErrorReply body = new ErrorReply(404, "MOVIE_NOT_FOUND", ex.getMessage(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }
}
```

**File:** `MovieController.java` in package `com.cinepoint.movies`

```java
package com.cinepoint.movies;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MovieController {

    @GetMapping("/movies/{id}")
    public String movie(@PathVariable int id) {
        if (id != 1) {
            throw new MovieNotFoundException(id);
        }
        return "Monsoon Express";
    }
}
```

Asking for movie 5 printed:

```json
{
  "status": 404,
  "code": "MOVIE_NOT_FOUND",
  "message": "Movie 5 is not on our list",
  "path": "/movies/5"
}
```

The JSON is spaced out here; curl prints it on one line.

### Medium: PagePoint Errors as ProblemDetail

PagePoint wants the public standard, RFC 9457. Build `GET /books/{id}` (only book 1 exists) and `POST /books` with a required `title`. Write an advice class that extends `ResponseEntityExceptionHandler`. Handle `BookNotFoundException` by returning a `ProblemDetail` with status 404, the title `Book not found` and an extra property `code`. Then check that a DELETE call, a text id and an empty title are all answered in the same format without any extra code from you.

> **Hint:** Create the object with the `forStatusAndDetail` factory method of `ProblemDetail`, then call `setTitle` and `setProperty`. The parent class already handles the framework exceptions.

**Answer:** Extending the parent class gives you the standard format for the framework's own errors. Your handler only adds the one exception that belongs to your business. The replies are sent with the media type `application/problem+json`.

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

**File:** `BookNotFoundException.java` in package `com.pagepoint.books`

```java
package com.pagepoint.books;

public class BookNotFoundException extends RuntimeException {

    public BookNotFoundException(long id) {
        super("Book " + id + " was not found");
    }
}
```

**File:** `BookAdvice.java` in package `com.pagepoint.books`

```java
package com.pagepoint.books;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class BookAdvice extends ResponseEntityExceptionHandler {

    @ExceptionHandler(BookNotFoundException.class)
    public ProblemDetail notFound(BookNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Book not found");
        problem.setProperty("code", "BOOK_NOT_FOUND");
        return problem;
    }
}
```

**File:** `BookController.java` in package `com.pagepoint.books`

```java
package com.pagepoint.books;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookController {

    record NewBook(@NotBlank(message = "Title is required") String title) {}

    @GetMapping("/books/{id}")
    public String find(@PathVariable long id) {
        if (id != 1) {
            throw new BookNotFoundException(id);
        }
        return "Monsoon Diaries";
    }

    @PostMapping("/books")
    @ResponseStatus(HttpStatus.CREATED)
    public String add(@Valid @RequestBody NewBook book) {
        return "Added " + book.title();
    }
}
```

Calling `/books/7`, then `DELETE /books/1`, then `/books/abc` printed these three replies:

```json
{
  "detail": "Book 7 was not found",
  "instance": "/books/7",
  "status": 404,
  "title": "Book not found",
  "code": "BOOK_NOT_FOUND"
}
{
  "detail": "Method 'DELETE' is not supported.",
  "instance": "/books/1",
  "status": 405,
  "title": "Method Not Allowed"
}
{
  "detail": "Failed to convert 'id' with value: 'abc'",
  "instance": "/books/abc",
  "status": 400,
  "title": "Bad Request"
}
```

An empty title, posted to `/books`, printed:

```json
{
  "detail": "Invalid request content.",
  "instance": "/books",
  "status": 400,
  "title": "Bad Request"
}
```

Notice that the automatic reply for a bad body says only `Invalid request content.` and does not list the fields. Add your own handler for the argument-not-valid exception if you want field details.
