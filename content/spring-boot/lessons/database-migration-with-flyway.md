A gym adds a phone number field to its member form. The developer changes the Java class, tests on his laptop, and deploys. The live app crashes: "column phone not found". He forgot to change the production database. Worse, nobody remembers which SQL was run on which server. The code has version control, but the database does not.

Flyway fixes this. Let's learn how database migration with Flyway works in Spring Boot, how to write your first migration files, and which rules keep them safe.

## What is database migration with Flyway?

Think of a building's renovation file kept by a society. Every change has a numbered page: "Page 1: build the ground floor. Page 2: add a lift. Page 3: paint the gate." Anyone can read the pages in order and rebuild the same building. Nobody rewrites an old page. A new change always gets a new page.

> **Definition:** Flyway is a database migration tool. You keep numbered SQL files in your project, and Flyway runs the ones that have not run yet, in order, and remembers what it has done.

Each SQL file is called a migration. Flyway records every applied migration in a table named `flyway_schema_history`, inside your own database.

## Why is it used?

- **Every server has the same schema.** Laptop, test and production all run the same migration files, so they match.
- **Changes are reviewed like code.** A new column is a file in a pull request, not a note in someone's chat.
- **Safe teamwork.** Two developers can add changes without overwriting each other's manual SQL.
- **Automatic deploys.** When the app starts, Flyway brings the database up to date before your code touches it.
- **History.** You can see who added which column and when.

Hibernate can also create tables with `ddl-auto`, but that is only a helper for demos. It cannot drop a column safely, move data, or remember the past. Real projects use Flyway and set `ddl-auto` to `validate` or `none`.

## How it works

At startup, Spring Boot runs Flyway before JPA starts. Flyway compares the files in your project with its history table.

```text
App starts
    |
    v
Flyway reads db/migration files
    |
    v
Checks flyway_schema_history
    |
    v
Runs only the new files, in order
    |
    v
Records each one as done
    |
    v
Hibernate validates, app is ready
```

If the database is empty, all files run. If some already ran, only the newer ones do. If nothing is new, Flyway does nothing and startup continues.

Migration file names follow a strict pattern. Flyway reads the version and the description from the name.

```text
V1__members_table.sql
^  ^ ^
|  | +-- description (words)
|  +---- two underscores
+------- version number
```

The letter `V` marks a versioned migration. The number decides the order, so V2 runs after V1 and V10 runs after V9. The two underscores separate the version from the description.

| Part | Example | Rule |
|---|---|---|
| Prefix | `V` | Versioned, runs once |
| Version | `1`, `2`, `2.1` | Must be unique |
| Separator | `__` | Two underscores |
| Description | `add_phone_column` | Words joined by underscores |
| Suffix | `.sql` | Plain SQL file |

Spring Boot looks in the `db/migration` folder of your resources by default. In Spring Boot 4 you add the starter `spring-boot-starter-flyway`. For real databases you also add a Flyway add-on for that database, such as the PostgreSQL or MySQL one. Flyway 12 ships those add-ons separately, and H2 works out of the box.

> **Warning:** Never edit a migration that has already run on a shared database. Flyway stores a checksum of each file, and a changed file makes the next startup fail. Add a new migration instead.

## Real-Life Example

A restaurant keeps its recipe book as loose numbered cards. Card 1: plain dosa batter. Card 2: add a chutney recipe. Card 3: add a spicy variant. When a new branch opens, the chef reads the cards from 1 to 3 and cooks the same menu. When the head chef changes a recipe, he does not scratch out card 2. He writes card 4: "Change chutney, use less salt." The cards are migrations, and the branch opening is a fresh database.

## Code Example

Let's build the member list of FitZone, a gym. Migration 1 creates the table. Migration 2 adds a phone column and one row of data. Hibernate only validates that the class matches the tables.

```text
fitzone/
├─ pom.xml
└─ src/main/
   ├─ java/com/fitzone/members/
   │  ├─ MembersApplication.java
   │  ├─ Member.java
   │  └─ MemberRepository.java
   └─ resources/
      ├─ application.properties
      └─ db/migration/
         ├─ V1__members.sql
         └─ V2__add_phone.sql
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

    <groupId>com.fitzone</groupId>
    <artifactId>members</artifactId>
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
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-flyway</artifactId>
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
spring.jpa.hibernate.ddl-auto=validate
```

**File:** `db/migration/V1__members.sql` in `src/main/resources`

```sql
create table member (
    id bigint generated by default as identity primary key,
    full_name varchar(100) not null,
    plan varchar(20) not null
);

insert into member (full_name, plan) values ('Rohan Desai', 'GOLD');
```

**File:** `db/migration/V2__add_phone.sql` in `src/main/resources`

```sql
alter table member add column phone varchar(15);

update member set phone = '9800011122' where full_name = 'Rohan Desai';

insert into member (full_name, plan, phone)
values ('Nisha Verma', 'SILVER', '9800033344');
```

**File:** `Member.java` in package `com.fitzone.members`

```java
package com.fitzone.members;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String plan;
    private String phone;

    public String getFullName() {
        return fullName;
    }

    public String getPlan() {
        return plan;
    }

    public String getPhone() {
        return phone;
    }
}
```

