Try each problem on your own first. Both start from a fresh Spring Initializr project with Spring Web.

### Easy: BrightPath Tutors About Page

BrightPath Tutors wants a simple page at `/about.html` with the heading "About BrightPath Tutors" and one line: "Maths and science classes for grades 6 to 10." Add it without writing any Java controller.

> **Hint:** Files in `src/main/resources/static` are served at the same path they have inside that folder.

**Answer:** Create `about.html` in the `static` folder. Spring Boot serves it at `/about.html`; the main class stays as Initializr made it.

**File:** `TutorsApplication.java` in package `com.brightpath.tutors`

```java
package com.brightpath.tutors;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TutorsApplication {

    public static void main(String[] args) {
        SpringApplication.run(TutorsApplication.class, args);
    }
}
```

**File:** `about.html` in `src/main/resources/static`

```html
<!DOCTYPE html>
<html>
<head><title>About BrightPath Tutors</title></head>
<body>
  <h1>About BrightPath Tutors</h1>
  <p>Maths and science classes for grades 6 to 10.</p>
</body>
</html>
```

Run the app and open `localhost:8080/about.html` in a browser, or call it with curl.

### Medium: MediCare Missing Endpoints

A teammate built a MediCare clinic app. The main class is in `com.medicare.app.core`, and the controllers are in `com.medicare.app.patients` (`GET /patients/count` returns `12`) and `com.medicare.app.doctors` (`GET /doctors` returns Dr. Rao and Dr. Iyer). The app starts, but both endpoints return 404. Find the bug and fix the structure.

> **Hint:** Component scan starts at the main class's package and only goes down. Is `com.medicare.app.patients` below `com.medicare.app.core`?

**Answer:** It is not, so neither controller is scanned. Move the main class up to `com.medicare.app`, the parent of both feature packages. Nothing else needs to change.

**File:** `MedicareApplication.java` in package `com.medicare.app`

```java
package com.medicare.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MedicareApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedicareApplication.class, args);
    }
}
```

**File:** `PatientController.java` in package `com.medicare.app.patients`

```java
package com.medicare.app.patients;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PatientController {

    @GetMapping("/patients/count")
    public int patientCount() {
        return 12;
    }
}
```

**File:** `DoctorController.java` in package `com.medicare.app.doctors`

```java
package com.medicare.app.doctors;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DoctorController {

    @GetMapping("/doctors")
    public List<String> doctors() {
        return List.of("Dr. Rao", "Dr. Iyer");
    }
}
```

Now `/patients/count` returns `12`, and `/doctors` returns `["Dr. Rao","Dr. Iyer"]`.
