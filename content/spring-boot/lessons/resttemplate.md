A bakery runs out of flour at seven in the morning. The owner does not drive to the mill. She phones the supplier, asks the price, places an order and gets a confirmation. Your Spring Boot app often has the same need. It must call another company's API, such as a payment service or a price list, and use the answer. RestTemplate is the classic tool for making those calls.

Let's see what RestTemplate is, how a call travels, and how to write a bakery app that asks a supplier for prices, places an order and handles errors.

## What is RestTemplate?

> **Definition:** RestTemplate is a Spring class that lets your code call other HTTP services. You give it a URL and a result type, and it sends the request, waits for the reply and converts the JSON body into a Java object.

Your controllers receive requests. RestTemplate does the opposite: it sends them. It is a **synchronous** client, which means your thread waits until the reply arrives. That makes code easy to read, top to bottom.

> **Note:** Spring's own guides now point new code to `RestClient` (same simple style) and to WebClient (non-blocking). RestTemplate is still part of Spring Framework 7 and works fine, and millions of lines of existing code use it, so you need to read and write it. You will meet WebClient in the next topics.

## Why is it used?

Modern systems are made of many small services. A shop service asks a stock service, and the stock service asks a warehouse service. Each call is an HTTP request. Without a helper, you would open connections, write headers, read bytes and parse JSON yourself. RestTemplate hides all that:

- **One line per call.** `getForObject` sends a GET and gives back a Java object.
- **Automatic JSON.** The same message converters that your controllers use turn JSON into records.
- **URL templates.** `/prices/{item}` fills in `{item}` for you and encodes special characters.
- **Headers and timeouts.** Add an API key or stop waiting after two seconds.
- **Clear errors.** A 404 or 500 reply becomes an exception you can catch.

## How it works

Here is one call, from the bakery to the supplier and back.

```text
BakeryController
  |  getForObject(url, Price)
  v
RestTemplate
  |  builds the request
  |  adds headers
  v
HTTP GET to the supplier
  |
  v
Supplier replies with JSON
  |
  v
Message converter (Jackson)
  |  JSON -> Price object
  v
Back in your controller
```

Your controller hands RestTemplate the address and the type you expect. RestTemplate sends the request, and Jackson turns the JSON body into a `Price` object. If the supplier answers with a 4xx or 5xx status, RestTemplate throws an exception instead of returning, so a bad reply never sneaks in as a normal object.

## Real-Life Example

Think of a restaurant that buys vegetables from a wholesale market. The chef writes what he needs on a slip and sends a boy with it. The boy runs to the market, gets the price, brings it back and the chef decides. If the market is closed, the boy returns and says so. RestTemplate is that boy. You give it the slip (URL and headers), it does the running, and it reports success or failure.

## Code Example

BakeHouse buys flour, sugar and butter from a supplier. To keep the example runnable on one machine, the supplier's API lives in the same app under `/supplier`. Imagine it is another company. The bakery side calls it only through RestTemplate. We add the web starter and the REST client starter, which holds `RestTemplateBuilder` in Spring Boot 4.

```text
bakehouse-orders/
├─ pom.xml
└─ src/main/
   ├─ java/com/bakehouse/orders/
   │  ├─ OrdersApplication.java
   │  ├─ SupplierController.java
   │  └─ BakeryController.java
   └─ resources/
      └─ application.properties
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

    <groupId>com.bakehouse</groupId>
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
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-restclient</artifactId>
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
supplier.base-url=http://localhost:${server.port:8080}/supplier
```

**File:** `OrdersApplication.java` in package `com.bakehouse.orders`

```java
package com.bakehouse.orders;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.restclient.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.DefaultUriBuilderFactory;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }

    @Bean
    RestTemplate supplierClient(RestTemplateBuilder builder,
                                @Value("${supplier.base-url}") String baseUrl) {
        return builder
                .uriTemplateHandler(new DefaultUriBuilderFactory(baseUrl))
                .connectTimeout(Duration.ofSeconds(2))
                .readTimeout(Duration.ofSeconds(3))
                .build();
    }
}
```

**File:** `SupplierController.java` in package `com.bakehouse.orders`

