Try each problem on your own first. Both use the same `pom.xml` as the CineGo example; only change the `groupId` and `artifactId`. The programs switch off the web server so the console shows only your lines.

### Easy: The Default Printer

A school office has two printers behind a `Printer` interface: `LaserPrinter` and `InkjetPrinter`. Most documents go to the laser printer, so mark it as the default. The `OfficeDesk` asks for a plain `Printer` and prints the line `Circular for Class 5`.

> **Hint:** Add `@Primary` next to `@Component` on `LaserPrinter`. `OfficeDesk` needs no qualifier.

**Answer:** Two beans match the type, but one is primary, so Spring injects `LaserPrinter` without any qualifier.

**File:** `SchoolApplication.java` in package `com.greenfield.office`

```java
package com.greenfield.office;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SchoolApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(SchoolApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `Printer.java` in package `com.greenfield.office`

```java
package com.greenfield.office;

public interface Printer {

    String print(String text);
}
```

**File:** `LaserPrinter.java` in package `com.greenfield.office`

```java
package com.greenfield.office;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class LaserPrinter implements Printer {

    @Override
    public String print(String text) {
        return "Laser: " + text;
    }
}
```

**File:** `InkjetPrinter.java` in package `com.greenfield.office`

```java
package com.greenfield.office;

import org.springframework.stereotype.Component;

@Component
public class InkjetPrinter implements Printer {

    @Override
    public String print(String text) {
        return "Inkjet: " + text;
    }
}
```

**File:** `OfficeDesk.java` in package `com.greenfield.office`

```java
package com.greenfield.office;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class OfficeDesk implements CommandLineRunner {

    private final Printer printer;

    public OfficeDesk(Printer printer) {
        this.printer = printer;
    }

    @Override
    public void run(String... args) {
        System.out.println(printer.print("Circular for Class 5"));
    }
}
```

Running the jar prints:

```text
Laser: Circular for Class 5
```

### Medium: Primary Tax Rule with an Exception

FreshMart calculates tax with a `TaxRule` interface. Create two beans in a `@Configuration` class: `standardRule` (5 percent) marked `@Primary`, and `luxuryRule` (18 percent). A `BillingDesk` uses the default rule. A `GiftDesk` must use the luxury rule through `@Qualifier`. Print the tax on Rs 1000 for each desk.

> **Hint:** Write two `@Bean` methods that return small `TaxRule` lambdas. Put `@Primary` under `@Bean` on the standard one. Use `@Qualifier("luxuryRule")` in `GiftDesk`.

**Answer:** `BillingDesk` receives the primary bean, 5 percent of 1000 is 50. `GiftDesk` names the other bean, and 18 percent of 1000 is 180.

**File:** `MartApplication.java` in package `com.freshmart.tax`

```java
package com.freshmart.tax;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MartApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(MartApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `TaxRule.java` in package `com.freshmart.tax`

```java
package com.freshmart.tax;

public interface TaxRule {

    int taxOn(int amount);
}
```

**File:** `TaxConfig.java` in package `com.freshmart.tax`

```java
package com.freshmart.tax;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class TaxConfig {

    @Bean
    @Primary
    public TaxRule standardRule() {
        return amount -> amount * 5 / 100;
    }

    @Bean
    public TaxRule luxuryRule() {
        return amount -> amount * 18 / 100;
    }
}
```

**File:** `BillingDesk.java` in package `com.freshmart.tax`

```java
package com.freshmart.tax;

import org.springframework.stereotype.Service;

@Service
public class BillingDesk {

    private final TaxRule rule;

    public BillingDesk(TaxRule rule) {
        this.rule = rule;
    }

    public int tax(int amount) {
        return rule.taxOn(amount);
    }
}
```

**File:** `GiftDesk.java` in package `com.freshmart.tax`

```java
package com.freshmart.tax;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class GiftDesk {

    private final TaxRule rule;

    public GiftDesk(@Qualifier("luxuryRule") TaxRule rule) {
        this.rule = rule;
    }

    public int tax(int amount) {
        return rule.taxOn(amount);
    }
}
```

**File:** `TaxRunner.java` in package `com.freshmart.tax`

```java
package com.freshmart.tax;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class TaxRunner implements CommandLineRunner {

    private final BillingDesk billing;
    private final GiftDesk gifts;

    public TaxRunner(BillingDesk billing, GiftDesk gifts) {
        this.billing = billing;
        this.gifts = gifts;
    }

    @Override
    public void run(String... args) {
        System.out.println("Billing tax: " + billing.tax(1000));
        System.out.println("Gift tax: " + gifts.tax(1000));
    }
}
```

Running the jar prints:

```text
Billing tax: 50
Gift tax: 180
```
