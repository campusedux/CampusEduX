Try each problem on your own first. Both are command line programs that use the `JavaMailSender` from the mail starter.

### Easy: Overdue Book Reminder

PageTurn Library wants a plain text reminder mail to `member@example.com` with the subject `Book overdue: River Songs` and the text `Please return the book by Friday.` Send it with a test mail server on port 1025, and print `Reminder sent` when done.

> **Hint:** Inject `JavaMailSender`, fill a `SimpleMailMessage` (from, to, subject, text) and call `send`. Set `spring.mail.host` and `spring.mail.port` in `application.properties`.

**Answer:** The starter creates the sender from the two properties. `SimpleMailMessage` is enough for plain text.

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
    <artifactId>reminder</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
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
spring.mail.host=localhost
spring.mail.port=1025
```

**File:** `ReminderApplication.java` in package `com.pageturn.reminder`

```java
package com.pageturn.reminder;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@SpringBootApplication
public class ReminderApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReminderApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(JavaMailSender mailSender) {
        return args -> {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("desk@pageturn.example");
            message.setTo("member@example.com");
            message.setSubject("Book overdue: River Songs");
            message.setText("Please return the book by Friday.");
            mailSender.send(message);
            System.out.println("Reminder sent");
        };
    }
}
```

**Output:**

```text
Reminder sent
```

The test server logged one message with the subject line above.

### Medium: Retry When the Mail Server Is Down

FreshCart sends order mails, but its mail server is sometimes down. Write a `MailRetry` service with `sendWithRetry(to, subject, text, attempts)`. It tries up to the given number of times, prints `Attempt N failed` after each failure, and prints `Gave up after N attempts` at the end. Test it with no mail server running, using 2 attempts and a short connection timeout.

> **Hint:** Loop from 1 to `attempts`, catch `MailException` around `send`, and return on success. Set the SMTP connection timeout property (see the properties file below) to a small number so the demo is quick.

**Answer:** With nothing listening on the port, every attempt throws `MailSendException`, so both attempts fail and the method gives up. A real app would wait between attempts and run this in the background.

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

    <groupId>com.freshcart</groupId>
    <artifactId>orders</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
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
spring.mail.host=localhost
spring.mail.port=1025
spring.mail.properties.mail.smtp.connectiontimeout=2000
```

**File:** `MailRetry.java` in package `com.freshcart.orders`

```java
package com.freshcart.orders;

import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailRetry {

    private final JavaMailSender mailSender;

    public MailRetry(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean sendWithRetry(String to, String subject, String text, int attempts) {
        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom("orders@freshcart.example");
                message.setTo(to);
                message.setSubject(subject);
                message.setText(text);
                mailSender.send(message);
                System.out.println("Sent on attempt " + attempt);
                return true;
            } catch (MailException e) {
                System.out.println("Attempt " + attempt + " failed");
            }
        }
        System.out.println("Gave up after " + attempts + " attempts");
        return false;
    }
}
```

**File:** `OrdersApplication.java` in package `com.freshcart.orders`

```java
package com.freshcart.orders;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(MailRetry retry) {
        return args -> retry.sendWithRetry("buyer@example.com", "Order 55 packed", "Your order is on its way.", 2);
    }
}
```

**Output:**

```text
Attempt 1 failed
Attempt 2 failed
Gave up after 2 attempts
```
