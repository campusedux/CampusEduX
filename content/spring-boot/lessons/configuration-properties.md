A clinic keeps a laminated sheet at the reception: clinic name, number of tokens per day, length of each slot, phone number and the departments that are open. Every fact is on one sheet, under one title. Nobody asks the receptionist for the phone number, then the slot length, then the tokens, one question at a time.

`@ConfigurationProperties` gives your Spring Boot app the same sheet. You describe the settings once in a small class, and Spring fills the whole class from your configuration file.

## What is @ConfigurationProperties?

> **Definition:** `@ConfigurationProperties` binds a group of settings that share a prefix, such as `clinic`, to the fields of a Java class or record. Spring Boot converts the values to the right types and can validate them.

Picture a printed form with boxes: name, tokens, slot length. You hand the form to Spring together with the settings file, and Spring writes every value into the matching box. If a value does not fit its box, for example text where a number belongs, Spring refuses to start and tells you which box is wrong.

The class or record becomes a normal bean, so you can inject it anywhere, exactly like a service.

## Why is it used?

- **Related settings stay together.** The whole clinic setup lives in one type instead of many loose `@Value` lines.
- **Type safety.** Numbers, lists, nested groups and durations such as `15m` are converted for you.
- **Validation at startup.** A wrong setting is caught when the app starts, not on the day a patient books a slot.
- **Relaxed binding.** The key `max-daily-tokens` in the file binds to the field `maxDailyTokens` in Java.
- **Easy to test.** You can create the properties object by hand in a test.

## How it works

Spring Boot reads the `Environment`, finds every key that starts with your prefix, matches key names to fields, converts the values, runs validation, and only then hands the finished object to the beans that need it.

```text
application.yml
  clinic.name
  clinic.max-daily-tokens
        |
        v  bind by prefix
+---------------------+
| ClinicProperties    |
| name, maxDailyTokens|
+---------------------+
        |
        v  validate
   ok?  ----> inject into beans
   no?  ----> stop at startup
```

The prefix in the annotation decides which keys belong to this class. A nested record such as `Contact` binds to the keys under `clinic.contact`, and a `List` binds to a YAML list. If validation fails, the application stops with a clear message and never serves a single request with bad settings.

## Real-Life Example

Sunrise Clinic runs a token system for its patients. Each doctor slot lasts 15 minutes, the clinic gives out at most 60 tokens a day, and it has three departments. The receptionist also needs the phone number printed on every slip. Keeping these as separate `@Value` fields would spread them across many classes. One properties record keeps them all in one place, and if someone types 500 tokens by mistake, the app refuses to start.

## Code Example

Let's build the Sunrise Clinic service. It binds a nested group and a list, uses a default for the slot length, and validates the token limit.

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
            <artifactId>spring-boot-starter-validation</artifactId>
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

**File:** `application.yml` in `src/main/resources`

```yaml
clinic:
  name: Sunrise Clinic
  max-daily-tokens: 60
  slot-length: 15m
  contact:
    phone: "020-5550123"
    email: help@sunriseclinic.example
  departments:
    - General
    - Dental
    - Eye
```

**File:** `ClinicApplication.java` in package `com.sunrise.clinic`

```java
package com.sunrise.clinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ClinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(ClinicApplication.class, args);
    }
}
```

**File:** `ClinicProperties.java` in package `com.sunrise.clinic`

```java
package com.sunrise.clinic;

import java.time.Duration;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "clinic")
@Validated
public record ClinicProperties(
        @NotBlank String name,
        @Min(1) @Max(200) int maxDailyTokens,
        @DefaultValue("10m") Duration slotLength,
        Contact contact,
        List<String> departments) {

    public record Contact(String phone, String email) {}
}
```

**File:** `ClinicController.java` in package `com.sunrise.clinic`

```java
package com.sunrise.clinic;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ClinicController {

    record Summary(String name, int tokensPerDay, long slotMinutes,
                   long slotsPerHour, String phone, List<String> departments) {}

    private final ClinicProperties props;

    public ClinicController(ClinicProperties props) {
        this.props = props;
    }

    @GetMapping("/clinic")
    public Summary clinic() {
        long minutes = props.slotLength().toMinutes();
        return new Summary(props.name(), props.maxDailyTokens(), minutes,
                60 / minutes, props.contact().phone(), props.departments());
    }
}
```

Run it and call the endpoint:

```bash
./mvnw spring-boot:run
curl http://localhost:8080/clinic
```

**Output:**

```json
{
  "name": "Sunrise Clinic",
  "tokensPerDay": 60,
  "slotMinutes": 15,
  "slotsPerHour": 4,
  "phone": "020-5550123",
  "departments": ["General", "Dental", "Eye"]
}
```

The reply comes on one line; it is spaced out here for reading.

## Code Explained

