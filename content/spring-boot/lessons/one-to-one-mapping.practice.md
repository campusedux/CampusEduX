Try each problem on your own first. Each project has its own `pom.xml`, shown below.

### Easy: Patient and Medical Record

City Care Hospital keeps one medical record for each patient. Build two entities: `MedicalRecord` (a blood group and an allergy note) and `Patient` (a name) with a one-way `@OneToOne` link from the patient to the record. Save a patient together with the record in one `save` call, load the patient again, and print the name and the blood group.

Use this data: Ravi Kumar, blood group B+, allergy note "Penicillin".

> **Hint:** Put `@OneToOne(cascade = CascadeType.ALL)` and `@JoinColumn(name = "record_id")` on the `Patient` field. Cascade saves the record first, so you need only one repository for the patient.

**Answer:** The patient owns the link. Because of cascade, saving the patient inserts the record first and then the patient row with the foreign key `record_id`.

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
    <artifactId>records</artifactId>
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

**File:** `RecordsApplication.java` in package `com.citycare.records`

```java
package com.citycare.records;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RecordsApplication {

    public static void main(String[] args) {
        SpringApplication.run(RecordsApplication.class, args);
    }
}
```

**File:** `MedicalRecord.java` in package `com.citycare.records`

```java
package com.citycare.records;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String bloodGroup;
    private String allergyNote;

    protected MedicalRecord() {
    }

    public MedicalRecord(String bloodGroup, String allergyNote) {
        this.bloodGroup = bloodGroup;
        this.allergyNote = allergyNote;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }
}
```

**File:** `Patient.java` in package `com.citycare.records`

```java
package com.citycare.records;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "record_id")
    private MedicalRecord record;

    protected Patient() {
    }

    public Patient(String name, MedicalRecord record) {
        this.name = name;
        this.record = record;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public MedicalRecord getRecord() {
        return record;
    }
}
```

**File:** `PatientRepository.java` in package `com.citycare.records`

```java
package com.citycare.records;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
}
```

**File:** `RecordRunner.java` in package `com.citycare.records`

```java
package com.citycare.records;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class RecordRunner implements CommandLineRunner {

    private final PatientRepository repository;

    public RecordRunner(PatientRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        Patient saved = repository.save(new Patient("Ravi Kumar",
                new MedicalRecord("B+", "Penicillin")));

        Patient loaded = repository.findById(saved.getId()).orElseThrow();
        System.out.println(loaded.getName() + ": blood group "
                + loaded.getRecord().getBloodGroup());
    }
}
```

The output is:

```text
Ravi Kumar: blood group B+
```

### Medium: Loyalty Card that Shares the Customer's Id

A shop gives each customer one loyalty card. To save a column, the card does not get its own generated id. It uses the customer's id as its primary key. Build `Customer` (a name) and `LoyaltyCard` (points), link the card to the customer with `@OneToOne` and `@MapsId`, save the customer first and then the card, and print the card's id, whether it equals the customer's id, and the points.

Use this data: customer Meera Shah, card with 120 points.

> **Hint:** In `LoyaltyCard`, declare `@Id private Long id;` with no `@GeneratedValue`. Then add `@OneToOne @MapsId @JoinColumn(name = "id") private Customer customer;`. `@MapsId` copies the customer's id into the card's id.

**Answer:** With `@MapsId`, the primary key of the card is also the foreign key to the customer. The customer must be saved first, so its id exists.

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

    <groupId>com.shopwise</groupId>
    <artifactId>loyalty</artifactId>
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

**File:** `LoyaltyApplication.java` in package `com.shopwise.loyalty`

```java
package com.shopwise.loyalty;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LoyaltyApplication {

    public static void main(String[] args) {
        SpringApplication.run(LoyaltyApplication.class, args);
    }
}
```

**File:** `Customer.java` in package `com.shopwise.loyalty`

```java
package com.shopwise.loyalty;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    protected Customer() {
    }

    public Customer(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }
}
```

**File:** `LoyaltyCard.java` in package `com.shopwise.loyalty`

```java
package com.shopwise.loyalty;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;

@Entity
public class LoyaltyCard {

    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private Customer customer;

    private int points;

    protected LoyaltyCard() {
    }

    public LoyaltyCard(Customer customer, int points) {
        this.customer = customer;
        this.points = points;
    }

    public Long getId() {
        return id;
    }

    public int getPoints() {
        return points;
    }
}
```

**File:** `Repositories.java` in package `com.shopwise.loyalty`

```java
package com.shopwise.loyalty;

import org.springframework.data.jpa.repository.JpaRepository;

interface CustomerRepository extends JpaRepository<Customer, Long> {
}

interface LoyaltyCardRepository extends JpaRepository<LoyaltyCard, Long> {
}
```

**File:** `LoyaltyRunner.java` in package `com.shopwise.loyalty`

```java
package com.shopwise.loyalty;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class LoyaltyRunner implements CommandLineRunner {

    private final CustomerRepository customers;
    private final LoyaltyCardRepository cards;

    public LoyaltyRunner(CustomerRepository customers, LoyaltyCardRepository cards) {
        this.customers = customers;
        this.cards = cards;
    }

    @Override
    public void run(String... args) {
        Customer meera = customers.save(new Customer("Meera Shah"));
        LoyaltyCard card = cards.save(new LoyaltyCard(meera, 120));

        System.out.println("Card id: " + card.getId());
        System.out.println("Same as customer id: " + card.getId().equals(meera.getId()));
        System.out.println("Points: " + cards.findById(card.getId()).orElseThrow().getPoints());
    }
}
```

The output is:

```text
Card id: 1
Same as customer id: true
Points: 120
```
