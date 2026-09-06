import { describe, it, expect } from "vitest";
import { buildCompilerHref, INLINE_CODE_LIMIT } from "@/lib/compiler/handoff";

describe("buildCompilerHref", () => {
  it("inlines small code in the URL and needs no sessionStorage handoff", () => {
    const { href, handoff } = buildCompilerHref({ language: "java", code: 'System.out.println("hi");' });
    expect(handoff).toBeNull();
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("language")).toBe("java");
    expect(params.get("code")).toBe('System.out.println("hi");');
    expect(params.get("from")).toBeNull();
  });

  it("hands large code over via sessionStorage instead of the URL", () => {
    const big = "x".repeat(INLINE_CODE_LIMIT + 1);
    const { href, handoff } = buildCompilerHref({ language: "python", code: big });
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("code")).toBeNull();
    expect(params.get("from")).toBe("handoff");
    expect(handoff).toEqual({ language: "python", code: big });
  });

  it("canonicalises the language and defaults an unknown one", () => {
    expect(buildCompilerHref({ language: "c++", code: "x" }).href).toContain("language=cpp");
    expect(buildCompilerHref({ language: "js", code: "x" }).href).toContain("language=javascript");
    expect(buildCompilerHref({ language: "brainfuck", code: "x" }).href).toContain("language=java");
    expect(buildCompilerHref({ language: null }).href).toContain("language=java");
  });

  it("adds autorun only when asked", () => {
    expect(buildCompilerHref({ language: "java", code: "x", autorun: true }).href).toContain("autorun=1");
    expect(buildCompilerHref({ language: "java", code: "x" }).href).not.toContain("autorun");
  });

  it("omits the code param entirely when there is no code", () => {
    const { href, handoff } = buildCompilerHref({ language: "java" });
    expect(handoff).toBeNull();
    expect(href).toBe("/compiler?language=java");
  });
});
