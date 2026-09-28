Look at any parcel that a courier company delivers. It carries a tracking code, a sender's city, a receiver's city and a short note like "fragile". Every one of those is text. Almost every real Java program works with text in the same way: names, codes, messages, addresses, search boxes. In Java all of that text lives in one class, `String`.

You have used strings since your first `System.out.println`. Here you will see what a string really is, why Java never lets you change one, where strings sit in memory, and why `==` can fool you. By the end you will also know when to reach for `StringBuilder` instead.

## What is a String?

> **Definition:** A `String` in Java is an object that holds a fixed sequence of characters. It belongs to the `java.lang` package, and once a `String` object is created, its characters can never be changed.

A string is not a primitive like `int` or `char`. It is a full class with dozens of methods. Java gives it two special privileges, though. You can create one with a plain literal in double quotes, and you can join strings with the `+` operator. No other class gets that treatment.

Inside, a modern `String` keeps its characters in a private byte array. You never touch that array directly. You only call methods, and none of those methods modify it.

## Why is String used?

Text is everywhere, and Java needed one safe, shared way to handle it.

- **Safety.** Because a string cannot change, you can pass it to any method without fear. A file path, a database password or a URL stays exactly as you wrote it.
- **Sharing.** Identical literals can point to one object, so a program with the same city name in a thousand places stores it once.
- **Thread safety for free.** Many threads can read the same string at once. Nobody can change it, so nobody can break it.
- **Fast hash keys.** A string caches its hash code after the first calculation. That makes strings excellent keys in a `HashMap`.
- **Rich tools.** Methods for searching, cutting, comparing and changing case save you from writing loops by hand.

## Real-Life Example

Think of a printed shipping label stuck on a box. Once the printer produces it, nobody edits the ink. If the address is wrong, the clerk prints a brand new label and sticks that one on instead. The old label is simply thrown away.

A Java string behaves the same. Calling `toUpperCase()` does not repaint the old text. It prints a new label and hands it to you. The variable is like the box: you can stick a different label on it, but the label itself never changes. And when two parcels go to the same well-known hub, the office reuses one pre-printed hub sticker instead of printing a fresh one every time. That shared sticker drawer is the String pool.

## Syntax

```java
String a = "text";              // literal, uses the pool
String b = new String("text");  // forces a new heap object
String c = a + " more";         // joining creates a new string
int n = a.length();             // call any String method
boolean same = a.equals(b);     // compare the characters
```

- The first line creates a literal. Java looks for `"text"` in the String pool and reuses it if it already exists.
- The second line uses `new`, which always creates a separate object on the heap, even if the pool already has the same text.
- The third line joins two strings with `+`. The result is a brand new string object.
- The fourth line calls a method. Strings have many, like `length`, `charAt`, `substring` and `indexOf`.
- The last line compares the characters. This is how you check if two strings hold the same text.

## How String Works in Memory

Java stores every object on the heap. Inside the heap it keeps a special area called the String pool, where literals live.

```text
 Stack       Heap
+------+   +------------------+
| hubA-+-->| String pool      |
| hubB-+-->|  "BLR-HUB"       |
|      |   +------------------+
| hubC-+-->  "BLR-HUB" (new)
+------+   normal heap area
```

When the compiler sees the literal `"BLR-HUB"` twice, the JVM places it in the pool only once. Both `hubA` and `hubB` get the address of that single object. The line with `new String("BLR-HUB")` skips the pool and builds a second object in the normal heap area, so `hubC` points somewhere else. The two objects hold the same letters, but they are different objects.

This explains the classic trap. The `==` operator compares addresses, not letters. So `hubA == hubB` is true because they share one object, but `hubA == hubC` is false. The `equals()` method compares the characters one by one, so it is true for all three. The `intern()` method returns the pooled copy of a string, which is why `hubC.intern() == hubA` is true.

Immutability is what makes this sharing safe. If one variable could edit the pooled "BLR-HUB", every other variable pointing to it would silently change too.

## Example Programs

### Immutability and the pool

```java
public class ParcelCodes {
    public static void main(String[] args) {
        String code = "pkg-4471";
        String upper = code.toUpperCase();
        System.out.println("code  : " + code);
        System.out.println("upper : " + upper);

        String hubA = "BLR-HUB";
        String hubB = "BLR-HUB";
        String hubC = new String("BLR-HUB");

        System.out.println("A == B      : " + (hubA == hubB));
        System.out.println("A == C      : " + (hubA == hubC));
        System.out.println("A equals C  : " + hubA.equals(hubC));
        System.out.println("A == intern : "
                + (hubA == hubC.intern()));
    }
}
```

**Output:**

```text
code  : pkg-4471
upper : PKG-4471
A == B      : true
A == C      : false
A equals C  : true
A == intern : true
```

`toUpperCase()` returned a new string and left `code` untouched. The last four lines match the memory diagram exactly.

### Reading a parcel label with common methods

