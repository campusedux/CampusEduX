You send 100 rupees to a friend from your wallet app. The app takes 100 rupees from your balance. Then the server crashes before it adds the money to your friend. You have lost 100 rupees and nobody has it. This is the nightmare that transactions were invented to prevent.

Let's learn how the `@Transactional` annotation works in Spring Boot, what "all or nothing" really means, and which small details make a rollback happen or not.

## What is @Transactional?

Think of a cashier who is counting cash to hand over to a customer. Either the whole pile is handed over and the register is updated, or nothing changes at all. Nobody accepts a half-finished payment.

> **Definition:** A transaction is a group of database operations that either all succeed together (commit) or all undo together (rollback). `@Transactional` is the Spring annotation that wraps a method in one transaction.

When a method marked `@Transactional` finishes normally, Spring commits the work. When it throws an exception of the right kind, Spring rolls the work back, and the database looks as if the method never ran.

## Why is it used?

Real business actions almost always change more than one row:

- A money transfer changes two wallets.
- An order in a cinema app reserves seats, creates a booking and reduces the stock of snacks.
- A hospital admission creates a patient record, a bed allocation and a bill.

If any step fails, you never want to keep the earlier steps. Databases guarantee this with the ACID rules: **A**tomic (all or nothing), **C**onsistent (rules stay true), **I**solated (parallel users do not disturb each other) and **D**urable (committed data survives a crash). `@Transactional` gives you these guarantees without writing `begin`, `commit` and `rollback` by hand.

## How it works

Here is the journey of one transfer with `@Transactional`.

```text
transfer(Asha -> Ravi, 100)
    |
    v
BEGIN transaction
    |
    v
debit Asha  (1000 -> 900)
    |
    v
error? -- yes --> ROLLBACK
    |             (900 -> 1000)
    no
    |
    v
credit Ravi (500 -> 600)
    |
    v
COMMIT
```

Everything between BEGIN and COMMIT is one unit. If an error appears in the middle, the database undoes the debit, and Asha's balance goes back to 1000.

Now let's see who does the wrapping. Spring does not change your class. It creates a proxy, a thin object that stands in front of your service bean.

```text
Caller
   |
   v
Spring proxy: BEGIN
   |
   v
Your method runs
   |
   +--> returns normally: COMMIT
   |
   +--> RuntimeException: ROLLBACK
```

Your controller calls the proxy, the proxy starts the transaction, and only then does your real method run. When your method ends, the proxy decides between commit and rollback. Because the proxy is involved, one rule follows: the call must come through the Spring bean from outside. If a method in the same class calls its own `@Transactional` method, the call skips the proxy and no transaction starts. This is called self-invocation.

### Which exceptions roll back?

By default, Spring rolls back on unchecked exceptions (`RuntimeException` and `Error`). It commits on checked exceptions such as `IOException`. That surprises many people, so you will see it in the output below. To roll back on a checked exception, write `rollbackFor`.

| Situation | Default result |
|---|---|
| Method returns normally | Commit |
| `RuntimeException` thrown | Rollback |
| Checked exception, e.g. `IOException` | Commit |
| Checked exception with `rollbackFor` | Rollback |

## Real-Life Example

Think of booking a train ticket at a counter. The clerk fills the form, takes your money, prints the ticket and marks the seat as taken. If the printer jams after the money is taken, a good clerk cancels the whole thing and gives your money back. He does not keep the money and say the seat is still free. `@Transactional` is that good clerk: if any step fails, every earlier step is cancelled.

## Code Example

Let's build PayNow, a small wallet app. Two wallets start with Asha at 1000 and Ravi at 500. We try a transfer that fails in the middle, and we run it four ways: with no transaction, with `@Transactional`, with a checked exception, and with `rollbackFor`.

```text
paynow/
├─ pom.xml
└─ src/main/
   ├─ java/com/paynow/wallet/
   │  ├─ WalletApplication.java
   │  ├─ Wallet.java
   │  ├─ WalletRepository.java
   │  └─ TransferService.java
   └─ resources/
      └─ application.properties
```

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

    <groupId>com.paynow</groupId>
    <artifactId>wallet</artifactId>
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

