Walk into a busy library. A helper at the front desk listens to what you need. She does not fetch the book herself. She sends you to the right shelf, a librarian finds it in the stacks, and the desk hands it back to you neatly wrapped. Nobody in that library does everyone's job, and that is why it runs smoothly.

Spring MVC architecture works the same way for web requests. Each class has one job, and a front desk sends every request to the right place. Let's see how it is built and how one request travels through it.

## What is Spring MVC?

> **Definition:** Spring MVC is the part of the Spring Framework that handles web requests. It follows the Model-View-Controller pattern and uses a single front controller, the DispatcherServlet, to route every request to your code.

MVC splits a web app into three roles.

- **Model** is the data. In a library app, that is a book with a title and an author.
- **View** is what the user sees. In a website it is an HTML page. In a REST API the "view" is the JSON in the response.
- **Controller** is the traffic officer. It receives the request, asks for the data, and picks what to send back.

Spring MVC adds one more player: the **DispatcherServlet**. It is the front desk of the library. Every request enters through it, so you never have to write code that reads raw URLs and headers yourself.

In Spring Boot 4, the starter `spring-boot-starter-webmvc` brings Spring MVC, the JSON library and an embedded Tomcat server. Older Boot 3 projects called this starter `spring-boot-starter-web`.

## Why is it used?

Without a framework, you would write code to read the URL, find the method, convert text to numbers, build the response and set headers. You would repeat this for every endpoint. Spring MVC does the boring work for you.

- **One entry point.** Every request passes through the DispatcherServlet, so common work like error handling is done in one place.
- **Clean separation.** Web code, business rules and data code live in different classes. You can change one without breaking the others.
- **Automatic conversion.** A path like `/books/7` becomes a Java number, and a returned object becomes JSON.
- **Easy testing.** A controller that only handles web details is small and simple to test.

> **Tip:** Keep controllers thin. A controller should read the request, call a service and return the result. Business rules belong in the service.

## How it works

Every request follows the same journey. Here it is for a call to `GET /books`.

```text
Browser or curl
      |  GET /books
      v
+---------------------------+
| Tomcat (embedded server)  |
+---------------------------+
      |
      v
+---------------------------+
| DispatcherServlet         |
| (the front desk)          |
+---------------------------+
      |  "who handles this?"
      v
+---------------------------+
| HandlerMapping            |
| finds BookController.list |
+---------------------------+
      |
      v
+---------------------------+
| BookController.list()     |
| calls BookService         |
+---------------------------+
```

Tomcat accepts the connection and passes the request to the DispatcherServlet. The DispatcherServlet asks the HandlerMapping, which is like a phone directory, which method owns `GET /books`. Then it calls that controller method. The controller asks the service for data. This is the trip in.

Now the trip back out.

```text
BookService returns List<Book>
      |
      v
+---------------------------+
| BookController returns    |
| the list                  |
+---------------------------+
      |
      v
+---------------------------+
| Message converter         |
| (Jackson) makes JSON      |
+---------------------------+
      |
      v
+---------------------------+
| Response: 200 OK + JSON   |
+---------------------------+
```

The controller returns plain Java objects. Because the class is a `@RestController`, Spring hands the result to a message converter. Jackson writes it as JSON, and Tomcat sends it to the client. In a classic website, a view resolver would pick an HTML template here instead.

## Real-Life Example

Think of a restaurant. The guest is the browser. The waiter at the door is the DispatcherServlet. He listens to the order and walks it to the right counter, which is the controller. The counter passes the details to the kitchen, which is the service. The kitchen uses the pantry, which is the data. The plated dish comes back the same way and reaches the guest. The waiter never cooks, and the cook never greets guests.

## Code Example

Let's build a small book API for a library called PageTurn. We have three classes with three jobs: a model, a service and a controller. A few `System.out.println` lines will show the order of the calls.

```text
page-turn/
├─ pom.xml
└─ src/main/java/
   └─ com/pageturn/library/
      ├─ LibraryApplication.java
      ├─ Book.java
      ├─ BookService.java
      └─ BookController.java
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

    <groupId>com.pageturn</groupId>
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

**File:** `LibraryApplication.java` in package `com.pageturn.library`

```java
package com.pageturn.library;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

**File:** `Book.java` in package `com.pageturn.library`

```java
package com.pageturn.library;

public record Book(int id, String title, String author) {}
```

**File:** `BookService.java` in package `com.pageturn.library`

