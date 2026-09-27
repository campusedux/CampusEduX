Try each problem on your own first. Both use the same `pom.xml` as the CineGo example; only change the `groupId` and `artifactId`. Both programs switch off the web server so the console shows only your lines.

### Easy: Clinic Appointment Desk

Sunrise Clinic wants a small program. An `AppointmentDesk` must book a visit and print a reminder text made by a `ReminderMaker`. The desk must not create the maker with `new`. Let Spring do it. Booking "Meera" for "10:30" should print `Reminder: Meera, visit at 10:30`.

> **Hint:** Mark both classes with `@Component`. Ask for the `ReminderMaker` in the constructor of the desk. Use a `CommandLineRunner` to call the desk.

**Answer:** The desk lists the maker as a constructor parameter, so Spring builds the maker first and passes it in.

**File:** `ClinicApplication.java` in package `com.sunrise.clinic`

```java
package com.sunrise.clinic;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ClinicApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(ClinicApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `ReminderMaker.java` in package `com.sunrise.clinic`

```java
package com.sunrise.clinic;

import org.springframework.stereotype.Component;

@Component
public class ReminderMaker {

    public String make(String patient, String time) {
        return "Reminder: " + patient + ", visit at " + time;
    }
}
```

**File:** `AppointmentDesk.java` in package `com.sunrise.clinic`

```java
package com.sunrise.clinic;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class AppointmentDesk implements CommandLineRunner {

    private final ReminderMaker reminderMaker;

    public AppointmentDesk(ReminderMaker reminderMaker) {
        this.reminderMaker = reminderMaker;
    }

    @Override
    public void run(String... args) {
        System.out.println(reminderMaker.make("Meera", "10:30"));
    }
}
```

Running the jar prints:

```text
Reminder: Meera, visit at 10:30
```

### Medium: Swap the Notification Sender

A hostel office sends notices through a `NoticeSender` interface. Today it uses `NoticeBoardSender`, which prints `Notice board: <text>`. Build a `HostelOffice` that depends only on the interface. Then show that changing the sender means editing one class, not the office. Make the office publish "Mess closed Sunday".

> **Hint:** Put `@Component` on only one implementation. The office asks for `NoticeSender`, and Spring supplies the single bean of that type. If you later add a second implementation, you must choose one, and the next guides show how.

**Answer:** The office knows only the interface. Spring finds the one bean that implements it and injects it. To switch to another sender you would move the annotation to a different class, and the office stays untouched.

**File:** `HostelApplication.java` in package `com.campusnest.hostel`

```java
package com.campusnest.hostel;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HostelApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(HostelApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `NoticeSender.java` in package `com.campusnest.hostel`

```java
package com.campusnest.hostel;

public interface NoticeSender {

    void send(String text);
}
```

**File:** `NoticeBoardSender.java` in package `com.campusnest.hostel`

```java
package com.campusnest.hostel;

import org.springframework.stereotype.Component;

@Component
public class NoticeBoardSender implements NoticeSender {

    @Override
    public void send(String text) {
        System.out.println("Notice board: " + text);
    }
}
```

**File:** `HostelOffice.java` in package `com.campusnest.hostel`

```java
package com.campusnest.hostel;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class HostelOffice implements CommandLineRunner {

    private final NoticeSender sender;

    public HostelOffice(NoticeSender sender) {
        this.sender = sender;
    }

    @Override
    public void run(String... args) {
        sender.send("Mess closed Sunday");
    }
}
```

Running the jar prints:

```text
Notice board: Mess closed Sunday
```
