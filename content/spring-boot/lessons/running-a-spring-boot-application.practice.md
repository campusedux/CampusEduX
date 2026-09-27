Try each problem on your own first. Both use a Spring Boot 4.1.1 web project with Java 21.

### Easy: CarePoint Duty Roster at Startup

CarePoint Clinic wants its app to print `CarePoint is open. Doctors on duty: 3` in the log once it has fully started, and to answer `GET /doctors/count` with `3`. Package it and run the JAR.

> **Hint:** Put the doctor count in one place, return it from the controller, and print the line from a `@Component` that implements `CommandLineRunner`.

**Answer:** A `CommandLineRunner` bean runs once, right after startup, so the line appears after the `Started ...` message.

**File:** `CarePointApplication.java` in package `com.carepoint.clinic`

```java
package com.carepoint.clinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class CarePointApplication {

    static final int DOCTORS_ON_DUTY = 3;

    public static void main(String[] args) {
        SpringApplication.run(CarePointApplication.class, args);
    }

    @GetMapping("/doctors/count")
    public int doctorsOnDuty() {
        return DOCTORS_ON_DUTY;
    }
}
```

**File:** `DutyRoster.java` in package `com.carepoint.clinic`

```java
package com.carepoint.clinic;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DutyRoster implements CommandLineRunner {

    @Override
    public void run(String... args) {
        System.out.println("CarePoint is open. Doctors on duty: " + CarePointApplication.DOCTORS_ON_DUTY);
    }
}
```

Package and run it:

```bash
./mvnw package
java -jar target/clinic-0.0.1-SNAPSHOT.jar
```

The roster line prints after the startup log, and `/doctors/count` returns `3`.

### Medium: BusGo City from the Command Line

BusGo runs the same JAR in several cities. The city must come from a start-up option, `--city=Pune`, with `Mumbai` as the default when it is missing. At startup the app prints `Showing routes for Pune`, and `GET /city` returns the city name. Start it on port 9095.

> **Hint:** An `ApplicationRunner` receives `ApplicationArguments`, whose `getOptionValues("city")` returns the values of `--city` (or `null` if absent). Store the city in the runner bean and let the controller read it.

**Answer:** The runner reads the option once at startup and keeps it; the controller asks the runner bean for the value.

**File:** `CityApplication.java` in package `com.busgo.city`

```java
package com.busgo.city;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class CityApplication {

    private final CitySetup citySetup;

    public CityApplication(CitySetup citySetup) {
        this.citySetup = citySetup;
    }

    public static void main(String[] args) {
        SpringApplication.run(CityApplication.class, args);
    }

    @GetMapping("/city")
    public String city() {
        return citySetup.city();
    }
}
```

**File:** `CitySetup.java` in package `com.busgo.city`

```java
package com.busgo.city;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class CitySetup implements ApplicationRunner {

    private String city = "Mumbai";

    @Override
    public void run(ApplicationArguments args) {
        List<String> values = args.getOptionValues("city");
        if (values != null && !values.isEmpty()) {
            city = values.get(0);
        }
        System.out.println("Showing routes for " + city);
    }

    public String city() {
        return city;
    }
}
```

Start it with the option and a port:

```bash
java -jar target/city-0.0.1-SNAPSHOT.jar --city=Pune --server.port=9095
```

The log prints `Showing routes for Pune`, and `curl http://localhost:9095/city` prints `Pune`. Start it without `--city` and both show `Mumbai`.