```java
package com.pageturn.library;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

@Service
public class BookService {

    private final List<Book> shelf = List.of(
            new Book(1, "The River Clock", "Meera Joshi"),
            new Book(2, "Salt and Stars", "Arjun Rao"));

    public List<Book> findAll() {
        System.out.println("Service: reading the shelf");
        return shelf;
    }

    public Optional<Book> findById(int id) {
        return shelf.stream().filter(b -> b.id() == id).findFirst();
    }
}
```

**File:** `BookController.java` in package `com.pageturn.library`

```java
package com.pageturn.library;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookController {

    private final BookService service;

    public BookController(BookService service) {
        this.service = service;
    }

    @GetMapping("/books")
    public List<Book> list() {
        System.out.println("Controller: request received");
        return service.findAll();
    }
}
```

Start the app, then call the endpoint from a second terminal:

```bash
mvn spring-boot:run
curl http://localhost:8080/books
```

**Output:**

```json
[
  {
    "id": 1,
    "title": "The River Clock",
    "author": "Meera Joshi"
  },
  {
    "id": 2,
    "title": "Salt and Stars",
    "author": "Arjun Rao"
  }
]
```

The console of the running app shows the order of the calls:

```text
Controller: request received
Service: reading the shelf
```

The JSON is spaced out here for reading; curl prints it on one line.

## Code Explained

- `Book` is the **model**. It is a plain record that only holds data.
- `BookService` is marked `@Service`. It owns the data and the rules. The controller never touches the list directly.
- `BookController` is marked `@RestController`. It receives the request and hands the work to the service.
- The constructor asks for a `BookService`. Spring creates the service and passes it in. This is called constructor injection.
- `@GetMapping("/books")` tells the HandlerMapping that this method answers `GET /books`.
- The controller returns a `List<Book>`. There is no JSON code anywhere, because Jackson writes it for us.
- The two `println` lines prove the order: the controller runs first, then the service.

## Spring MVC Architecture Layers at a Glance

| Layer | Job | Example class |
|---|---|---|
| Controller | Reads the request, returns the response | `BookController` |
| Service | Holds business rules | `BookService` |
| Model | Carries the data | `Book` |
| Front controller | Routes every request | `DispatcherServlet` |

## Common Mistakes

> **Warning:** Do not put business rules inside the controller. When the same rule is needed by a second endpoint, you will copy it, and the two copies will drift apart. Keep rules in the service.

- **Controller outside the scan area.** If `BookController` sits in a package that is not under the main class's package, Spring never finds it, and every call returns 404.
- **Talking about the DispatcherServlet as your code.** You do not create or configure it. Spring Boot registers it for you.
- **Mixing up model and entity.** A model here is any class that carries data. It does not have to be a database table.

## Interview Questions

**What is the DispatcherServlet?**
It is the front controller of Spring MVC. Every request enters through it, and it finds the right controller method and sends back the response.

**What does the HandlerMapping do?**
It matches the request path and HTTP method to a controller method, like a phone directory for endpoints.

**What is the difference between MVC in a website and in a REST API?**
In a website the view is an HTML page from a template. In a REST API the view is the response body, usually JSON, written by a message converter.

**Why keep controllers thin?**
Thin controllers are easy to read and test, and the rules in services can be reused from many endpoints.

## Key Points to Remember

- MVC means Model, View and Controller. Each has one job.
- The DispatcherServlet is the single front door for all requests.
- The HandlerMapping picks the controller method for a request.
- In a REST API, message converters such as Jackson write the response body.
- Controllers handle web details; services hold business rules.
- Spring Boot sets up all this machinery when you add `spring-boot-starter-webmvc`.

## Frequently Asked Questions

### Do I have to write the DispatcherServlet myself?

No. Spring Boot creates and registers it automatically. You only write controllers and services.

### Is Spring MVC only for websites with HTML pages?

No. It also powers REST APIs. The same request journey applies, except the response body is JSON instead of a page.

### What is the difference between Spring MVC and Spring WebFlux?

Spring MVC uses one thread per request and blocking style code. WebFlux is a reactive alternative for non-blocking code. Most beginners and most projects use MVC.

### Where does the service layer fit in Spring MVC architecture?

MVC describes the web side only. The service layer sits behind the controller and keeps business rules out of it.

## Related Topics

- [@Controller vs @RestController](/learning/spring-boot-tutorial/controller-vs-rest-controller): choose between HTML pages and JSON responses.
- [@RequestMapping](/learning/spring-boot-tutorial/request-mapping): map paths and methods to controller code.
- [GET POST PUT DELETE Mapping](/learning/spring-boot-tutorial/get-post-put-delete-mapping): use the shortcut annotations for each HTTP method.
- [Building a Complete CRUD REST API](/learning/spring-boot-tutorial/building-a-complete-crud-rest-api): put controller, service and data together.
