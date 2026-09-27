You build a shop API and it works perfectly in Postman. Then your friend builds a React page on another address, calls the same API, and the browser shows a red error: "blocked by CORS policy". The API is fine. The browser is protecting the user. CORS in Spring Boot is how you tell the browser, "Yes, this website is allowed to call me."

Let's see what CORS means, why browsers insist on it, and how to set it up for a small grocery shop API, with real headers as proof.

## What is CORS in Spring Boot?

> **Definition:** CORS stands for Cross-Origin Resource Sharing. It is a browser rule that stops a web page from reading responses of another origin unless that server says it is allowed, using special response headers.

An **origin** is the trio of scheme, host and port. So `http://localhost:3000` and `http://localhost:8080` are different origins, even though the host is the same. `https://shop.com` and `http://shop.com` are different too.

Your React app at port 3000 calling your Spring Boot API at port 8080 is a cross-origin call. By default the browser lets the request go out, but it refuses to give the answer to the page unless the reply carries the right `Access-Control-Allow-Origin` header. Spring Boot's job is to add those headers for the origins you trust.

## Why is it used?

Without this rule, any website you visit could quietly call your bank's API using your logged-in browser and read the answers. The same-origin policy blocks that. CORS is a controlled hole in that wall: the server owner decides which other origins may pass.

You need to set it up when:

- Your frontend and API run on different ports during development.
- The frontend is hosted on one domain and the API on another in production.
- A partner website should be allowed to read a public feed.

> **Note:** CORS is enforced by browsers only. Tools such as curl and Postman, and other servers, ignore it. So CORS is not a login system and it does not protect your API from attackers who are not using a browser.

## How it works

For simple GET requests the browser just sends the call with an `Origin` header. For calls that change data, such as PUT with JSON, it first sends a small question called a **preflight**.

```text
Browser page (localhost:3000)
  |  OPTIONS /products/rice/price
  |  Origin: localhost:3000
  |  Request-Method: PUT
  v
Spring Boot CORS check
  |  is this origin allowed?
  |  is PUT allowed?
  v
Reply with Allow headers
  |
  v
Browser sends the real PUT
```

The preflight is an `OPTIONS` request that asks, "May I send a PUT from this origin?" Spring answers from your CORS rules. If the answer is yes, the browser sends the real request. If the answer is no, the browser stops, and your PUT never leaves the user's machine. Spring Boot handles the preflight itself, so you do not write an OPTIONS method.

## Real-Life Example

Think of a housing society gate. The guard has a list of flat numbers and visitors' companies that are allowed in. A delivery boy from an unknown company is stopped at the gate, even if he is holding a real parcel. He is not a criminal. His name is just not on the list. The guard also phones ahead before letting a plumber carry heavy tools inside. That phone call is the preflight, and the list is your `allowedOrigins`.

## Code Example

FreshMart is a grocery shop with a product API. A React page at `http://localhost:3000` should read and update prices. We set a global rule for `/products` and a single-method rule for `/offers`, both in this example. Only the web starter is needed.

```text
freshmart-shop/
├─ pom.xml
└─ src/main/java/
   └─ com/freshmart/shop/
      ├─ ShopApplication.java
      ├─ CorsConfig.java
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

    <groupId>com.freshmart</groupId>
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

**File:** `ShopApplication.java` in package `com.freshmart.shop`

```java
package com.freshmart.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}
```

**File:** `CorsConfig.java` in package `com.freshmart.shop`

```java
package com.freshmart.shop;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/products/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "PUT")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
```

**File:** `ProductController.java` in package `com.freshmart.shop`

```java
package com.freshmart.shop;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductController {

    record Product(String name, int priceInRupees) {}
    record PriceChange(int priceInRupees) {}

    @GetMapping("/products")
    public List<Product> products() {
        return List.of(new Product("Tomatoes 1 kg", 40), new Product("Basmati Rice 5 kg", 520));
    }

    @PutMapping("/products/{name}/price")
    public String changePrice(@PathVariable String name, @RequestBody PriceChange change) {
        return name + " now costs Rs " + change.priceInRupees();
    }

    @CrossOrigin("https://partner.example.com")
    @GetMapping("/offers")
    public List<String> offers() {
        return List.of("Buy 2 kg tomatoes, get coriander free");
    }

    @GetMapping("/internal/stock")
    public String stock() {
        return "Only for our own servers";
    }
}
```

Start the app. Then pretend to be the browser by sending an `Origin` header with curl, and print the reply headers with `-i`:

```bash
mvn spring-boot:run
curl -i localhost:8080/products -H "Origin: http://localhost:3000"
```

**Output:**

```bash
HTTP/1.1 200 
Access-Control-Allow-Origin: http://localhost:3000
Content-Type: application/json

