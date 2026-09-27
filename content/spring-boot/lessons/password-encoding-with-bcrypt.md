In 2012 a well-known website was hacked and millions of passwords leaked. Most of them were stored as plain text or with a weak method, so attackers read them instantly and tried them on other sites. People who used the same password everywhere lost several accounts in one night. The fix is simple to say and easy to get wrong: never store a password. Store a special fingerprint of it instead.

Let's see how password encoding with BCrypt works in Spring Boot, why it is slow on purpose, and how to use it correctly in your own code.

## What is password encoding with BCrypt?

Think of a locker room with a keypad. The manager does not write your code on a card in the office. He only remembers a scrambled note that cannot be turned back into the code. When you type your code, he scrambles it the same way and checks whether the notes match. If a thief steals the notes, he still does not have any codes.

> **Definition:** Password encoding means turning a password into a one-way hash before saving it. BCrypt is a hashing algorithm designed for passwords. It adds a random salt to every hash and is deliberately slow, which makes guessing attacks expensive.

Three ideas hide in that definition.

- **One-way.** You can go from password to hash, but never from hash back to password.
- **Salt.** A random value mixed into each hash. Two users with the same password get different hashes.
- **Slow on purpose.** BCrypt has a cost setting. A higher cost makes each hash take longer, so an attacker who tries billions of guesses needs far more time.

In Spring Security, the class for this is `BCryptPasswordEncoder`, and it implements the interface `PasswordEncoder`.

## Why is it used?

Databases leak. A backup is copied, a laptop is stolen, an admin makes a mistake. If passwords are stored in plain text, every leak becomes a disaster. If they are stored as BCrypt hashes, the attacker gets only scrambled values that are very costly to crack.

Fast hashes such as MD5 or plain SHA-256 are not good enough for passwords. A graphics card can test billions of them per second. BCrypt was built to be slow and to keep getting harder as computers get faster, because you can raise its cost.

## How it works

Here is what happens at registration and at login.

```text
Registration
    |
    v
"Gym@2026" (plain password)
    |
    v
encode(): add salt, run BCrypt
    |
    v
Hash saved in the database
```

At registration the plain password is turned into a hash with a fresh salt, and only the hash is saved. The plain password is thrown away.

```text
Login
    |
    v
User types "Gym@2026"
    |
    v
Read saved hash from database
    |
    v
matches(typed, hash)
    |
    +--> true: welcome
    +--> false: try again
```

At login, the encoder reads the salt from inside the saved hash, hashes the typed password with it, and compares the result. The original password never comes back out of the database.

A BCrypt hash is a text of 60 characters. It carries everything the encoder needs, in fixed parts.

| Part | Example | Meaning |
|---|---|---|
| Version | `$2a$` | The BCrypt version |
| Cost | `10$` | Work factor, 2 to the power 10 rounds |
| Salt | 22 characters | Random value, unique per hash |
| Hash | 31 characters | The scrambled password |

Because the salt lives inside the hash, you do not store it in a separate column.

### The delegating encoder

Spring Security also offers a factory class, `PasswordEncoderFactories`, that builds a delegating encoder. It writes an id in front of every hash, such as `{bcrypt}`, and can read hashes made with older algorithms too. The `{noop}` marker from the earlier demos works the same way: it is the id of a "do nothing" encoder used only in demos. New projects that want an easy upgrade path can use the delegating encoder. Projects that only use BCrypt can use `BCryptPasswordEncoder` directly.

> **Warning:** Never write your own hash logic and never use MD5 or SHA-1 for passwords. Use the tested encoders from Spring Security.

## Real-Life Example

Think of a school office that stores exam papers in a sealed envelope with a stamp that changes every time. Two students who write the same answer get different stamps, so nobody can spot who copied whom by comparing envelopes. To check an answer later, the teacher applies the same stamp rule to the new paper and compares the result. He never opens the sealed envelope to read the original. That stamp is the salt, and the sealed envelope is the hash.

## Code Example

Let's build the sign-up logic of IronPulse Gym. A small service registers a member and later checks a login attempt. We use only the Spring Security starter, so no web server starts. The program prints facts that stay the same on every run, because the hash itself is random.

```text
ironpulse/
├─ pom.xml
└─ src/main/
   ├─ java/com/ironpulse/accounts/
   │  ├─ AccountsApplication.java
   │  ├─ PasswordConfig.java
   │  └─ MemberService.java
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

    <groupId>com.ironpulse</groupId>
    <artifactId>accounts</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
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

**File:** `PasswordConfig.java` in package `com.ironpulse.accounts`

```java
package com.ironpulse.accounts;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

**File:** `MemberService.java` in package `com.ironpulse.accounts`

```java
package com.ironpulse.accounts;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class MemberService {

    private final PasswordEncoder encoder;
    private final Map<String, String> hashes = new HashMap<>();

    public MemberService(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    public void register(String name, String rawPassword) {
        hashes.put(name, encoder.encode(rawPassword));
    }

    public boolean login(String name, String typedPassword) {
        String saved = hashes.get(name);
        return saved != null && encoder.matches(typedPassword, saved);
    }

    public String storedHash(String name) {
        return hashes.get(name);
    }
}
```

**File:** `AccountsApplication.java` in package `com.ironpulse.accounts`

