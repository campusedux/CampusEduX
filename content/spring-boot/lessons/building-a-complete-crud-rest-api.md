Every library does four things with its books. It adds a new book to the shelf. It lets people look at books. It fixes a wrong title or a changed price. It removes a book that is worn out. Add, read, update, remove. Almost every real app, from a bank to a bakery, is built on those same four actions.

In this topic you will build a complete CRUD REST API in Spring Boot. It brings together everything from the earlier topics: mappings, path variables, request bodies, DTOs and status codes.

## What is a CRUD REST API?

> **Definition:** CRUD stands for Create, Read, Update and Delete, the four basic actions on stored data. A CRUD REST API exposes those four actions over HTTP, one endpoint per action, using the HTTP methods POST, GET, PUT and DELETE.

Each action has its usual HTTP method and address.

| Action | HTTP method | Address | Success status |
|---|---|---|---|
| Create | POST | `/api/books` | 201 Created |
| Read all | GET | `/api/books` | 200 OK |
| Read one | GET | `/api/books/{id}` | 200 OK |
| Update | PUT | `/api/books/{id}` | 200 OK |
| Delete | DELETE | `/api/books/{id}` | 204 No Content |

The address names the thing, which is a book, and the HTTP method says what to do with it. This style is called REST.

## Why is it used?

CRUD covers most of what apps do with data, so this pattern repeats everywhere.

- **Predictable.** Once you know one CRUD API, you can read any other.
- **Works with any client.** A mobile app, a website and a script all speak plain HTTP and JSON.
- **Clear layers.** A CRUD API is the best place to practise controller, service and repository roles.
- **Base for more.** Later you add a real database, validation and security on top of the same shape.

> **Note:** In this topic the data lives in memory, in a map, so you can run the app with nothing else installed. When the app restarts, the books are gone. A later topic swaps the map for a real database and leaves the controller and service unchanged.

## How it works

The API is built in layers. Each layer has one job and talks only to the layer below it.

```text
Client (curl, app, browser)
        |  JSON over HTTP
        v
+---------------------------+
| BookController            |
| HTTP: paths, status codes |
+---------------------------+
        |  DTOs
        v
+---------------------------+
| BookService               |
| rules, DTO <-> Book       |
+---------------------------+
        |  Book entity
        v
+---------------------------+
| BookRepository            |
| stores books in a map     |
+---------------------------+
```

The controller only deals with HTTP. The service holds the rules, such as "the title must not be empty", and converts between DTOs and the `Book` entity. The repository only saves and finds. If we later move to a database, only the repository changes.

Errors follow their own path.

```text
Service throws
NoSuchBookException
        |
        v
+---------------------------+
| ApiExceptionHandler       |
| (@RestControllerAdvice)   |
+---------------------------+
        |
        v
  404 + JSON message
```

The service does not know about HTTP. It throws a plain Java exception, and the exception handler translates it into a status code and a message. That keeps every layer clean.

## Real-Life Example

Think of the register at a small shop. To create, the clerk writes a new line with a fresh number. To read, anyone can ask for one line or the whole list. To update, the clerk crosses out the old price and writes the new one on the same line. To delete, the clerk strikes the line out. The register is the repository, the clerk is the service, and the counter where customers speak to the clerk is the controller.

## Code Example

Let's build a book API for CityLibrary. Here is the folder layout.

```text
citylibrary/
├─ pom.xml
└─ src/main/java/
   └─ com/citylibrary/books/
      ├─ BooksApplication.java
      ├─ Book.java
      ├─ BookRequest.java
      ├─ BookResponse.java
      ├─ NoSuchBookException.java
      ├─ BookRepository.java
      ├─ BookService.java
      ├─ BookController.java
      └─ ApiExceptionHandler.java
```

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

    <groupId>com.citylibrary</groupId>
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

**File:** `BooksApplication.java` in package `com.citylibrary.books`

```java
package com.citylibrary.books;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BooksApplication {

    public static void main(String[] args) {
        SpringApplication.run(BooksApplication.class, args);
    }
}
```

**File:** `Book.java` in package `com.citylibrary.books`

```java
package com.citylibrary.books;

public record Book(int id, String title, String author, int copies) {}
```

**File:** `BookRequest.java` in package `com.citylibrary.books`

```java
package com.citylibrary.books;

public record BookRequest(String title, String author, int copies) {}
```

**File:** `BookResponse.java` in package `com.citylibrary.books`

```java
package com.citylibrary.books;

public record BookResponse(int id, String title, String author, int copies) {}
```

**File:** `NoSuchBookException.java` in package `com.citylibrary.books`

```java
package com.citylibrary.books;

public class NoSuchBookException extends RuntimeException {

    public NoSuchBookException(int id) {
        super("Book " + id + " does not exist");
    }
}
```

