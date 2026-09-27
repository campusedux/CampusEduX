import React from "react";
import TestRenderer, { act } from "react-test-renderer";

jest.mock("@/theme/fonts", () => ({ useLearningFonts: () => true }));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn().mockResolvedValue(true) }));

import { CodeBlock } from "@/components/learning/reader/CodeBlock";
import { MarkdownText } from "@/components/learning/MarkdownText";
import { AnchorRegistry, ReaderCtx } from "@/components/learning/reader/readerContext";
import { COURSE_ACCENTS, accentTokens } from "@/theme/courseAccents";

// Run is enabled for the reader here, so only the code itself decides.
const ctx = { accent: accentTokens(COURSE_ACCENTS.java, "light"), anchors: new AnchorRegistry(), enableRun: true };
const RUN = "Run this code on the CampusEduX website compiler";

const mounted: TestRenderer.ReactTestRenderer[] = [];
const render = (code: string, lang: string) => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      <ReaderCtx.Provider value={ctx}>
        <CodeBlock code={code} lang={lang} />
      </ReaderCtx.Provider>,
    );
  });
  mounted.push(r);
  return r;
};
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach((r) => r.unmount());
  });
});
const hasRun = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.props.accessibilityLabel === RUN).length > 0;
const hasCopy = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.props.accessibilityLabel === "Copy code").length > 0;

const PLAIN_JAVA = 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hi");\n    }\n}';
const SPRING_JAVA = [
  "package com.example.shop;",
  "",
  "import org.springframework.boot.SpringApplication;",
  "import org.springframework.boot.autoconfigure.SpringBootApplication;",
  "",
  "@SpringBootApplication",
  "public class ShopApplication {",
  "    public static void main(String[] args) {",
  "        SpringApplication.run(ShopApplication.class, args);",
  "    }",
  "}",
].join("\n");

it("shows 'Run on CampusEduX Compiler' for plain runnable Java", () => {
  const r = render(PLAIN_JAVA, "java");
  expect(hasRun(r)).toBe(true);
  expect(hasCopy(r)).toBe(true);
});

it("hides Run when the code imports org.springframework, but keeps Copy", () => {
  const r = render(SPRING_JAVA, "java");
  expect(hasRun(r)).toBe(false);
  expect(hasCopy(r)).toBe(true);
});

it("only reacts to a real import line, not a mention in a comment or string", () => {
  const code = `// uses org.springframework later\n${PLAIN_JAVA.replace('"Hi"', '"import org.springframework.x"')}`;
  expect(hasRun(render(code, "java"))).toBe(true);
});

it("still hides Run for languages the compiler can't run", () => {
  expect(hasRun(render("server.port=8081", "properties"))).toBe(false);
});

it.each([
  ["jakarta", "import jakarta.persistence.Entity;\n@Entity class Book {}"],
  ["JUnit", "import org.junit.jupiter.api.Test;\nclass T { @Test void t() {} }"],
  ["Mockito", "import static org.mockito.Mockito.mock;\nclass T {}"],
  ["Hibernate", "import org.hibernate.Session;\nclass A { Session s; }"],
  ["a framework annotation with no imports", "@RestController\npublic class Api {}"],
])("hides Run for %s code", (_, code) => {
  const r = render(code, "java");
  expect(hasRun(r)).toBe(false);
  expect(hasCopy(r)).toBe(true);
});

it("keeps Run for JDK-only Java with java.* imports and a package line", () => {
  expect(hasRun(render("package com.example.demo;\n\nimport java.util.Scanner;\n\npublic class Main { Scanner s; }", "java"))).toBe(true);
});

describe("MarkdownText (interview answers, problem statements) uses the same rule", () => {
  const mdRun = (source: string) => {
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<MarkdownText source={source} enableRunOnWeb />);
    });
    mounted.push(r);
    return r.root.findAll((n) => n.props.accessibilityLabel === RUN).length > 0;
  };
  it("shows Run for JDK-only Java", () => {
    expect(mdRun("```java\n" + PLAIN_JAVA + "\n```")).toBe(true);
  });
  it("hides Run for a Spring annotation example", () => {
    expect(mdRun("```java\n@Service\npublic class OrderService {}\n```")).toBe(false);
  });
});
