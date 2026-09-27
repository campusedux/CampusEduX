When you book a room at a hotel, you expect an email within a minute: your booking number, dates and a thank-you line. Nobody at the hotel types it. The booking system sends it. Almost every real app needs this: welcome mail, password reset, invoice, report. Sending email in Spring Boot takes one starter and one class, and you can test it on your own laptop without touching a real mailbox.

In this guide you will send a plain text mail and an HTML mail with an attachment, connect to a mail server through `application.properties`, and handle failures properly.

## What is Sending Email in Spring Boot?

> **Definition:** Sending email in Spring Boot means using the `JavaMailSender` bean, which the mail starter creates for you, to hand a message to an SMTP server. The SMTP server then delivers it to the receiver's inbox.

Your app does not deliver the mail itself. It talks to a mail server using a simple protocol called SMTP, like a customer handing a parcel to a courier. The server can be Gmail, your company's mail service, a paid sending service, or a fake local server for testing.

Two message types cover most needs:

- `SimpleMailMessage` for plain text: a to address, a subject and a text.
- `MimeMessage` for HTML, attachments and inline images, built easily with `MimeMessageHelper`.

## Why is it used?

- **Account flows.** Welcome mails, verification links and password resets.
- **Receipts and confirmations.** Bookings, orders and payments.
- **Alerts and reports.** Daily summaries from scheduled jobs.
- **A standard tool.** The same code works with any SMTP provider. Only the settings change.

## How it works

```text
Your service
    |
    | send(message)
    v
+------------------------+
| JavaMailSender         |
| (from the mail starter)|
+------------------------+
    |
    | SMTP: host + port
    v
+------------------------+
| Mail server            |
+------------------------+
    |
    v
Receiver's inbox
```

When you add `spring-boot-starter-mail` and set `spring.mail.host`, Spring Boot creates a `JavaMailSender` bean using your settings. Your service asks for it, builds a message and calls `send`. The sender opens a connection to the mail server, gives it the message and closes the connection. If the server cannot be reached or rejects the mail, a `MailException` is thrown.

## Real-Life Example

A courier company delivers your parcel, but you never see the trucks. You give the parcel to the pickup counter with an address, and the counter takes care of the rest. The mail server is that counter. Your app only needs the counter's address (host and port) and, for a real one, an ID card (username and login). A test counter that accepts every parcel and throws it in a box lets you practise without sending anything to real people.

## Code Example

Let's build SeaBreeze Resort. After a booking, the app sends a plain confirmation and an HTML mail with a small attachment. The app talks to a mail server on `localhost:1025`. That is where tools like Mailpit, MailHog or a small test SMTP server listen, so nothing reaches a real inbox.

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

    <groupId>com.seabreeze</groupId>
    <artifactId>booking</artifactId>
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
spring.application.name=seabreeze-booking
spring.main.banner-mode=off
logging.level.root=warn

spring.mail.host=localhost
spring.mail.port=1025
seabreeze.mail.from=bookings@seabreeze.example
```

**File:** `BookingMailer.java` in package `com.seabreeze.booking`

```java
package com.seabreeze.booking;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class BookingMailer {

    private final JavaMailSender mailSender;
    private final String from;

    public BookingMailer(JavaMailSender mailSender, @Value("${seabreeze.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void sendPlain(String to, String bookingNo) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("Booking " + bookingNo + " confirmed");
        message.setText("Thank you for booking with SeaBreeze Resort.\nCheck-in is after 2 PM.");
        mailSender.send(message);
    }

    public void sendHtml(String to, String bookingNo) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(to);
        helper.setSubject("Your stay details for " + bookingNo);
        helper.setText("<h2>Welcome to SeaBreeze</h2><p>Booking <b>" + bookingNo + "</b> is ready.</p>", true);
        helper.addAttachment("directions.txt",
            new ByteArrayResource("Take the coastal road, turn left at the lighthouse.".getBytes()));
        mailSender.send(message);
    }
}
```

**File:** `BookingApplication.java` in package `com.seabreeze.booking`

```java
package com.seabreeze.booking;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.mail.MailException;

