When you order a parcel, you get more than the box. You get a delivery slip that says "delivered", "not found at this address" or "payment pending". You also get notes on the outside: a tracking number, a return address. The parcel is the body. The slip and the notes are the status and headers.

A web reply is the same. It has a status code, headers and a body. `ResponseEntity` is how Spring Boot lets you control all three in one object. This topic shows you how.

## What is ResponseEntity?

> **Definition:** `ResponseEntity<T>` is a Spring class that represents a complete HTTP response: the status code, the headers and the body of type `T`. Returning it from a controller gives you full control over what the client receives.

So far, our methods returned plain objects. Spring then wrapped them with a `200 OK` status and no special headers. That is fine for simple reads. But real APIs often need to say more.

- "The booking was created, and here is its address." That needs status 201 and a `Location` header.
- "There is no such booking." That needs status 404.
- "Deleted, nothing to send back." That needs status 204 and no body.
- "The seat is already taken." That needs status 409 and a message.

`ResponseEntity` handles all these. It has a friendly builder. `ResponseEntity.ok(body)` gives 200. `ResponseEntity.created(uri)` gives 201 with a `Location` header. `notFound().build()` gives 404. `noContent().build()` gives 204. `ResponseEntity.status(...)` sets any status you like.

The type in the angle brackets is the type of the body. Use `ResponseEntity<Void>` when there is no body.

## Why is it used?

Different situations need different answers, and a plain return value can give only one.

- **Right status for each case.** One method can return 200 in the happy case and 404 when nothing is found.
- **Custom headers.** You can send a `Location`, a cache rule or your own `X-` header.
- **Clear API contract.** Clients can trust the status code instead of guessing from the body.
- **No hidden exceptions.** You decide the answer right in the method, in plain code.

> **Tip:** For a simple method that always succeeds, return the plain object. Use `ResponseEntity` when the answer changes with the situation or when you need headers.

## How it works

Your method builds a `ResponseEntity` and returns it. Spring reads its three parts and writes them onto the reply.

```text
Controller method
      |
      |  returns ResponseEntity
      v
+---------------------------+
| Status  : 201 Created     |
| Headers : Location        |
| Body    : Booking object  |
+---------------------------+
      |
      v
+---------------------------+
| Body goes to Jackson      |
| Status + headers copied   |
+---------------------------+
      |
      v
   HTTP reply to client
```

The body is turned into JSON by the message converter, just as before. The status and headers are copied straight onto the reply. With a plain return value, Spring would fill in the status and headers by itself. With `ResponseEntity`, you decide.

Now see how a single method can choose between answers.

```text
GET /bookings/{id}
        |
        v
+---------------------------+
| Look up the booking       |
+---------------------------+
      |               |
    found          not found
      |               |
      v               v
+-------------+  +-------------+
| ok(booking) |  | notFound()  |
| 200 + JSON  |  | 404, empty  |
+-------------+  +-------------+
```

The lookup decides the branch. Both branches return the same Java type, `ResponseEntity`, so the method compiles cleanly.

## Real-Life Example

Think of a railway ticket counter. You ask for a seat. If one is free, the clerk hands you a ticket, and a slip with the booking number, which is a 201 with a `Location`. If the train is full, the clerk says, "Sorry, no seats", which is a 409 with a message. If you ask for a train that does not exist, the clerk says, "No such train", which is a 404. Same counter, same question, three different answers. The clerk is `ResponseEntity`.

## Code Example

Let's build a booking API for Starlight Cinema. It reads a booking, creates one, refuses a double booking of the same seat, cancels a booking and sends a custom header with a ticket.

```text
starlight/
├─ pom.xml
└─ src/main/java/
   └─ com/starlight/cinema/
      ├─ CinemaApplication.java
      └─ BookingController.java
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

    <groupId>com.starlight</groupId>
    <artifactId>cinema</artifactId>
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

**File:** `CinemaApplication.java` in package `com.starlight.cinema`

```java
package com.starlight.cinema;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CinemaApplication {

    public static void main(String[] args) {
        SpringApplication.run(CinemaApplication.class, args);
    }
}
```

**File:** `BookingController.java` in package `com.starlight.cinema`

```java
package com.starlight.cinema;

