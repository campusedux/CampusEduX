You would never open a new cinema without testing the projector. Before the first show, someone plays a short clip and checks the picture and the sound. If something is wrong, you find out in an empty hall, not in front of two hundred people. A unit test is that short clip for one small piece of your code.

In this guide on unit testing with JUnit 5 you will write your first tests, run them with Maven, read a failure, and learn the annotations you will use every day.

## What is unit testing with JUnit 5?

> **Definition:** A unit test is a small automatic check that runs one piece of code, such as a method, and compares the result with what you expect. JUnit is the Java library that finds and runs such tests.

A test method has three simple parts: prepare the input, call the code, and check the result. If the result is different from what you expected, the test fails and tells you exactly what was different.

JUnit 5 introduced the modern style with the package `org.junit.jupiter.api`. Spring Boot 4.1 ships a newer JUnit release, version 6. Its test annotations live in the same packages and work the same way, so everything in this guide is written the JUnit 5 way and runs unchanged. We checked this by building the project below.

## Why is it used?

- **Fast feedback.** A unit test runs in milliseconds, without a server or a database.
- **Safe changes.** When you change code later, the old tests tell you if you broke something.
- **Living documentation.** A test named "Weekend adds 50 rupees" tells the next developer how the code should behave.
- **Fewer bugs in production.** Edge cases, such as a negative age, are checked before customers meet them.

## How it works

Maven's test phase runs the Surefire plugin. Surefire starts the JUnit engine, which scans your test folder for methods marked with `@Test`, runs each one on a fresh object, and collects the results.

```text
mvn test
   |
   v
+-----------------+
| Surefire plugin |
+-----------------+
   |
   v
+-----------------+
| JUnit engine    |
+-----------------+
   |
   v
 finds @Test methods
   |
   v
 runs each one
   |
   v
 pass or fail report
```

Each test method gets its own new instance of the test class, so one test cannot disturb another. If any assertion fails, the method stops there, is marked failed, and the report shows the expected and the actual value. Maven then ends with BUILD FAILURE, so a broken test also stops your build.

## The Annotations You Will Use

| Annotation | Purpose |
|---|---|
| `@Test` | Marks a test method |
| `@DisplayName` | A readable name for the report |
| `@BeforeEach` | Runs before every test |
| `@AfterEach` | Runs after every test |
| `@ParameterizedTest` | Runs one test with many inputs |
| `@Disabled` | Skips a test for now |

## Real-Life Example

Star Cinema prices its tickets by age and day. An adult pays 200 rupees. Children under 12 and senior citizens aged 60 or more pay half. On a weekend, everyone pays 50 rupees extra. Rules like these are easy to get slightly wrong, for example by using `age <= 60` instead of `age < 60`. A handful of tests around the ages 11, 12, 59 and 60 catch that mistake at once.

## Code Example

Let's build the ticket price rules and test them. This project has no web server and no Spring context. It is plain Java with the test starter, which brings JUnit, AssertJ and Mockito.

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

    <groupId>com.starcinema</groupId>
    <artifactId>pricing</artifactId>
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

**File:** `TicketPricer.java` in package `com.starcinema`

```java
package com.starcinema;

public class TicketPricer {

    private static final int BASE_PRICE = 200;

    public int price(int age, boolean weekend) {
        if (age < 0) {
            throw new IllegalArgumentException("Age cannot be negative");
        }
        int price = BASE_PRICE;
        if (age < 12 || age >= 60) {
            price = price / 2;
        }
        if (weekend) {
            price = price + 50;
        }
        return price;
    }
}
```

**File:** `TicketPricerTest.java` in `src/test/java/com/starcinema`

```java
package com.starcinema;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class TicketPricerTest {

    private TicketPricer pricer;

    @BeforeEach
    void setUp() {
        pricer = new TicketPricer();
    }

    @Test
    @DisplayName("Adult pays the full price on a weekday")
    void adultWeekday() {
        assertEquals(200, pricer.price(30, false));
    }

    @Test
    @DisplayName("Weekend adds 50 rupees")
    void weekendSurcharge() {
        assertThat(pricer.price(30, true)).isEqualTo(250);
    }

    @ParameterizedTest(name = "age {0} pays {1}")
    @CsvSource({"5, 100", "11, 100", "12, 200", "59, 200", "60, 100", "75, 100"})
    void discountByAge(int age, int expected) {
        assertEquals(expected, pricer.price(age, false));
    }

    @Test
    @DisplayName("Negative age is rejected")
    void negativeAge() {
        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> pricer.price(-1, false));
        assertThat(ex).hasMessage("Age cannot be negative");
    }
}
```

