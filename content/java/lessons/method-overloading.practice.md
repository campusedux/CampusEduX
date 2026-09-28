Try each problem on your own first, then compare with the solution.

### Easy: Tea Stall Bill

A roadside tea stall charges Rs 15 per cup of tea and Rs 5 per biscuit. A special drink such as "Masala" costs Rs 25 per cup. Write three overloaded `bill` methods: `bill(int cups)`, `bill(int cups, int biscuits)` and `bill(String special, int cups)`. Print the bills for 2 teas, 3 teas with 4 biscuits, and 2 Masala.

Expected output:

```text
2 tea: Rs 30
3 tea + 4 biscuit: Rs 65
2 Masala: Rs 50
```

> **Hint:** The three versions differ in count and type of parameters. The two-number version can reuse the one-number version for the tea part.

**Answer:** Each call matches exactly one overload by its argument list, and the richer version reuses the simpler one.

```java
class TeaStall {
    int bill(int cups) {
        return cups * 15;
    }

    int bill(int cups, int biscuits) {
        return bill(cups) + biscuits * 5;
    }

    int bill(String special, int cups) {
        return cups * 25;
    }
}

public class TeaCounter {
    public static void main(String[] args) {
        TeaStall stall = new TeaStall();
        System.out.println("2 tea: Rs " + stall.bill(2));
        System.out.println("3 tea + 4 biscuit: Rs "
            + stall.bill(3, 4));
        System.out.println("2 Masala: Rs "
            + stall.bill("Masala", 2));
    }
}
```

**Output:**

```text
2 tea: Rs 30
3 tea + 4 biscuit: Rs 65
2 Masala: Rs 50
```

### Medium: Print Shop Pricing

A print shop charges Rs 2 per black page and Rs 10 per colour page. Write overloads of `cost`: `cost(long pages)` for black pages, `cost(long pages, boolean colour)`, and `cost(int... files)` that takes the page count of several files and prices them all as black. Call `cost(40)`, `cost(12, true)` and `cost(5, 8, 3)`, and print each result together with the version used.

Expected output:

```text
long version: Rs 80
colour version: Rs 120
varargs version: Rs 32
```

> **Hint:** `cost(40)` passes an `int`, but there is no `cost(int)`. Widening to `long` is tried before varargs, so the `long` version wins. `cost(5, 8, 3)` fits only the varargs version.

**Answer:** The compiler widens `int` to `long` for the first two calls and falls back to varargs only for the three-argument call.

```java
class PrintShop {
    String cost(long pages) {
        return "long version: Rs " + pages * 2;
    }

    String cost(long pages, boolean colour) {
        long rate = colour ? 10 : 2;
        return "colour version: Rs " + pages * rate;
    }

    String cost(int... files) {
        int total = 0;
        for (int pages : files) {
            total += pages;
        }
        return "varargs version: Rs " + total * 2;
    }
}

public class PrintCounter {
    public static void main(String[] args) {
        PrintShop shop = new PrintShop();
        System.out.println(shop.cost(40));
        System.out.println(shop.cost(12, true));
        System.out.println(shop.cost(5, 8, 3));
    }
}
```

**Output:**

```text
long version: Rs 80
colour version: Rs 120
varargs version: Rs 32
```
