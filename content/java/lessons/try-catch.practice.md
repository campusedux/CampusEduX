Try each problem on your own first, then compare with the solution.

### Easy: Cinema Seat Reader

A cinema kiosk reads seat numbers typed by customers: `"12"`, `"A7"`, `"30"` and an empty string. Parse each one. Print `seat N booked` for a valid number and `skip [text]` for anything else. Use a `finally` block to count how many entries were checked, and print the totals at the end.

Expected output:

```text
seat 12 booked
skip [A7]
seat 30 booked
skip []
4 checked, 2 booked
```

> **Hint:** `Integer.parseInt` throws `NumberFormatException` for both `"A7"` and the empty string. Put `checked++` in `finally` so it runs on both paths.

**Answer:** The try block counts only successful bookings, the catch prints the skip line, and finally counts every entry whatever happened.

```java
public class SeatReader {
    public static void main(String[] args) {
        String[] typed = {"12", "A7", "30", ""};
        int valid = 0;
        int checked = 0;
        for (String seat : typed) {
            try {
                int n = Integer.parseInt(seat);
                System.out.println("seat " + n + " booked");
                valid++;
            } catch (NumberFormatException e) {
                System.out.println("skip [" + seat + "]");
            } finally {
                checked++;
            }
        }
        System.out.println(checked + " checked, "
                + valid + " booked");
    }
}
```

**Output:**

```text
seat 12 booked
skip [A7]
seat 30 booked
skip []
4 checked, 2 booked
```

### Medium: Gym Locker Session

A gym desk opens a locker, stores an item and must always lock it again. Write a `LockerSession` class that implements `AutoCloseable`. Its constructor prints `locker N opened`, `store` prints `stored item` or throws `IllegalStateException` when the locker is full, and `close` prints `locker N locked`. Write `deposit(number, item, full)` that uses try-with-resources, returns `"ok"` on success and `"failed: "` plus the message on failure. Test locker 4 with a gym bag and locker 9, which is full, with shoes.

Expected output:

```text
locker 4 opened
stored gym bag
locker 4 locked
ok
--
locker 9 opened
locker 9 locked
failed: locker 9 is full
```

> **Hint:** Return from inside the try block. Java closes the resource before the value reaches the caller, and before the catch block runs.

**Answer:** Try-with-resources calls `close()` on every path, so the locker is locked both after the successful return and before the failure is handled.

```java
class LockerSession implements AutoCloseable {
    private final int number;

    LockerSession(int number) {
        this.number = number;
        System.out.println("locker " + number + " opened");
    }

    void store(String item, boolean full) {
        if (full) {
            throw new IllegalStateException(
                    "locker " + number + " is full");
        }
        System.out.println("stored " + item);
    }

    @Override
    public void close() {
        System.out.println("locker " + number + " locked");
    }
}

public class LockerDesk {
    static String deposit(int number, String item, boolean full) {
        try (LockerSession s = new LockerSession(number)) {
            s.store(item, full);
            return "ok";
        } catch (IllegalStateException e) {
            return "failed: " + e.getMessage();
        }
    }

    public static void main(String[] args) {
        System.out.println(deposit(4, "gym bag", false));
        System.out.println("--");
        System.out.println(deposit(9, "shoes", true));
    }
}
```

**Output:**

```text
locker 4 opened
stored gym bag
locker 4 locked
ok
--
locker 9 opened
locker 9 locked
failed: locker 9 is full
```
