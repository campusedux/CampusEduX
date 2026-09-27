You have learned starters, controllers, JPA, validation, exceptions and tests one by one. Each topic made sense alone. But a real job never gives you one topic at a time. It gives you a whole small product and says, "Build the borrowing feature by Friday." The best way to join everything is to build a small project from start to finish.

In this Spring Boot mini project you will build BookNook, a library lending API. Members borrow and return books, the app protects itself from bad input, and tests prove it works. You can explain this project in an interview, and you can extend it as your own.

## What is a Spring Boot Mini Project?

> **Definition:** A Spring Boot mini project is a small but complete application that joins the main skills of the course: a REST layer, business logic, a database, validation, error handling and tests, all working together.

"Mini" means the scope is small: three tables and three endpoints. "Complete" means it has the same layers a bigger project has.

BookNook has these features:

- List the books and how many copies are free.
- Borrow a book. This lowers the free copies and creates a loan record.
- Return a book. This closes the loan and adds the copy back.
- Reject bad requests with clear messages and correct HTTP status codes.

## Why build one?

Reading about `@Transactional` and writing a service that must not lend the last copy twice are very different experiences. A project shows you the gaps: where to put a rule, which layer owns the check, what happens when the input is empty. It also gives you something real to show in an interview.

## How it works

The app has four layers. Each layer talks only to the one below it.

```text
Client (curl / browser)
  |
  v
Controller (HTTP in, JSON out)
  |
  v
Service (rules + transaction)
  |
  v
Repository (Spring Data JPA)
  |
  v
H2 database (in memory)
```

The controller reads the request and checks the input. The service applies the rules, such as "no copy left means no loan", and wraps the work in one transaction. The repository talks to the database. An exception handler sits on the side and turns any error into a clean JSON reply.

When a member borrows a book, the path is short. The controller receives the request. The service loads the book and the member, asks the book to lend one copy, saves a loan and returns a small view object. If the book has no copy, the service throws an exception, the transaction rolls back and the handler replies with status 409.

## Data Model

The database has three tables. A loan links one member to one book.

```text
MEMBER 1 -------- * LOAN
BOOK   1 -------- * LOAN

LOAN
+--------------+
| id        PK |
| book_id   FK |
| member_id FK |
| borrowed_on  |
| returned_on  |
+--------------+
```

One member can have many loans, and one book can appear in many loans over time. The loan table holds the two foreign keys.

| Entity | Fields | Job |
|---|---|---|
| Book | id, title, copiesAvailable | What can be borrowed |
| Member | id, name | Who borrows |
| Loan | id, book, member, borrowedOn, returnedOn | One borrowing event |

A loan with an empty `returnedOn` is still open.

## Real-Life Example

Think of the desk at a college library. The librarian looks up the book, checks that a copy is on the shelf, stamps a card with today's date and lowers the shelf count. When the book comes back, she stamps it again and puts it on the shelf. If a student asks for a book that is out, she says so politely. BookNook is that librarian in code. The rules live in one place, the service, and every request goes through them.

## Code Example

Here is the full project. Create the folders as shown in the file labels. The main code is in `src/main/java`, and the test is in `src/test/java`.

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

    <groupId>com.booknook</groupId>
    <artifactId>lib</artifactId>
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
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc-test</artifactId>
            <scope>test</scope>
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
spring.main.banner-mode=off
logging.level.root=warn
spring.datasource.url=jdbc:h2:mem:booknook
spring.jpa.open-in-view=false
```

**File:** `Book.java` in package `com.booknook.lib`

```java
package com.booknook.lib;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private int copiesAvailable;

    protected Book() {}

    public Book(String title, int copiesAvailable) {
        this.title = title;
        this.copiesAvailable = copiesAvailable;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public int getCopiesAvailable() { return copiesAvailable; }

    public void lendOne() {
        if (copiesAvailable == 0) {
            throw new ApiException(409, "No copy of '" + title + "' is available");
        }
        copiesAvailable--;
    }

    public void takeBackOne() {
        copiesAvailable++;
    }
}
```

**File:** `Member.java` in package `com.booknook.lib`

```java
package com.booknook.lib;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    protected Member() {}

    public Member(String name) {
        this.name = name;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
}
```

**File:** `Loan.java` in package `com.booknook.lib`

```java
package com.booknook.lib;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

@Entity
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Member member;

    private LocalDate borrowedOn;
    private LocalDate returnedOn;

    protected Loan() {}

    public Loan(Book book, Member member) {
        this.book = book;
        this.member = member;
        this.borrowedOn = LocalDate.now();
    }

    public Long getId() { return id; }
    public Book getBook() { return book; }
    public Member getMember() { return member; }
    public LocalDate getBorrowedOn() { return borrowedOn; }
    public boolean isReturned() { return returnedOn != null; }

    public void markReturned() {
        if (returnedOn != null) {
            throw new ApiException(409, "Loan " + id + " was already returned");
        }
        returnedOn = LocalDate.now();
    }
}
```

**File:** `BookRepository.java` in package `com.booknook.lib`

```java
package com.booknook.lib;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {
}
```

**File:** `MemberRepository.java` in package `com.booknook.lib`

```java
package com.booknook.lib;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {
}
```

**File:** `LoanRepository.java` in package `com.booknook.lib`

```java
package com.booknook.lib;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanRepository extends JpaRepository<Loan, Long> {
}
```

**File:** `ApiException.java` in package `com.booknook.lib`

```java
package com.booknook.lib;

