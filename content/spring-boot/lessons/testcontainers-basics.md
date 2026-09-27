A tailor tests a new pattern on cheap cloth before cutting the real silk. The cloth is the same size and behaves the same way, so mistakes cost almost nothing. Testing a database is similar. A fake database such as H2 is cheap cloth, but it is not always the same weave as your real silk. Testcontainers lets you test on the real thing, in a container that lives only for the test.

This guide on Testcontainers basics shows how to start a real PostgreSQL database in a Docker container from a Spring Boot test, connect to it automatically, and throw it away when the tests end.

## What are Testcontainers basics?

> **Definition:** Testcontainers is a Java library that starts Docker containers, such as a database, from your test code, and removes them when the tests finish, so tests can use the same software as production.

The idea is simple. Your test says, "I need PostgreSQL 16." Testcontainers asks Docker to start that image, waits until the database is ready, and gives you its address and port. The test uses it, and afterwards the container is deleted. No database is installed on your laptop, and no leftover data remains.

Spring Boot supports this directly. With the annotation `@ServiceConnection`, Spring Boot reads the address of the container and sets up the data source for you, so you do not write a URL, a username or a password.

## Why is it used?

- **Same database as production.** Tests run against real PostgreSQL, not a lookalike. Vendor-specific SQL, types and functions behave truthfully.
- **No manual setup.** Every developer and every build server gets an identical, fresh database.
- **Clean every time.** A new container means no old data.
- **Works for more than databases.** The same idea works for Kafka, Redis, message brokers and mail servers.

The price is time and one requirement. Starting a container takes some seconds, and Docker must be running on the machine.

## How it works

When the test class starts, Testcontainers asks Docker for the image. Docker pulls it the first time and starts a container on a random free port. Spring Boot reads the connection details and configures the data source. The tests run, and at the end the container is stopped and removed.

```text
test class starts
      |
      v
ask Docker for postgres image
      |
      v
container starts (random port)
      |
      v
Spring Boot reads the address
(@ServiceConnection)
      |
      v
tests run on real PostgreSQL
      |
      v
container removed
```

The random port matters. Because the port is different each time, two builds on one machine never clash, and you never have to reserve a fixed port for tests.

## Real-Life Example

GreenLeaf Pharmacy keeps its medicine stock in PostgreSQL. The team wrote a search that ignores upper and lower case, and a query for low stock. On H2 the search worked, but the pharmacy wants proof on the same database engine it uses on the live system. A Testcontainers test starts a real PostgreSQL, saves two medicines, runs the queries, and shows that they behave correctly there.

## Code Example

Let's build the pharmacy stock repository and test it on a real PostgreSQL container. This needs Docker. We compiled and started it on a machine without Docker, so the results below tell you exactly what we saw.

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

    <groupId>com.greenleaf</groupId>
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
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-testcontainers</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>testcontainers-junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>testcontainers-postgresql</artifactId>
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

**File:** `StockApplication.java` in package `com.leaf.stock`

```java
package com.leaf.stock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StockApplication {

    public static void main(String[] args) {
        SpringApplication.run(StockApplication.class, args);
    }
}
```

**File:** `Medicine.java` in package `com.leaf.stock`

```java
package com.leaf.stock;

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

    public String getName() {
        return name;
    }

    public int getQuantity() {
        return quantity;
    }
}
```

**File:** `MedicineRepository.java` in package `com.leaf.stock`

```java
package com.leaf.stock;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    List<Medicine> findByNameContainingIgnoreCase(String part);

    List<Medicine> findByQuantityLessThan(int limit);
}
```

**File:** `MedicineRepositoryTest.java` in `src/test/java/com/leaf/stock`

```java
package com.leaf.stock;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class MedicineRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    @Autowired
    private MedicineRepository medicines;

    @Test
    void searchIgnoresCase() {
        medicines.save(new Medicine("Paracetamol 500", 120));
        medicines.save(new Medicine("Cough Syrup", 8));

        assertThat(medicines.findByNameContainingIgnoreCase("PARA"))
                .extracting(Medicine::getName)
                .containsExactly("Paracetamol 500");
    }

    @Test
    void findsLowStock() {
        medicines.save(new Medicine("Paracetamol 500", 120));
        medicines.save(new Medicine("Cough Syrup", 8));

        assertThat(medicines.findByQuantityLessThan(10)).hasSize(1);
    }
}
```

