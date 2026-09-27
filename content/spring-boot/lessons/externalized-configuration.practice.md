Try each problem on your own first. Both use the same `pom.xml` as the Riverside Cinema code above; only change the `groupId` and `artifactId`.

### Easy: Bakery Discount from the Command Line

SweetCrumbs bakery gives a 5 percent discount by default. Put `bakery.discount-percent=5` in `application.properties` and build `GET /price` that shows the price of a 400 rupee cake after the discount. Then start the jar with a command line argument that raises the discount to 15 and show the new answer.

> **Hint:** Read the number with `@Value`. The price after discount is `400 - 400 * discount / 100`. Command line arguments look like `--bakery.discount-percent=15`.

**Answer:** The file supplies the default of 5. The argument on the command line is stronger, so it replaces the value without a rebuild.

**File:** `application.properties` in `src/main/resources`

```properties
bakery.discount-percent=5
```

**File:** `PriceApplication.java` in package `com.sweetcrumbs.price`

```java
package com.sweetcrumbs.price;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PriceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PriceApplication.class, args);
    }
}
```

**File:** `PriceController.java` in package `com.sweetcrumbs.price`

```java
package com.sweetcrumbs.price;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PriceController {

    private final int discountPercent;

    public PriceController(@Value("${bakery.discount-percent}") int discountPercent) {
        this.discountPercent = discountPercent;
    }

    @GetMapping("/price")
    public String price() {
        int price = 400 - 400 * discountPercent / 100;
        return "Cake: Rs " + price + " (" + discountPercent + "% off)";
    }
}
```

Started normally, `curl http://localhost:8080/price` prints:

```text
Cake: Rs 380 (5% off)
```

Now start the jar with the argument:

```bash
java -jar target/price-0.0.1-SNAPSHOT.jar --bakery.discount-percent=15
```

The same call prints:

```text
Cake: Rs 340 (15% off)
```

### Medium: Clinic Fees from Three Sources

City Care Clinic keeps its defaults in the jar: `clinic.name=City Care Clinic` and `clinic.fee=300`. On the production server the fee must be 350, set with an environment variable, and one special run must change the clinic name with a command line argument. Build `GET /fees` that prints the name and the fee, and show the answer for the defaults, for the environment variable, and for the environment variable plus the argument.

> **Hint:** The environment variable for `clinic.fee` is `CLINIC_FEE`. The argument for the name is `--clinic.name=...`. Use `@Value` on constructor parameters.

**Answer:** Each run changes one source, and only the changed key is replaced. The other key keeps the value from the weaker source.

**File:** `application.properties` in `src/main/resources`

```properties
clinic.name=City Care Clinic
clinic.fee=300
```

**File:** `FeesApplication.java` in package `com.citycare.fees`

```java
package com.citycare.fees;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FeesApplication {

    public static void main(String[] args) {
        SpringApplication.run(FeesApplication.class, args);
    }
}
```

**File:** `FeesController.java` in package `com.citycare.fees`

```java
package com.citycare.fees;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FeesController {

    private final String line;

    public FeesController(@Value("${clinic.name}") String name,
                          @Value("${clinic.fee}") int fee) {
        this.line = name + ": Rs " + fee;
    }

    @GetMapping("/fees")
    public String fees() {
        return line;
    }
}
```

Run the jar three ways and call `curl http://localhost:8080/fees` each time.

```bash
java -jar target/fees-0.0.1-SNAPSHOT.jar
CLINIC_FEE=350 java -jar target/fees-0.0.1-SNAPSHOT.jar
CLINIC_FEE=350 java -jar target/fees-0.0.1-SNAPSHOT.jar --clinic.name=Night-OPD
```

The three answers, in order:

```text
City Care Clinic: Rs 300
City Care Clinic: Rs 350
Night-OPD: Rs 350
```