@SpringBootApplication
public class BookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(BookingMailer mailer) {
        return args -> {
            try {
                mailer.sendPlain("guest@example.com", "SB-1001");
                System.out.println("Plain mail handed to the server");
                mailer.sendHtml("guest@example.com", "SB-1001");
                System.out.println("HTML mail handed to the server");
            } catch (MailException e) {
                System.out.println("Mail could not be sent: " + e.getClass().getSimpleName());
            }
        };
    }
}
```

Start a test mail server first, then run the app with `./mvnw spring-boot:run`.

**Output:**

```text
Plain mail handed to the server
HTML mail handed to the server
```

Here the test server logged two mails: the plain one with the subject "Booking SB-1001 confirmed", and the second one with the subject "Your stay details for SB-1001", an HTML part and the attachment `directions.txt`. If no server is listening, the same run prints the fallback line instead:

```text
Mail could not be sent:
MailSendException
```

That second output is one line on screen, wrapped here to fit small screens.

## Code Explained

- `spring-boot-starter-mail` brings the Jakarta Mail library and creates the `JavaMailSender` bean when `spring.mail.host` is set. Without the host property, the bean is not created.
- `SimpleMailMessage` is enough for plain text: from, to, subject and body.
- For HTML and attachments we build a `MimeMessage` through `MimeMessageHelper`. The `true` in the constructor turns on multipart mode, which is required for attachments. The `true` in `setText` says the text is HTML.
- The sender address is kept in `application.properties`, so each environment can use its own.
- The runner catches `MailException`, the parent of all Spring mail errors. If the server is down, the app prints a friendly line instead of crashing.
- The test server received both mails. Its log showed the subject lines and, for the second one, a multipart body with an HTML part and the `directions.txt` attachment.

## Settings for a Real Mail Provider

Real providers need a secure connection and a login. Keep the login out of the source code, and pass it in from your hosting platform's protected settings.

```properties
spring.mail.host=smtp.provider.example
spring.mail.port=587
spring.mail.username=${MAIL_USER}
spring.mail.password=${MAIL_PASS}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

Port 587 with STARTTLS is the most common. Some providers use port 465 with SSL. Gmail needs an app-specific login rather than your normal one. Never commit the real values to Git.

## Common Mistakes

> **Warning:** Never write the mail login into a file that goes to Git. Read it from protected settings on the server, or from a vault.

- **Sending mail on the request thread.** Mail can take seconds. Send it with `@Async` or from an event listener, so the user does not wait.
- **Not handling failures.** Servers go down. Catch `MailException` and decide whether to retry, log or tell the user.
- **Forgetting multipart mode.** Attachments need `new MimeMessageHelper(message, true, ...)`. Without `true`, adding an attachment fails.
- **Testing against a real inbox.** Use a local test server such as Mailpit or MailHog during development.
- **Building HTML with string glue.** For bigger mails, use a template engine so designers can edit the layout.
- **Trusting user input in the subject.** Line breaks in a subject can be used to inject extra headers. Clean values that come from users.

## Interview Questions

**Which starter do you need for email?**
`spring-boot-starter-mail`. It adds Jakarta Mail and creates a `JavaMailSender`.

**What is the difference between `SimpleMailMessage` and `MimeMessage`?**
`SimpleMailMessage` is for plain text. `MimeMessage` supports HTML, attachments and inline images.

**How do you configure the mail server?**
Set `spring.mail.host`, `spring.mail.port`, and if needed `spring.mail.username` and `spring.mail.password` in `application.properties`.

**How do you avoid making users wait for email?**
Send it in the background with `@Async`, or trigger it from an event listener after the main work is done.

**How do you test email without a real inbox?**
Run a fake SMTP server such as Mailpit or MailHog and point `spring.mail.host` to it.

## Key Points to Remember

- Add the mail starter and set `spring.mail.host` to get a `JavaMailSender`.
- Use `SimpleMailMessage` for plain text and `MimeMessageHelper` for HTML and attachments.
- Your app talks to an SMTP server, which delivers the mail.
- Catch `MailException`, and send mail off the request thread.
- Keep mail logins out of source code.

## Frequently Asked Questions

### Can I use Gmail for sending email in Spring Boot?

Yes. Use `smtp.gmail.com` on port 587 with STARTTLS and an app password. For real products, a proper sending service is more reliable.

### Why is my JavaMailSender bean missing?

The mail starter may be missing, or `spring.mail.host` is not set. Both are needed for the bean to be created.

### How do I send an email with an attachment?

Create a `MimeMessage`, wrap it in `MimeMessageHelper` with multipart set to `true`, and call `addAttachment`.

### How do I test email safely?

Use a local fake mail server like Mailpit or MailHog. It accepts all mail and shows it in a web page or log, so nothing reaches real people.

## Related Topics

- [Async Processing with @Async](/learning/spring-boot-tutorial/async-processing-with-async): send mail without making the user wait.
- [Spring Events](/learning/spring-boot-tutorial/spring-events): trigger mail from an event listener.
- [Scheduling with @Scheduled](/learning/spring-boot-tutorial/scheduling-with-scheduled): send a daily report by mail.
- [Externalized Configuration](/learning/spring-boot-tutorial/externalized-configuration): keep mail logins out of your code.