**File:** `BookRepository.java` in package `com.citylibrary.books`

```java
package com.citylibrary.books;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Repository;

@Repository
public class BookRepository {

    private final Map<Integer, Book> books = new ConcurrentHashMap<>();
    private final AtomicInteger nextId = new AtomicInteger(1);

    public int nextId() {
        return nextId.getAndIncrement();
    }

    public Book save(Book book) {
        books.put(book.id(), book);
        return book;
    }

    public Optional<Book> findById(int id) {
        return Optional.ofNullable(books.get(id));
    }

    public List<Book> findAll() {
        return new ArrayList<>(books.values());
    }

    public boolean deleteById(int id) {
        return books.remove(id) != null;
    }
}
```

**File:** `BookService.java` in package `com.citylibrary.books`

```java
package com.citylibrary.books;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class BookService {

    private final BookRepository repository;

    public BookService(BookRepository repository) {
        this.repository = repository;
    }

    public BookResponse create(BookRequest request) {
        check(request);
        Book book = new Book(repository.nextId(), request.title(),
                request.author(), request.copies());
        return toResponse(repository.save(book));
    }

    public List<BookResponse> findAll(String author) {
        return repository.findAll().stream()
                .filter(b -> author == null || b.author().equalsIgnoreCase(author))
                .sorted(Comparator.comparingInt(Book::id))
                .map(this::toResponse)
                .toList();
    }

    public BookResponse findOne(int id) {
        return toResponse(repository.findById(id)
                .orElseThrow(() -> new NoSuchBookException(id)));
    }

    public BookResponse update(int id, BookRequest request) {
        check(request);
        repository.findById(id).orElseThrow(() -> new NoSuchBookException(id));
        Book book = new Book(id, request.title(), request.author(), request.copies());
        return toResponse(repository.save(book));
    }

    public void delete(int id) {
        if (!repository.deleteById(id)) {
            throw new NoSuchBookException(id);
        }
    }

    private void check(BookRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw new IllegalArgumentException("Title must not be empty");
        }
        if (request.copies() < 0) {
            throw new IllegalArgumentException("Copies cannot be negative");
        }
    }

    private BookResponse toResponse(Book book) {
        return new BookResponse(book.id(), book.title(), book.author(), book.copies());
    }
}
```

**File:** `BookController.java` in package `com.citylibrary.books`

