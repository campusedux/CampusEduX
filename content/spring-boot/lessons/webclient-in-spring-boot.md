A cinema app shows the movie list, and next to each film it shows a star rating. The ratings do not live in the cinema's database. They come from another company's service. When the page loads, the app must ask that service for many ratings at once, and it should not sit idle waiting for each answer one by one. That is where WebClient helps.

Let's see what WebClient is, how it differs from RestTemplate, and how to build a cinema app that fetches ratings, combines two calls, handles errors and stops waiting after a timeout.

## What is WebClient in Spring Boot?

> **Definition:** WebClient is Spring's non-blocking, reactive HTTP client. You describe a request with a fluent chain of calls, and it gives back a `Mono` (one result) or a `Flux` (many results) that arrives later.

Two new words need a quick meaning:

- **Mono** is a box that will hold zero or one value in the future.
- **Flux** is a box that will hold many values in the future, one after another.

Nothing happens until someone asks for the value. You can `subscribe` to it, return it from a reactive controller, or call `block()`, which waits and hands you the plain object. In a normal Spring MVC app, using `block()` at the edge is common and fine.

WebClient lives in the `spring-boot-starter-webclient` starter in Spring Boot 4. It replaces the older habit of adding a full WebFlux server just to get this client.

## Why is it used?

RestTemplate blocks a thread for every call. WebClient gives you more:

- **Non-blocking calls.** While waiting for a reply, no thread is stuck. A few threads can handle thousands of calls.
- **Easy combining.** Ask two services at the same moment and join the answers, so total time is the slower call, not the sum.
- **Built-in tools.** Timeouts, retries and error handling are methods on the chain.
- **Streaming.** A `Flux` can deliver a long list piece by piece.
- **Fluent style.** One readable chain that says method, address, body and how to read the reply.

> **Note:** For simple blocking code, Spring also has `RestClient`, which looks like WebClient but is not reactive. WebClient is the better choice when you want parallel calls, retries or streaming.

## How it works

Here is what our cinema app does for one rating.

```text
CinemaController
  |  ratings.get().uri(...)
  v
WebClient builds the request
  |  retrieve()
  v
Sends HTTP GET (non-blocking)
  |
  v
Reply arrives later
  |
  v
bodyToMono(Rating)
  |  JSON -> Rating object
  v
block() gives the value
```

You build the request with a chain: pick the method, give a path, then call `retrieve()`. The request is sent without holding a thread. When the reply comes back, `bodyToMono` turns the JSON into a `Rating`. Finally `block()` waits for it, so our normal controller can return a plain object.

Now the parallel case, where two calls run at once.

```text
compare(first, second)
   |               |
   v               v
GET first      GET second
   |               |
   +-------+-------+
           |
           v
   Mono.zip joins both
           |
           v
   One combined answer
```

Both requests leave immediately. `Mono.zip` waits for both replies and hands them together to your code. The total time is that of the slower call, not the two added up.

## Real-Life Example

At a busy tea stall, one helper takes an order, shouts it to the kitchen and takes the next customer without waiting. When the kitchen shouts back, he serves that order. That is non-blocking. A helper who stands in front of the kitchen until each glass is ready is blocking. The stall with the first helper serves far more people with the same staff.

## Code Example

CineGo shows movie ratings. To keep everything runnable on one machine, the rating service is a set of endpoints under `/ratings` in the same app. Imagine it is another company. The cinema side talks to it only through WebClient. We use the web starter for the server and the WebClient starter for the client.

```text
cinego-ratings/
├─ pom.xml
└─ src/main/
   ├─ java/com/cinego/ratings/
   │  ├─ RatingsApplication.java
   │  ├─ RatingsController.java
   │  └─ CinemaController.java
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

    <groupId>com.cinego</groupId>
    <artifactId>ratings</artifactId>
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
            <artifactId>spring-boot-starter-webclient</artifactId>
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
ratings.base-url=http://localhost:${server.port:8080}/ratings
```

**File:** `RatingsApplication.java` in package `com.cinego.ratings`

```java
package com.cinego.ratings;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.reactive.function.client.WebClient;

@SpringBootApplication
public class RatingsApplication {

    public static void main(String[] args) {
        SpringApplication.run(RatingsApplication.class, args);
    }

    @Bean
    WebClient ratingsClient(WebClient.Builder builder, @Value("${ratings.base-url}") String baseUrl) {
        return builder.baseUrl(baseUrl).build();
    }
}
```

**File:** `RatingsController.java` in package `com.cinego.ratings`