```java
package com.ironpulse.accounts;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class AccountsApplication {

    public static void main(String[] args) {
        SpringApplication.run(AccountsApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(MemberService members, PasswordEncoder encoder) {
        return args -> {
            members.register("nikhil", "Gym@2026");
            members.register("tara", "Gym@2026");
            String hash = members.storedHash("nikhil");

            System.out.println("Starts with: " + hash.substring(0, 7));
            System.out.println("Length: " + hash.length());
            System.out.println("Same password, same hash: "
                    + hash.equals(members.storedHash("tara")));
            System.out.println("Right login: " + members.login("nikhil", "Gym@2026"));
            System.out.println("Wrong login: " + members.login("nikhil", "gym@2026"));
            System.out.println("Unknown user: " + members.login("zoya", "Gym@2026"));

            PasswordEncoder delegating =
                    PasswordEncoderFactories.createDelegatingPasswordEncoder();
            System.out.println("Delegating starts: "
                    + delegating.encode("Gym@2026").substring(0, 8));
        };
    }
}
```

Run it:

```bash
mvn spring-boot:run
```

**Output:**

```text
Starts with: $2a$10$
Length: 60
Same password, same hash: false
Right login: true
Wrong login: false
Unknown user: false
Delegating starts: {bcrypt}
```

Look closely. Every BCrypt hash starts with the version and cost, and has 60 characters. Nikhil and Tara chose the same password, yet their hashes differ, thanks to the salt. The correct password matches, a password with one letter changed does not, and an unknown user is refused. The delegating encoder writes `{bcrypt}` in front of its hash.

## Code Explained

- `BCryptPasswordEncoder` is a bean of type `PasswordEncoder`. Other classes ask for the interface, so you can change the algorithm in one place.
- `encoder.encode(raw)` makes a new salted hash every time it is called. That is why the two hashes differ.
- `encoder.matches(raw, hash)` reads the salt from the stored hash, hashes the typed password again and compares. Never compare hashes with `equals`, because two hashes of the same password never match.
- The default cost is 10. You can pass another cost, such as `new BCryptPasswordEncoder(12)`, and each step up doubles the time needed.
- `login()` returns false for an unknown user, and gives the same kind of answer as for a wrong password. That way an attacker cannot learn which names exist.
- With the web starter, the same bean is picked up by Spring Security, and it checks login passwords with it automatically.

> **Tip:** Choose a cost that makes one hash take roughly a tenth of a second on your server. Check it again once a year, because hardware gets faster.

## Common Mistakes

> **Warning:** Do not log passwords, not even while debugging, and never return the hash from an API. Both are common ways to leak private data.

- **Comparing with `equals`.** Comparing a saved hash with a fresh `encode` result is always false, because the salt is new each time. Use `matches`.
- **Encoding twice.** If the client already sends a hash and the server encodes it again, login stops working. Encode only the raw password, once, at registration.
- **Keeping `{noop}` in real code.** It stores plain text. Use it only in short demos.
- **A column that is too short.** A BCrypt hash needs 60 characters. A `varchar(50)` column would cut it and break every login. Use at least `varchar(100)`.

## Interview Questions

**Why should passwords be hashed instead of encrypted?**
Encryption can be reversed with the key. A hash cannot be reversed, so a leaked database does not reveal the passwords.

**What is a salt and why does BCrypt use one?**
A salt is random data mixed into each hash. It makes equal passwords produce different hashes and defeats precomputed lookup tables.

**Why is BCrypt slow on purpose?**
The slowness makes each guess expensive for an attacker. The cost factor can be raised later as computers become faster.

**How do you verify a password with BCrypt in Spring?**
Call the `matches` method with the typed password and the stored hash. Do not encode the typed password and compare the strings.

## Key Points to Remember

- Store a one-way hash of the password, never the password.
- BCrypt adds a random salt, and the salt is stored inside the 60-character hash.
- Use `encode` when saving and `matches` when checking.
- Higher cost means slower hashing and safer storage.
- Expose the encoder as a `PasswordEncoder` bean so Spring Security can use it.

## Frequently Asked Questions

### What is password encoding with BCrypt in Spring Boot?

It is a password hashing algorithm supplied by Spring Security through `BCryptPasswordEncoder`. It salts each hash and can be made slower as hardware improves.

### Can I decode a BCrypt hash back to the password?

No. BCrypt is a one-way function. The only way to check a password is to hash the guess with the same salt and compare.

### Why do two BCrypt hashes of the same password look different?

Each call to `encode` uses a new random salt. The salt is stored inside the hash, so `matches` still works for both hashes.

### Which BCrypt strength should I use?

Ten is the default and a fair start. Raise it, for example to 12, if hashing still takes well under a tenth of a second on your server.

## Related Topics

- [Spring Security Basics](/learning/spring-boot-tutorial/spring-security-basics): where the password encoder plugs into login.
- [Authentication vs Authorization](/learning/spring-boot-tutorial/authentication-vs-authorization): the difference between proving identity and granting access.
- [JWT Authentication](/learning/spring-boot-tutorial/jwt-authentication): what happens after the password check succeeds.
- [Role Based Authorization](/learning/spring-boot-tutorial/role-based-authorization): decide what each logged-in user may do.
