Try each problem on your own first, then compare with the solution.

### Easy: Mask a Phone Number

Before an SMS log is shown to support staff, each phone number must hide all but its last four digits. Using a `StringBuilder` and `setCharAt`, mask the numbers `9845012345` and `7022119087`, replacing every hidden digit with `*`.

Expected output:

```text
9845012345 -> ******2345
7022119087 -> ******9087
```

> **Hint:** Create the builder from the number, then loop from index 0 up to `length() - 4` and set each of those characters to `'*'`.

**Answer:** The builder lets you change single characters in place, which a `String` cannot do, and `toString()` gives the masked copy while the original number stays untouched.

```java
public class MaskNumber {
    static String mask(String phone) {
        StringBuilder sb = new StringBuilder(phone);
        for (int i = 0; i < sb.length() - 4; i++) {
            sb.setCharAt(i, '*');
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        String[] phones = {"9845012345", "7022119087"};
        for (String p : phones) {
            System.out.println(p + " -> " + mask(p));
        }
    }
}
```

**Output:**

```text
9845012345 -> ******2345
7022119087 -> ******9087
```

### Medium: Compress a Delivery Status Log

An SMS gateway records one letter per message: `D` for delivered, `S` for sent and `F` for failed. Long runs of the same letter are common, so the log is stored in a short form: each letter followed by how many times it repeats in a row. Compress the logs `DDDSSFFFF`, `SDD` and `DDDDDDDDDDDD` with a `StringBuilder`.

Expected output:

```text
DDDSSFFFF: D3S2F4
SDD: S1D2
DDDDDDDDDDDD: D12
```

> **Hint:** Walk the string once while counting the current run. When the next letter is different, or you reach the end, append the letter and its count, then reset the count to 1.

**Answer:** One pass with a counter finds every run, and appending to a single builder keeps the work linear, where `+=` would copy the growing result on every run.

```java
public class StatusLog {
    static String compress(String log) {
        StringBuilder out = new StringBuilder();
        int run = 1;
        for (int i = 1; i <= log.length(); i++) {
            if (i < log.length()
                    && log.charAt(i) == log.charAt(i - 1)) {
                run++;
            } else {
                out.append(log.charAt(i - 1)).append(run);
                run = 1;
            }
        }
        return out.toString();
    }

    public static void main(String[] args) {
        String[] logs = {"DDDSSFFFF", "SDD", "DDDDDDDDDDDD"};
        for (String log : logs) {
            System.out.println(log + ": " + compress(log));
        }
    }
}
```

**Output:**

```text
DDDSSFFFF: D3S2F4
SDD: S1D2
DDDDDDDDDDDD: D12
```
