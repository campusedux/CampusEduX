Try each problem on your own first. Both use the same `pom.xml` as the CityLibrary example; only change the `groupId` and `artifactId`.

### Easy: Bakery Menu CRUD

Golden Crust Bakery wants a small CRUD API for `/api/items` with `id`, `name` and `priceInRupees`. Support `POST` (201), `GET` for all items, `GET` for one item (404 if missing), and `DELETE` (204, or 404 if missing). Keep the items in a map inside one controller, with no service layer.

> **Hint:** Use `ResponseEntity` for the methods that can answer more than one status. Give ids out with an `AtomicInteger`.

**Answer:** One controller is enough for a tiny API. The missing-item cases return `notFound().build()`.

**File:** `MenuApplication.java` in package `com.goldencrust.menu`

```java
package com.goldencrust.menu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MenuApplication {

    public static void main(String[] args) {
        SpringApplication.run(MenuApplication.class, args);
    }
}
```

**File:** `ItemController.java` in package `com.goldencrust.menu`

```java
package com.goldencrust.menu;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    record Item(int id, String name, int priceInRupees) {}
    record ItemRequest(String name, int priceInRupees) {}

    private final Map<Integer, Item> items = new ConcurrentHashMap<>();
    private final AtomicInteger nextId = new AtomicInteger(1);

    @PostMapping
    public ResponseEntity<Item> create(@RequestBody ItemRequest request) {
        Item item = new Item(nextId.getAndIncrement(), request.name(), request.priceInRupees());
        items.put(item.id(), item);
        return ResponseEntity.created(URI.create("/api/items/" + item.id())).body(item);
    }

    @GetMapping
    public List<Item> all() {
        return new ArrayList<>(items.values());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> one(@PathVariable int id) {
        Item item = items.get(id);
        return item == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(item);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable int id) {
        return items.remove(id) == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.noContent().build();
    }
}
```

Adding a cake and listing it:

```bash
curl -X POST localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Chocolate Truffle","priceInRupees":650}'
```

The reply with status 201, spaced out for reading:

```json
{
  "id": 1,
  "name": "Chocolate Truffle",
  "priceInRupees": 650
}
```

### Medium: Gym Members with Layers and Search

FitZone Gym needs a layered CRUD API on `/api/members`. A member has `id`, `name`, `plan` (`MONTHLY` or `YEARLY`) and `active`. Build:

- A request DTO, a service, a repository and an exception handler.
- `POST` creates a member (`active` starts as `true`). An unknown plan gives 400.
- `GET /api/members?plan=YEARLY` filters by plan, and `PUT /api/members/{id}` replaces name and plan.
- `DELETE /api/members/{id}` does a soft delete: it sets `active` to `false` and answers 204. Reading the member later still returns it, with `active` false.

> **Hint:** Keep the repository like the CityLibrary one, and add the soft-delete rule in the service. Check the plan text in the service and throw `IllegalArgumentException` for anything else.

**Answer:** The soft delete is a business rule, so it lives in the service. The repository just saves the changed record.

**File:** `GymApplication.java` in package `com.fitzone.members`

```java
package com.fitzone.members;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GymApplication {

    public static void main(String[] args) {
        SpringApplication.run(GymApplication.class, args);
    }
}
```

**File:** `Member.java` in package `com.fitzone.members`

```java
package com.fitzone.members;

public record Member(int id, String name, String plan, boolean active) {}
```

**File:** `MemberRequest.java` in package `com.fitzone.members`

```java
package com.fitzone.members;

public record MemberRequest(String name, String plan) {}
```

**File:** `MemberNotFoundException.java` in package `com.fitzone.members`

```java
package com.fitzone.members;

public class MemberNotFoundException extends RuntimeException {

    public MemberNotFoundException(int id) {
        super("Member " + id + " does not exist");
    }
}
```

**File:** `MemberRepository.java` in package `com.fitzone.members`

```java
package com.fitzone.members;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Repository;

@Repository
public class MemberRepository {

    private final Map<Integer, Member> members = new ConcurrentHashMap<>();
    private final AtomicInteger nextId = new AtomicInteger(1);

    public int nextId() {
        return nextId.getAndIncrement();
    }

    public Member save(Member member) {
        members.put(member.id(), member);
        return member;
    }

    public Optional<Member> findById(int id) {
        return Optional.ofNullable(members.get(id));
    }

    public List<Member> findAll() {
        return new ArrayList<>(members.values());
    }
}
```

**File:** `MemberService.java` in package `com.fitzone.members`

```java
package com.fitzone.members;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class MemberService {

    private final MemberRepository repository;

    public MemberService(MemberRepository repository) {
        this.repository = repository;
    }

    public Member create(MemberRequest request) {
        return repository.save(new Member(repository.nextId(), request.name(),
                plan(request.plan()), true));
    }

    public List<Member> findAll(String plan) {
        return repository.findAll().stream()
                .filter(m -> plan == null || m.plan().equals(plan))
                .sorted(Comparator.comparingInt(Member::id))
                .toList();
    }

    public Member findOne(int id) {
        return repository.findById(id).orElseThrow(() -> new MemberNotFoundException(id));
    }

    public Member update(int id, MemberRequest request) {
        Member old = findOne(id);
        return repository.save(new Member(id, request.name(), plan(request.plan()), old.active()));
    }

    public void deactivate(int id) {
        Member old = findOne(id);
        repository.save(new Member(id, old.name(), old.plan(), false));
    }

    private String plan(String value) {
        if (!"MONTHLY".equals(value) && !"YEARLY".equals(value)) {
            throw new IllegalArgumentException("Plan must be MONTHLY or YEARLY");
        }
        return value;
    }
}
```

**File:** `MemberController.java` in package `com.fitzone.members`

```java
package com.fitzone.members;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService service;

    public MemberController(MemberService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Member create(@RequestBody MemberRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<Member> all(@RequestParam(required = false) String plan) {
        return service.findAll(plan);
    }

    @GetMapping("/{id}")
    public Member one(@PathVariable int id) {
        return service.findOne(id);
    }

    @PutMapping("/{id}")
    public Member update(@PathVariable int id, @RequestBody MemberRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable int id) {
        service.deactivate(id);
    }
}
```

**File:** `ApiErrors.java` in package `com.fitzone.members`

```java
package com.fitzone.members;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {

    record Problem(String message) {}

    @ExceptionHandler(MemberNotFoundException.class)
    public ResponseEntity<Problem> notFound(MemberNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new Problem(e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Problem> bad(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new Problem(e.getMessage()));
    }
}
```

Joining, leaving, then reading the same member:

```bash
curl -X POST localhost:8080/api/members -H "Content-Type: application/json" -d '{"name":"Riya","plan":"YEARLY"}'
curl -X DELETE localhost:8080/api/members/1
curl localhost:8080/api/members/1
```

The last call prints, spaced out for reading:

```json
{
  "id": 1,
  "name": "Riya",
  "plan": "YEARLY",
  "active": false
}
```

An unknown plan such as `WEEKLY` answers 400 with the message `Plan must be MONTHLY or YEARLY`. The check sits in the service, so the controller needs no extra code.
