The first time you install Java, the download page throws three short names at you: JDK, JRE and JVM. They sound alike, and many beginners assume they are one product. They are not. Each has a clear job, and they fit inside each other like boxes.

Once you see how the three connect, a lot of Java makes sense: why you compile with one command and run with another, and why a `.class` file built on Windows runs on a Linux server. Here you will open each box, follow a program from source file to machine code, and run small programs that show the JVM at work.

## What are JDK, JRE and JVM?

> **Definition:** The **JVM** (Java Virtual Machine) is the engine that loads and runs Java bytecode. The **JRE** (Java Runtime Environment) is the JVM plus the standard class library a program needs at run time. The **JDK** (Java Development Kit) is the JRE plus the tools developers use to write, compile and package programs.

So the relationship is containment:

```text
+--------------------------------+
| JDK                            |
|  javac, jar, javadoc, jshell,  |
|  jlink, jdb ...                |
|  +--------------------------+  |
|  | JRE                      |  |
|  |  class library (java.*)  |  |
|  |  +--------------------+  |  |
|  |  | JVM                |  |  |
|  |  |  class loader,     |  |  |
|  |  |  verifier, JIT,    |  |  |
|  |  |  garbage collector |  |  |
|  |  +--------------------+  |  |
|  +--------------------------+  |
+--------------------------------+
```

The outer box is what a developer installs. The middle box is what a finished program needs to run. The inner box is the engine that executes the code. Install the JDK and you get all three.

One detail has changed over the years. Up to Java 8, Oracle offered a separate JRE download for people who only wanted to run programs. Since Java 11 that separate JRE is gone. You install a JDK, and to ship an application you can use the JDK tool `jlink` to build a small custom runtime that contains only the parts of the platform your program uses.

## Why are JDK, JRE and JVM used?

Splitting Java into three layers solves three different problems.

- **The JVM gives portability.** Your code is compiled to bytecode, not to one CPU's instructions. Any machine with a JVM can run it.
- **The JVM gives safety.** It checks bytecode before running it, manages memory with a garbage collector and stops bad array indexes instead of corrupting memory.
- **The JVM gives speed over time.** Its JIT compiler turns frequently used code into native machine code while the program runs.
- **The JRE gives a ready library.** Collections, strings, dates, networking and much more are already there, so programs stay small.
- **The JDK gives developer tools.** The compiler, debugger, documentation generator and packaging tools live here, and end users never need them.

## Real-Life Example

Think of a film studio. The studio has cameras, editing suites and sound desks, and it also has a screening room to watch the finished film. That whole studio is the **JDK**: tools to make the film, plus a way to play it.

A cinema hall does not need cameras. It only needs a projector, a screen and speakers. That is the **JRE**: everything required to show a finished film, nothing for making one.

The projector itself is the **JVM**. It takes the reel and turns it into light and sound on this particular screen.

The film reel is the bytecode. The studio produces the reel once, and every cinema in the world plays it on its own projector, whatever brand that projector is. That is platform independence: one `.class` file, many different JVMs for Windows, Linux or macOS, each translating the same bytecode for its own machine.

## Syntax

There is no special syntax here. You write an ordinary class, and the JDK tools do the rest.

```java
public class FuelPump {
    // fields, methods and a main method
    // the JVM calls main to start the program
}
```

```bash
javac FuelPump.java      # JDK tool: source to bytecode
java FuelPump            # starts a JVM and runs main
javap -c FuelPump        # JDK tool: show the bytecode
```

- The file name must match the public class name.
- `javac` is the compiler that ships with the JDK. It checks your code and writes `FuelPump.class`, which contains bytecode. It prints nothing when compilation succeeds.
- `java` is the launcher. It starts a JVM, loads the class and calls `main`. Note that you give it the class name, not the file name.
- `javap -c` is a JDK tool that disassembles a class file, so you can read the bytecode instructions `javac` produced.

## How JDK, JRE and JVM Work Together

Here is the full journey of a program from your editor to the processor.

```text
 FuelBill.java   (source)
       |
       | javac  (JDK)
       v
 FuelBill.class  (bytecode)
       |
       | java FuelBill
       v
+------------------------------+
| JVM (inside the JRE)         |
|   class loader               |
|        |                     |
|        v                     |
|   bytecode verifier          |
|        |                     |
|        v                     |
|   interpreter + JIT compiler |
+------------------------------+
       |
       v
 native machine code (CPU/OS)
```

First, `javac` from the JDK turns the source file into bytecode, a compact set of instructions for an imaginary machine rather than for a real CPU. When you type `java FuelBill`, a JVM starts. Its **class loader** finds the class file and loads it, and it loads other classes lazily, only when they are first used. Core classes like `String` come from the bootstrap loader; your own classes come from the application loader, which Java 9 and later names `app`.

Next, the **bytecode verifier** checks that the loaded code is well formed and type safe, so a broken or hostile class file cannot crash the JVM. Then the **interpreter** starts running the bytecode instruction by instruction. The JVM counts how often each method runs. When a method becomes "hot", the **JIT (just-in-time) compiler** translates it into native machine code for the current CPU and caches it. From then on that method runs at full native speed. This is why Java programs warm up: slow for the first moments, fast afterwards.

## Example Programs

### A program that reports its own loaders

```java
import java.util.Locale;

public class FuelBill {
    public static void main(String[] args) {
        double litres = 12.5;
        double pricePerLitre = 104.2;
        double bill = litres * pricePerLitre;

        ClassLoader mine = FuelBill.class.getClassLoader();
        ClassLoader core = String.class.getClassLoader();

        System.out.println("class  : " + FuelBill.class.getName());
        System.out.println("loader : " + mine.getName());
        System.out.println("String : "
                + (core == null ? "bootstrap" : core.getName()));
        System.out.println("bill   : "
                + String.format(Locale.ROOT, "%.2f", bill));
    }
}
```

