Try each problem on your own first. Both use the same `pom.xml` as the PageTurn example; only change the `groupId` and `artifactId`.

### Easy: Clinic Doctors on Duty

Sunrise Clinic wants a small API for its waiting room screen. Build three classes with three jobs: a `Doctor` record with `name` and `specialty`, a `DoctorService` that holds the list, and a `DoctorController` that answers `GET /doctors`. Use two doctors: Dr. Nisha Patil (Pediatrics) and Dr. Rohan Kulkarni (Orthopedics).

> **Hint:** The service is a class marked `@Service`. The controller receives it through its constructor. The controller only calls `service.findAll()` and returns the result.

**Answer:** The controller does no work itself. It asks the service for the list, and Jackson turns the records into JSON.

**File:** `ClinicApplication.java` in package `com.sunrise.clinic`

```java
package com.sunrise.clinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ClinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClinicApplication.class, args);
    }
}
```

**File:** `Doctor.java` in package `com.sunrise.clinic`

```java
package com.sunrise.clinic;

public record Doctor(String name, String specialty) {}
```

**File:** `DoctorService.java` in package `com.sunrise.clinic`

```java
package com.sunrise.clinic;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class DoctorService {

    public List<Doctor> findAll() {
        return List.of(
                new Doctor("Dr. Nisha Patil", "Pediatrics"),
                new Doctor("Dr. Rohan Kulkarni", "Orthopedics"));
    }
}
```

**File:** `DoctorController.java` in package `com.sunrise.clinic`

```java
package com.sunrise.clinic;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DoctorController {

    private final DoctorService service;

    public DoctorController(DoctorService service) {
        this.service = service;
    }

    @GetMapping("/doctors")
    public List<Doctor> list() {
        return service.findAll();
    }
}
```

Run `mvn spring-boot:run`, then `curl http://localhost:8080/doctors` prints:

```json
[
  {
    "name": "Dr. Nisha Patil",
    "specialty": "Pediatrics"
  },
  {
    "name": "Dr. Rohan Kulkarni",
    "specialty": "Orthopedics"
  }
]
```

curl prints the JSON on one line; it is spaced out here so it is easy to read.

### Medium: Cinema Shows with Three Layers

StarPlex Cinema wants its show data kept in a separate repository class. Build a controller, a service and a repository:

- `ShowRepository` holds the list of shows (a record with `movie` and `seatsLeft`).
- `ShowService` has `findAll()` and `countSoldOut()`, which counts shows with zero seats left.
- `ShowController` serves `GET /shows` and `GET /shows/sold-out-count`.

Use these shows: Monsoon Express (0 seats), The Silent Orbit (42 seats), Night Market (0 seats).

> **Hint:** Mark the repository with `@Repository`, the service with `@Service`, and give each class a constructor that receives the layer below it. The count is a stream filter on `seatsLeft() == 0`.

**Answer:** Each layer only talks to the layer directly below it: controller to service to repository. The count rule lives in the service, not in the controller.

**File:** `StarplexApplication.java` in package `com.starplex.shows`

```java
package com.starplex.shows;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StarplexApplication {

    public static void main(String[] args) {
        SpringApplication.run(StarplexApplication.class, args);
    }
}
```

**File:** `Show.java` in package `com.starplex.shows`

```java
package com.starplex.shows;

public record Show(String movie, int seatsLeft) {}
```

**File:** `ShowRepository.java` in package `com.starplex.shows`

```java
package com.starplex.shows;

import java.util.List;

import org.springframework.stereotype.Repository;

@Repository
public class ShowRepository {

    public List<Show> findAll() {
        return List.of(
                new Show("Monsoon Express", 0),
                new Show("The Silent Orbit", 42),
                new Show("Night Market", 0));
    }
}
```

**File:** `ShowService.java` in package `com.starplex.shows`

```java
package com.starplex.shows;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class ShowService {

    private final ShowRepository repository;

    public ShowService(ShowRepository repository) {
        this.repository = repository;
    }

    public List<Show> findAll() {
        return repository.findAll();
    }

    public long countSoldOut() {
        return repository.findAll().stream()
                .filter(s -> s.seatsLeft() == 0)
                .count();
    }
}
```

**File:** `ShowController.java` in package `com.starplex.shows`

```java
package com.starplex.shows;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ShowController {

    private final ShowService service;

    public ShowController(ShowService service) {
        this.service = service;
    }

    @GetMapping("/shows")
    public List<Show> list() {
        return service.findAll();
    }

    @GetMapping("/shows/sold-out-count")
    public long soldOutCount() {
        return service.countSoldOut();
    }
}
```

Calling the sold-out endpoint prints `2`:

```bash
curl http://localhost:8080/shows/sold-out-count
```
