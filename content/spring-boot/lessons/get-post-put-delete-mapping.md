Think about a tiffin service that delivers lunch boxes to offices. A customer can ask what is on today's menu. They can place a new order. They can change the order, say from a small box to a large one. And they can cancel it. Four actions, four different intentions.

The web has four matching verbs, and Spring Boot gives you one annotation for each. Let's learn GET, POST, PUT and DELETE mapping by using `@GetMapping`, `@PostMapping`, `@PutMapping` and `@DeleteMapping`, and when to use which.

## What are GET, POST, PUT and DELETE mappings?

> **Definition:** `@GetMapping`, `@PostMapping`, `@PutMapping` and `@DeleteMapping` are shortcut annotations for `@RequestMapping`. Each one maps a specific HTTP method, GET, POST, PUT or DELETE, to a controller method.

HTTP has a set of methods that describe what the client wants to do. Together with a data model, they form the four basic actions called CRUD: Create, Read, Update, Delete.

- **GET** reads data. It never changes anything on the server.
- **POST** creates something new. The server decides the new id.
- **PUT** replaces an existing item with the data you send.
- **DELETE** removes an item.

You may hear about **PATCH** too. It changes only some fields of an item. Spring has `@PatchMapping` for it, and it works the same way.

`@GetMapping("/orders")` is exactly the same as writing `@RequestMapping(path = "/orders", method = RequestMethod.GET)`. The shortcut is shorter and easier to read, so it is what you will see in almost every project.

## Why is it used?

A REST API uses the address to say **what** you are talking about, and the HTTP method to say **what to do** with it. Both `GET /orders/1` and `DELETE /orders/1` use the same address. Only the verb differs.

- **Readable code.** Anyone reading `@DeleteMapping` knows what the method does.
- **Safer APIs.** A GET method should not change data. When a client uses GET to read, browsers, caches and search engines can call it freely.
- **Standard behaviour.** Other developers, mobile apps and tools already know what GET or DELETE means.
- **Fewer mistakes.** Because the method is part of the mapping, a client calling `POST` on a GET-only address gets a clear `405` error.

> **Tip:** Name addresses with nouns, like `/orders`, and let the HTTP method be the verb. Avoid `/createOrder` or `/deleteOrder/1`.

## How it works

Each verb has a usual address style and a usual success status. Here is how the four calls line up for an `/orders` resource.

```text
GET    /orders    -> list()
GET    /orders/1  -> one(1)
POST   /orders    -> create(body)
PUT    /orders/1  -> replace(1)
DELETE /orders/1  -> cancel(1)
```

The address plus the verb picks the method. `GET /orders/1` and `DELETE /orders/1` share an address but reach different methods. The list address `/orders` has no id, because it means the whole collection.

Now the journey of a POST call, which carries a body.

```text
Client sends POST /orders
with JSON body
        |
        v
+---------------------------+
| DispatcherServlet finds   |
| the @PostMapping method   |
+---------------------------+
        |
        v
+---------------------------+
| Jackson turns the JSON    |
| into a Java object        |
+---------------------------+
        |
        v
+---------------------------+
| Method saves the order    |
| returns it with 201       |
+---------------------------+
```

The body is read and converted before your method runs, so the method receives a normal Java object. After saving, it returns the new order. We also ask Spring to reply with status `201 Created`, which tells the client a new item was made.

## Real-Life Example

Think of a library card counter. Checking the catalogue is a GET, because you only look. Signing up as a new member is a POST, because a new record is created and the library gives you a number. Updating your address on the card is a PUT, because the old details are replaced with the new ones. Cancelling your membership is a DELETE. The counter is one place, and the action you ask for makes the difference.

## Code Example

Let's build a small order service for HomeBox Tiffin. It keeps orders in memory and supports all four verbs.

```text
homebox/
├─ pom.xml
└─ src/main/java/
   └─ com/homebox/tiffin/
      ├─ TiffinApplication.java
      └─ OrderController.java
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

    <groupId>com.homebox</groupId>
    <artifactId>tiffin</artifactId>
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

**File:** `TiffinApplication.java` in package `com.homebox.tiffin`

```java
package com.homebox.tiffin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TiffinApplication {

    public static void main(String[] args) {
        SpringApplication.run(TiffinApplication.class, args);
    }
}
```

**File:** `OrderController.java` in package `com.homebox.tiffin`

```java
package com.homebox.tiffin;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/orders")
public class OrderController {

    record Order(int id, String customer, String meal) {}
    record OrderRequest(String customer, String meal) {}

    private final Map<Integer, Order> orders = new ConcurrentHashMap<>();
    private final AtomicInteger nextId = new AtomicInteger(1);

    @GetMapping
    public List<Order> list() {
        return new ArrayList<>(orders.values());
    }

    @GetMapping("/{id}")
    public Order one(@PathVariable int id) {
        Order order = orders.get(id);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such order");
        }
        return order;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Order create(@RequestBody OrderRequest request) {
        Order order = new Order(nextId.getAndIncrement(),
                request.customer(), request.meal());
        orders.put(order.id(), order);
        return order;
    }

