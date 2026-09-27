You walk into a restaurant and ask for the owner's name. The waiter tells you at once. You did not ask for the full menu, the list of chefs, or the supplier bills, so nobody carries them to your table. If you ask for the menu later, the waiter fetches it then. That is lazy loading. Now imagine a waiter who piles every file in the restaurant onto your table each time you ask a simple question. That is eager loading.

Lazy vs eager loading decides when JPA reads related data from the database. Let's see the defaults, how they behave, and how to avoid the famous LazyInitializationException.

## What is lazy vs eager loading?

A JPA entity often points to other entities. A restaurant has dishes, and each dish has a restaurant. The fetch type says when the related data is read from the database.

> **Definition:** **Lazy loading** reads the related data only when your code first touches it. **Eager loading** reads the related data in the same step as the main entity, whether you need it or not.

You choose the behaviour with the `fetch` attribute, for example `@OneToMany(fetch = FetchType.LAZY)`. Here are the defaults, which are worth remembering.

| Relationship | Default fetch type |
|---|---|
| `@OneToMany` | Lazy |
| `@ManyToMany` | Lazy |
| `@ManyToOne` | Eager |
| `@OneToOne` | Eager |

Collections are lazy by default because they can be large. Single links, such as a dish's restaurant, are eager by default because they are cheap.

## Why is it used?

Databases are slow when you ask for too much. Suppose a restaurant has 200 dishes and 5,000 reviews. If loading a restaurant always loaded all of that, a simple "show the restaurant name" page would read thousands of rows for nothing.

Lazy loading keeps queries small. You pay for related data only on the screens that need it. Eager loading is the right choice only for data that you always use together with the parent, such as the two chefs who appear on every restaurant page.

The trade is simple. Lazy means fewer rows now, but a possible extra query later. Eager means one bigger query now, but sometimes wasted work.

## How it works

When Hibernate loads a restaurant lazily, it does not fill the `dishes` field with real dishes. It puts a placeholder object there, called a proxy collection. The first time your code reads from it, the placeholder runs a query.

```text
findById(1)
    |
    v
SELECT restaurant   (1st query)
    |
    v
Restaurant object
dishes = [placeholder]
    |
    |  r.getDishes().size()
    v
SELECT dishes       (2nd query)
```

The first query brings only the restaurant. The dishes stay behind a placeholder. Calling `size()` makes the placeholder run the second query and fill itself.

The placeholder can only run that query while the database session is still open. Once the session closes, the object is called detached, and the placeholder cannot reach the database any more.

```text
Session open (in @Transactional)
    |
    |  touch dishes
    v
Query runs, dishes loaded: OK

Session closed (detached object)
    |
    |  touch dishes
    v
LazyInitializationException
```

Inside a transaction, the session stays open, so lazy loading works. Outside it, the same code throws the exception. This is the source of most lazy loading bugs.

## Real-Life Example

Think of a hospital reception. When you ask for a patient's file, the clerk hands over the front sheet: name, age and ward. The thick folder of old X-rays and blood reports stays in the archive room. If the doctor needs them, someone walks to the archive and brings them. But the archive closes when the clerk goes home. After that, nobody can fetch the folder, however politely you ask. The archive room is the database session, and closing time is the end of the transaction.

## Code Example

Let's build a small app for SpiceRoute Kitchen. A `Restaurant` has many `Dish` rows, which we keep lazy, and two `Chef` rows, which we make eager to compare the two. We count the SQL statements with Hibernate statistics so you can see exactly when each query runs.

```text
spiceroute/
├─ pom.xml
└─ src/main/
   ├─ java/com/spiceroute/menu/
   │  ├─ MenuApplication.java
   │  ├─ Restaurant.java
   │  ├─ Dish.java
   │  ├─ Chef.java
   │  ├─ RestaurantRepository.java
   │  └─ MenuService.java
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

    <groupId>com.spiceroute</groupId>
    <artifactId>menu</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
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
spring.jpa.properties.hibernate.generate_statistics=true
```

**File:** `Restaurant.java` in package `com.spiceroute.menu`

