Try each problem on your own first. Both use only the web starter.

### Easy: CinePoint Invalid Coupon

CinePoint has two coupons, `FIRST50` (50 percent off) and `WEEKEND20` (20 percent off). `GET /coupons/{code}` returns `50% off applied` for a known code. For an unknown code, throw your own `InvalidCouponException` that stores the code. An advice class must reply with status 400 and a JSON body holding `coupon` and `message`.

> **Hint:** Extend `RuntimeException`, keep the code in a field with a getter, and read it in the `@ExceptionHandler` method.

**Answer:** The exception carries the coupon code as data, so the advice class can put it in the reply without parsing the message.

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

    <groupId>com.cinepoint</groupId>
    <artifactId>coupons</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
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

**File:** `CouponsApplication.java` in package `com.cinepoint.coupons`

```java
package com.cinepoint.coupons;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CouponsApplication {

    public static void main(String[] args) {
        SpringApplication.run(CouponsApplication.class, args);
    }
}
```

**File:** `InvalidCouponException.java` in package `com.cinepoint.coupons`

```java
package com.cinepoint.coupons;

public class InvalidCouponException extends RuntimeException {

    private final String code;

    public InvalidCouponException(String code) {
        super("Coupon " + code + " is not valid");
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
```

**File:** `CouponAdvice.java` in package `com.cinepoint.coupons`

```java
package com.cinepoint.coupons;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class CouponAdvice {

    @ExceptionHandler(InvalidCouponException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> invalid(InvalidCouponException ex) {
        return Map.of("coupon", ex.getCode(), "message", ex.getMessage());
    }
}
```

**File:** `CouponController.java` in package `com.cinepoint.coupons`

```java
package com.cinepoint.coupons;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CouponController {

    private final Map<String, Integer> discounts = Map.of("FIRST50", 50, "WEEKEND20", 20);

    @GetMapping("/coupons/{code}")
    public String apply(@PathVariable String code) {
        Integer percent = discounts.get(code);
        if (percent == null) {
            throw new InvalidCouponException(code);
        }
        return percent + "% off applied";
    }
}
```

Asking for `FIRST50` and `FREE100` printed:

```bash
50% off applied [200]
{"coupon":"FREE100","message":"Coupon FREE100 is not valid"} [400]
```

### Medium: QuickPay Insufficient Funds

QuickPay lets a customer send money with a POST to `/transfers`, giving the query values `from` and `amount`. Account `ACC-1` has Rs 5000 and `ACC-2` has Rs 300. Design a base class `BankException` with a status and a code. Add `AccountNotFoundException` (status 404) and `NotEnoughFundsException` (status 422), and let the second one remember how many rupees were short. One advice method must handle both, and add `shortByInRupees` to the body only for insufficient funds.

> **Hint:** Use `instanceof` with a pattern variable inside the handler to read the extra field from the subclass.

**Answer:** The base class stores the status and code, so the advice needs only one handler method. The subclass adds its own field, and the handler adds it to the body when it sees that type.

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

    <groupId>com.quickpay</groupId>
    <artifactId>bank</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>
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

**File:** `BankApplication.java` in package `com.quickpay.bank`

```java
package com.quickpay.bank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BankApplication {

    public static void main(String[] args) {
        SpringApplication.run(BankApplication.class, args);
    }
}
```

**File:** `BankException.java` in package `com.quickpay.bank`

```java
package com.quickpay.bank;

import org.springframework.http.HttpStatus;

public abstract class BankException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    protected BankException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
```

**File:** `NotEnoughFundsException.java` in package `com.quickpay.bank`

```java
package com.quickpay.bank;

import org.springframework.http.HttpStatus;

public class NotEnoughFundsException extends BankException {

    private final int shortByInRupees;

    public NotEnoughFundsException(int balance, int requested) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, "INSUFFICIENT_FUNDS",
                "Balance is Rs " + balance + " but Rs " + requested + " was requested");
        this.shortByInRupees = requested - balance;
    }

    public int getShortByInRupees() {
        return shortByInRupees;
    }
}
```

**File:** `AccountNotFoundException.java` in package `com.quickpay.bank`

```java
package com.quickpay.bank;

import org.springframework.http.HttpStatus;

public class AccountNotFoundException extends BankException {

    public AccountNotFoundException(String account) {
        super(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND", "Account " + account + " does not exist");
    }
}
```

**File:** `BankAdvice.java` in package `com.quickpay.bank`

```java
package com.quickpay.bank;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class BankAdvice {

    @ExceptionHandler(BankException.class)
    public ResponseEntity<Map<String, Object>> handle(BankException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", ex.getCode());
        body.put("message", ex.getMessage());
        if (ex instanceof NotEnoughFundsException funds) {
            body.put("shortByInRupees", funds.getShortByInRupees());
        }
        return ResponseEntity.status(ex.getStatus()).body(body);
    }
}
```

**File:** `TransferController.java` in package `com.quickpay.bank`

```java
package com.quickpay.bank;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TransferController {

    private final Map<String, Integer> balances = Map.of("ACC-1", 5000, "ACC-2", 300);

    @PostMapping("/transfers")
    public String transfer(@RequestParam String from, @RequestParam int amount) {
        Integer balance = balances.get(from);
        if (balance == null) {
            throw new AccountNotFoundException(from);
        }
        if (balance < amount) {
            throw new NotEnoughFundsException(balance, amount);
        }
        return "Transferred Rs " + amount + " from " + from;
    }
}
```

Sending Rs 1000 from `ACC-2`, then a transfer from the unknown `ACC-9`, then Rs 100 from `ACC-1`, printed:

```bash
{"code":"INSUFFICIENT_FUNDS","message":"Balance is Rs 300 but Rs 1000 was requested","shortByInRupees":700} [422]
{"code":"ACCOUNT_NOT_FOUND","message":"Account ACC-9 does not exist"} [404]
Transferred Rs 100 from ACC-1 [200]
```
