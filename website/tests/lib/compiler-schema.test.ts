import { describe, it, expect } from "vitest";
import { runRequestSchema } from "@/lib/compiler/schema";
import { MAX_CODE_BYTES, MAX_STDIN_BYTES } from "@/lib/compiler/limits";

describe("runRequestSchema", () => {
  it("accepts a valid payload and defaults stdin to ''", () => {
    const parsed = runRequestSchema.safeParse({ language: "java", source: "class Main {}" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.stdin).toBe("");
  });

  it("normalises the language and keeps aliases (validation only, not resolution)", () => {
    expect(runRequestSchema.safeParse({ language: "  py  ", source: "print(1)" }).success).toBe(true);
  });

  it("rejects an unknown language", () => {
    const r = runRequestSchema.safeParse({ language: "ruby", source: "puts 1" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toMatch(/supported/i);
  });

  it("rejects empty source", () => {
    expect(runRequestSchema.safeParse({ language: "java", source: "" }).success).toBe(false);
  });

  it("rejects source over the byte limit", () => {
    const r = runRequestSchema.safeParse({ language: "python", source: "a".repeat(MAX_CODE_BYTES + 1) });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toMatch(/too long/i);
  });

  it("accepts source exactly at the byte limit", () => {
    expect(runRequestSchema.safeParse({ language: "python", source: "a".repeat(MAX_CODE_BYTES) }).success).toBe(true);
  });

  it("rejects stdin over the byte limit", () => {
    const r = runRequestSchema.safeParse({
      language: "c",
      source: "int main(){}",
      stdin: "x".repeat(MAX_STDIN_BYTES + 1),
    });
    expect(r.success).toBe(false);
  });
});
