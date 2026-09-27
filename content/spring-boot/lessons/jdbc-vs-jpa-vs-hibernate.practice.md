Try each problem on your own first. Each project has its own `pom.xml`, shown below.

### Easy: Pharmacy Stock with JPA

CityMed Pharmacy wants to keep its medicine stock in a database. Build a Spring Boot app with an entity `Medicine` (a name and a quantity), a repository, and a runner that saves two medicines with JPA and prints every medicine it reads back.

> **Hint:** You need `@Entity`, an `@Id` with `@GeneratedValue`, a protected empty constructor and an interface that extends `JpaRepository`. Use H2, so nothing has to be installed.

**Answer:** The repository gives you `save` and `findAll` for free. A `CommandLineRunner` runs once after startup, which is a good place to test.

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

    <groupId>com.citymed</groupId>
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

**File:** `StockApplication.java` in package `com.citymed.stock`

```java
package com.citymed.stock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StockApplication {

    public static void main(String[] args) {
        SpringApplication.run(StockApplication.class, args);
    }
}
```

**File:** `Medicine.java` in package `com.citymed.stock`

```java
package com.citymed.stock;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int quantity;

    protected Medicine() {
    }

    public Medicine(String name, int quantity) {
        this.name = name;
        this.quantity = quantity;
    }

    @Override
    public String toString() {
        return id + ": " + name + " x" + quantity;
    }
}
```

**File:** `MedicineRepository.java` in package `com.citymed.stock`

```java
package com.citymed.stock;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {
}
```

**File:** `StockRunner.java` in package `com.citymed.stock`

```java
package com.citymed.stock;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class StockRunner implements CommandLineRunner {

    private final MedicineRepository repository;

    public StockRunner(MedicineRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.save(new Medicine("Paracetamol", 120));
        repository.save(new Medicine("Cough Syrup", 45));
        repository.findAll().forEach(System.out::println);
    }
}
```

Run it with `mvn spring-boot:run`. The console shows:

```text
1: Paracetamol x120
2: Cough Syrup x45
```

### Medium: Library Fines Report with JdbcClient

PageTurn Library stores each fine as a row: the member's name and an amount in rupees. Save four fines with JPA (`saveAll`), then use `JdbcClient` and one SQL statement with `group by` to print how much each member owes in total, sorted by name.

Use these fines: Meera 20, Arjun 50, Meera 30, Kabir 10.

> **Hint:** Hibernate names the table `book_fine` and the column `member_name` from your field names. In SQL use `sum(amount)` and `group by member_name`.

**Answer:** Saving is easy with the repository. A total per member is a report, so plain SQL through `JdbcClient` is the simpler tool.

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

    <groupId>com.pageturn</groupId>
    <artifactId>fines</artifactId>
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

**File:** `FinesApplication.java` in package `com.pageturn.fines`

```java
package com.pageturn.fines;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FinesApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinesApplication.class, args);
    }
}
```

**File:** `BookFine.java` in package `com.pageturn.fines`

```java
package com.pageturn.fines;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class BookFine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String memberName;
    private int amount;

    protected BookFine() {
    }

    public BookFine(String memberName, int amount) {
        this.memberName = memberName;
        this.amount = amount;
    }
}
```

**File:** `BookFineRepository.java` in package `com.pageturn.fines`

```java
package com.pageturn.fines;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookFineRepository extends JpaRepository<BookFine, Long> {
}
```

**File:** `FineReport.java` in package `com.pageturn.fines`

```java
package com.pageturn.fines;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
public class FineReport implements CommandLineRunner {

    private final BookFineRepository repository;
    private final JdbcClient jdbc;

    public FineReport(BookFineRepository repository, JdbcClient jdbc) {
        this.repository = repository;
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        repository.saveAll(List.of(
                new BookFine("Meera", 20),
                new BookFine("Arjun", 50),
                new BookFine("Meera", 30),
                new BookFine("Kabir", 10)));

        jdbc.sql("select member_name, sum(amount) from book_fine "
                        + "group by member_name order by member_name")
                .query((rs, row) -> rs.getString(1) + " owes Rs " + rs.getInt(2))
                .list()
                .forEach(System.out::println);
    }
}
```

The output is:

```text
Arjun owes Rs 50
Kabir owes Rs 10
Meera owes Rs 50
```
