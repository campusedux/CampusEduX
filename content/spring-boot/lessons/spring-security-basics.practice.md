Try each problem on your own first. Start the app, then use curl from a second terminal.

### Easy: Bookshop with One Open Page

PageTurn Books has two pages. `GET /books` shows the catalogue to everyone. `GET /orders` shows customer orders and needs a login. Keep one in-memory user, `shopkeeper`. Call both pages with and without the login.

> **Hint:** In a `SecurityFilterChain`, allow `/books` with `permitAll()` and require a login for everything else. Add an `InMemoryUserDetailsManager` bean with one user.

**Answer:** The filter chain opens `/books` and locks the rest with HTTP Basic. The user bean supplies the login.

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

    <groupId>com.pageturn</groupId>
    <artifactId>portal</artifactId>
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

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `PortalApplication.java` in package `com.pageturn.portal`

```java
package com.pageturn.portal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PortalApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortalApplication.class, args);
    }
}
```

**File:** `ShopController.java` in package `com.pageturn.portal`

```java
package com.pageturn.portal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ShopController {

    @GetMapping("/books")
    public String books() {
        return "Tea Garden Tales";
    }

    @GetMapping("/orders")
    public String orders() {
        return "3 orders waiting";
    }
}
```

**File:** `SecurityConfig.java` in package `com.pageturn.portal`

```java
package com.pageturn.portal;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(rules -> rules
                        .requestMatchers("/books").permitAll()
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    UserDetailsService users() {
        return new InMemoryUserDetailsManager(
                User.withUsername("shopkeeper")
                        .password("{noop}pages2026")
                        .roles("STAFF")
                        .build());
    }
}
```

Calling the app with curl prints these lines for `/books`, then `/orders` with no login, then `/orders` with the login:

```text
Tea Garden Tales [200]
 [401]
3 orders waiting [200]
```

### Medium: Cinema Booking with CSRF Turned Off

CineGo has `GET /shows` open to everyone and `POST /bookings` for logged-in staff. First call the POST with a valid login and see it rejected, because Spring Security expects a CSRF token. Then turn CSRF off, which is normal for a stateless API that sends its login in a header on every call, and call it again.

> **Hint:** Call `http.csrf(csrf -> csrf.disable())` on the `HttpSecurity` object. Keep every other rule the same.

**Answer:** CSRF protects browser sessions that use cookies. An API that sends its login in a header on every call is not open to that attack, so disabling CSRF for it is a normal choice. The rejection disappears and the POST returns 200.

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
    <artifactId>booking</artifactId>
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

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `BookingApplication.java` in package `com.cinego.booking`

```java
package com.cinego.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingApplication.class, args);
    }
}
```

**File:** `BookingController.java` in package `com.cinego.booking`

```java
package com.cinego.booking;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookingController {

    @GetMapping("/shows")
    public String shows() {
        return "Monsoon Express 21:15";
    }

    @PostMapping("/bookings")
    public String book() {
        return "Booked 2 seats";
    }
}
```

**File:** `SecurityConfig.java` in package `com.cinego.booking`

```java
package com.cinego.booking;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(rules -> rules
                        .requestMatchers("/shows").permitAll()
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    UserDetailsService users() {
        return new InMemoryUserDetailsManager(
                User.withUsername("counter")
                        .password("{noop}tickets2026")
                        .roles("STAFF")
                        .build());
    }
}
```

The output below comes from `POST /bookings` with a valid login, first without the `csrf` line, and then with the code above:

```text
 [401]
Booked 2 seats [200]
```