```java
package com.spiceroute.menu;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.PERSIST)
    private Set<Dish> dishes = new HashSet<>();

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.PERSIST,
            fetch = FetchType.EAGER)
    private Set<Chef> chefs = new HashSet<>();

    protected Restaurant() {
    }

    public Restaurant(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Set<Dish> getDishes() {
        return dishes;
    }

    public Set<Chef> getChefs() {
        return chefs;
    }
}
```

**File:** `Dish.java` in package `com.spiceroute.menu`

```java
package com.spiceroute.menu;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Dish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    protected Dish() {
    }

    public Dish(String name, Restaurant restaurant) {
        this.name = name;
        this.restaurant = restaurant;
    }
}
```

**File:** `Chef.java` in package `com.spiceroute.menu`

```java
package com.spiceroute.menu;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Chef {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    protected Chef() {
    }

    public Chef(String name, Restaurant restaurant) {
        this.name = name;
        this.restaurant = restaurant;
    }
}
```

**File:** `RestaurantRepository.java` in package `com.spiceroute.menu`

```java
package com.spiceroute.menu;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    @EntityGraph(attributePaths = "dishes")
    Optional<Restaurant> findWithDishesById(Long id);
}
```

**File:** `MenuService.java` in package `com.spiceroute.menu`

```java
package com.spiceroute.menu;

import jakarta.persistence.EntityManagerFactory;

import org.hibernate.LazyInitializationException;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MenuService {

    private final RestaurantRepository restaurants;
    private final Statistics stats;

    public MenuService(RestaurantRepository restaurants, EntityManagerFactory emf) {
        this.restaurants = restaurants;
        this.stats = emf.unwrap(SessionFactory.class).getStatistics();
    }

    @Transactional
    public Long seed() {
        Restaurant kitchen = new Restaurant("SpiceRoute Kitchen");
        kitchen.getChefs().add(new Chef("Farida", kitchen));
        kitchen.getChefs().add(new Chef("Naveen", kitchen));
        kitchen.getDishes().add(new Dish("Paneer Tikka", kitchen));
        kitchen.getDishes().add(new Dish("Veg Biryani", kitchen));
        kitchen.getDishes().add(new Dish("Masala Chai", kitchen));
        restaurants.saveAndFlush(kitchen);
        return kitchen.getId();
    }

    public void outsideTransaction(Long id) {
        Restaurant r = restaurants.findById(id).orElseThrow();
        System.out.println("Loaded: " + r.getName());
        try {
            System.out.println("Dishes: " + r.getDishes().size());
        } catch (LazyInitializationException e) {
            System.out.println("Failed with:");
            System.out.println("  " + e.getClass().getSimpleName());
        }
    }

    @Transactional(readOnly = true)
    public void insideTransaction(Long id) {
        stats.clear();
        Restaurant r = restaurants.findById(id).orElseThrow();
        System.out.println("Loaded: " + r.getName());
        System.out.println("Queries: " + stats.getPrepareStatementCount());
        System.out.println("Chefs: " + r.getChefs().size());
        System.out.println("Queries: " + stats.getPrepareStatementCount());
        System.out.println("Dishes: " + r.getDishes().size());
        System.out.println("Queries: " + stats.getPrepareStatementCount());
    }

    public void withEntityGraph(Long id) {
        stats.clear();
        Restaurant r = restaurants.findWithDishesById(id).orElseThrow();
        System.out.println("Dishes: " + r.getDishes().size());
        System.out.println("Queries: " + stats.getPrepareStatementCount());
    }
}
```

**File:** `MenuApplication.java` in package `com.spiceroute.menu`

```java
package com.spiceroute.menu;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MenuApplication {

    public static void main(String[] args) {
        SpringApplication.run(MenuApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(MenuService service) {
        return args -> {
            Long id = service.seed();
            System.out.println("--- outside a transaction");
            service.outsideTransaction(id);
            System.out.println("--- inside a transaction");
            service.insideTransaction(id);
            System.out.println("--- with an entity graph");
            service.withEntityGraph(id);
        };
    }
}
```

Run it:

```bash
mvn spring-boot:run
```

**Output:**

```text
--- outside a transaction
Loaded: SpiceRoute Kitchen
Failed with:
  LazyInitializationException
--- inside a transaction
Loaded: SpiceRoute Kitchen
Queries: 1
Chefs: 2
Queries: 1
Dishes: 3
Queries: 2
--- with an entity graph
Dishes: 3
Queries: 1
```

