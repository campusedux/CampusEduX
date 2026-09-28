Type a text message on your phone and watch what happens. You write "Running late", go back and add "sorry, " at the start, delete a word, fix a typo in the middle and finally hit send. The phone does not throw the draft away and start a new one after every key press. It keeps one draft and edits it in place. When your Java program builds text piece by piece, it needs the same kind of editable draft, and that is `StringBuilder`.

A plain `String` cannot change, so every edit on it creates a new object. That is fine for a few joins, but costly in a loop. Here you will see what `StringBuilder` is, how its internal buffer grows, which methods you will use most, why it beats `+=` inside loops, and how it compares with `String` and `StringBuffer`.

## What is StringBuilder?

> **Definition:** `StringBuilder` is a class in `java.lang` that holds a mutable sequence of characters. Methods such as `append`, `insert` and `delete` change the same object instead of creating a new one, and `toString()` gives you the finished `String`.

A few facts to remember:

- It was added in Java 5 as a faster, unsynchronized version of `StringBuffer`.
- It is not thread-safe. One builder should be used by one thread at a time.
- Most editing methods return the same builder, so calls can be chained.
- It does not override `equals()`, so two builders with the same text are not "equal".
- It lives in `java.lang`, so no import is needed.

## Why is StringBuilder used?

Suppose an SMS gateway builds a report line for each of 5,000 messages and joins them into one summary. With `String` and `+=`, each pass creates a brand new string and copies every character built so far into it. The work grows with the square of the length, and thousands of short-lived objects keep the garbage collector busy.

`StringBuilder` keeps one internal array of characters with spare room at the end. An `append` just writes the new characters into that spare room. Only when the room runs out does it allocate a bigger array and copy once. So building long text becomes close to linear work.

It is also simply handy. Inserting in the middle, deleting a range, replacing one character or reversing the whole text are one-line calls on a builder, but awkward with an immutable `String`.

## Real-Life Example

Think of a draft message in your phone's SMS app. The draft box has a fixed amount of screen space. As you type, letters go into the free space at the end. You can move the cursor and insert a word, erase a few letters, or correct one character. It is still the same draft the whole time.

If you type past the space the box has, the app quietly gives the draft a larger box and moves your text across. When you press send, the phone takes a final copy of the draft and sends that copy. Map it back: the draft is the `StringBuilder`, the box is its capacity, the larger box is the growth step, and pressing send is `toString()`.

## Syntax

```java
StringBuilder sb = new StringBuilder();       // capacity 16
StringBuilder s2 = new StringBuilder("Hi");   // 16 + 2 = 18
StringBuilder s3 = new StringBuilder(200);    // capacity 200

sb.append("text").append(42);   // add at the end
sb.insert(0, "Dear ");          // add at an index
sb.delete(0, 5);                // remove [start, end)
sb.setCharAt(0, 'T');           // change one char
sb.reverse();                   // reverse in place
String done = sb.toString();    // final String
```

- The no-argument constructor makes an empty builder with room for 16 characters.
- Passing a `String` gives room for its length plus 16.
- Passing an `int` sets the starting capacity yourself, which helps when you know the final size.
- `append` accepts almost any type and returns the same builder, which allows chaining.
- `insert` and `delete` use zero-based indexes, and the end index of `delete` is excluded.
- `setCharAt` and `reverse` change the builder in place, and `toString()` makes an independent `String`.

## How StringBuilder Works

Inside, a builder keeps an array of characters called the buffer and a count of how many are in use. The array length is the capacity. The count is what `length()` returns. Here is what happens as an empty builder fills up.

```text
new StringBuilder()
[................] cap 16, len 0
        |
        v  17th char arrives
new array: 16 * 2 + 2 = 34
copy 16 chars, then add it
        |
        v  35th char arrives
new array: 34 * 2 + 2 = 70
        |
        v  one append needs more
new array: exactly that size
```