```java
package com.cinego.ratings;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Pretend this is a movie-rating company's API. */
@RestController
@RequestMapping("/ratings")
public class RatingsController {

    record Rating(String movie, double stars, int votes) {}
    record Review(String user, int stars) {}

    private final Map<String, Rating> ratings = Map.of(
            "monsoon-express", new Rating("Monsoon Express", 4.3, 1820),
            "silent-orbit", new Rating("The Silent Orbit", 3.9, 940),
            "slow-film", new Rating("Slow Film", 4.0, 12));

    @GetMapping
    public List<Rating> all() {
        return ratings.values().stream().sorted((a, b) -> Double.compare(b.stars(), a.stars())).toList();
    }

    @GetMapping("/{movie}")
    public Rating one(@PathVariable String movie) throws InterruptedException {
        if (movie.equals("slow-film")) {
            Thread.sleep(3000);
        }
        Rating rating = ratings.get(movie);
        if (rating == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown movie");
        }
        return rating;
    }

    @PostMapping("/{movie}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public void addReview(@PathVariable String movie, @RequestBody Review review) {
        // a real service would save the review
    }
}
```

**File:** `CinemaController.java` in package `com.cinego.ratings`

```java
package com.cinego.ratings;

import java.time.Duration;
import java.util.List;

import org.springframework.http.HttpStatusCode;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;

@RestController
public class CinemaController {

    record Rating(String movie, double stars, int votes) {}
    record Review(String user, int stars) {}

    private final WebClient ratings;

    public CinemaController(WebClient ratings) {
        this.ratings = ratings;
    }

    @GetMapping("/cinema/rating/{movie}")
    public Rating rating(@PathVariable String movie) {
        return ratings.get().uri("/{movie}", movie)
                .retrieve()
                .bodyToMono(Rating.class)
                .block();
    }

    @GetMapping("/cinema/top")
    public List<Rating> top() {
        return ratings.get().uri("")
                .retrieve()
                .bodyToFlux(Rating.class)
                .take(2)
                .collectList()
                .block();
    }

    @GetMapping("/cinema/compare/{first}/{second}")
    public String compare(@PathVariable String first, @PathVariable String second) {
        Mono<Rating> a = ratings.get().uri("/{m}", first).retrieve().bodyToMono(Rating.class);
        Mono<Rating> b = ratings.get().uri("/{m}", second).retrieve().bodyToMono(Rating.class);
        return Mono.zip(a, b)
                .map(pair -> pair.getT1().movie() + " " + pair.getT1().stars()
                        + " vs " + pair.getT2().movie() + " " + pair.getT2().stars())
                .block();
    }

    @GetMapping("/cinema/safe-rating/{movie}")
    public String safeRating(@PathVariable String movie) {
        return ratings.get().uri("/{movie}", movie)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError,
                        response -> Mono.error(new IllegalStateException("No rating for " + movie)))
                .bodyToMono(Rating.class)
                .timeout(Duration.ofSeconds(1))
                .map(r -> r.movie() + " has " + r.stars() + " stars")
                .onErrorReturn("Rating not available right now")
                .block();
    }

    @PostMapping("/cinema/review/{movie}")
    public String review(@PathVariable String movie) {
        return ratings.post().uri("/{movie}/reviews", movie)
                .bodyValue(new Review("asha", 5))
                .retrieve()
                .toBodilessEntity()
                .map(reply -> "Review saved, status " + reply.getStatusCode())
                .block();
    }
}
```

Start the app and call the cinema endpoints:

```bash
mvn spring-boot:run
curl localhost:8080/cinema/rating/monsoon-express
curl localhost:8080/cinema/top
curl localhost:8080/cinema/compare/monsoon-express/silent-orbit
curl localhost:8080/cinema/safe-rating/silent-orbit
curl -X POST localhost:8080/cinema/review/silent-orbit
```

**Output:**

```json
{"movie":"Monsoon Express","stars":4.3,"votes":1820}
[{"movie":"Monsoon Express","stars":4.3,"votes":1820},{"movie":"Slow Film","stars":4.0,"votes":12}]
```

```bash
Monsoon Express 4.3 vs The Silent Orbit 3.9
The Silent Orbit has 3.9 stars
Review saved, status 201 CREATED
```

The lines are long because curl prints JSON on one line.

## Code Explained