import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    record Booking(int id, String movie, String seat) {}
    record BookingRequest(String movie, String seat) {}
    record Message(String text) {}

    private final Map<Integer, Booking> bookings = new ConcurrentHashMap<>();
    private final AtomicInteger nextId = new AtomicInteger(1);

    @GetMapping("/{id}")
    public ResponseEntity<Booking> one(@PathVariable int id) {
        Booking booking = bookings.get(id);
        if (booking == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(booking);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody BookingRequest request) {
        boolean taken = bookings.values().stream().anyMatch(b ->
                b.movie().equals(request.movie()) && b.seat().equals(request.seat()));
        if (taken) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new Message("Seat already booked"));
        }
        Booking booking = new Booking(nextId.getAndIncrement(),
                request.movie(), request.seat());
        bookings.put(booking.id(), booking);
        return ResponseEntity.created(URI.create("/bookings/" + booking.id()))
                .body(booking);
    }

    @GetMapping("/{id}/ticket")
    public ResponseEntity<String> ticket(@PathVariable int id) {
        if (!bookings.containsKey(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header("X-Ticket-Source", "web")
                .body("Ticket for booking " + id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable int id) {
        return bookings.remove(id) == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.noContent().build();
    }
}
```

Start the app. The first call books a seat. The flag `-i` prints the status line and headers along with the body, and `grep` keeps only the lines we care about.

```bash
mvn spring-boot:run
curl -si -X POST localhost:8080/bookings \
  -H "Content-Type: application/json" \
  -d '{"movie":"Monsoon Express","seat":"C7"}' \
  | grep -E "^(HTTP|Location|Content-Type)"
```

**Output:** the status line and two headers:

```text
HTTP/1.1 201
Location: /bookings/1
Content-Type: application/json
```

The body of that reply, spaced out for reading:

```json
{
  "id": 1,
  "movie": "Monsoon Express",
  "seat": "C7"
}
```

Now try the other cases. Booking the same seat again, reading a booking that does not exist, reading the ticket, and cancelling:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:8080/bookings \
  -H "Content-Type: application/json" \
  -d '{"movie":"Monsoon Express","seat":"C7"}'
curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/bookings/9
curl -si localhost:8080/bookings/1/ticket | grep -E "^(HTTP|X-Ticket|Ticket)"
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE localhost:8080/bookings/1
```

**Output:** the conflict status, then the 404, the ticket lines and the delete status:

```text
409
404
HTTP/1.1 200
X-Ticket-Source: web
Ticket for booking 1
204
```

The double booking also sends a body, `{"text":"Seat already booked"}`, that explains the 409.

## Code Explained

- `ResponseEntity<Booking>` says the body type is `Booking`. The method can return `ok(booking)` or `notFound().build()`.
- `notFound().build()` has no body, so `build()` finishes the entity.
- `ResponseEntity<?>` in `create` allows two different body types: a `Booking` on success and a `Message` on conflict.
- `ResponseEntity.created(uri)` sets 201 and the `Location` header, which tells the client where the new booking lives.
- `status(HttpStatus.CONFLICT)` sets any status you like, here 409.
- `.header("X-Ticket-Source", "web")` adds a custom header before the body.
- `ResponseEntity<Void>` in `cancel` means there is never a body. `noContent()` gives 204.

## Common Builders at a Glance

| Builder | Status | Typical use |
|---|---|---|
| `ok(body)` | 200 | Successful read |
| `created(uri).body(x)` | 201 | New item made |
| `noContent().build()` | 204 | Deleted, nothing to say |
| `badRequest().body(x)` | 400 | Client sent bad data |
| `notFound().build()` | 404 | No such item |
| `status(code).body(x)` | Any | Anything else |

## Common Mistakes

> **Warning:** Do not return `ResponseEntity.ok(null)` when an item is missing. The client gets `200` with an empty body and thinks the call worked. Return `notFound()` instead.

- **Forgetting `build()`.** `ResponseEntity.notFound()` returns a builder, not a finished entity. Call `.build()`.
- **Wrong status for create.** A new item should give 201 with a `Location`, not a plain 200.
- **Body with 204.** A 204 reply must have no body. Use `noContent().build()`.
- **Overusing it.** If every method needs the same error handling, an exception handler is cleaner. A later topic on status codes covers it.

## Interview Questions

**What is ResponseEntity?**
It is a Spring class that wraps the whole HTTP response: status, headers and body.

**When should you use ResponseEntity instead of returning an object?**
When the status or headers change with the situation, such as 201 with a `Location`, or 404 for a missing item.

**How do you return 201 Created with a Location header?**
Use `created(uri).body(item)` on `ResponseEntity`, where `uri` is the address of the new item.

**What does ResponseEntity<Void> mean?**
The response has no body, as with a 204 after a delete.

## Key Points to Remember

- `ResponseEntity<T>` holds status, headers and body.
- `ok`, `created`, `noContent`, `notFound` and `status` build the common answers.
- Call `build()` when there is no body.
- Use `Void` for an empty body and `?` when the body type varies.
- A new item should return 201 with a `Location` header.
- Plain objects are fine when the answer is always 200.

## Frequently Asked Questions

### What is ResponseEntity in Spring Boot?

It is a wrapper for the full HTTP reply. You use it to set the status code, headers and body from your controller method.

### Is ResponseEntity required for REST APIs?

No. Plain return values work for simple cases. Use `ResponseEntity` when you need different statuses, headers or empty replies.

### Can I return different body types from one method?

Yes, with `ResponseEntity<?>`. The success path can return one type and the error path another.

### What is the difference between @ResponseStatus and ResponseEntity?

`@ResponseStatus` fixes one status for the method. `ResponseEntity` lets the method choose the status each time it runs.

## Related Topics

- [HTTP Status Codes in Spring Boot](/learning/spring-boot-tutorial/http-status-codes-in-spring-boot): pick the right code for each situation.
- [@RequestBody](/learning/spring-boot-tutorial/request-body): read the JSON that creates an item.
- [DTO Pattern](/learning/spring-boot-tutorial/dto-pattern): shape the body you send back.
- [Building a Complete CRUD REST API](/learning/spring-boot-tutorial/building-a-complete-crud-rest-api): use ResponseEntity across all four actions.
