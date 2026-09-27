Picture a small clinic with a front door. In the morning the doctor unlocks it for everyone. By afternoon a stranger walks in, opens the patient files and reads them. Nobody stopped him because there was no lock and no one at the desk. Your web application is that clinic. Without security, anyone who knows the address can open every page.

Spring Security is the receptionist for your Spring Boot app. Let's learn what it does by default, how to open a few doors on purpose, and how to try it with real requests.

## What is Spring Security?

> **Definition:** Spring Security is a framework that protects Spring applications. It checks who the caller is (authentication) and what the caller may do (authorization) before a request reaches your controller.

It works as a chain of filters that sit in front of your controllers. Every request passes through the chain first. If the request is not allowed, Spring Security answers with an error, and your controller code never runs.

The moment you add the security starter, Spring Boot locks everything. Every URL needs a login, and Boot prepares a user named `user` with a random password that is printed in the log at startup. That is safe by default, and you then open only what you choose.

## Why is it used?

Writing your own checks in every controller is slow and easy to get wrong. One forgotten check, and a page is open to the world. Spring Security gives you one central place to say who may enter where. It also comes with protection for common web attacks, such as session fixation and cross-site request forgery (CSRF), and it handles password storage and login mechanisms that took security experts years to get right.

Nearly every real backend needs it: banking apps, shops, hospital systems, and any API with private data.

## How it works

Here is the journey of a request when the security starter is present.

```text
Browser or curl
    |
    v
Security filter chain
    |
    +--> no credentials: 401
    |
    +--> wrong password: 401
    |
    v
Credentials OK, rules checked
    |
    v
Your controller runs
```

The chain first finds out who is calling. If the request has no valid login, Spring Security answers with `401 Unauthorized`. If the person is known and the rules allow the URL, the request moves on to your controller.

Three building blocks appear in almost every setup.

| Building block | What it does | In our demo |
|---|---|---|
| `SecurityFilterChain` | Rules: which URLs are open and which are locked | `/public/**` open, the rest locked |
| `UserDetailsService` | Finds a user by name | An in-memory user |
| `PasswordEncoder` | Checks the password | Plain text marker for the demo |

`HTTP Basic` is the login method used here. The client sends the username and password in a header with every request. It is simple and good for learning and testing with curl. Real apps usually use a login form or tokens, which later topics cover.

> **Warning:** In the demo we write the password as `{noop}clinic123`. The `{noop}` prefix means "no encoding". Never do this in a real app. Passwords must be stored hashed, and the BCrypt topic shows how.

## Real-Life Example

Think of an apartment building with a watchman at the gate. Anyone can walk up to the notice board near the gate. But to enter the building, a visitor must tell the watchman a flat number and the resident's name. If the visitor cannot, the watchman says no at the gate, and the resident is never disturbed. The watchman is the filter chain, the notice board is the public URL, and the flats are the protected controllers.

## Code Example

Let's protect the small portal of MediCare Clinic. The address `/public/hours` is open to everyone. The address `/appointments` needs a login.

```text
medicare/
├─ pom.xml
└─ src/main/java/
   └─ com/medicare/portal/
      ├─ PortalApplication.java
      ├─ PortalController.java
      └─ SecurityConfig.java
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

    <groupId>com.medicare</groupId>
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

**File:** `PortalApplication.java` in package `com.medicare.portal`

```java
package com.medicare.portal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PortalApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortalApplication.class, args);
    }
}
```

**File:** `PortalController.java` in package `com.medicare.portal`

```java
package com.medicare.portal;

import java.security.Principal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PortalController {

    @GetMapping("/public/hours")
    public String hours() {
        return "Clinic open 9 AM to 6 PM";
    }

    @GetMapping("/appointments")
    public String appointments(Principal caller) {
        return "Hello " + caller.getName() + ": 10:30 checkup";
    }
}
```

**File:** `SecurityConfig.java` in package `com.medicare.portal`

```java
package com.medicare.portal;

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
                        .requestMatchers("/public/**").permitAll()
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    UserDetailsService users() {
        return new InMemoryUserDetailsManager(
                User.withUsername("meena")
                        .password("{noop}clinic123")
                        .roles("STAFF")
                        .build());
    }
}
```

Start the app, then call it four times from a second terminal, printing only the status code and the body:

```bash
mvn spring-boot:run
curl -s -w " [%{http_code}]\n" localhost:8080/public/hours
curl -s -w " [%{http_code}]\n" localhost:8080/appointments
curl -s -w " [%{http_code}]\n" -u meena:wrong localhost:8080/appointments
curl -s -w " [%{http_code}]\n" -u meena:clinic123 localhost:8080/appointments
```

**Output:**

```text
Clinic open 9 AM to 6 PM [200]
 [401]
 [401]
