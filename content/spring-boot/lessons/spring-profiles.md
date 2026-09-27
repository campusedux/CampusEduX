A railway booking company has a small test office where new features are tried, and a real office where real customers pay real money. In the test office, tickets are fake, emails go to a folder and nothing is charged. In the real office, every ticket is genuine and every email reaches a customer. The staff and the desks look the same in both places. Only the settings differ.

Your Spring Boot application has the same problem. It must behave one way on your laptop and another way in production. Spring profiles solve this. In this guide you will learn what Spring profiles are, how to switch them on, and how to make beans and settings depend on them, with a program that you run twice with different results.

## What are Spring Profiles?

> **Definition:** A Spring profile is a named group of beans and settings, such as `dev`, `test` or `prod`, that Spring activates only when that profile is switched on.

Think of a profile as a label. You attach it to a bean or to a settings file. When the app starts, you tell Spring which label is active. Beans and settings that carry other labels stay off.

There are two things you can do with a profile:

- **Switch beans on or off.** Put `@Profile("dev")` on a class or a `@Bean` method. The bean exists only when the `dev` profile is active.
- **Load extra settings.** A file named `application-dev.properties` is read only when `dev` is active, and its values override the ones in `application.properties`.

If no profile is active, Spring uses a profile called `default`. Beans marked `@Profile("default")` load in that case.

## Why is it used?

Environments differ, and hard-coding one choice is dangerous.

- **Different services.** In development you print emails to the console. In production you send them through a real mail server.
- **Different settings.** The database address, the logging level and the server port often change from one machine to another.
- **Safety.** Test data loaders, debug tools and fake payment gateways must never run in production. A profile keeps them out.
- **One build for all places.** You build the JAR once and choose the profile at start-up. You do not recompile for each place.
- **Simple switching.** You change one setting, not fifty lines of code.

## How it works

At start-up, Spring looks at the list of active profiles and filters everything else.

```text
+--------------------------------+
|  App starts                    |
+--------------------------------+
                |
                v
+--------------------------------+
|  Spring reads active profiles  |
|  (for example: prod)           |
+--------------------------------+
                |
                v
+--------------------------------+
|  Loads application.properties  |
|  then application-prod.        |
|  properties on top of it       |
+--------------------------------+
                |
                v
+--------------------------------+
|  Creates only the beans whose  |
|  @Profile matches: prod        |
+--------------------------------+
```

Spring first finds which profiles are active. Then it reads the main settings file, and after that the file for the active profile. Values in the profile file replace matching ones from the main file. Finally, it creates only the beans that match. Beans with a different `@Profile` are skipped completely.

There are several ways to switch a profile on. Here they are, strongest first.

| Way | Example |
|---|---|
| Command line | `--spring.profiles.active=prod` |
| System variable | `SPRING_PROFILES_ACTIVE=prod` |
| Properties file | `spring.profiles.active=dev` |

A value given on the command line beats the same key in the properties file. That is why many teams keep a safe default in the file and override it on the server.

The `@Profile` annotation also accepts simple rules:

- `@Profile("prod")` means active only in prod.
- `@Profile("!prod")` means active everywhere except prod.
- `@Profile({"dev", "test"})` means active in either of the two.

> **Tip:** Profiles choose which settings to use, but they do not hide anything. Anything you write in a properties file can be read by everyone who has the code, so keep sensitive values out of it.

## Real-Life Example

A restaurant chain has a training kitchen and a real kitchen. The recipe book is the same. In the training kitchen, the cooks use cheap ingredients and throw away the dishes. In the real kitchen, they use fresh ingredients and serve the guests. The manager tells the team which kitchen they are in on the first morning, and everybody adjusts.

The recipe book is your code. The kitchen name is the active profile. The differences in ingredients are the profile-specific beans and settings.

## Code Example

Let's build RailBook, a ticket booking service. It has a `MailSender` with two versions, one for `dev` and one for `prod`. A `SampleData` loader runs everywhere except `prod`. A message setting differs per profile. We run the same JAR twice. Use the same `pom.xml` as the first CineGo example, changing only the groupId and artifactId.

```text
railbook/src/main/
├─ java/com/railbook/tickets/
│  ├─ TicketsApplication.java
│  ├─ MailSender.java
│  ├─ ConsoleMailSender.java
│  ├─ SmtpMailSender.java
│  ├─ SampleData.java
│  └─ BookingRunner.java
└─ resources/
   ├─ application.properties
   ├─ application-dev.properties
   └─ application-prod.properties
```

**File:** `TicketsApplication.java` in package `com.railbook.tickets`

```java
package com.railbook.tickets;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TicketsApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(TicketsApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `application.properties` in `src/main/resources`

```properties
spring.profiles.active=dev
railbook.message=Running with default settings
```

**File:** `application-dev.properties` in `src/main/resources`

```properties
railbook.message=Dev: test data, console mail
```

**File:** `application-prod.properties` in `src/main/resources`

```properties
railbook.message=Prod: real mail, no test data
```

**File:** `MailSender.java` in package `com.railbook.tickets`

```java
package com.railbook.tickets;

public interface MailSender {

