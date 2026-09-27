Think about a ticket window at a railway station. There is one clerk and a long queue. If one person keeps coming back to the window every few seconds with a new form, the clerk never reaches the others. So the station puts a rule: one turn per person, then back of the line. Nobody is blamed. The rule just keeps the window fair.

Web services face the same problem. One caller who sends thousands of requests can slow the service for everyone. Rate limiting is the rule that stops this.

Let's see what rate limiting is, the common ways to count, and how to build a working limiter in a Spring Boot app.

## What is Rate Limiting?

> **Definition:** Rate limiting means allowing each client only a fixed number of requests in a fixed period, and rejecting the extra ones, usually with HTTP status 429 Too Many Requests.

A rule may read "3 OTP requests per minute per user" or "100 API calls per hour per key". The client is named by something you can read from the request: a user id, an API client id or, when nothing else exists, the IP address.

When the limit is crossed, the server replies with status 429. A polite server also sends a `Retry-After` header that tells the client how many seconds to wait.

## Why is it used?

- **Protect the service.** A bug or a bot that loops can flood the app. The limit keeps the damage small.
- **Stop abuse.** Password guessing and OTP flooding depend on many quick tries.
- **Share fairly.** One heavy user should not slow the light users.
- **Control cost.** If each call costs money, such as an SMS, a cap keeps the bill safe.
- **Sell plans.** Free users get 100 calls a day; paid users get more.

Rate limiting is not a login system. It does not tell you who the caller is. It only limits how often they can knock.

## How it works

Two counting methods are common.

```text
Fixed window (3 per minute)

|-- minute 1 --|-- minute 2 --|
  x x x [4th=429]  counter = 0
```

A fixed window keeps a counter and a start time for each client. Each request adds one. When the window time is over, the counter goes back to zero. It is simple and cheap. Its weakness is the edge: a client can send 3 requests at the end of one minute and 3 more at the start of the next, six in a few seconds.

```text
Token bucket

refill --> [ o o o ] --> request
 1 per s    bucket       takes 1
```

A token bucket holds tokens up to a maximum, say 3. Every request takes one token. Tokens are added back at a steady speed. If the bucket is empty, the request is rejected. This allows a short burst and then a steady pace, and it has no edge problem. Libraries such as Bucket4j implement this idea, and API gateways offer it as a setting.

Where do you place the check? The best place inside a Spring Boot app is a filter or an interceptor, so it runs before any controller work. That is what we build next.

```text
Request
  |
  v
Interceptor: who is the client?
  |
  +--> under limit --> Controller
  |
  +--> over limit  --> 429 reply
```

The interceptor finds the client key, asks the limiter, and either lets the request continue or writes the 429 reply itself.

## Real-Life Example

A bank lets you request an OTP for a payment, but only 3 times in a minute. If you press "Send OTP" a fourth time, the app says "Too many tries, wait 45 seconds". The rule protects the SMS budget and stops someone from flooding your phone. It also tells you exactly when you can try again, like the Retry-After header.

## Code Example

Let's build PayEasy, a payment service with an OTP endpoint. We allow 3 OTP requests per client in each 60-second window. The client is named by the `X-Client-Id` header, and the IP address is used if that header is missing.

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

    <groupId>com.payeasy</groupId>
    <artifactId>otp</artifactId>
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
ratelimit.max-requests=3
ratelimit.window-seconds=60
```

**File:** `FixedWindowLimiter.java` in package `com.payeasy.otp`

```java
package com.payeasy.otp;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class FixedWindowLimiter {

    private record Window(long startMillis, int count) {}

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final int maxRequests;
    private final long windowMillis;

    public FixedWindowLimiter(@Value("${ratelimit.max-requests}") int maxRequests,
            @Value("${ratelimit.window-seconds}") long windowSeconds) {
        this.maxRequests = maxRequests;
        this.windowMillis = windowSeconds * 1000;
    }

    /** Returns 0 when the request is allowed, else the seconds to wait. */
    public long tryAcquire(String client) {
        long now = System.currentTimeMillis();
        long[] wait = {0};
        windows.compute(client, (key, old) -> {
            if (old == null || now - old.startMillis() >= windowMillis) {
                return new Window(now, 1);
            }
            if (old.count() < maxRequests) {
                return new Window(old.startMillis(), old.count() + 1);
            }
            wait[0] = (old.startMillis() + windowMillis - now + 999) / 1000;
            return old;
        });
        return wait[0];
    }
}
```

**File:** `RateLimitInterceptor.java` in package `com.payeasy.otp`

```java
package com.payeasy.otp;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final FixedWindowLimiter limiter;

    public RateLimitInterceptor(FixedWindowLimiter limiter) {
        this.limiter = limiter;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
            HttpServletResponse response, Object handler) throws Exception {
        String client = request.getHeader("X-Client-Id");
        if (client == null || client.isBlank()) {
            client = request.getRemoteAddr();
        }
        long wait = limiter.tryAcquire(client);
        if (wait == 0) {
            return true;
        }
        response.setStatus(429);
        response.setHeader("Retry-After", String.valueOf(wait));
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Too many requests\"}");
        return false;
    }
}
```

**File:** `WebConfig.java` in package `com.payeasy.otp`

```java
package com.payeasy.otp;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor rateLimitInterceptor;

    public WebConfig(RateLimitInterceptor rateLimitInterceptor) {
        this.rateLimitInterceptor = rateLimitInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor).addPathPatterns("/otp/**");
    }
}
```

**File:** `OtpApplication.java` in package `com.payeasy.otp`

```java
package com.payeasy.otp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class OtpApplication {

    public static void main(String[] args) {
        SpringApplication.run(OtpApplication.class, args);
    }

    @PostMapping("/otp/send")
    public String sendOtp() {
        return "OTP sent";
    }
}
```

Send five requests as client `asha` and one as client `ravi`:

```bash
for i in 1 2 3 4 5; do
  curl -s -i -X POST -H "X-Client-Id: asha" http://localhost:8080/otp/send
