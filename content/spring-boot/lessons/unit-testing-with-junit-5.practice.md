Try each problem on your own first. Both projects are plain Java with the test starter, so each brings its own `pom.xml`.

### Easy: Library Fine Calculator

Lakeview Library charges 2 rupees for each day a book is late, and nothing when it is returned on time or early. Write a `FineCalculator` class with `int fine(int daysLate)` and a test class with three tests: 0 days late costs 0, 5 days late costs 10, and 3 days early (-3) costs 0.

> **Hint:** Use `Math.max(0, daysLate)` inside the method. Each test is one method with `@Test` and one `assertEquals` call.

**Answer:** The method clamps negative days to zero and multiplies by 2. Each test checks one case.

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

    <groupId>com.lakeview</groupId>
    <artifactId>fines</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

**File:** `FineCalculator.java` in package `com.lakeview`

```java
package com.lakeview;

public class FineCalculator {

    public int fine(int daysLate) {
        return Math.max(0, daysLate) * 2;
    }
}
```

**File:** `FineCalculatorTest.java` in `src/test/java/com/lakeview`

```java
package com.lakeview;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class FineCalculatorTest {

    private final FineCalculator calculator = new FineCalculator();

    @Test
    void onTimeCostsNothing() {
        assertEquals(0, calculator.fine(0));
    }

    @Test
    void fiveDaysLate() {
        assertEquals(10, calculator.fine(5));
    }

    @Test
    void earlyReturnCostsNothing() {
        assertEquals(0, calculator.fine(-3));
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

### Medium: Bakery Discount Rules

SweetCrumbs gives a discount on the cake total: 0 percent below 500 rupees, 5 percent from 500 up to 999, and 10 percent from 1000. A negative total is invalid and must throw `IllegalArgumentException`. Write `DiscountService` with the method `discountedTotal(int total)` and tests that use `@ParameterizedTest` for the boundaries 499, 500, 999 and 1000, plus `assertThrows` for -1.

> **Hint:** Use `@CsvSource` with rows like `500, 475`. Integer maths is fine: `total - total * percent / 100`.

**Answer:** The service picks the percentage with an if chain. The parameterized test covers each edge, and one more test checks the exception.

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

    <groupId>com.sweetcrumbs</groupId>
    <artifactId>discount</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

**File:** `DiscountService.java` in package `com.sweetcrumbs`

```java
package com.sweetcrumbs;

public class DiscountService {

    public int discountedTotal(int total) {
        if (total < 0) {
            throw new IllegalArgumentException("Total cannot be negative");
        }
        int percent = 0;
        if (total >= 1000) {
            percent = 10;
        } else if (total >= 500) {
            percent = 5;
        }
        return total - total * percent / 100;
    }
}
```

**File:** `DiscountServiceTest.java` in `src/test/java/com/sweetcrumbs`

```java
package com.sweetcrumbs;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class DiscountServiceTest {

    private DiscountService service;

    @BeforeEach
    void setUp() {
        service = new DiscountService();
    }

    @ParameterizedTest(name = "{0} becomes {1}")
    @CsvSource({"499, 499", "500, 475", "999, 950", "1000, 900"})
    void discountBoundaries(int total, int expected) {
        assertEquals(expected, service.discountedTotal(total));
    }

    @Test
    void negativeTotalIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> service.discountedTotal(-1));
    }
}
```

Run `./mvnw test`. Maven reports (the counts are split over lines here):

```text
Tests run: 5
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```
