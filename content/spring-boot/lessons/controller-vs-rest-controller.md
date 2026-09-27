A bakery has two windows. At the front counter, a person hands you a paper bag with a cake, ready to eat. At the back door, the delivery driver takes a packing list with the names and prices, so the shop across town can plan its orders. Both windows come from the same kitchen. Only the form of the answer is different.

The choice between @Controller and @RestController comes from the same idea. Spring has two controller annotations for the same reason. `@Controller` is built for web pages. `@RestController` is built for data. Let's see when to use each.

## What is the difference between @Controller and @RestController?

> **Definition:** `@Controller` marks a class that handles web requests and returns the name of a view, such as an HTML page. `@RestController` is a shortcut for `@Controller` plus `@ResponseBody`, so every method returns data that is written straight into the response body.

Here is the key idea. What a method returns is not always the response itself.

- In a `@Controller`, a returned `String` is treated as a **view name**. Spring looks for a page with that name.
- In a `@RestController`, a returned value **is** the response. A `String` becomes plain text. An object or a list becomes JSON.

`@ResponseBody` is the annotation that switches the second behaviour on. Put it on a method inside a `@Controller`, and that one method returns data. Put it on the class, or use `@RestController`, and every method does.

## Why is it used?

Most Spring Boot projects today are REST APIs, so you will write `@RestController` far more often. The older `@Controller` still matters in a few cases.

- **Server-side pages.** With a template engine such as Thymeleaf, a `@Controller` picks the page and fills it with data.
- **Redirects and forwards.** A `@Controller` can send the visitor to another URL with `redirect:` or `forward:`.
- **Mixed apps.** One app can show a few HTML pages and also offer a JSON API. Each class uses the annotation that fits.

Choosing the right one avoids strange errors. If you use `@Controller` and forget `@ResponseBody`, Spring searches for a page that does not exist.

> **Tip:** Building an API for a React, Angular or mobile app? Use `@RestController`. Building pages that the server renders? Use `@Controller`.

## How it works

Both annotations start the same way. The DispatcherServlet finds the method and calls it. The difference is what happens to the value the method returns.

```text
Method returns a value
        |
        v
+---------------------------+
| Is the method marked      |
| @ResponseBody?            |
| (@RestController counts)  |
+---------------------------+
      |               |
     YES              NO
      |               |
      v               v
+-------------+  +-------------+
| Message     |  | View        |
| converter   |  | resolver    |
| writes body |  | finds page  |
+-------------+  +-------------+
      |               |
      v               v
  JSON or text     HTML page
```

If the method is marked `@ResponseBody`, the returned value goes to a message converter. Jackson writes objects as JSON, and text is written as it is. If the method is not marked, the value is a view name, and a view resolver looks for a matching page. If no page matches, the user sees an error.

Now see how a `forward:` works, which we use in the code below.

```text
Browser asks GET /
        |
        v
+---------------------------+
| PageController.home()     |
| returns "forward:/menu"   |
+---------------------------+
        |  same request
        v
+---------------------------+
| Static file menu.html     |
+---------------------------+
        |
        v
  HTML page for the browser
```

The controller does not build the page. It only says, "serve that file instead". The browser still sees the original address, because a forward happens inside the server. A `redirect:` is different. It tells the browser to make a new request to another address.

## Real-Life Example

Think of a food court. At the counter, a staff member hands you a tray. You can see and eat the food, and that is a `@Controller` giving you a finished page. The same kitchen also gets supplier orders on paper, with item names and counts only. That is a `@RestController` giving raw data to another program. The kitchen and the recipes are shared. Only the packaging differs.

## Code Example

Let's build an app for Golden Crust Bakery. It has an HTML page at `/`, a plain-text line at `/today`, a JSON list at `/api/cakes`, and one endpoint at `/oops` that is broken on purpose.

```text
golden-crust/
├─ pom.xml
└─ src/main/
   ├─ java/com/goldencrust/bakery/
   │  ├─ BakeryApplication.java
   │  ├─ PageController.java
   │  └─ CakeApiController.java
   └─ resources/static/
      └─ menu.html
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

    <groupId>com.goldencrust</groupId>
    <artifactId>bakery</artifactId>
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

**File:** `BakeryApplication.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BakeryApplication {

    public static void main(String[] args) {
        SpringApplication.run(BakeryApplication.class, args);
    }
}
```

**File:** `PageController.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class PageController {

    @GetMapping("/")
    public String home() {
        return "forward:/menu.html";
    }

    @GetMapping("/today")
    @ResponseBody
    public String today() {
        return "Fresh today: chocolate truffle";
    }

    @GetMapping("/oops")
    public String oops() {
        return "cake-list";
    }
}
```

**File:** `CakeApiController.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CakeApiController {

    record Cake(String name, int priceInRupees) {}

    @GetMapping("/api/cakes")
    public List<Cake> cakes() {
        return List.of(
                new Cake("Chocolate Truffle", 650),
                new Cake("Pineapple Delight", 480));
    }
}
```

**File:** `menu.html` in `src/main/resources/static`

```html
<!DOCTYPE html>
<html>
<head><title>Golden Crust Bakery</title></head>
<body>
  <h1>Golden Crust Bakery</h1>
  <p>Fresh cakes baked every morning.</p>
