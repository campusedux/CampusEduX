Try each problem on your own first. Both use the H2 in-memory database, so nothing needs to be installed.

### Easy: Bakery Stock Guard

Sunrise Bakery keeps the stock of each cake. Write a `sell(name, quantity)` method that reduces the stock and then checks it. If the stock would go below zero, throw an `IllegalArgumentException`, and make sure the stock is not changed in that case. Sell 3 cakes when 5 are in stock, then try to sell 4 more.

> **Hint:** Reduce the stock first and check afterwards. Mark the service method `@Transactional`, so the unchecked exception undoes the reduction.

**Answer:** The reduction and the check sit in one transaction. When the check fails, the runtime exception makes Spring roll back the change.

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

    <groupId>com.sunrise</groupId>
    <artifactId>stock</artifactId>
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

**File:** `Cake.java` in package `com.sunrise.stock`

```java
package com.sunrise.stock;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Cake {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int stock;

    protected Cake() {
    }

    public Cake(String name, int stock) {
        this.name = name;
        this.stock = stock;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }
}
```

**File:** `CakeRepository.java` in package `com.sunrise.stock`

```java
package com.sunrise.stock;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CakeRepository extends JpaRepository<Cake, Long> {

    Optional<Cake> findByName(String name);
}
```

**File:** `CakeService.java` in package `com.sunrise.stock`

```java
package com.sunrise.stock;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CakeService {

    private final CakeRepository cakes;

    public CakeService(CakeRepository cakes) {
        this.cakes = cakes;
    }

    public void addCake(String name, int stock) {
        cakes.save(new Cake(name, stock));
    }

    public int stockOf(String name) {
        return cakes.findByName(name).orElseThrow().getStock();
    }

    @Transactional
    public void sell(String name, int quantity) {
        Cake cake = cakes.findByName(name).orElseThrow();
        cake.setStock(cake.getStock() - quantity);
        cakes.saveAndFlush(cake);
        if (cake.getStock() < 0) {
            throw new IllegalArgumentException("Not enough stock");
        }
    }
}
```

**File:** `StockApplication.java` in package `com.sunrise.stock`

```java
package com.sunrise.stock;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class StockApplication {

    public static void main(String[] args) {
        SpringApplication.run(StockApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(CakeService service) {
        return args -> {
            service.addCake("Pineapple", 5);
            service.sell("Pineapple", 3);
            System.out.println("After selling 3: " + service.stockOf("Pineapple"));
            try {
                service.sell("Pineapple", 4);
            } catch (IllegalArgumentException e) {
                System.out.println("Refused: " + e.getMessage());
            }
            System.out.println("After refusal: " + service.stockOf("Pineapple"));
        };
    }
}
```

Running the app prints:

```text
After selling 3: 2
Refused: Not enough stock
After refusal: 2
```

### Medium: Cinema Booking and Card Decline

CineGo books seats in two steps: it saves a `Booking` row, then charges the card. The card check throws a checked `PaymentException` when the card is declined. Make the booking disappear and the seats return when the card is declined. Book once with a good card and once with a declined card, and print the number of bookings and the seats left after each.

> **Hint:** A checked exception does not roll back by default. Add `rollbackFor = PaymentException.class` to `@Transactional`.

**Answer:** The booking row and the seat count change in one transaction. With `rollbackFor`, the declined card undoes both.

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
    <artifactId>booking</artifactId>
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

**File:** `Screening.java` in package `com.cinego.booking`

```java
package com.cinego.booking;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Screening {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String movie;
    private int seatsLeft;

    protected Screening() {
    }

    public Screening(String movie, int seatsLeft) {
        this.movie = movie;
        this.seatsLeft = seatsLeft;
    }

    public Long getId() {
        return id;
    }

    public int getSeatsLeft() {
        return seatsLeft;
    }

    public void setSeatsLeft(int seatsLeft) {
        this.seatsLeft = seatsLeft;
    }
}
```

**File:** `Booking.java` in package `com.cinego.booking`

```java
package com.cinego.booking;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long screeningId;
    private int seats;

    protected Booking() {
    }

    public Booking(Long screeningId, int seats) {
        this.screeningId = screeningId;
        this.seats = seats;
    }
}
```

**File:** `PaymentException.java` in package `com.cinego.booking`

```java
package com.cinego.booking;

public class PaymentException extends Exception {

    public PaymentException(String message) {
        super(message);
    }
}
```

**File:** `ScreeningRepository.java` in package `com.cinego.booking`

```java
package com.cinego.booking;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ScreeningRepository extends JpaRepository<Screening, Long> {
}
```

**File:** `BookingRepository.java` in package `com.cinego.booking`

```java
package com.cinego.booking;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
}
```

**File:** `BookingService.java` in package `com.cinego.booking`

```java
package com.cinego.booking;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private final ScreeningRepository screenings;
    private final BookingRepository bookings;

    public BookingService(ScreeningRepository screenings, BookingRepository bookings) {
        this.screenings = screenings;
        this.bookings = bookings;
    }

    public Long open(String movie, int seats) {
        return screenings.save(new Screening(movie, seats)).getId();
    }

    @Transactional(rollbackFor = PaymentException.class)
    public void book(Long screeningId, int seats, boolean cardOk) throws PaymentException {
        Screening screening = screenings.findById(screeningId).orElseThrow();
        bookings.save(new Booking(screeningId, seats));
        screening.setSeatsLeft(screening.getSeatsLeft() - seats);
        screenings.save(screening);
        bookings.flush();
        if (!cardOk) {
            throw new PaymentException("Card declined");
        }
    }

    public String status(Long screeningId) {
        return "bookings=" + bookings.count() + ", seatsLeft="
                + screenings.findById(screeningId).orElseThrow().getSeatsLeft();
    }
}
```

**File:** `BookingApplication.java` in package `com.cinego.booking`

```java
package com.cinego.booking;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(BookingService service) throws Exception {
        return args -> {
            Long id = service.open("Monsoon Express", 10);
            service.book(id, 2, true);
            System.out.println("Good: " + service.status(id));
            try {
                service.book(id, 3, false);
            } catch (PaymentException e) {
                System.out.println("Failed: " + e.getMessage());
            }
            System.out.println("Declined: " + service.status(id));
        };
    }
}
```

Running the app prints:

```text
Good: bookings=1, seatsLeft=8
Failed: Card declined
Declined: bookings=1, seatsLeft=8
```
