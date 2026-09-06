import { describe, it, expect } from "vitest";
import { normalizeSource } from "@/lib/compiler/normalize";

describe("normalizeSource — Java public class rename", () => {
  it("renames a public class declaration to Main", () => {
    const src = `public class HelloWorld {\n  public static void main(String[] a){ System.out.println("hi"); }\n}`;
    const out = normalizeSource("java", src);
    expect(out).toContain("public class Main {");
    expect(out).not.toContain("HelloWorld");
  });

  it("renames references, constructors and `new` sites too", () => {
    const src = `public class Widget {\n  Widget() {}\n  public static void main(String[] a){ Widget w = new Widget(); }\n}`;
    const out = normalizeSource("java", src);
    expect(out).toContain("class Main");
    expect(out).toContain("Main() {}");
    expect(out).toContain("new Main()");
  });

  it("leaves an already-Main program untouched", () => {
    const src = `public class Main { public static void main(String[] a){} }`;
    expect(normalizeSource("java", src)).toBe(src);
  });

  it("does not rewrite the name inside strings or comments", () => {
    const src = [
      "public class Demo {",
      '  // Demo stays here',
      '  String s = "Demo also stays";',
      "  public static void main(String[] a){ new Demo(); }",
      "}",
    ].join("\n");
    const out = normalizeSource("java", src);
    expect(out).toContain("// Demo stays here");
    expect(out).toContain('"Demo also stays"');
    expect(out).toContain("class Main {");
    expect(out).toContain("new Main()");
  });

  it("handles a public interface / enum / record", () => {
    expect(normalizeSource("java", "public interface Greeter {}")).toContain("interface Main {}");
    expect(normalizeSource("java", "public enum Color { RED }")).toContain("enum Main { RED }");
    expect(normalizeSource("java", "public final class Foo {}")).toContain("class Main {}");
  });

  it("is a no-op for non-Java languages", () => {
    const py = `class HelloWorld:\n    pass`;
    expect(normalizeSource("python", py)).toBe(py);
    expect(normalizeSource("cpp", "class HelloWorld {};")).toBe("class HelloWorld {};");
  });

  it("leaves Java without a public type alone", () => {
    const src = `class Helper {}\nclass Main { public static void main(String[] a){} }`;
    expect(normalizeSource("java", src)).toBe(src);
  });
});
