Try each problem on your own first, then compare with the solution.

### Easy: Coupon Code Cleaner

A food delivery app lets customers type a coupon code. People type it with extra spaces and random capital letters. Clean each code by trimming it and turning it to upper case. If the clean code starts with `SAVE`, read the number after it and print the discount. Otherwise print that it is not a SAVE code. Use these typed codes: `"  save20 "`, `"Save5"`, `"FLAT100"` and `" sAvE35"`.

Expected output:

```text
SAVE20 -> 20% off
SAVE5 -> 5% off
FLAT100 -> not a SAVE code
SAVE35 -> 35% off
```

> **Hint:** Chain `trim()` and `toUpperCase()`, then use `startsWith("SAVE")`. The number starts at index 4, so `substring(4)` gives it, and `Integer.parseInt` turns it into an `int`.

**Answer:** Normalise the text first so every comparison works on the same shape, then cut out the digits with `substring` and parse them.

```java
public class CouponCleaner {
    public static void main(String[] args) {
        String[] typed = {"  save20 ", "Save5", "FLAT100", " sAvE35"};
        for (String raw : typed) {
            String code = raw.trim().toUpperCase();
            if (code.startsWith("SAVE")) {
                int pct = Integer.parseInt(code.substring(4));
                System.out.println(code + " -> " + pct + "% off");
            } else {
                System.out.println(code + " -> not a SAVE code");
            }
        }
    }
}
```

**Output:**

```text
SAVE20 -> 20% off
SAVE5 -> 5% off
FLAT100 -> not a SAVE code
SAVE35 -> 35% off
```

### Medium: Sorting Belt Compressor

A warehouse scanner reads the zone letter of each parcel as it passes on a belt, giving strings like `"AAABBC"`. To save space, the log should store each run of the same letter followed by its count, so `"AAABBC"` becomes `"A3B2C1"`. Write `compress(String belt)` and test it on `"AAABBC"`, `"XYZ"`, twelve `M` letters and an empty string.

Expected output:

```text
[AAABBC] -> [A3B2C1]
[XYZ] -> [X1Y1Z1]
[MMMMMMMMMMMM] -> [M12]
[] -> []
```

> **Hint:** Walk the string with `charAt`. Keep the current letter and a counter. When the letter changes, append the old letter and its count to a `StringBuilder`. Do not forget the last run after the loop ends.

**Answer:** One pass with a counter finds every run, and `StringBuilder` builds the result without creating a new string for each append. The empty string is handled first so `charAt(0)` never fails.

```java
public class BeltCompressor {
    static String compress(String belt) {
        if (belt.isEmpty()) {
            return "";
        }
        StringBuilder out = new StringBuilder();
        char current = belt.charAt(0);
        int count = 1;
        for (int i = 1; i < belt.length(); i++) {
            char c = belt.charAt(i);
            if (c == current) {
                count++;
            } else {
                out.append(current).append(count);
                current = c;
                count = 1;
            }
        }
        out.append(current).append(count);
        return out.toString();
    }

    public static void main(String[] args) {
        String[] belts = {"AAABBC", "XYZ", "MMMMMMMMMMMM", ""};
        for (String b : belts) {
            System.out.println("[" + b + "] -> ["
                    + compress(b) + "]");
        }
    }
}
```

**Output:**

```text
[AAABBC] -> [A3B2C1]
[XYZ] -> [X1Y1Z1]
[MMMMMMMMMMMM] -> [M12]
[] -> []
```
