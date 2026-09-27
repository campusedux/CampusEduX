Picture a college library. At the main gate a guard looks at every bag that comes in. Inside, at the reading hall, a librarian checks your membership card before letting you take a book. The guard does not know which book you want. The librarian does. Both check you, but at different doors and for different reasons.

Web apps have the same two doors. A filter is the guard at the gate. An interceptor is the librarian in the hall. In this guide on interceptors and filters you will see how each one works, when to choose which, and how to build both.

## What are Interceptors and Filters?

> **Definition:** A filter is a Servlet component that sees every HTTP request before it reaches Spring. An interceptor is a Spring MVC component that runs around the controller method, after Spring has chosen which controller will handle the request.

Both let you run code for many requests in one place: logging, checking a header, adding a response header, measuring time. Neither needs changes inside your controllers.

The key difference is where they live:

| Point | Filter | Interceptor |
|---|---|---|
| Belongs to | Servlet API (Tomcat) | Spring MVC |
| Runs | Before Spring MVC sees the request | Around the controller call |
| Knows the controller? | No | Yes, it gets the handler |
| Typical use | Security, logging, compression | Login checks, timing, audit |
| Base class | `OncePerRequestFilter` | `HandlerInterceptor` |

## Why is it used?

Some rules apply to nearly every request. Without a shared place for them, you would copy the same lines into every controller method:

- Check that the caller sent a valid token or member id.
- Write one log line per request with its time taken.
- Add the same response header to every reply.
- Reject a bad request early, before any real work is done.

A filter or interceptor writes the rule once. Controllers stay small and only handle their own job. It is also safer, because a new controller cannot forget the check when the check is not in the controller at all.

## How it works

A request travels through several layers on its way to your code and back.

```text
Browser
  |
  v
Filter (guard at the gate)
  |
  v
DispatcherServlet
  |
  v
Interceptor preHandle
  |
  v
Controller method
  |
  v
Interceptor postHandle
  |
  v
Interceptor afterCompletion
  |
  v
Filter code after the chain
  |
  v
Browser gets the reply
```

The request first meets the filters. A filter calls `chain.doFilter(...)` to pass the request on. If it does not call it, the request stops there. Next comes Spring's `DispatcherServlet`, which finds the controller. Before the controller runs, every matching interceptor's `preHandle` runs. If it returns `false`, the controller is skipped. After the controller, `postHandle` runs, and when everything is finished `afterCompletion` runs, even after an exception. Last, the filter gets control back for any code written after `doFilter`.

An interceptor can be limited to chosen paths. A filter can be limited to URL patterns too, but it works with plain servlet requests and knows nothing about controllers.

```text
preHandle   -> before controller
  (return false = stop here)
postHandle  -> after controller,
               before the view
afterCompletion -> always at end
```

These three methods are the interceptor's whole lifecycle. Use `preHandle` for checks, `postHandle` to change the model or response, and `afterCompletion` for cleanup or timing.

## Real-Life Example

A cinema has two checks. At the mall entrance a guard scans every bag, whatever film you are going to see. That is the filter. At the screen door, the usher checks that your ticket is for this film and this show. That is the interceptor, because the usher knows which screen the door leads to. If the usher turns you back, the film never starts for you. If the guard stops you, you never even reach the usher.

## Code Example

Let's build BookBay, a small library service. A filter adds a header to every reply and prints when it starts and ends. An interceptor guards `/books/**` and rejects callers who send no `X-Member-Id` header.

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

    <groupId>com.bookbay</groupId>
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

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `GateFilter.java` in package `com.bookbay.library`

```java
package com.bookbay.library;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class GateFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        System.out.println("[filter] in  " + request.getRequestURI());
        response.setHeader("X-Served-By", "BookBay");
        chain.doFilter(request, response);
        System.out.println("[filter] out " + response.getStatus());
    }
}
```

**File:** `MemberInterceptor.java` in package `com.bookbay.library`

```java
package com.bookbay.library;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class MemberInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
            HttpServletResponse response, Object handler) throws Exception {
        String member = request.getHeader("X-Member-Id");
        if (member == null || member.isBlank()) {
            System.out.println("[interceptor] no member id");
            response.sendError(401, "Member id required");
            return false;
        }
        System.out.println("[interceptor] pre " + member);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
            HttpServletResponse response, Object handler, Exception ex) {
        System.out.println("[interceptor] done");
    }
}
```

**File:** `WebConfig.java` in package `com.bookbay.library`

```java
package com.bookbay.library;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final MemberInterceptor memberInterceptor;

    public WebConfig(MemberInterceptor memberInterceptor) {
        this.memberInterceptor = memberInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(memberInterceptor).addPathPatterns("/books/**");
    }
}
```

**File:** `LibraryApplication.java` in package `com.bookbay.library`

