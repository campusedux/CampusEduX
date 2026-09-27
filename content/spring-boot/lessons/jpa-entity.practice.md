Try each problem on your own first. Each project has its own `pom.xml`, shown below.

### Easy: Bakery Pastry Entity with Rules

Golden Crust Bakery wants a `Pastry` entity stored in the table `pastries`. It has a name (required, at most 40 characters), a category that is an enum (`CAKE`, `BREAD` or `SNACK`) stored as text, and a price in rupees with two decimals. Save one valid pastry and print it. Then try to save a pastry with no name, and print `Name is required` when the database refuses it.

> **Hint:** Use `@Table`, `@Column(nullable = false, length = 40)`, `@Enumerated(EnumType.STRING)` and `BigDecimal`. Catch Spring's data-integrity exception, which lives in `org.springframework.dao`.

**Answer:** The `not null` rule lives in the entity annotation, and the database enforces it. Spring converts the low-level error into a data-integrity exception.

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

    <groupId>com.goldencrust</groupId>
    <artifactId>bakery</artifactId>
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

**File:** `BakeryApplication.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BakeryApplication {

    public static void main(String[] args) {
        SpringApplication.run(BakeryApplication.class, args);
    }
}
```

**File:** `Category.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

public enum Category {
    CAKE, BREAD, SNACK
}
```

**File:** `Pastry.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pastries")
public class Pastry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Category category;

    @Column(precision = 8, scale = 2)
    private BigDecimal price;

    protected Pastry() {
    }

    public Pastry(String name, Category category, String price) {
        this.name = name;
        this.category = category;
        this.price = new BigDecimal(price);
    }

    @Override
    public String toString() {
        return id + " " + name + " " + category + " Rs" + price;
    }
}
```

**File:** `PastryRepository.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PastryRepository extends JpaRepository<Pastry, Long> {
}
```

**File:** `PastryRunner.java` in package `com.goldencrust.bakery`

```java
package com.goldencrust.bakery;

import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

@Component
public class PastryRunner implements CommandLineRunner {

    private final PastryRepository repository;

    public PastryRunner(PastryRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        System.out.println(repository.save(new Pastry("Fruit Cake", Category.CAKE, "550.00")));
        try {
            repository.save(new Pastry(null, Category.BREAD, "40.00"));
        } catch (DataIntegrityViolationException e) {
            System.out.println("Name is required");
        }
    }
}
```

The output is:

```text
1 Fruit Cake CAKE Rs550.00
Name is required
```

### Medium: Gym Member with a Locked Join Date

IronWorks Gym stores members in the table `gym_members`. A member has a full name, a unique email, a plan (`MONTHLY` or `YEARLY`, stored as text) and a join date. The join date must never change after the first save. Save a member, then change both the name and the join date and save again. Reload the member and print it. The name must change, but the join date must stay the same.

> **Hint:** Put `updatable = false` on the join date column. Hibernate then leaves that column out of every `update` statement. The runner has no transaction, so each repository call works with fresh data.

**Answer:** `@Column(updatable = false)` protects a column after the first insert. The setter still changes the Java field, but the change is not written to the database, and the reload shows the stored value.

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

    <groupId>com.ironworks</groupId>
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

**File:** `GymApplication.java` in package `com.ironworks.gym`

```java
package com.ironworks.gym;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GymApplication {

    public static void main(String[] args) {
        SpringApplication.run(GymApplication.class, args);
    }
}
```

**File:** `Plan.java` in package `com.ironworks.gym`

```java
package com.ironworks.gym;

public enum Plan {
    MONTHLY, YEARLY
}
```

**File:** `GymMember.java` in package `com.ironworks.gym`

```java
package com.ironworks.gym;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "gym_members")
public class GymMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    private Plan plan;

    @Column(nullable = false, updatable = false)
    private LocalDate joinedOn;

    protected GymMember() {
    }

    public GymMember(String fullName, String email, Plan plan, LocalDate joinedOn) {
        this.fullName = fullName;
        this.email = email;
        this.plan = plan;
        this.joinedOn = joinedOn;
    }

    public Long getId() {
        return id;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setJoinedOn(LocalDate joinedOn) {
        this.joinedOn = joinedOn;
    }

    @Override
    public String toString() {
        return fullName + " " + plan + " " + joinedOn;
    }
}
```

**File:** `GymMemberRepository.java` in package `com.ironworks.gym`

```java
package com.ironworks.gym;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GymMemberRepository extends JpaRepository<GymMember, Long> {
}
```

**File:** `MemberRunner.java` in package `com.ironworks.gym`

```java
package com.ironworks.gym;

import java.time.LocalDate;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class MemberRunner implements CommandLineRunner {

    private final GymMemberRepository repository;

    public MemberRunner(GymMemberRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        GymMember member = repository.save(new GymMember(
                "Kabir Nair", "kabir@example.com", Plan.MONTHLY, LocalDate.of(2026, 2, 1)));

        member.setFullName("Kabir K. Nair");
        member.setJoinedOn(LocalDate.of(2020, 1, 1));
        repository.save(member);

        GymMember reloaded = repository.findById(member.getId()).orElseThrow();
        System.out.println(reloaded);
    }
}
```

The output is:

```text
Kabir K. Nair MONTHLY 2026-02-01
```
