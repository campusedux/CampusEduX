Imagine a hospital where the main gate is open to every patient and visitor. Once inside, you cannot walk into any room you like. The pharmacy checks your prescription, the records room checks your ID, and the ICU checks that you are on the staff list. Every room guards its own door. Method level security in Spring Boot works this way. Instead of protecting only web addresses at the gate, you protect the individual methods that hold the real work.

In this guide you will secure a hospital records service with annotations, write rules that look at method arguments and return values, and learn why a check on the URL alone is sometimes not enough.

## What is Method Level Security?

> **Definition:** Method level security means putting access rules directly on Java methods, usually with annotations like `@PreAuthorize`. Spring checks the rule each time the method is called, and throws an `AccessDeniedException` (a `403` for web callers) if the rule fails.

You turn it on with one annotation, `@EnableMethodSecurity`. After that, you write rules in a small expression language called SpEL. Some examples:

- `hasRole('DOCTOR')` means only doctors may call the method.
- `#patientId == authentication.name` means the caller may only ask for their own id.
- `returnObject.owner == authentication.name` checks the result after the method has run.

Because the rule sits on the method, it works no matter who calls it: a controller, a scheduled job, or another service.

## Why is it used?

- **Rules that need data.** A URL rule cannot know that patient `p101` is asking for the bills of `p102`. A method rule can compare the argument with the logged-in user.
- **Protection close to the data.** The rule travels with the method. If someone adds a new controller later, the service is still guarded.
- **Fine-grained control.** Two methods behind the same URL can need different roles.
- **Readable intent.** A reader sees the rule right above the code it protects.

URL rules and method rules work well together. Use URL rules for broad areas like `/admin/**`, and method rules for the specific cases inside them.

## How it works

Spring does not change your class. It wraps your bean in a proxy, and the proxy runs the security check before or after the real method.

```text
Controller
    |
    v  calls service.viewRecord(7)
+------------------------+
| Security proxy         |
| 1. read @PreAuthorize  |
| 2. get logged-in user  |
| 3. evaluate the rule   |
+------------------------+
    |               |
  allowed         denied
    |               |
    v               v
+-----------+   AccessDenied
| Real      |   Exception
| method    |   (403)
+-----------+
```

The controller thinks it is calling your service, but it is really calling the proxy. The proxy reads the annotation, looks up the current user from the security context, and evaluates the rule. If the rule is true, your method runs. If not, an exception is thrown and your code never starts.

`@PostAuthorize` works the other way round. The method runs first, and the rule checks the returned object before the caller receives it.

## Real-Life Example

A hospital records room has a register. A nurse may see the vitals sheet of any patient on her ward. A doctor may open the full case file. A patient may see only their own bills, and the clerk checks the name on the ID card against the name on the bill. The last rule depends on the request itself, which is exactly the kind of rule that method level security handles well.

## Code Example

Let's build CityCare Records. The web layer only requires a login. All the real rules live on the service methods.

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

    <groupId>com.citycare</groupId>
    <artifactId>records</artifactId>
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

**File:** `RecordsApplication.java` in package `com.citycare.records`

```java
package com.citycare.records;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RecordsApplication {

    public static void main(String[] args) {
        SpringApplication.run(RecordsApplication.class, args);
    }
}
```

**File:** `SecurityConfig.java` in package `com.citycare.records`

```java
package com.citycare.records;

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
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager(
            User.withUsername("drmehta").password("{noop}steth1").roles("DOCTOR").build(),
            User.withUsername("kavya").password("{noop}ward2").roles("NURSE").build(),
            User.withUsername("p101").password("{noop}bed3").roles("PATIENT").build(),
            User.withUsername("p102").password("{noop}bed4").roles("PATIENT").build());
    }
}
```

**File:** `RecordService.java` in package `com.citycare.records`

```java
package com.citycare.records;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
public class RecordService {

    record Report(String owner, String summary) {}

    private final Map<String, Report> reports = Map.of(
        "p101", new Report("p101", "Mild fever, rest advised"),
        "p102", new Report("p102", "Knee X-ray clear"));

    @PreAuthorize("hasRole('DOCTOR')")
    public String caseFile(String patientId) {
        return "Full case file of " + patientId;
    }

    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    public String vitals(String patientId) {
        return "Vitals of " + patientId + ": BP 120/80";
    }

    @PreAuthorize("#patientId == authentication.name or hasRole('DOCTOR')")
    public List<String> bills(String patientId) {
        return List.of("Consultation 500", "Lab test 350");
    }

    @PostAuthorize("returnObject.owner() == authentication.name or hasRole('DOCTOR')")
    public Report report(String patientId) {
        return reports.get(patientId);
    }
}
```

**File:** `RecordController.java` in package `com.citycare.records`

```java
package com.citycare.records;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/patients/{id}")
public class RecordController {

    private final RecordService service;

    public RecordController(RecordService service) {
        this.service = service;
    }

    @GetMapping("/case-file")
    public String caseFile(@PathVariable String id) {
        return service.caseFile(id);
    }

    @GetMapping("/vitals")
    public String vitals(@PathVariable String id) {
        return service.vitals(id);
    }

    @GetMapping("/bills")
    public List<String> bills(@PathVariable String id) {
        return service.bills(id);
    }

    @GetMapping("/report")
    public RecordService.Report report(@PathVariable String id) {
        return service.report(id);
    }
}
```