```java
package com.bakehouse.orders;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Pretend this is another company's API. */
@RestController
@RequestMapping("/supplier")
public class SupplierController {

    record Price(String item, int perKgInRupees) {}
    record SupplyOrder(String item, int kg) {}
    record Confirmation(String orderId, String item, int kg, int totalInRupees) {}

    private final Map<String, Integer> prices = Map.of("flour", 42, "sugar", 48, "butter", 520);

    @GetMapping("/prices/{item}")
    public Price price(@PathVariable String item) {
        Integer perKg = prices.get(item);
        if (perKg == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown item " + item);
        }
        return new Price(item, perKg);
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public Confirmation order(@RequestBody SupplyOrder order,
                              @RequestHeader(value = "X-Api-Key", required = false) String key) {
        if (!"bake-secret".equals(key)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or wrong key");
        }
        return new Confirmation("SUP-1001", order.item(), order.kg(), order.kg() * prices.get(order.item()));
    }
}
```

**File:** `BakeryController.java` in package `com.bakehouse.orders`

```java
package com.bakehouse.orders;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@RestController
public class BakeryController {

    record Price(String item, int perKgInRupees) {}
    record SupplyOrder(String item, int kg) {}
    record Confirmation(String orderId, String item, int kg, int totalInRupees) {}

    private final RestTemplate supplier;

    public BakeryController(RestTemplate supplier) {
        this.supplier = supplier;
    }

    @GetMapping("/bakery/cost")
    public String cost(@RequestParam String item, @RequestParam int kg) {
        Price price = supplier.getForObject("/prices/{item}", Price.class, item);
        return kg + " kg of " + item + " costs Rs " + kg * price.perKgInRupees();
    }

    @GetMapping("/bakery/status/{item}")
    public String status(@PathVariable String item) {
        ResponseEntity<Price> reply = supplier.getForEntity("/prices/{item}", Price.class, item);
        return "Supplier answered " + reply.getStatusCode() + " for " + reply.getBody().item();
    }

    @GetMapping("/bakery/safe-cost/{item}")
    public String safeCost(@PathVariable String item) {
        try {
            Price price = supplier.getForObject("/prices/{item}", Price.class, item);
            return item + " is Rs " + price.perKgInRupees() + " per kg";
        } catch (HttpClientErrorException.NotFound e) {
            return "Supplier does not sell " + item;
        }
    }

    @PostMapping("/bakery/restock")
    public Confirmation restock(@RequestParam String item, @RequestParam int kg) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", "bake-secret");
        HttpEntity<SupplyOrder> request = new HttpEntity<>(new SupplyOrder(item, kg), headers);
        return supplier.exchange("/orders", HttpMethod.POST, request, Confirmation.class).getBody();
    }
}
```

Start the app and try the four bakery endpoints:

```bash
mvn spring-boot:run
curl "localhost:8080/bakery/cost?item=flour&kg=10"
curl localhost:8080/bakery/status/sugar
curl localhost:8080/bakery/safe-cost/saffron
curl -X POST "localhost:8080/bakery/restock?item=butter&kg=2"
```

**Output:**

```text
10 kg of flour costs Rs 420
Supplier answered 200 OK for sugar
Supplier does not sell saffron
```

The restock call prints the confirmation from the supplier:

```json
{
  "orderId": "SUP-1001",
  "item": "butter",
  "kg": 2,
  "totalInRupees": 1040
}
```

## Code Explained

- `RestTemplateBuilder` is a Spring Boot helper that creates a RestTemplate with sensible defaults. We set a two second connect timeout and a three second read timeout, so a slow supplier cannot freeze our app.
- A `DefaultUriBuilderFactory` built from the base address gives the client a base address. Later calls only need `/prices/{item}`. The old `rootUri` method on the builder is marked for removal in Spring Boot 4, so we use this instead.
- `getForObject` sends a GET and returns the body as a `Price` record. The value after the type fills the `{item}` placeholder.
- `getForEntity` returns a `ResponseEntity`, so you can read the status code and headers as well as the body.
- `exchange` is the most flexible method. We use it to send a POST with a custom header, `X-Api-Key`, inside an `HttpEntity`.
- The `NotFound` subclass of `HttpClientErrorException` is thrown for a 404, and we catch it to give a friendly answer.
- The `${server.port:8080}` placeholder in `application.properties` means the app calls itself on whatever port it runs on.

## Common RestTemplate Methods

