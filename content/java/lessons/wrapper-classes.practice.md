Try each problem on your own first, then compare with the solution.

### Easy: Adding Up Typed Recharge Amounts

A shop assistant typed today's recharge amounts into a form as text: "199", "299", "abc", "719" and "49". Turn each entry into an `int`, skip any entry that is not a number, and print the skipped entry and the total of the valid ones.

Expected output:

```text
Skipped: abc
Valid recharges: 4
Total: Rs 1266
```

> **Hint:** Call `Integer.parseInt` inside a `try` block and catch `NumberFormatException` for the bad entry.

**Answer:** `parseInt` converts text to a primitive `int` and throws `NumberFormatException` for anything that is not a whole number, so a `try-catch` per entry keeps the loop going.

```java
public class ShopTotal {
    public static void main(String[] args) {
        String[] typed = {"199", "299", "abc", "719", "49"};
        int total = 0;
        int valid = 0;

        for (String entry : typed) {
            try {
                total += Integer.parseInt(entry);
                valid++;
            } catch (NumberFormatException e) {
                System.out.println("Skipped: " + entry);
            }
        }
        System.out.println("Valid recharges: " + valid);
        System.out.println("Total: Rs " + total);
    }
}
```

**Output:**

```text
Skipped: abc
Valid recharges: 4
Total: Rs 1266
```

### Medium: Same Plan Two Days Running

A customer's recharge history for four time slots on Monday was 299, 49, `null` (no recharge) and 719. On Tuesday it was 299, 49, `null` and 719 again, but each amount was boxed separately. Count in how many slots the customer bought the same thing on both days, treating two `null` slots as a match. First show the wrong count that `==` gives, then the correct count.

Expected output:

```text
With ==: 2
With equals: 4
```

> **Hint:** Keep two counters, one for `==` and one for `Objects.equals(a, b)`. The second handles `null` safely.

**Answer:** `==` only matched the 49 slot (cached) and the `null` slot, because 299 and 719 are above 127 and were boxed into separate objects. `Objects.equals` compares values and treats two `null` values as equal.

```java
import java.util.Objects;

public class RepeatRecharge {
    public static void main(String[] args) {
        Integer[] monday = {Integer.valueOf(299),
                Integer.valueOf(49), null, Integer.valueOf(719)};
        Integer[] tuesday = {Integer.valueOf(299),
                Integer.valueOf(49), null, Integer.valueOf(719)};

        int byReference = 0;
        int byValue = 0;
        for (int i = 0; i < monday.length; i++) {
            if (monday[i] == tuesday[i]) {
                byReference++;
            }
            if (Objects.equals(monday[i], tuesday[i])) {
                byValue++;
            }
        }
        System.out.println("With ==: " + byReference);
        System.out.println("With equals: " + byValue);
    }
}
```

**Output:**

```text
With ==: 2
With equals: 4
```
