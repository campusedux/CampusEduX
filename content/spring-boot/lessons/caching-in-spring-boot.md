Suppose you run a bakery counter. Every time a customer asks the price of a croissant, you walk to the back office, open a thick register, find the page and walk back. After the tenth customer, you would just write the price on a small card and keep it at the counter. Caching in Spring Boot does exactly this. It keeps the answer to an expensive question close by, so the next person who asks gets it instantly.

In this guide you will add caching to a bakery price service, see the database call disappear on repeated requests, and learn how to update and clear the cache so customers never see stale prices.

## What is Caching in Spring Boot?

> **Definition:** Caching means saving the result of a method so that the next call with the same input returns the saved result, without running the method again. Spring Boot supports this with annotations such as `@Cacheable`, and it hides the storage details behind a common cache abstraction.

You mark a method with `@Cacheable("prices")`. The first call runs the method and stores the result in a cache named `prices`, under a key made from the arguments. The next call with the same arguments finds the key and returns the stored result. The method body is skipped.

Spring Boot sets up a simple in-memory cache automatically when it finds the cache starter and `@EnableCaching`. Later you can swap it for Caffeine, Redis or another store by changing dependencies and settings, without changing your annotations.

## Why is it used?

- **Speed.** A memory lookup takes microseconds. A database or remote API call takes milliseconds or more.
- **Less load.** The database sees one query instead of a thousand identical ones.
- **Lower cost.** Paid outside services are called less often.
- **Steadier apps.** Popular data no longer piles up requests during a rush.

Caching suits data that is read often and changes rarely: product prices, country lists, settings, and results of heavy calculations. It does not suit data that must always be perfectly fresh, like a bank balance.

## How it works

Like method security, caching works through a proxy that wraps your bean.

```text
Caller
   |
   v  price("croissant")
+--------------------------+
| Cache proxy              |
| key = "croissant"        |
+--------------------------+
        |
   in cache?
    /      \
  yes       no
   |         |
   |         v
   |   +------------------+
   |   | Real method runs |
   |   | (slow database)  |
   |   +------------------+
   |         |
   |    save in cache
   |         |
   v         v
  return the result
```

When you call a cached method, the proxy first builds a key and looks in the cache. On a hit, it returns the saved value and your method never runs. On a miss, it runs your method, saves the result under the key, and returns it. The caller cannot tell the difference, except that it is faster.

Four annotations control the cache.

| Annotation | What it does |
|---|---|
| `@Cacheable` | Read from the cache, or run the method and save the result |
| `@CachePut` | Always run the method and save the result |
| `@CacheEvict` | Remove one entry, or all entries |
| `@Caching` | Combine several cache actions on one method |

## Real-Life Example

A railway enquiry counter gets the same question all day: "What time is the Pune express?" The clerk stops checking the big timetable and pins the answer to the board. When the timetable changes, the clerk replaces the note, which is a `put`. If a train is cancelled, the note is torn down, which is an `evict`. The board is the cache, and the timetable is the database.

## Code Example

Let's build Crumbs & Co., a bakery with a slow price lookup. We add the cache starter, turn caching on, and watch when the "database" is really touched. The app is not a web app, so a runner prints everything.

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

    <groupId>com.crumbs</groupId>
    <artifactId>prices</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-cache</artifactId>
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
spring.application.name=crumbs-prices
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `PricesApplication.java` in package `com.crumbs.prices`

```java
package com.crumbs.prices;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableCaching
public class PricesApplication {

    public static void main(String[] args) {
        SpringApplication.run(PricesApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(PriceService prices) {
        return args -> {
            System.out.println("Croissant: " + prices.price("croissant"));
            System.out.println("Croissant again: " + prices.price("croissant"));
            System.out.println("Sourdough: " + prices.price("sourdough"));

            prices.updatePrice("croissant", 60);
            System.out.println("After update: " + prices.price("croissant"));

            prices.forget("croissant");
            System.out.println("After evict: " + prices.price("croissant"));
        };
    }
}
```

**File:** `PriceService.java` in package `com.crumbs.prices`

```java
package com.crumbs.prices;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class PriceService {

    // Pretend this map is a slow database.
    private final Map<String, Integer> database = new ConcurrentHashMap<>(
        Map.of("croissant", 55, "sourdough", 120));

    @Cacheable("prices")
    public int price(String item) {
        System.out.println("  [database] reading " + item);
        return database.get(item);
    }

    @CachePut(value = "prices", key = "#item")
    public int updatePrice(String item, int newPrice) {
        System.out.println("  [database] saving " + item);
        database.put(item, newPrice);
        return newPrice;
    }

    @CacheEvict("prices")
    public void forget(String item) {
        System.out.println("  [cache] removed " + item);
    }
}
```