    String send(String text);
}
```

**File:** `ConsoleMailSender.java` in package `com.railbook.tickets`

```java
package com.railbook.tickets;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class ConsoleMailSender implements MailSender {

    @Override
    public String send(String text) {
        return "Console mail: " + text;
    }
}
```

**File:** `SmtpMailSender.java` in package `com.railbook.tickets`

```java
package com.railbook.tickets;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class SmtpMailSender implements MailSender {

    @Override
    public String send(String text) {
        return "SMTP mail: " + text;
    }
}
```

**File:** `SampleData.java` in package `com.railbook.tickets`

```java
package com.railbook.tickets;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!prod")
public class SampleData {

    public String load() {
        return "Sample data loaded";
    }
}
```

**File:** `BookingRunner.java` in package `com.railbook.tickets`

```java
package com.railbook.tickets;

import java.util.Arrays;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class BookingRunner implements CommandLineRunner {

    private final Environment environment;
    private final MailSender mail;
    private final ObjectProvider<SampleData> sampleData;

    public BookingRunner(Environment environment, MailSender mail, ObjectProvider<SampleData> sampleData) {
        this.environment = environment;
        this.mail = mail;
        this.sampleData = sampleData;
    }

    @Override
    public void run(String... args) {
        System.out.println("Profiles: " + Arrays.toString(environment.getActiveProfiles()));
        System.out.println(environment.getProperty("railbook.message"));
        System.out.println(mail.send("Ticket booked"));
        SampleData data = sampleData.getIfAvailable();
        System.out.println(data == null ? "No sample data" : data.load());
    }
}
```

Build the JAR once, then run it two times:

```bash
mvn -q package
java -jar target/tickets-0.0.1-SNAPSHOT.jar
java -jar target/tickets-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

**Output:**

First run, which uses the `dev` profile from the properties file:

```text
Profiles: [dev]
Dev: test data, console mail
Console mail: Ticket booked
Sample data loaded
```

Second run, with the command line switching to `prod`:

```text
Profiles: [prod]
Prod: real mail, no test data
SMTP mail: Ticket booked
No sample data
```

The code and the JAR are identical. Only the active profile changed, and with it the mail sender, the message and the sample data.

## Code Explained

- `spring.profiles.active=dev` in `application.properties` sets a safe default for a developer's laptop.
- `application-dev.properties` and `application-prod.properties` are read only for their profile. Their `railbook.message` replaces the one in the main file.
- `@Profile("dev")` on `ConsoleMailSender` and `@Profile("prod")` on `SmtpMailSender` mean that only one `MailSender` bean exists in each run. That is why `BookingRunner` can ask for a plain `MailSender` with no qualifier.
- `@Profile("!prod")` on `SampleData` keeps sample data out of production.
- `ObjectProvider<SampleData>` lets the runner ask for the bean only if it exists. A direct `SampleData` parameter would stop the app in prod, where the bean does not exist.
- The command-line value `--spring.profiles.active=prod` beats the value in the properties file.

## Common Mistakes

> **Warning:** Never leave a production profile hard-coded in a file that a developer runs on a laptop. A developer could then change the live database by accident. Keep a safe default and set `prod` on the server.

- **A bean needed everywhere but marked with one profile.** If a class depends on a `dev`-only bean, the app fails in prod. Provide a matching bean for each profile, or use `ObjectProvider`.
- **Two profile beans active together.** If both `dev` and `prod` are active, both `MailSender` beans exist and injection becomes ambiguous.
- **Typos in the file name.** A file ending in `-production.properties` is read only when the profile is named `production`, not `prod`. The names must match exactly.
- **Putting sensitive values in profile files.** Committed files are readable by everyone with the code.

## Interview Questions

**What is a Spring profile?**
It is a named group of beans and settings that Spring activates only when that profile is switched on, so the same code can behave differently in dev, test and prod.

**How do you activate a profile?**
With `spring.profiles.active` in a properties file, with the system variable `SPRING_PROFILES_ACTIVE`, or with the command-line argument `--spring.profiles.active`.

**What does `@Profile("!prod")` mean?**
The bean is created in every setting except when the `prod` profile is active.

## Key Points to Remember

- Profiles let one build run differently in dev, test and prod.
- `@Profile` switches beans on or off. An `application-{profile}` file adds or replaces settings.
- Activate profiles by command line, system variable or properties file.
- If no profile is active, Spring uses the profile named `default`.
- Keep sensitive values out of profile files and pass them in from the server.

## Frequently Asked Questions

### What are Spring profiles used for?

They separate what should run in each place: fake services for development, real ones for production, and different settings for each. You switch between them without changing the code.

### Can more than one profile be active?

Yes. List them with commas, such as `dev,debug`. Beans and settings for all the listed profiles apply.

### Which wins if a property is in both files?

The profile-specific file wins over `application.properties`. A command-line argument beats both.

### Can I use profiles in tests?

Yes. A test can switch on a profile so it uses fake beans and test settings. That keeps tests away from real services.

## Related Topics

- [application.properties vs application.yml](/learning/spring-boot-tutorial/application-properties-vs-application-yml): learn how the settings files are written.
- [Externalized Configuration](/learning/spring-boot-tutorial/externalized-configuration): see all the places settings can come from.
- [Primary Annotation](/learning/spring-boot-tutorial/primary-annotation): choose a default when several beans match.
- [Configuration and Bean](/learning/spring-boot-tutorial/configuration-and-bean): create beans with methods.
