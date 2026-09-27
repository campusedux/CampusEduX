Try each problem on your own first. Both use the same `pom.xml` as the CineGo example; only change the `groupId` and `artifactId`. The programs switch off the web server so the console shows only your lines.

### Easy: Pick the Right Delivery Partner

QuickBite has two delivery partners, `BikePartner` (bean name `bike`) and `CarPartner` (bean name `car`), both implementing `DeliveryPartner`. A `DeliveryDesk` must always use the bike partner for a small order. Use `@Qualifier` to make that choice and print the result.

> **Hint:** Give each class a name in `@Component("...")`. In the constructor of `DeliveryDesk`, write `@Qualifier("bike") DeliveryPartner partner`.

**Answer:** With two beans of one type, the qualifier names the one to inject.

**File:** `DeliveryApplication.java` in package `com.quickbite.partners`

```java
package com.quickbite.partners;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DeliveryApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(DeliveryApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `DeliveryPartner.java` in package `com.quickbite.partners`

```java
package com.quickbite.partners;

public interface DeliveryPartner {

    String deliver(String order);
}
```

**File:** `BikePartner.java` in package `com.quickbite.partners`

```java
package com.quickbite.partners;

import org.springframework.stereotype.Component;

@Component("bike")
public class BikePartner implements DeliveryPartner {

    @Override
    public String deliver(String order) {
        return order + " by bike";
    }
}
```

**File:** `CarPartner.java` in package `com.quickbite.partners`

```java
package com.quickbite.partners;

import org.springframework.stereotype.Component;

@Component("car")
public class CarPartner implements DeliveryPartner {

    @Override
    public String deliver(String order) {
        return order + " by car";
    }
}
```

**File:** `DeliveryDesk.java` in package `com.quickbite.partners`

```java
package com.quickbite.partners;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DeliveryDesk implements CommandLineRunner {

    private final DeliveryPartner partner;

    public DeliveryDesk(@Qualifier("bike") DeliveryPartner partner) {
        this.partner = partner;
    }

    @Override
    public void run(String... args) {
        System.out.println(partner.deliver("Two samosas"));
    }
}
```

Running the jar prints:

```text
Two samosas by bike
```

### Medium: Choose a Language at Run Time

HelloBank greets customers in different languages. Create a `Greeter` interface with three beans named `english`, `hindi` and `marathi`. A `GreetingService` must receive all the greeters in a `Map<String, Greeter>` and offer a method `greet(String language, String name)` that picks the right one by key. Print a greeting for `hindi`, then one for `marathi`.

> **Hint:** Spring fills a `Map<String, Greeter>` with every bean of that type, using the bean names as keys. Look the greeter up with `map.get(language)`.

**Answer:** The map holds all three beans, so the service chooses one at run time. A qualifier would fix the choice at start-up, but a map lets the choice change on every call.

**File:** `BankApplication.java` in package `com.hellobank.greet`

```java
package com.hellobank.greet;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BankApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(BankApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `Greeter.java` in package `com.hellobank.greet`

```java
package com.hellobank.greet;

public interface Greeter {

    String greet(String name);
}
```

**File:** `EnglishGreeter.java` in package `com.hellobank.greet`

```java
package com.hellobank.greet;

import org.springframework.stereotype.Component;

@Component("english")
public class EnglishGreeter implements Greeter {

    @Override
    public String greet(String name) {
        return "Welcome, " + name;
    }
}
```

**File:** `HindiGreeter.java` in package `com.hellobank.greet`

```java
package com.hellobank.greet;

import org.springframework.stereotype.Component;

@Component("hindi")
public class HindiGreeter implements Greeter {

    @Override
    public String greet(String name) {
        return "Swagat hai, " + name;
    }
}
```

**File:** `MarathiGreeter.java` in package `com.hellobank.greet`

```java
package com.hellobank.greet;

import org.springframework.stereotype.Component;

@Component("marathi")
public class MarathiGreeter implements Greeter {

    @Override
    public String greet(String name) {
        return "Namaskar, " + name;
    }
}
```

**File:** `GreetingService.java` in package `com.hellobank.greet`

```java
package com.hellobank.greet;

import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class GreetingService {

    private final Map<String, Greeter> greeters;

    public GreetingService(Map<String, Greeter> greeters) {
        this.greeters = greeters;
    }

    public String greet(String language, String name) {
        return greeters.get(language).greet(name);
    }
}
```

**File:** `GreetRunner.java` in package `com.hellobank.greet`

```java
package com.hellobank.greet;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class GreetRunner implements CommandLineRunner {

    private final GreetingService service;

    public GreetRunner(GreetingService service) {
        this.service = service;
    }

    @Override
    public void run(String... args) {
        System.out.println(service.greet("hindi", "Asha"));
        System.out.println(service.greet("marathi", "Ravi"));
    }
}
```

Running the jar prints:

```text
Swagat hai, Asha
Namaskar, Ravi
```