Run the tests on a machine where Docker is running:

```bash
./mvnw test
```

**Output:**

This is the typical result with Docker running. It is not copied from our run.

```text
Tests run: 2
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```

We could not start the container here, because our build machine has no Docker. The lines above are what you should see when Docker is available. The first run is slower, because Docker downloads the `postgres` image.

What we did see was this. The project compiled with the code above. When we ran the test with no Docker, it failed with `Could not find a valid Docker environment`. After we added `disabledWithoutDocker = true` to the `@Testcontainers` annotation, Maven reported 2 tests run and 2 skipped, and the build succeeded.

## Code Explained

- The pom adds three test dependencies: `spring-boot-testcontainers` for the Spring support, and the Testcontainers JUnit and PostgreSQL libraries. The versions come from the Spring Boot parent.
- The PostgreSQL driver has `runtime` scope. The app and the container both use it.
- `@Testcontainers` connects JUnit to the containers. `@Container` marks the field to start and stop.
- The field is `static`, so one container is shared by all tests in the class. A non-static field would start a new container for each test, which is much slower.
- `@ServiceConnection` tells Spring Boot to build the data source from the container. There is no URL or password in the project.
- `@DataJpaTest` loads the JPA slice, and `@AutoConfigureTestDatabase` with `Replace.NONE` stops it from swapping in H2.
- With a real PostgreSQL, `ddl-auto=create-drop` makes Hibernate build the tables for the test. Without it, an external database gets no tables in a slice test.
- The container class is the plain `PostgreSQLContainer` with the image name `postgres:16-alpine`. Use the same version as production.

## Skipping When Docker Is Missing

Some teammates or build servers have no Docker. With `disabledWithoutDocker = true`, the tests are skipped instead of failing. That is friendly, but be careful: a skipped test proves nothing. Make sure your main build server does run them.

## Common Mistakes

> **Warning:** A green build with skipped container tests is not a green light. Check the test report for skipped tests before trusting it.

- **Docker not running.** The tests fail with a Docker environment error. Start Docker first.
- **A non-static container.** Every test starts its own container and the suite becomes slow.
- **Different version from production.** Testing on PostgreSQL 16 while production runs 12 hides real differences.
- **Forgetting to stop H2 replacement.** Without `Replace.NONE`, the slice ignores your container and uses H2.
- **Hard-coding a port.** The port is random. Let `@ServiceConnection` supply it.

## Interview Questions

**What is Testcontainers?**
A library that starts real services, such as databases, in Docker containers for the duration of a test.

**Why not just use H2?**
H2 is not your production database, so vendor-specific behaviour can differ. Testcontainers uses the real engine.

**What does `@ServiceConnection` do?**
It lets Spring Boot read the container's address and credentials and configure the connection automatically.

## Key Points to Remember

- Testcontainers runs real services in Docker for tests.
- It needs Docker on the machine.
- `@Container` starts the container, and a static field shares it across tests.
- `@ServiceConnection` wires the data source without a URL.
- Use the same image version as production.
- Use it for behaviour that H2 cannot copy, and H2 for quick simple checks.

## Frequently Asked Questions

### What are Testcontainers basics for Spring Boot?

Add the Testcontainers libraries, declare a `@Container` field, and mark it with `@ServiceConnection`. Spring Boot then connects to the container by itself.

### Do I need Docker installed?

Yes. Testcontainers talks to a Docker environment. Without it the tests fail, or are skipped if you asked for that.

### Is Testcontainers slower than H2?

Yes, because starting a container takes time. Sharing one static container across the tests of a class keeps the cost low.

### Can I use it for services other than databases?

Yes. There are containers for Kafka, Redis, RabbitMQ, Elasticsearch and many others.

## Related Topics

- [@DataJpaTest](/learning/spring-boot-tutorial/data-jpa-test): the fast slice test that this builds on.
- [Docker for Spring Boot](/learning/spring-boot-tutorial/docker-for-spring-boot): the Docker basics that Testcontainers needs.
- [Connecting Spring Boot to PostgreSQL](/learning/spring-boot-tutorial/connecting-spring-boot-to-postgresql): the production side of the same database.
- [Kafka with Spring Boot](/learning/spring-boot-tutorial/kafka-with-spring-boot): another service you can run in a container.
