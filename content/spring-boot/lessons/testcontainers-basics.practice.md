Try each problem on your own first. Both projects need Docker to run their tests. We compiled both, but we could not start a container on our build machine, so the outputs below are marked as typical.

### Easy: Library Member Lookup on PostgreSQL

Lakeview Library stores members in PostgreSQL. Add a `Member` entity with `name` and `email`, a repository method `findByEmail`, and a Testcontainers test that saves one member and finds it by e-mail. Use `@ServiceConnection`.

> **Hint:** Copy the shape of the pharmacy test: a static `@Container` field of type `PostgreSQLContainer`, `@ServiceConnection`, `@DataJpaTest` and `Replace.NONE`. Return an `Optional<Member>` from the repository.

**Answer:** The container gives Spring Boot the connection, and the repository query runs on real PostgreSQL.

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
    <artifactId>members</artifactId>
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

**File:** `MembersApplication.java` in package `com.lake.members`

```java
package com.lake.members;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MembersApplication {

    public static void main(String[] args) {
        SpringApplication.run(MembersApplication.class, args);
    }
}
```

**File:** `Member.java` in package `com.lake.members`

```java
package com.lake.members;

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

    private String email;

    protected Member() {
    }

    public Member(String name, String email) {
        this.name = name;
        this.email = email;
    }

    public String getName() {
        return name;
    }
}
```

**File:** `MemberRepository.java` in package `com.lake.members`

```java
package com.lake.members;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);
}
```

**File:** `MemberRepositoryTest.java` in `src/test/java/com/lake/members`

```java
package com.lake.members;

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
@Testcontainers(disabledWithoutDocker = true)
class MemberRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    @Autowired
    private MemberRepository members;

    @Test
    void findsAMemberByEmail() {
        members.save(new Member("Asha", "asha@lakeview.example"));

        assertThat(members.findByEmail("asha@lakeview.example"))
                .get()
                .extracting(Member::getName)
                .isEqualTo("Asha");
    }
}
```

Run `./mvnw test` with Docker running. Typical result (not from our run):

```text
Tests run: 1
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```

Without Docker, the annotation `disabledWithoutDocker = true` makes Maven report the test as skipped.

### Medium: Order Status Counts with DynamicPropertySource

TiffinBox stores orders with a `status` of `NEW` or `DELIVERED`. Add `countByStatus` to the repository. In the test, wire the container by hand with `@DynamicPropertySource` instead of `@ServiceConnection`, and check that with two new orders and one delivered order the counts are 2 and 1.

> **Hint:** In a static method with a `DynamicPropertyRegistry` parameter, add `spring.datasource.url`, `spring.datasource.username` and `spring.datasource.password` from the container's getters.

**Answer:** The registry copies the container's real address into the Spring settings. This is the manual way that `@ServiceConnection` replaces.

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

**File:** `OrdersApplication.java` in package `com.tiffin.ord`

```java
package com.tiffin.ord;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }
}
```

**File:** `Ordr.java` in package `com.tiffin.ord`

```java
package com.tiffin.ord;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity(name = "TiffinOrder")
public class Ordr {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String status;

    protected Ordr() {
    }

    public Ordr(String status) {
        this.status = status;
    }
}
```

**File:** `OrdrRepository.java` in package `com.tiffin.ord`

```java
package com.tiffin.ord;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrdrRepository extends JpaRepository<Ordr, Long> {

    long countByStatus(String status);
}
```

**File:** `OrdrRepositoryTest.java` in `src/test/java/com/tiffin/ord`

```java
package com.tiffin.ord;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers(disabledWithoutDocker = true)
class OrdrRepositoryTest {

    @Container
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    @DynamicPropertySource
    static void connection(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private OrdrRepository orders;

    @Test
    void countsOrdersByStatus() {
        orders.save(new Ordr("NEW"));
        orders.save(new Ordr("NEW"));
        orders.save(new Ordr("DELIVERED"));

        assertThat(orders.countByStatus("NEW")).isEqualTo(2);
        assertThat(orders.countByStatus("DELIVERED")).isEqualTo(1);
    }
}
```

Run `./mvnw test` with Docker running. Typical result (not from our run):

```text
Tests run: 1
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```
