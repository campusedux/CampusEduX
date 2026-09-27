A film school trains actors with stand-ins. Before the real hero arrives, a stand-in walks through the scene, so the camera crew can test the lights and the angles. Nobody needs the expensive star for that. In testing, a mock is the stand-in. It looks like the real helper, but it does exactly what the test tells it to do.

This guide on Mockito in Spring Boot shows how to replace slow, risky or unavailable helpers, such as a payment gateway or an SMS service, so your tests stay fast and safe.

## What is Mockito in Spring Boot?

> **Definition:** Mockito is a Java library that creates mock objects: fake copies of a class or interface whose answers you control and whose calls you can check afterwards.

A real payment gateway would charge a real card. A real SMS service would message a real phone. You do not want either during a test. With Mockito you say, "when the gateway is asked to charge 450 rupees, answer yes." Then you run your code and check what happened, for instance, "was the SMS sent exactly once?"

Mockito comes with `spring-boot-starter-test`, so there is nothing extra to add.

## Why is it used?

- **Test one class alone.** If `OrderService` fails, you know the fault is in `OrderService`, not in the bank.
- **No side effects.** No money moves, no message is sent, no file is written.
- **Speed.** A mock answers instantly, with no network call.
- **Hard situations.** You can make a mock throw an error or return "failed" to see how your code reacts.
- **Behaviour checks.** You can verify that something was called, or not called.

## How it works

You create mocks for the helpers, place them inside the class under test, set up the answers, run the method, and finally verify the calls.

```text
@Mock PaymentGateway
@Mock SmsSender
        |
        v  injected into
+--------------------+
| OrderService       |
| (real object)      |
+--------------------+
        |
        v  test calls placeOrder
  when(...).thenReturn(...)
        |
        v
  verify(sms).send(...)
```

The class under test is real. Its helpers are mocks. Before each test, Mockito creates fresh mocks, and `@InjectMocks` passes them into the constructor of the real object. During the test, a mock records every call it receives, and `verify` reads that record.

## The Key Mockito Tools

| Tool | Meaning |
|---|---|
| `@Mock` | Creates a mock object |
| `@InjectMocks` | Builds the class under test with the mocks |
| `when(...).thenReturn(...)` | Sets the answer of a mock |
| `thenThrow(...)` | Makes the mock throw an exception |
| `verify(mock).method(...)` | Checks the call happened once |
| `verify(mock, never())` | Checks the call did not happen |
| `ArgumentCaptor` | Grabs the value that was passed |

## Real-Life Example

QuickBite delivers food. When a customer places an order, the `OrderService` charges the card through a payment gateway and sends a confirmation SMS. If the payment fails, no SMS must go out. Testing that with a real bank and a real phone company would be slow, costly and impossible to repeat. With mocks, the test decides whether the payment works, and then checks whether the SMS was sent.

## Code Example

Let's build the QuickBite order flow and test it in two ways: a pure Mockito test, and a Spring test where mocks replace real beans.

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

    <groupId>com.quickbite</groupId>
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
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

**File:** `OrdersApplication.java` in package `com.quickbite`

```java
package com.quickbite;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }
}
```

**File:** `PaymentGateway.java` in package `com.quickbite`

```java
package com.quickbite;

public interface PaymentGateway {

    boolean charge(String customer, int amount);
}
```

**File:** `SmsSender.java` in package `com.quickbite`

```java
package com.quickbite;

public interface SmsSender {

    void send(String phone, String text);
}
```

**File:** `CardGateway.java` in package `com.quickbite`

```java
package com.quickbite;

import org.springframework.stereotype.Component;

@Component
public class CardGateway implements PaymentGateway {

    @Override
    public boolean charge(String customer, int amount) {
        // A real gateway would call the bank here.
        return amount <= 5000;
    }
}
```

**File:** `ConsoleSmsSender.java` in package `com.quickbite`