Hello meena: 10:30 checkup [200]
```

Each line shows the response body and then the status code in brackets. The public page works without a login. The protected page answers 401 with no credentials, and 401 again with a wrong password. With the right password the controller runs and greets Meena.

## Code Explained

- `spring-boot-starter-security` adds the filter chain. Without any configuration, it locks every URL.
- `SecurityFilterChain` is the rule book. `permitAll()` opens `/public/**`. `anyRequest().authenticated()` locks everything else.
- The order of the rules matters. Spring reads them top to bottom and uses the first match, so put specific rules first and `anyRequest()` last.
- The `httpBasic` call turns on HTTP Basic login with default settings.
- `InMemoryUserDetailsManager` holds users in memory. It is only for demos and tests. Real apps read users from a database.
- `Principal caller` lets the controller ask "who is calling?". Spring Security fills it in.
- Once you define your own `UserDetailsService`, the random `user` password is not created any more.

> **Tip:** The class is called `SecurityFilterChain`, but you never write the filters. You only describe the rules, and Spring Security builds the filters from them.

## Common Mistakes

> **Warning:** Do not turn off security to "make it work". If a request gets a 401 or 403, fix the rule or the credentials. Disabling the checks leaves the whole app open.

- **Wrong rule order.** Putting `anyRequest().authenticated()` before `permitAll()` makes the open pages locked.
- **Confusing 401 and 403.** 401 means "we do not know who you are". 403 means "we know you, but you are not allowed". The next topic explains this well.
- **Hard-coding real passwords.** The demo password is fake. Read real ones from a database as hashes.
- **POST requests being rejected.** Security turns on CSRF protection by default, so a POST without a CSRF token is refused, even with a correct login. Browser forms need the token. For stateless APIs it is switched off on purpose.
- **Using the old style.** Older tutorials extend `WebSecurityConfigurerAdapter`. It is gone in current versions. Use a `SecurityFilterChain` bean.

## Interview Questions

**What does Spring Security do by default when you add the starter?**
It secures every URL, creates a user named `user` with a random password shown in the log, and enables HTTP Basic and form login.

**What is a SecurityFilterChain?**
It is a bean that holds the rules for which requests are allowed, and how callers must log in.

**What is the difference between authentication and authorization?**
Authentication proves who you are. Authorization decides what you may do after that.

**What is a UserDetailsService?**
An interface that finds a user by username, so Spring Security can compare the password and read the user's roles.

## Key Points to Remember

- Adding the security starter locks all URLs by default.
- A `SecurityFilterChain` bean opens or locks specific URLs.
- Rules are checked from top to bottom, and the first match wins.
- A `UserDetailsService` supplies users, and a `PasswordEncoder` checks passwords.
- Never store plain passwords, and never disable security to fix a 401.

## Frequently Asked Questions

### What is Spring Security used for?

It protects a Spring application. It checks who the caller is, decides what the caller may access, and guards against common attacks such as CSRF.

### How do I find the default Spring Security password?

Look at the log when the app starts. Spring Boot prints a line that starts with "Using generated security password". The default user name is `user`. Because it changes on every start, define your own users for anything real.

### Do I need Spring Security for a REST API?

If the API returns private data or changes data, yes. Public read-only APIs may not need it, but most business APIs do.

### Is HTTP Basic safe?

Only over HTTPS, because the password travels in every request. It is fine for learning and for calls between trusted servers. Public apps use login forms or tokens.

## Related Topics

- [Authentication vs Authorization](/learning/spring-boot-tutorial/authentication-vs-authorization): understand the two ideas behind every 401 and 403.
- [Password Encoding with BCrypt](/learning/spring-boot-tutorial/password-encoding-with-bcrypt): store passwords the safe way.
- [JWT Authentication](/learning/spring-boot-tutorial/jwt-authentication): move from Basic login to tokens.
- [Role Based Authorization](/learning/spring-boot-tutorial/role-based-authorization): give different users different powers.