```java
package com.citylibrary.books;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService service;

    public BookController(BookService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<BookResponse> create(@RequestBody BookRequest request) {
        BookResponse created = service.create(request);
        return ResponseEntity.created(URI.create("/api/books/" + created.id()))
                .body(created);
    }

    @GetMapping
    public List<BookResponse> all(@RequestParam(required = false) String author) {
        return service.findAll(author);
    }

    @GetMapping("/{id}")
    public BookResponse one(@PathVariable int id) {
        return service.findOne(id);
    }

    @PutMapping("/{id}")
    public BookResponse update(@PathVariable int id, @RequestBody BookRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

**File:** `ApiExceptionHandler.java` in package `com.citylibrary.books`

```java
package com.citylibrary.books;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    record ApiError(int status, String message) {}

    @ExceptionHandler(NoSuchBookException.class)
    public ResponseEntity<ApiError> notFound(NoSuchBookException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError(404, e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> badRequest(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError(400, e.getMessage()));
    }
}
```

Start the app and run one call for each action. The `-w` flag prints the status code on its own line after each body.

```bash
mvn spring-boot:run
curl -s -w "\n%{http_code}\n" -X POST localhost:8080/api/books -H "Content-Type: application/json" -d '{"title":"Salt and Stars","author":"Arjun Rao","copies":3}'
curl -s -o /dev/null -X POST localhost:8080/api/books -H "Content-Type: application/json" -d '{"title":"The River Clock","author":"Meera Joshi","copies":5}'
curl -s -w "\n%{http_code}\n" localhost:8080/api/books
curl -s -w "\n%{http_code}\n" "localhost:8080/api/books?author=Meera%20Joshi"
curl -s -w "\n%{http_code}\n" localhost:8080/api/books/1
curl -s -w "\n%{http_code}\n" -X PUT localhost:8080/api/books/1 -H "Content-Type: application/json" -d '{"title":"Salt and Stars","author":"Arjun Rao","copies":8}'
curl -s -w "\n%{http_code}\n" -X DELETE localhost:8080/api/books/1
curl -s -w "\n%{http_code}\n" localhost:8080/api/books/1
curl -s -w "\n%{http_code}\n" -X POST localhost:8080/api/books -H "Content-Type: application/json" -d '{"title":"","author":"X","copies":1}'
```

**Output:** the statuses, one per call that prints a status (the second call prints nothing):

```text
201
200
200
200
200
204
404
400
```

The bodies matter too. The create reply, then the list of two books, spaced out for reading:

```json
{
  "id": 1,
  "title": "Salt and Stars",
  "author": "Arjun Rao",
  "copies": 3
}
```

```json
[
  {
    "id": 1,
    "title": "Salt and Stars",
    "author": "Arjun Rao",
    "copies": 3
  },
  {
    "id": 2,
    "title": "The River Clock",
    "author": "Meera Joshi",
    "copies": 5
  }
]
```

The update reply shows the new copy count, and the two error replies follow:

```json
{
  "id": 1,
  "title": "Salt and Stars",
  "author": "Arjun Rao",
  "copies": 8
}
```

```json
{
  "status": 404,
  "message": "Book 1 does not exist"
}
```

```json
{
  "status": 400,
  "message": "Title must not be empty"
}
```

## Code Explained

- `BookRequest` is the only shape a client may send. `BookResponse` is the only shape it receives. The `Book` entity never leaves the service.
- `BookRepository` is the storage. It uses a `ConcurrentHashMap`, which is safe when many requests arrive at once, and an `AtomicInteger` to give out ids.
- `BookService` holds the rules. `check()` refuses an empty title or negative copies. `orElseThrow` turns a missing book into a `NoSuchBookException`.
- `BookController` only maps HTTP to service calls. Create returns `201` with a `Location` header, and delete returns `204`.
- `@RequestParam(required = false) String author` makes the author filter optional on the list.
- `ApiExceptionHandler` maps `NoSuchBookException` to 404 and `IllegalArgumentException` to 400, so the controller and service stay free of HTTP code.
- The last call fails on purpose. An empty title triggers the 400 reply.

## Full Update and Partial Update

| Point | PUT | PATCH |
|---|---|---|
| Sends | The complete book | Only changed fields |
| Missing field | Replaced with empty or zero | Left as it was |
| In this API | Implemented | Not added |

## Common Mistakes

> **Warning:** Do not skip the 404 check on update and delete. Without it, a PUT to an unknown id can silently create a book, and a DELETE can claim success for something that never existed.

- **Business rules in the controller.** Keep checks in the service so every entry point gets them.
- **Returning the entity.** Use response DTOs, so new entity fields never leak by accident.
- **200 for everything.** Use 201 for create and 204 for delete, as the table showed.
- **Forgetting that memory is not storage.** Restarting the app clears the map. Add a database before real use.
- **Non-thread-safe collections.** A plain `HashMap` can break when two requests write at once. This is why we used `ConcurrentHashMap`.

## Interview Questions

**What does CRUD stand for, and how does it map to HTTP?**
Create is POST, Read is GET, Update is PUT or PATCH, and Delete is DELETE.

**Why split the code into controller, service and repository?**
Each layer has one job. It makes the code easier to test and lets you change storage without touching the web layer.

**Which status codes should a CRUD API use?**
201 for create, 200 for read and update, 204 for delete, 400 for bad input and 404 for a missing item.

**What is the difference between PUT and PATCH?**
PUT replaces the whole item. PATCH changes only the fields you send.

## Key Points to Remember

- CRUD means Create, Read, Update and Delete.
- Use nouns in addresses and let the HTTP method be the verb.
- Keep three layers: controller, service and repository.
- Use request and response DTOs, and never return the entity.
- Use 201 for create, 204 for delete, 400 for bad input and 404 for a missing item.
- One `@RestControllerAdvice` class can handle errors for the whole API.

## Frequently Asked Questions

### How do I build a CRUD REST API in Spring Boot?

Add the web starter, then create a controller with mappings for POST, GET, PUT and DELETE, a service for the rules, and a repository for storage. This topic shows all three working together.

### Do I need a database to build a CRUD API?

Not to learn the shape. An in-memory map works for practice. For real data you replace the repository with one backed by a database.

### Should the controller talk to the repository directly?

For anything beyond a demo, no. Go through a service, so the rules live in one place and the controller stays thin.

### What is the best status code for a successful delete?

204 No Content is the usual choice, since the item is gone and there is nothing to return.

## Related Topics

- [DTO Pattern](/learning/spring-boot-tutorial/dto-pattern): see why the request and response classes are separate.
- [HTTP Status Codes in Spring Boot](/learning/spring-boot-tutorial/http-status-codes-in-spring-boot): learn every code used here.
- [ResponseEntity](/learning/spring-boot-tutorial/responseentity): control status and headers in the reply.
- [Spring MVC Architecture](/learning/spring-boot-tutorial/spring-mvc-architecture): revisit the request journey behind each call.
