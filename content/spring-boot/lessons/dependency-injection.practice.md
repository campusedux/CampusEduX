Try each problem on your own first. Both use the same `pom.xml` as the CineGo example; only change the `groupId` and `artifactId`. The programs switch off the web server so the console shows only your lines.

### Easy: Pharmacy Stock Check

MediCare Pharmacy has a `StockChecker` that knows how many strips of each medicine are left. Build a `PharmacyCounter` that receives the checker through its constructor and prints whether "Paracetamol" is available. The checker keeps 12 strips of Paracetamol.

> **Hint:** Put `@Component` on the checker and `@Service` on the counter. The counter needs a constructor with one `StockChecker` parameter. A `CommandLineRunner` can call it.

**Answer:** The counter never creates the checker. Spring builds the checker first and injects it.

**File:** `PharmacyApplication.java` in package `com.medicare.counter`

```java
package com.medicare.counter;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PharmacyApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(PharmacyApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `StockChecker.java` in package `com.medicare.counter`

```java
package com.medicare.counter;

import java.util.Map;

import org.springframework.stereotype.Component;

@Component
public class StockChecker {

    private final Map<String, Integer> strips = Map.of("Paracetamol", 12, "Cough Syrup", 0);

    public int stripsLeft(String medicine) {
        return strips.getOrDefault(medicine, 0);
    }
}
```

**File:** `PharmacyCounter.java` in package `com.medicare.counter`

```java
package com.medicare.counter;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

@Service
public class PharmacyCounter implements CommandLineRunner {

    private final StockChecker checker;

    public PharmacyCounter(StockChecker checker) {
        this.checker = checker;
    }

    @Override
    public void run(String... args) {
        int left = checker.stripsLeft("Paracetamol");
        System.out.println("Paracetamol: " + left + " strips left");
    }
}
```

Running the jar prints:

```text
Paracetamol: 12 strips left
```

### Medium: Bakery Billing with a Fake Discount

SweetCrumb Bakery bills customers with a `BillingService`. It needs two dependencies: a `PriceList` (a croissant costs Rs 40) and a `DiscountPolicy` interface. The real policy, `FestivalDiscount`, gives 10 percent off. Print the real bill for 3 croissants. Then build the same service by hand with a "no discount" policy and print that bill too, to show how injection helps testing.

> **Hint:** `DiscountPolicy` has one method, so a lambda can act as the fake. Give `BillingService` a constructor with both dependencies.

**Answer:** Spring injects `PriceList` and `FestivalDiscount` into the service. In the runner we call the same constructor ourselves with a lambda that always returns zero.

**File:** `BakeryApplication.java` in package `com.sweetcrumb.billing`

```java
package com.sweetcrumb.billing;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BakeryApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(BakeryApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `PriceList.java` in package `com.sweetcrumb.billing`

```java
package com.sweetcrumb.billing;

import org.springframework.stereotype.Component;

@Component
public class PriceList {

    public int priceOf(String item) {
        return item.equals("Croissant") ? 40 : 25;
    }
}
```

**File:** `DiscountPolicy.java` in package `com.sweetcrumb.billing`

```java
package com.sweetcrumb.billing;

public interface DiscountPolicy {

    int discountOn(int amount);
}
```

**File:** `FestivalDiscount.java` in package `com.sweetcrumb.billing`

```java
package com.sweetcrumb.billing;

import org.springframework.stereotype.Component;

@Component
public class FestivalDiscount implements DiscountPolicy {

    @Override
    public int discountOn(int amount) {
        return amount * 10 / 100;
    }
}
```

**File:** `BillingService.java` in package `com.sweetcrumb.billing`

```java
package com.sweetcrumb.billing;

import org.springframework.stereotype.Service;

@Service
public class BillingService {

    private final PriceList prices;
    private final DiscountPolicy discount;

    public BillingService(PriceList prices, DiscountPolicy discount) {
        this.prices = prices;
        this.discount = discount;
    }

    public String bill(String item, int quantity) {
        int total = prices.priceOf(item) * quantity;
        int off = discount.discountOn(total);
        return "Bill: " + total + " - " + off + " = " + (total - off);
    }
}
```

**File:** `BillingRunner.java` in package `com.sweetcrumb.billing`

```java
package com.sweetcrumb.billing;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class BillingRunner implements CommandLineRunner {

    private final BillingService service;

    public BillingRunner(BillingService service) {
        this.service = service;
    }

    @Override
    public void run(String... args) {
        System.out.println(service.bill("Croissant", 3));

        DiscountPolicy none = amount -> 0;
        BillingService plain = new BillingService(new PriceList(), none);
        System.out.println(plain.bill("Croissant", 3));
    }
}
```

Running the jar prints:

```text
Bill: 120 - 12 = 108
Bill: 120 - 0 = 120
```