While there is spare room, `append` only writes into the array and moves the count forward. When a write would pass the capacity, the builder allocates a new array of `(old * 2) + 2`, copies the old characters into it once, and continues. If a single append needs even more than that, the new array is exactly as big as required. Because the capacity roughly doubles each time, the total copying stays proportional to the final length.

`toString()` copies the used part of the buffer into a new `String`. Later edits to the builder do not touch strings you already produced.

## Example Programs

### Editing an SMS draft

```java
public class SmsDraft {
    public static void main(String[] args) {
        StringBuilder sms = new StringBuilder("OTP 4821");
        sms.append(" valid ").append(5).append(" min");
        System.out.println("append : " + sms);

        sms.insert(0, "Hi, ");
        System.out.println("insert : " + sms);

        sms.delete(0, 4);
        System.out.println("delete : " + sms);

        for (int i = 4; i <= 6; i++) {
            sms.setCharAt(i, '*');
        }
        System.out.println("mask   : " + sms);

        sms.replace(15, 16, "10");
        System.out.println("replace: " + sms);
        System.out.println("length : " + sms.length());

        String code = new StringBuilder("2468")
                .reverse().toString();
        System.out.println("reverse: " + code);
    }
}
```

**Output:**

```text
append : OTP 4821 valid 5 min
insert : Hi, OTP 4821 valid 5 min
delete : OTP 4821 valid 5 min
mask   : OTP ***1 valid 5 min
replace: OTP ***1 valid 10 min
length : 21
reverse: 8642
```

Every call changed the same `sms` object. The chained `append` calls worked because each one returns the builder itself, and `reverse().toString()` shows the usual way to finish a builder.

### Watching the capacity grow

```java
public class InboxBuffer {
    public static void main(String[] args) {
        StringBuilder inbox = new StringBuilder();
        int cap = inbox.capacity();
        System.out.println("len 0 -> cap " + cap);

        for (int i = 1; i <= 80; i++) {
            inbox.append('x');
            if (inbox.capacity() != cap) {
                cap = inbox.capacity();
                System.out.println("len " + i + " -> cap " + cap);
            }
        }

        StringBuilder greet = new StringBuilder("Hello");
        System.out.println("\"Hello\" starts at cap "
                + greet.capacity());

        StringBuilder big = new StringBuilder();
        big.append("0123456789012345678901234567890123456789");
        System.out.println("40 chars at once: cap "
                + big.capacity());
    }
}
```

**Output:**

```text
len 0 -> cap 16
len 17 -> cap 34
len 35 -> cap 70
len 71 -> cap 142
"Hello" starts at cap 21
40 chars at once: cap 40
```

The capacity jumps at the 17th, 35th and 71st character, following `(old * 2) + 2`. A builder made from "Hello" starts at 5 + 16 = 21. A single 40-character append needs more than 34, so the buffer grows straight to 40.

### Why append beats += in a loop

```java
public class RecipientList {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("A");
        StringBuilder same = sb.append("B");
        System.out.println("append same? " + (sb == same));

        String s = "A";
        String before = s;
        s += "B";
        System.out.println("+= same?     " + (s == before));

        String[] phones = {"98450", "99001", "90088", "97311"};
        StringBuilder to = new StringBuilder();
        for (String p : phones) {
            if (to.length() > 0) {
                to.append(", ");
            }
            to.append(p);
        }
        System.out.println("To: " + to);

        String text = "";
        int newStrings = 0;
        StringBuilder buf = new StringBuilder();
        int grows = 0;
        for (int i = 0; i < 1000; i++) {
            String old = text;
            text += "x";
            if (text != old) newStrings++;
            int capBefore = buf.capacity();
            buf.append('x');
            if (buf.capacity() != capBefore) grows++;
        }
        System.out.println("+= new strings : " + newStrings);
        System.out.println("buffer grows   : " + grows);
    }
}
```

**Output:**

