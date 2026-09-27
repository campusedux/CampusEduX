Try each problem on your own first. Both projects are plain Java with the test starter, so each brings its own `pom.xml`.

### Easy: Clinic Reminder with a Mock

City Care Clinic sends a reminder when a patient books a slot. Write `BookingService` with `String book(String patient, String phone)`. It asks a `SlotRepository` mock `boolean isFree()`; when a slot is free it calls `Notifier.notify(phone, text)` and returns `BOOKED`, otherwise it returns `FULL` and sends nothing. Test both cases with Mockito.

> **Hint:** Use `@ExtendWith` with `MockitoExtension`, two `@Mock` fields and `@InjectMocks`. In the second test use `verify(notifier, never())`.

**Answer:** The service asks the repository, and only notifies when the slot is free. The tests stub `isFree` and verify the notifier.

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

    <groupId>com.citycare</groupId>
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
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

**File:** `SlotRepository.java` in package `com.citycare`

```java
package com.citycare;

public interface SlotRepository {

    boolean isFree();
}
```

**File:** `Notifier.java` in package `com.citycare`

```java
package com.citycare;

public interface Notifier {

    void notify(String phone, String text);
}
```

**File:** `BookingService.java` in package `com.citycare`

```java
package com.citycare;

public class BookingService {

    private final SlotRepository slots;
    private final Notifier notifier;

    public BookingService(SlotRepository slots, Notifier notifier) {
        this.slots = slots;
        this.notifier = notifier;
    }

    public String book(String patient, String phone) {
        if (!slots.isFree()) {
            return "FULL";
        }
        notifier.notify(phone, "Slot booked for " + patient);
        return "BOOKED";
    }
}
```

**File:** `BookingServiceTest.java` in `src/test/java/com/citycare`

```java
package com.citycare;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private SlotRepository slots;

    @Mock
    private Notifier notifier;

    @InjectMocks
    private BookingService service;

    @Test
    void booksWhenSlotIsFree() {
        when(slots.isFree()).thenReturn(true);

        assertEquals("BOOKED", service.book("Meera", "98220"));
        verify(notifier).notify("98220", "Slot booked for Meera");
    }

    @Test
    void fullWhenNoSlot() {
        when(slots.isFree()).thenReturn(false);

        assertEquals("FULL", service.book("Meera", "98220"));
        verify(notifier, never()).notify(anyString(), anyString());
    }
}
```

Run `./mvnw test`. Maven reports (the counts are split over lines here):

```text
Tests run: 2
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```

### Medium: Library Fine Reminder with Captor and Exception

Lakeview Library sends a reminder for late books. Write `FineService` with `int chargeFine(String member, int daysLate)`. It computes 2 rupees per day, saves it through `FineStore.save(member, amount)`, and returns the amount. If the store throws `IllegalStateException`, the service lets it pass. Test with an `ArgumentCaptor` for the saved amount, and test the exception with `thenThrow`.

> **Hint:** Use `ArgumentCaptor<Integer>` on `verify(store).save(eq("Asha"), captor.capture())`. Use `doThrow` or `when(...).thenThrow` for the failing store; because `save` returns nothing, start with `doThrow` and put the mock in `when`.

**Answer:** The captor reads the amount the service passed to the store. A void method is stubbed with `doThrow`.

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

    <groupId>com.lakeview</groupId>
    <artifactId>fines</artifactId>
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

**File:** `FineStore.java` in package `com.lakeview`

```java
package com.lakeview;

public interface FineStore {

    void save(String member, int amount);
}
```

**File:** `FineService.java` in package `com.lakeview`

```java
package com.lakeview;

public class FineService {

    private final FineStore store;

    public FineService(FineStore store) {
        this.store = store;
    }

    public int chargeFine(String member, int daysLate) {
        int amount = daysLate * 2;
        store.save(member, amount);
        return amount;
    }
}
```

**File:** `FineServiceTest.java` in `src/test/java/com/lakeview`

```java
package com.lakeview;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FineServiceTest {

    @Mock
    private FineStore store;

    @InjectMocks
    private FineService service;

    @Test
    void savesTwoRupeesPerDay() {
        ArgumentCaptor<Integer> amount = ArgumentCaptor.forClass(Integer.class);

        int result = service.chargeFine("Asha", 6);

        verify(store).save(eq("Asha"), amount.capture());
        assertEquals(12, amount.getValue());
        assertEquals(12, result);
    }

    @Test
    void storeErrorReachesTheCaller() {
        doThrow(new IllegalStateException("Disk full")).when(store).save(eq("Asha"), anyInt());

        assertThrows(IllegalStateException.class, () -> service.chargeFine("Asha", 6));
    }
}
```

Run `./mvnw test`. Maven reports (the counts are split over lines here):

```text
Tests run: 2
Failures: 0
Errors: 0
Skipped: 0
BUILD SUCCESS
```
