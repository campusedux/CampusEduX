Try each problem on your own first. Both use HTTP Basic login and the same pom shape as the CityCare Records example.

### Easy: Pharmacy Dispense Rule

GreenLeaf Pharmacy has a `PHARMACIST` user `rohit` and a `CLERK` user `sana`. Any logged-in user may check stock with `GET /stock/{medicine}`. Only a pharmacist may call `POST /dispense/{medicine}`. Put the rule on the service method, not in the URL rules.

> **Hint:** Add `@EnableMethodSecurity` to the configuration. Put `@PreAuthorize` with `hasRole('PHARMACIST')` on the `dispense` method of a service, and `@PreAuthorize` with `isAuthenticated()` on the stock method.

**Answer:** The URL rule only asks for a login. The two `@PreAuthorize` annotations on `PharmacyService` do the real work, so the clerk gets `403` on dispense.

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
    <artifactId>pharmacy</artifactId>
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
            <artifactId>spring-boot-starter-security</artifactId>
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

**File:** `PharmacyApplication.java` in package `com.greenleaf.pharmacy`

```java
package com.greenleaf.pharmacy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PharmacyApplication {

    public static void main(String[] args) {
        SpringApplication.run(PharmacyApplication.class, args);
    }
}
```

**File:** `SecurityConfig.java` in package `com.greenleaf.pharmacy`

```java
package com.greenleaf.pharmacy;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager(
            User.withUsername("rohit").password("{noop}mortar1").roles("PHARMACIST").build(),
            User.withUsername("sana").password("{noop}counter2").roles("CLERK").build());
    }
}
```

**File:** `PharmacyService.java` in package `com.greenleaf.pharmacy`

```java
package com.greenleaf.pharmacy;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
public class PharmacyService {

    @PreAuthorize("isAuthenticated()")
    public String stock(String medicine) {
        return medicine + ": 40 strips";
    }

    @PreAuthorize("hasRole('PHARMACIST')")
    public String dispense(String medicine) {
        return "Dispensed 1 strip of " + medicine;
    }
}
```

**File:** `PharmacyController.java` in package `com.greenleaf.pharmacy`

```java
package com.greenleaf.pharmacy;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PharmacyController {

    private final PharmacyService service;

    public PharmacyController(PharmacyService service) {
        this.service = service;
    }

    @GetMapping("/stock/{medicine}")
    public String stock(@PathVariable String medicine) {
        return service.stock(medicine);
    }

    @PostMapping("/dispense/{medicine}")
    public String dispense(@PathVariable String medicine) {
        return service.dispense(medicine);
    }
}
```

**Output:**

```text
sana  GET stock  -> 200
  Paracetamol: 40 strips
sana  POST dispense -> 403
rohit POST dispense -> 200
  Dispensed 1 strip of Paracetamol
```

### Medium: Clinic Appointments with @PostFilter

WellNest Clinic has doctors `drrao` and `drsen`, and a front desk user `desk` with the role `ADMIN`. Build these two calls:

- `GET /appointments` returns only the appointments of the logged-in doctor. The `ADMIN` sees all.
- `DELETE /appointments/{id}` lets a doctor cancel only their own appointments. The `ADMIN` may cancel any.

Use appointments 1 and 2 for `drrao`, and 3 for `drsen`.

> **Hint:** `@PostFilter` removes rows from the returned list. Its rule can read each row as `filterObject`, and the logged-in user as `authentication`. Return a copy of your list, because the filter edits the list it receives. For the cancel rule, call a bean from the expression, using an at sign and the bean name, like `@appointmentGuard`.

**Answer:** `@PostFilter` trims the list after the method returns, and a small guard bean answers the ownership question for cancel. Returning `new ArrayList<>(all)` protects the stored list from being trimmed.

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

    <groupId>com.wellnest</groupId>
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
            <artifactId>spring-boot-starter-security</artifactId>
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

**File:** `ClinicApplication.java` in package `com.wellnest.clinic`

```java
package com.wellnest.clinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ClinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClinicApplication.class, args);
    }
}
```

**File:** `SecurityConfig.java` in package `com.wellnest.clinic`

```java
package com.wellnest.clinic;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager(
            User.withUsername("drrao").password("{noop}rao11").roles("DOCTOR").build(),
            User.withUsername("drsen").password("{noop}sen22").roles("DOCTOR").build(),
            User.withUsername("desk").password("{noop}front33").roles("ADMIN").build());
    }
}
```

**File:** `AppointmentService.java` in package `com.wellnest.clinic`

```java
package com.wellnest.clinic;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.security.access.prepost.PostFilter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service("appointmentGuard")
public class AppointmentService {

    record Appointment(int id, String doctor, String patient, String time) {}

    private final List<Appointment> all = new CopyOnWriteArrayList<>(List.of(
        new Appointment(1, "drrao", "Anil", "10:00"),
        new Appointment(2, "drrao", "Sunita", "10:30"),
        new Appointment(3, "drsen", "Meena", "11:00")));

    @PostFilter("filterObject.doctor() == authentication.name or hasRole('ADMIN')")
    public List<Appointment> list() {
        return new ArrayList<>(all);
    }

    public boolean owns(int id, String doctor) {
        return all.stream().anyMatch(a -> a.id() == id && a.doctor().equals(doctor));
    }

    @PreAuthorize("hasRole('ADMIN') or @appointmentGuard.owns(#id, authentication.name)")
    public boolean cancel(int id) {
        return all.removeIf(a -> a.id() == id);
    }
}
```

**File:** `AppointmentController.java` in package `com.wellnest.clinic`

```java
package com.wellnest.clinic;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService service;

    public AppointmentController(AppointmentService service) {
        this.service = service;
    }

    @GetMapping
    public List<AppointmentService.Appointment> list() {
        return service.list();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable int id) {
        return service.cancel(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
```

**Output:**

```text
drrao GET list    -> ids 1, 2
drsen GET list    -> id 3
desk  GET list    -> ids 1, 2, 3
drsen DELETE 1    -> 403
drrao DELETE 1    -> 204
drrao GET list    -> id 2
```

Each list entry is a JSON object with `id`, `doctor`, `patient` and `time`. The output above shows only the ids to keep the lines short.
