Try each problem on your own first, then compare with the solution.

### Easy: Library Late Fines

A library charges late fines by item type. Write an interface `LateFine` with an abstract method `int perDay()` and a default method `int total(int days)` that returns `perDay() * days`. Implement it in `BookFine` (Rs 2 per day) and `DvdFine` (Rs 5 per day). Print the fine for a book that is 7 days late and a DVD that is 3 days late.

Expected output:

```text
Book, 7 days: Rs 14
DVD, 3 days: Rs 15
```

> **Hint:** The classes only implement `perDay()`. They get `total()` from the interface without writing it.

**Answer:** The default method holds the shared formula, and each class supplies only its own daily rate.

```java
interface LateFine {
    int perDay();

    default int total(int days) {
        return perDay() * days;
    }
}

class BookFine implements LateFine {
    public int perDay() {
        return 2;
    }
}

class DvdFine implements LateFine {
    public int perDay() {
        return 5;
    }
}

public class FineDesk {
    public static void main(String[] args) {
        LateFine book = new BookFine();
        LateFine dvd = new DvdFine();
        System.out.println("Book, 7 days: Rs " + book.total(7));
        System.out.println("DVD, 3 days: Rs " + dvd.total(3));
    }
}
```

**Output:**

```text
Book, 7 days: Rs 14
DVD, 3 days: Rs 15
```

### Medium: Grocery Cart Discount Rules

A grocery app applies several discount rules to a cart total, one after another. Create a functional interface `DiscountRule` with `int apply(int total)`. Write three rules as lambdas: take 10 percent off totals of 1000 or more, take a flat Rs 50 off with a coupon, and add a Rs 40 delivery charge when the total is below 500. Apply them in that order to a cart of Rs 1200 and to a cart of Rs 480, printing the total after each rule.

Expected output:

```text
Cart 1200
  after rule: 1080
  after rule: 1030
  after rule: 1030
Cart 480
  after rule: 480
  after rule: 430
  after rule: 470
```

> **Hint:** Store the lambdas in a `DiscountRule[]` array and loop over it, feeding each result into the next rule.

**Answer:** Each lambda is a full `DiscountRule` implementation in one line, and the checkout loop depends only on the interface, so rules can be added or reordered freely.

```java
@FunctionalInterface
interface DiscountRule {
    int apply(int total);
}

public class GroceryCheckout {
    static void run(int cart, DiscountRule[] rules) {
        System.out.println("Cart " + cart);
        int total = cart;
        for (DiscountRule r : rules) {
            total = r.apply(total);
            System.out.println("  after rule: " + total);
        }
    }

    public static void main(String[] args) {
        DiscountRule bulk = t -> t >= 1000 ? t * 90 / 100 : t;
        DiscountRule coupon = t -> t - 50;
        DiscountRule delivery = t -> t < 500 ? t + 40 : t;
        DiscountRule[] rules = { bulk, coupon, delivery };
        run(1200, rules);
        run(480, rules);
    }
}
```

**Output:**

```text
Cart 1200
  after rule: 1080
  after rule: 1030
  after rule: 1030
Cart 480
  after rule: 480
  after rule: 430
  after rule: 470
```