**File:** `application.properties` in `src/main/resources`

```properties
spring.main.banner-mode=off
logging.level.root=warn
```

**File:** `Wallet.java` in package `com.paynow.wallet`

```java
package com.paynow.wallet;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String owner;
    private long balance;

    protected Wallet() {
    }

    public Wallet(String owner, long balance) {
        this.owner = owner;
        this.balance = balance;
    }

    public String getOwner() {
        return owner;
    }

    public long getBalance() {
        return balance;
    }

    public void setBalance(long balance) {
        this.balance = balance;
    }
}
```

**File:** `WalletRepository.java` in package `com.paynow.wallet`

```java
package com.paynow.wallet;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletRepository extends JpaRepository<Wallet, Long> {

    Optional<Wallet> findByOwner(String owner);
}
```

**File:** `TransferService.java` in package `com.paynow.wallet`

```java
package com.paynow.wallet;

import java.io.IOException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransferService {

    private final WalletRepository wallets;

    public TransferService(WalletRepository wallets) {
        this.wallets = wallets;
    }

    public void reset() {
        wallets.deleteAll();
        wallets.save(new Wallet("Asha", 1000));
        wallets.save(new Wallet("Ravi", 500));
    }

    public String balances() {
        return "Asha " + balanceOf("Asha") + ", Ravi " + balanceOf("Ravi");
    }

    public void noTransaction(long amount) {
        change("Asha", -amount);
        throw new IllegalStateException("Bank server down");
    }

    @Transactional
    public void safe(long amount) {
        change("Asha", -amount);
        throw new IllegalStateException("Bank server down");
    }

    @Transactional
    public void checkedDefault(long amount) throws IOException {
        change("Asha", -amount);
        throw new IOException("Bank server down");
    }

    @Transactional(rollbackFor = IOException.class)
    public void checkedRollback(long amount) throws IOException {
        change("Asha", -amount);
        throw new IOException("Bank server down");
    }

    private void change(String owner, long delta) {
        Wallet wallet = wallets.findByOwner(owner).orElseThrow();
        wallet.setBalance(wallet.getBalance() + delta);
        wallets.save(wallet);
    }

    private long balanceOf(String owner) {
        return wallets.findByOwner(owner).orElseThrow().getBalance();
    }
}
```

**File:** `WalletApplication.java` in package `com.paynow.wallet`

```java
package com.paynow.wallet;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class WalletApplication {

    public static void main(String[] args) {
        SpringApplication.run(WalletApplication.class, args);
    }

    interface Attempt {
        void run() throws Exception;
    }

    @Bean
    CommandLineRunner demo(TransferService service) {
        return args -> {
            run(service, "1. No @Transactional", () -> service.noTransaction(100));
            run(service, "2. @Transactional", () -> service.safe(100));
            run(service, "3. Checked exception", () -> service.checkedDefault(100));
            run(service, "4. With rollbackFor", () -> service.checkedRollback(100));
        };
    }

    private static void run(TransferService service, String title, Attempt attempt) {
        service.reset();
        System.out.println(title);
        System.out.println("  before: " + service.balances());
        try {
            attempt.run();
        } catch (Exception e) {
            System.out.println("  failed: " + e.getMessage());
        }
        System.out.println("  after:  " + service.balances());
    }
}
```

Run it:

```bash
mvn spring-boot:run
```

**Output:**

```text
1. No @Transactional
  before: Asha 1000, Ravi 500
  failed: Bank server down
  after:  Asha 900, Ravi 500
2. @Transactional
  before: Asha 1000, Ravi 500
  failed: Bank server down
  after:  Asha 1000, Ravi 500
3. Checked exception
  before: Asha 1000, Ravi 500
  failed: Bank server down
  after:  Asha 900, Ravi 500
4. With rollbackFor
  before: Asha 1000, Ravi 500
  failed: Bank server down
  after:  Asha 1000, Ravi 500
```