</body>
</html>
```

Start the app, then call the four endpoints:

```bash
mvn spring-boot:run
curl http://localhost:8080/
curl http://localhost:8080/today
curl http://localhost:8080/api/cakes
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/oops
```

**Output:** the forwarded page for `/`:

```html
<!DOCTYPE html>
<html>
<head><title>Golden Crust Bakery</title></head>
<body>
  <h1>Golden Crust Bakery</h1>
  <p>Fresh cakes baked every morning.</p>
</body>
</html>
```

**Output** of `/today`, then the status of `/oops`:

```text
Fresh today: chocolate truffle
404
```

**Output** of `/api/cakes`, spaced out for reading:

```json
[
  {
    "name": "Chocolate Truffle",
    "priceInRupees": 650
  },
  {
    "name": "Pineapple Delight",
    "priceInRupees": 480
  }
]
```

## Code Explained

- `PageController` is a `@Controller`. Its `home()` method returns `"forward:/menu.html"`, so Spring serves the static page from the `static` folder.
- `today()` is also inside the `@Controller`, but `@ResponseBody` makes this one method return plain text.
- `oops()` returns `"cake-list"` with no `@ResponseBody`. Spring treats it as a view name, finds no page and no template engine, and answers 404 Not Found.
- `CakeApiController` is a `@RestController`. The list of `Cake` records is written as JSON with no extra code.
- Files in `src/main/resources/static` are served as they are, so `menu.html` needs no controller of its own.

## Side by Side

| Point | @Controller | @RestController |
|---|---|---|
| Returned `String` means | A view name | The response text |
| Returned object becomes | Needs `@ResponseBody` | JSON automatically |
| Typical use | HTML pages, redirects | REST APIs |
| Equals | Plain controller | `@Controller` + `@ResponseBody` |

## Common Mistakes

> **Warning:** Returning a `String` from a `@Controller` without `@ResponseBody` does not send that text. Spring looks for a page with that name. The call to `/oops` in our example returns 404 for exactly this reason.

- **Wrong annotation for an API.** A `@Controller` that returns a list without `@ResponseBody` cannot pick a page for it, so the client gets an error instead of data.
- **Mixing up redirect and forward.** `redirect:` makes the browser send a new request and changes the address bar. `forward:` stays inside the server and keeps the address.
- **Putting HTML strings in a REST controller.** Returning `"<h1>Hi</h1>"` from a `@RestController` sends text, and the page will not be built from a template.

## Interview Questions

**Is @RestController the same as @Controller?**
Almost. `@RestController` combines `@Controller` and `@ResponseBody`, so every method writes its return value into the response body.

**What does @ResponseBody do?**
It tells Spring to send the returned value through a message converter instead of looking for a view.

**When would you still use @Controller?**
When the server renders HTML pages, or when you want redirects and forwards to other URLs.

**What is a view resolver?**
It turns a view name returned by a controller into an actual page, such as a template file.

## Key Points to Remember

- `@RestController` = `@Controller` + `@ResponseBody`.
- In a `@Controller`, a returned `String` is a view name unless `@ResponseBody` is present.
- Use `@RestController` for APIs that return JSON or text.
- Use `@Controller` for server-rendered pages, redirects and forwards.
- Files under `src/main/resources/static` are served directly.
- A wrong choice shows up as an error page or a missing view.

## Frequently Asked Questions

### Can I use both @Controller and @RestController in one project?

Yes. Many apps have a few `@Controller` classes for pages and many `@RestController` classes for the API. They live side by side.

### Can a @RestController return HTML?

It can return HTML text, but it sends it as a plain string. Use a `@Controller` with a template engine when you want real server-side pages.

### Why did my @Controller return an error instead of my text?

Because the returned `String` was treated as a view name. Add `@ResponseBody` to the method, or switch to `@RestController`.

### Is @ResponseBody allowed on a @RestController method?

Yes, but it does nothing extra. `@RestController` already applies it to every method.

## Related Topics

- [Spring MVC Architecture](/learning/spring-boot-tutorial/spring-mvc-architecture): see how the DispatcherServlet routes each request.
- [@RequestMapping](/learning/spring-boot-tutorial/request-mapping): learn how paths and methods are mapped.
- [ResponseEntity](/learning/spring-boot-tutorial/responseentity): control status codes and headers in the response.
- [DTO Pattern](/learning/spring-boot-tutorial/dto-pattern): decide what shape your API data should have.
