A multiplex cinema has several screens, and every screen plays many shows in a day. One screen, many shows. But each show belongs to exactly one screen. If you stand at the screen, you see many shows. If you stand at a show, you see one screen. That is the most common relationship in databases, and you will meet it in almost every project: one customer with many orders, one library shelf with many books, one doctor with many appointments.

In this topic you will learn one-to-many and many-to-one mapping. You will see how the two sides work together, which side stores the link, how to keep both sides in step, and what problems to avoid.

## What is one-to-many and many-to-one mapping?

These are the two views of the same relationship. From the "one" side it is `@OneToMany`, and from the "many" side it is `@ManyToOne`. The database stores the link only once, as a foreign key in the table of the "many" side.

> **Definition:** A one-to-many relationship connects one entity to many others, such as one screen to many shows. The reverse view, many shows to one screen, is many-to-one. The "many" table holds a foreign key that points to the "one" table.

In our cinema, the `show` table has a column `screen_id` that stores which screen the show belongs to.

```text
screen                show
------                ----
PK id          1---*  PK id
   name               movie
   seats              start_time
                      FK screen_id
```

One screen row matches many show rows. The foreign key `screen_id` sits on the many side.

| Table | Column | Meaning |
|---|---|---|
| `screen` | `id` | Primary key |
| `screen` | `name` | Name of the screen |
| `screen` | `seats` | Number of seats |
| `show` | `id` | Primary key |
| `show` | `movie` | Movie name |
| `show` | `start_time` | Start time as text |
| `show` | `screen_id` | Foreign key to `screen` |

## Why is it used?

You cannot store many shows inside a single screen row without breaking the table into repeating columns such as `show1`, `show2`, `show3`. That design fails as soon as a screen has a fourth show. The clean answer is a second table, one row per show, each pointing back to its screen.

JPA hides the join work. You call `screen.getShows()` and get a list, or `show.getScreen()` and get one object. Hibernate reads the foreign key and fetches the right rows. You keep thinking in objects, and the database keeps its clean structure.

> **Tip:** Make `@ManyToOne` the owner of the link and add `@OneToMany(mappedBy = ...)` only if you need to walk from the one side. Many designs need only the `@ManyToOne` side.

## How it works

Saving a screen with shows follows a fixed order, because each show needs its screen's id.

```text
save(screen with 2 shows)
        |
        v
INSERT screen  -> id 1
        |
        v
INSERT show (screen_id = 1)
INSERT show (screen_id = 1)
```

With `cascade = CascadeType.ALL` on the `@OneToMany` side, saving the screen also saves its shows. Hibernate inserts the screen first, learns its id, and then inserts each show with `screen_id` filled in.

Reading follows the link the other way, and it is lazy by default for the "many" list.

```text
findById(screen 1)
        |
        v
SELECT screen only
        |
        v
screen.getShows() called
        |
        v
SELECT shows where screen_id = 1
```

Hibernate loads the screen alone at first. The list of shows is filled in only when you first touch it, and that needs an open session, as you will see in the code.

## Real-Life Example

Think about a school with many classrooms, where each classroom has many benches. Every bench has a small sticker: "Room 7". The sticker is the foreign key. The principal does not keep a list of benches inside the classroom record. She can find a room's benches by looking for all benches with that sticker. And when a room closes, all its benches go with it. That is what cascade and orphan removal do in JPA: the benches cannot live without their room.

## Code Example

Let's build the cinema model for Starplex. A `Screen` has many `Show` objects. The `Show` side owns the link, and the `Screen` side mirrors it with `mappedBy`.

