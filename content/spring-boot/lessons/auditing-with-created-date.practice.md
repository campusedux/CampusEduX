Try each problem on your own first. Both use the H2 in-memory database, so nothing needs to be installed.

### Easy: Recipe Post Dates

FoodNest publishes recipes. Give the `Recipe` entity a creation time and a last update time that Spring fills automatically. Save a recipe, then change its title and save again. Print whether the two times were equal after the first save, and whether the creation time survived the update.

> **Hint:** Use `@EnableJpaAuditing`, `@EntityListeners` naming `AuditingEntityListener`, `@CreatedDate` and `@LastModifiedDate`. Wait a moment between the two saves.

**Answer:** Put the annotations on the `Recipe` entity itself. No `AuditorAware` is needed, because we audit only dates.

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

    <groupId>com.foodnest</groupId>
    <artifactId>recipes</artifactId>
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
```

**File:** `Recipe.java` in package `com.foodnest.recipes`

```java
package com.foodnest.recipes;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@EntityListeners(AuditingEntityListener.class)
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    protected Recipe() {
    }

    public Recipe(String title) {
        this.title = title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
```

**File:** `RecipeRepository.java` in package `com.foodnest.recipes`

```java
package com.foodnest.recipes;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
}
```

**File:** `RecipesApplication.java` in package `com.foodnest.recipes`

```java
package com.foodnest.recipes;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class RecipesApplication {

    public static void main(String[] args) {
        SpringApplication.run(RecipesApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(RecipeRepository recipes) {
        return args -> {
            Recipe recipe = recipes.save(new Recipe("Paneer Wrap"));
            boolean equalAtStart = recipe.getCreatedAt().equals(recipe.getUpdatedAt());
            System.out.println("Equal after first save: " + equalAtStart);

            Thread.sleep(500);
            recipe.setTitle("Paneer Kathi Roll");
            Recipe saved = recipes.saveAndFlush(recipe);
            System.out.println("Created unchanged: "
                    + saved.getCreatedAt().equals(recipe.getCreatedAt()));
            System.out.println("Updated later: "
                    + saved.getUpdatedAt().isAfter(saved.getCreatedAt()));
        };
    }
}
```

Running the app prints:

```text
Equal after first save: true
Created unchanged: true
Updated later: true
```

### Medium: Who Changed the Booking

A hotel app must record who created a booking and who last changed it. Use an `AuditorAware<String>` that reads the name from a small `CurrentUser` bean. Create a booking as `priya`, then switch the current user to `kabir` and change it. Print `createdBy` and `updatedBy`.

> **Hint:** The `CurrentUser` bean holds a mutable name. The auditor bean returns `Optional.ofNullable` on the name. Mark `createdBy` with `updatable = false`.

**Answer:** Spring asks the auditor at every save. The first save writes both fields with `priya`. The second save changes only `updatedBy`.

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

    <groupId>com.stayeasy</groupId>
    <artifactId>bookings</artifactId>
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
```

**File:** `CurrentUser.java` in package `com.stayeasy.bookings`

```java
package com.stayeasy.bookings;

import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

    private volatile String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
```

**File:** `AuditConfig.java` in package `com.stayeasy.bookings`

```java
package com.stayeasy.bookings;

import java.util.Optional;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class AuditConfig {

    @Bean
    AuditorAware<String> auditor(CurrentUser currentUser) {
        return () -> Optional.ofNullable(currentUser.getName());
    }
}
```

**File:** `RoomBooking.java` in package `com.stayeasy.bookings`

```java
package com.stayeasy.bookings;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@EntityListeners(AuditingEntityListener.class)
public class RoomBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int nights;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;

    protected RoomBooking() {
    }

    public RoomBooking(int nights) {
        this.nights = nights;
    }

    public void setNights(int nights) {
        this.nights = nights;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }
}
```

**File:** `BookingRepository.java` in package `com.stayeasy.bookings`

```java
package com.stayeasy.bookings;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<RoomBooking, Long> {
}
```

**File:** `BookingsApplication.java` in package `com.stayeasy.bookings`

```java
package com.stayeasy.bookings;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BookingsApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingsApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(BookingRepository bookings, CurrentUser user) {
        return args -> {
            user.setName("priya");
            RoomBooking booking = bookings.save(new RoomBooking(2));

            user.setName("kabir");
            booking.setNights(3);
            RoomBooking saved = bookings.saveAndFlush(booking);

            System.out.println("createdBy: " + saved.getCreatedBy());
            System.out.println("updatedBy: " + saved.getUpdatedBy());
        };
    }
}
```

Running the app prints:

```text
createdBy: priya
updatedBy: kabir
```
