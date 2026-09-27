Think about ordering food at a canteen. You say, "One masala dosa, less spicy, with extra chutney." The dish is the main request. "Less spicy" and "extra chutney" are small extra choices that change how the dish is made. Some choices you must make, and some you can skip.

A web address works like that too. After the question mark in an address like `/products?category=phone`, the extra choices travel as query parameters. This topic shows how `@RequestParam` reads them in Spring Boot.

## What is @RequestParam?

> **Definition:** `@RequestParam` is a Spring MVC annotation that binds a query parameter, form field or multipart field from the request to a method parameter.

A query string is the part of a URL after the `?`. It is a list of `name=value` pairs joined with `&`.

```text
/api/products
   ?category=phone
   &page=1
```

Here the first pair is `category=phone` and the second is `page=1`. Each pair becomes a request parameter, and your method can read it by name. The order of the pairs does not matter.

`@RequestParam` gives you these settings.

- `required`: is the parameter compulsory? The default is `true`.
- `defaultValue`: the value to use when the parameter is missing or empty.
- `name` (or `value`): the parameter name, if it differs from the Java variable.

Spring converts the text to the type you write. An `int`, a `boolean`, a `List<String>` and an `Optional<String>` all work. If the conversion fails, the client gets `400 Bad Request`.

## Why is it used?

Some data does not belong in the path. Filters, search words, page numbers and sort order are all optional extras. A query parameter fits them well.

- **Optional filters.** `/products` shows everything, and `/products?category=phone` narrows it down. Same endpoint, different questions.
- **Search.** A search word like `?q=cable` is one value that changes with every call.
- **Paging.** `?page=2&size=10` lets a client walk through long lists.
- **Defaults.** You choose what happens when the client says nothing. A shop can show the first page of results, sorted by name, without the client asking for it.
- **Simple testing.** You can try a query parameter by typing it in the browser address bar. There is no JSON to write.

> **Tip:** A quick rule: the path says **which resource**, and the query string says **how to look at it**. Use `@PathVariable` for the first and `@RequestParam` for the second.

## How it works

When a request arrives, Spring reads each pair from the query string and offers them to your method by name.

```text
GET /api/products?category=phone

        |
        v
+---------------------------+
| Parse query string        |
| category = "phone"        |
+---------------------------+
        |
        v
+---------------------------+
| Bind to method parameters |
| @RequestParam category    |
| @RequestParam maxPrice    |
+---------------------------+
```

The first parameter finds its value in the query string. The second one, `maxPrice`, is missing, so Spring looks at its settings next.

```text
Is the parameter present?
     |            |
    YES           NO
     |            |
     v            v
 convert      Has defaultValue?
 to type       |          |
     |        YES         NO
     v         |          |
 method runs   v          v
          use default  required?
                        |     |
                       YES    NO
                        |     |
                        v     v
                    400 error null
```

This is the whole decision. A present value is converted. A missing value falls back to `defaultValue` if there is one. Without a default, a required parameter gives a 400 error, and an optional one becomes `null`.

## Real-Life Example

Think of a shopping app on your phone. You open the phone section and set "under 20,000 rupees" and "brand: any". The app sends those choices, and shows the first page of results. If you do not touch any filter, it shows all phones. The filters are optional, so the shop has defaults. But if you press "search" with an empty box, the app asks you to type a word. That is a required parameter. It cannot search for nothing.

## Code Example

Let's build a product search API for TechMart. It filters by category and maximum price, pages through the results, needs a search word on one endpoint, and takes a list of ids on another.

```text
techmart/
├─ pom.xml
└─ src/main/java/
   └─ com/techmart/shop/
      ├─ ShopApplication.java
      └─ ProductController.java
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

    <groupId>com.techmart</groupId>
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

**File:** `ShopApplication.java` in package `com.techmart.shop`

```java
package com.techmart.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}
```

**File:** `ProductController.java` in package `com.techmart.shop`

```java
package com.techmart.shop;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    record Product(int id, String name, String category, int priceInRupees) {}

    private final List<Product> products = List.of(
            new Product(1, "Nova X Phone", "phone", 18000),
            new Product(2, "Zen Buds", "audio", 2500),
            new Product(3, "Pixel Lite Phone", "phone", 26000),
            new Product(4, "USB-C Cable", "accessory", 400),
            new Product(5, "Bass Speaker", "audio", 3500));

    @GetMapping
    public List<Product> search(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "100000") int maxPrice,
            @RequestParam(defaultValue = "0") int page) {
        return products.stream()
                .filter(p -> category == null || p.category().equals(category))
                .filter(p -> p.priceInRupees() <= maxPrice)
                .skip(page * 2L)
                .limit(2)
                .toList();
    }

    @GetMapping("/find")
    public String find(@RequestParam("q") String query) {
        return "Searching for " + query;
    }

    @GetMapping("/compare")
    public List<Product> compare(@RequestParam List<Integer> ids) {
        return products.stream().filter(p -> ids.contains(p.id())).toList();
    }
}
```

Start the app, then try these calls. The quotes stop the shell from treating `?` and `&` as special.

```bash
mvn spring-boot:run
curl "localhost:8080/api/products?category=phone"
curl "localhost:8080/api/products?maxPrice=3000&page=0"
curl "localhost:8080/api/products/find?q=cable"
curl "localhost:8080/api/products/compare?ids=1,4"
```

**Output:** the phone filter, spaced out for reading:

```json
[
  {
    "id": 1,
    "name": "Nova X Phone",
    "category": "phone",
    "priceInRupees": 18000
  },
  {
    "id": 3,
    "name": "Pixel Lite Phone",
    "category": "phone",
    "priceInRupees": 26000
  }
]
```

**Output:** cheap items on the first page:

```json
[
  {
    "id": 2,
    "name": "Zen Buds",
    "category": "audio",
    "priceInRupees": 2500
  },
  {
    "id": 4,
    "name": "USB-C Cable",
    "category": "accessory",
    "priceInRupees": 400
  }
]
```

**Output:** search and compare. The search prints its text line, and the compare call prints the JSON below it:

```text
Searching for cable
```

```json
[
  {
    "id": 1,
    "name": "Nova X Phone",
    "category": "phone",
    "priceInRupees": 18000
  },
  {
    "id": 4,
    "name": "USB-C Cable",
    "category": "accessory",
    "priceInRupees": 400
  }
]
```

Now three calls that go wrong. A missing `q`, a `maxPrice` that is not a number, and a page beyond the end:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "localhost:8080/api/products/find"
curl -s -o /dev/null -w "%{http_code}\n" "localhost:8080/api/products?maxPrice=abc"
curl "localhost:8080/api/products?page=9"
```