```text
starplex/
├─ pom.xml
└─ src/main/
  ├─ resources/
  │ └─ application.properties
  └─ java/com/starplex/cinema/
    ├─ CinemaApplication.java
    ├─ Screen.java
    ├─ Show.java
    ├─ Repositories.java
    └─ CinemaRunner.java
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

    <groupId>com.starplex</groupId>
    <artifactId>cinema</artifactId>
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

**File:** `CinemaApplication.java` in package `com.starplex.cinema`

```java
package com.starplex.cinema;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CinemaApplication {

    public static void main(String[] args) {
        SpringApplication.run(CinemaApplication.class, args);
    }
}
```

**File:** `Screen.java` in package `com.starplex.cinema`

```java
package com.starplex.cinema;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
public class Screen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int seats;

    @OneToMany(mappedBy = "screen", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Show> shows = new ArrayList<>();

    protected Screen() {
    }

    public Screen(String name, int seats) {
        this.name = name;
        this.seats = seats;
    }

    public void addShow(Show show) {
        shows.add(show);
        show.setScreen(this);
    }

    public Long getId() {
        return id;
    }

    public List<Show> getShows() {
        return shows;
    }
}
```

**File:** `Show.java` in package `com.starplex.cinema`

```java
package com.starplex.cinema;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Show {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String movie;
    private String startTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "screen_id")
    private Screen screen;

    protected Show() {
    }

    public Show(String movie, String startTime) {
        this.movie = movie;
        this.startTime = startTime;
    }

    void setScreen(Screen screen) {
        this.screen = screen;
    }

    public String getMovie() {
        return movie;
    }

    public String getStartTime() {
        return startTime;
    }
}
```

**File:** `Repositories.java` in package `com.starplex.cinema`

```java
package com.starplex.cinema;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

interface ScreenRepository extends JpaRepository<Screen, Long> {
}

interface ShowRepository extends JpaRepository<Show, Long> {

    List<Show> findByScreenName(String name);
}
```

**File:** `CinemaRunner.java` in package `com.starplex.cinema`

```java
package com.starplex.cinema;

import org.hibernate.LazyInitializationException;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Component
public class CinemaRunner implements CommandLineRunner {

    private final ScreenRepository screens;
    private final ShowRepository shows;
    private final TransactionTemplate tx;

    public CinemaRunner(ScreenRepository screens, ShowRepository shows,
                        TransactionTemplate tx) {
        this.screens = screens;
        this.shows = shows;
        this.tx = tx;
    }