public class ApiException extends RuntimeException {

    private final int status;

    public ApiException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
```

**File:** `LoanService.java` in package `com.booknook.lib`

```java
package com.booknook.lib;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoanService {

    public record LoanView(Long id, String book, String member, String borrowedOn, boolean returned) {}

    public record BookView(Long id, String title, int copiesAvailable) {}

    private final BookRepository books;
    private final MemberRepository members;
    private final LoanRepository loans;

    public LoanService(BookRepository books, MemberRepository members, LoanRepository loans) {
        this.books = books;
        this.members = members;
        this.loans = loans;
    }

    @Transactional(readOnly = true)
    public List<BookView> allBooks() {
        return books.findAll().stream()
                .map(b -> new BookView(b.getId(), b.getTitle(), b.getCopiesAvailable()))
                .toList();
    }

    @Transactional
    public LoanView borrow(Long bookId, Long memberId) {
        Book book = books.findById(bookId)
                .orElseThrow(() -> new ApiException(404, "Book " + bookId + " not found"));
        Member member = members.findById(memberId)
                .orElseThrow(() -> new ApiException(404, "Member " + memberId + " not found"));
        book.lendOne();
        return view(loans.save(new Loan(book, member)));
    }

    @Transactional
    public LoanView giveBack(Long loanId) {
        Loan loan = loans.findById(loanId)
                .orElseThrow(() -> new ApiException(404, "Loan " + loanId + " not found"));
        loan.markReturned();
        loan.getBook().takeBackOne();
        return view(loan);
    }

    private LoanView view(Loan loan) {
        return new LoanView(loan.getId(), loan.getBook().getTitle(), loan.getMember().getName(),
                loan.getBorrowedOn().toString(), loan.isReturned());
    }
}
```

**File:** `LibraryController.java` in package `com.booknook.lib`

```java
package com.booknook.lib;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LibraryController {

    public record BorrowRequest(@NotNull Long bookId, @NotNull Long memberId) {}

    private final LoanService service;

    public LibraryController(LoanService service) {
        this.service = service;
    }

    @GetMapping("/books")
    public List<LoanService.BookView> books() {
        return service.allBooks();
    }

    @PostMapping("/loans")
    @ResponseStatus(HttpStatus.CREATED)
    public LoanService.LoanView borrow(@Valid @RequestBody BorrowRequest request) {
        return service.borrow(request.bookId(), request.memberId());
    }

    @PostMapping("/loans/{id}/return")
    public LoanService.LoanView giveBack(@PathVariable Long id) {
        return service.giveBack(id);
    }
}
```

**File:** `ApiExceptionHandler.java` in package `com.booknook.lib`

```java
package com.booknook.lib;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    public record ErrorBody(String error) {}

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorBody> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(new ErrorBody(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorBody> handleInvalid(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest().body(new ErrorBody("bookId and memberId are required"));
    }
}
```

**File:** `LibraryApplication.java` in package `com.booknook.lib`

```java
package com.booknook.lib;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class LibraryApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }

