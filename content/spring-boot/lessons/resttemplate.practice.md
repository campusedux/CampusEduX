Try each problem on your own first. Both call a second API that lives in the same app, as the BakeHouse example does.

### Easy: CityCab Fare Calculator

CityCab has a rate service at `/rates/current` that returns `perKmInRupees` and `baseFareInRupees`. Build a trip fare endpoint that takes `km` and calls the rate service with RestTemplate and replies `A 12 km trip costs Rs 208`. The fare is the base fare plus the per-km rate times the distance.

> **Hint:** Declare a `RestTemplate` bean with `new RestTemplate()`. Call `getForObject(url, Rate.class)` and read the URL from a property.

**Answer:** No extra starter is needed, because `RestTemplate` ships with the web starter. With a base fare of 40 and 14 per km, twelve kilometres cost 40 plus 168, which is 208.

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

    <groupId>com.citycab</groupId>
    <artifactId>fares</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
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
rate.url=http://localhost:${server.port:8080}/rates/current
```

**File:** `FaresApplication.java` in package `com.citycab.fares`

```java
package com.citycab.fares;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class FaresApplication {

    public static void main(String[] args) {
        SpringApplication.run(FaresApplication.class, args);
    }

    @Bean
    RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

**File:** `RateController.java` in package `com.citycab.fares`

```java
package com.citycab.fares;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Pretend this is the rate service of another team. */
@RestController
public class RateController {

    record Rate(int perKmInRupees, int baseFareInRupees) {}

    @GetMapping("/rates/current")
    public Rate current() {
        return new Rate(14, 40);
    }
}
```

**File:** `TripController.java` in package `com.citycab.fares`

```java
package com.citycab.fares;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class TripController {

    record Rate(int perKmInRupees, int baseFareInRupees) {}

    private final RestTemplate restTemplate;
    private final String rateUrl;

    public TripController(RestTemplate restTemplate, @Value("${rate.url}") String rateUrl) {
        this.restTemplate = restTemplate;
        this.rateUrl = rateUrl;
    }

    @GetMapping("/trip/fare")
    public String fare(@RequestParam int km) {
        Rate rate = restTemplate.getForObject(rateUrl, Rate.class);
        int total = rate.baseFareInRupees() + km * rate.perKmInRupees();
        return "A " + km + " km trip costs Rs " + total;
    }
}
```

Ask for a twelve kilometre trip:

```bash
curl "localhost:8080/trip/fare?km=12"
```

It prints:

```text
A 12 km trip costs Rs 208
```

### Medium: Medico Doctor Directory Client

A clinic app calls the hospital's doctor directory at `/directory/doctors`, which returns a JSON list of doctors with `name` and `speciality`. Build a clinic endpoint that takes a `speciality` query value and returns only the matching doctors, ignoring case. Use `exchange` with a `ParameterizedTypeReference`, set connect and read timeouts, and turn any client failure into status 502 with a friendly message.

> **Hint:** Catch `RestClientException`, the parent of every RestTemplate failure, and throw `ResponseStatusException` with `HttpStatus.BAD_GATEWAY`.

**Answer:** The type reference keeps the `Doctor` type alive, so Jackson builds a real `List<Doctor>`. The builder sets the timeouts. When we started the app with the directory address pointing at a closed port, the reply was status 502.

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

    <groupId>com.medico</groupId>
    <artifactId>clinic</artifactId>
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
            <artifactId>spring-boot-starter-restclient</artifactId>
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
directory.base-url=http://localhost:${server.port:8080}/directory
```

**File:** `ClinicApplication.java` in package `com.medico.clinic`

```java
package com.medico.clinic;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.restclient.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.DefaultUriBuilderFactory;

@SpringBootApplication
public class ClinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClinicApplication.class, args);
    }

    @Bean
    RestTemplate directoryClient(RestTemplateBuilder builder,
                                 @Value("${directory.base-url}") String baseUrl) {
        return builder
                .uriTemplateHandler(new DefaultUriBuilderFactory(baseUrl))
                .connectTimeout(Duration.ofSeconds(1))
                .readTimeout(Duration.ofSeconds(2))
                .build();
    }
}
```

**File:** `DirectoryController.java` in package `com.medico.clinic`

```java
package com.medico.clinic;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Pretend this is the hospital's doctor directory. */
@RestController
@RequestMapping("/directory")
public class DirectoryController {

    record Doctor(String name, String speciality) {}

    @GetMapping("/doctors")
    public List<Doctor> doctors() {
        return List.of(
                new Doctor("Dr. Rao", "Cardiology"),
                new Doctor("Dr. Iyer", "Dermatology"),
                new Doctor("Dr. Sen", "Cardiology"));
    }
}
```

**File:** `ClinicController.java` in package `com.medico.clinic`

```java
package com.medico.clinic;

import java.util.List;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ClinicController {

    record Doctor(String name, String speciality) {}

    private final RestTemplate directory;

    public ClinicController(RestTemplate directory) {
        this.directory = directory;
    }

    @GetMapping("/clinic/doctors")
    public List<Doctor> bySpeciality(@RequestParam String speciality) {
        try {
            List<Doctor> all = directory.exchange("/doctors", HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<Doctor>>() {}).getBody();
            return all.stream()
                    .filter(d -> d.speciality().equalsIgnoreCase(speciality))
                    .toList();
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Doctor directory is not reachable");
        }
    }
}
```

The cardiology call returns:

```json
[
  {
    "name": "Dr. Rao",
    "speciality": "Cardiology"
  },
  {
    "name": "Dr. Sen",
    "speciality": "Cardiology"
  }
]
```

The JSON is spaced out here; curl prints it on one line.
