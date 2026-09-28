A busy print shop near a college does not hire a new operator every time a customer walks in with a file. It keeps two or three operators on shift. New orders go into a tray on the counter, and whichever operator is free picks up the next order. Customers get a token and come back to collect their pages.

Creating a raw `Thread` for every small job is like hiring a new operator for every customer. It works for a demo and collapses under real traffic. Java's Executor Framework gives you the print shop model instead: a fixed team of worker threads, a queue of waiting tasks and a token for each result. In this guide you will see why pools beat one thread per task, how a pool works inside, the difference between `execute` and `submit`, how `Callable` and `Future` return results, how `invokeAll` handles a batch, and how to shut a pool down cleanly.

## What is Executor Framework?

> **Definition:** The Executor Framework is the set of interfaces and classes in `java.util.concurrent` that separates submitting a task from running it. You hand tasks to an `ExecutorService`, which runs them on a managed pool of reusable threads and gives back a `Future` for each result.

The main pieces are:

- `Executor`, a tiny interface with one method, `execute(Runnable)`.
- `ExecutorService`, which adds `submit`, `invokeAll`, `shutdown` and friends.
- `Executors`, a helper class with factory methods that build ready-made pools.
- `Callable<V>`, a task that returns a value and may throw a checked exception.
- `Future<V>`, a handle to a result that may not be ready yet.

## Why is Executor Framework used?

Starting a thread is not free. The JVM asks the operating system for a native thread, reserves memory for its stack and later tears it all down. Doing that for thousands of short tasks wastes more time on setup than on work. Worse, nothing stops a sudden burst from creating ten thousand threads at once and exhausting memory.

A pool fixes both problems. Threads are created once and reused for task after task, and the pool size puts a hard limit on how many run together. Extra tasks simply wait in the queue.

The framework also gives you things raw threads lack: results through `Future`, exceptions that reach the caller instead of vanishing, batch submission, and one call to stop everything in order. Your code describes what to do, and the executor decides which thread does it.

## Real-Life Example

In the print shop, each customer's file is a task. The tray on the counter is the work queue. The operators on shift are the worker threads, and the owner who decided "three operators, no more" chose a fixed pool size. The token slip handed to each customer is a `Future`: it is not the printout itself, but you can use it later to collect the printout, waiting at the counter if it is not ready.

At closing time the owner turns the sign to "Closed". Nobody new is accepted, but the operators finish every order already in the tray. That is `shutdown()`. Standing at the door until the last operator leaves is `awaitTermination()`.

## Syntax

```java
ExecutorService pool = Executors.newFixedThreadPool(3);

pool.execute(runnableTask);             // no result
Future<Integer> f = pool.submit(callableTask);
Integer value = f.get();                // waits if needed

List<Future<Integer>> all = pool.invokeAll(tasks);

pool.shutdown();                        // no new tasks
pool.awaitTermination(10, TimeUnit.SECONDS);
```

- `newFixedThreadPool(3)` creates a pool with exactly three workers and an unbounded queue.
- `execute` runs a `Runnable` and returns nothing.
- `submit` accepts a `Runnable` or a `Callable` and returns a `Future`.
- `get()` blocks the caller until the result is ready, then returns it or throws `ExecutionException` if the task failed.
- `invokeAll` submits a whole collection and returns once every task is done, with futures in the same order as the tasks.
- `shutdown` stops new submissions, and `awaitTermination` waits for running tasks to finish, up to a time limit.

Other factory methods include `newSingleThreadExecutor()` (one worker, tasks in order), `newCachedThreadPool()` (grows and shrinks with demand) and `newScheduledThreadPool(n)` (delayed and repeating tasks).

## How Executor Framework Works

A fixed pool is a queue plus a set of long-lived worker threads.

```text
 main: submit(job1..job5)
          |
          v
+---------------------+
| work queue          |
| job5  job4  job3    |
+---------------------+
     |           |
     | take      | take
     v           v
+----------+ +----------+
| worker 1 | | worker 2 |
| job1     | | job2     |
+----------+ +----------+
     |           |
     v           v
 Future 1     Future 2
 completed    completed
```

When you call `submit`, the executor wraps your task in a `FutureTask`, returns it to you as a `Future` and places it in the queue. Each worker runs a loop: take a task from the queue, run it, store the result or exception inside its `Future`, then take the next one. If the queue is empty, the worker waits. Because free workers grab tasks as they come, two tasks submitted in one order may finish in another. Your code stays predictable by keeping the futures in a list and calling `get()` on them in submission order.

## Example Programs

### Callable jobs with Future results

```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

class PrintJob implements Callable<String> {
    private final String file;
    private final int pages;

    PrintJob(String file, int pages) {
        this.file = file;
        this.pages = pages;
    }

    @Override
    public String call() {
        int cost = pages * 2;
        return file + ": " + pages + " pages, Rs " + cost;
    }
}

public class PrintShop {
    public static void main(String[] args)
            throws InterruptedException, ExecutionException {
        ExecutorService printers = Executors.newFixedThreadPool(2);
        List<Future<String>> receipts = new ArrayList<>();

        receipts.add(printers.submit(new PrintJob("menu.pdf", 4)));
        receipts.add(printers.submit(new PrintJob("thesis.pdf", 120)));
        receipts.add(printers.submit(new PrintJob("flyer.pdf", 2)));
        receipts.add(printers.submit(new PrintJob("ledger.xls", 9)));

        for (Future<String> r : receipts) {
            System.out.println(r.get());
        }
        printers.shutdown();
        System.out.println("jobs done: " + receipts.size());
    }
}
```

**Output:**

```text
menu.pdf: 4 pages, Rs 8
thesis.pdf: 120 pages, Rs 240
flyer.pdf: 2 pages, Rs 4
ledger.xls: 9 pages, Rs 18
jobs done: 4
```

