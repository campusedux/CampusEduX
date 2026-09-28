Try each problem on your own first, then compare with the solution.

### Easy: Delivery Charge Rules

A stationery shop charges Rs 40 for delivery, but delivery is free when the order is Rs 500 or more. Store both numbers as `static final` constants and print what the customer pays for orders of 320, 500 and 760 rupees.

Expected output:

```text
Order 320: pay 360
Order 500: pay 500
Order 760: pay 760
```

> **Hint:** Name the constants in capitals, for example `FREE_FROM` and `CHARGE`, and use them in one small method that returns the amount to pay.

**Answer:** The two rules live in one place as constants, so any later change to the policy is a one-line edit, and no code can reassign them by mistake.

```java
public class DeliveryRules {
    static final int FREE_FROM = 500;
    static final int CHARGE = 40;

    static int toPay(final int order) {
        return order >= FREE_FROM ? order : order + CHARGE;
    }

    public static void main(String[] args) {
        int[] orders = {320, 500, 760};
        for (int o : orders) {
            System.out.println("Order " + o + ": pay " + toPay(o));
        }
    }
}
```

**Output:**

```text
Order 320: pay 360
Order 500: pay 500
Order 760: pay 760
```

### Medium: A Frozen Price List

Write a `final` class `PriceList` that takes a `Map` of item prices in its constructor and can never change afterwards. A method `withPrice(item, price)` must return a new `PriceList` and leave the old one alone. Start with Ink 120 and Paper 250, then prove three things: changing the caller's original map does not affect the list, `withPrice("Ink", 135)` gives a new list, and the old list still shows the old price.

Expected output:

```text
Old : {Ink=120, Paper=250}
New : {Ink=135, Paper=250}
Old after caller edit:
  {Ink=120, Paper=250}
```

> **Hint:** Copy the incoming map into a new `TreeMap` so the keys print in a fixed order, then wrap it with `Collections.unmodifiableMap`. Keep that in a `private final` field.

**Answer:** The class is `final`, its only field is `private final`, and the constructor copies the map, so neither subclasses nor callers can change a `PriceList` once it exists.

```java
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

final class PriceList {
    private final Map<String, Integer> prices;

    PriceList(Map<String, Integer> source) {
        prices = Collections.unmodifiableMap(new TreeMap<>(source));
    }

    PriceList withPrice(String item, int price) {
        Map<String, Integer> copy = new HashMap<>(prices);
        copy.put(item, price);
        return new PriceList(copy);
    }

    @Override
    public String toString() {
        return prices.toString();
    }
}

public class ShopPrices {
    public static void main(String[] args) {
        Map<String, Integer> start = new HashMap<>();
        start.put("Ink", 120);
        start.put("Paper", 250);

        PriceList oldList = new PriceList(start);
        PriceList newList = oldList.withPrice("Ink", 135);
        start.put("Paper", 999);

        System.out.println("Old : " + oldList);
        System.out.println("New : " + newList);
        System.out.println("Old after caller edit:");
        System.out.println("  " + oldList);
    }
}
```

**Output:**

```text
Old : {Ink=120, Paper=250}
New : {Ink=135, Paper=250}
Old after caller edit:
  {Ink=120, Paper=250}
```
