Try each problem on your own first. Both use the H2 in-memory database, so nothing needs to be installed.

### Easy: Cinema Halls and Shows

CineGo has halls, and every hall has several shows. A page prints the number of shows in each hall. Build the app with a plain `findAll()` loop first, count the SQL statements, then add an `@EntityGraph` method and count again.

> **Hint:** Enable `hibernate.generate_statistics`, read `getPrepareStatementCount()` and call `clear()` before each run. Add `@EntityGraph(attributePaths = "shows")` to a repository method named `findAllBy`.

**Answer:** The loop with three halls sends four statements, one for the list and one for each hall. The entity graph brings the shows with the halls, so it sends one.

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

    <groupId>com.cinego</groupId>
    <artifactId>halls</artifactId>
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
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
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
spring.main.banner-mode=off
logging.level.root=warn
spring.jpa.properties.hibernate.generate_statistics=true
```

**File:** `Hall.java` in package `com.cinego.halls`

```java
package com.cinego.halls;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
public class Hall {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "hall", cascade = CascadeType.PERSIST)
    private List<Show> shows = new ArrayList<>();

    protected Hall() {
    }

    public Hall(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public List<Show> getShows() {
        return shows;
    }
}
```

**File:** `Show.java` in package `com.cinego.halls`

```java
package com.cinego.halls;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Show {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String movie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hall_id")
    private Hall hall;

    protected Show() {
    }

    public Show(String movie, Hall hall) {
        this.movie = movie;
        this.hall = hall;
    }
}
```

**File:** `HallRepository.java` in package `com.cinego.halls`

```java
package com.cinego.halls;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HallRepository extends JpaRepository<Hall, Long> {

    @EntityGraph(attributePaths = "shows")
    List<Hall> findAllBy();
}
```

**File:** `HallService.java` in package `com.cinego.halls`

```java
package com.cinego.halls;

import java.util.List;

import jakarta.persistence.EntityManagerFactory;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HallService {

    private final HallRepository halls;
    private final Statistics stats;

    public HallService(HallRepository halls, EntityManagerFactory emf) {
        this.halls = halls;
        this.stats = emf.unwrap(SessionFactory.class).getStatistics();
    }

    @Transactional
    public void seed() {
        for (String name : List.of("Hall A", "Hall B", "Hall C")) {
            Hall hall = new Hall(name);
            hall.getShows().add(new Show("The Silent Orbit", hall));
            hall.getShows().add(new Show("Monsoon Express", hall));
            halls.save(hall);
        }
    }

    @Transactional(readOnly = true)
    public void compare() {
        stats.clear();
        int total = 0;
        for (Hall hall : halls.findAll()) {
            total += hall.getShows().size();
        }
        System.out.println("Loop: " + total + " shows");
        System.out.println("  queries: " + stats.getPrepareStatementCount());

        stats.clear();
        total = 0;
        for (Hall hall : halls.findAllBy()) {
            total += hall.getShows().size();
        }
        System.out.println("Graph: " + total + " shows");
        System.out.println("  queries: " + stats.getPrepareStatementCount());
    }
}
```

**File:** `HallsApplication.java` in package `com.cinego.halls`

```java
package com.cinego.halls;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class HallsApplication {

    public static void main(String[] args) {
        SpringApplication.run(HallsApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(HallService service) {
        return args -> {
            service.seed();
            service.compare();
        };
    }
}
```

Running the app prints:

```text
Loop: 6 shows
  queries: 4
Graph: 6 shows
  queries: 1
```

### Medium: Clinic Doctor Summary

A clinic wants a list that shows each doctor's name and the number of appointments, and nothing else. Loading every appointment just to count them is wasteful. Write one JPQL query that returns a small record with the doctor name and the count, and prove with statistics that it runs one statement.

> **Hint:** Use a constructor expression: `select new com.x.Summary(d.name, count(a)) from Doctor d left join d.appointments a group by d.name`. The record needs a constructor with a `String` and a `Long`.

**Answer:** A projection query never loads the appointment entities, so there is nothing lazy to trigger. One statement returns all the rows.

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

    <groupId>com.wellclinic</groupId>
    <artifactId>doctors</artifactId>
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
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
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
spring.main.banner-mode=off
logging.level.root=warn
spring.jpa.properties.hibernate.generate_statistics=true
```

**File:** `Doctor.java` in package `com.wellclinic.doctors`

```java
package com.wellclinic.doctors;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.PERSIST)
    private List<Appointment> appointments = new ArrayList<>();

    protected Doctor() {
    }

    public Doctor(String name) {
        this.name = name;
    }

    public List<Appointment> getAppointments() {
        return appointments;
    }
}
```

**File:** `Appointment.java` in package `com.wellclinic.doctors`

```java
package com.wellclinic.doctors;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String slot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    protected Appointment() {
    }

    public Appointment(String slot, Doctor doctor) {
        this.slot = slot;
        this.doctor = doctor;
    }
}
```

**File:** `DoctorSummary.java` in package `com.wellclinic.doctors`

```java
package com.wellclinic.doctors;

public record DoctorSummary(String name, Long appointments) {
}
```

**File:** `DoctorRepository.java` in package `com.wellclinic.doctors`

```java
package com.wellclinic.doctors;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    @Query("""
            select new com.wellclinic.doctors.DoctorSummary(d.name, count(a))
            from Doctor d left join d.appointments a
            group by d.name order by d.name
            """)
    List<DoctorSummary> summaries();
}
```

**File:** `DoctorService.java` in package `com.wellclinic.doctors`

```java
package com.wellclinic.doctors;

import jakarta.persistence.EntityManagerFactory;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorService {

    private final DoctorRepository doctors;
    private final Statistics stats;

    public DoctorService(DoctorRepository doctors, EntityManagerFactory emf) {
        this.doctors = doctors;
        this.stats = emf.unwrap(SessionFactory.class).getStatistics();
    }

    @Transactional
    public void seed() {
        Doctor rao = new Doctor("Dr. Rao");
        rao.getAppointments().add(new Appointment("09:00", rao));
        rao.getAppointments().add(new Appointment("09:30", rao));
        rao.getAppointments().add(new Appointment("10:00", rao));
        Doctor iyer = new Doctor("Dr. Iyer");
        iyer.getAppointments().add(new Appointment("11:00", iyer));
        Doctor bose = new Doctor("Dr. Bose");
        doctors.save(rao);
        doctors.save(iyer);
        doctors.save(bose);
    }

    @Transactional(readOnly = true)
    public void print() {
        stats.clear();
        doctors.summaries().forEach(s ->
                System.out.println(s.name() + ": " + s.appointments()));
        System.out.println("queries: " + stats.getPrepareStatementCount());
    }
}
```

**File:** `DoctorsApplication.java` in package `com.wellclinic.doctors`

```java
package com.wellclinic.doctors;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class DoctorsApplication {

    public static void main(String[] args) {
        SpringApplication.run(DoctorsApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(DoctorService service) {
        return args -> {
            service.seed();
            service.print();
        };
    }
}
```

Running the app prints:

```text
Dr. Bose: 0
Dr. Iyer: 1
Dr. Rao: 3
queries: 1
```

Dr. Bose has no appointments, so the `left join` keeps the row with a count of zero.
