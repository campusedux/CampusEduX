A neighbourhood clinic can remind patients about appointments in three ways: email, SMS or a WhatsApp message. The receptionist has a favourite. Unless told otherwise, she uses email, because it is free and everyone has it. But when a patient needs an urgent call, the doctor says, "Use SMS for this one." Her favourite is the default, and a direct instruction beats the default.

Spring has the same idea in the @Primary annotation. When several beans could do a job, `@Primary` marks the favourite. In this guide you will learn what it does, how it differs from `@Qualifier`, and how to use it with a small clinic program that really runs.

## What is the @Primary Annotation?

> **Definition:** `@Primary` marks one bean as the preferred choice. When Spring must inject a bean and finds several candidates of the same type, it picks the one marked `@Primary`.

You can put `@Primary` in two places:

- **On a class**, next to `@Component` or `@Service`.
- **On a `@Bean` method** inside a `@Configuration` class.

It sets a default for the whole application. Any class that asks for the type without saying more gets the primary bean.

## Why is it used?

In the last guide you saw that two beans of one type cause a start-up error. You could fix it with `@Qualifier` in every class, but that is a lot of repeating when nearly everyone wants the same bean.

- **One decision in one place.** Mark the favourite once, and every class that asks for the type receives it.
- **Less clutter.** Classes that want the normal choice need no extra annotation.
- **Easy override.** The few classes with special needs still use `@Qualifier` to pick something else.
- **Good for defaults and replacements.** A team can add a new implementation, mark it primary, and switch the whole application over without touching the callers.

Think of `@Primary` as "the default", and `@Qualifier` as "the exception".

## How it works

When Spring must choose one bean out of several, it applies the rules in a fixed order.

```text
+--------------------------------+
|  Class asks for a type         |
|  (for example a Sender)        |
+--------------------------------+
                |
                v
+--------------------------------+
|  Spring finds three beans of   |
|  that type                     |
+--------------------------------+
                |
                v
+--------------------------------+
|  Does the parameter have a     |
|  @Qualifier? Use that bean     |
+--------------------------------+
                |
             no |
                v
+--------------------------------+
|  Is one bean marked @Primary?  |
|  Use that bean                 |
+--------------------------------+
```

Spring first collects the candidates. A `@Qualifier` at the injection point is the most specific instruction, so it wins. If there is none, Spring looks for a bean marked `@Primary`. Only if both are missing does the start-up fail with an ambiguity error.

Here is how the clinic will look in the example below.

```text
AppointmentService
    ---> @Primary EmailSender

EmergencyService
    ---> @Qualifier SmsSender
```

The appointment service asks for the general type and gets the primary bean, email. The emergency service names the SMS bean with a qualifier, and that instruction overrides the default.

| Situation | Bean injected |
|---|---|
| One bean of the type | That bean |
| Several beans, one is `@Primary`, no qualifier | The primary bean |
| Several beans, one is `@Primary`, with `@Qualifier("x")` | Bean `x` |
| Several beans, no `@Primary`, no qualifier | Start-up error |
| Two beans both marked `@Primary` | Start-up error |

> **Warning:** Only one bean of a type can be primary. If two beans carry `@Primary`, Spring cannot choose and stops at start-up.

## Real-Life Example

At a busy tea stall, the sugar jar on the counter is the default. When a customer says nothing, the tea maker adds a spoon of it. The stall also keeps jaggery and sugar-free tablets. A customer who wants sugar-free says so, and the tea maker does exactly that. The default saves time for most customers, and the direct request still wins.

The sugar jar is the `@Primary` bean. The customer's spoken request is the `@Qualifier`.

## Code Example

Let's build CareFirst clinic's reminder system. There are three senders behind a `NotificationSender` interface. `EmailSender` is marked primary. The `AppointmentService` asks for the plain interface. The `EmergencyService` uses a qualifier to get SMS. Use the same `pom.xml` as the first CineGo example, changing only the groupId and artifactId.

```text
carefirst/
└─ src/main/java/
   └─ com/carefirst/notify/
      ├─ NotifyApplication.java
      ├─ NotificationSender.java
      ├─ EmailSender.java
      ├─ SmsSender.java
      ├─ WhatsAppSender.java
      ├─ AppointmentService.java
      ├─ EmergencyService.java
      └─ NotifyRunner.java
```

**File:** `NotifyApplication.java` in package `com.carefirst.notify`

```java
package com.carefirst.notify;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NotifyApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(NotifyApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `NotificationSender.java` in package `com.carefirst.notify`

```java
package com.carefirst.notify;

public interface NotificationSender {

    String send(String message);
}
```

**File:** `EmailSender.java` in package `com.carefirst.notify`

```java
package com.carefirst.notify;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class EmailSender implements NotificationSender {

    @Override
    public String send(String message) {
        return "Email: " + message;
    }
}
```

**File:** `SmsSender.java` in package `com.carefirst.notify`

```java
package com.carefirst.notify;

import org.springframework.stereotype.Component;

@Component
public class SmsSender implements NotificationSender {

    @Override
    public String send(String message) {
        return "SMS: " + message;
    }
}
```

**File:** `WhatsAppSender.java` in package `com.carefirst.notify`

```java
package com.carefirst.notify;

import org.springframework.stereotype.Component;

@Component
public class WhatsAppSender implements NotificationSender {