done
curl -s -X POST -H "X-Client-Id: ravi" http://localhost:8080/otp/send
```

**Output:**

```text
asha 1: 200 OTP sent
asha 2: 200 OTP sent
asha 3: 200 OTP sent
asha 4: 429 Retry-After: 60
asha 5: 429 Retry-After: 60
ravi 1: 200 OTP sent
```

The blocked replies also carried the body `{"error":"Too many requests"}`. The output above lists the status and the main header of each reply, one line per call.

## Code Explained

- `FixedWindowLimiter` keeps a map from client name to a small record holding the window start and the count. The values come from `application.properties`, so you can change the limit without editing code.
- `compute` runs atomically for one key. Two requests from the same client at the same moment cannot both slip under the limit.
- `tryAcquire` returns 0 for "allowed" or the number of seconds left in the window. That number becomes the `Retry-After` header.
- `RateLimitInterceptor` picks the client key, asks the limiter, and writes the 429 reply itself when the answer is not 0. Returning `false` keeps the request away from the controller.
- `WebConfig` limits the check to `/otp/**`, so other endpoints are free.
- `ravi` gets his own counter, so `asha` being blocked does not affect him.

> **Tip:** Clients behind one office network share one IP address. Prefer a user id or client id for the key when you can, and use the IP only as a fallback.

## Common Mistakes

> **Warning:** This limiter keeps its counters in the memory of one app instance. If you run three copies of the app behind a load balancer, each copy counts on its own, and a client can get three times the limit. Shared limits need a shared store such as Redis, or a limit at the gateway.

- **Trusting the client id header alone.** Anyone can invent a new header value for every request. Use an id you verified, such as the logged-in user.
- **Using `check then update` without a lock.** Two threads can both pass the check. Use an atomic operation like `compute`.
- **Never cleaning the map.** Old client entries stay in memory for ever. A real limiter removes idle keys or uses a cache with expiry.
- **Replying 500 or 200 on a blocked call.** Use 429 so clients and tools know what happened.
- **Limiting login and payment endpoints the same as browsing.** Give sensitive endpoints stricter limits.

## Interview Questions

**What is rate limiting and why is it needed?**
It caps how many requests a client can make in a period. It protects the service from overload and abuse and shares capacity fairly.

**Which HTTP status code is used?**
429 Too Many Requests, often with a `Retry-After` header.

**Fixed window versus token bucket?**
A fixed window counts requests in set time slots and can allow a burst at the edge of two windows. A token bucket refills steadily and allows a small burst without the edge problem.

**Where would you implement rate limiting in a Spring Boot system?**
At the API gateway if you have one, or in a filter or interceptor inside the app, with a shared store like Redis when there is more than one instance.

**How do you rate limit across several instances?**
Keep the counters in a shared place such as Redis so all instances see the same numbers.

## Key Points to Remember

- Rate limiting caps requests per client per time period.
- The blocked reply is status 429, preferably with `Retry-After`.
- A fixed window is simple; a token bucket handles bursts more smoothly.
- An interceptor or filter is a natural place for the check.
- In-memory counters work for one instance only.
- The client key must be something a caller cannot easily change.

## Frequently Asked Questions

### Should I write my own rate limiting code or use a library?

For learning, write your own. For production, prefer a tested library such as Bucket4j, or the limits of your API gateway, so you do not maintain tricky concurrency code yourself.

### What is the difference between rate limiting and throttling?

Rate limiting rejects extra requests. Throttling slows them down or queues them. In daily talk people often use the words for the same thing.

### Does rate limiting stop a DDoS attack?

Not alone. A large attack can overwhelm the network before requests reach your app. Use limits in the app together with protection at the gateway or the network edge.

### What should the client do after a 429?

Wait for the time in `Retry-After`, then try again. Good clients also add a small random delay so they do not all return at the same second.

## Related Topics

- [Interceptors and Filters](/learning/spring-boot-tutorial/interceptors-and-filters): the place where the limit check lives.
- [HTTP Status Codes in Spring Boot](/learning/spring-boot-tutorial/http-status-codes-in-spring-boot): where 429 fits among the codes.
- [Caching in Spring Boot](/learning/spring-boot-tutorial/caching-in-spring-boot): another way to reduce load on a busy service.
- [Spring Security Basics](/learning/spring-boot-tutorial/spring-security-basics): knowing who the caller is.