Run the app and call it as different users.

```bash
curl -u kavya:ward2 http://localhost:8080/patients/p101/vitals
curl -s -o /dev/null -w "%{http_code}\n" -u kavya:ward2 http://localhost:8080/patients/p101/case-file
curl -u drmehta:steth1 http://localhost:8080/patients/p101/case-file
curl -u p101:bed3 http://localhost:8080/patients/p101/bills
curl -s -o /dev/null -w "%{http_code}\n" -u p101:bed3 http://localhost:8080/patients/p102/bills
curl -s -o /dev/null -w "%{http_code}\n" -u p101:bed3 http://localhost:8080/patients/p102/report
```

**Output:**

```text
Vitals of p101: BP 120/80
403
Full case file of p101
["Consultation 500",
 "Lab test 350"]
403
403
```

The `403` lines are the denied calls: the nurse asking for a case file, patient p101 asking for the bills of p102, and p101 asking for the report of p102. Spring also sends a small JSON error body with each `403`, which we hid with `-o /dev/null`.

## Code Explained

- `@EnableMethodSecurity` switches on the annotation checks. Without it, the annotations do nothing and every method is open. This is the most common surprise for beginners.
- The URL rule only says `authenticated()`. That is fine, because the service methods add the real rules.
- `hasRole('DOCTOR')` uses single quotes because the expression sits inside a Java string. As with URL rules, do not write the `ROLE_` prefix.
- In `bills`, `#patientId` refers to the method argument, and `authentication.name` is the logged-in username. Doctors pass through the `or` branch.
- `@PostAuthorize` runs after the method and can see `returnObject`. Use it when the rule depends on what came back, such as the owner field of a record. Do not use it on methods that change data, because the change has already happened when the check fails.
- The controller has no security code. If a future controller calls `RecordService`, it is protected too.
- Spring turns the failure into `403 Forbidden`, because the thrown exception is caught by the security filters.

## Method Security Annotations at a Glance

| Annotation | When it checks | Notes |
|---|---|---|
| `@PreAuthorize` | Before the method | Full SpEL, the usual choice |
| `@PostAuthorize` | After the method | Can read `returnObject` |
| `@PreFilter` | Before, on a collection argument | Removes items you may not send |
| `@PostFilter` | After, on a returned collection | Removes items you may not see |
| `@Secured` | Before the method | Roles only, no SpEL |
| `@RolesAllowed` | Before the method | Standard Jakarta annotation, roles only |

## Common Mistakes

> **Warning:** Forgetting `@EnableMethodSecurity` does not cause an error. The annotations are silently ignored and the methods stay open. Always test one denied call.

- **Calling a secured method from the same class.** The call skips the proxy, so the rule is never checked. Put the secured method in another bean.
- **Securing private methods.** Proxies only see public calls from other beans, so private methods are not checked.
- **Using `@PostAuthorize` on writes.** The method has already saved the data when the check runs. Use `@PreAuthorize` for actions.
- **Trusting only the URL rule.** Another controller or a background job can call the same service. Guard the service too.
- **Mixing `hasRole('ROLE_DOCTOR')`.** As with URL rules, `hasRole` adds the prefix, so write `hasRole('DOCTOR')`.

## Interview Questions

**How do you enable method level security in Spring Boot?**
Add `@EnableMethodSecurity` to a configuration class. Then use `@PreAuthorize` and related annotations.

**What is the difference between `@PreAuthorize` and `@PostAuthorize`?**
`@PreAuthorize` checks before the method runs. `@PostAuthorize` runs the method first and checks the returned object.

**How can a rule use the method argument?**
Refer to it by name with a hash, like `#patientId == authentication.name`.

**Why might a `@PreAuthorize` rule be ignored?**
The class may be called from within itself, the method may be private, or `@EnableMethodSecurity` may be missing.

**How is `@PreAuthorize` different from `@Secured`?**
`@Secured` accepts only role names. `@PreAuthorize` accepts full expressions with arguments and logical operators.

## Key Points to Remember

- Method level security puts rules on methods, so they apply to every caller.
- Turn it on with `@EnableMethodSecurity`.
- `@PreAuthorize` checks first; `@PostAuthorize` checks the returned value.
- Rules can use `#argument`, `authentication` and `returnObject`.
- Calls made inside the same class bypass the proxy and skip the check.

## Frequently Asked Questions

### Do I still need URL rules if I use method level security?

Yes, keep them for broad rules like "all `/admin` pages need the admin role". Method level security adds finer checks below them.

### Is method level security slower?

The cost is tiny compared with a database call. A rule is a short expression evaluated on each call.

### Can I put method level security on a controller?

Yes. It works on any Spring bean, but service methods are the better home because every caller then passes through the rule.

### What status does a failed rule return?

For a logged-in user, `403 Forbidden`. For a caller who is not logged in, the login check answers `401`.

## Related Topics

- [Role Based Authorization](/learning/spring-boot-tutorial/role-based-authorization): guarding URLs with roles, the layer before method rules.
- [Spring AOP](/learning/spring-boot-tutorial/spring-aop): the proxy idea that makes method security work.
- [Authentication vs Authorization](/learning/spring-boot-tutorial/authentication-vs-authorization): who you are versus what you may do.
- [JWT Authentication](/learning/spring-boot-tutorial/jwt-authentication): the login style whose roles these annotations can check.
