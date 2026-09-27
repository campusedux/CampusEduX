Try each problem on your own first. Both projects use the web starter and the web test starter, so each brings its own `pom.xml`.

### Easy: Bakery Context Test

SweetCrumbs keeps `bakery.cake-price=450` in `application.properties`. Build `PriceService` with `int priceFor(int cakes)` that multiplies the settings value by the number of cakes. Write a `@SpringBootTest` that injects the service and checks that 3 cakes cost 1350.

> **Hint:** Read the value with `@Value` in the constructor. In the test, add `@Autowired` on the service field and use `assertThat`.

**Answer:** The full context reads the real settings file, so the test proves that the setting reaches the service.

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
    <artifactId>bakery</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc-test</artifactId>
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

**File:** `application.properties` in `src/main/resources`

```properties
bakery.cake-price=450
```

**File:** `BakeryApplication.java` in package `com.sweetcrumbs`

```java
package com.sweetcrumbs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BakeryApplication {

    public static void main(String[] args) {
        SpringApplication.run(BakeryApplication.class, args);
    }
}
```

**File:** `PriceService.java` in package `com.sweetcrumbs`

```java
package com.sweetcrumbs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PriceService {

    private final int cakePrice;

    public PriceService(@Value("${bakery.cake-price}") int cakePrice) {
        this.cakePrice = cakePrice;
    }

    public int priceFor(int cakes) {
        return cakePrice * cakes;
    }
}
```

**File:** `PriceServiceTest.java` in `src/test/java/com/sweetcrumbs`

```java
package com.sweetcrumbs;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class PriceServiceTest {

    @Autowired
    private PriceService service;

    @Test
    void threeCakesCost1350() {
        assertThat(service.priceFor(3)).isEqualTo(1350);
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

### Medium: Library API with a Mocked Catalog

Lakeview Library has a `CatalogClient` bean that would call a slow remote catalog. Build `GET /books/count` returning `Books: N`, where N comes from `CatalogClient.countBooks()`. Write a `@SpringBootTest` with `MockMvc` that replaces `CatalogClient` with `@MockitoBean` returning 250, and checks the status and the body.

> **Hint:** Add `@AutoConfigureMockMvc`, a `@MockitoBean` field for the client, and stub the count with `when` and `thenReturn(250)`.

**Answer:** The mock replaces the real client inside the context, so the controller answers from the fake number.

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
    <artifactId>library</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc-test</artifactId>
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

**File:** `LibraryApplication.java` in package `com.lakeview`

```java
package com.lakeview;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LibraryApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryApplication.class, args);
    }
}
```

**File:** `CatalogClient.java` in package `com.lakeview`

```java
package com.lakeview;

import org.springframework.stereotype.Component;

@Component
public class CatalogClient {

    public int countBooks() {
        // A real client would call a remote catalog here.
        return 1;
    }
}
```

**File:** `BookController.java` in package `com.lakeview`

```java
package com.lakeview;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookController {

    private final CatalogClient client;

    public BookController(CatalogClient client) {
        this.client = client;
    }

    @GetMapping("/books/count")
    public String count() {
        return "Books: " + client.countBooks();
    }
}
```

**File:** `BookControllerTest.java` in `src/test/java/com/lakeview`

```java
package com.lakeview;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class BookControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private CatalogClient client;

    @Test
    void countComesFromTheMock() throws Exception {
        when(client.countBooks()).thenReturn(250);

        mvc.perform(get("/books/count"))
                .andExpect(status().isOk())
                .andExpect(content().string("Books: 250"));
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
