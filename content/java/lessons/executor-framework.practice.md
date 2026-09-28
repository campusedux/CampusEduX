Try each problem on your own first, then compare with the solution.

### Easy: Quoting Ink Costs in a Pool

A print shop quotes four files. Colour pages cost Rs 10 and grey pages cost Rs 2. The files are brochure (12 colour, 4 grey), invoice (0 colour, 3 grey), banner (30 colour, 0 grey) and memo (1 colour, 5 grey). Use a fixed pool of two threads and one `Callable<Integer>` per file to work out each quote. Print every quote in the order the files were listed, then the total.

Expected output:

```text
brochure: Rs 128
invoice: Rs 6
banner: Rs 300
memo: Rs 20
total: Rs 454
```

> **Hint:** Submit all four tasks first and keep the futures in a `List`. Then loop over the list and call `get()` on each one.

**Answer:** Each quote is a small `Callable` that returns a number. Reading the futures in list order keeps the output fixed, even though the two workers may finish the tasks in any order.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class InkCost {
    public static void main(String[] args)
            throws InterruptedException, ExecutionException {
        String[] files = {"brochure", "invoice", "banner", "memo"};
        int[] colorPages = {12, 0, 30, 1};
        int[] greyPages = {4, 3, 0, 5};

        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Future<Integer>> costs = new ArrayList<>();
        for (int i = 0; i < files.length; i++) {
            int c = colorPages[i];
            int g = greyPages[i];
            Callable<Integer> quote = () -> c * 10 + g * 2;
            costs.add(pool.submit(quote));
        }

        int total = 0;
        for (int i = 0; i < files.length; i++) {
            int cost = costs.get(i).get();
            total += cost;
            System.out.println(files[i] + ": Rs " + cost);
        }
        pool.shutdown();
        System.out.println("total: Rs " + total);
    }
}
```

**Output:**

```text
brochure: Rs 128
invoice: Rs 6
banner: Rs 300
memo: Rs 20
total: Rs 454
```

### Medium: Splitting a Long Print Run

A 10,000-page print run needs colour ink on every page whose number is divisible by 7 or by 11. Split pages 1 to 10,000 into four equal chunks, count the colour pages of each chunk in its own `Callable`, and run all four with `invokeAll`. Print each chunk's count, the total, and whether the total matches a plain single-threaded count.

Expected output:

```text
chunk 1: 552
chunk 2: 552
chunk 3: 551
chunk 4: 553
color pages: 2208
same as one thread: true
```

> **Hint:** Chunk `c` (starting from 0) covers pages `c * 2500 + 1` to `(c + 1) * 2500`. Copy the bounds into local variables before building each lambda.

**Answer:** Each chunk is independent, so the tasks share no data and need no locks. `invokeAll` returns the futures in the order the chunks were created, which keeps the per-chunk lines stable.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class ColorScan {
    static boolean isColor(int page) {
        return page % 7 == 0 || page % 11 == 0;
    }

    static int countColor(int from, int to) {
        int n = 0;
        for (int p = from; p <= to; p++) {
            if (isColor(p)) n++;
        }
        return n;
    }

    public static void main(String[] args)
            throws InterruptedException, ExecutionException {
        int pages = 10_000;
        int chunks = 4;
        int size = pages / chunks;

        List<Callable<Integer>> tasks = new ArrayList<>();
        for (int c = 0; c < chunks; c++) {
            int from = c * size + 1;
            int to = (c + 1) * size;
            tasks.add(() -> countColor(from, to));
        }

        ExecutorService pool = Executors.newFixedThreadPool(4);
        int total = 0;
        List<Future<Integer>> parts = pool.invokeAll(tasks);
        for (int c = 0; c < chunks; c++) {
            int part = parts.get(c).get();
            total += part;
            System.out.println("chunk " + (c + 1) + ": " + part);
        }
        pool.shutdown();

        System.out.println("color pages: " + total);
        System.out.println("same as one thread: "
                + (total == countColor(1, pages)));
    }
}
```

**Output:**

```text
chunk 1: 552
chunk 2: 552
chunk 3: 551
chunk 4: 553
color pages: 2208
same as one thread: true
```
