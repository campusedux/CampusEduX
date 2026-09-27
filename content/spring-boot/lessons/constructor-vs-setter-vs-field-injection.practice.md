Try each problem on your own first. Both use the same `pom.xml` as the CineGo example; only change the `groupId` and `artifactId`. The programs switch off the web server so the console shows only your lines.

### Easy: Move the Canteen to Constructor Injection

A college canteen class was written with field injection. Rewrite `Canteen` so that it receives the `MenuBoard` through its constructor, with a `final` field. Then, in the runner, also create a `Canteen` by hand with `new` and print its today's special to show it works without Spring.

> **Hint:** Remove `@Autowired` from the field, add a constructor with a `MenuBoard` parameter and store it in a `final` field. A class with one constructor needs no `@Autowired`.

**Answer:** The constructor version can be built with `new Canteen(new MenuBoard())`, which the field version could not.

**File:** `CanteenApplication.java` in package `com.campuscafe.canteen`

```java
package com.campuscafe.canteen;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CanteenApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(CanteenApplication.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.setBannerMode(Banner.Mode.OFF);
        app.setLogStartupInfo(false);
        app.run(args);
    }
}
```

**File:** `MenuBoard.java` in package `com.campuscafe.canteen`

```java
package com.campuscafe.canteen;

import org.springframework.stereotype.Component;

@Component
public class MenuBoard {

    public String special() {
        return "Veg Thali";
    }
}
```

**File:** `Canteen.java` in package `com.campuscafe.canteen`

```java
package com.campuscafe.canteen;

import org.springframework.stereotype.Component;

@Component
public class Canteen {

    private final MenuBoard board;

    public Canteen(MenuBoard board) {
        this.board = board;
    }

    public String todaysSpecial() {
        return "Special: " + board.special();
    }
}
```

**File:** `CanteenRunner.java` in package `com.campuscafe.canteen`

```java
package com.campuscafe.canteen;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CanteenRunner implements CommandLineRunner {

    private final Canteen canteen;

    public CanteenRunner(Canteen canteen) {
        this.canteen = canteen;
    }

    @Override
    public void run(String... args) {
        System.out.println(canteen.todaysSpecial());
        Canteen byHand = new Canteen(new MenuBoard());
        System.out.println("By hand " + byHand.todaysSpecial());
    }
}
```

Running the jar prints:

```text
Special: Veg Thali
By hand Special: Veg Thali
```

### Medium: An Optional Receipt Printer

CornerMart has a `Shop` that always needs a `PriceList`, so it takes that in the constructor. It may also use a `ReceiptPrinter`, but the printer is optional, so it should arrive through a setter with `required = false`. The `ReceiptPrinter` class is not a bean yet. Print the total for one item, and print either the receipt or `No printer, receipt skipped`.

> **Hint:** Put `@Autowired(required = false)` on a setter for `ReceiptPrinter`. In `sell()`, check whether the field is null. If you later add `@Component` to `ReceiptPrinter`, the same `Shop` prints the receipt line.

**Answer:** Spring calls the setter only when a `ReceiptPrinter` bean exists. Here none does, so the shop skips the receipt and still works.

**File:** `MartApplication.java` in package `com.cornermart.shop`

```java
package com.cornermart.shop;

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

**File:** `PriceList.java` in package `com.cornermart.shop`

```java
package com.cornermart.shop;

import org.springframework.stereotype.Component;

@Component
public class PriceList {

    public int priceOf(String item) {
        return item.equals("Milk") ? 30 : 10;
    }
}
```

**File:** `ReceiptPrinter.java` in package `com.cornermart.shop`

```java
package com.cornermart.shop;

public class ReceiptPrinter {

    public String print(String item, int price) {
        return "Receipt: " + item + " Rs " + price;
    }
}
```

**File:** `Shop.java` in package `com.cornermart.shop`

```java
package com.cornermart.shop;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class Shop {

    private final PriceList prices;
    private ReceiptPrinter printer;

    public Shop(PriceList prices) {
        this.prices = prices;
    }

    @Autowired(required = false)
    public void setPrinter(ReceiptPrinter printer) {
        this.printer = printer;
    }

    public String sell(String item) {
        int price = prices.priceOf(item);
        if (printer == null) {
            return "No printer, receipt skipped";
        }
        return printer.print(item, price);
    }
}
```

**File:** `ShopRunner.java` in package `com.cornermart.shop`

```java
package com.cornermart.shop;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ShopRunner implements CommandLineRunner {

    private final Shop shop;

    public ShopRunner(Shop shop) {
        this.shop = shop;
    }

    @Override
    public void run(String... args) {
        System.out.println(shop.sell("Milk"));
    }
}
```

Running the jar prints:

```text
No printer, receipt skipped
```
