Think about a multiplex cinema on a busy Saturday. The ticket checker at the door can let people in. The floor manager can also add a new show to the board. Only the owner can cancel a movie for good. All three wear the same uniform, but each carries a different key card. The card decides which doors open. Role based authorization in Spring Boot works just like these key cards.

In this guide you will protect a small movie API so that ordinary users can read, managers can add, and admins can delete. You will also see how a role hierarchy saves you from repeating rules.

## What is Role Based Authorization?

> **Definition:** Role based authorization (also called RBAC) is a way of controlling access where each user is given one or more roles, and each endpoint says which roles may use it. Spring Security compares the two on every request and answers with `403 Forbidden` when the role is missing.

Two questions are easy to mix up:

- **Authentication** asks: who are you? A login answers it.
- **Authorization** asks: what are you allowed to do? Roles answer it.

A user without a valid login gets `401 Unauthorized`. A logged-in user who lacks the right role gets `403 Forbidden`. Keep this pair in mind, because it shows up in interviews and in real debugging.

Inside Spring Security a role is only an authority with a prefix. The role `ADMIN` is stored as the authority `ROLE_ADMIN`. The method `hasRole("ADMIN")` adds the `ROLE_` prefix for you, so you never write it yourself.

## Why is it used?

- **Least privilege.** Each person gets only the access their job needs. A bug or a stolen login then does less damage.
- **Simple rules.** You write "managers can add movies" once, not a list of names.
- **Easy changes.** When a person changes jobs, you change their role. No code changes.
- **Clear audits.** Anyone can read the security rules in one place and see who can do what.

## How it works

Every request passes through the Spring Security filter chain before it reaches your controller.

```text
Request: DELETE /movies/2
         |
         v
+----------------------+
| Who is calling?      |
| (HTTP Basic login)   |
+----------------------+
         |
         v
+----------------------+
| Match the URL rule   |
| DELETE /movies/**    |
| needs role ADMIN     |
+----------------------+
         |
    has ADMIN?
     /        \
   yes         no
    |           |
    v           v
 Controller    403
 runs       Forbidden
```

First the filter chain works out who the caller is. Then it finds the first rule that matches the request. If the caller has the required role, the request moves on to your controller. If not, Spring Security answers `403` and your controller code never runs. This is why the check is safe: it happens before your code, on the server.

Here are the rules for our movie API.

| Request | Who may call it |
|---|---|
| `GET /movies` | USER, MANAGER, ADMIN |
| `POST /movies` | MANAGER, ADMIN |
| `DELETE /movies/{id}` | ADMIN only |
| Anything else | Nobody |

Notice that a manager can do everything a user can, and an admin can do everything a manager can. Instead of listing three roles in every rule, we will tell Spring about this ladder once, using a role hierarchy.

## Real-Life Example

A hospital has receptionists, doctors and a medical superintendent. The receptionist can see the appointment list. A doctor can also open a patient's file. The superintendent can also approve leave and change duty rosters. The hospital does not write a new rule for every person. It writes rules for roles, and hands a role to each new joiner. The same idea keeps the movie API tidy.

## Code Example

Let's build Sunrise Multiplex. The app has three staff users, each with one role. We use HTTP Basic login to keep the example short, but the role rules work the same with JWT logins.

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
    <artifactId>cinema</artifactId>
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

**File:** `CinemaApplication.java` in package `com.sunrise.cinema`

```java
package com.sunrise.cinema;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CinemaApplication {

    public static void main(String[] args) {
        SpringApplication.run(CinemaApplication.class, args);
    }
}
```

**File:** `SecurityConfig.java` in package `com.sunrise.cinema`

```java
package com.sunrise.cinema;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/movies/**").hasRole("USER")
                .requestMatchers(HttpMethod.POST, "/movies").hasRole("MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/movies/**").hasRole("ADMIN")
                .anyRequest().denyAll())
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.fromHierarchy("""
            ROLE_ADMIN > ROLE_MANAGER
            ROLE_MANAGER > ROLE_USER
            """);
    }

    @Bean
    UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager(
            User.withUsername("usha").password("{noop}door1").roles("USER").build(),
            User.withUsername("manoj").password("{noop}board2").roles("MANAGER").build(),
            User.withUsername("adit").password("{noop}owner3").roles("ADMIN").build());
    }
}
```

**File:** `MovieController.java` in package `com.sunrise.cinema`

```java
package com.sunrise.cinema;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/movies")
public class MovieController {

    record Movie(int id, String title) {}

    record NewMovie(String title) {}

    private final AtomicInteger nextId = new AtomicInteger(3);
    private final List<Movie> movies = new CopyOnWriteArrayList<>(List.of(
        new Movie(1, "Monsoon Express"), new Movie(2, "Chai at Midnight")));

    @GetMapping
    public List<Movie> all() {
        return movies;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Movie add(@RequestBody NewMovie request) {
        Movie movie = new Movie(nextId.getAndIncrement(), request.title());
        movies.add(movie);
        return movie;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable int id) {
        boolean removed = movies.removeIf(m -> m.id() == id);
        return removed ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
```

Start the app and try each user against each endpoint. The `-w` flag prints only the status code.

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/movies
curl -s -o /dev/null -w "%{http_code}\n" -u usha:door1 http://localhost:8080/movies
curl -s -o /dev/null -w "%{http_code}\n" -u usha:door1 \
  -X POST -H "Content-Type: application/json" -d '{"title":"Kite Season"}' http://localhost:8080/movies
curl -s -w " %{http_code}\n" -u manoj:board2 \
  -X POST -H "Content-Type: application/json" -d '{"title":"Kite Season"}' http://localhost:8080/movies