- The prefix `clinic` in `@ConfigurationProperties` says that every key starting with `clinic` belongs to this record.
- A record is a good fit. Its values are set once and never change, which is exactly what settings should do.
- `@ConfigurationPropertiesScan` on the main class finds all such records and registers them as beans. Without it, or without `@EnableConfigurationProperties`, the record is never created.
- `max-daily-tokens` in the file binds to `maxDailyTokens`. This is relaxed binding.
- `15m` becomes a `Duration` of fifteen minutes. If the key were missing, `@DefaultValue("10m")` would give ten minutes.
- `Contact` is a nested record that binds to `clinic.contact`, and the list binds to the three departments.
- The controller receives `ClinicProperties` like any other bean. It computes four slots per hour from the slot length.

## Overriding a Value From Outside

Because the record is bound from the `Environment`, every source that the environment knows can change it. We started the same jar with the environment variables `CLINIC_MAX_DAILY_TOKENS=80` and `CLINIC_SLOT_LENGTH=20m`. The endpoint then reported 80 tokens and 20 minute slots, with three slots each hour. We also passed `--clinic.contact.phone=100` on the command line, and the phone number in the reply changed to 100. The file was not touched in either run.

This is how one build can run in several places. The file carries safe defaults, and each server overrides only what it must.

## The Same Settings in a Properties File

If your project uses `application.properties`, the same group looks like this. The record does not change at all.

```properties
clinic.name=Sunrise Clinic
clinic.max-daily-tokens=60
clinic.slot-length=15m
clinic.contact.phone=020-5550123
clinic.departments[0]=General
clinic.departments[1]=Dental
```

Nested groups become extra dots, and lists use square brackets with a position number.

## Validation in Action

Add `@Validated` to the class and the validation starter to the project, and the constraints are checked while binding. We changed the token limit in the file from 60 to 500 and started the app again. It did not start. The report said that binding to `ClinicProperties` failed for the property `clinic.maxDailyTokens`, with the value 500 and the reason `must be less than or equal to 200`. It even named the file and the line. Restore 60 and the app runs again.

## @ConfigurationProperties or @Value?

| Need | Better choice |
|---|---|
| One single value | `@Value` |
| A group with a shared prefix | `@ConfigurationProperties` |
| Nested settings and lists | `@ConfigurationProperties` |
| Validation of settings | `@ConfigurationProperties` |
| A quick calculation with SpEL | `@Value` |

## Common Mistakes

> **Warning:** A properties record that is never registered is silently ignored. Add `@ConfigurationPropertiesScan` to your main class, or list the record in `@EnableConfigurationProperties`.

- **Forgetting the validation starter.** `@Validated` does nothing useful if `spring-boot-starter-validation` is missing from the project.
- **Wrong prefix.** A prefix must be lower case with hyphens only, such as `clinic` or `sunrise-clinic`.
- **Mutable classes without setters.** A regular class needs setters to be bound. A record does not.
- **Mixing units.** Write a unit with durations, such as `15m`. A bare `15` is read as milliseconds by default, which is very short.

## Interview Questions

**What does `@ConfigurationProperties` do?**
It binds all settings with a common prefix to a Java class or record, with type conversion and optional validation.

**How is it different from `@Value`?**
`@Value` injects one value at a time. `@ConfigurationProperties` maps a whole group, supports nested objects and lists, and applies relaxed binding.

**How do you enable validation on it?**
Add the validation starter, put `@Validated` on the class, and use constraint annotations like `@Min` and `@NotBlank`.

## Key Points to Remember

- `@ConfigurationProperties` maps a prefix to a class or record.
- Records make clean, unchangeable settings holders.
- Register the type with `@ConfigurationPropertiesScan` or `@EnableConfigurationProperties`.
- Relaxed binding lets `max-daily-tokens` match `maxDailyTokens`.
- `@Validated` stops a bad configuration at startup.
- `@DefaultValue` supplies a fallback for missing keys.

## Frequently Asked Questions

### Is @ConfigurationProperties better than @Value?

For groups of settings, yes. It is easier to read, validate and test. For a single value, `@Value` is shorter.

### Do I need setters or getters?

Not with a record, because Spring binds through the constructor. A normal class needs setters, or constructor binding.

### Can I use @ConfigurationProperties with a properties file?

Yes. It works with both `application.properties` and `application.yml`, because both fill the same `Environment`.

### Can the values change while the app is running?

No. The object is created once at startup. Restart the app after changing a value.

## Related Topics

- [@Value Annotation](/learning/spring-boot-tutorial/value-annotation): inject a single setting.
- [Externalized Configuration](/learning/spring-boot-tutorial/externalized-configuration): the sources these properties can come from.
- [Bean Validation](/learning/spring-boot-tutorial/bean-validation): the constraint annotations used on the record.
- [Spring Profiles](/learning/spring-boot-tutorial/spring-profiles): different settings for different environments.
