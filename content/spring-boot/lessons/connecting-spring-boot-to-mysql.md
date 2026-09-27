A clinic front desk keeps a paper register. It works until the register gets lost, or two receptionists write in it at the same time. So the clinic moves its bookings into a proper database server that stays on day and night, and every computer talks to it. In the Java world, MySQL is one of the most common servers for this job.

Connecting Spring Boot to MySQL takes one driver and a few settings. In this topic you will connect a Spring Boot app to MySQL. You will see which dependency you need, which settings matter, what happens at startup, and which errors you will meet on the way.

## What is a MySQL connection in Spring Boot?

MySQL is a free relational database server. It runs as its own program, listens on port 3306, and keeps your tables on disk. Your app does not contain it. Your app only *connects* to it, like a phone call to the clinic's register.

> **Definition:** A database connection is a channel from your application to a database server. It is opened with a JDBC URL, a user name and a password, and it is used to send SQL and read results.

To make the call, Spring Boot needs three things:

- A **JDBC driver** for MySQL. The driver is a small library that knows how to speak the MySQL language. Its name is MySQL Connector/J.
- A **JDBC URL**, which is the address of the database. It starts with `jdbc:mysql:` and names the host, the port and the database.
- A **user and password** that the MySQL server accepts.

Everything else, such as the connection pool and the Hibernate setup, Spring Boot builds for you.

## Why connect Spring Boot to MySQL?

H2, which you will meet in its own topic, forgets everything when the app stops. That is fine for practice, but a clinic cannot forget its bookings. MySQL keeps the data safely on disk, lets many apps share it, and handles thousands of users at once. It is also cheap to host, and almost every hosting company offers it. That is why so many real projects, including online shops and school portals, run on MySQL.

Connecting through Spring Boot has one more benefit. Your Java code does not change when you switch from H2 to MySQL. Only the dependency and a few lines in `application.properties` change.

> **Note:** Spring Boot picks the right Hibernate dialect from the JDBC URL. You do not need to set a dialect property for MySQL any more.

## How it works

At startup, Spring Boot reads your settings and builds a pool of ready connections.

```text
application.properties
        |
        v
DataSource (HikariCP pool)
        |
        v
MySQL Connector/J driver
        |
        v
MySQL server, port 3306
        |
        v
Database "clinic"
```

Spring Boot reads the URL, user and password, and creates a pool called HikariCP. A pool keeps a few connections open, so each request can borrow one instead of paying the cost of opening a new one. Connector/J carries the SQL over the network to the server, which stores the rows in the `clinic` database.

Now see what happens when your code saves an object.

```text
repository.save(appointment)
        |
        v
Hibernate builds the INSERT
        |
        v
Borrow a connection from the pool
        |
        v
MySQL runs it and stores the row
        |
        v
Connection goes back to the pool
```

You call `save()`. Hibernate writes the `insert` statement and borrows a connection. MySQL runs it, and the connection returns to the pool for the next request. This is why your app can serve many users with only a handful of connections.

## Real-Life Example

Think about a mobile-recharge shop with a shared cash counter. Many customers come in, but the shop keeps only a few counter windows. Each customer uses a free window, finishes fast and leaves. Nobody builds a new window for every customer. The windows are the pooled connections, and the cash office behind them is the MySQL server. If all windows are busy, the next customer waits a little. If the cash office is closed, nothing works, and that is exactly the error you see when the MySQL server is not running.

## Code Example

Let's build a small booking app for Sunrise Clinic. It saves two appointments in a MySQL database called `clinic` and prints them back. First create the database and a user. Run this in the MySQL shell as an admin user, and choose your own password.

```sql
CREATE DATABASE clinic;
CREATE USER 'clinic_app'@'localhost' IDENTIFIED BY '<your-password>';
GRANT ALL PRIVILEGES ON clinic.* TO 'clinic_app'@'localhost';
```

```text
bookings/
├─ pom.xml
└─ src/main/
  ├─ resources/
  │ └─ application.properties
  └─ java/com/sunrise/bookings/
    ├─ BookingsApplication.java
    ├─ Appointment.java
    ├─ AppointmentRepository.java
    └─ BookingRunner.java
```

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

    <groupId>com.sunrise</groupId>
    <artifactId>bookings</artifactId>
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
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
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

The MySQL driver has no version number here. The Spring Boot parent manages it for you.

**File:** `BookingsApplication.java` in package `com.sunrise.bookings`

```java
package com.sunrise.bookings;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BookingsApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingsApplication.class, args);
    }
}
```

**File:** `Appointment.java` in package `com.sunrise.bookings`

```java
package com.sunrise.bookings;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientName;
    private String doctor;

    protected Appointment() {
    }

    public Appointment(String patientName, String doctor) {
        this.patientName = patientName;
        this.doctor = doctor;
    }

    @Override
    public String toString() {
        return id + ": " + patientName + " -> " + doctor;
    }
}
```

**File:** `AppointmentRepository.java` in package `com.sunrise.bookings`

```java
package com.sunrise.bookings;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
}
```

**File:** `BookingRunner.java` in package `com.sunrise.bookings`

