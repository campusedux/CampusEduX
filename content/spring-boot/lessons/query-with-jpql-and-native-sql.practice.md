Try each problem on your own first. Each project has its own `pom.xml`, shown below.

### Easy: Doctors by Department with JPQL

Green Valley Hospital stores doctors with a name, a department and a consultation fee. Write a JPQL query in the repository that returns the doctors of one department whose fee is at most a given amount, cheapest first. Save five doctors and print the names that match `Cardiology` with a fee of 800 or less.

Use these doctors: Dr. Rao (Cardiology, 700), Dr. Sen (Cardiology, 900), Dr. Iyer (Cardiology, 500), Dr. Shah (Skin, 400), Dr. Nair (Cardiology, 800).

> **Hint:** Use `@Query` with `select d from Doctor d where d.department = :department and d.fee <= :maxFee order by d.fee`, and mark both arguments with `@Param`.

**Answer:** The query names the class `Doctor` and its fields, not a table. The two named parameters are filled from the method arguments.

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

    <groupId>com.greenvalley</groupId>
    <artifactId>clinic</artifactId>
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

**File:** `ClinicApplication.java` in package `com.greenvalley.clinic`

```java
package com.greenvalley.clinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ClinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClinicApplication.class, args);
    }
}
```

**File:** `Doctor.java` in package `com.greenvalley.clinic`

```java
package com.greenvalley.clinic;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String department;
    private int fee;

    protected Doctor() {
    }

    public Doctor(String name, String department, int fee) {
        this.name = name;
        this.department = department;
        this.fee = fee;
    }

    @Override
    public String toString() {
        return name + " Rs" + fee;
    }
}
```

**File:** `DoctorRepository.java` in package `com.greenvalley.clinic`

```java
package com.greenvalley.clinic;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    @Query("select d from Doctor d where d.department = :department "
            + "and d.fee <= :maxFee order by d.fee")
    List<Doctor> affordableIn(@Param("department") String department,
                              @Param("maxFee") int maxFee);
}
```

**File:** `DoctorRunner.java` in package `com.greenvalley.clinic`

```java
package com.greenvalley.clinic;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DoctorRunner implements CommandLineRunner {

    private final DoctorRepository repository;

    public DoctorRunner(DoctorRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.saveAll(List.of(
                new Doctor("Dr. Rao", "Cardiology", 700),
                new Doctor("Dr. Sen", "Cardiology", 900),
                new Doctor("Dr. Iyer", "Cardiology", 500),
                new Doctor("Dr. Shah", "Skin", 400),
                new Doctor("Dr. Nair", "Cardiology", 800)));

        System.out.println("Cardiology up to Rs800:");
        repository.affordableIn("Cardiology", 800).forEach(d -> System.out.println("  " + d));
    }
}
```

The output is:

```text
Cardiology up to Rs800:
  Dr. Iyer Rs500
  Dr. Rao Rs700
  Dr. Nair Rs800
```

### Medium: Cancelled Orders Cleanup with @Modifying

FoodieHub keeps food orders with an item, a status (`NEW` or `CANCELLED`) and a total in rupees. Write two `@Modifying` JPQL queries: one that gives a 10 rupee discount to every `NEW` order, and one that deletes every `CANCELLED` order. Both return the number of rows changed. Save four orders, run both queries, and print the row counts and the orders that remain.

Use these orders: Veg Thali (NEW, 150), Pizza (CANCELLED, 400), Biryani (NEW, 250), Noodles (CANCELLED, 180).

> **Hint:** Put `@Modifying` and `@Transactional` on each method. The entity cannot be called `Order`, because that is a reserved word in SQL, so call it `FoodOrder`. The JPQL update reads `update FoodOrder o set o.total = o.total - :off where o.status = :status`.

**Answer:** Bulk updates and deletes run as one SQL statement each and return how many rows they touched. After them, `findAll()` shows the changed data, because it loads fresh rows.

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

    <groupId>com.foodiehub</groupId>
    <artifactId>orders</artifactId>
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

**File:** `OrdersApplication.java` in package `com.foodiehub.orders`

```java
package com.foodiehub.orders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }
}
```

**File:** `FoodOrder.java` in package `com.foodiehub.orders`

```java
package com.foodiehub.orders;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class FoodOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String item;
    private String status;
    private int total;

    protected FoodOrder() {
    }

    public FoodOrder(String item, String status, int total) {
        this.item = item;
        this.status = status;
        this.total = total;
    }

    @Override
    public String toString() {
        return item + " " + status + " Rs" + total;
    }
}
```

**File:** `FoodOrderRepository.java` in package `com.foodiehub.orders`

```java
package com.foodiehub.orders;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {

    @Modifying
    @Transactional
    @Query("update FoodOrder o set o.total = o.total - :off where o.status = :status")
    int discount(@Param("status") String status, @Param("off") int off);

    @Modifying
    @Transactional
    @Query("delete from FoodOrder o where o.status = :status")
    int removeByStatus(@Param("status") String status);
}
```

**File:** `CleanupRunner.java` in package `com.foodiehub.orders`

```java
package com.foodiehub.orders;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CleanupRunner implements CommandLineRunner {

    private final FoodOrderRepository repository;

    public CleanupRunner(FoodOrderRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.saveAll(List.of(
                new FoodOrder("Veg Thali", "NEW", 150),
                new FoodOrder("Pizza", "CANCELLED", 400),
                new FoodOrder("Biryani", "NEW", 250),
                new FoodOrder("Noodles", "CANCELLED", 180)));

        System.out.println("Discounted: " + repository.discount("NEW", 10));
        System.out.println("Removed: " + repository.removeByStatus("CANCELLED"));
        repository.findAll().forEach(System.out::println);
    }
}
```

The output is:

```text
Discounted: 2
Removed: 2
Veg Thali NEW Rs140
Biryani NEW Rs240
```
