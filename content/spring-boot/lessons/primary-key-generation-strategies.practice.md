Try each problem on your own first. Each project has its own `pom.xml`, shown below.

### Easy: Library Cards Starting at 1000

PageTurn Library wants its membership card numbers to start at 1000 and go up by one. Build an entity `LibraryCard` (a member name) whose id comes from a database sequence named `card_seq`. Save three members and print each card number.

Use these members: Meera, Arjun, Kabir.

> **Hint:** Use `@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "card_seq")` together with `@SequenceGenerator` that sets `initialValue = 1000` and `allocationSize = 1`.

**Answer:** The `initialValue` sets the first number, and `allocationSize = 1` makes Hibernate ask the sequence for one id at a time, so the numbers stay in order with no gaps.

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
    <artifactId>cards</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
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

**File:** `CardsApplication.java` in package `com.pageturn.cards`

```java
package com.pageturn.cards;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CardsApplication {

    public static void main(String[] args) {
        SpringApplication.run(CardsApplication.class, args);
    }
}
```

**File:** `LibraryCard.java` in package `com.pageturn.cards`

```java
package com.pageturn.cards;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;

@Entity
public class LibraryCard {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "card_seq")
    @SequenceGenerator(name = "card_seq", sequenceName = "card_seq",
            initialValue = 1000, allocationSize = 1)
    private Long id;

    private String memberName;

    protected LibraryCard() {
    }

    public LibraryCard(String memberName) {
        this.memberName = memberName;
    }

    public Long getId() {
        return id;
    }

    public String getMemberName() {
        return memberName;
    }
}
```

**File:** `LibraryCardRepository.java` in package `com.pageturn.cards`

```java
package com.pageturn.cards;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LibraryCardRepository extends JpaRepository<LibraryCard, Long> {
}
```

**File:** `CardRunner.java` in package `com.pageturn.cards`

```java
package com.pageturn.cards;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class CardRunner implements CommandLineRunner {

    private final LibraryCardRepository repository;

    public CardRunner(LibraryCardRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        for (String name : List.of("Meera", "Arjun", "Kabir")) {
            LibraryCard card = repository.save(new LibraryCard(name));
            System.out.println("Card " + card.getId() + " for " + card.getMemberName());
        }
    }
}
```

The output is:

```text
Card 1000 for Meera
Card 1001 for Arjun
Card 1002 for Kabir
```

### Medium: Railway Station Codes as Assigned Ids

A railway app uses the station code (such as `PUNE`) as the primary key, so the code is an assigned id. Save two stations. Then save a station with the code `PUNE` again but with a new name, and show what happens to the row count and the name. Finally, guard against the problem with `existsById` and print a message.

> **Hint:** With an assigned id, Spring Data cannot tell a new object from an old one by looking at a null id. It checks the database, and if the row exists, `save()` updates it instead of failing.

**Answer:** `save()` did not fail. It silently replaced the name, so there are still two stations. To reject duplicates you must check yourself with `existsById` before saving.

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

    <groupId>com.railapp</groupId>
    <artifactId>stations</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
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

**File:** `StationsApplication.java` in package `com.railapp.stations`

```java
package com.railapp.stations;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StationsApplication {

    public static void main(String[] args) {
        SpringApplication.run(StationsApplication.class, args);
    }
}
```

**File:** `Station.java` in package `com.railapp.stations`

```java
package com.railapp.stations;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Station {

    @Id
    private String code;

    private String name;

    protected Station() {
    }

    public Station(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
```

**File:** `StationRepository.java` in package `com.railapp.stations`

```java
package com.railapp.stations;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StationRepository extends JpaRepository<Station, String> {
}
```

**File:** `StationRunner.java` in package `com.railapp.stations`

```java
package com.railapp.stations;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class StationRunner implements CommandLineRunner {

    private final StationRepository repository;

    public StationRunner(StationRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        repository.save(new Station("PUNE", "Pune Junction"));
        repository.save(new Station("MUMBAI", "Mumbai Central"));
        repository.save(new Station("PUNE", "Pune Jn (renamed)"));

        System.out.println("Stations: " + repository.count());
        System.out.println("PUNE -> " + repository.findById("PUNE").orElseThrow().getName());

        if (repository.existsById("PUNE")) {
            System.out.println("PUNE already exists");
        }
    }
}
```

The output is:

```text
Stations: 2
PUNE -> Pune Jn (renamed)
PUNE already exists
```