```java
package com.bookbay.library;

import java.util.List;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class LibraryApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }

    @GetMapping("/books")
    public List<String> books() {
        System.out.println("[controller] books");
        return List.of("Godan", "Malgudi Days");
    }

    @GetMapping("/hours")
    public String hours() {
        return "Open 9 AM to 6 PM";
    }
}
```

Start the app and call three addresses:

```bash
curl -i -H "X-Member-Id: M42" http://localhost:8080/books
curl -i http://localhost:8080/books
curl http://localhost:8080/hours
```

**Output:**

```text
[filter] in  /books
[interceptor] pre M42
[controller] books
[interceptor] done
[filter] out 200
[filter] in  /books
[interceptor] no member id
[filter] out 401
[filter] in  /hours
[filter] out 200
```

This is what the app printed to its console. The three calls got these replies: the first returned status 200 with `["Godan","Malgudi Days"]`, the second returned status 401 with a small JSON error, and the third returned the plain text `Open 9 AM to 6 PM`. Every reply carried the `X-Served-By: BookBay` header.

## Code Explained

- `GateFilter` extends `OncePerRequestFilter`, which makes sure the filter runs once per request. Marking it `@Component` is enough for Spring Boot to add it to the servlet chain.
- `chain.doFilter` passes the request on. The line printed after it runs when the reply is ready, which is why "out" appears last.
- `MemberInterceptor` returns `false` when the header is missing, so the controller is never called and the caller gets status 401.
- `WebConfig` registers the interceptor and limits it to `/books/**`. That is why `/hours` never prints an interceptor line.
- Notice the order for the first call: filter in, interceptor pre, controller, interceptor done, filter out. In the rejected call the interceptor stops the request, so the controller and `afterCompletion` are skipped, but the filter still prints both its lines.
- The `X-Served-By` header was added by the filter, so both the good and the rejected replies carry it.

> **Tip:** Use a filter when the rule is about raw HTTP and must run for everything, such as security or compression. Use an interceptor when you want to work with the controller or limit rules by Spring path patterns.

## Common Mistakes

> **Warning:** Do not forget `chain.doFilter(request, response)` in a filter. Without it the request stops in the filter and the caller waits or gets an empty reply.

- **Returning `false` without writing a response.** The client gets an empty 200. Send an error or a body yourself.
- **Registering an interceptor as a bean only.** A `@Component` interceptor does nothing until you add it in `addInterceptors`.
- **Expecting an interceptor to see everything.** Requests that never reach `DispatcherServlet`, such as some static files or failed filters, never reach it.
- **Doing heavy work in every request.** A slow filter slows the whole application.
- **Reading the request body in a filter.** The body can be read only once. Wrap the request if a later layer needs it.

## Interview Questions

**What is the difference between a filter and an interceptor?**
A filter belongs to the Servlet API and runs before Spring MVC. An interceptor belongs to Spring MVC and runs around the controller method.

**Which runs first?**
The filter runs first on the way in, and last on the way out.

**What does `preHandle` returning false do?**
It stops the request. The controller and later interceptors are skipped.

**How do you register an interceptor?**
Implement `HandlerInterceptor` and add it in `addInterceptors` of a `WebMvcConfigurer`.

**Where would you put JWT checking?**
In Spring Security's filter chain, because authentication must happen for every request before Spring MVC.

## Key Points to Remember

- Filters are Servlet components; interceptors are Spring MVC components.
- A filter must call `chain.doFilter` to let the request continue.
- An interceptor has three hooks: `preHandle`, `postHandle` and `afterCompletion`.
- Return `false` from `preHandle` to stop the request.
- Register interceptors in `WebMvcConfigurer`; a `@Component` filter is picked up automatically.
- Order on the way in is filter, then interceptor, then controller.

## Frequently Asked Questions

### Can I use interceptors and filters in the same app?

Yes, and most real apps do. Security and logging usually sit in filters. Business-level checks sit in interceptors.

### How do I control the order of filters?

Add `@Order` to the filter class. A lower number runs earlier.

### Can I limit a filter to some URLs?

Yes. Register it through a `FilterRegistrationBean` and give it URL patterns, or override `shouldNotFilter` in `OncePerRequestFilter`.

### Is an interceptor the same as AOP?

Similar idea, different level. AOP wraps method calls on any Spring bean. An interceptor wraps web requests only.

## Related Topics

- [Spring AOP](/learning/spring-boot-tutorial/spring-aop): wrap any method, not just web requests.
- [Spring MVC Architecture](/learning/spring-boot-tutorial/spring-mvc-architecture): where the DispatcherServlet sits.
- [Rate Limiting](/learning/spring-boot-tutorial/rate-limiting): a real job for an interceptor.
- [Spring Security Basics](/learning/spring-boot-tutorial/spring-security-basics): security built on a filter chain.
