import { canRunInCompiler, usesOnlyJdk } from "@/lib/compilerLink";

// Mirrors website/tests/lib/runGuard.test.ts — keep both lists identical.
const RUNS: [string, string][] = [
  ["no imports, JDK only", 'public class Main {\n  public static void main(String[] a) { System.out.println("Hi"); }\n}'],
  ["java.* and static java.* imports", "import java.util.List;\nimport java.util.*;\nimport static java.lang.Math.max;\nclass A { int m = max(1, 2); List<String> l; }"],
  ["own package declaration + java import", "package com.example.demo;\n\nimport java.util.Scanner;\n\npublic class Main { Scanner s; }"],
  ["JDK annotations only", "interface Op { int ap(int x); }\n@FunctionalInterface interface F { void f(); }\nclass A implements Op { @Override public int ap(int x) { return x; } @SuppressWarnings(\"unused\") int y; }"],
  ["third-party names only in comments and strings", '// uses org.springframework later\n/** @param x the value */\nclass A { String s = "import jakarta.persistence.Entity; @Entity org.junit.x"; }'],
  ["java.util fully-qualified use", "class A { java.util.List<String> xs = new java.util.ArrayList<>(); }"],
  ["java.net.http import and use", "import java.net.http.HttpClient;\nimport java.net.http.*;\nclass A { java.net.http.HttpClient c = HttpClient.newHttpClient(); }"],
  ["static wildcard java import", "import static java.lang.Math.*;\nclass A { double r = sqrt(4); }"],
  ["custom annotation with JDK meta-annotations", "import java.lang.annotation.*;\n@Retention(RetentionPolicy.RUNTIME)\n@Target(ElementType.METHOD)\n@interface Audit {}\nclass A { @Audit void m() {} }"],
  ["fully-qualified JDK annotation", "class A { @java.lang.Override public String toString() { return \"a\"; } }"],
  ["quote char literal next to a string holding @", "class A { char q = '\"'; String s = \"@x\"; }"],
  ["text block holding framework words", 'class A { String t = """\n  @Entity import org.x.Y; com.shop.Z\n  """; }'],
];
const HIDDEN: [string, string][] = [
  ["Spring import", "import org.springframework.boot.SpringApplication;\nclass A {}"],
  ["static Spring import only", "import static org.springframework.util.Assert.notNull;\nclass A {}"],
  ["Jakarta", "import jakarta.persistence.Entity;\n@Entity class Book {}"],
  ["JUnit", "import org.junit.jupiter.api.Test;\nclass T { @Test void t() {} }"],
  ["Mockito", "import static org.mockito.Mockito.mock;\nclass T {}"],
  ["Hibernate", "import org.hibernate.Session;\nclass A { Session s; }"],
  ["Lombok", "import lombok.Data;\n@Data class A {}"],
  ["Jackson 3", "import tools.jackson.databind.ObjectMapper;\nclass A {}"],
  ["javax (not java.)", "import javax.swing.JFrame;\nclass A {}"],
  ["java import mixed with a third-party import", "import java.util.List;\nimport com.shop.Cart;\nclass A {}"],
  ["framework annotation without imports", "@Service\npublic class OrderService {}"],
  ["fully-qualified framework call without imports", "class A { void m() { org.springframework.boot.SpringApplication.run(A.class); } }"],
  ["string holding /* before a framework annotation", 'class A { String g = "/*"; @Autowired Object o; String h = "*/"; }'],
  ["annotation written with a space", "class A { @ Autowired Object o; }"],
  ["fully-qualified Jackson 3 without import", "class A { tools.jackson.databind.json.JsonMapper m; }"],
  ["second import on the same line", "import java.util.List; import org.Foo;\nclass A {}"],
];

describe("usesOnlyJdk", () => {
  it.each(RUNS)("true: %s", (_, code) => expect(usesOnlyJdk(code)).toBe(true));
  it.each(HIDDEN)("false: %s", (_, code) => expect(usesOnlyJdk(code)).toBe(false));
});

describe("canRunInCompiler", () => {
  it("applies the JDK-only rule to Java only", () => {
    expect(canRunInCompiler("java", RUNS[0][1])).toBe(true);
    expect(canRunInCompiler("java", HIDDEN[0][1])).toBe(false);
    expect(canRunInCompiler("python", "import numpy as np\nprint(np.pi)")).toBe(true);
    expect(canRunInCompiler("js", "console.log(1)")).toBe(true);
  });
  it("is false for languages the compiler cannot run", () => {
    expect(canRunInCompiler("properties", "server.port=8081")).toBe(false);
    expect(canRunInCompiler("xml", "<project/>")).toBe(false);
    expect(canRunInCompiler("", "x")).toBe(false);
  });
});