curl -s -o /dev/null -w "%{http_code}\n" -u manoj:board2 -X DELETE http://localhost:8080/movies/1
curl -s -o /dev/null -w "%{http_code}\n" -u adit:owner3 -X DELETE http://localhost:8080/movies/1
```

**Output:**

```text
no login         -> 401
usha  GET        -> 200
usha  POST       -> 403
manoj POST       -> 201
  {"id":3,"title":"Kite Season"}
manoj DELETE     -> 403
adit  DELETE     -> 204
```

The order of the results matches the six commands above, with one extra line for the JSON body returned by the manager's `POST`. The `403` for usha is the role check at work, and the `401` in the first line is the missing login. When we also tried `manoj` on `GET /movies`, the answer was `200`, and `adit` on `POST` gave `201`. That is the role hierarchy at work: higher roles include the lower ones.

## Code Explained

- `authorizeHttpRequests` holds the list of rules. Spring checks them from top to bottom and uses the first match. Put narrow rules first and broad rules last.
- `hasRole("USER")` checks for the authority `ROLE_USER`. The `ROLE_` prefix is added for you.
- `anyRequest().denyAll()` is a safety net. Any address we forgot to list is closed, instead of being open by accident.
- The `RoleHierarchy` bean says admins include managers, and managers include users. Spring reads this bean and applies it to the URL rules, so `manoj` can call `GET /movies` even though his only role is `MANAGER`.
- `roles("MANAGER")` creates the user with the authority `ROLE_MANAGER`. The `{noop}` prefix means a plain text password, used here only to keep the demo short. Real apps store BCrypt hashes.
- `csrf.disable()` lets curl send `POST` and `DELETE` without a CSRF value. It is safe for an API that uses no browser cookies. Do not copy it to a form-based web app.
- The controller has no security code at all. That is the point: rules live in one place, and the controller only does its job.

## hasRole, hasAnyRole and hasAuthority

Spring Security gives a few methods for the same idea. Pick the one that fits.

| Method | Meaning | Example |
|---|---|---|
| `hasRole("ADMIN")` | Needs `ROLE_ADMIN` | Admin-only page |
| `hasAnyRole("ADMIN", "MANAGER")` | Needs one of the roles | Add or edit movies |
| `hasAuthority("ROLE_ADMIN")` | Exact authority text, no prefix added | Same as `hasRole` |
| `hasAuthority("movie:delete")` | A fine-grained permission | Permission-style rules |

Roles are coarse ("manager"). Authorities can be finer ("movie:delete"). Small apps do well with roles. Bigger apps often give each role a list of permissions.

## Common Mistakes

> **Warning:** Hiding a button in the frontend is not security. Anyone can call your API directly with curl. Always enforce the rule on the server.

- **Writing `hasRole("ROLE_ADMIN")`.** Spring adds the prefix, so it looks for `ROLE_ROLE_ADMIN` and nobody matches. Write `hasRole("ADMIN")`.
- **Putting a broad rule first.** `anyRequest().authenticated()` at the top swallows the rules below it. Order matters.
- **Forgetting a safety net.** Without `anyRequest()` at the end, a new endpoint can be unprotected. Use `denyAll()` or `authenticated()`.
- **Mixing up 401 and 403.** `401` means "we do not know who you are". `403` means "we know you, and you may not do this".
- **Storing roles without the prefix.** If you load authorities from a database, save them as `ROLE_ADMIN`, or add the prefix when you build the user.

## Interview Questions

**What is the difference between a role and an authority?**
An authority is any permission string. A role is an authority that starts with `ROLE_`, and `hasRole` adds that prefix for you.

**When do you get 401 and when 403?**
`401` when the caller is not authenticated. `403` when the caller is logged in but lacks the needed role.

**Why does the order of URL rules matter?**
Spring uses the first rule that matches, so a broad rule placed early hides the narrower ones after it.

**What is a role hierarchy?**
A rule that lets a higher role include a lower one, such as admin including manager, so you do not repeat roles in each rule.

**Where should authorization be enforced?**
On the server, before the controller runs. UI hiding is only for convenience.

## Key Points to Remember

- Roles decide what a logged-in user may do; authentication only proves who they are.
- A role is stored as an authority with the `ROLE_` prefix, and `hasRole` adds it for you.
- Rules are checked top to bottom, and the first match wins.
- End with `denyAll()` or `authenticated()` so no address is left open by mistake.
- A missing login gives `401`; a missing role gives `403`.

## Frequently Asked Questions

### Can a user have more than one role?

Yes. `roles("USER", "MANAGER")` gives both. A hierarchy is usually cleaner when one role includes another.

### Where do roles come from in a real app?

Usually from a database table linked to the user, or from a claim inside a JWT. Both end up as authorities in the same place.

### Should I use roles or authorities?

Start with roles, since they are simple to read. Move to authorities when different people in the same role need different permissions.

### Can I guard a single method instead of using role based authorization on URLs?

Yes. Method level security uses annotations such as `@PreAuthorize` on service methods. It is the next topic in this series.

## Related Topics

- [Spring Security Basics](/learning/spring-boot-tutorial/spring-security-basics): the filter chain and default login behind these rules.
- [Authentication vs Authorization](/learning/spring-boot-tutorial/authentication-vs-authorization): the difference between proving who you are and what you may do.
- [Method Level Security](/learning/spring-boot-tutorial/method-level-security): guarding single methods with annotations.
- [JWT Authentication](/learning/spring-boot-tutorial/jwt-authentication): carrying roles inside a signed JWT.