    @Bean
    CommandLineRunner seed(BookRepository books, MemberRepository members) {
        return args -> {
            books.save(new Book("Godan", 1));
            books.save(new Book("Malgudi Days", 2));
            members.save(new Member("Meera"));
        };
    }
}
```

**File:** `LoanApiTest.java` in `src/test/java/com/booknook/lib`

```java
package com.booknook.lib;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class LoanApiTest {

    @Autowired
    MockMvc mvc;

    @Test
    void borrowingAnAvailableBookReturnsCreated() throws Exception {
        mvc.perform(post("/loans").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":2,\"memberId\":1}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.book").value("Malgudi Days"));
    }

    @Test
    void missingFieldsReturnBadRequest() throws Exception {
        mvc.perform(post("/loans").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownBookReturnsNotFound() throws Exception {
        mvc.perform(post("/loans").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookId\":999,\"memberId\":1}"))
                .andExpect(status().isNotFound());
    }
}
```

Run the tests, then start the app and try the API:

```bash
mvn test
mvn spring-boot:run
curl http://localhost:8080/books
curl -X POST -H "Content-Type: application/json" -d '{"bookId":1,"memberId":1}' http://localhost:8080/loans
```

The test run ends with `Tests run: 3, Failures: 0, Errors: 0, Skipped: 0`. We ran the same seven calls against the running app: list the books, borrow Godan twice, send an empty body, return the loan twice, and borrow a missing book.

**Output:**

```json
[{"id":1,"title":"Godan","copiesAvailable":1},{"id":2,"title":"Malgudi Days","copiesAvailable":2}]
{"id":1,"book":"Godan","member":"Meera","borrowedOn":"2026-09-26","returned":false}
{"error":"No copy of 'Godan' is available"}
{"error":"bookId and memberId are required"}
{"id":1,"book":"Godan","member":"Meera","borrowedOn":"2026-09-26","returned":true}
{"error":"Loan 1 was already returned"}
{"error":"Book 9 not found"}
```

The status codes for the seven calls were 200, 201, 409, 400, 200, 409 and 404. The date is the day we ran it.

## Code Explained

- **Entities.** `Book`, `Member` and `Loan` are JPA entities. `Loan` points to a book and a member with `@ManyToOne`, which creates the two foreign key columns. Fetching is lazy, so related rows load only when needed.
- **Rules live with the data.** `Book.lendOne()` refuses to go below zero copies, and `Loan.markReturned()` refuses a second return. The rule cannot be forgotten by a new endpoint.
- **Service.** `LoanService` is marked `@Transactional`. Loading the book, lowering the copy count and saving the loan succeed or fail together. It returns small record views instead of entities, so the JSON stays clean and private data is never exposed.
- **Controller.** `@Valid` on the request body makes Spring check `@NotNull` on both ids before the service runs. A missing id never reaches the database.
- **Errors.** `ApiException` carries a status code and a message. The `@RestControllerAdvice` class turns it, and validation failures, into JSON error bodies with the right status.
- **Seed data.** The `CommandLineRunner` adds two books and one member at start-up. The H2 database lives in memory, so it starts fresh on every run.
- **Test.** `@SpringBootTest` starts the whole app, and `MockMvc` sends requests without a real server. The three tests cover a good request, a bad body and an unknown book.

> **Tip:** Build it in small steps and run after each one: entities first, then repositories, then the service, then the controller, then errors, then tests. A small step that fails is easy to fix.

## Ideas to Extend It

Once it works, make it yours. Add a `POST /books` endpoint, a due date and a late fee. Swap H2 for PostgreSQL by changing the driver and URL. Or protect the endpoints with Spring Security. Each idea uses a topic you have already learned.

## Common Mistakes

> **Warning:** Do not return entities directly from a controller. Lazy links can fail to load outside a transaction, and you may expose fields the client should never see. Return small view records, as this project does.

- **Putting rules in the controller.** The next endpoint will forget them. Keep rules in the service or the entity.
- **Skipping `@Transactional` on a method that changes two things.** A failure between the two steps can leave the data half-updated.
- **Testing only the happy path.** Bad input and missing records are where bugs hide.
- **Trusting the client.** Validate every request body, even when your own front end sends it.

## Interview Questions

**Walk me through your project.**
Say what it does, then the layers: controller, service, repository, database. Mention one hard case, such as protecting the last copy of a book, and how you tested it.

**Why did you use DTOs or view records?**
To control what the API shows and to avoid lazy loading problems with entities.

**How do you make sure two steps succeed together?**
With `@Transactional` on the service method, so a failure rolls both back.

**How did you handle errors?**
With one exception class and a `@RestControllerAdvice` that maps it to a status code and a JSON body.

**How did you test it?**
With `@SpringBootTest` and `MockMvc`, covering success, validation errors and not-found cases.

## Key Points to Remember

- A mini project joins the topics you have learned into one working product.
- Keep layers clear: controller, service, repository.
- Put business rules where they cannot be skipped: the service or the entity.
- Validate input, handle errors in one place and return correct status codes.
- Use `@Transactional` when a method changes more than one thing.
- Write tests for success, bad input and missing data.

## Frequently Asked Questions

### What should my Spring Boot mini project include?

At least a REST API, a database with two or three related tables, validation, one global exception handler and a few tests. A small clear project beats a large unfinished one.

### Which database is best for a mini project?

H2 in memory is the easiest, because there is nothing to install. Move to PostgreSQL or MySQL when you want to show a real database.

### Can I put this Spring Boot mini project on my resume?

Yes. Keep it on GitHub with a short README that lists the endpoints and how to run it, and be ready to explain every class.

### How long does a mini project take?

A weekend for the basic version. Add extra features one at a time afterwards.

## Related Topics

- [Building a Complete CRUD REST API](/learning/spring-boot-tutorial/building-a-complete-crud-rest-api): the base pattern this project follows.
- [One to Many and Many to One Mapping](/learning/spring-boot-tutorial/one-to-many-and-many-to-one-mapping): how the loan links to its book and member.
- [@WebMvcTest and MockMvc](/learning/spring-boot-tutorial/web-mvc-test-and-mockmvc): more on testing controllers.
- [Spring Boot Interview Questions](/learning/spring-boot-tutorial/spring-boot-interview-questions): turn your project into interview answers.
