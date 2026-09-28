Try each problem on your own first, then compare with the solution.

### Easy: Commands from the Control Room

The traffic control room sends signal commands as text: "red", "Green", "blue" and "YELLOW". Define an enum `Signal` with the constants `RED`, `YELLOW` and `GREEN`. Turn each command into a `Signal`, ignoring upper or lower case, and print its ordinal. Print a clear message for any command that is not a real signal.

Expected output:

```text
red -> RED (ordinal 0)
Green -> GREEN (ordinal 2)
blue -> not a signal
YELLOW -> YELLOW (ordinal 1)
```

> **Hint:** Pass `cmd.toUpperCase()` to `Signal.valueOf` and catch `IllegalArgumentException` for unknown names.

**Answer:** `valueOf` needs the exact constant name, so the text is changed to upper case first. A name with no matching constant throws `IllegalArgumentException`, which the loop catches.

```java
enum Signal { RED, YELLOW, GREEN }

public class ControlRoom {
    public static void main(String[] args) {
        String[] commands = {"red", "Green", "blue", "YELLOW"};
        for (String cmd : commands) {
            try {
                Signal s = Signal.valueOf(cmd.toUpperCase());
                System.out.println(cmd + " -> " + s
                        + " (ordinal " + s.ordinal() + ")");
            } catch (IllegalArgumentException e) {
                System.out.println(cmd + " -> not a signal");
            }
        }
    }
}
```

**Output:**

```text
red -> RED (ordinal 0)
Green -> GREEN (ordinal 2)
blue -> not a signal
YELLOW -> YELLOW (ordinal 1)
```

### Medium: Traffic Fine Calculator

A traffic camera recorded one driver's offences in this order: overspeed, signal jump, overspeed, no helmet, overspeed. Model the offences as an enum. A signal jump costs Rs 1000 each time, no helmet costs Rs 500 each time, and overspeeding costs Rs 2000 the first time and Rs 4000 for every repeat. Count the offences in an `EnumMap`, give each constant its own fine rule, and print each offence with its count and fine, then the total.

Expected output:

```text
SIGNAL_JUMP x1 = Rs 1000
OVERSPEED x3 = Rs 10000
NO_HELMET x1 = Rs 500
Total = Rs 11500
```

> **Hint:** Declare `abstract int fineFor(int times);` in the enum and override it in each constant's body. Declare the constants in the order they should be printed.

**Answer:** Each constant carries its own rule in `fineFor`, so no `if` chain is needed. `EnumMap` prints the offences in declaration order, not in the order the camera saw them.

```java
import java.util.EnumMap;
import java.util.Map;

enum Offence {
    SIGNAL_JUMP {
        int fineFor(int times) { return 1000 * times; }
    },
    OVERSPEED {
        int fineFor(int times) {
            return 2000 + 4000 * (times - 1);
        }
    },
    NO_HELMET {
        int fineFor(int times) { return 500 * times; }
    };

    abstract int fineFor(int times);
}

public class FineCalculator {
    public static void main(String[] args) {
        Offence[] record = {Offence.OVERSPEED,
                Offence.SIGNAL_JUMP, Offence.OVERSPEED,
                Offence.NO_HELMET, Offence.OVERSPEED};

        Map<Offence, Integer> count = new EnumMap<>(Offence.class);
        for (Offence o : record) {
            count.merge(o, 1, Integer::sum);
        }

        int total = 0;
        for (Map.Entry<Offence, Integer> e : count.entrySet()) {
            int fine = e.getKey().fineFor(e.getValue());
            total += fine;
            System.out.println(e.getKey() + " x" + e.getValue()
                    + " = Rs " + fine);
        }
        System.out.println("Total = Rs " + total);
    }
}
```

**Output:**

```text
SIGNAL_JUMP x1 = Rs 1000
OVERSPEED x3 = Rs 10000
NO_HELMET x1 = Rs 500
Total = Rs 11500
```
