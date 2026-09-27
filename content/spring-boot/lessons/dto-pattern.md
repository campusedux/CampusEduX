A hotel keeps a thick file on every booking. It holds the guest's phone number, the room's cost price, a note like "pays late, watch closely", and more. When the guest asks, "Is my booking confirmed?", the desk does not hand over the whole file. It gives a neat slip with the room number, the dates and the total. The file stays inside the hotel.

That slip is a DTO. In this topic you will learn the DTO pattern in Spring Boot, why every serious API uses it, and how to build it with plain Java records.

## What is the DTO pattern?

> **Definition:** A DTO, or Data Transfer Object, is a simple class that carries data between layers or across the network. The DTO pattern means you use separate DTO classes for what comes into and goes out of your API, instead of exposing your internal model directly.

Two words matter here.

- **Entity (or model).** The internal class that matches how you store data. It may have every field, including private ones.
- **DTO.** A class shaped for one specific conversation with a client. It has only the fields that conversation needs.

Most APIs use at least two DTOs for one resource.

- A **request DTO** says what the client may send, such as `BookingRequest`.
- A **response DTO** says what the client may see, such as `BookingResponse`.

A small helper, often called a **mapper**, converts between the entity and the DTOs. Nothing in the pattern needs a special library. A record and a static method are enough.

Here is how the pieces relate for our hotel.

```text
+-------------------+
| GUEST             |
+-------------------+
| PK id             |
| name              |
| phone             |
| loyalty_level     |
+-------------------+
         | 1
         |
         | *
+-------------------+
| BOOKING           |
+-------------------+
| PK id             |
| FK guest_id       |
| room_number       |
| nights            |
| nightly_rate      |
| internal_note     |
+-------------------+
```

The diagram shows two entities. One guest can have many bookings, and each booking points back to its guest with a foreign key. The columns `phone`, `nightly_rate` and `internal_note` are private to the hotel, so a DTO leaves them out when they should not travel.

| Entity | Key fields | Kept private |
|---|---|---|
| Guest | `id`, `name`, `loyalty_level` | `phone` |
| Booking | `id`, `guest_id`, `room_number`, `nights` | `nightly_rate`, `internal_note` |

## Why is it used?

Sending your entity straight to the client is tempting. It is less code. But it causes real trouble.

- **Data leaks.** Any field you add to the entity later, like a phone number or a cost price, is silently sent to every client.
- **Client control.** If clients can post an entity, they can set fields they should never touch, like the `id` or a discount flag. This is called mass assignment.
- **Tight coupling.** When you rename a database column, your public API breaks too. A DTO lets the inside change while the outside stays the same.
- **Right shape.** A screen may need a total price that no table stores. A response DTO can carry it.
- **Clear contract.** Anyone reading `BookingRequest` sees exactly what the API accepts.

> **Tip:** A quick test. If a field should not appear in the public API, it should not be in a DTO. The safest habit is to never return an entity from a controller.

## How it works

The DTO stands at the border between the outside world and your code. Data is translated when it crosses.

```text
Client sends JSON
       |
       v
+---------------------------+
| BookingRequest (DTO)      |
+---------------------------+
       |  mapper
       v
+---------------------------+
| Booking (entity)          |
| service works on this     |
+---------------------------+
       |  mapper
       v
+---------------------------+
| BookingResponse (DTO)     |
+---------------------------+
       |
       v
Client receives JSON
```

The controller reads a `BookingRequest`. The mapper turns it into a `Booking`, and the rest of your code works with the entity. On the way out, the mapper builds a `BookingResponse`. The entity itself never leaves the building.

Here is what each class holds.

```text
BookingRequest   BookingResponse
--------------   ---------------
guestName        id
roomNumber       guestName
nights           roomNumber
                 nights
                 totalPrice

Booking (entity) also has:
  nightlyRate, internalNote
```

The request has only what the client may choose. The response adds a `totalPrice` that is calculated, and skips the two private fields. The entity keeps everything.

## Real-Life Example