    @PutMapping("/{id}")
    public Order replace(@PathVariable int id, @RequestBody OrderRequest request) {
        if (!orders.containsKey(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such order");
        }
        Order order = new Order(id, request.customer(), request.meal());
        orders.put(id, order);
        return order;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable int id) {
        if (orders.remove(id) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such order");
        }
    }
}
```

Start the app, then walk through the life of one order. The `-w` flag prints the status code after each reply, on its own line.

```bash
mvn spring-boot:run
curl -w "\n%{http_code}\n" -X POST localhost:8080/orders \
  -H "Content-Type: application/json" \
  -d '{"customer":"Kavita","meal":"Small box"}'
curl -w "\n%{http_code}\n" localhost:8080/orders
curl -w "\n%{http_code}\n" -X PUT localhost:8080/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"customer":"Kavita","meal":"Large box"}'
curl -w "\n%{http_code}\n" -X DELETE localhost:8080/orders/1
curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/orders/1
```

**Output:** the status codes, one per call:

```text
201
200
200
204
404
```

The bodies, spaced out for reading. POST returns the created order:

```json
{
  "id": 1,
  "customer": "Kavita",
  "meal": "Small box"
}
```

The list then holds one order, and PUT returns it with the new meal:

```json
{
  "id": 1,
  "customer": "Kavita",
  "meal": "Large box"
}
```

DELETE answers 204 with an empty body, and the last call finds nothing, so it is 404.

## Code Explained

- `@RequestMapping("/orders")` on the class is the shared prefix, so the methods only add what is different.
- `@GetMapping` with no path answers the list at `/orders`. `@GetMapping("/{id}")` answers one order. The `{id}` part is a placeholder that `@PathVariable` reads. The next topic covers it.
- `@PostMapping` reads the JSON body with `@RequestBody`, saves a new order and returns it. `@ResponseStatus` with `HttpStatus.CREATED` sets the status to 201.
- `@PutMapping("/{id}")` replaces the old order with the new data. It needs the id, and answers 404 if that order does not exist.
- `@DeleteMapping("/{id}")` removes the order. `NO_CONTENT` (204) says the work is done and there is nothing to send back.
- `ResponseStatusException` stops the method and sends the chosen status to the client.
- The map and counter live inside the controller only to keep the example short. A real project keeps them in a service and repository.

## The Four Verbs Side by Side

| Verb | Purpose | Has body? | Usual success status |
|---|---|---|---|
| GET | Read data | No | 200 OK |
| POST | Create new item | Yes | 201 Created |
| PUT | Replace whole item | Yes | 200 OK |
| DELETE | Remove item | No | 204 No Content |

## Common Mistakes

> **Warning:** Do not change data inside a `@GetMapping` method. Browsers, caches and crawlers may call GET addresses on their own. A "delete" done through GET can wipe data when someone just opens a link.

- **Using POST for everything.** It works, but it hides the meaning. Use the verb that matches the action.
- **Forgetting the Content-Type header.** A POST with a JSON body needs `Content-Type: application/json`, or the server answers 415.
- **Assuming PUT updates one field.** PUT replaces the whole item. If you leave a field out, it may become empty. Use PATCH for partial changes.
- **Returning 200 for everything.** A new item should give 201, and a delete with no reply body should give 204.

## Interview Questions

**What is the difference between POST and PUT?**
POST creates a new item, and the server picks its id. PUT replaces an item at a known address with the data you send.

**Is @GetMapping different from @RequestMapping?**
It is a shortcut for `@RequestMapping(method = RequestMethod.GET)`. The behaviour is the same.

**What does idempotent mean, and which verbs are idempotent?**
Repeating the same call gives the same result on the server. GET, PUT and DELETE are idempotent. POST is not, because repeating it creates more items.

**What status should a successful POST return?**
`201 Created`, ideally with the created item in the body.

## Key Points to Remember

- GET reads, POST creates, PUT replaces and DELETE removes.
- Each annotation is a shortcut for `@RequestMapping` with a method set.
- One address can serve several verbs, and the verb chooses the method.
- Use `@ResponseStatus` to send 201 for create and 204 for delete.
- GET must never change data.
- PATCH changes only some fields of an item.

## Frequently Asked Questions

### Can a GET request have a body?

Technically it can, but most tools and servers ignore it. Send data for a GET in the address instead, as a path variable or a query parameter.

### Why does my DELETE call return 405?

The address exists, but no method handles DELETE. Check that you used `@DeleteMapping` and that the path, including the id, matches.

### Do I need all four GET, POST, PUT and DELETE mapping annotations?

Only the ones your API needs. A read-only API needs just `@GetMapping`. Add `@PatchMapping` only when clients should change part of an item, since many small APIs use PUT alone.

### Can I use two verbs on one method?

Yes, with plain `@RequestMapping(method = {GET, POST})`. Clear separate methods are easier to read, so most code avoids it.

## Related Topics

- [@RequestMapping](/learning/spring-boot-tutorial/request-mapping): see the full annotation behind these shortcuts.
- [@PathVariable](/learning/spring-boot-tutorial/path-variable): read the id from the address.
- [@RequestBody](/learning/spring-boot-tutorial/request-body): learn how JSON turns into a Java object.
- [ResponseEntity](/learning/spring-boot-tutorial/responseentity): control status codes and headers yourself.
