Try each problem on your own first, then compare with the solution.

### Easy: Restaurant Bill Splitter

A group app splits a restaurant bill of 1200 rupees equally. Sometimes a user leaves the "people" box at 0, and integer division by zero throws `ArithmeticException`. Split the bill for groups of 4, 0 and 3 people. When the division fails, print the exception message instead, and keep going with the next group. Print `bills done` at the end.

Expected output:

```text
4 people: 300 each
0 people: / by zero
3 people: 400 each
bills done
```

> **Hint:** Put the `try` inside the loop, not around it. Then one bad group does not stop the others.

**Answer:** Catching `ArithmeticException` around each single calculation turns a crash into one line of output, and the loop continues with the next group.

```java
public class BillSplitter {
    static int share(int total, int people) {
        return total / people;
    }

    public static void main(String[] args) {
        int total = 1200;
        int[] groups = {4, 0, 3};
        for (int people : groups) {
            try {
                System.out.println(people + " people: "
                        + share(total, people) + " each");
            } catch (ArithmeticException e) {
                System.out.println(people + " people: "
                        + e.getMessage());
            }
        }
        System.out.println("bills done");
    }
}
```

**Output:**

```text
4 people: 300 each
0 people: / by zero
3 people: 400 each
bills done
```

### Medium: Wallet Transfer with a Checked Exception

A payments app moves money between two wallets. Asha has 800 and Ravi has 100. Write a checked `LowBalanceException` whose message says how much money is missing. The `send` method must throw it when the amount is larger than the balance, and throw an unchecked `IllegalArgumentException` when the amount is zero or negative. Try to send 300, then 900, then -50, and print both balances at the end.

Expected output:

```text
sent 300
failed: short by 400
rejected: amount must be > 0
Asha=500, Ravi=400
```

> **Hint:** Extend `Exception` for the checked one and pass the text to `super(...)`. The compiler will then insist that `send` declares `throws LowBalanceException`. Check the amount before changing any balance.

**Answer:** The checked exception is for a normal business situation the caller should handle, while a negative amount is a caller bug, so it is unchecked. Validating first means a failed transfer never changes either balance.

```java
class LowBalanceException extends Exception {
    LowBalanceException(int shortBy) {
        super("short by " + shortBy);
    }
}

class Wallet {
    private final String owner;
    private int balance;

    Wallet(String owner, int balance) {
        this.owner = owner;
        this.balance = balance;
    }

    void send(Wallet to, int amount) throws LowBalanceException {
        if (amount <= 0) {
            throw new IllegalArgumentException("amount must be > 0");
        }
        if (amount > balance) {
            throw new LowBalanceException(amount - balance);
        }
        balance -= amount;
        to.balance += amount;
    }

    public String toString() {
        return owner + "=" + balance;
    }
}

public class WalletTransfer {
    public static void main(String[] args) {
        Wallet asha = new Wallet("Asha", 800);
        Wallet ravi = new Wallet("Ravi", 100);
        int[] amounts = {300, 900, -50};
        for (int amt : amounts) {
            try {
                asha.send(ravi, amt);
                System.out.println("sent " + amt);
            } catch (LowBalanceException e) {
                System.out.println("failed: " + e.getMessage());
            } catch (IllegalArgumentException e) {
                System.out.println("rejected: " + e.getMessage());
            }
        }
        System.out.println(asha + ", " + ravi);
    }
}
```

**Output:**

```text
sent 300
failed: short by 400
rejected: amount must be > 0
Asha=500, Ravi=400
```