**File:** `MemberRepository.java` in package `com.fitzone.members`

```java
package com.fitzone.members;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {
}
```

**File:** `MembersApplication.java` in package `com.fitzone.members`

```java
package com.fitzone.members;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class MembersApplication {

    public static void main(String[] args) {
        SpringApplication.run(MembersApplication.class, args);
    }

    @Bean
    CommandLineRunner demo(MemberRepository members, JdbcTemplate jdbc) {
        return args -> {
            System.out.println("Members:");
            for (Member m : members.findAll()) {
                System.out.println("  " + m.getFullName() + ", " + m.getPlan()
                        + ", " + m.getPhone());
            }
            System.out.println("Migration history:");
            jdbc.query("""
                    select "version", "description", "success"
                    from "flyway_schema_history"
                    where "version" is not null
                    order by "installed_rank"
                    """,
                    rs -> {
                        System.out.println("  V" + rs.getString("version") + " "
                                + rs.getString("description")
                                + " ok=" + rs.getBoolean("success"));
                    });
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
Members:
  Rohan Desai, GOLD, 9800011122
  Nisha Verma, SILVER, 9800033344
Migration history:
  V1 members ok=true
  V2 add phone ok=true
```

Flyway found an empty database and ran both files, so the members carry the phone column. The history table lists both migrations. Flyway also stores one marker row for creating the table itself, which we filter out with `where version is not null`. Flyway may also print a warning that your H2 version is newer than the one it was tested with. It is harmless for this demo, and we left it out of the output above. Flyway turns the file name `V2__add_phone.sql` into the description `add phone`.

## Code Explained

- `spring-boot-starter-flyway` brings the Flyway library and the Spring Boot setup that runs it at startup.
- `V1__members.sql` builds the table. It also inserts a first row, which is common for reference data.
- `V2__add_phone.sql` changes the table. It does not touch `V1`, because that file is already history.
- `ddl-auto=validate` makes Hibernate check that `Member` matches the tables, and fail early if it does not.
- `flyway_schema_history` is created by Flyway. It stores the version, description, checksum and success flag of every migration.
- `JdbcTemplate` reads the history table so you can see Flyway's work. The column names are quoted because `version` is a reserved word in H2.

> **Tip:** Keep each migration small and about one change. A file named `add_phone` is easier to review and to fix than one giant file with ten changes.

## Common Mistakes

- **Editing an applied migration.** Startup fails with a checksum error. Write a new versioned file for the fix.
- **Version clashes.** Two developers both create `V3__...` on different branches. Agree on a rule, such as timestamps for version numbers, or check before merging.
- **Leaving `ddl-auto=update` on.** Hibernate and Flyway then both change the schema. Use `validate` or `none`.
- **Using one dialect in tests and another in production.** SQL that runs on H2 may fail on PostgreSQL. Test migrations on the same database type you deploy to.
- **Forgetting the database add-on.** For PostgreSQL or MySQL you must add Flyway's add-on for that database along with the starter.
- **Putting the files in the wrong folder.** They must be under `db/migration` on the classpath, unless you change `spring.flyway.locations`.

## Interview Questions

**What is Flyway and why use it?**
It is a database migration tool that runs versioned SQL files in order and records them, so every environment has the same schema.

**What is the naming rule for a Flyway migration?**
`V<version>__<description>.sql`, with two underscores after the version, for example `V2__add_phone.sql`.

**What happens if you edit a migration that already ran?**
Flyway detects that the checksum changed and stops the application with an error. The right fix is a new migration.

**What is the flyway_schema_history table?**
It is the table Flyway creates to record every applied migration with its version, description, checksum, time and success flag.

## Key Points to Remember

- Flyway keeps the database schema under version control, as numbered SQL files.
- File names follow `V<number>__<description>.sql`.
- Flyway runs only new files and records them in `flyway_schema_history`.
- Never edit an applied migration. Add a new one.
- Use `ddl-auto=validate` with Flyway, not `update`.

## Frequently Asked Questions

### Does database migration with Flyway run automatically in Spring Boot?

Yes. With the Flyway starter on the classpath and a database configured, Spring Boot runs pending migrations at startup, before JPA is used.

### Where do I put Flyway migration files?

In the `db/migration` folder under `src/main/resources`. You can change the folder with the property `spring.flyway.locations`.

### Can Flyway undo a migration?

Not in the free community edition. You write a new migration that reverses the change. This is why small migrations and backups matter.

### What if my database already has tables?

Turn on baselining, so Flyway treats the current state as a starting point, and add only newer migrations from there.

```properties
spring.flyway.baseline-on-migrate=true
```

## Related Topics

- [H2 In-Memory Database](/learning/spring-boot-tutorial/h2-in-memory-database): the database used in this demo.
- [JPA Entity and @Entity](/learning/spring-boot-tutorial/jpa-entity): the classes Hibernate validates against your tables.
- [Connecting Spring Boot to PostgreSQL](/learning/spring-boot-tutorial/connecting-spring-boot-to-postgresql): the usual production database for Flyway.
- [Soft Delete](/learning/spring-boot-tutorial/soft-delete): a schema change that fits well in a migration.