```java
package com.quickbite;

import org.springframework.stereotype.Component;

@Component
public class ConsoleSmsSender implements SmsSender {

    @Override
    public void send(String phone, String text) {
        System.out.println("SMS to " + phone + ": " + text);
    }
}
```

**File:** `OrderService.java` in package `com.quickbite`

```java
package com.quickbite;

import org.springframework.stereotype.Service;

@Service
public class OrderService {

    private final PaymentGateway gateway;
    private final SmsSender sms;

    public OrderService(PaymentGateway gateway, SmsSender sms) {
        this.gateway = gateway;
        this.sms = sms;
    }

    public String placeOrder(String customer, String phone, int amount) {
        if (!gateway.charge(customer, amount)) {
            return "PAYMENT_FAILED";
        }
        sms.send(phone, "Order confirmed: Rs " + amount);
        return "CONFIRMED";
    }
}
```

**File:** `OrderServiceTest.java` in `src/test/java/com/quickbite`

```java
package com.quickbite;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private PaymentGateway gateway;

    @Mock
    private SmsSender sms;

    @InjectMocks
    private OrderService service;

    @Test
    void confirmedWhenPaymentWorks() {
        when(gateway.charge("Meera", 450)).thenReturn(true);

        String result = service.placeOrder("Meera", "98220", 450);

        assertThat(result).isEqualTo("CONFIRMED");
        verify(sms).send("98220", "Order confirmed: Rs 450");
    }

    @Test
    void noSmsWhenPaymentFails() {
        when(gateway.charge(anyString(), anyInt())).thenReturn(false);

        String result = service.placeOrder("Meera", "98220", 450);

        assertThat(result).isEqualTo("PAYMENT_FAILED");
        verify(sms, never()).send(anyString(), anyString());
    }

    @Test
    void smsTextIsCaptured() {
        when(gateway.charge("Arjun", 300)).thenReturn(true);
        ArgumentCaptor<String> text = ArgumentCaptor.forClass(String.class);

        service.placeOrder("Arjun", "99001", 300);

        verify(sms).send(anyString(), text.capture());
        assertThat(text.getValue()).contains("Rs 300");
    }

    @Test
    void gatewayErrorReachesTheCaller() {
        when(gateway.charge("Meera", 450)).thenThrow(new IllegalStateException("Bank down"));

        assertThrows(IllegalStateException.class,
                () -> service.placeOrder("Meera", "98220", 450));
    }
}
```

**File:** `OrderServiceSpringTest.java` in `src/test/java/com/quickbite`

```java
package com.quickbite;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class OrderServiceSpringTest {

    @Autowired
    private OrderService service;

    @MockitoBean
    private PaymentGateway gateway;

    @MockitoBean
    private SmsSender sms;

    @Test
    void mocksReplaceTheRealBeans() {
        when(gateway.charge("Meera", 9000)).thenReturn(true);

        String result = service.placeOrder("Meera", "98220", 9000);

        assertThat(result).isEqualTo("CONFIRMED");
        verify(sms).send("98220", "Order confirmed: Rs 9000");
    }
}
```

Run the tests:

```bash
./mvnw test
```

**Output:**

```text
Tests run: 5
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```

Maven prints the four counts on one line; they are split here for reading. Five tests ran: four in the Mockito class and one in the Spring class.

## Code Explained

- The `@ExtendWith` line with `MockitoExtension` makes JUnit create the mocks before each test. There is no Spring here, so it is fast.
- The `@Mock` annotation creates fake versions of the two helpers. `@InjectMocks` builds a real `OrderService` and passes them to its constructor.
- `when(gateway.charge("Meera", 450)).thenReturn(true)` teaches the mock one answer.
- `verify(sms).send(...)` checks that the SMS call happened exactly once with these values.
- `verify(sms, never())` in the failure test proves that no SMS goes out when payment fails. `anyString()` and `anyInt()` match any value.
- `ArgumentCaptor` catches the text that was sent, so we can check part of it.
- `thenThrow` shows that an error from the bank reaches the caller.
- In the Spring test, `@MockitoBean` replaces the real `CardGateway` and `ConsoleSmsSender` inside the Spring context. In Spring Boot 4 it lives in the `mockito` package under `bean.override` in Spring's test library. It replaces the older `@MockBean`.
- The real gateway rejects amounts above 5000, but the Spring test charges 9000 and still gets CONFIRMED, because the mock was in charge.