**Output:**

```text
class  : FuelBill
loader : app
String : bootstrap
bill   : 1302.50
```

Your class was loaded by the application loader, while `String` came from the bootstrap loader built into the JVM. Java represents the bootstrap loader as `null`, so the program prints a friendly name instead.

### The same answers on every machine

```java
public class SameOnEveryPump {
    public static void main(String[] args) {
        System.out.println("int bits   : " + Integer.SIZE);
        System.out.println("long bits  : " + Long.SIZE);
        System.out.println("char bytes : " + Character.BYTES);

        int meter = Integer.MAX_VALUE;
        meter = meter + 1;
        System.out.println("overflow   : " + meter);

        long paise = 0;
        for (int sale = 1; sale <= 1000; sale++) {
            paise += sale * 37L;
        }
        System.out.println("paise sum  : " + paise);
    }
}
```

**Output:**

```text
int bits   : 32
long bits  : 64
char bytes : 2
overflow   : -2147483648
paise sum  : 18518500
```

The Java language fixes the size of every primitive type, and the JVM follows those rules exactly. So this output is identical on a Windows laptop, a Linux server or a Mac, even the overflow.

### Classes load only when needed

```java
class Nozzle {
    static {
        System.out.println("  [JVM loads Nozzle]");
    }

    static String dispense(int litres) {
        return litres + " L dispensed";
    }
}

class Receipt {
    static {
        System.out.println("  [JVM loads Receipt]");
    }

    static String print(int litres) {
        return "receipt for " + litres + " L";
    }
}

public class LazyPump {
    public static void main(String[] args) {
        System.out.println("main starts");
        System.out.println(Nozzle.dispense(20));
        System.out.println(Nozzle.dispense(5));
        System.out.println("before receipt");
        System.out.println(Receipt.print(25));
    }
}
```

**Output:**

```text
main starts
  [JVM loads Nozzle]
20 L dispensed
5 L dispensed
before receipt
  [JVM loads Receipt]
receipt for 25 L
```

A static block runs once, when the JVM initialises the class. Each message appears just before first use, not at start-up.

## JDK vs JRE vs JVM

| Point | JDK | JRE | JVM |
|---|---|---|---|
| Full name | Java Development Kit | Java Runtime Environment | Java Virtual Machine |
| Main job | Build programs | Run programs | Execute bytecode |
| Contains | JRE + dev tools | JVM + class library | Loader, verifier, JIT, GC |
| Has `javac`? | Yes | No | No |
| Who needs it | Developers | Users (up to Java 8) | Every Java program |
| Platform specific? | Yes | Yes | Yes |

Notice the last row: the bytecode is portable, but all three are built separately for each operating system.

## Common Mistakes

> **Common mistake:** Typing `java FuelBill.class` or running `java` before `javac`. The launcher expects the class name, and the class file must already exist. Since Java 11 you can also run a single source file directly with `java FuelBill.java`, but that still compiles it in memory first.

- **Thinking the JVM is platform independent.** The bytecode is portable; the JVM is not. You install a different JVM for each operating system.
- **Looking for a JRE download for Java 11 or later.** It no longer exists separately. Install a JDK, or use `jlink` to ship a trimmed runtime.
- **Mixing versions.** Code compiled for Java 17 will not load on a Java 11 JVM. Use `javac --release 11` to target the older version.
- **Confusing JIT with javac.** `javac` produces bytecode ahead of time. The JIT runs inside the JVM and produces machine code while the program runs.

## Interview Questions

**What is the difference between the JDK, JRE and JVM?**
The JVM executes bytecode. The JRE is the JVM plus the standard class library needed at run time. The JDK is the JRE plus development tools such as `javac`, `jar` and `jdb`.

**Is the JVM platform independent?**
No. Bytecode is platform independent, but each operating system and CPU needs its own JVM build. The JVM is the platform-specific layer that makes the bytecode portable.

**What does the JIT compiler do?**
It watches which methods run often and compiles those hot methods from bytecode into native machine code at run time. Later calls use the compiled code, so the program runs faster after it warms up.

**What is the role of the bytecode verifier?**
It checks every loaded class before execution, making sure the bytecode follows the rules of the JVM, such as correct types and valid jumps. This stops corrupted or malicious class files from breaking the JVM.

**Why is there no separate JRE since Java 11?**
Oracle stopped shipping a one-size runtime. Developers install a JDK and use `jlink` to build a custom runtime that contains only what their application needs.

## Summary

- The JDK contains the JRE, and the JRE contains the JVM.
- `javac` from the JDK turns `.java` source into `.class` bytecode.
- The JVM loads classes on demand, verifies them, interprets them and JIT-compiles hot code.
- Bytecode is portable; each operating system has its own JVM that runs it.
- Primitive sizes are fixed by Java, so results are the same everywhere.
- Since Java 11 there is no separate JRE; `jlink` builds a custom runtime instead.

## Related Topics

- [How Java Works](/learning/java-tutorial/how-java-works): the compile and run cycle from another angle.
- [JVM Architecture](/learning/java-tutorial/jvm-architecture): the inside of the JVM, area by area.
- [Class Loading](/learning/java-tutorial/class-loading): how loaders find and initialise classes.
- [Installing Java](/learning/java-tutorial/installing-java): set up a JDK and run your first `javac`.
