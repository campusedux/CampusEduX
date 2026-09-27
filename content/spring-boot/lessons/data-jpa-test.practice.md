Try each problem on your own first. Both projects need JPA, H2 and the data JPA test starter, so each brings its own `pom.xml`.

### Easy: Cheap Cakes Query

SweetCrumbs has a `Cake` entity with `name` and `price`. Add a repository method that finds cakes cheaper than a given price, and write a `@DataJpaTest` that saves three cakes (Vanilla 300, Chocolate 450, Truffle 700) and checks that the query for below 500 returns two.

> **Hint:** The derived name is `findByPriceLessThan`. Save the data with `TestEntityManager` and flush it.

**Answer:** Spring Data builds the query from the method name. The test saves three rows and expects the two below 500.

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
    <artifactId>cakes</artifactId>
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
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa-test</artifactId>
            <scope>test</scope>
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

**File:** `CakesApplication.java` in package `com.crumbs.cakes`

```java
package com.crumbs.cakes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CakesApplication {

    public static void main(String[] args) {
        SpringApplication.run(CakesApplication.class, args);
    }
}
```

**File:** `Cake.java` in package `com.crumbs.cakes`

```java
package com.crumbs.cakes;

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

    private int price;

    protected Cake() {
    }

    public Cake(String name, int price) {
        this.name = name;
        this.price = price;
    }

    public String getName() {
        return name;
    }

    public int getPrice() {
        return price;
    }
}
```

**File:** `CakeRepository.java` in package `com.crumbs.cakes`

```java
package com.crumbs.cakes;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CakeRepository extends JpaRepository<Cake, Long> {

    List<Cake> findByPriceLessThan(int price);
}
```

**File:** `CakeRepositoryTest.java` in `src/test/java/com/crumbs/cakes`

```java
package com.crumbs.cakes;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

@DataJpaTest
class CakeRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private CakeRepository cakes;

    @Test
    void findsCakesBelow500() {
        em.persist(new Cake("Vanilla", 300));
        em.persist(new Cake("Chocolate", 450));
        em.persist(new Cake("Truffle", 700));
        em.flush();

        assertThat(cakes.findByPriceLessThan(500))
                .extracting(Cake::getName)
                .containsExactlyInAnyOrder("Vanilla", "Chocolate");
    }
}
```

Run `./mvnw test`. Maven reports (the counts are split over lines here):

```text
Tests run: 1
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```

### Medium: Veg Dishes Sorted and Counted

TiffinBox stores `Dish` rows with `name`, `price` and `veg`. Add two repository methods: one that returns the veg dishes sorted by price from lowest to highest, and one that counts the non-veg dishes. Write tests for both, and add a third test that shows the database is empty at the start of each test.

> **Hint:** Use `findByVegTrueOrderByPriceAsc` and `countByVegFalse`. In the empty test, check that `count()` returns 0.

**Answer:** The method names describe the filter and the order. Because each test rolls back, the third test starts with no rows.

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

    <groupId>com.tiffin</groupId>
    <artifactId>box</artifactId>
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
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa-test</artifactId>
            <scope>test</scope>
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

**File:** `BoxApplication.java` in package `com.tiffin.box`

```java
package com.tiffin.box;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BoxApplication {

    public static void main(String[] args) {
        SpringApplication.run(BoxApplication.class, args);
    }
}
```

**File:** `Dish.java` in package `com.tiffin.box`

```java
package com.tiffin.box;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Dish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private int price;

    private boolean veg;

    protected Dish() {
    }

    public Dish(String name, int price, boolean veg) {
        this.name = name;
        this.price = price;
        this.veg = veg;
    }

    public String getName() {
        return name;
    }

    public int getPrice() {
        return price;
    }
}
```

**File:** `DishRepository.java` in package `com.tiffin.box`

```java
package com.tiffin.box;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DishRepository extends JpaRepository<Dish, Long> {

    List<Dish> findByVegTrueOrderByPriceAsc();

    long countByVegFalse();
}
```

**File:** `DishRepositoryTest.java` in `src/test/java/com/tiffin/box`

```java
package com.tiffin.box;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

@DataJpaTest
class DishRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private DishRepository dishes;

    private void addDishes() {
        em.persist(new Dish("Paneer Butter Masala", 220, true));
        em.persist(new Dish("Chicken Biryani", 260, false));
        em.persist(new Dish("Masala Dosa", 120, true));
        em.flush();
    }

    @Test
    void vegDishesAreSortedByPrice() {
        addDishes();

        assertThat(dishes.findByVegTrueOrderByPriceAsc())
                .extracting(Dish::getName)
                .containsExactly("Masala Dosa", "Paneer Butter Masala");
    }

    @Test
    void countsNonVegDishes() {
        addDishes();

        assertThat(dishes.countByVegFalse()).isEqualTo(1);
    }

    @Test
    void startsWithAnEmptyTable() {
        assertThat(dishes.count()).isZero();
    }
}
```

Run `./mvnw test`. Maven reports (the counts are split over lines here):

```text
Tests run: 3
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```
