Try each problem on your own first, then compare with the solution.

### Easy: Which Passes Are Still Reachable?

An event hall keeps entry passes in a rack of five slots, and it issues passes P0 to P4 into slots 0 to 4. Then three things happen: slot 1 is set to `null`, slot 3 is pointed at the same pass as slot 0, and slot 4 gets a brand-new pass P5. Treat the rack as the only root. Print how many passes were issued, which passes the rack can still reach (sorted), and which passes are now eligible for garbage collection.

Expected output:

```text
issued   : 6
reachable: [P0, P2, P5]
eligible : [P1, P3, P4]
```

> **Hint:** Record each pass's code in a static list when it is created. Collect the rack's non-null entries into an identity-based set, so the shared P0 is counted once.

**Answer:** A pass is reachable only if some slot still refers to it. P1 lost its slot to `null`, P3 lost it when the slot was pointed at P0, and P4 lost it when the slot got P5. Only the codes are stored in the log, so the log itself keeps no pass alive.

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Set;

class Pass {
    static final List<String> issued = new ArrayList<>();
    final String code;

    Pass(String code) {
        this.code = code;
        issued.add(code);
    }
}

public class TicketRack {
    public static void main(String[] args) {
        Pass[] rack = new Pass[5];
        for (int i = 0; i < rack.length; i++) {
            rack[i] = new Pass("P" + i);
        }

        rack[1] = null;
        rack[3] = rack[0];
        rack[4] = new Pass("P5");

        Set<Pass> reachable = Collections.newSetFromMap(
                new IdentityHashMap<>());
        for (Pass p : rack) {
            if (p != null) reachable.add(p);
        }

        List<String> live = new ArrayList<>();
        for (Pass p : reachable) live.add(p.code);
        Collections.sort(live);

        List<String> eligible = new ArrayList<>(Pass.issued);
        eligible.removeAll(live);

        System.out.println("issued   : " + Pass.issued.size());
        System.out.println("reachable: " + live);
        System.out.println("eligible : " + eligible);
    }
}
```

**Output:**

```text
issued   : 6
reachable: [P0, P2, P5]
eligible : [P1, P3, P4]
```

### Medium: Ageing Objects Through Minor Collections

Model the young and old generations. Objects start in the young generation with age 0. At each minor GC, young objects that are no longer used are freed, survivors get one year older, and any survivor that reaches age 2 is promoted to the old generation. Run this plan and print the result of every collection:

- allocate Flyer1, Flyer2, Guests, Stage; minor GC 1 with Guests and Stage still used
- allocate Flyer3, Flyer4; minor GC 2 with Guests, Stage and Flyer4 still used
- allocate Flyer5; minor GC 3 with Guests, Stage and Flyer5 still used

Expected output:

```text
minor GC 1: freed 2
  young [Guests, Stage]
  old   []
minor GC 2: freed 1
  young [Flyer4]
  old   [Guests, Stage]
minor GC 3: freed 1
  young [Flyer5]
  old   [Guests, Stage]
```

> **Hint:** Keep the young generation in a `LinkedHashMap` from name to age, so the print order is fixed, and the old generation in a `List`. Build a fresh young map during each collection.

**Answer:** Short-lived flyers are freed by cheap minor collections, while long-lived objects like the guest list survive twice and move to the old generation, where minor collections no longer look at them.

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AgingDemo {
    static final int PROMOTE_AT = 2;
    static Map<String, Integer> young = new LinkedHashMap<>();
    static List<String> old = new ArrayList<>();

    static void allocate(String... names) {
        for (String n : names) young.put(n, 0);
    }

    static void minorGc(int round, String... stillUsed) {
        List<String> used = Arrays.asList(stillUsed);
        Map<String, Integer> next = new LinkedHashMap<>();
        int freed = 0;
        for (Map.Entry<String, Integer> e : young.entrySet()) {
            if (!used.contains(e.getKey())) {
                freed++;
                continue;
            }
            int age = e.getValue() + 1;
            if (age >= PROMOTE_AT) old.add(e.getKey());
            else next.put(e.getKey(), age);
        }
        young = next;
        System.out.println("minor GC " + round + ": freed "
                + freed);
        System.out.println("  young " + young.keySet());
        System.out.println("  old   " + old);
    }

    public static void main(String[] args) {
        allocate("Flyer1", "Flyer2", "Guests", "Stage");
        minorGc(1, "Guests", "Stage");
        allocate("Flyer3", "Flyer4");
        minorGc(2, "Guests", "Stage", "Flyer4");
        allocate("Flyer5");
        minorGc(3, "Guests", "Stage", "Flyer5");
    }
}
```

**Output:**

```text
minor GC 1: freed 2
  young [Guests, Stage]
  old   []
minor GC 2: freed 1
  young [Flyer4]
  old   [Guests, Stage]
minor GC 3: freed 1
  young [Flyer5]
  old   [Guests, Stage]
```