Read the output step by step. Outside a transaction, the restaurant loads, but touching the lazy dishes fails. Inside a transaction, the restaurant and its eager chefs come in one query. Touching the chefs costs nothing extra. Touching the lazy dishes runs a second query. With the entity graph, one query brings the restaurant and its dishes, so the detached object works fine.

## Code Explained

- `@OneToMany(mappedBy = "restaurant")` is lazy by default, so `dishes` is loaded only when touched.
- `cascade = CascadeType.PERSIST` saves the new chefs and dishes together with the restaurant, so the seed method needs no extra repositories.
- `fetch = FetchType.EAGER` on `chefs` forces those rows into the first query.
- `@ManyToOne(fetch = FetchType.LAZY)` on the child side overrides the eager default. It is a common good habit.
- `outsideTransaction()` has no `@Transactional`. The repository call opens and closes its own session, so the returned entity is detached.
- `getPrepareStatementCount()` from Hibernate statistics counts the SQL statements sent to the database.
- `@EntityGraph(attributePaths = "dishes")` tells Spring Data to load `dishes` together with the restaurant for that one query, without changing the default for other queries.

> **Tip:** Keep associations lazy in the entity, and load extra data per use case with `@EntityGraph` or `JOIN FETCH`. That way every screen pays only for what it needs.

## Common Mistakes

> **Warning:** Do not "fix" a LazyInitializationException by switching everything to EAGER. It hides the error, but every query now loads more rows, and it often causes the N+1 problem.

- **Reading a lazy field outside a transaction.** Move the work inside a `@Transactional` service method, or fetch the data up front with an entity graph.
- **Eager collections everywhere.** Two eager collections on one entity can multiply rows and slow every query.
- **Returning entities from a controller.** Jackson touches every getter, which triggers lazy loading after the transaction is over. Return DTOs instead.
- **Trusting the default on `@ManyToOne`.** It is eager, so a list of 100 dishes may load 100 restaurants. Mark it lazy.

## Interview Questions

**What is the difference between lazy and eager loading?**
Lazy loading reads related data when it is first used. Eager loading reads it together with the parent entity.

**What are the default fetch types in JPA?**
`@OneToMany` and `@ManyToMany` are lazy. `@ManyToOne` and `@OneToOne` are eager.

**Why does LazyInitializationException happen?**
The code touched a lazy association after the Hibernate session had closed, usually after the transaction ended, so the proxy could not run its query.

**How can you load a lazy collection without changing it to eager?**
Use `JOIN FETCH` in a query, an `@EntityGraph`, or touch the collection inside a transaction.

## Key Points to Remember

- Lazy loading delays related queries until the data is used.
- Collections are lazy by default. Single-valued links are eager by default.
- A lazy field can be read only while the session is open, normally inside a transaction.
- Prefer lazy in the entity and fetch extra data per query with `JOIN FETCH` or `@EntityGraph`.
- Never return entities straight from controllers. Map them to DTOs.

## Frequently Asked Questions

### Is lazy loading always better than eager loading?

Not always. Lazy vs eager loading is a trade. Lazy saves work when the data is rarely needed. If you always need the child rows, loading them with the parent in one query is faster than two.

### Does `@Transactional` on a controller fix the exception?

It may hide the problem, but the service layer is the right place for transactions. Keep controllers thin and return DTOs.

### What is open-in-view?

It is a Spring Boot setting that keeps the session open for the whole web request, so lazy loading works in views and controllers. It is on by default in web apps, and many teams turn it off to avoid hidden queries.

### Can I choose lazy or eager per query?

Yes. Keep the entity lazy and use `JOIN FETCH` or `@EntityGraph` on the queries that need the extra data.

## Related Topics

- [N+1 Problem](/learning/spring-boot-tutorial/n-plus-1-problem): see how lazy loading can multiply queries in a loop.
- [@Transactional](/learning/spring-boot-tutorial/transactional): learn how sessions and transactions are managed.
- [One to Many and Many to One Mapping](/learning/spring-boot-tutorial/one-to-many-and-many-to-one-mapping): the relationships behind these fetch types.
- [DTO Pattern](/learning/spring-boot-tutorial/dto-pattern): return safe objects instead of entities.
