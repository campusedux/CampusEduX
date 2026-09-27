Try each problem on your own first. Each project has its own `pom.xml`, shown below.

### Easy: Gym Member Search

CityFit Gym stores members with a name and a plan (`MONTHLY` or `YEARLY`). Add three derived methods to the repository: one that finds members by plan, one that counts members on a plan, and one that finds members whose name starts with a given text. Save five members and print the results of all three.

Use these members: Aarav (MONTHLY), Anaya (YEARLY), Kabir (MONTHLY), Aditi (YEARLY), Meera (MONTHLY).

> **Hint:** The names are `findByPlan`, `countByPlan` and `findByNameStartingWith`. The plan can be a plain `String` field.

**Answer:** Each method name maps to one field. `StartingWith` adds a `like 'A%'` search, so `findByNameStartingWith("A")` returns Aarav, Anaya and Aditi.

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

    <groupId>com.cityfit</groupId>
    <artifactId>gym</artifactId>
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

**File:** `GymApplication.java` in package `com.cityfit.gym`

```java
package com.cityfit.gym;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GymApplication {

    public static void main(String[] args) {
        SpringApplication.run(GymApplication.class, args);
    }
}
```

**File:** `Member.java` in package `com.cityfit.gym`

```java
package com.cityfit.gym;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String plan;

    protected Member() {
    }

    public Member(String name, String plan) {
        this.name = name;
        this.plan = plan;
    }

    public String getName() {
        return name;
    }
}
```

**File:** `MemberRepository.java` in package `com.cityfit.gym`

```java
package com.cityfit.gym;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {

    List<Member> findByPlan(String plan);

    long countByPlan(String plan);

    List<Member> findByNameStartingWith(String prefix);
}
```

**File:** `MemberRunner.java` in package `com.cityfit.gym`

```java
package com.cityfit.gym;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class MemberRunner implements CommandLineRunner {

    private final MemberRepository repository;

    public MemberRunner(MemberRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.saveAll(List.of(
                new Member("Aarav", "MONTHLY"),
                new Member("Anaya", "YEARLY"),
                new Member("Kabir", "MONTHLY"),
                new Member("Aditi", "YEARLY"),
                new Member("Meera", "MONTHLY")));

        System.out.println("Monthly members:");
        repository.findByPlan("MONTHLY").forEach(m -> System.out.println("  " + m.getName()));
        System.out.println("Yearly count: " + repository.countByPlan("YEARLY"));
        System.out.println("Names starting with A:");
        repository.findByNameStartingWith("A").forEach(m -> System.out.println("  " + m.getName()));
    }
}
```

The output is:

```text
Monthly members:
  Aarav
  Kabir
  Meera
Yearly count: 2
Names starting with A:
  Aarav
  Anaya
  Aditi
```

### Medium: Car Rental Filters

DriveEasy rents cars in several cities. Each car has a model, a city, a daily rate in rupees and an `available` flag. Write four derived methods:

- Available cars in a city, cheapest first.
- Cars with a daily rate between two values.
- The single most expensive car in a city (as an `Optional`).
- Cars in any of several cities.

Save six cars and print the model names returned by each method.

Use these cars: Swift (Pune, 1200, available), City (Pune, 1800, available), Creta (Pune, 2500, not available), Innova (Mumbai, 3000, available), Polo (Mumbai, 1500, available), Nexon (Goa, 2200, available).

> **Hint:** Build the first name from `findBy`, `City`, `And`, `AvailableTrue` and `OrderByDailyRateAsc`. Use `Between` for the second, `findTopBy` with `OrderByDailyRateDesc` for the third, and `In` for the fourth, which takes a `List<String>`.

**Answer:** Each method is built from field names and keywords only. `findTop...` returns one row, so `Optional<Car>` is the right return type.

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

    <groupId>com.driveeasy</groupId>
    <artifactId>rental</artifactId>
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

**File:** `RentalApplication.java` in package `com.driveeasy.rental`

```java
package com.driveeasy.rental;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RentalApplication {

    public static void main(String[] args) {
        SpringApplication.run(RentalApplication.class, args);
    }
}
```

**File:** `Car.java` in package `com.driveeasy.rental`

```java
package com.driveeasy.rental;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String model;
    private String city;
    private int dailyRate;
    private boolean available;

    protected Car() {
    }

    public Car(String model, String city, int dailyRate, boolean available) {
        this.model = model;
        this.city = city;
        this.dailyRate = dailyRate;
        this.available = available;
    }

    public String getModel() {
        return model;
    }
}
```

**File:** `CarRepository.java` in package `com.driveeasy.rental`

```java
package com.driveeasy.rental;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CarRepository extends JpaRepository<Car, Long> {

    List<Car> findByCityAndAvailableTrueOrderByDailyRateAsc(String city);

    List<Car> findByDailyRateBetween(int low, int high);

    Optional<Car> findTopByCityOrderByDailyRateDesc(String city);

    List<Car> findByCityIn(List<String> cities);
}
```

**File:** `CarRunner.java` in package `com.driveeasy.rental`

```java
package com.driveeasy.rental;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CarRunner implements CommandLineRunner {

    private final CarRepository repository;

    public CarRunner(CarRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.saveAll(List.of(
                new Car("Swift", "Pune", 1200, true),
                new Car("City", "Pune", 1800, true),
                new Car("Creta", "Pune", 2500, false),
                new Car("Innova", "Mumbai", 3000, true),
                new Car("Polo", "Mumbai", 1500, true),
                new Car("Nexon", "Goa", 2200, true)));

        print("Pune, available, cheapest first", repository.findByCityAndAvailableTrueOrderByDailyRateAsc("Pune"));
        print("Rate 1500 to 2200", repository.findByDailyRateBetween(1500, 2200));
        System.out.println("Priciest in Mumbai: "
                + repository.findTopByCityOrderByDailyRateDesc("Mumbai").orElseThrow().getModel());
        print("Goa or Mumbai", repository.findByCityIn(List.of("Goa", "Mumbai")));
    }

    private void print(String label, List<Car> cars) {
        System.out.println(label + ":");
        cars.forEach(c -> System.out.println("  " + c.getModel()));
    }
}
```

The output is:

```text
Pune, available, cheapest first:
  Swift
  City
Rate 1500 to 2200:
  City
  Polo
  Nexon
Priciest in Mumbai: Innova
Goa or Mumbai:
  Innova
  Polo
  Nexon
```
