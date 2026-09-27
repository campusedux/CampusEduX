Try each problem on your own first. Both use the same `pom.xml` as the HomeBox example; only change the `groupId` and `artifactId`.

### Easy: Bookshop Wish List

PageOne Bookshop lets customers keep a wish list. Build `GET /wishlist`, which returns all titles saved so far, and `POST /wishlist`, which accepts JSON like `{"title":"Salt and Stars"}`, saves it, and answers `201 Created` with the saved title.

> **Hint:** Keep a `List` of records in the controller. The POST method takes the body with `@RequestBody`, and `@ResponseStatus` with `HttpStatus.CREATED` sets the status.

**Answer:** GET only reads the list. POST adds to it and replies with 201.

**File:** `WishlistApplication.java` in package `com.pageone.wishlist`

```java
package com.pageone.wishlist;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WishlistApplication {

    public static void main(String[] args) {
        SpringApplication.run(WishlistApplication.class, args);
    }
}
```

**File:** `WishlistController.java` in package `com.pageone.wishlist`

```java
package com.pageone.wishlist;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/wishlist")
public class WishlistController {

    record Wish(String title) {}

    private final List<Wish> wishes = new ArrayList<>();

    @GetMapping
    public List<Wish> all() {
        return wishes;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Wish add(@RequestBody Wish wish) {
        wishes.add(wish);
        return wish;
    }
}
```

Save a book, then read the list:

```bash
curl -X POST localhost:8080/wishlist \
  -H "Content-Type: application/json" \
  -d '{"title":"Salt and Stars"}'
curl localhost:8080/wishlist
```

The POST replies with the saved title and status 201, and the GET returns the whole list. Both replies, spaced out:

```json
{
  "title": "Salt and Stars"
}
[
  {
    "title": "Salt and Stars"
  }
]
```

### Medium: Sweet Bakes Price Changes

Sweet Bakes shop keeps items with an `id`, a `name` and a `priceInRupees`. Build a controller on `/items` that starts with two items: `1` Rusk (60 rupees) and `2` Cream Roll (35 rupees). It supports:

- `GET /items/{id}` returns the item, or `404` when it does not exist.
- `PUT /items/{id}` replaces the whole item, and `404` when it does not exist.
- `PATCH /items/{id}` accepts `{"priceInRupees": 70}` and changes only the price.
- `DELETE /items/{id}` answers `204`.

> **Hint:** Use `@PatchMapping("/{id}")` with a small record that holds only `priceInRupees`. Create a new `Item` with the same id and name, and the new price. Keep the items in a `ConcurrentHashMap`.

**Answer:** PUT needs the full item, while PATCH sends only the field that changes. The controller builds a new record because records cannot be changed after creation.

**File:** `BakesApplication.java` in package `com.sweetbakes.shop`

```java
package com.sweetbakes.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BakesApplication {

    public static void main(String[] args) {
        SpringApplication.run(BakesApplication.class, args);
    }
}
```

**File:** `ItemController.java` in package `com.sweetbakes.shop`

```java
package com.sweetbakes.shop;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/items")
public class ItemController {

    record Item(int id, String name, int priceInRupees) {}
    record PriceChange(int priceInRupees) {}

    private final Map<Integer, Item> items = new ConcurrentHashMap<>(Map.of(
            1, new Item(1, "Rusk", 60),
            2, new Item(2, "Cream Roll", 35)));

    private Item find(int id) {
        Item item = items.get(id);
        if (item == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such item");
        }
        return item;
    }

    @GetMapping("/{id}")
    public Item one(@PathVariable int id) {
        return find(id);
    }

    @PutMapping("/{id}")
    public Item replace(@PathVariable int id, @RequestBody Item item) {
        find(id);
        Item saved = new Item(id, item.name(), item.priceInRupees());
        items.put(id, saved);
        return saved;
    }

    @PatchMapping("/{id}")
    public Item changePrice(@PathVariable int id, @RequestBody PriceChange change) {
        Item old = find(id);
        Item saved = new Item(id, old.name(), change.priceInRupees());
        items.put(id, saved);
        return saved;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable int id) {
        find(id);
        items.remove(id);
    }
}
```

Changing only the price of Rusk:

```bash
curl -X PATCH localhost:8080/items/1 \
  -H "Content-Type: application/json" \
  -d '{"priceInRupees":70}'
```

The reply keeps the name and shows the new price:

```json
{
  "id": 1,
  "name": "Rusk",
  "priceInRupees": 70
}
```
