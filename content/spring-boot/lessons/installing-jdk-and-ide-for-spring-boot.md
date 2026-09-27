Before a carpenter builds a single chair, they set up a workbench and lay out their tools. If the saw is blunt or the bench wobbles, every job after that goes badly. Your Spring Boot workbench has two parts: the JDK, which compiles and runs Java, and an IDE, the editor where you write and run your code. Set them up properly once and you will not think about them again.

This guide walks you through installing Java 21, pointing your computer at it, checking that everything works, and choosing an editor. You do not need to install Maven separately; you will see why near the end.

## What is a JDK, and which one do you need?

> **Definition:** The JDK (Java Development Kit) is the package that lets you build Java programs. It contains the compiler (`javac`), the runtime that runs your code (`java`, the JVM), and the standard libraries.

You may also hear about the JRE and the JVM. Here is how they fit inside each other:

| Name | What it is | Do you need it? |
|---|---|---|
| JVM | The engine that runs compiled Java code | Yes, it is inside the JDK |
| JRE | The JVM plus the standard libraries, enough to run apps | Comes with the JDK |
| JDK | The JRE plus the compiler and developer tools | Yes, install this |

Spring Boot 4 needs **Java 17 or newer**. This course uses **Java 21**, a long-term support (LTS) release, which means it gets security fixes for years. Newer versions such as Java 25 also work fine.

Several companies build free JDKs from the same OpenJDK source code. Eclipse Temurin, Amazon Corretto, Microsoft Build of OpenJDK and Oracle's OpenJDK builds all behave the same for learning. If you are unsure, pick Eclipse Temurin 21 from adoptium.net.

## Why do you need both a JDK and an IDE?

The JDK does the real work: it turns your `.java` files into bytecode and runs them. You could write code in Notepad and build it from the terminal, but an IDE (Integrated Development Environment) makes daily work much faster:

- It highlights mistakes as you type, before you even run the code.
- It completes class names, methods and imports for you.
- It understands Maven, so it downloads libraries and shows your project structure.
- It runs and debugs your Spring Boot app with one click, and lets you pause code to inspect values.

In short, the JDK is the engine and the IDE is the dashboard that makes the engine easy to drive.

## How it works

Here is the full setup journey. Each step depends on the one before it.

```text
Download JDK 21 installer
        |
        v
Install it
        |
        v
Set JAVA_HOME and PATH
        |
        v
Check: java -version
        |
        v
Install an IDE
        |
        v
Open a Spring Boot project
        |
        v
Run it with the IDE or mvnw
```

The middle step is the one people skip. `JAVA_HOME` tells tools like Maven and your IDE where Java lives, and `PATH` lets you type `java` in any terminal. If the check step fails, go back one step, not forward.

## Installing the JDK

### Windows

1. Download the Temurin 21 `.msi` installer for Windows x64 from adoptium.net.
2. Run it. On the feature screen, switch on "Set JAVA_HOME variable" and "Add to PATH" if they are offered.
3. Close every open terminal and open a new one, so it picks up the new settings.

If the installer did not set them, open **Edit the system environment variables**, click **Environment Variables**, add a system variable `JAVA_HOME` pointing to the JDK folder (for example `C:\Program Files\Eclipse Adoptium\jdk-21...`), then add `%JAVA_HOME%\bin` to `Path`.

### macOS

Download the `.pkg` installer for your chip (Apple silicon or Intel) and run it, or use Homebrew with `brew install --cask temurin@21`. Then add this line to `~/.zshrc` and open a new terminal:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

### Linux (Ubuntu)

```bash
sudo apt update
sudo apt install openjdk-21-jdk
```

Most Linux tools find Java through `PATH` automatically. Set `JAVA_HOME` in `~/.bashrc` if a tool asks for it.

## Code Example

First check the two commands every Java developer knows:

```bash
java -version
javac -version
```

The first line of `java -version` should mention version 21, for example `openjdk version "21.0.12.1"`, and `javac -version` should print something like `javac 21.0.12.1`. Your exact numbers and vendor name will differ, and that is fine.

Now let's write a tiny program that checks your setup from inside Java. Save it as `JavaCheck.java` anywhere on your computer.