- `WebClient.Builder` is created by Spring Boot and already knows Boot's JSON settings. We inject it, set a `baseUrl`, and build one shared `WebClient` bean.
- `get().uri("/{movie}", movie)` fills the placeholder and encodes the value safely.
- `retrieve()` sends the request and prepares to read the reply. If the status is 4xx or 5xx, the result turns into an error.
- `bodyToMono(Rating.class)` reads one object. `bodyToFlux(Rating.class)` reads a list item by item, and `take(2)` keeps the first two.
- `Mono.zip(a, b)` runs both calls together and joins the results.
- `onStatus` lets you replace the default error with your own for a chosen status group.
- `timeout` gives up after one second. `onErrorReturn` gives a fallback text when anything fails, and the slow film test shows it working.
- `post().bodyValue(...)` sends a JSON body, and `toBodilessEntity()` reads only the status and headers.
- `block()` turns the reactive result into a plain value at the end. Use it only in ordinary MVC methods, never inside reactive code.

## Error Handling and Timeouts

We asked for a film called `ghost` through the plain `rating` endpoint. The rating service answered 404, WebClient turned it into an exception, and nothing caught it. The caller got status 500:

```json
{
  "timestamp": "2026-09-26T21:16:10.828Z",
  "status": 500,
  "error": "Internal Server Error",
  "path": "/cinema/rating/ghost"
}
```

The log names the real cause, the `NotFound` subclass of `WebClientResponseException`. Our `safe-rating` endpoint handles the same 404, and also the slow film that takes three seconds. Both calls print `Rating not available right now`, and the slow one returns after about one second because of `timeout`.

> **Tip:** Every call to another service should have a timeout and a plan for failure. Decide what your app says when the other side is slow, before it happens in production.

## RestTemplate or WebClient?

| Question | RestTemplate | WebClient |
|---|---|---|
| Blocks a thread while waiting? | Yes | No, unless you call `block()` |
| Style | Method per call | Fluent chain |
| Parallel calls | Manual threads | `Mono.zip` and friends |
| Streaming a long reply | No | Yes, with `Flux` |
| Best for | Old code, simple calls | New code, many calls, retries |

## Common Mistakes

- **Calling `block()` in a reactive controller.** If your method returns a `Mono`, return it as it is. Blocking there can freeze the event loop.
- **Building a new client per request.** Create one `WebClient` bean and reuse it.
- **Forgetting that nothing runs until you subscribe.** A chain without `block()` or `subscribe()` sends no request at all.
- **No timeout.** A slow service can hold your requests for a very long time.
- **Ignoring the error path.** Without `onStatus` or `onErrorReturn`, a 404 from the other side becomes your own 500.

## Interview Questions

**What is WebClient?**
It is Spring's non-blocking HTTP client, which returns `Mono` or `Flux` results and can run many calls with few threads.

**What is the difference between Mono and Flux?**
A `Mono` holds zero or one value in the future. A `Flux` holds zero to many values.

**Can you use WebClient in a normal Spring MVC application?**
Yes. Add the WebClient starter and call `block()` where you need a plain value. Many teams use it this way.

**How do you retry a failed call?**
Add `retryWhen` with a `Retry` rule to the chain, for example a fixed delay and a maximum number of attempts. The practice section does this.

## Key Points to Remember

- WebClient is a fluent, non-blocking client for calling other HTTP services.
- `Mono` is one future value; `Flux` is many.
- Use `retrieve()` and then `bodyToMono` or `bodyToFlux`.
- `Mono.zip` runs calls in parallel and joins the answers.
- Add a timeout, and handle errors with `onStatus` or `onErrorReturn`.
- Build one shared client from `WebClient.Builder`.
- Call `block()` only at the edge of ordinary MVC code.

## Frequently Asked Questions

### Do I need WebFlux to use WebClient?

No. In Spring Boot 4 the WebClient starter is enough, and it works next to the normal web starter, as our example shows.

### How do I add a header such as an API key with WebClient?

Add `defaultHeader` on the builder for every call, or `header` on one request chain.

### Is WebClient faster than RestTemplate?

For one call, about the same. It wins when you make many calls at once, because no thread waits for each reply.

### What replaces WebClient's old exchange method?

Use `retrieve()` for most cases. For full control over the reply, use `exchangeToMono`, which lets you read the status and body yourself.

## Related Topics

- [RestTemplate](/learning/spring-boot-tutorial/resttemplate): compare with the classic blocking client.
- [ResponseEntity](/learning/spring-boot-tutorial/responseentity): understand the status and header wrapper used in replies.
- [Introduction to Microservices with Spring Boot](/learning/spring-boot-tutorial/introduction-to-microservices-with-spring-boot): see why services call each other.
- [Async Processing with @Async](/learning/spring-boot-tutorial/async-processing-with-async): another way to run work without waiting.