```text
append same? true
+= same?     false
To: 98450, 99001, 90088, 97311
+= new strings : 1000
buffer grows   : 6
```

`append` handed back the very same builder, while `+=` produced a new `String`. Over 1,000 additions, `+=` created 1,000 separate strings, each a full copy of the text so far, whereas the builder grew its buffer only 6 times. The exact speed gap depends on the JVM, so this program counts objects instead of printing timings.

One honest note: a single expression such as `"Dear " + name + ", your code is " + otp` is already compiled efficiently, so you do not need a builder for it. The real win comes when text is built across many loop passes.

## String vs StringBuilder vs StringBuffer

| Feature | String | StringBuilder | StringBuffer |
|---|---|---|---|
| Can change? | No | Yes | Yes |
| Thread safe? | Yes, by immutability | No | Yes, synchronized |
| Speed for many edits | Slow | Fastest | A little slower |
| Pool support | Yes | No | No |
| `equals()` compares text | Yes | No | No |
| Added in | Java 1.0 | Java 5 | Java 1.0 |
| Best for | Fixed text, keys | Building text in one thread | Shared buffer across threads |

Use `String` for values you store, compare and pass around, and `StringBuilder` while you are still building the text. `StringBuffer` is rarely needed in new code.

## Common Mistakes

> **Warning:** Do not compare builders with `equals()`. `StringBuilder` inherits it from `Object`, so it checks whether both variables point to the same object. Convert both with `toString()` and compare the strings with `equals()`, or use `a.compareTo(b) == 0`, available since Java 11.

- **Forgetting `toString()`.** Methods that expect a `String` will not accept a builder, and storing the builder itself keeps the text editable by others.
- **Sharing one builder between threads.** Its methods are not synchronized, so text can be lost or mixed up.
- **Off-by-one in `delete` and `insert`.** The end index of `delete(start, end)` is excluded, and a start or insert position past `length()` throws an index-out-of-bounds exception.
- **Using a builder for one short join.** For a single line of `+`, a plain `String` expression is clearer and just as fast.

## Interview Questions

**What is the difference between String and StringBuilder?**
`String` is immutable, so every change returns a new object. `StringBuilder` is mutable and edits one internal buffer in place, which makes it much cheaper for repeated changes, especially inside loops.

**What is the default capacity of a StringBuilder and how does it grow?**
The default capacity is 16 characters, or the string's length plus 16 when you pass a string. When it fills up, the new capacity is `(old * 2) + 2`, or the exact size needed if one append requires more.

**Why is StringBuilder faster than StringBuffer?**
`StringBuffer` synchronizes its methods so that several threads can share it safely, and that locking has a cost. `StringBuilder` skips the locking, so it is faster when only one thread uses it, which is the common case.

**What is the difference between length() and capacity()?**
`length()` is the number of characters currently stored. `capacity()` is the size of the internal buffer, the number of characters it can hold before it must grow.

**Does StringBuilder override equals()?**
No. It uses the `equals()` from `Object`, which compares references. To compare contents, convert both to strings with `toString()` or use `compareTo`, which `StringBuilder` gained in Java 11.

## Summary

- `StringBuilder` is a mutable sequence of characters in `java.lang`.
- `append`, `insert`, `delete`, `setCharAt` and `reverse` edit the same object.
- Most methods return the builder, so calls can be chained.
- Capacity starts at 16 and grows to `(old * 2) + 2` when needed.
- It beats `+=` when text is built across many loop passes.
- It is not thread-safe; `StringBuffer` is the synchronized alternative.
- Call `toString()` to get the finished `String`, and compare builders by their text.

## Related Topics

- [String](/learning/java-tutorial/string): the immutable class that a builder produces.
- [StringBuffer](/learning/java-tutorial/stringbuffer): the synchronized builder for shared use.
- [String Methods](/learning/java-tutorial/string-methods): the everyday tools for finished strings.