Run the tests:

```bash
./mvnw test
```

**Output:**

```text
Tests run: 9
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```

Maven prints the four counts on one line; they are split here for reading. Nine tests ran: two plain tests, six rows from the parameterized test and one for the exception.

## Code Explained

- `TicketPricer` is normal Java. It knows nothing about Spring, and that is why testing it is so quick.
- `@BeforeEach` builds a new `TicketPricer` before every test, so tests never share state.
- `assertEquals(expected, actual)` compares two values. The expected value comes first.
- `assertThat(...).isEqualTo(...)` is the AssertJ style. It reads like a sentence and gives good messages.
- `@ParameterizedTest` with `@CsvSource` runs the same method six times, once for each row. The name pattern `age {0} pays {1}` shows in the report.
- `assertThrows` checks that the code throws the expected exception, and returns it so we can check its message.
- The test class is package-private and its methods are too. JUnit does not need `public`.

We then broke a test on purpose by expecting 300 for an adult. Maven reported one failure, `adultWeekday`, with the message `expected: <300> but was: <200>`, and finished with BUILD FAILURE. After we changed the number back, the build passed.

## Writing Good Tests

Keep each test small and focused on one behaviour. Name it after the behaviour, not the method. Test the edges: the values just below and just above a rule, empty input, and invalid input. Do not test Java itself, and do not copy the production logic into the test, because then both will contain the same mistake.

## Common Mistakes

> **Warning:** A test that never fails is worthless. If you write a test after the code, break the code once on purpose and check that the test turns red.

- **Wrong argument order.** `assertEquals(actual, expected)` gives a confusing failure message. Put the expected value first.
- **Tests that depend on each other.** The order of tests is not guaranteed. Each test must set up its own data.
- **Testing many things in one method.** When it fails, you do not know which rule broke.
- **Using the wrong test package.** Put tests under `src/test/java`, in the same package as the class under test, so Maven finds them.
- **Mixing old and new imports.** Import from `org.junit.jupiter`, not from the old `org.junit` package of JUnit 4.

## Interview Questions

**What is the difference between JUnit 4 and JUnit 5?**
JUnit 5 is modular, uses the `org.junit.jupiter` package and has annotations like `@BeforeEach` and `@ParameterizedTest`. JUnit 4 used `@Before` and runners.

**What does `@BeforeEach` do?**
It runs before every test method, and is used to create fresh test data.

**How do you test that a method throws an exception?**
Use `assertThrows` with the expected exception type and a lambda that calls the method.

## Key Points to Remember

- A unit test checks one small piece of code, quickly and without a server.
- `spring-boot-starter-test` brings JUnit, AssertJ and Mockito.
- Mark tests with `@Test` and run them with `mvn test`.
- `@BeforeEach` gives every test a fresh start.
- `@ParameterizedTest` covers many inputs in one method.
- Test the edges of each rule.

## Frequently Asked Questions

### What is unit testing with JUnit 5 in Spring Boot?

It is writing small automatic tests with JUnit's Jupiter API to check single classes. Spring Boot's test starter already includes everything needed.

### Do I need to start Spring for a unit test?

No. A plain unit test just creates the object with `new`. That is why it is fast. Tests that need Spring come later in this course.

### Does Spring Boot 4 use JUnit 5 or JUnit 6?

Spring Boot 4.1 ships JUnit 6. The annotations you learn for JUnit 5 keep the same names and packages, so your tests work as they are.

### Where do test files go?

In `src/test/java`, mirroring the package of the code they test. Their names normally end with `Test`.

## Related Topics

- [Mockito in Spring Boot](/learning/spring-boot-tutorial/mockito-in-spring-boot): replace slow or unavailable dependencies in a test.
- [@SpringBootTest](/learning/spring-boot-tutorial/spring-boot-test): start the whole application in a test.
- [@WebMvcTest and MockMvc](/learning/spring-boot-tutorial/web-mvc-test-and-mockmvc): test only the web layer.
- [Spring Boot Starters](/learning/spring-boot-tutorial/spring-boot-starters): what the test starter contains.