    @Override
    public void run(String... args) {
        Screen screen = new Screen("Screen 1", 120);
        screen.addShow(new Show("Paper Boats", "18:30"));
        screen.addShow(new Show("Night Market", "21:15"));
        Long screenId = screens.save(screen).getId();
        System.out.println("Shows saved: " + shows.count());

        System.out.println("Shows on Screen 1:");
        shows.findByScreenName("Screen 1")
                .forEach(s -> System.out.println("  " + s.getMovie() + " " + s.getStartTime()));

        try {
            screens.findById(screenId).orElseThrow().getShows().size();
        } catch (LazyInitializationException e) {
            System.out.println("Lazy list needs an open session");
        }

        tx.executeWithoutResult(status -> {
            Screen loaded = screens.findById(screenId).orElseThrow();
            System.out.println("Inside a transaction: " + loaded.getShows().size() + " shows");
            loaded.getShows().remove(0);
        });
        System.out.println("After removing one: " + shows.count());

        screens.deleteById(screenId);
        System.out.println("After deleting the screen: " + shows.count());
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.application.name=starplex
spring.jpa.show-sql=true
```

Run it with `mvn spring-boot:run`.

**Output:**

```text
Shows saved: 2
Shows on Screen 1:
  Paper Boats 18:30
  Night Market 21:15
Lazy list needs an open session
Inside a transaction: 2 shows
After removing one: 1
After deleting the screen: 0
```

Hibernate built the `show` table with the foreign key on the many side:

```sql
create table show (id bigint generated by default as identity, screen_id bigint, movie varchar(255), start_time varchar(255), primary key (id))
alter table if exists show add constraint FKpmdhsg2pprfg2634ojdwiv181 foreign key (screen_id) references screen
```

## Code Explained

- `Show` owns the link. `@ManyToOne` with `@JoinColumn(name = "screen_id")` creates the foreign key column in the `show` table.
- `Screen` uses `@OneToMany(mappedBy = "screen")`. The name `screen` refers to the field in `Show`, so no second link is created.
- `cascade = CascadeType.ALL` saves and deletes the shows with the screen. That is why one `save` stored three rows, and deleting the screen removed the shows.
- `orphanRemoval = true` deletes a show that is taken out of the screen's list. The transaction removed the first show, and the count fell from two to one.
- `addShow` sets both sides at once: the list in the screen and the `screen` field in the show. Only the second one writes the foreign key.
- `FetchType.LAZY` on `@ManyToOne` loads the screen only when needed. `@OneToMany` is lazy by default.
- The list was not readable outside a transaction, so Hibernate threw `LazyInitializationException`. Inside `TransactionTemplate` the session was open, and it worked.
- `findByScreenName` is a derived query that walks the relationship, from `Show` to `screen` to `name`.

## One-to-Many and Many-to-One at a Glance

| Point | `@ManyToOne` side | `@OneToMany` side |
|---|---|---|
| Example | `Show` | `Screen` |
| Holds the foreign key | Yes | No |
| Owns the link | Yes | No, uses `mappedBy` |
| Default fetch | Eager | Lazy |
| Holds | One object | A collection |

## Common Mistakes

> **Warning:** Always update both sides, as `addShow` does. If you only add the show to the list and forget `show.setScreen(...)`, the foreign key stays empty and the show is saved without a screen.

- **Reading a lazy list outside a session.** This gives `LazyInitializationException`. Load the data inside a transaction, or fetch it with a query that uses `join fetch`.
- **Forgetting `mappedBy`.** Without it, Hibernate creates a separate join table for the `@OneToMany` list, which surprises most beginners.
- **Using `CascadeType.ALL` on a `@ManyToOne`.** Deleting one show would delete its whole screen. Put cascade on the `@OneToMany` side only.
- **Returning entities with both sides straight from a controller.** The screen lists its shows and each show lists its screen, so JSON conversion loops for ever. Return DTOs.
- **Using `List` and `equals` carelessly.** Adding entities to a set or removing them relies on `equals` and `hashCode`. Keep them simple, or stay with lists.

## Interview Questions

**Which side owns a one-to-many relationship?**
The many side, with `@ManyToOne` and the foreign key column. The `@OneToMany` side uses `mappedBy` to point at it.

**What does `orphanRemoval = true` do?**
It deletes a child row when you remove it from the parent's collection, so the child does not stay in the database without a parent.

**Why do you get `LazyInitializationException`?**
The lazy collection was touched after the session closed. Fix it by loading inside a transaction or with a fetch join.

## Key Points to Remember

- One-to-many and many-to-one are two views of one link, stored as a foreign key on the many side.
- `@ManyToOne` owns the link. `@OneToMany(mappedBy = ...)` mirrors it.
- Use a helper such as `addShow` to keep both sides in step.
- Cascade and orphan removal make children follow the life of the parent.
- Collections are lazy, so read them inside a session or fetch them with a query.

## Frequently Asked Questions

### What is the difference between one-to-many and many-to-one mapping in JPA?

They describe the same link from opposite ends. `@ManyToOne` sits on the child and holds the foreign key. `@OneToMany` sits on the parent and holds the collection.

### Do I need both sides of the relationship?

No. Many projects use only `@ManyToOne` on the child and load the children with a repository query. Add `@OneToMany` when you truly need to walk from the parent.

### Should I use List or Set for a OneToMany collection?

Either works. A `List` is simple and familiar. A `Set` avoids duplicates but needs careful `equals` and `hashCode`. Beginners do well with a `List`.

### How do I stop a OneToMany from loading too much data?

Keep it lazy, and use paged repository queries for large children. A fetch join is fine for a small, known set.

## Related Topics

- [One-to-One Mapping](/learning/spring-boot-tutorial/one-to-one-mapping): the simpler relationship between two tables.
- [Many-to-Many Mapping](/learning/spring-boot-tutorial/many-to-many-mapping): link entities that both have many partners.
- [Lazy vs Eager Loading](/learning/spring-boot-tutorial/lazy-vs-eager-loading): control when related data is loaded.
- [N+1 Problem](/learning/spring-boot-tutorial/n-plus-1-problem): avoid a hidden flood of queries.