**Output:**

```text
400
400
[]
```

## Code Explained

- `@RequestParam(required = false) String category` is optional. If the client leaves it out, the value is `null`, and our filter lets every product pass.
- `defaultValue = "100000"` is used when `maxPrice` is missing. It is written as text and converted to `int`. A parameter with a default is never treated as missing.
- `page` defaults to `0`. The code skips `page * 2` items and returns two, so each page has at most two products.
- `@RequestParam("q") String query` names the parameter. The client sends `q`, and the Java variable is `query`.
- Without `required = false` or a default, `q` is required. A call without it answers 400.
- `List<Integer> ids` takes a comma-separated list. `ids=1,4` becomes a list of two numbers.
- `maxPrice=abc` cannot become an `int`, so Spring answers 400.

## Query Parameter Settings at a Glance

| Setting | Effect | Example |
|---|---|---|
| Nothing | Parameter required | `?q=cable` needed |
| `required = false` | Missing gives `null` | `category` above |
| `defaultValue` | Missing gives a fallback | `maxPrice` above |
| `List<T>` type | Comma list or repeated name | `ids=1,4` |

## Common Mistakes

> **Warning:** A primitive such as `int` cannot be `null`. If you write `@RequestParam(required = false) int page` and the client omits it, Spring fails. Use `Integer` or give a `defaultValue`.

- **Forgetting quotes in curl.** Without quotes, the shell reads `&` as "run in background" and cuts your address in half.
- **Wrong parameter name.** The client sends `query` but your annotation says `q`. Spring answers 400, because the required parameter is missing.
- **No paging limit.** A list endpoint with no size limit can return thousands of rows. Always cap the number of results.
- **Using it for secrets.** Query strings show up in logs and browser history. Never send passwords there.

## Interview Questions

**What is the difference between @RequestParam and @PathVariable?**
`@RequestParam` reads from the query string, like `?page=2`. `@PathVariable` reads from the path itself, like `/products/7`.

**Is a @RequestParam required by default?**
Yes. A missing required parameter gives `400 Bad Request`. Set `required = false` or `defaultValue` to relax it.

**How do you accept several values for one parameter?**
Use a `List` parameter. The client sends `ids=1,4` or repeats the name, as in `ids=1&ids=4`.

**What happens if the value has the wrong type?**
Spring cannot convert it and answers `400 Bad Request` before your method runs.

## Key Points to Remember

- A query string is the `name=value` part after `?`, joined with `&`.
- `@RequestParam` reads those pairs into method parameters.
- A parameter is required unless you set `required = false` or `defaultValue`.
- Types convert automatically, and bad values give 400.
- Use it for filters, search words, sort order and paging.
- Quote addresses in curl when they contain `?` or `&`.

## Frequently Asked Questions

### What does @RequestParam do in Spring Boot?

It reads a value from the query string, such as `category=phone`, and passes it to a controller method parameter, converted to the type you declare.

### Can I skip @RequestParam and just name the parameter?

For simple types such as `String` or `int`, Spring still binds a parameter by name. The annotation makes the intent clear and lets you set `required` and `defaultValue`.

### How do I read every parameter at once?

Declare `@RequestParam Map<String, String> all`. It holds every name and value from the request.

### Can @RequestParam be used with POST?

Yes. It reads query parameters in any request, and it also reads the fields of a normal HTML form. For JSON bodies use `@RequestBody`.

## Related Topics

- [@PathVariable](/learning/spring-boot-tutorial/path-variable): identify one item from the address path.
- [@RequestBody](/learning/spring-boot-tutorial/request-body): read a JSON body into a Java object.
- [@RequestMapping](/learning/spring-boot-tutorial/request-mapping): map addresses and conditions to methods.
- [HTTP Status Codes in Spring Boot](/learning/spring-boot-tutorial/http-status-codes-in-spring-boot): understand the 400 replies you saw here.