| Method | What it does |
|---|---|
| `getForObject` | GET, returns the body only |
| `getForEntity` | GET, returns status, headers and body |
| `postForObject` | POST a body, returns the reply body |
| `postForEntity` | POST a body, returns the whole reply |
| `put` and `delete` | PUT or DELETE, no reply body |
| `exchange` | Any method, custom headers, generic types |

To read a list such as `List<Doctor>`, plain `Doctor.class` is not enough because Java erases generics at runtime. Use `exchange` with a `ParameterizedTypeReference`, as the practice section shows.

## What Happens on Errors

We asked the price of saffron, which the supplier does not sell. Our `safe-cost` method caught the 404. The plain `cost` method did not catch anything, so the exception travelled up and the caller got status 500:

```json
{
  "timestamp": "2026-09-26T17:08:40.327Z",
  "status": 500,
  "error": "Internal Server Error",
  "path": "/bakery/cost"
}
```

The log shows the real cause, a `404 Not Found on GET request` with the full URL. Two exception families matter:

- `HttpClientErrorException` for 4xx replies, and `HttpServerErrorException` for 5xx replies.
- `ResourceAccessException` when the server cannot be reached or times out.

All of them extend `RestClientException`.

> **Tip:** Never create a new RestTemplate for every request. Build it once as a bean, with timeouts, and inject it where needed.

## Common Mistakes

- **No timeouts.** A plain RestTemplate can wait a very long time. One slow supplier then blocks your threads and your whole app stalls.
- **Hard-coded URLs.** Put base addresses in `application.properties`, so test and production can differ.
- **Building URLs by adding strings.** Use `{item}` placeholders so encoding is handled for you.
- **Ignoring errors.** A 404 from the other service becomes a 500 from yours unless you catch it and decide what to say.
- **Sending secrets in the URL.** Put API keys in headers, never in the query string, because URLs end up in logs.

## Interview Questions

**What is RestTemplate used for?**
It is a synchronous client for calling REST services. You pass a URL and a type, and it returns the converted response.

**What is the difference between getForObject and getForEntity?**
`getForObject` returns only the body. `getForEntity` returns a `ResponseEntity` that also has the status and headers.

**How do you read a list of objects with RestTemplate?**
Use `exchange` with a `ParameterizedTypeReference`, for example `List<Doctor>`, because the list's item type is lost at runtime.

**RestTemplate or WebClient?**
RestTemplate blocks the thread and is simple. WebClient is non-blocking and can also run in blocking style. For new code, Spring suggests RestClient or WebClient.

## Key Points to Remember

- RestTemplate calls other HTTP services from your Spring Boot code.
- It is synchronous: your thread waits for the answer.
- Build it once as a bean with `RestTemplateBuilder`, and always set timeouts.
- `getForObject`, `postForObject` and `exchange` cover most needs.
- 4xx and 5xx replies become exceptions; catch the ones you can handle.
- In Spring Boot 4, `RestTemplateBuilder` comes from the REST client starter.

## Frequently Asked Questions

### Is RestTemplate deprecated?

Not in Spring Framework 7.0; our build shows no deprecation warning for the class. Spring's guides recommend RestClient for new synchronous code, though, so treat RestTemplate as a legacy but working tool.

### How do I send a POST request with RestTemplate?

Use `postForObject(url, body, Reply.class)` for simple cases. If you need headers, wrap the body in an `HttpEntity` and call `exchange`, as `restock` does above.

### Can RestTemplate be used without Spring Boot?

Yes. You can write `new RestTemplate()` anywhere in a Spring project. The builder just adds Boot's defaults.

### How do I test code that uses RestTemplate?

Point the base URL at a small fake server, or use `MockRestServiceServer` from Spring's test library to return canned replies without any network.

## Related Topics

- [WebClient in Spring Boot](/learning/spring-boot-tutorial/webclient-in-spring-boot): the non-blocking client that Spring recommends for reactive code.
- [ResponseEntity](/learning/spring-boot-tutorial/responseentity): see the reply type that getForEntity gives you.
- [HTTP Status Codes in Spring Boot](/learning/spring-boot-tutorial/http-status-codes-in-spring-boot): understand the 4xx and 5xx replies you must handle.
- [Introduction to Microservices with Spring Boot](/learning/spring-boot-tutorial/introduction-to-microservices-with-spring-boot): see why services call each other.
