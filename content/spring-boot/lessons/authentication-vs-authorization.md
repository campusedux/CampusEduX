An airport has two checks that people often mix up. At the entrance, a guard looks at your passport and confirms you are who you say you are. Later, at the lounge door, another guard looks at your ticket class and says, "Sorry, this lounge is for business class only." Same person, same airport, two different questions. Software security asks exactly these two questions.

Let's separate authentication and authorization, see how they map to HTTP status codes 401 and 403, and watch both happen in a real Spring Boot app.

## What are authentication and authorization?

> **Definition:** **Authentication** answers "Who are you?". It proves the identity of the caller, for example with a username and password. **Authorization** answers "What are you allowed to do?". It decides whether that known caller may use a particular resource.

Authentication always comes first. You cannot decide what someone may do until you know who they are.

| | Authentication | Authorization |
|---|---|---|
| Question | Who are you? | What can you do? |
| Happens | First | After authentication |
| Input | Password, token, fingerprint | Roles, permissions, rules |
| Failure status | 401 Unauthorized | 403 Forbidden |
| Airport example | Passport check | Lounge access check |

The names are confusing, because the status called "401 Unauthorized" is really about authentication. Remember it as "401: I do not know you" and "403: I know you, but no".

## Why does the difference matter?

Many bugs come from mixing the two. A team checks the login but never checks the role, and a receptionist can open doctors' medical notes. Another team checks roles but forgets to check the login, and anonymous callers slip in. Keeping the two ideas apart helps you design rules, choose the right response code, and explain problems to other developers. It is also one of the most repeated interview questions for backend roles.

In Spring Security the two steps even live in different places. Authentication is done by the login mechanism, such as HTTP Basic or a token filter. Authorization is decided afterwards by the rules in your `SecurityFilterChain` and by annotations on methods.

## How it works

Here is the full path of a request in a hospital records service.

```text
Request arrives
    |
    v
Has valid login?
    |
    +-- no --> 401 Unauthorized
    |
    v
Who is it? (user + roles)
    |
    v
Rule allows this role?
    |
    +-- no --> 403 Forbidden
    |
    v
Controller runs: 200 OK
```

The first gate is authentication. A missing or wrong login stops the request with 401. The second gate is authorization. A known user whose role does not match the rule is stopped with 403. Only a request that passes both gates reaches your controller.

In Spring Security, a user carries one or more **authorities**. A role is an authority whose name starts with `ROLE_`. When you write `hasRole("DOCTOR")`, Spring checks for the authority `ROLE_DOCTOR`. When you build a user with `.roles("DOCTOR")`, Spring adds the prefix for you.

```text
User "dr.rao"
  roles: DOCTOR
    |
    v
Authority: ROLE_DOCTOR
    |
    v
hasRole("DOCTOR") -> allowed
```

The user name identifies the person. The roles describe what the person may do. Rules never look at the name, they look at the roles.

## Real-Life Example

Think of a hospital ward. The gate guard checks your visitor card. If you have no card, he stops you at the gate. That is authentication, and the failure is "who are you?". Inside, the door of the operation theatre is locked for everyone except surgeons. A visitor with a valid card walks up to it and the door stays shut. That is authorization, and the failure is "you may not enter". The visitor was recognised, but not allowed.

## Code Example

Let's protect the records desk of Green Valley Hospital. Three URLs are set up. Any logged-in staff may view `/visitors`. Only doctors may view `/records`. Two users exist: `dr.rao` is a doctor and `reena` is a receptionist.

