import { describe, expect, it } from "vitest";
import { z } from "zod";
import { stringRecordSchema, validationError } from "@/lib/validation";

describe("validation compatibility", () => {
  it.each([
    [z.string(), undefined, "Required"],
    [z.string(), 1, "Expected string, received number"],
    [z.object({}), null, "Expected object, received null"],
    [z.string().max(3), "four", "String must contain at most 3 character(s)"],
    [z.string().min(3), "a", "String must contain at least 3 character(s)"],
    [z.array(z.string()).max(1), ["a", "b"], "Array must contain at most 1 element(s)"],
    [z.enum(["summary", "experience"]), "other", "Invalid enum value. Expected 'summary' | 'experience', received 'other'"],
    [z.enum(["summary"]), 3, "Expected 'summary', received number"],
    [z.object({}).strict(), { extra: true }, "Unrecognized key(s) in object: 'extra'"],
    [z.string().regex(/^yes$/), "no", "Invalid"],
    [z.string().max(3, "Keep this message."), "four", "Keep this message."],
  ])("keeps the displayed message for %s", (schema, input, message) => {
    const parsed = schema.safeParse(input, { error: validationError });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0].message).toBe(message);
  });

  it("preserves the historical UUID-like identifier acceptance", () => {
    const schema = z.guid();
    for (const id of ["11111111-1111-1111-1111-111111111111", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "550e8400-e29b-41d4-a716-446655440000"]) expect(schema.safeParse(id).success).toBe(true);
    for (const [input, message] of [["not-an-id", "Invalid uuid"], [undefined, "Required"], [42, "Expected string, received number"]] as const) {
      const parsed = schema.safeParse(input, { error: validationError });
      expect(parsed.success).toBe(false);
      if (!parsed.success) expect(parsed.error.issues[0].message).toBe(message);
    }
  });
});

describe("extensible string sections", () => {
  it("preserves arbitrary section names, empty maps and the existing string bound", () => {
    expect(stringRecordSchema().parse({ custom: "Kept", summary: "Hello" })).toEqual({ custom: "Kept", summary: "Hello" });
    expect(stringRecordSchema().parse({})).toEqual({});
    expect(stringRecordSchema(20_000).safeParse({ custom: "x".repeat(20_000) }).success).toBe(true);
    expect(stringRecordSchema(20_000).safeParse({ custom: "x".repeat(20_001) }).success).toBe(false);
  });

  it("stops at the first invalid value with one issue", () => {
    const values = { invalid: 42, get later(): string { throw new Error("Do not continue invalid record validation"); } };
    const parsed = stringRecordSchema().safeParse(values);
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues).toHaveLength(1);
  });

  it.each([null, [], "text", { summary: {} }, { summary: ["nested"] }])("rejects invalid section data", (input) => {
    expect(stringRecordSchema().safeParse(input).success).toBe(false);
  });
});