```java
package com.sunrise.bookings;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class BookingRunner implements CommandLineRunner {

    private final AppointmentRepository repository;

    public BookingRunner(AppointmentRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.save(new Appointment("Riya Sen", "Dr. Kulkarni"));
        repository.save(new Appointment("Imran Shaikh", "Dr. Rao"));
        repository.findAll().forEach(System.out::println);
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.application.name=bookings
spring.datasource.url=jdbc:mysql://localhost:3306/clinic
spring.datasource.username=${DB_USER:clinic_app}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

Put the password in an environment variable in your terminal first, so it never sits in a file, then run the app:

```bash
export DB_PASSWORD='<your-password>'
mvn spring-boot:run
```

**Output:**

```text
1: Riya Sen -> Dr. Kulkarni
2: Imran Shaikh -> Dr. Rao
```

This is typical output. It needs a running MySQL server, which was not available when this topic was written, so the project was built with Maven but not run against MySQL. If the table already holds rows from an earlier run, you will see more lines, because `ddl-auto=update` keeps old data.

## Code Explained

- The `mysql-connector-j` dependency has `runtime` scope. Your code never imports it. Spring Boot only needs it on the classpath to open connections.
- `spring.datasource.url` names the server, the port and the database. Spring Boot finds the driver class from the `jdbc:mysql:` prefix.
- `${DB_USER:clinic_app}` reads the environment variable `DB_USER`, and falls back to `clinic_app` when it is missing. `${DB_PASSWORD}` has no fallback, so the password must come from outside your code.
- `ddl-auto=update` lets Hibernate add missing tables and columns. It never removes anything, which is safer than `create`.
- `show-sql=true` prints the SQL that Hibernate sends, which helps when you learn.
- The entity, repository and runner are the same as they would be for H2. Nothing in them mentions MySQL.

## Connecting Spring Boot to MySQL: Settings Compared with H2

| Setting | H2 in memory | MySQL |
|---|---|---|
| Dependency | `h2` | `mysql-connector-j` |
| URL | Made up by Spring Boot | `jdbc:mysql://host:3306/db` |
| Username | `sa` | Your own MySQL user |
| Data after restart | Lost | Kept on disk |
| Needs a server | No | Yes |

## Common Mistakes

> **Warning:** Never write real passwords into `application.properties` and push them to Git. Read them from environment variables or a vault, as `${DB_PASSWORD}` does above.

- **Server not running.** The error says "Communications link failure". Start MySQL first, and check the host and port in the URL.
- **Unknown database.** MySQL will not create `clinic` for you. Run `CREATE DATABASE` first.
- **Access denied for user.** The user name, password or host in `CREATE USER` does not match your settings. Check both sides.
- **Public Key Retrieval is not allowed.** On a local MySQL 8 without SSL, add `?allowPublicKeyRetrieval=true` to the URL. Use it only for local practice, not for production.
- **Using `ddl-auto=create` on real data.** It wipes and rebuilds your tables at every start. Use `update` or, better, migration scripts.

## Interview Questions

**Which dependency connects Spring Boot to MySQL?**
`mysql-connector-j` with runtime scope, along with a starter such as `spring-boot-starter-data-jpa`. Spring Boot manages the driver version.

**Which properties do you set for a MySQL connection?**
`spring.datasource.url`, `spring.datasource.username` and `spring.datasource.password`. The driver class name is found from the URL, so you can leave it out.

**What is a connection pool, and which one does Spring Boot use?**
A pool is a set of open connections that requests borrow and return. Spring Boot uses HikariCP by default.

## Key Points to Remember

- MySQL runs as a separate server. Your app connects to it with a JDBC URL, a user and a password.
- Add the `mysql-connector-j` driver with runtime scope. The version comes from the Spring Boot parent.
- Keep the password out of your code. Read it from an environment variable.
- HikariCP keeps a pool of connections ready, so requests do not open new ones.
- Your entities and repositories stay the same when you move from H2 to MySQL.

## Frequently Asked Questions

### Do I need a driver class name when connecting Spring Boot to MySQL?

No. Spring Boot reads the `jdbc:mysql:` prefix of the URL and picks the right driver from the classpath.

### Can I use MariaDB with the same code?

Yes, MariaDB speaks nearly the same language. You use the MariaDB driver and a `jdbc:mariadb:` URL, and your entities stay unchanged.

### Should I use `root` as the database user?

No. Create a user that has rights only on your own database, like `clinic_app`. If the app is hacked, the damage stays small.

### Can I run MySQL without installing it?

Yes. Docker can run MySQL in a container, which you will meet in the Docker topic. For a quick start without a server, use H2 for now and switch later.

## Related Topics

- [Connecting Spring Boot to PostgreSQL](/learning/spring-boot-tutorial/connecting-spring-boot-to-postgresql): the same steps for another popular database.
- [H2 In-Memory Database](/learning/spring-boot-tutorial/h2-in-memory-database): practise without installing any server.
- [Spring Profiles](/learning/spring-boot-tutorial/spring-profiles): use H2 in development and MySQL in production.
- [Docker for Spring Boot](/learning/spring-boot-tutorial/docker-for-spring-boot): run MySQL and your app in containers.