```text
greenvalley/
├─ pom.xml
└─ src/main/java/
   └─ com/greenvalley/desk/
      ├─ DeskApplication.java
      ├─ DeskController.java
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

    <groupId>com.greenvalley</groupId>
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

**File:** `DeskApplication.java` in package `com.greenvalley.desk`

```java
package com.greenvalley.desk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DeskApplication {

    public static void main(String[] args) {
        SpringApplication.run(DeskApplication.class, args);
    }
}
```

**File:** `DeskController.java` in package `com.greenvalley.desk`

```java
package com.greenvalley.desk;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DeskController {

    @GetMapping("/visitors")
    public String visitors() {
        return "12 visitors today";
    }

    @GetMapping("/records")
    public String records() {
        return "Patient files: 42";
    }
}
```

**File:** `SecurityConfig.java` in package `com.greenvalley.desk`

```java
package com.greenvalley.desk;

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
                        .requestMatchers("/records").hasRole("DOCTOR")
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    UserDetailsService users() {
        return new InMemoryUserDetailsManager(
                User.withUsername("dr.rao")
                        .password("{noop}steth2026")
                        .roles("DOCTOR")
                        .build(),
                User.withUsername("reena")
                        .password("{noop}desk2026")
                        .roles("RECEPTIONIST")
                        .build());
    }
}
```

Start the app and call it from a second terminal. Each command hides the body and prints only the status code:

```bash
mvn spring-boot:run
curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/records
curl -s -o /dev/null -w "%{http_code}\n" -u reena:desk2026 localhost:8080/visitors
curl -s -o /dev/null -w "%{http_code}\n" -u reena:desk2026 localhost:8080/records
curl -s -o /dev/null -w "%{http_code}\n" -u dr.rao:steth2026 localhost:8080/records
```

**Output:**

```text
401
200
403
200
```

Follow the four lines. The first caller has no login, so authentication fails and the answer is 401. Reena logs in fine and may view visitors, so authentication and authorization both pass. Reena then asks for the records. She is known, but her role is not allowed, so the answer is 403. Dr. Rao holds the DOCTOR role, so he gets the records.

## Code Explained

- `hasRole("DOCTOR")` is the authorization rule. It allows only users with the authority `ROLE_DOCTOR`.
- `anyRequest().authenticated()` is the catch-all. Any other URL needs a login, but no particular role.
- `.roles("DOCTOR")` gives the user the authority `ROLE_DOCTOR`. You write the role name without the prefix in both places.
- `httpBasic` is the authentication mechanism here. It reads the user name and password from the request header.
- The controller has no security code. It trusts the filter chain, which keeps business code clean.
- Rules are checked from top to bottom. The narrow `/records` rule comes before the wide `anyRequest()` rule.

> **Tip:** When a client reports "unauthorized", ask one question first: did they get 401 or 403? The answer tells you whether to look at the login or at the roles.

## Common Mistakes

> **Warning:** Do not hide a button in the frontend and call it security. Anyone can call your API directly, so every rule must be enforced on the server.

- **Writing a role with the prefix.** Spring adds `ROLE_` itself, so `hasRole("ROLE_DOCTOR")` looks for `ROLE_ROLE_DOCTOR`. Use `hasRole("DOCTOR")`, or `hasAuthority("ROLE_DOCTOR")`.
- **Returning 401 for a role problem.** If the user is logged in, use 403. Wrong codes confuse client developers.
- **Checking only login.** Being logged in does not mean being allowed. Add role or ownership checks.
- **Trusting user ids from the request.** A customer who sends someone else's id must be stopped by an ownership check, not only by a role check.
- **Mixing up the words.** People say "auth" for both ideas. In code and in talk, say authentication or authorization clearly.

## Interview Questions

**What is the difference between authentication and authorization?**
Authentication verifies who the caller is. Authorization decides what that caller may do. Authentication happens first.

**What do the status codes 401 and 403 mean?**
401 means the caller is not authenticated, so identity is missing or wrong. 403 means the caller is authenticated, but not allowed to use that resource.

**What is the difference between a role and an authority in Spring Security?**
An authority is a single permission string. A role is an authority whose name starts with `ROLE_`, and `hasRole` adds that prefix for you.

**Where does Spring Security perform each step?**
Authentication happens in the login filters, such as HTTP Basic or a token filter. Authorization happens afterwards, using the rules in the filter chain and method annotations.

## Key Points to Remember

- Authentication proves identity. Authorization grants permission.
- Authentication comes first. A failure gives 401.
- A failed authorization gives 403.
- In Spring Security, `hasRole("X")` checks for the authority `ROLE_X`.
- Enforce every rule on the server, never only in the interface.

## Frequently Asked Questions

### What is the difference between authentication and authorization in simple words?

Authentication is showing your ID card. Authorization is the list that says which doors your ID card can open. The first proves who you are. The second limits what you can do.

### Can a user be authenticated but not authorized?

Yes. That is exactly the 403 case. The system knows who the user is, but the user's roles do not allow the action.

### Which comes first, authentication or authorization?

Authentication. The system needs an identity before it can check permissions for it.

### Why do some APIs return 404 instead of 403?

Some services hide the existence of a resource from callers who may not see it. It avoids leaking information, but it is a design choice, not the default in Spring Security.

## Related Topics

- [Spring Security Basics](/learning/spring-boot-tutorial/spring-security-basics): the filter chain that performs both checks.
- [Role Based Authorization](/learning/spring-boot-tutorial/role-based-authorization): go deeper into roles and rules.
- [Method Level Security](/learning/spring-boot-tutorial/method-level-security): authorize inside the service layer.
- [JWT Authentication](/learning/spring-boot-tutorial/jwt-authentication): authenticate with tokens instead of Basic login.
