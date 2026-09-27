Try each problem on your own first. Start the app, then use curl from a second terminal.

### Easy: Airport Lounge

SkyPort Airport has `GET /flights`, which any logged-in passenger may open, and `GET /lounge`, which only business class passengers may open. Create two users: `asha` with the role `ECONOMY` and `vikram` with the role `BUSINESS`. Call `/lounge` with no login, as Asha, and as Vikram, and note the status codes.

> **Hint:** Use `hasRole("BUSINESS")` for `/lounge` and `anyRequest().authenticated()` for the rest. Put the narrow rule first.

**Answer:** No login gives 401, because nobody is identified. Asha is identified but has the wrong role, so she gets 403. Vikram passes both gates and gets 200.

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

    <groupId>com.skyport</groupId>
    <artifactId>gate</artifactId>
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

**File:** `GateApplication.java` in package `com.skyport.gate`

```java
package com.skyport.gate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GateApplication {

    public static void main(String[] args) {
        SpringApplication.run(GateApplication.class, args);
    }
}
```

**File:** `GateController.java` in package `com.skyport.gate`

```java
package com.skyport.gate;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GateController {

    @GetMapping("/flights")
    public String flights() {
        return "Flight 6E-204 on time";
    }

    @GetMapping("/lounge")
    public String lounge() {
        return "Welcome to the lounge";
    }
}
```

**File:** `SecurityConfig.java` in package `com.skyport.gate`

```java
package com.skyport.gate;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
                        .requestMatchers("/lounge").hasRole("BUSINESS")
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    UserDetailsService users() {
        return new InMemoryUserDetailsManager(
                User.withUsername("asha")
                        .password("{noop}econ2026")
                        .roles("ECONOMY")
                        .build(),
                User.withUsername("vikram")
                        .password("{noop}biz2026")
                        .roles("BUSINESS")
                        .build());
    }
}
```

The three status codes for `/lounge`, with no login, as Asha and as Vikram, are:

```text
401
403
200
```

### Medium: Library Books with Method Rules

A library has `GET /books` for any logged-in person and `POST /books` only for librarians. Pass `HttpMethod.POST` to the matcher, and turn CSRF off because this is a stateless API. Create `member` with the role `MEMBER` and `lata` with the role `LIBRARIAN`. Send a POST as each of them and read the status codes.

> **Hint:** Passing `HttpMethod.POST` to `requestMatchers` limits the rule to that method. Other methods fall through to `anyRequest().authenticated()`.

**Answer:** The rule looks at both the method and the path. The member is known but not a librarian, so the POST gets 403. Lata gets 200.

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

    <groupId>com.citylib</groupId>
    <artifactId>desk</artifactId>
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

**File:** `DeskApplication.java` in package `com.citylib.desk`

```java
package com.citylib.desk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(DeskApplication.class, args);
    }
}
```

**File:** `BookController.java` in package `com.citylib.desk`

```java
package com.citylib.desk;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookController {

    @GetMapping("/books")
    public String list() {
        return "Hill Trains, Tea Garden Tales";
    }

    @PostMapping("/books")
    public String add() {
        return "Book added";
    }
}
```

**File:** `SecurityConfig.java` in package `com.citylib.desk`

```java
package com.citylib.desk;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
        http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(rules -> rules
                        .requestMatchers(HttpMethod.POST, "/books").hasRole("LIBRARIAN")
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    UserDetailsService users() {
        return new InMemoryUserDetailsManager(
                User.withUsername("member")
                        .password("{noop}read2026")
                        .roles("MEMBER")
                        .build(),
                User.withUsername("lata")
                        .password("{noop}shelf2026")
                        .roles("LIBRARIAN")
                        .build());
    }
}
```

The status codes for a POST as `member`, then as `lata`, are:

```text
403
200
```