[{"name":"Tomatoes 1 kg","priceInRupees":40},{"name":"Basmati Rice 5 kg","priceInRupees":520}]
```

The `Access-Control-Allow-Origin` header is the browser's permission slip. Now the same call from an origin that is not on the list:

```bash
curl -i localhost:8080/products -H "Origin: http://evil.example.com"
```

**Output:**

```bash
HTTP/1.1 403 

Invalid CORS request
```

Last, the preflight for a PUT. We send the `OPTIONS` call that a browser would send:

```bash
curl -i -X OPTIONS localhost:8080/products/rice/price \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: content-type"
```

**Output:**

```bash
HTTP/1.1 200 
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET,PUT
Access-Control-Allow-Headers: content-type
Access-Control-Max-Age: 3600
Allow: GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH
```

## Code Explained

- `CorsConfig` implements `WebMvcConfigurer` and overrides `addCorsMappings`. This is the global way, so one place holds all the rules.
- `addMapping("/products/**")` says these rules apply to every path under `/products`.
- `allowedOrigins` lists the exact origins. `allowedMethods` lists the HTTP methods. `allowedHeaders("*")` accepts any request header.
- `maxAge(3600)` lets the browser remember the preflight answer for one hour, so it does not ask before every call. It is the `Access-Control-Max-Age` line above.
- `@CrossOrigin` on `offers()`, with the partner's address as its value, opens only that one method, for one partner.
- `/internal/stock` has no CORS rule at all, so no allow header is ever added. A browser page from another origin cannot read it.
- The `403 Invalid CORS request` reply is Spring saying no. The origin was not on the list.

## Three Ways to Configure CORS

| Way | Where | Best for |
|---|---|---|
| `@CrossOrigin` | On a controller or method | One or two endpoints |
| `WebMvcConfigurer` | A configuration class | Whole-app rules |
| Security config | Spring Security's CORS support | Apps that use Spring Security |

> **Warning:** If you add Spring Security later, its filter runs before MVC, and a preflight without a CORS rule in the security config gets rejected. Configure CORS in the security chain too.

## Common Mistakes

- **Using `*` everywhere.** `allowedOrigins("*")` lets every website read your responses. Fine for a truly public API, dangerous for one that uses cookies or tokens.
- **Combining `*` with cookies.** Spring rejects `allowCredentials(true)` together with the `*` origin. List real origins instead.
- **Trailing slash or wrong port.** `http://localhost:3000/` is not the same as `http://localhost:3000`. The origin must match exactly.
- **Blaming the server for a CORS error.** The console message often appears when the API returned an error, such as 500, without the allow header. Check the network tab first.
- **Thinking CORS is security for your API.** Anyone with curl can call it. Real protection needs authentication and authorization.

## Interview Questions

**What is an origin?**
The combination of scheme, host and port. Two URLs with any difference in one of them are different origins.

**What is a preflight request?**
An automatic `OPTIONS` request that the browser sends before a risky cross-origin call, such as PUT or a request with custom headers, to ask whether the server allows it.

**How do you enable CORS in Spring Boot?**
Use `@CrossOrigin` on controllers or methods, or implement the `addCorsMappings` method of `WebMvcConfigurer` for global rules. With Spring Security, also enable CORS in the security filter chain.

**Does CORS stop a curl request?**
No. CORS is only checked by browsers, so it never blocks curl, Postman or server-to-server calls.

## Key Points to Remember

- CORS lets a server say which other origins may read its responses in a browser.
- An origin is scheme plus host plus port.
- Spring Boot answers preflight `OPTIONS` requests from your rules.
- Use `@CrossOrigin` for one endpoint and `addCorsMappings` for global rules.
- List exact origins; avoid `*` when cookies are involved.
- CORS is not authentication. It only guides browsers.

## Frequently Asked Questions

### How do I fix a CORS error in Spring Boot?

Add the origin of your frontend, such as `http://localhost:3000`, to `allowedOrigins` in a `WebMvcConfigurer` or `@CrossOrigin`, and restart. Check that the method you use is in `allowedMethods`.

### Why does CORS work in Postman but fail in the browser?

Postman does not enforce the same-origin rule. Only browsers check the allow headers.

### Should I allow all origins in production?

Only for public, read-only data. For anything with logins, list the exact frontend origins.

### Where should CORS settings live in a real project?

In one configuration class, with the allowed origins read from `application.properties`, so each environment can differ.

## Related Topics

- [Spring MVC Architecture](/learning/spring-boot-tutorial/spring-mvc-architecture): see where CORS handling sits in the request path.
- [GET POST PUT DELETE Mapping](/learning/spring-boot-tutorial/get-post-put-delete-mapping): learn the methods that trigger a preflight.
- [Interceptors and Filters](/learning/spring-boot-tutorial/interceptors-and-filters): understand the filters that run before your controller.
- [Spring Security Basics](/learning/spring-boot-tutorial/spring-security-basics): set CORS correctly when login rules are added.