```java
public class LabelReader {
    public static void main(String[] args) {
        String label = "  pune>mumbai|2.5kg|FRAGILE  ";
        String clean = label.trim();

        String[] parts = clean.split("\\|");
        String route = parts[0];
        int arrow = route.indexOf('>');
        String from = route.substring(0, arrow);
        String to = route.substring(arrow + 1);

        System.out.println("length   : " + clean.length());
        System.out.println("from     : " + from.toUpperCase());
        System.out.println("to       : " + to.toUpperCase());
        System.out.println("weight   : "
                + parts[1].replace("kg", " kg"));
        System.out.println("fragile  : "
                + parts[2].equalsIgnoreCase("fragile"));
        System.out.println("1st char : " + clean.charAt(0));
        System.out.println("has mum  : " + to.contains("mum"));
        System.out.println("ends kg  : " + parts[1].endsWith("kg"));
    }
}
```

**Output:**

```text
length   : 25
from     : PUNE
to       : MUMBAI
weight   : 2.5 kg
fragile  : true
1st char : p
has mum  : true
ends kg  : true
```

`trim` removed the outer spaces, `split` cut the label at each pipe, and `indexOf` with `substring` pulled the two cities apart. Note the double backslash: `split` takes a regular expression, and a plain pipe means "or" there.

### Why joining in a loop is slow

```java
public class ManifestBuilder {
    public static void main(String[] args) {
        int parcels = 200;

        String slow = "";
        long copied = 0;
        for (int i = 1; i <= parcels; i++) {
            slow += "P" + i + ";";
            copied += slow.length();
        }

        StringBuilder fast = new StringBuilder();
        for (int i = 1; i <= parcels; i++) {
            fast.append('P').append(i).append(';');
        }
        String result = fast.toString();

        System.out.println("length     : " + result.length());
        System.out.println("same text  : " + slow.equals(result));
        System.out.println("chars copied by +=");
        System.out.println("  " + copied);
        System.out.println("starts with: "
                + result.substring(0, 12));
    }
}
```

**Output:**

```text
length     : 892
same text  : true
chars copied by +=
  83787
starts with: P1;P2;P3;P4;
```

Both loops build the same 892-character manifest. But each `+=` builds a whole new string and copies every old character into it, so the first loop copied almost 84,000 characters. `StringBuilder` keeps one growable buffer and only adds the new characters.

## String vs StringBuilder vs StringBuffer

| Feature | String | StringBuilder | StringBuffer |
|---|---|---|---|
| Can change? | No | Yes | Yes |
| Thread safe? | Yes, by immutability | No | Yes, synchronized |
| Speed for many edits | Slow | Fastest | A little slower |
| Pool support | Yes | No | No |
| Added in | Java 1.0 | Java 5 | Java 1.0 |
| Best for | Fixed text, keys | Building text in one thread | Shared buffer across threads |

In everyday code, use `String` for values and `StringBuilder` when you build text in a loop. `StringBuffer` is rarely needed today.

## Common Mistakes

> **Warning:** Never compare strings with `==`. It checks whether two variables point to the same object, not whether the text is the same. Strings read from a user, a file or a network are new objects, so `==` returns false even for identical text. Use `equals()` or `equalsIgnoreCase()`.

- **Ignoring the return value.** Writing `name.trim();` on its own does nothing useful. The trimmed copy is thrown away. Write `name = name.trim();`.
- **Calling methods on null.** `input.equals("yes")` crashes when `input` is null. Put the literal first: `"yes".equals(input)`.
- **Joining with `+` inside big loops.** Every pass copies the whole string again. Switch to `StringBuilder`.
- **Forgetting that `split` uses regex.** Characters like `|`, `.` and `*` have special meaning and must be escaped with `\\`.
- **Off-by-one in `substring`.** The end index is excluded, so `substring(0, 3)` returns three characters, positions 0 to 2.

## Interview Questions

**Why are strings immutable in Java?**
Immutability lets the JVM share one pooled object among many variables safely. It also keeps strings thread safe and lets them cache their hash code, which makes them reliable `HashMap` keys and protects values such as file paths from being changed after a security check.

**What is the difference between `==` and `equals()` for strings?**
`==` compares references, so it is true only when both variables point to the same object. `equals()` compares the characters, so it is true whenever the text matches. For content checks always use `equals()`.

**How many objects does `new String("hi")` create?**
Up to two. If the literal "hi" is not already in the pool, one object is placed there when the class loads, and `new` always creates a second object on the normal heap.

**What does `intern()` do?**
It returns the pooled copy of a string. If the pool already has an equal string, you get that object; otherwise the string is added to the pool first. After interning, `==` works for equal text.

**When should you choose `StringBuilder` over `String`?**
Choose it when you change or build text many times, especially in loops. It edits one internal buffer instead of creating a new object on every change, then `toString()` gives you the final `String`.

## Summary

- A `String` is an object holding a fixed sequence of characters, and it can never be changed.
- Methods like `toUpperCase` and `trim` return new strings, so always store the result.
- Literals live in the String pool and are shared; `new String` makes a separate heap object.
- Use `equals()` to compare text; `==` only compares references.
- `+=` in a loop copies the whole string each time, so use `StringBuilder` for heavy building.
- `StringBuffer` is the synchronized cousin of `StringBuilder` and is seldom needed now.

## Related Topics

- [String Methods](/learning/java-tutorial/string-methods): a closer look at every everyday method used above.
- [String Pool](/learning/java-tutorial/string-pool): more detail on how the JVM stores and reuses literals.
- [StringBuilder](/learning/java-tutorial/stringbuilder): the fast, changeable way to build text.
- [StringBuffer](/learning/java-tutorial/stringbuffer): the thread-safe builder and when it still matters.