## Mock, Stub and Verify

Three words come up again and again. A mock is the fake object. Stubbing means teaching it an answer, which is the `when` line. Verifying means checking afterwards what was called. Think of a stand-in actor: you give it lines, you let it perform, and then you ask the director whether the scene was played as planned. Most tests use all three, in that order: arrange the stubs, act by calling the method, then assert and verify.

## Strict Stubs

Mockito with JUnit is strict by default. We added a test that sets up an answer but never uses it. The run failed with `UnnecessaryStubbingException` and the message "Unnecessary stubbings detected". This is helpful. An unused stub usually means the test does not do what you believe, or the code no longer calls that helper. Remove the stub, or fix the test.

## Common Mistakes

> **Warning:** Do not mock the class you are testing, and do not mock simple values such as strings or lists. Mock the outside helpers that are slow, costly or unpredictable.

- **Too many mocks.** If a test is mostly mock set-up, the design may be too tangled.
- **Verifying everything.** Check only the calls that matter to the behaviour. Over-verifying makes tests break at every small change.
- **Forgetting the extension.** Without `MockitoExtension`, the `@Mock` fields stay null and you get a NullPointerException.
- **Using old annotations.** `@MockBean` was replaced by `@MockitoBean` in Spring Boot 4. Old blog posts still show the old name.
- **Stubbing a mock you did not inject.** The class under test must receive the same mock object.

## Interview Questions

**What is the difference between `@Mock` and `@InjectMocks`?**
`@Mock` creates a fake helper. `@InjectMocks` creates the real class under test and passes the mocks into it.

**What is the difference between `@Mock` and `@MockitoBean`?**
`@Mock` is plain Mockito with no Spring. `@MockitoBean` puts a mock into the Spring context in place of the real bean.

**How do you check that a method was not called?**
Use `verify(mock, never()).method(...)`.

## Key Points to Remember

- A mock is a stand-in whose answers you control.
- Use `when(...).thenReturn(...)` to set answers and `verify` to check calls.
- `@Mock` plus `@InjectMocks` gives a fast test with no Spring.
- `@MockitoBean` replaces a bean inside a Spring test.
- Mock outside helpers, not the class under test.
- Strict stubs catch set-up that the test never uses.

## Frequently Asked Questions

### What is Mockito in Spring Boot used for?

It is used to replace real helpers such as databases, gateways and mail services with fakes, so a test checks only the class you care about.

### Do I need to add Mockito to my pom.xml?

No. `spring-boot-starter-test` already includes it.

### Should I use @Mock or @MockitoBean?

Use `@Mock` for plain unit tests, which are faster. Use `@MockitoBean` when the test needs the Spring context and one bean must be faked.

### Can Mockito mock a final class?

Yes, modern Mockito versions can mock final classes and methods. Still, prefer mocking interfaces.

## Related Topics

- [Unit Testing with JUnit 5](/learning/spring-boot-tutorial/unit-testing-with-junit-5): the test basics that Mockito builds on.
- [@SpringBootTest](/learning/spring-boot-tutorial/spring-boot-test): load the whole application in a test.
- [@WebMvcTest and MockMvc](/learning/spring-boot-tutorial/web-mvc-test-and-mockmvc): fake the service behind a controller.
- [Dependency Injection](/learning/spring-boot-tutorial/dependency-injection): why constructor injection makes mocking easy.