    @Override
    public String send(String message) {
        return "WhatsApp: " + message;
    }
}
```

**File:** `AppointmentService.java` in package `com.carefirst.notify`

```java
package com.carefirst.notify;

import org.springframework.stereotype.Service;

@Service
public class AppointmentService {

    private final NotificationSender sender;

    public AppointmentService(NotificationSender sender) {
        this.sender = sender;
    }

    public String remind() {
        return sender.send("Visit at 5 PM");
    }
}
```

**File:** `EmergencyService.java` in package `com.carefirst.notify`

```java
package com.carefirst.notify;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class EmergencyService {

    private final NotificationSender sender;

    public EmergencyService(@Qualifier("smsSender") NotificationSender sender) {
        this.sender = sender;
    }

    public String alert() {
        return sender.send("Ambulance sent");
    }
}
```

**File:** `NotifyRunner.java` in package `com.carefirst.notify`

```java
package com.carefirst.notify;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class NotifyRunner implements CommandLineRunner {

    private final AppointmentService appointments;
    private final EmergencyService emergencies;
    private final List<NotificationSender> all;

    public NotifyRunner(AppointmentService appointments, EmergencyService emergencies,
            List<NotificationSender> all) {
        this.appointments = appointments;
        this.emergencies = emergencies;
        this.all = all;
    }

    @Override
    public void run(String... args) {
        System.out.println("Reminder = " + appointments.remind());
        System.out.println("Alert = " + emergencies.alert());
        System.out.println("Senders available: " + all.size());
    }
}
```

Build and run it:

```bash
mvn -q package
java -jar target/notify-0.0.1-SNAPSHOT.jar
```

**Output:**

```text
Reminder = Email: Visit at 5 PM
Alert = SMS: Ambulance sent
Senders available: 3
```

The reminder used email, the primary bean, even though the service never named it. The alert used SMS, because the qualifier beat the default. All three senders are still beans, and injecting the whole list still gives all three. `@Primary` only changes what a single injection point receives.

If you mark a second sender primary as well, say `SmsSender`, the application refuses to start. The line that matters in the message, trimmed and split, reads:

```text
NoUniqueBeanDefinitionException:
No qualifying bean of type
NotificationSender available:
more than one 'primary' bean
found among candidates:
[emailSender, smsSender,
whatsAppSender]
```

## Code Explained

- `@Primary` on `EmailSender` makes it the default whenever a `NotificationSender` is asked for without further detail.
- `AppointmentService` asks for plain `NotificationSender`. Spring sees three candidates, finds the primary one and injects it.
- `EmergencyService` uses `@Qualifier("smsSender")`. The bean name comes from the class name with a lower case first letter, so `SmsSender` becomes `smsSender`. The qualifier takes priority over `@Primary`.
- `List<NotificationSender>` injects every bean of the type. `@Primary` does not reduce this list.
- The same rules apply to a `@Bean` method. You write `@Bean` and `@Primary` together on the method.

## Common Mistakes

> **Warning:** Do not mark several beans of one type as `@Primary`. It only makes sense for one bean per type, and Spring will not start otherwise.

- **Thinking `@Primary` hides other beans.** The others still exist and can be picked with `@Qualifier` or injected as a list.
- **Marking a bean primary "just to make the error go away".** Ask first who should really get which bean. Sometimes `@Qualifier` in the one place that needs it is the cleaner choice.
- **Expecting `@Primary` to beat `@Qualifier`.** The reverse is true. The qualifier is the more specific instruction.
- **Putting `@Primary` on the interface.** It goes on the implementation class or on the `@Bean` method.

## Interview Questions

**What does `@Primary` do?**
It marks a bean as the default choice when several beans of the same type are candidates for injection.

**What is the difference between `@Primary` and `@Qualifier`?**
`@Primary` sets one default for everybody. `@Qualifier` is placed at one injection point and names the bean it wants. The qualifier wins if both are present.

**Can two beans of the same type both be `@Primary`?**
No. Spring cannot choose between them, so the application fails to start.

## Key Points to Remember

- `@Primary` marks the favourite bean when several beans of one type exist.
- It can go on a class or on a `@Bean` method.
- `@Qualifier` at an injection point overrides `@Primary`.
- Only one bean per type may be primary.
- `@Primary` does not remove other beans, and list injection still returns them all.

## Frequently Asked Questions

### What does the @Primary annotation do in Spring Boot?

It tells Spring which bean to inject by default when more than one bean of the requested type exists. Classes that ask for the type without a qualifier get the primary bean.

### When should I use @Primary instead of @Qualifier?

Use `@Primary` when most classes want the same bean and only a few want another. Use `@Qualifier` when each class has to choose deliberately.

### Can I use @Primary with @Bean methods?

Yes. Put `@Primary` on the `@Bean` method, next to `@Bean`. It works the same way as on a class.

### What if I need to change the primary bean for tests?

Create a test configuration with a fake bean marked `@Primary`. It will be preferred over the real one in that test, and your production code stays unchanged.

## Related Topics

- [Autowired and Qualifier](/learning/spring-boot-tutorial/autowired-and-qualifier): pick a specific bean by name.
- [Configuration and Bean](/learning/spring-boot-tutorial/configuration-and-bean): create beans with methods.
- [Spring Profiles](/learning/spring-boot-tutorial/spring-profiles): switch beans by environment.
- [Dependency Injection](/learning/spring-boot-tutorial/dependency-injection): the basics of how beans are supplied.