In the first run, Asha lost 100 rupees and Ravi never received them. That is the exact nightmare from the start. With `@Transactional` the debit was undone. The checked exception committed the half-finished transfer, and only `rollbackFor` fixed it.

## Code Explained

- `noTransaction()` has no annotation. Each repository call is its own tiny transaction, so the debit is saved for good before the exception is thrown.
- `safe()` runs both steps inside one transaction. The `IllegalStateException` is unchecked, so Spring rolls everything back.
- `checkedDefault()` throws `IOException`, which is checked. Spring commits, so the debit stays.
- `checkedRollback()` adds `rollbackFor = IOException.class`, so Spring rolls back even for this checked exception.
- `reset()` and `balances()` have no annotation on purpose. They are simple reads and writes, and each repository call handles itself.
- The `Attempt` interface only lets the demo pass code that may throw a checked exception.

> **Tip:** Put `@Transactional` on service methods, not on repositories or controllers. The service layer is where one business action is defined.

## Common Mistakes

> **Warning:** A `@Transactional` method that calls another method of the same class does not get a new transaction for the inner call. Spring's proxy is skipped. Move the inner method to another bean if it needs its own settings.

- **Expecting rollback on checked exceptions.** Add `rollbackFor = Exception.class` when your methods throw checked exceptions.
- **Catching the exception inside the method.** If you catch and swallow the error, Spring sees a normal return and commits. Rethrow, or mark the transaction rollback-only.
- **Using it on private methods.** The proxy cannot intercept them, so the annotation does nothing. Use public methods.
- **Long transactions.** A transaction that calls a slow web service keeps database locks open. Do the slow call outside the transaction.
- **Using `readOnly = true` for writes.** It is a hint for reads, and writes may be ignored or rejected depending on the setup.

## Interview Questions

**What does @Transactional do?**
It wraps a method in a database transaction. Spring commits when the method returns normally and rolls back when it throws a runtime exception.

**Which exceptions cause a rollback by default?**
Unchecked exceptions, meaning `RuntimeException` and `Error`. Checked exceptions commit unless you set `rollbackFor`.

**Why does self-invocation ignore @Transactional?**
Spring applies the annotation through a proxy. A call from inside the same class never passes through the proxy, so no transaction logic runs.

**What are the ACID properties?**
Atomicity, Consistency, Isolation and Durability. They describe what a reliable database transaction guarantees.

## Key Points to Remember

- A transaction makes several database steps succeed or fail together.
- `@Transactional` on a public service method wraps it in one transaction.
- Runtime exceptions roll back. Checked exceptions commit unless `rollbackFor` says otherwise.
- The proxy makes the annotation work, so self-invocation and private methods are not covered.
- Keep transactions short and put them on the service layer.

## Frequently Asked Questions

### Where should I put @Transactional?

On the public methods of your service classes. A controller should only receive the request and call a service, and a repository already runs each of its methods in a transaction.

### What does readOnly = true do in @Transactional?

It tells Spring and Hibernate that the method only reads data. Hibernate can skip some work, such as dirty checking, and the database may optimise the query. Use it for read methods.

### Do I need @Transactional for a simple save()?

No. The repository's `save()` is already transactional. You need it when several operations must succeed together.

### What is transaction propagation?

It decides what happens when a transactional method calls another one. The default, `REQUIRED`, joins the existing transaction. `REQUIRES_NEW` suspends it and starts a fresh one.

## Related Topics

- [Lazy vs Eager Loading](/learning/spring-boot-tutorial/lazy-vs-eager-loading): why lazy fields need an open session.
- [JpaRepository](/learning/spring-boot-tutorial/jparepository): the repository methods that run inside transactions.
- [Exception Handling in Spring Boot](/learning/spring-boot-tutorial/exception-handling-in-spring-boot): handle the errors that trigger a rollback.
- [Soft Delete](/learning/spring-boot-tutorial/soft-delete): keep rows safe while changing data.
