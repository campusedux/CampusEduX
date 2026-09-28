Try each problem on your own first, then compare with the solution.

### Easy: Matching a Typed Destination

A ticket machine receives four destination names: the literal `"Airport"`, a `new String("Airport")`, the text `"Airport"` built with a `StringBuilder` from `"Air"` and `"port"`, and the literal `"Market"`. Count how many of them match `"Airport"` when compared with `==`, and how many match with `equals()`.

Expected output:

```text
== matches     : 1
equals matches : 3
```

> **Hint:** Only the literal points at the pooled "Airport". The other two equal strings are separate heap objects.

**Answer:** `==` finds only the one reference that shares the pooled object, while `equals()` compares the characters and finds all three. Writing the literal first, `"Airport".equals(t)`, also avoids a crash if `t` is ever `null`.

```java
public class DestinationMatch {
    public static void main(String[] args) {
        String[] typed = {
            "Airport",
            new String("Airport"),
            new StringBuilder("Air").append("port").toString(),
            "Market"
        };
        int byRef = 0;
        int byText = 0;
        for (String t : typed) {
            if (t == "Airport") {
                byRef++;
            }
            if ("Airport".equals(t)) {
                byText++;
            }
        }
        System.out.println("== matches     : " + byRef);
        System.out.println("equals matches : " + byText);
    }
}
```

**Output:**

```text
== matches     : 1
equals matches : 3
```

### Medium: A Pool of Your Own

A depot reads six stop names at run time: Swargate, Hadapsar, Swargate, Katraj, Hadapsar, Swargate. Each one arrives as a fresh `new String` object. Write a small `NamePool` class that works like `intern()`: `canonical(name)` returns the stored object for equal text, or stores the new one and returns it. Print how many names were read, the pool size, how many lookups reused an old object, and whether positions 0 and 2, 1 and 4, and 0 and 3 now share one object.

Expected output:

```text
names read : 6
pool size  : 3
reused     : 3
0 same as 2: true
1 same as 4: true
0 same as 3: false
```

> **Hint:** `Map.putIfAbsent(key, value)` returns the value already stored for that key, or `null` when it stored yours.

**Answer:** A `HashMap` from text to its first object is exactly the idea behind the String pool: equal text is found by hashing, and every later request gets the stored object instead of its own copy.

```java
import java.util.HashMap;
import java.util.Map;

class NamePool {
    private final Map<String, String> table = new HashMap<>();
    private int reused;

    String canonical(String name) {
        String old = table.putIfAbsent(name, name);
        if (old != null) {
            reused++;
            return old;
        }
        return name;
    }

    int size() { return table.size(); }
    int reused() { return reused; }
}

public class DepotPool {
    public static void main(String[] args) {
        String[] parts = {"Swargate", "Hadapsar", "Swargate",
                          "Katraj", "Hadapsar", "Swargate"};
        NamePool pool = new NamePool();
        String[] names = new String[parts.length];

        for (int i = 0; i < parts.length; i++) {
            String built = new String(parts[i]);
            names[i] = pool.canonical(built);
        }

        System.out.println("names read : " + names.length);
        System.out.println("pool size  : " + pool.size());
        System.out.println("reused     : " + pool.reused());
        System.out.println("0 same as 2: " + (names[0] == names[2]));
        System.out.println("1 same as 4: " + (names[1] == names[4]));
        System.out.println("0 same as 3: " + (names[0] == names[3]));
    }
}
```

**Output:**

```text
names read : 6
pool size  : 3
reused     : 3
0 same as 2: true
1 same as 4: true
0 same as 3: false
```