Run it with `./mvnw spring-boot:run`.

**Output:**

```text
  [database] reading croissant
Croissant: 55
Croissant again: 55
  [database] reading sourdough
Sourdough: 120
  [database] saving croissant
After update: 60
  [cache] removed croissant
  [database] reading croissant
After evict: 60
```

## Code Explained

- `spring-boot-starter-cache` adds the caching support, and `@EnableCaching` switches it on. Without that annotation, the cache annotations do nothing.
- `@Cacheable("prices")` names the cache `prices`. The key defaults to the argument, so `"croissant"` and `"sourdough"` are stored separately.
- In the output, the first `croissant` call prints the database line. The second call does not, because the answer came from the cache.
- `@CachePut` always runs the method, then stores the return value under the key we give: `#item` means "the argument called item". This keeps the cache in step with the database after an update, so the next `price` call shows `60` without another database read.
- `@CacheEvict` removes the entry, so the following call goes to the database again. Use `allEntries = true` to clear the whole cache.
- The method returns an `int`, and the cache stores that value. A method that returns `void` cannot be used with `@Cacheable`.
- Spring Boot chose a simple in-memory map on its own. It never expires entries and has no size limit, which is fine for learning and risky for production.

## Adding an Expiry

For real apps, add a cache library that can expire entries. Caffeine is the common pick. Add the Caffeine library as a dependency, and Spring Boot uses it automatically. Then set the limits in `application.properties`.

```properties
spring.cache.cache-names=prices
spring.cache.caffeine.spec=maximumSize=500,expireAfterWrite=10m
```

Now each price lives for ten minutes and the cache never holds more than 500 entries. The practice problems below use this setting.

## Common Mistakes

> **Warning:** A cache can serve old data. When the source changes and you forget to update or evict the entry, users see the old value until it expires.

- **Forgetting `@EnableCaching`.** Nothing is cached and no error appears.
- **Calling a cached method from the same class.** The call skips the proxy, so the cache is not used. Move the method to another bean.
- **Caching mutable objects.** If a caller changes the returned object, the cached copy changes too. Return records or copies.
- **No size limit or expiry.** The default cache grows without end. Use Caffeine or Redis in production.
- **Caching `null` by accident.** A missing value can be stored and served again. Use `unless = "#result == null"` to skip it.

## Interview Questions

**What does `@Cacheable` do?**
It checks the cache for a key built from the arguments. On a hit it returns the saved value. On a miss it runs the method and saves the result.

**What is the difference between `@Cacheable` and `@CachePut`?**
`@Cacheable` may skip the method. `@CachePut` always runs the method and then updates the cache.

**How do you clear a cache?**
Use `@CacheEvict`, with `allEntries = true` to remove everything.

**Why might a cached method still run every time?**
`@EnableCaching` may be missing, the call may come from inside the same class, or the arguments may produce a different key each time.

**Which cache does Spring Boot use by default?**
A simple in-memory map. You can switch to Caffeine, Redis and others through dependencies and properties.

## Key Points to Remember

- Caching stores a method result and reuses it for the same arguments.
- Add the cache starter and put `@EnableCaching` on a configuration class.
- `@Cacheable` reads, `@CachePut` writes, and `@CacheEvict` removes.
- The cache works through a proxy, so calls inside one class skip it.
- Set an expiry and a size limit for any production cache.

## Frequently Asked Questions

### Is caching in Spring Boot the same as a database cache?

No. Spring Boot caching sits in your application, in front of any method, including database calls, web service calls and calculations.

### How does Spring decide the cache key?

With one argument, that argument is the key. With several, Spring combines them. You can set your own key with the `key` attribute.

### When should I avoid caching?

Avoid it for data that must be exact every time, such as balances and stock counts at checkout, or for data that changes on almost every request.

### Can I use Redis for caching in Spring Boot?

Yes. Add the Redis starter and set `spring.cache.type=redis`. Your `@Cacheable` annotations stay the same.

## Related Topics

- [Spring AOP](/learning/spring-boot-tutorial/spring-aop): the proxy idea behind cache annotations.
- [@Transactional](/learning/spring-boot-tutorial/transactional): another proxy-based annotation with the same self-call trap.
- [Scheduling with @Scheduled](/learning/spring-boot-tutorial/scheduling-with-scheduled): refresh or clear caches on a timer.
- [Spring Boot Actuator](/learning/spring-boot-tutorial/spring-boot-actuator): see cache metrics on a running app.