Think of a restaurant menu and the kitchen's order sheet. The menu shows the dish name, a picture and the price. The kitchen sheet also shows the cost of ingredients, the profit margin and the chef's notes. If the restaurant printed the kitchen sheet for guests, they would see how much profit is made on every plate. So there are two documents about the same dish. The menu is the DTO, the sheet is the entity.

## Code Example

Let's build a booking API for StayEasy Hotels. It keeps a `Booking` entity with private fields, and exposes DTOs. We also add one deliberately unsafe endpoint that returns the entity, so you can see the leak.

```text
stayeasy/
├─ pom.xml
└─ src/main/java/
   └─ com/stayeasy/hotel/
      ├─ HotelApplication.java
      ├─ Booking.java
      ├─ BookingRequest.java
      ├─ BookingResponse.java
      ├─ BookingMapper.java
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

    <groupId>com.stayeasy</groupId>
    <artifactId>hotel</artifactId>
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

**File:** `HotelApplication.java` in package `com.stayeasy.hotel`

```java
package com.stayeasy.hotel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HotelApplication {

    public static void main(String[] args) {
        SpringApplication.run(HotelApplication.class, args);
    }
}
```

**File:** `Booking.java` in package `com.stayeasy.hotel`

```java
package com.stayeasy.hotel;

public record Booking(int id, String guestName, int roomNumber, int nights,
                      int nightlyRate, String internalNote) {}
```

**File:** `BookingRequest.java` in package `com.stayeasy.hotel`

```java
package com.stayeasy.hotel;

public record BookingRequest(String guestName, int roomNumber, int nights) {}
```

**File:** `BookingResponse.java` in package `com.stayeasy.hotel`

```java
package com.stayeasy.hotel;

public record BookingResponse(int id, String guestName, int roomNumber,
                              int nights, int totalPrice) {}
```

**File:** `BookingMapper.java` in package `com.stayeasy.hotel`

```java
package com.stayeasy.hotel;

public final class BookingMapper {

    private static final int STANDARD_RATE = 3000;

    private BookingMapper() {}

    public static Booking toEntity(int id, BookingRequest request) {
        return new Booking(id, request.guestName(), request.roomNumber(),
                request.nights(), STANDARD_RATE, "new booking");
    }

    public static BookingResponse toResponse(Booking booking) {
        return new BookingResponse(booking.id(), booking.guestName(),
                booking.roomNumber(), booking.nights(),
                booking.nights() * booking.nightlyRate());
    }
}
```

**File:** `BookingController.java` in package `com.stayeasy.hotel`

```java
package com.stayeasy.hotel;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final Map<Integer, Booking> store = new ConcurrentHashMap<>();
    private final AtomicInteger nextId = new AtomicInteger(1);

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse create(@RequestBody BookingRequest request) {
        Booking booking = BookingMapper.toEntity(nextId.getAndIncrement(), request);
        store.put(booking.id(), booking);
        return BookingMapper.toResponse(booking);
    }

    @GetMapping("/{id}")
    public BookingResponse one(@PathVariable int id) {
        return BookingMapper.toResponse(find(id));
    }

    @GetMapping("/{id}/unsafe")
    public Booking unsafe(@PathVariable int id) {
        return find(id);
    }

    private Booking find(int id) {
        Booking booking = store.get(id);
        if (booking == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such booking");
        }
        return booking;
    }
}
```

Start the app, create a booking, then read it two ways. The client tries to sneak in `nightlyRate` and `id`, which the request DTO does not have.

```bash
mvn spring-boot:run
curl -X POST localhost:8080/bookings \
  -H "Content-Type: application/json" \
  -d '{"guestName":"Meera Joshi","roomNumber":204,"nights":2,"nightlyRate":1,"id":99}'