Two workers share four jobs, and the finishing order can differ between runs. The receipts still print in submission order because `main` reads each `Future` from the list in turn.

### A batch with invokeAll and a failed job

```java
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class BatchPrint {
    static Callable<Integer> job(String name, int pages) {
        return () -> {
            if (pages <= 0) {
                throw new IllegalStateException("no pages");
            }
            return pages;
        };
    }

    public static void main(String[] args)
            throws InterruptedException {
        String[] names = {"poster", "blank", "report"};
        List<Callable<Integer>> batch = Arrays.asList(
                job("poster", 3), job("blank", 0),
                job("report", 25));

        ExecutorService pool = Executors.newFixedThreadPool(3);
        List<Future<Integer>> results = pool.invokeAll(batch);
        pool.shutdown();

        int total = 0;
        for (int i = 0; i < results.size(); i++) {
            try {
                int pages = results.get(i).get();
                total += pages;
                System.out.println(names[i] + " -> " + pages);
            } catch (ExecutionException e) {
                System.out.println(names[i] + " -> failed: "
                        + e.getCause().getMessage());
            }
        }
        System.out.println("pages printed: " + total);
    }
}
```

**Output:**

```text
poster -> 3
blank -> failed: no pages
report -> 25
pages printed: 28
```

The exception thrown inside the "blank" task did not crash the pool. It was stored in that task's `Future`, and `get()` rethrew it wrapped in an `ExecutionException`, with the original error available from `getCause()`.

### execute, shutdown and awaitTermination

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class ClosingTime {
    public static void main(String[] args)
            throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        AtomicInteger sheets = new AtomicInteger();
        int[] orders = {40, 15, 60, 25, 10};

        for (int pages : orders) {
            pool.execute(() -> sheets.addAndGet(pages));
        }

        pool.shutdown();
        boolean finished =
                pool.awaitTermination(5, TimeUnit.SECONDS);

        System.out.println("finished in time: " + finished);
        System.out.println("is shut down    : "
                + pool.isShutdown());
        System.out.println("is terminated   : "
                + pool.isTerminated());
        System.out.println("sheets used     : " + sheets.get());

        try {
            pool.execute(() -> sheets.addAndGet(5));
        } catch (RejectedExecutionException e) {
            System.out.println("late order      : rejected");
        }
    }
}
```

**Output:**

```text
finished in time: true
is shut down    : true
is terminated   : true
sheets used     : 150
late order      : rejected
```

`execute` gives back nothing, so the tasks add to a thread-safe `AtomicInteger` instead. After `shutdown`, queued orders still finish, `awaitTermination` waits for them, and any new task is rejected.

## execute() vs submit()

| Point | execute() | submit() |
|---|---|---|
| Declared in | `Executor` | `ExecutorService` |
| Accepts | `Runnable` only | `Runnable` or `Callable` |
| Returns | `void` | A `Future` |
| Result value | None | From `Future.get()` |
| Task exception | Goes to the thread's handler | Stored, rethrown by `get()` |
| Cancel later | Not possible | `future.cancel(true)` |

Use `submit` whenever you need a result, want to handle a task's failure in the caller, or might cancel the task. `execute` is fine for fire-and-forget work.

## Common Mistakes

> **Warning:** Forgetting `shutdown()` keeps the pool's worker threads alive, and because they are not daemon threads, your program may never exit after `main` returns.

- **Calling `get()` right after each `submit`.** That waits for every task before submitting the next, which turns the pool into a slow single line. Submit everything first, then collect.
- **Ignoring the `Future` from `submit`.** An exception inside the task is stored there. If nobody calls `get()`, the failure disappears without a trace.
- **Using an unbounded cached pool for heavy load.** `newCachedThreadPool` can create a thread per waiting task. Pick a fixed size for CPU-bound work.
- **Printing from inside tasks.** The lines interleave in a different order each run. Return values and print from one place.

## Interview Questions

**Why use a thread pool instead of creating a new thread per task?**
Threads are costly to create and destroy, and an unlimited number of them can exhaust memory. A pool reuses a fixed set of threads, caps how many run at once and queues the rest.

**What is the difference between Runnable and Callable?**
`Runnable.run()` returns nothing and cannot throw checked exceptions. `Callable.call()` returns a value and may throw a checked exception, which the executor stores in the `Future`.

**What does Future.get() do if the task threw an exception?**
It throws an `ExecutionException`. The original exception from the task is available through `getCause()`.

**What is the difference between shutdown() and shutdownNow()?**
`shutdown()` stops accepting new tasks but lets queued and running tasks finish. `shutdownNow()` also removes waiting tasks from the queue, returns them as a list and interrupts the running ones.

**What does invokeAll return?**
It returns a list of futures in the same order as the submitted tasks, and only after every task has completed, normally or with an exception.

## Summary

- The Executor Framework separates submitting a task from the thread that runs it.
- A pool reuses a fixed set of worker threads that take tasks from a queue.
- `Executors` builds common pools: fixed, cached, single-thread and scheduled.
- `submit` returns a `Future`; `get()` waits for the result or rethrows the task's error.
- `invokeAll` runs a batch and returns futures in submission order.
- Always call `shutdown()`, and use `awaitTermination()` when you must wait for the work to finish.

## Related Topics

- [Callable and Future](/learning/java-tutorial/callable-and-future): tasks that return values, in more detail.
- [Runnable](/learning/java-tutorial/runnable): the no-result task that `execute` accepts.
- [Synchronization](/learning/java-tutorial/synchronization): protecting data that pooled tasks share.
- [Thread](/learning/java-tutorial/thread): the lower-level building block every pool uses.