```java
public class JavaCheck {
    public static void main(String[] args) {
        String version = System.getProperty("java.version");
        int major = Runtime.version().feature();

        System.out.println("Java version: " + version);
        if (major >= 17) {
            System.out.println("Ready for Spring Boot 4");
        } else {
            System.out.println("Too old: install Java 17+");
        }
    }
}
```

Run it straight from the source file. Since Java 11 you can skip the separate `javac` step for a single file:

```bash
java JavaCheck.java
```

**Output:**

```text
Java version: 21.0.12.1
Ready for Spring Boot 4
```

`Runtime.version().feature()` returns the main version number, 21 here, so the program can compare it with 17, the minimum Spring Boot 4 needs.

## Choosing an IDE

| IDE | Why students like it | What to add |
|---|---|---|
| IntelliJ IDEA | Very strong Java support, detects Maven projects instantly | Nothing for basic use |
| VS Code | Light and fast, great if you already use it | Extension Pack for Java and Spring Boot Extension Pack |
| Eclipse | Free and long-standing | Spring Tools, available for Eclipse |

Any of them works for this course. Pick one and stay with it for a while; switching editors every week slows you down more than any feature helps.

## You Do Not Need to Install Maven

Every project made with Spring Initializr includes the Maven Wrapper: the `mvnw` script (and `mvnw.cmd` on Windows). The first time you run it, it downloads the right Maven version into your home folder. So inside a project you type `./mvnw spring-boot:run` on macOS and Linux, or `mvnw.cmd spring-boot:run` on Windows, and it just works. Installing Maven yourself is optional.

## Common Mistakes

> **Warning:** `JAVA_HOME` must point to the JDK folder itself, not to its `bin` folder. `C:\...\jdk-21` is right; `C:\...\jdk-21\bin` breaks Maven and the wrapper.

- **An old Java wins.** If `java -version` shows 1.8 or 11, an older Java is earlier in your `PATH`. Move the Java 21 entry up, or remove the old one.
- **Using an old terminal.** Environment changes only reach terminals opened after the change. Close and reopen it.
- **Installing only a JRE.** Without the JDK there is no `javac`, so builds fail with "No compiler is provided".

## Interview Questions

**What is the difference between the JDK, JRE and JVM?**
The JVM runs bytecode, the JRE adds the standard libraries needed to run apps, and the JDK adds the compiler and tools needed to build them.

**Why do we set JAVA_HOME?**
Build tools and IDEs read `JAVA_HOME` to find which Java installation to use, especially when several versions are installed.

**What is the Maven Wrapper?**
A small script shipped with the project that downloads and runs a fixed Maven version, so every developer builds with the same Maven without installing it.

## Key Points to Remember

- Install a JDK, not just a JRE; Spring Boot 4 needs Java 17 or newer, and this course uses Java 21.
- Set `JAVA_HOME` to the JDK folder and put its `bin` folder on `PATH`.
- Check your setup with `java -version` and `javac -version` in a new terminal.
- IntelliJ IDEA, VS Code and Eclipse all work well for Spring Boot.
- The Maven Wrapper (`mvnw`) means you do not have to install Maven yourself.

## Frequently Asked Questions

### Which Java version is best for Spring Boot?

Use a long-term support version: Java 21 is a safe choice for this course, and Java 25 also works. Spring Boot 4 will not run on anything older than Java 17.

### Is OpenJDK free for commercial use?

Yes. OpenJDK builds such as Eclipse Temurin, Amazon Corretto and Microsoft Build of OpenJDK are free to use at work and at home.

### Can I have more than one Java version installed?

Yes. Many developers keep two or three. `JAVA_HOME` and `PATH` decide which one your terminal and tools use.

### Do I need an internet connection to build Spring Boot apps?

The first build downloads Maven and the libraries your project uses. After that, they are cached on your computer, so later builds work offline unless you add new libraries.

## Related Topics

- [Creating a Project with Spring Initializr](/learning/spring-boot-tutorial/creating-a-project-with-spring-initializr): generate your first project now that Java is ready.
- [Running a Spring Boot Application](/learning/spring-boot-tutorial/running-a-spring-boot-application): every way to start your app.
- [Maven pom.xml Explained](/learning/spring-boot-tutorial/maven-pom-xml-explained): what Maven does with your project file.