curl localhost:8080/bookings/1
curl localhost:8080/bookings/1/unsafe
```

**Output:** the safe reply from the DTO (the same for the POST and the first GET), spaced out for reading:

```json
{
  "id": 1,
  "guestName": "Meera Joshi",
  "roomNumber": 204,
  "nights": 2,
  "totalPrice": 6000
}
```

**Output:** the unsafe reply that returns the entity:

```json
{
  "id": 1,
  "guestName": "Meera Joshi",
  "roomNumber": 204,
  "nights": 2,
  "nightlyRate": 3000,
  "internalNote": "new booking"
}
```

## Code Explained

- `Booking` is the entity. It holds `nightlyRate` and `internalNote`, which only the hotel should see.
- `BookingRequest` has just three fields. The client cannot set the `id`, the rate or the note, because the record has no place for them.
- `BookingResponse` has no private fields, and adds `totalPrice`, which no stored field holds.
- `BookingMapper` is the only place that knows both shapes. Its constructor is private, and all methods are static. It picks the rate and the note itself, so the client cannot.
- The POST above sent `"nightlyRate":1` and `"id":99`. Jackson ignored them, since `BookingRequest` has no such fields. The new booking got id 1 and a total of 6000, priced at the hotel's own rate.
- `/unsafe` returns the entity, and you can see how `nightlyRate` and `internalNote` leak. This endpoint exists only to teach. Never write it in real code.
- All the work with entities stays inside the controller and mapper. A real project puts it in a service.

## Entity and DTO at a Glance

| Point | Entity | DTO |
|---|---|---|
| Purpose | Matches storage and business rules | Matches one API conversation |
| Fields | All of them | Only what is needed |
| Sent to clients? | Never | Yes |
| Changes with the database? | Yes | No, unless the API changes |
| Typical name | `Booking` | `BookingRequest`, `BookingResponse` |

## Common Mistakes

> **Warning:** Do not accept an entity as `@RequestBody`. A client could send an `id`, a price or a role field and overwrite data it should never control. Always accept a request DTO.

- **Returning the entity "just for now".** Temporary shortcuts stay for years. Build the response DTO from the start.
- **One DTO for everything.** A single class for create, update and read forces you to make fields optional or hidden. Keep separate request and response DTOs.
- **Mapping in the controller everywhere.** Copying fields by hand in many places invites mistakes. Keep the conversion in one mapper.
- **Exposing nested entities.** A DTO that holds an entity inside it leaks the entity too. Nested objects should be DTOs as well.

## Interview Questions

**What is a DTO?**
A Data Transfer Object is a simple class that carries data between layers or to a client, shaped for one purpose.

**Why not return the entity from a controller?**
It can leak private fields, couples the API to the database, and makes future changes risky.

**What is mass assignment?**
When a client sets fields it should not control, because the request maps straight onto an entity. A request DTO prevents it.

**Do you need a library like MapStruct for DTOs?**
No. Records and a small mapper class are enough. Libraries help when there are many classes to map.

## Key Points to Remember

- A DTO carries data in or out of the API. An entity models stored data.
- Use a request DTO and a response DTO for each resource.
- A mapper converts between entity and DTO in one place.
- DTOs stop data leaks and mass assignment.
- Records make DTOs short and immutable.
- The entity never leaves the service layer.

## Frequently Asked Questions

### What is the DTO pattern in Spring Boot?

It means using separate classes for data going in and out of your API, so the internal entity is never exposed. Spring Boot does not force it, but professional projects follow it.

### Can a Java record be a DTO?

Yes, and it is the best fit. A record is short, immutable and works with Jackson without extra code.

### Is a DTO the same as an entity?

No. An entity models stored data, and can have private fields. A DTO is shaped for a client and holds only what that client needs.

### Do I need a separate DTO for update requests?

Often yes. Update rules differ from create rules, for example the guest name may not change after booking. A separate `BookingUpdateRequest` keeps that clear.

## Related Topics

- [@RequestBody](/learning/spring-boot-tutorial/request-body): learn how request DTOs are read from JSON.
- [ResponseEntity](/learning/spring-boot-tutorial/responseentity): wrap response DTOs with the right status.
- [Building a Complete CRUD REST API](/learning/spring-boot-tutorial/building-a-complete-crud-rest-api): use DTOs across all four actions.
- [JPA Entity](/learning/spring-boot-tutorial/jpa-entity): see the entity side of the pattern.
