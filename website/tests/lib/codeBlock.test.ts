import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CodeBlock } from "@/components/learning/CodeBlock";

// CodeBlock calls useRouter() for its "open in compiler" action.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const render = (code: string, lang: string) => renderToStaticMarkup(createElement(CodeBlock, { code, lang }));
const RUN = 'aria-label="Run this code in the CampusEduX compiler"';
const OPEN = 'aria-label="Open this code in the CampusEduX compiler"';
const COPY = 'aria-label="Copy code"';

const PLAIN_JAVA = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hi");
    }
}`;

const SPRING_JAVA = `package com.example.shop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShopApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}`;

describe("CodeBlock Run / Compiler buttons", () => {
  it("shows Run and Compiler for plain runnable Java", () => {
    const html = render(PLAIN_JAVA, "java");
    expect(html).toContain(RUN);
    expect(html).toContain(OPEN);
    expect(html).toContain(COPY);
  });

  it("hides Run and Compiler when the code imports org.springframework, but keeps Copy", () => {
    const html = render(SPRING_JAVA, "java");
    expect(html).not.toContain(RUN);
    expect(html).not.toContain(OPEN);
    expect(html).toContain(COPY);
  });

  it("only reacts to a real import line, not a mention in a comment or string", () => {
    const html = render(`// uses org.springframework later\n${PLAIN_JAVA.replace('"Hi"', '"import org.springframework.x"')}`, "java");
    expect(html).toContain(RUN);
  });

  it.each([
    ["jakarta", "import jakarta.persistence.Entity;\n@Entity class Book {}"],
    ["JUnit", "import org.junit.jupiter.api.Test;\nclass T { @Test void t() {} }"],
    ["Mockito", "import static org.mockito.Mockito.mock;\nclass T {}"],
    ["Hibernate", "import org.hibernate.Session;\nclass A { Session s; }"],
    ["a framework annotation with no imports", "@RestController\npublic class Api {}"],
  ])("hides Run and Compiler for %s code", (_, code) => {
    const html = render(code, "java");
    expect(html).not.toContain(RUN);
    expect(html).not.toContain(OPEN);
    expect(html).toContain(COPY);
  });

  it("keeps Run for JDK-only Java with java.* imports and a package line", () => {
    expect(render("package com.example.demo;\n\nimport java.util.Scanner;\n\npublic class Main { Scanner s; }", "java")).toContain(RUN);
  });

  it("still hides the buttons for non-runnable fences", () => {
    const html = render("server.port=8081", "properties");
    expect(html).not.toContain(RUN);
    expect(html).toContain(COPY);
  });
});
